import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3000);
// Construct only when configured so the UI can still explain setup locally.
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5.6-terra";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-5.6-terra";
const imageQuality = process.env.OPENAI_IMAGE_QUALITY || "medium";
const imageSize = process.env.OPENAI_IMAGE_SIZE || "1536x1024";

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["concept", "variants", "checklist", "imageDirections"],
  properties: {
    concept: {
      type: "object",
      additionalProperties: false,
      required: ["name", "oneLiner", "insight", "bigIdea"],
      properties: {
        name: { type: "string" },
        oneLiner: { type: "string" },
        insight: { type: "string" },
        bigIdea: { type: "string" }
      }
    },
    variants: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "headline", "body", "cta"],
        properties: {
          label: { type: "string" },
          headline: { type: "string" },
          body: { type: "string" },
          cta: { type: "string" }
        }
      }
    },
    checklist: { type: "array", minItems: 5, maxItems: 8, items: { type: "string" } },
    imageDirections: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "prompt"],
        properties: { title: { type: "string" }, prompt: { type: "string" } }
      }
    }
  }
};

function cleanBrief(input) {
  const fields = ["brief", "audience", "product", "tone"];
  const clean = Object.fromEntries(fields.map((key) => [key, String(input[key] || "").trim()]));
  clean.channels = Array.isArray(input.channels) ? input.channels.map(String).filter(Boolean).slice(0, 8) : [];
  if (Object.values(clean).some((value) => typeof value === "string" && value.length > 2000)) throw new Error("Keep each field under 2,000 characters.");
  if (!clean.brief || !clean.audience || !clean.product || !clean.tone || !clean.channels.length) throw new Error("Complete the brief, audience, product, tone, and at least one channel.");
  return clean;
}

app.post("/api/campaign", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server." });
    const brief = cleanBrief(req.body);
    const response = await openai.responses.create({
      model: textModel,
      instructions: "You are a senior creative strategist. Create a crisp, original, launch-ready campaign direction. Stay faithful to the provided product and audience. Avoid unsupported factual claims. Make each copy route materially different and channel-aware. Write concise marketing copy. Image prompts must be detailed, text-free visual directions; do not ask for logos or readable typography.",
      input: `Campaign brief: ${brief.brief}\nTarget audience: ${brief.audience}\nProduct details: ${brief.product}\nTone: ${brief.tone}\nDesired channels: ${brief.channels.join(", ")}`,
      text: { format: { type: "json_schema", name: "campaign_studio_output", strict: true, schema } }
    });
    res.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("Campaign generation failed:", error);
    res.status(error?.status || 500).json({ error: error?.message || "Campaign generation failed. Please try again." });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server." });
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt || prompt.length > 4000) return res.status(400).json({ error: "Provide an image prompt under 4,000 characters." });
    // Responses API image-generation tool: no browser API key is ever used.
    const response = await openai.responses.create({
      model: imageModel,
      input: `Create one premium campaign key visual. ${prompt}. No words, lettering, logo, watermark, or UI elements.`,
      tools: [{ type: "image_generation", action: "generate", quality: imageQuality, size: imageSize }]
    });
    const image = response.output.find((item) => item.type === "image_generation_call")?.result;
    if (!image) throw new Error("The image tool returned no image. Try a simpler visual direction.");
    res.json({ image: `data:image/png;base64,${image}` });
  } catch (error) {
    console.error("Image generation failed:", error);
    res.status(error?.status || 500).json({ error: error?.message || "Image generation failed. Please try again." });
  }
});

app.listen(port, () => console.log(`Campaign Studio is running at http://localhost:${port}`));
