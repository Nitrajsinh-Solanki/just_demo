"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInput {
  dayType: string;
  peopleCount: number;
  budget: number;
  dietaryRestrictions: string[];
  cuisinePreference: string;
  cookingSkill: string;
}

interface Meal {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  calories: string;
  emoji: string;
}

interface GroceryItem {
  item: string;
  quantity: string;
  estimatedCost: number;
  category: string;
}

interface Substitution {
  original: string;
  substitute: string;
  reason: string;
  savingsAmount: number;
}

interface BudgetAnalysis {
  totalEstimatedCost: number;
  isFeasible: boolean;
  feasibilityMessage: string;
  savingsTip: string;
  breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    miscellaneous: number;
  };
}

interface TodoItem {
  time: string;
  task: string;
  meal: string;
  duration: string;
  priority: string;
}

interface MealPlan {
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
  };
  groceryList: GroceryItem[];
  substitutions: Substitution[];
  budgetAnalysis: BudgetAnalysis;
  cookingTodoList: TodoItem[];
  nutritionSummary: {
    isBalanced: boolean;
    balanceMessage: string;
    proteinSources: string[];
    veggiesIncluded: string[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_TYPES = [
  { id: "busy workday", label: "Busy Workday", emoji: "💼", desc: "Quick & easy meals" },
  { id: "relaxed weekend", label: "Relaxed Weekend", emoji: "🌿", desc: "More time to cook" },
  { id: "date night", label: "Date Night", emoji: "🕯️", desc: "Special & romantic" },
  { id: "family meal", label: "Family Meal", emoji: "👨‍👩‍👧", desc: "Everyone-friendly" },
];

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥗" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "jain", label: "Jain", emoji: "🙏" },
  { id: "gluten-free", label: "Gluten Free", emoji: "🌾" },
  { id: "dairy-free", label: "Dairy Free", emoji: "🥛" },
  { id: "high-protein", label: "High Protein", emoji: "💪" },
];

const CUISINE_OPTIONS = [
  { id: "Indian", label: "Indian", emoji: "🍛" },
  { id: "Continental", label: "Continental", emoji: "🍝" },
  { id: "Mix", label: "Fusion Mix", emoji: "🌍" },
  { id: "Chinese", label: "Indo-Chinese", emoji: "🥢" },
];

const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Simple recipes only", emoji: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "Comfortable cooking", emoji: "👨‍🍳" },
  { id: "advanced", label: "Chef Mode", desc: "Bring on complexity", emoji: "⭐" },
];

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  produce:  { emoji: "🥬", color: "bg-green-100 text-green-700" },
  dairy:    { emoji: "🥛", color: "bg-blue-100 text-blue-700" },
  protein:  { emoji: "🍗", color: "bg-orange-100 text-orange-700" },
  pantry:   { emoji: "🫙", color: "bg-amber-100 text-amber-700" },
  spices:   { emoji: "🌶️", color: "bg-red-100 text-red-700" },
  grains:   { emoji: "🌾", color: "bg-yellow-100 text-yellow-700" },
};

const MEAL_CONFIG = {
  breakfast: {
    emoji: "🌅", label: "Breakfast", time: "Morning",
    gradient: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
  lunch: {
    emoji: "☀️", label: "Lunch", time: "Afternoon",
    gradient: "from-yellow-50 to-lime-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
  },
  dinner: {
    emoji: "🌙", label: "Dinner", time: "Evening",
    gradient: "from-indigo-50 to-purple-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
  },
};

const LOADING_MESSAGES = [
  "🧑‍🍳 Planning your perfect meals...",
  "🛒 Building your grocery list...",
  "💰 Checking your budget feasibility...",
  "🔄 Finding smart substitutions...",
  "📋 Creating your cooking schedule...",
  "✨ Almost ready...",
];

const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const DIFFICULTY_STARS: Record<string, string> = {
  Easy:   "⭐",
  Medium: "⭐⭐",
  Hard:   "⭐⭐⭐",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<"context" | "preferences" | "loading" | "results">("context");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [checkedTodos, setCheckedTodos] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const [input, setInput] = useState<UserInput>({
    dayType: "",
    peopleCount: 2,
    budget: 500,
    dietaryRestrictions: [],
    cuisinePreference: "Indian",
    cookingSkill: "intermediate",
  });

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [step]);

  const toggleDiet = (id: string) => {
    setInput((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(id)
        ? prev.dietaryRestrictions.filter((d) => d !== id)
        : [...prev.dietaryRestrictions, id],
    }));
  };

  const handleGenerate = async () => {
    setStep("loading");
    setError(null);
    setCheckedItems(new Set());
    setCheckedTodos(new Set());
    setActiveCategory("all");
    try {
      const res = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate meal plan");
      }
      const data: MealPlan = await res.json();
      setMealPlan(data);
      setStep("results");
    } catch (err) {
      setError(String(err));
      setStep("preferences");
    }
  };

  const handleReset = () => {
    setStep("context");
    setMealPlan(null);
    setError(null);
    setInput({
      dayType: "",
      peopleCount: 2,
      budget: 500,
      dietaryRestrictions: [],
      cuisinePreference: "Indian",
      cookingSkill: "intermediate",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span className="font-semibold text-zinc-800 tracking-tight">MealMind</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              AI Powered
            </span>
          </div>
          {step === "results" && (
            <button
              onClick={handleReset}
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* ════════════════════════════════════════════════════
            STEP 1 — Day Context
        ════════════════════════════════════════════════════ */}
        {step === "context" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
                What&apos;s your day looking like?
              </h1>
              <p className="text-zinc-500">
                Tell us about your day and we&apos;ll plan every meal around it.
              </p>
            </div>

            {/* Day type grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DAY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setInput((p) => ({ ...p, dayType: type.id }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    input.dayType === type.id
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="font-semibold text-zinc-800 text-sm">{type.label}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>

            {/* People count */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4">
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                How many people are you cooking for?
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setInput((p) => ({ ...p, peopleCount: Math.max(1, p.peopleCount - 1) }))
                  }
                  className="w-10 h-10 rounded-full border-2 border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-zinc-900">{input.peopleCount}</span>
                  <span className="text-zinc-500 ml-1 text-sm">
                    {input.peopleCount === 1 ? "person" : "people"}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setInput((p) => ({ ...p, peopleCount: Math.min(10, p.peopleCount + 1) }))
                  }
                  className="w-10 h-10 rounded-full border-2 border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep("preferences")}
              disabled={!input.dayType}
              className="w-full h-12 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next: Set Preferences →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 2 — Preferences
        ════════════════════════════════════════════════════ */}
        {step === "preferences" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
                Personalise your plan
              </h1>
              <p className="text-zinc-500">Budget, diet, and style — make it yours.</p>
            </div>

            {/* Budget slider */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-zinc-700">Daily Budget</label>
                <span className="text-xl font-bold text-emerald-600">₹{input.budget}</span>
              </div>
              <input
                type="range"
                min={100}
                max={3000}
                step={50}
                value={input.budget}
                onChange={(e) => setInput((p) => ({ ...p, budget: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>₹100</span>
                <span>₹1500</span>
                <span>₹3000</span>
              </div>
            </div>

            {/* Dietary restrictions */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4">
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                Dietary Restrictions{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toggleDiet(d.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      input.dietaryRestrictions.includes(d.id)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300"
                    }`}
                  >
                    {d.emoji} {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4">
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                Cuisine Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CUISINE_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setInput((p) => ({ ...p, cuisinePreference: c.id }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      input.cuisinePreference === c.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill level */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-5">
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                Cooking Skill Level
              </label>
              <div className="flex flex-col gap-2">
                {SKILL_LEVELS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setInput((p) => ({ ...p, cookingSkill: s.id }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      input.cookingSkill === s.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-zinc-800">{s.label}</div>
                      <div className="text-xs text-zinc-500">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("context")}
                className="h-12 px-6 rounded-2xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                🍳 Generate My Meal Plan
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 3 — Loading
        ════════════════════════════════════════════════════ */}
        {step === "loading" && (
          <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-6 animate-bounce">🍳</div>
            <h2 className="text-2xl font-bold text-zinc-800 mb-2">
              Cooking up your plan…
            </h2>
            <p className="text-zinc-500 text-sm mb-8">
              Gemini AI is personalizing everything for you
            </p>
            <div className="w-full bg-zinc-100 rounded-full h-2 mb-6 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-emerald-600 font-medium text-sm">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 4 — Results
        ════════════════════════════════════════════════════ */}
        {step === "results" && mealPlan && (
          <div>

            {/* Top summary bar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {DAY_TYPES.find((d) => d.id === input.dayType)?.emoji}
                </span>
                <div>
                  <div className="font-semibold text-zinc-800 text-sm capitalize">
                    {input.dayType}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {input.peopleCount} {input.peopleCount === 1 ? "person" : "people"} · ₹
                    {input.budget} budget · {input.cuisinePreference}
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-medium transition-colors"
              >
                🔄 Regenerate
              </button>
            </div>

            {/* Budget banner */}
            <div
              className={`rounded-2xl border p-4 mb-6 ${
                mealPlan.budgetAnalysis.isFeasible
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {mealPlan.budgetAnalysis.isFeasible ? "✅" : "⚠️"}
                  </span>
                  <span
                    className={`font-semibold text-sm ${
                      mealPlan.budgetAnalysis.isFeasible
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    {mealPlan.budgetAnalysis.feasibilityMessage}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-zinc-500">Estimated total</div>
                  <div
                    className={`font-bold text-lg ${
                      mealPlan.budgetAnalysis.isFeasible
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    ₹{mealPlan.budgetAnalysis.totalEstimatedCost}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-white/60 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    mealPlan.budgetAnalysis.isFeasible ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (mealPlan.budgetAnalysis.totalEstimatedCost / input.budget) * 100
                    )}%`,
                  }}
                />
              </div>

              {/* Per-meal cost pills */}
              <div className="flex flex-wrap gap-2 mb-1">
                {(["breakfast", "lunch", "dinner"] as const).map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-zinc-600 capitalize"
                  >
                    {MEAL_CONFIG[m].emoji} {m}: ₹{mealPlan.budgetAnalysis.breakdown[m]}
                  </span>
                ))}
              </div>

              {mealPlan.budgetAnalysis.savingsTip && (
                <p className="text-xs text-zinc-600 mt-1">
                  💡 <span className="font-medium">Tip:</span>{" "}
                  {mealPlan.budgetAnalysis.savingsTip}
                </p>
              )}
            </div>

            {/* Meal cards */}
            <h2 className="text-lg font-bold text-zinc-800 mb-3">📅 Today&apos;s Meal Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(["breakfast", "lunch", "dinner"] as const).map((mealKey) => {
                const meal = mealPlan.meals[mealKey];
                const cfg = MEAL_CONFIG[mealKey];
                return (
                  <div
                    key={mealKey}
                    className={`bg-gradient-to-br ${cfg.gradient} border ${cfg.border} rounded-2xl p-4`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-xs text-zinc-500">{cfg.time}</span>
                    </div>
                    <div className="text-3xl mb-1">{meal.emoji}</div>
                    <h3 className="font-bold text-zinc-800 text-base mb-1">{meal.name}</h3>
                    <p className="text-zinc-600 text-xs leading-relaxed mb-3">
                      {meal.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-zinc-600">
                        ⏱ Prep: {meal.prepTime}
                      </span>
                      <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-zinc-600">
                        🔥 Cook: {meal.cookTime}
                      </span>
                      <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-zinc-600">
                        {DIFFICULTY_STARS[meal.difficulty] ?? "⭐"} {meal.difficulty}
                      </span>
                      <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-zinc-600">
                        🫀 {meal.calories}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grocery list + Cooking todo — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* Grocery list */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-zinc-800">🛒 Grocery List</h2>
                  <span className="text-xs text-zinc-500">
                    {checkedItems.size}/{mealPlan.groceryList.length} picked
                  </span>
                </div>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      activeCategory === "all"
                        ? "bg-zinc-800 text-white border-zinc-800"
                        : "border-zinc-200 text-zinc-600"
                    }`}
                  >
                    All
                  </button>
                  {Object.keys(CATEGORY_CONFIG)
                    .filter((cat) => mealPlan.groceryList.some((g) => g.category === cat))
                    .map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all capitalize ${
                          activeCategory === cat
                            ? "bg-zinc-800 text-white border-zinc-800"
                            : "border-zinc-200 text-zinc-600"
                        }`}
                      >
                        {CATEGORY_CONFIG[cat].emoji} {cat}
                      </button>
                    ))}
                </div>

                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {mealPlan.groceryList
                    .filter(
                      (g) => activeCategory === "all" || g.category === activeCategory
                    )
                    .map((item) => {
                      const idx = mealPlan.groceryList.indexOf(item);
                      const catCfg = CATEGORY_CONFIG[item.category] ?? {
                        emoji: "📦",
                        color: "bg-zinc-100 text-zinc-600",
                      };
                      return (
                        <label
                          key={idx}
                          className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-zinc-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checkedItems.has(idx)}
                            onChange={() => {
                              const next = new Set(checkedItems);
                              next.has(idx) ? next.delete(idx) : next.add(idx);
                              setCheckedItems(next);
                            }}
                            className="rounded accent-emerald-500 w-4 h-4 shrink-0"
                          />
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${catCfg.color}`}
                          >
                            {catCfg.emoji}
                          </span>
                          <span
                            className={`flex-1 text-sm ${
                              checkedItems.has(idx)
                                ? "line-through text-zinc-400"
                                : "text-zinc-700"
                            }`}
                          >
                            {item.item}
                          </span>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-zinc-400">{item.quantity}</div>
                            <div className="text-xs font-semibold text-zinc-700">
                              ₹{item.estimatedCost}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>

                <div className="border-t border-zinc-100 mt-3 pt-3 flex justify-between">
                  <span className="text-sm text-zinc-500">Total estimated</span>
                  <span className="font-bold text-zinc-900">
                    ₹{mealPlan.groceryList.reduce((s, g) => s + g.estimatedCost, 0)}
                  </span>
                </div>
              </div>

              {/* Cooking to-do list */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-zinc-800">📋 Cooking Schedule</h2>
                  <span className="text-xs text-zinc-500">
                    {checkedTodos.size}/{mealPlan.cookingTodoList.length} done
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {mealPlan.cookingTodoList.map((todo, i) => (
                    <label
                      key={i}
                      className="flex items-start gap-3 py-2 px-2 rounded-xl hover:bg-zinc-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checkedTodos.has(i)}
                        onChange={() => {
                          const next = new Set(checkedTodos);
                          next.has(i) ? next.delete(i) : next.add(i);
                          setCheckedTodos(next);
                        }}
                        className="rounded accent-emerald-500 w-4 h-4 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-zinc-800">{todo.time}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full border ${
                              PRIORITY_COLORS[todo.priority] ??
                              "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {todo.priority}
                          </span>
                          <span className="text-xs text-zinc-400">· {todo.duration}</span>
                        </div>
                        <p
                          className={`text-sm leading-snug ${
                            checkedTodos.has(i)
                              ? "line-through text-zinc-400"
                              : "text-zinc-700"
                          }`}
                        >
                          {todo.task}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="border-t border-zinc-100 mt-3 pt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-zinc-500">Progress</span>
                    <span className="text-xs font-semibold text-zinc-700">
                      {mealPlan.cookingTodoList.length > 0
                        ? Math.round(
                            (checkedTodos.size / mealPlan.cookingTodoList.length) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          mealPlan.cookingTodoList.length > 0
                            ? (checkedTodos.size / mealPlan.cookingTodoList.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Substitutions */}
            {mealPlan.substitutions.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-6">
                <h2 className="text-base font-bold text-zinc-800 mb-4">
                  🔄 Smart Substitutions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mealPlan.substitutions.map((sub, i) => (
                    <div
                      key={i}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-500 line-through">
                          {sub.original}
                        </span>
                        <span className="text-amber-500 font-bold">→</span>
                        <span className="text-sm font-bold text-zinc-800">
                          {sub.substitute}
                        </span>
                        {sub.savingsAmount > 0 && (
                          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            saves ₹{sub.savingsAmount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{sub.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition summary */}
            {mealPlan.nutritionSummary && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5 mb-6">
                <h2 className="text-base font-bold text-zinc-800 mb-2">
                  🫀 Nutrition Summary
                </h2>
                <p className="text-sm text-zinc-600 mb-3">
                  {mealPlan.nutritionSummary.balanceMessage}
                </p>
                <div className="flex flex-wrap gap-2">
                  {mealPlan.nutritionSummary.proteinSources?.map((p) => (
                    <span
                      key={p}
                      className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full"
                    >
                      💪 {p}
                    </span>
                  ))}
                  {mealPlan.nutritionSummary.veggiesIncluded?.map((v) => (
                    <span
                      key={v}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                    >
                      🥗 {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <button
                onClick={handleGenerate}
                className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                🔄 Regenerate Plan
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-12 rounded-2xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors"
              >
                ← Plan a Different Day
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}