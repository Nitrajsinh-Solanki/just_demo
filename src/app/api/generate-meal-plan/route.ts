import { NextRequest, NextResponse } from "next/server";

interface UserInput {
  dayType: string;
  peopleCount: number;
  budget: number;
  dietaryRestrictions: string[];
  cuisinePreference: string;
  cookingSkill: string;
}

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

export async function POST(req: NextRequest) {
  try {
    const body: UserInput = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(body),
              },
            ],
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
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Gemini API call failed", details: errorData },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract the text content from Gemini's response
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 500 }
      );
    }

    // Strip any accidental markdown fences just in case
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const mealPlan = JSON.parse(cleaned);

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}