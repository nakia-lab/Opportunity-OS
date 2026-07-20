const views = [...document.querySelectorAll('.view')];
const nav = [...document.querySelectorAll('nav button')];
let learnerContext = '';
let lastPlan = null;
const esc = (value) => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function show(id) { views.forEach(v => v.classList.toggle('active', v.id === id)); nav.forEach(b => b.classList.toggle('active', b.dataset.view === id)); window.scrollTo({top:0, behavior:'smooth'}); }
nav.forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => show('onboarding')));
const backBtn = document.querySelector('[data-back]'); if (backBtn) backBtn.addEventListener('click', () => show('home'));

// Skills Demo Data
const skillsCourses = {
  digital: {
    title: 'Digital Confidence',
    icon: '⌁',
    lessons: [
      { title: 'Getting around your computer', duration: '15 min', desc: 'Learn the basics of files, folders, and how to stay organized.' },
      { title: 'Email like a pro', duration: '20 min', desc: 'Send, reply, and organize emails. Learn email etiquette and safety.' },
      { title: 'Staying safe online', duration: '25 min', desc: 'Passwords, phishing, and how to protect your personal information.' },
      { title: 'Using cloud storage', duration: '15 min', desc: 'Store and access files from anywhere with Google Drive or Dropbox.' }
    ]
  },
  career: {
    title: 'Career Essentials',
    icon: '✓',
    lessons: [
      { title: 'Tell your story', duration: '20 min', desc: 'Craft a 2-minute personal pitch that highlights your strengths.' },
      { title: 'Build your resume', duration: '30 min', desc: 'Create a clear, one-page resume even without formal work experience.' },
      { title: 'Interview preparation', duration: '25 min', desc: 'Common questions, body language, and how to follow up.' },
      { title: 'Networking basics', duration: '20 min', desc: 'Connect with people in your field through LinkedIn and events.' }
    ]
  },
  money: {
    title: 'Money Basics',
    icon: '$',
    lessons: [
      { title: 'Understanding budgets', duration: '20 min', desc: 'Track income and expenses to see where your money goes.' },
      { title: 'Building savings', duration: '15 min', desc: 'Start small: automate savings and watch it grow.' },
      { title: 'Credit 101', duration: '25 min', desc: 'Credit scores, building credit, and using credit wisely.' },
      { title: 'Financial goals', duration: '20 min', desc: 'Plan short-term wins and long-term goals.' }
    ]
  }
};

function showLessons(courseId) {
  const course = skillsCourses[courseId];
  const lessonsView = document.getElementById('lessons-view');
  const skillsGrid = document.getElementById('skills-grid');
  const lessonsContent = document.getElementById('lessons-content');
  
  lessonsContent.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <p class="eyebrow">${course.icon} ${course.title}</p>
      <h2>Learn ${course.title.toLowerCase()}</h2>
    </div>
    <div style="display: grid; gap: 1rem;">
      ${course.lessons.map((lesson, i) => `
        <article style="padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f9f9f9'" onmouseout="this.style.backgroundColor='white'">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #1a1a1a;">${esc(lesson.title)}</h3>
            <span style="color: #666; font-size: 0.9rem; white-space: nowrap;">⏱️ ${lesson.duration}</span>
          </div>
          <p style="margin: 0; color: #666; line-height: 1.6;">${esc(lesson.desc)}</p>
          <button style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Start lesson</button>
        </article>
      `).join('')}
    </div>
  `;
  
  skillsGrid.style.display = 'none';
  lessonsView.style.display = 'block';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function hideLessons() {
  document.getElementById('lessons-view').style.display = 'none';
  document.getElementById('skills-grid').style.display = 'grid';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Skills navigation
document.querySelectorAll('.course-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const courseId = e.target.closest('.course').dataset.course;
    showLessons(courseId);
  });
});

const skillsBack = document.querySelector('[data-skills-back]'); if (skillsBack) skillsBack.addEventListener('click', () => show('roadmap'));
const lessonsBack = document.querySelector('[data-lessons-back]'); if (lessonsBack) lessonsBack.addEventListener('click', hideLessons);

// Utility: show a transient mock notice in the UI
function showMockNotice() {
  const existing = document.getElementById('mock-notice');
  if (existing) existing.remove();
  const notice = document.createElement('div');
  notice.id = 'mock-notice';
  notice.style.position = 'fixed';
  notice.style.bottom = '24px';
  notice.style.right = '24px';
  notice.style.background = '#fff8e1';
  notice.style.border = '1px solid #ffd54f';
  notice.style.padding = '12px 16px';
  notice.style.borderRadius = '8px';
  notice.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
  notice.style.fontSize = '13px';
  notice.textContent = 'this is only a mock demo.';
  document.body.append(notice);
  setTimeout(() => { notice.remove(); }, 4000);
}

// User profile handling: fetch and render saved social links
async function fetchProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return null;
    const data = await res.json();
    renderUserLinks(data || {});
    prefillProfileForm(data || {});
    return data;
  } catch (err) {
    console.error('Failed to load profile', err);
    return null;
  }
}

function renderUserLinks(profile) {
  const container = document.getElementById('user-links');
  if (!container) return;
  container.innerHTML = '';
  const links = (profile && profile.socialLinks) ? profile.socialLinks : {};
  const templates = [];
  if (links.linkedin) templates.push(`<a href="${esc(links.linkedin)}" target="_blank" rel="noopener noreferrer" class="social-link">LinkedIn</a>`);
  if (links.github) templates.push(`<a href="${esc(links.github)}" target="_blank" rel="noopener noreferrer" class="social-link">GitHub</a>`);
  if (links.instagram) templates.push(`<a href="${esc(links.instagram)}" target="_blank" rel="noopener noreferrer" class="social-link">Instagram</a>`);
  container.innerHTML = templates.join(' ');
}

function prefillProfileForm(profile) {
  const links = (profile && profile.socialLinks) ? profile.socialLinks : {};
  const get = (id) => document.getElementById(id);
  if (get('linkedin')) get('linkedin').value = links.linkedin || '';
  if (get('github')) get('github').value = links.github || '';
  if (get('instagram')) get('instagram').value = links.instagram || '';
}

// Open profile when clicking the side-bottom area
const sideBottom = document.querySelector('[data-open-profile]');
if (sideBottom) sideBottom.addEventListener('click', () => show('profile'));

// Profile form submit handler with client-side validation
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('profile-msg');
    msg.textContent = '';
    const linkedin = document.getElementById('linkedin').value.trim();
    const github = document.getElementById('github').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const payload = { socialLinks: {}};
    if (linkedin) payload.socialLinks.linkedin = linkedin;
    if (github) payload.socialLinks.github = github;
    if (instagram) payload.socialLinks.instagram = instagram;
    // simple client-side validation: https and approved hosts
    const allowed = ['linkedin.com','github.com','instagram.com'];
    for (const [k,v] of Object.entries(payload.socialLinks)) {
      try {
        const p = new URL(v);
        if (p.protocol !== 'https:') { msg.textContent = 'Only https:// links are allowed.'; return; }
        if (!allowed.some(h => p.hostname.toLowerCase().endsWith(h))) { msg.textContent = 'Only LinkedIn, GitHub and Instagram links are accepted.'; return; }
      } catch (err) { msg.textContent = 'Please enter valid URLs.'; return; }
    }
    try {
      const res = await fetch('/api/profile', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const data = await res.json();
      if (!res.ok) { msg.textContent = data.error || 'Failed to save'; return; }
      msg.textContent = 'Profile saved.';
      renderUserLinks(data.profile);
      setTimeout(()=> { msg.textContent=''; show('home'); }, 1200);
    } catch (err) {
      msg.textContent = 'Save failed.'; console.error(err);
    }
  });
}

// Initialize profile on load
fetchProfile();

// Roadmap form submit
document.querySelector('#roadmap-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); const data = Object.fromEntries(new FormData(form)); learnerContext = `Goal: ${data.goal}. Current situation: ${data.current}. Interests: ${data.interests}. Time: ${data.time}`; button.disabled = true; button.innerHTML = 'Creating your roadmap <b>…</b>';
  try { const res = await fetch('/api/roadmap', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); const plan = await res.json(); if (!res.ok) throw new Error(plan.error); lastPlan = plan; renderRoadmap(plan); show('roadmap'); } catch (err) { alert(err.message); } finally { button.disabled = false; button.innerHTML = 'Create my roadmap <b>→</b>'; }
});

function renderRoadmap(plan) { 
  lastPlan = plan;
  document.querySelector('#north-star').textContent = plan.northStar; 
  document.querySelector('#momentum').textContent = plan.momentum; 
  document.querySelector('#coach-note').textContent = plan.coachNote; 
  document.querySelector('#welcome').textContent = plan.welcome; 
  document.querySelector('#steps-list').innerHTML = plan.nextSteps.map((s,i) => `<article class="step"><span>${String(i+1).padStart(2,'0')}</span><div><p class="step-area">${esc(s.area)} · ${esc(s.time)}</p><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p></div><button class="check" aria-label="Mark complete">✓</button></article>`).join(''); 
  document.querySelector('#opportunities-list').innerHTML = plan.opportunities.map((o, idx) => `<article class="opp"><span>${esc(o.type)}</span><h3>${esc(o.title)}</h3><b>${esc(o.organization)}</b><p>${esc(o.why)}</p><button class="opp-btn" data-opp-index="${idx}" data-has-demo="true">Learn how to explore →</button></article>`).join('');
}

// Opportunities demo: run search and quick examples
const finderRun = document.getElementById('finder-run');
if (finderRun) finderRun.addEventListener('click', () => {
  const q = document.getElementById('finder-query').value || '';
  runFinder(q);
});

document.querySelectorAll('.quick-example').forEach(b => b.addEventListener('click', (e) => runFinder(e.target.dataset.q)));

function runFinder(query) {
  const container = document.getElementById('finder-demo-results');
  const q = (query || '').trim();
  if (!container) return;
  const results = [
    {title: `${q || 'Entry-level data'} – Intro Certificate`, org: 'Community College', why: 'Short, affordable pathway to practical skills', link: '#'},
    {title: `${q || 'Intro to data'} – Online course`, org: 'Coursera / edX', why: 'Self-paced, project-focused curriculum', link: '#'},
    {title: `Local ${q || 'training'} cohort`, org: 'Workforce Center', why: 'Cohort-based learning with supports', link: '#'}
  ];
  container.innerHTML = results.map((r, i) => `
    <div style="padding:12px;border:1px solid var(--line);margin-bottom:8px;border-radius:8px;">
      <h3 style="margin:0 0 6px;">${esc(r.title)}</h3>
      <div style="color:var(--muted);font-size:13px;margin-bottom:8px;">${esc(r.org)} · ${esc(r.why)}</div>
      <div style="display:flex;gap:8px;"> 
        <button class="open-result" data-has-demo="false">Open</button>
        <button class="more-info" data-has-demo="false">More info</button>
      </div>
    </div>
  `).join('');
}

// Click handlers: opportunities buttons, guide back, and open-result handling
document.addEventListener('click', (event) => {
  const oppBtn = event.target.closest('.opp-btn');
  if (oppBtn) {
    const idx = Number(oppBtn.dataset.oppIndex);
    const plan = lastPlan;
    if (plan && plan.opportunities && plan.opportunities[idx]) {
      const o = plan.opportunities[idx];
      show('opportunities');
      document.getElementById('finder-query').value = o.title;
      runFinder(o.title);
      return;
    } else {
      showMockNotice();
      return;
    }
  }

  const openResult = event.target.closest('.open-result, .more-info');
  if (openResult) {
    // These are external-style links without a mock page — show mock notice
    const hasDemo = openResult.dataset.hasDemo === 'true';
    if (!hasDemo) {
      showMockNotice();
      return;
    }
  }

  const guideBack = event.target.closest('[data-guide-back]');
  if (guideBack) { show('roadmap'); return; }
});

// Guide form submit
const guideForm = document.querySelector('#guide-form');
if (guideForm) guideForm.addEventListener('submit', async (event) => { event.preventDefault(); const input = document.querySelector('#question'); const question = input.value.trim(); if (!question) return; const thread = document.querySelector('#guide-thread'); thread.insertAdjacentHTML('beforeend', `<div class="message user">${esc(question)}</div>`); input.value=''; const pending = document.createElement('div'); pending.className='message assistant pending'; pending.textContent='Thinking through that with you…'; thread.append(pending); thread.scrollTop = thread.scrollHeight; try { const res = await fetch('/api/guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context:learnerContext})}); const reply=await res.json(); if(!res.ok)throw new Error(reply.error); pending.outerHTML=`<div class="message assistant"><p>${esc(reply.answer)}</p><b>Next small step: ${esc(reply.action)}</b></div>`; } catch(err) { pending.textContent=err.message; pending.classList.add('error'); } thread.scrollTop=thread.scrollHeight; });

// Toggle step complete
document.addEventListener('click', (event) => { if(event.target.closest('.check')) event.target.closest('.step').classList.toggle('complete'); });
