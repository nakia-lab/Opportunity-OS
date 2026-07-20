# Orbit — Campaign Concept Studio

Orbit turns a focused marketing brief into a campaign platform, three copy routes, a launch checklist, and image directions that can be rendered into campaign visuals.

## Stack and API boundary

- Browser: a lightweight, responsive HTML/CSS/JS interface in `public/`. It only sends the brief to `/api/campaign` and an approved visual prompt to `/api/image`.
- Server: `server.js` hosts the UI and makes every OpenAI request. `OPENAI_API_KEY` is read only from the server environment and is never returned to the browser.
- OpenAI: both flows use `openai.responses.create()` from the official Node SDK. Text uses structured JSON output; visuals use the Responses API `image_generation` built-in tool. There is no legacy Completions or Chat Completions code.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
4. Start the app: `npm run dev`
5. Open `http://localhost:3000`.

`OPENAI_API_KEY` must remain server-only. Do not add it to frontend build variables or commit `.env`.

## Configuration

Adjust these values in `.env` without changing application code:

| Setting | Default | Purpose |
| --- | --- | --- |
| `OPENAI_TEXT_MODEL` | `gpt-5.6-terra` | Campaign reasoning and structured copy |
| `OPENAI_IMAGE_MODEL` | `gpt-5.6-terra` | Mainline model that calls the Responses image tool |
| `OPENAI_IMAGE_QUALITY` | `medium` | Visual fidelity / cost tradeoff |
| `OPENAI_IMAGE_SIZE` | `1536x1024` | Generated campaign-art aspect ratio |

The creative instructions are in `server.js`: change the campaign writing behavior in the `instructions` value of `/api/campaign`, and adjust image direction guardrails in `/api/image`. The JSON contract is the `schema` constant near the top of the server file.

## Deploy

This is a standard Node web service. On Render, Railway, Fly, a container service, or a VM: set `OPENAI_API_KEY` and the optional configuration values in the provider’s encrypted environment settings, run `npm install`, and launch with `npm start`. The platform should route traffic to `PORT` (the app defaults to 3000). Never place the API key in static files or browser configuration.

## Validation plan

1. Run `npm run check` for syntax validation.
2. Run the example brief and confirm the response always includes one concept, three variants, 5–8 checklist items, and two image prompts.
3. Generate both visual directions; confirm returned image data renders and the key stays absent from browser network payloads/source.
4. Test empty required fields, no selected channel, an invalid/missing API key, and a blocked/failed image request; each should provide a useful UI state.
5. Review generated copy for product-claim accuracy, brand appropriateness, accessibility, and image-policy fit before publishing.

## Current OpenAI guidance used

The implementation follows the [Responses API image-generation guide](https://developers.openai.com/api/docs/guides/image-generation), which documents `responses.create` with the `image_generation` built-in tool and its base64 image result. The [model catalog](https://developers.openai.com/api/docs/models) lists GPT‑5.6 Terra as a balance of intelligence and cost; this project defaults to your selected `gpt-5.6-terra` and keeps that choice configurable.
