import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const demoMode = process.env.DEMO_MODE === "true" || !process.env.OPENAI_API_KEY;
const openai = demoMode ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public", { extensions: ["html"] }));

const roadmapSchema = {
  type: "object",
  additionalProperties: false,
  required: ["northStar", "momentum", "coachNote", "welcome", "nextSteps", "opportunities"],
  properties: {
    northStar: { type: "string" },
    momentum: { type: "integer", minimum: 1, maximum: 100 },
    coachNote: { type: "string" },
    welcome: { type: "string" },
    nextSteps: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "time", "title", "detail"],
        properties: {
          area: { type: "string" },
          time: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" }
        }
      }
    },
    opportunities: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "organization", "why"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          organization: { type: "string" },
          why: { type: "string" }
        }
      }
    }
  }
};

const guideSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "action"],
  properties: {
    answer: { type: "string" },
    action: { type: "string" }
  }
};

let profile = { socialLinks: {} };

function text(value, max = 2000) {
  const cleaned = String(value || "").trim();
  if (cleaned.length > max) throw new Error(`Keep each response under ${max.toLocaleString()} characters.`);
  return cleaned;
}

function cleanRoadmapInput(body = {}) {
  const input = {
    goal: text(body.goal),
    current: text(body.current),
    interests: text(body.interests, 500),
    time: text(body.time, 100)
  };
  if (Object.values(input).some((value) => !value)) throw new Error("Complete every roadmap question.");
  return input;
}

function demoRoadmap(input) {
  const goal = input.goal.replace(/[.!?]+$/, "");
  return {
    northStar: `Build a realistic path toward ${goal.toLowerCase()}.`,
    momentum: 68,
    coachNote: "You already have a direction. The next win is turning it into one small, repeatable action.",
    welcome: `A practical plan for your available ${input.time} this week.`,
    nextSteps: [
      { area: "Direction", time: "20 min", title: "Define your first milestone", detail: `Write down what meaningful progress toward “${goal}” would look like 30 days from now.` },
      { area: "Skills", time: "30 min", title: "Choose one skill to strengthen", detail: `Connect one of your interests—${input.interests}—to a useful beginner skill and complete one introductory lesson.` },
      { area: "Action", time: "25 min", title: "Make one real-world move", detail: "Save one program, job pathway, credential, or local resource to investigate this week." }
    ],
    opportunities: [
      { type: "Learning", title: "Beginner certificate pathway", organization: "Community college or online provider", why: "A structured, lower-risk way to test your interest and build proof of skill." },
      { type: "Support", title: "Local workforce development program", organization: "Michigan Works! or local workforce center", why: "May offer coaching, training support, and connections to employers." },
      { type: "Experience", title: "Entry-level project or volunteer role", organization: "Community organization or small business", why: "Creates experience you can describe on a resume while you continue learning." }
    ]
  };
}

function validateSocialUrl(value, service) {
  if (!value) return "";
  const url = new URL(value);
  const allowed = {
    linkedin: ["linkedin.com", "www.linkedin.com"],
    github: ["github.com", "www.github.com"],
    instagram: ["instagram.com", "www.instagram.com"]
  };
  if (url.protocol !== "https:" || !allowed[service]?.includes(url.hostname.toLowerCase())) {
    throw new Error(`Enter a valid HTTPS ${service} URL.`);
  }
  return url.toString();
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Opportunity OS", mode: demoMode ? "demo" : "openai", model: demoMode ? null : model });
});

app.post("/api/roadmap", async (req, res) => {
  try {
    const input = cleanRoadmapInput(req.body);
    if (demoMode) return res.json(demoRoadmap(input));

    const response = await openai.responses.create({
      model,
      store: false,
      instructions: "You are the supportive planning guide inside Opportunity OS. Help adults who may lack a high school diploma, formal credentials, confidence with technology, or a clear career path. Use plain, respectful language. Never shame the learner. Produce practical steps that fit the available weekly time. Do not invent live job openings, deadlines, salaries, admission guarantees, or financial aid. Opportunity suggestions must be categories to verify, not claims that a specific opening exists.",
      input: `Goal: ${input.goal}\nCurrent situation: ${input.current}\nInterests and strengths: ${input.interests}\nTime available this week: ${input.time}`,
      text: { format: { type: "json_schema", name: "opportunity_os_roadmap", strict: true, schema: roadmapSchema } }
    });
    res.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("Roadmap generation failed:", error);
    res.status(error?.status && error.status < 500 ? error.status : 400).json({ error: error?.message || "We could not create the roadmap. Please try again." });
  }
});

app.post("/api/guide", async (req, res) => {
  try {
    const question = text(req.body?.question, 1200);
    const context = text(req.body?.context, 3000);
    if (!question) throw new Error("Enter a question for your guide.");

    if (demoMode) {
      return res.json({
        answer: "Start by making the problem smaller. Focus on one result you can complete this week, then use that result as evidence of progress.",
        action: "Write one 20-minute task you can finish today and put it on your calendar."
      });
    }

    const response = await openai.responses.create({
      model,
      store: false,
      instructions: "You are the Opportunity OS guide. Give concise, encouraging education, digital-skills, and career guidance in plain language. Be honest about uncertainty. Do not claim that jobs, programs, funding, or deadlines are current unless the user verifies them through an official source. Do not request sensitive personal information. Return one helpful answer and one small action.",
      input: `Learner context: ${context || "Not provided"}\nQuestion: ${question}`,
      text: { format: { type: "json_schema", name: "opportunity_os_guide", strict: true, schema: guideSchema } }
    });
    res.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("Guide request failed:", error);
    res.status(error?.status && error.status < 500 ? error.status : 400).json({ error: error?.message || "The guide could not answer right now." });
  }
});

app.get("/api/profile", (_req, res) => res.json(profile));

app.post("/api/profile", (req, res) => {
  try {
    const links = req.body?.socialLinks || {};
    profile = {
      socialLinks: {
        linkedin: validateSocialUrl(text(links.linkedin, 300), "linkedin"),
        github: validateSocialUrl(text(links.github, 300), "github"),
        instagram: validateSocialUrl(text(links.instagram, 300), "instagram")
      }
    };
    res.json({ profile });
  } catch (error) {
    res.status(400).json({ error: error.message || "The profile could not be saved." });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found." });
  next();
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Opportunity OS running on port ${port} (${demoMode ? "demo mode" : model})`);
});
