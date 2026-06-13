# MealMind

An AI-powered meal planning app that generates a complete cooking plan for your day — meals, grocery list, substitutions, and budget check — all in one click.

---

## What It Does

Tell the app what kind of day you are having and how many people you are cooking for. Set your budget, dietary restrictions, cuisine preference, and cooking skill level. The app generates:

- Breakfast, lunch, and dinner suggestions
- A grocery list with estimated costs in INR
- Smart ingredient substitutions to save money
- A step-by-step cooking schedule for the day
- A budget feasibility check
- A basic nutrition summary

---

## Getting Started

**Prerequisites:** Node.js 18 or later.

```bash
git clone https://github.com/your-username/just_demo.git
cd just_demo
npm install
```

Create a `.env.local` file in the root of the project:

```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## API Keys

**Groq** — Sign up at `console.groq.com` and create an API key. Free tier is enough.

**Gemini** — Get a key from `aistudio.google.com`. Used as a backup if Groq is unavailable.

---

## Deploying to Vercel

1. Push the project to GitHub
2. Import it on `vercel.com`
3. Go to Settings, then Environment Variables
4. Add `GROQ_API_KEY` and `GEMINI_API_KEY`
5. Redeploy from the Deployments tab for the keys to take effect

Your production URL stays the same across all future deployments.

---

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- Groq (primary AI) with Gemini fallback