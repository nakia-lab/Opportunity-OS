const views = [...document.querySelectorAll(".view")];
const navButtons = [...document.querySelectorAll("nav button")];
let learnerContext = "";
let lastPlan = null;

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

function showView(id) {
  views.forEach((view) => view.classList.toggle("active", view.id === id));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => showView("onboarding")));
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showView("home")));
document.querySelector("[data-guide-back]")?.addEventListener("click", () => showView(lastPlan ? "roadmap" : "home"));
document.querySelector("[data-skills-back]")?.addEventListener("click", () => showView(lastPlan ? "roadmap" : "home"));
document.querySelector("[data-open-profile]")?.addEventListener("click", () => showView("profile"));

const courses = {
  digital: {
    title: "Digital Confidence",
    icon: "⌁",
    lessons: [
      ["Getting around your computer", "15 min", "Learn the basics of files, folders, and staying organized."],
      ["Email like a pro", "20 min", "Send, reply, organize messages, and recognize common scams."],
      ["Staying safe online", "25 min", "Use stronger passwords and protect your personal information."],
      ["Using cloud storage", "15 min", "Store and find files using common cloud tools."]
    ]
  },
  career: {
    title: "Career Essentials",
    icon: "✓",
    lessons: [
      ["Tell your story", "20 min", "Create a short introduction that highlights your strengths."],
      ["Build your resume", "30 min", "Make a clear one-page resume even without formal experience."],
      ["Interview preparation", "25 min", "Practice common questions and prepare examples."],
      ["Networking basics", "20 min", "Build professional connections online and in your community."]
    ]
  },
  money: {
    title: "Money Basics",
    icon: "$",
    lessons: [
      ["Understanding budgets", "20 min", "Track income and expenses to understand where money goes."],
      ["Building savings", "15 min", "Create a small, realistic savings habit."],
      ["Credit 101", "25 min", "Understand credit scores and responsible credit use."],
      ["Financial goals", "20 min", "Turn short- and long-term goals into simple steps."]
    ]
  }
};

function showLessons(courseId) {
  const course = courses[courseId];
  if (!course) return;
  const grid = document.querySelector("#skills-grid");
  const view = document.querySelector("#lessons-view");
  const content = document.querySelector("#lessons-content");
  content.innerHTML = `
    <p class="eyebrow">${course.icon} ${escapeHtml(course.title)}</p>
    <h2>Learn ${escapeHtml(course.title.toLowerCase())}</h2>
    <div class="course-grid">${course.lessons.map(([title, duration, description]) => `
      <article class="course">
        <span>${escapeHtml(duration)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        <button class="course-btn" type="button" data-demo-action>Start lesson →</button>
      </article>`).join("")}
    </div>`;
  grid.style.display = "none";
  view.style.display = "block";
}

document.querySelectorAll(".course").forEach((card) => card.addEventListener("click", (event) => {
  if (event.target.closest(".course-btn")) showLessons(card.dataset.course);
}));
document.querySelector("[data-lessons-back]")?.addEventListener("click", () => {
  document.querySelector("#lessons-view").style.display = "none";
  document.querySelector("#skills-grid").style.display = "grid";
});

function notice(message) {
  document.querySelector("#app-notice")?.remove();
  const element = document.createElement("div");
  element.id = "app-notice";
  element.setAttribute("role", "status");
  element.textContent = message;
  Object.assign(element.style, {
    position: "fixed", right: "24px", bottom: "24px", maxWidth: "340px", padding: "12px 16px",
    background: "#fff8e1", border: "1px solid #d9a500", borderRadius: "8px", zIndex: "9999",
    boxShadow: "0 6px 18px rgba(0,0,0,.12)"
  });
  document.body.append(element);
  setTimeout(() => element.remove(), 4500);
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function renderRoadmap(plan) {
  lastPlan = plan;
  document.querySelector("#north-star").textContent = plan.northStar;
  document.querySelector("#momentum").textContent = plan.momentum;
  document.querySelector("#coach-note").textContent = plan.coachNote;
  document.querySelector("#welcome").textContent = plan.welcome;
  document.querySelector("#steps-list").innerHTML = plan.nextSteps.map((step, index) => `
    <article class="step">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div><p class="step-area">${escapeHtml(step.area)} · ${escapeHtml(step.time)}</p><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.detail)}</p></div>
      <button class="check" type="button" aria-label="Mark ${escapeHtml(step.title)} complete">✓</button>
    </article>`).join("");
  document.querySelector("#opportunities-list").innerHTML = plan.opportunities.map((item, index) => `
    <article class="opp"><span>${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><b>${escapeHtml(item.organization)}</b><p>${escapeHtml(item.why)}</p>
    <button class="opp-btn" type="button" data-opportunity="${index}">Explore this path →</button></article>`).join("");
}

document.querySelector("#roadmap-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector("button[type=submit]");
  const values = Object.fromEntries(new FormData(form));
  learnerContext = `Goal: ${values.goal}. Current situation: ${values.current}. Interests: ${values.interests}. Time: ${values.time}.`;
  submit.disabled = true;
  submit.innerHTML = "Creating your roadmap <b>…</b>";
  try {
    const plan = await request("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    renderRoadmap(plan);
    showView("roadmap");
  } catch (error) {
    notice(error.message);
  } finally {
    submit.disabled = false;
    submit.innerHTML = "Create my roadmap <b>→</b>";
  }
});

document.addEventListener("click", (event) => {
  const check = event.target.closest(".check");
  if (check) check.closest(".step").classList.toggle("complete");

  const opportunity = event.target.closest(".opp-btn");
  if (opportunity && lastPlan) {
    const item = lastPlan.opportunities[Number(opportunity.dataset.opportunity)];
    showView("opportunities");
    document.querySelector("#finder-query").value = item.title;
    runFinder(item.title);
  }

  if (event.target.closest("[data-demo-action], .open-result, .more-info")) {
    notice("This interactive lesson or external listing is represented as a prototype in the Build Week demo.");
  }
});

function runFinder(query) {
  const cleanQuery = String(query || "").trim() || "beginner career pathway";
  const results = [
    ["Learning pathway", `${cleanQuery} certificate or short course`, "Community college or trusted online provider"],
    ["Local support", `${cleanQuery} workforce training`, "Local workforce development organization"],
    ["Experience", `${cleanQuery} volunteer or entry-level project`, "Community organization or small business"]
  ];
  document.querySelector("#finder-demo-results").innerHTML = results.map(([type, title, organization]) => `
    <article class="opp"><span>${escapeHtml(type)}</span><h3>${escapeHtml(title)}</h3><b>${escapeHtml(organization)}</b>
    <p>Verify eligibility, cost, dates, and application details with the official source.</p><button class="open-result" type="button">Open prototype →</button></article>`).join("");
}

document.querySelector("#finder-run")?.addEventListener("click", () => runFinder(document.querySelector("#finder-query").value));
document.querySelectorAll(".quick-example").forEach((button) => button.addEventListener("click", () => runFinder(button.dataset.q)));

document.querySelector("#guide-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#question");
  const question = input.value.trim();
  if (!question) return;
  const thread = document.querySelector("#guide-thread");
  thread.insertAdjacentHTML("beforeend", `<div class="message user">${escapeHtml(question)}</div>`);
  input.value = "";
  const pending = document.createElement("div");
  pending.className = "message assistant pending";
  pending.textContent = "Thinking through that with you…";
  thread.append(pending);
  try {
    const reply = await request("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: learnerContext }) });
    pending.outerHTML = `<div class="message assistant"><p>${escapeHtml(reply.answer)}</p><b>Next small step: ${escapeHtml(reply.action)}</b></div>`;
  } catch (error) {
    pending.textContent = error.message;
    pending.classList.add("error");
  }
  thread.scrollTop = thread.scrollHeight;
});

const allowedSocialHosts = {
  linkedin: ["linkedin.com", "www.linkedin.com"],
  github: ["github.com", "www.github.com"],
  instagram: ["instagram.com", "www.instagram.com"]
};

function validSocialUrl(value, service) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedSocialHosts[service].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function renderProfile(profile = {}) {
  const links = profile.socialLinks || {};
  document.querySelector("#linkedin").value = links.linkedin || "";
  document.querySelector("#github").value = links.github || "";
  document.querySelector("#instagram").value = links.instagram || "";
  document.querySelector("#user-links").innerHTML = Object.entries(links).filter(([, value]) => value).map(([service, value]) =>
    `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer" class="social-link">${escapeHtml(service[0].toUpperCase() + service.slice(1))}</a>`
  ).join(" ");
}

request("/api/profile").then(renderProfile).catch(() => {});
document.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const socialLinks = {
    linkedin: document.querySelector("#linkedin").value.trim(),
    github: document.querySelector("#github").value.trim(),
    instagram: document.querySelector("#instagram").value.trim()
  };
  const invalid = Object.entries(socialLinks).find(([service, value]) => !validSocialUrl(value, service));
  const message = document.querySelector("#profile-msg");
  if (invalid) {
    message.textContent = `Enter a valid HTTPS ${invalid[0]} profile URL.`;
    return;
  }
  try {
    const data = await request("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ socialLinks }) });
    renderProfile(data.profile);
    message.textContent = "Profile saved for this running demo session.";
  } catch (error) {
    message.textContent = error.message;
  }
});
