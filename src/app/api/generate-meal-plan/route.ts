import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInput {
  dayType: string;
  peopleCount: number;
  budget: number;
  dietaryRestrictions: string[];
  cuisinePreference: string;
  cookingSkill: string;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(input: UserInput): string {
  return `You are a professional meal planning assistant specialized in Indian and international cuisine.

Create a complete full-day meal plan for the following user:
- Day type: ${input.dayType}
- Number of people: ${input.peopleCount}
- Total budget: ₹${input.budget}
- Dietary restrictions: ${input.dietaryRestrictions.length > 0 ? input.dietaryRestrictions.join(", ") : "None"}
- Cuisine preference: ${input.cuisinePreference}
- Cooking skill level: ${input.cookingSkill}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation text before or after. Just raw JSON.

The JSON must follow this exact structure:
{
  "meals": {
    "breakfast": {
      "name": "meal name",
      "description": "2-3 sentence description of the dish",
      "prepTime": "X minutes",
      "cookTime": "X minutes",
      "difficulty": "Easy",
      "calories": "approx X kcal per serving",
      "emoji": "relevant food emoji"
    },
    "lunch": {
      "name": "meal name",
      "description": "2-3 sentence description of the dish",
      "prepTime": "X minutes",
      "cookTime": "X minutes",
      "difficulty": "Medium",
      "calories": "approx X kcal per serving",
      "emoji": "relevant food emoji"
    },
    "dinner": {
      "name": "meal name",
      "description": "2-3 sentence description of the dish",
      "prepTime": "X minutes",
      "cookTime": "X minutes",
      "difficulty": "Hard",
      "calories": "approx X kcal per serving",
      "emoji": "relevant food emoji"
    }
  },
  "groceryList": [
    {
      "item": "ingredient name",
      "quantity": "amount with unit",
      "estimatedCost": 30,
      "category": "produce"
    }
  ],
  "substitutions": [
    {
      "original": "original ingredient",
      "substitute": "substitute ingredient",
      "reason": "why this substitution works",
      "savingsAmount": 20
    }
  ],
  "budgetAnalysis": {
    "totalEstimatedCost": 450,
    "isFeasible": true,
    "feasibilityMessage": "Your plan fits within the budget",
    "savingsTip": "one actionable tip to save money",
    "breakdown": {
      "breakfast": 100,
      "lunch": 150,
      "dinner": 200,
      "miscellaneous": 0
    }
  },
  "cookingTodoList": [
    {
      "time": "7:00 AM",
      "task": "specific cooking task description",
      "meal": "breakfast",
      "duration": "15 minutes",
      "priority": "high"
    }
  ],
  "nutritionSummary": {
    "isBalanced": true,
    "balanceMessage": "brief nutrition overview for the day",
    "proteinSources": ["paneer", "dal"],
    "veggiesIncluded": ["spinach", "tomato"]
  }
}

Rules:
1. All costs must be numbers in Indian Rupees, not strings
2. Grocery list must have at least 12 items
3. Cooking todo list must have at least 7 tasks spread across the day
4. Substitutions must have at least 4 options
5. budgetAnalysis.totalEstimatedCost must equal the sum of all grocery item estimatedCost values
6. Meals must strictly follow the dietary restrictions and cuisine preference
7. difficulty must be exactly one of: Easy, Medium, Hard
8. priority must be exactly one of: high, medium, low
9. category must be exactly one of: produce, dairy, protein, pantry, spices, grains`;
}

// ─── Groq (Primary) ───────────────────────────────────────────────────────────

async function generateWithGroq(input: UserInput): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const groq = new Groq({ apiKey: groqApiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
    temperature: 0.7,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  if (!rawText) {
    throw new Error("Empty response from Groq");
  }
  return rawText;
}

// ─── Gemini (Fallback) ────────────────────────────────────────────────────────

async function generateWithGemini(input: UserInput): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

  const geminiResponse = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildPrompt(input) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!geminiResponse.ok) {
    const errorData = await geminiResponse.json();
    throw new Error(
      `Gemini API error: ${JSON.stringify(errorData)}`
    );
  }

  const geminiData = await geminiResponse.json();
  const rawText: string =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    throw new Error("Empty response from Gemini");
  }
  return rawText;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: UserInput = await req.json();

    let rawText: string;
    let usedProvider: "groq" | "gemini" = "groq";

    // ── 1. Try Groq first ──────────────────────────────────────────────────
    try {
      console.log("[MealMind] Attempting generation with Groq (primary)...");
      rawText = await generateWithGroq(body);
      console.log("[MealMind] ✅ Groq succeeded.");
    } catch (groqError) {
      // ── 2. Groq failed → fall back to Gemini ────────────────────────────
      console.warn(
        "[MealMind] ⚠️  Groq failed, falling back to Gemini. Reason:",
        String(groqError)
      );

      try {
        rawText = await generateWithGemini(body);
        usedProvider = "gemini";
        console.log("[MealMind] ✅ Gemini fallback succeeded.");
      } catch (geminiError) {
        // Both providers failed — surface a clear error
        console.error("[MealMind] ❌ Both Groq and Gemini failed.");
        return NextResponse.json(
          {
            error: "Both AI providers failed. Check your API keys and try again.",
            groqError: String(groqError),
            geminiError: String(geminiError),
          },
          { status: 500 }
        );
      }
    }

    // ── 3. Clean & parse JSON ────────────────────────────────────────────────
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const mealPlan = JSON.parse(cleaned);

    // Attach which provider was actually used (optional — useful for debugging)
    return NextResponse.json({ ...mealPlan, _provider: usedProvider });
  } catch (error) {
    console.error("[MealMind] Route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}