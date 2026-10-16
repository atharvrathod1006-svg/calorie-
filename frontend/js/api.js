/**
 * API Client with Offline Resilience
 * Communicates with Flask backend and seamlessly falls back to client-side computation if offline.
 */

const API_BASE = window.location.origin.startsWith("http") ? window.location.origin : "http://127.0.0.1:5000";

const FALLBACK_FOODS = [
  { id: "p1", name: "Chicken Breast (Cooked, skinless)", category: "Protein", serving: "100g", calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, vegetarian: false },
  { id: "p2", name: "Salmon Fillet (Baked)", category: "Protein", serving: "100g", calories: 208, protein: 22.0, carbs: 0.0, fat: 13.0, vegetarian: false },
  { id: "p3", name: "Whole Large Egg", category: "Protein", serving: "1 large (50g)", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, vegetarian: true },
  { id: "p4", name: "Egg Whites", category: "Protein", serving: "100g (~3 whites)", calories: 52, protein: 11.0, carbs: 0.7, fat: 0.2, vegetarian: true },
  { id: "p5", name: "Canned Tuna in Water", category: "Protein", serving: "100g drained", calories: 116, protein: 26.0, carbs: 0.0, fat: 1.0, vegetarian: false },
  { id: "p6", name: "Lean Ground Beef (90/10)", category: "Protein", serving: "100g cooked", calories: 217, protein: 26.1, carbs: 0.0, fat: 11.8, vegetarian: false },
  { id: "p7", name: "Tofu (Firm)", category: "Protein", serving: "100g", calories: 83, protein: 10.0, carbs: 2.0, fat: 5.0, vegetarian: true },
  { id: "p8", name: "Whey Protein Powder", category: "Protein", serving: "1 scoop (30g)", calories: 120, protein: 24.0, carbs: 3.0, fat: 1.5, vegetarian: true },

  // Vegetarian Protein Staples
  { id: "v1", name: "Paneer (Indian Cottage Cheese)", category: "Protein", serving: "100g", calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, vegetarian: true },
  { id: "v2", name: "Low-Fat Paneer", category: "Protein", serving: "100g", calories: 150, protein: 25.0, carbs: 3.0, fat: 4.0, vegetarian: true },
  { id: "v3", name: "Soya Chunks / Meal Maker (Cooked)", category: "Protein", serving: "100g", calories: 120, protein: 17.0, carbs: 9.0, fat: 0.5, vegetarian: true },
  { id: "v4", name: "Boiled Chickpeas (Chana / Garbanzo)", category: "Protein", serving: "100g", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, vegetarian: true },
  { id: "v5", name: "Cooked Yellow Dal / Lentils", category: "Protein", serving: "100g (~1/2 cup)", calories: 116, protein: 9.0, carbs: 20.0, fat: 0.4, vegetarian: true },
  { id: "v6", name: "Kidney Beans / Rajma (Cooked)", category: "Protein", serving: "100g", calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, vegetarian: true },
  { id: "v7", name: "Moong Dal (Yellow Split, Cooked)", category: "Protein", serving: "100g", calories: 105, protein: 7.0, carbs: 19.0, fat: 0.4, vegetarian: true },
  { id: "v8", name: "Edamame (Steamed green soybeans)", category: "Protein", serving: "100g", calories: 122, protein: 11.9, carbs: 8.9, fat: 5.2, vegetarian: true },
  { id: "v9", name: "Tempeh (Cultured Soy)", category: "Protein", serving: "100g", calories: 192, protein: 20.3, carbs: 7.6, fat: 10.8, vegetarian: true },
  { id: "v10", name: "Black Beans (Cooked)", category: "Protein", serving: "100g", calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, vegetarian: true },
  { id: "v11", name: "Plant / Pea Protein Powder", category: "Protein", serving: "1 scoop (30g)", calories: 115, protein: 24.0, carbs: 2.0, fat: 1.5, vegetarian: true },

  // Carbs & Grains
  { id: "c1", name: "White Rice (Cooked)", category: "Carbs", serving: "1 cup (158g)", calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4, vegetarian: true },
  { id: "c2", name: "Brown Rice (Cooked)", category: "Carbs", serving: "1 cup (195g)", calories: 218, protein: 4.5, carbs: 45.8, fat: 1.6, vegetarian: true },
  { id: "c3", name: "Rolled Oats (Dry)", category: "Carbs", serving: "1/2 cup (40g)", calories: 150, protein: 5.0, carbs: 27.0, fat: 2.5, vegetarian: true },
  { id: "c4", name: "Whole Wheat Bread", category: "Carbs", serving: "1 slice (40g)", calories: 92, protein: 4.0, carbs: 17.0, fat: 1.2, vegetarian: true },
  { id: "c5", name: "Sweet Potato (Baked)", category: "Carbs", serving: "1 medium (150g)", calories: 135, protein: 3.0, carbs: 31.0, fat: 0.2, vegetarian: true },
  { id: "c7", name: "Pasta (Cooked)", category: "Carbs", serving: "1 cup (140g)", calories: 220, protein: 8.0, carbs: 43.0, fat: 1.3, vegetarian: true },
  { id: "c8", name: "Quinoa (Cooked)", category: "Carbs", serving: "1 cup (185g)", calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6, vegetarian: true },
  { id: "c9", name: "Whole Wheat Roti / Chapati", category: "Carbs", serving: "1 medium (40g)", calories: 120, protein: 3.5, carbs: 22.0, fat: 1.5, vegetarian: true },

  // Dairy
  { id: "d1", name: "Greek Yogurt (Non-fat, Plain)", category: "Dairy", serving: "1 cup (170g)", calories: 100, protein: 17.0, carbs: 6.0, fat: 0.7, vegetarian: true },
  { id: "d2", name: "Cottage Cheese (Low fat 2%)", category: "Dairy", serving: "1/2 cup (113g)", calories: 90, protein: 13.0, carbs: 4.5, fat: 2.5, vegetarian: true },
  { id: "d3", name: "Whole Milk", category: "Dairy", serving: "1 cup (244ml)", calories: 149, protein: 7.7, carbs: 11.7, fat: 8.0, vegetarian: true },
  { id: "d4", name: "Almond Milk (Unsweetened)", category: "Dairy", serving: "1 cup (240ml)", calories: 30, protein: 1.0, carbs: 1.0, fat: 2.5, vegetarian: true },
  { id: "d6", name: "Plain Dahi / Curd (Yogurt)", category: "Dairy", serving: "1 cup (200g)", calories: 120, protein: 7.0, carbs: 9.4, fat: 6.0, vegetarian: true },
  { id: "d7", name: "Soy Milk (Unsweetened)", category: "Dairy", serving: "1 cup (240ml)", calories: 80, protein: 7.0, carbs: 4.0, fat: 4.0, vegetarian: true },

  // Fruit & Veg
  { id: "f1", name: "Banana", category: "Fruit", serving: "1 medium (118g)", calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, vegetarian: true },
  { id: "f2", name: "Apple", category: "Fruit", serving: "1 medium (182g)", calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3, vegetarian: true },
  { id: "f4", name: "Broccoli (Steamed)", category: "Vegetable", serving: "1 cup (150g)", calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, vegetarian: true },
  { id: "f5", name: "Spinach / Palak (Cooked)", category: "Vegetable", serving: "1 cup (180g)", calories: 41, protein: 5.3, carbs: 6.7, fat: 0.5, vegetarian: true },
  { id: "f6", name: "Green Peas (Boiled)", category: "Vegetable", serving: "1 cup (160g)", calories: 134, protein: 8.6, carbs: 25.0, fat: 0.4, vegetarian: true },
  { id: "f7", name: "Avocado", category: "Fats", serving: "1/2 fruit (100g)", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, vegetarian: true },

  // Fats & Nuts
  { id: "n1", name: "Almonds", category: "Fats", serving: "1 oz (28g)", calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2, vegetarian: true },
  { id: "n2", name: "Peanut Butter (Natural)", category: "Fats", serving: "2 tbsp (32g)", calories: 190, protein: 8.0, carbs: 7.0, fat: 16.0, vegetarian: true },
  { id: "n3", name: "Roasted Peanuts", category: "Fats", serving: "1 oz (28g)", calories: 166, protein: 7.3, carbs: 4.6, fat: 14.1, vegetarian: true },
  { id: "n4", name: "Olive Oil (Extra Virgin)", category: "Fats", serving: "1 tbsp (14g)", calories: 119, protein: 0.0, carbs: 0.0, fat: 13.5, vegetarian: true },
  { id: "n6", name: "Chia Seeds (Raw)", category: "Fats", serving: "1 oz (28g)", calories: 138, protein: 4.7, carbs: 11.9, fat: 8.7, vegetarian: true },
  { id: "n7", name: "Hummus (Chickpea Dip)", category: "Fats", serving: "2 tbsp (30g)", calories: 75, protein: 2.4, carbs: 4.3, fat: 5.2, vegetarian: true },
];

const Api = {
  isOnline: false,

  async checkHealth() {
    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      const res = await window.SupabaseService.testConnection();
      this.isOnline = res.success;
      return res.success;
    }
    this.isOnline = false;
    return false;
  },

  async calculate(payload) {
    // Immediate 0ms local scientific calculation engine
    return this.calculateClientSide(payload);
  },

  async getFoods(query = "", category = "all") {
    // Local searchable food database with rich vegetarian items
    return FALLBACK_FOODS.filter(f => {
      const catLower = (category || "all").toLowerCase();
      let matchCat = false;
      if (catLower === "all") {
        matchCat = true;
      } else if (catLower === "vegetarian" || catLower === "veg") {
        matchCat = Boolean(f.vegetarian);
      } else {
        matchCat = f.category.toLowerCase() === catLower;
      }

      const q = (query || "").trim().toLowerCase();
      let matchQuery = true;
      if (q) {
        if (q === "veg" || q === "vegetarian") {
          matchQuery = Boolean(f.vegetarian);
        } else {
          matchQuery = f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
        }
      }
      return matchCat && matchQuery;
    });
  },

  async getMeals(date = "") {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = date || todayStr;

    // Check Supabase if configured
    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      const remoteMeals = await window.SupabaseService.fetchMeals(targetDate);
      if (remoteMeals && Array.isArray(remoteMeals) && remoteMeals.length > 0) {
        return {
          success: true,
          date: targetDate,
          meals: remoteMeals,
          totals: {
            calories: remoteMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
            protein: Math.round(remoteMeals.reduce((sum, m) => sum + (m.protein || 0), 0) * 10) / 10,
            carbs: Math.round(remoteMeals.reduce((sum, m) => sum + (m.carbs || 0), 0) * 10) / 10,
            fat: Math.round(remoteMeals.reduce((sum, m) => sum + (m.fat || 0), 0) * 10) / 10,
          }
        };
      }
    }

    this.ensureLocalHistorySeeded();
    const local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
    const filtered = targetDate === "all" ? local : local.filter(m => (m.date || todayStr) === targetDate);

    return {
      success: true,
      date: targetDate,
      meals: filtered,
      totals: {
        calories: filtered.reduce((sum, m) => sum + (m.calories || 0), 0),
        protein: Math.round(filtered.reduce((sum, m) => sum + (m.protein || 0), 0) * 10) / 10,
        carbs: Math.round(filtered.reduce((sum, m) => sum + (m.carbs || 0), 0) * 10) / 10,
        fat: Math.round(filtered.reduce((sum, m) => sum + (m.fat || 0), 0) * 10) / 10,
      }
    };
  },

  async addMeal(mealData) {
    const todayStr = new Date().toISOString().split("T")[0];
    const entryDate = mealData.date || todayStr;

    this.ensureLocalHistorySeeded();
    let local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
    let entry;
    if (mealData.food_id) {
      const f = FALLBACK_FOODS.find(item => item.id === mealData.food_id);
      const grams = mealData.grams ? parseFloat(mealData.grams) : null;
      let s = parseFloat(mealData.servings || 1.0);
      let servingLabel = `${s}x (${f ? f.serving : "1 portion"})`;
      if (grams) {
        s = grams / 100.0;
        servingLabel = `${grams}g`;
      }
      entry = {
        id: Math.random().toString(36).substring(2, 9),
        date: entryDate,
        meal_type: mealData.meal_type || "breakfast",
        name: f ? f.name : "Food Item",
        serving: servingLabel,
        grams: grams,
        calories: Math.round((f ? f.calories : 100) * s),
        protein: Math.round((f ? f.protein : 0) * s * 10) / 10,
        carbs: Math.round((f ? f.carbs : 0) * s * 10) / 10,
        fat: Math.round((f ? f.fat : 0) * s * 10) / 10,
        created_at: new Date().toISOString()
      };
    } else {
      const p = parseFloat(mealData.protein || 0);
      const c = parseFloat(mealData.carbs || 0);
      const f = parseFloat(mealData.fat || 0);
      let cals = parseInt(mealData.calories || 0);
      if (cals <= 0 && (p > 0 || c > 0 || f > 0)) {
        cals = Math.round((p * 4) + (c * 4) + (f * 9));
      }

      let servingStr = mealData.serving || "";
      if (mealData.grams) {
        if (!servingStr || servingStr.toLowerCase() === `${mealData.grams}g`) {
          servingStr = `${mealData.grams}g`;
        } else if (!servingStr.includes(`${mealData.grams}g`)) {
          servingStr = `${servingStr} (${mealData.grams}g)`;
        }
      } else if (!servingStr) {
        servingStr = "1 portion";
      }

      entry = {
        id: Math.random().toString(36).substring(2, 9),
        date: entryDate,
        meal_type: mealData.meal_type || "breakfast",
        name: mealData.name || "Custom Food",
        serving: servingStr,
        grams: mealData.grams ? parseFloat(mealData.grams) : null,
        calories: cals,
        protein: Math.round(p * 10) / 10,
        carbs: Math.round(c * 10) / 10,
        fat: Math.round(f * 10) / 10,
        created_at: new Date().toISOString()
      };
    }

    local.push(entry);
    localStorage.setItem("calorie_meals", JSON.stringify(local));

    // Save to Supabase if configured
    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      window.SupabaseService.insertMeal(entry).catch(err => console.warn("Supabase insert meal error:", err));
    }

    return entry;
  },

  async deleteMeal(mealId) {
    let local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
    local = local.filter(m => m.id !== mealId);
    localStorage.setItem("calorie_meals", JSON.stringify(local));

    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      window.SupabaseService.deleteMeal(mealId).catch(err => console.warn("Supabase delete meal error:", err));
    }
    return true;
  },

  async clearMeals(date = "") {
    if (date) {
      let local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
      local = local.filter(m => m.date !== date);
      localStorage.setItem("calorie_meals", JSON.stringify(local));
    } else {
      localStorage.removeItem("calorie_meals");
    }

    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      window.SupabaseService.clearMeals(date).catch(err => console.warn("Supabase clear meals error:", err));
    }
    return true;
  },

  async getHistory(period = "last_week", startDate = "", endDate = "", targetCalories = 2150) {
    this.ensureLocalHistorySeeded();
    let local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
    const today = new Date();

    let start = new Date(today);
    let end = new Date(today);
    let periodLabel = "Last 7 Days";

    if (period === "yesterday") {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      periodLabel = `Yesterday (${start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})`;
    } else if (period === "last_week" || period === "week" || period === "7d") {
      start.setDate(today.getDate() - 6);
      periodLabel = `Last 7 Days (${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
    } else if (period === "last_month" || period === "month" || period === "30d") {
      start.setDate(today.getDate() - 29);
      periodLabel = `Last 30 Days (${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
    } else if (period === "custom" && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      periodLabel = `Custom Period (${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
    }

    const startIso = start.toISOString().split("T")[0];
    const endIso = end.toISOString().split("T")[0];

    // If Supabase configured, check if we have remote records
    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      const remote = await window.SupabaseService.fetchHistory(startIso, endIso);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        local = remote;
      }
    }

    const dailyBreakdown = [];
    const periodMeals = [];
    let cur = new Date(start);
    let totalCals = 0, totalP = 0, totalC = 0, totalF = 0;
    let loggedDays = 0;

    while (cur <= end) {
      const curIso = cur.toISOString().split("T")[0];
      const dayMeals = local.filter(m => m.date === curIso);
      const dayCals = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
      const dayP = Math.round(dayMeals.reduce((s, m) => s + (m.protein || 0), 0) * 10) / 10;
      const dayC = Math.round(dayMeals.reduce((s, m) => s + (m.carbs || 0), 0) * 10) / 10;
      const dayF = Math.round(dayMeals.reduce((s, m) => s + (m.fat || 0), 0) * 10) / 10;

      if (dayCals > 0) loggedDays++;
      totalCals += dayCals;
      totalP += dayP;
      totalC += dayC;
      totalF += dayF;
      periodMeals.push(...dayMeals);

      dailyBreakdown.push({
        date: curIso,
        day_name: cur.toLocaleDateString("en-US", { weekday: "short" }),
        full_day: cur.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        calories: dayCals,
        target: targetCalories,
        delta: dayCals - targetCalories,
        protein: dayP,
        carbs: dayC,
        fat: dayF,
        meals_count: dayMeals.length,
        meals: dayMeals
      });

      cur.setDate(cur.getDate() + 1);
    }

    const dayCount = dailyBreakdown.length || 1;
    const dailyAvg = Math.round(totalCals / dayCount);
    const pCals = totalP * 4, cCals = totalC * 4, fCals = totalF * 9;
    const mSum = Math.max(1, pCals + cCals + fCals);

    return {
      success: true,
      period: period,
      period_label: periodLabel,
      start_date: startIso,
      end_date: endIso,
      day_count: dayCount,
      logged_days_count: loggedDays,
      target_calories: targetCalories,
      total_calories: totalCals,
      daily_avg_calories: dailyAvg,
      avg_delta: dailyAvg - targetCalories,
      macros: {
        total_protein: Math.round(totalP * 10) / 10,
        total_carbs: Math.round(totalC * 10) / 10,
        total_fat: Math.round(totalF * 10) / 10,
        avg_protein: Math.round((totalP / dayCount) * 10) / 10,
        avg_carbs: Math.round((totalC / dayCount) * 10) / 10,
        avg_fat: Math.round((totalF / dayCount) * 10) / 10,
        percentages: {
          protein: Math.round((pCals / mSum) * 100),
          carbs: Math.round((cCals / mSum) * 100),
          fat: Math.round((fCals / mSum) * 100)
        }
      },
      daily_breakdown: dailyBreakdown,
      meals: periodMeals
    };
  },

  async googleAuth(profile) {
    const user = {
      id: profile.sub || profile.id || "user_" + Math.random().toString(36).substr(2, 9),
      email: profile.email || "alex.morgan@gmail.com",
      name: profile.name || "Alex Morgan",
      picture: profile.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      provider: "google",
      logged_in_at: new Date().toISOString()
    };
    localStorage.setItem("nutriglance_user", JSON.stringify(user));
    return user;
  },

  ensureLocalHistorySeeded() {
    const existing = localStorage.getItem("calorie_meals");
    if (existing && JSON.parse(existing).length > 5) return;

    // Seed 30 days of realistic history if empty
    const today = new Date();
    const seeded = [];
    const sampleFoods = [
      { meal_type: "breakfast", name: "Rolled Oats with Almond Milk & Berries", serving: "1 bowl (180g)", calories: 284, protein: 9.1, carbs: 52.4, fat: 4.5 },
      { meal_type: "lunch", name: "Paneer (Indian Cottage Cheese) with Brown Rice", serving: "150g Paneer + 1 cup Rice", calories: 615, protein: 32.0, carbs: 47.0, fat: 32.8 },
      { meal_type: "dinner", name: "Cooked Yellow Dal with 2 Whole Wheat Rotis", serving: "1 bowl Dal + 2 Rotis", calories: 472, protein: 25.0, carbs: 64.0, fat: 3.8 },
      { meal_type: "snacks", name: "Greek Yogurt with Banana & Roasted Peanuts", serving: "1 cup + 1 fruit + nuts", calories: 371, protein: 25.6, carbs: 40.0, fat: 15.1 },
    ];

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dateStr = d.toISOString().split("T")[0];

      sampleFoods.forEach(item => {
        seeded.push({
          id: Math.random().toString(36).substr(2, 9),
          date: dateStr,
          meal_type: item.meal_type,
          name: item.name,
          serving: item.serving,
          grams: 150,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          created_at: `${dateStr}T12:00:00Z`
        });
      });
    }

    localStorage.setItem("calorie_meals", JSON.stringify(seeded));
  },

  calculateClientSide(payload) {
    const gender = (payload.gender || "male").toLowerCase();
    const age = parseInt(payload.age || 25);
    const unit = (payload.unit_system || "metric").toLowerCase();
    let weight = parseFloat(payload.weight || 70);
    let height = parseFloat(payload.height || 175);
    const heightInches = parseFloat(payload.height_inches || 0);

    let weightKg = weight;
    let heightCm = height;

    if (unit === "imperial") {
      weightKg = weight * 0.45359237;
      heightCm = (height * 12 + heightInches) * 2.54;
    }

    weightKg = Math.round(weightKg * 10) / 10;
    heightCm = Math.round(heightCm * 10) / 10;

    let targetWeightKg = null;
    if (payload.target_weight) {
      targetWeightKg = unit === "imperial" ? parseFloat(payload.target_weight) * 0.45359237 : parseFloat(payload.target_weight);
    }

    // BMR
    let bmr = 0;
    const formula = payload.formula || "mifflin";
    const bodyFat = payload.body_fat ? parseFloat(payload.body_fat) : null;

    if (formula === "katch" && bodyFat) {
      const lbm = weightKg * (1 - bodyFat / 100);
      bmr = Math.round(370 + 21.6 * lbm);
    } else if (formula === "harris") {
      if (gender === "male") {
        bmr = Math.round(88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age));
      } else {
        bmr = Math.round(447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age));
      }
    } else {
      // Mifflin-St Jeor
      if (gender === "male") {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
      } else {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
      }
    }

    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9
    };
    const factor = activityFactors[payload.activity_level] || 1.55;
    const tdee = Math.round(bmr * factor);

    const goalDeltas = {
      maintain: 0,
      mild_loss: -250,
      weight_loss: -500,
      extreme_loss: -1000,
      mild_gain: 250,
      weight_gain: 500
    };
    let dailyDelta = goalDeltas[payload.goal] !== undefined ? goalDeltas[payload.goal] : 0;
    if (payload.custom_delta !== undefined && payload.custom_delta !== null && payload.custom_delta !== "") {
      dailyDelta = parseInt(payload.custom_delta);
    }

    const targetCalories = Math.max(500, tdee + dailyDelta);

    // Macros
    const createSplit = (c_pct, p_pct, f_pct, label) => {
      const c_cals = Math.round(targetCalories * (c_pct / 100));
      const p_cals = Math.round(targetCalories * (p_pct / 100));
      const f_cals = Math.round(targetCalories * (f_pct / 100));
      return {
        label,
        percentages: { carbs: c_pct, protein: p_pct, fat: f_pct },
        calories: { carbs: c_cals, protein: p_cals, fat: f_cals, total: targetCalories },
        grams: { carbs: Math.round(c_cals / 4), protein: Math.round(p_cals / 4), fat: Math.round(f_cals / 9) },
        protein_per_kg: Math.round((Math.round(p_cals / 4) / weightKg) * 100) / 100
      };
    };

    const macros = {
      balanced: createSplit(45, 30, 25, "Balanced Diet"),
      high_protein: createSplit(35, 40, 25, "High Protein / Athletic"),
      low_carb: createSplit(20, 40, 40, "Low Carb"),
      keto: createSplit(5, 25, 70, "Ketogenic")
    };

    // Safety checks
    const minSafe = gender === "male" ? 1500 : 1200;
    const alerts = [];
    if (targetCalories < minSafe) {
      alerts.push({
        type: "danger",
        title: "Caloric Intake Critically Low",
        message: `A target of ${targetCalories} kcal is below the general clinical minimum (${minSafe} kcal for ${gender}s). A slower deficit is advised to protect lean muscle mass and metabolic health.`
      });
    } else if (targetCalories < bmr) {
      alerts.push({
        type: "warning",
        title: "Below Basal Metabolic Rate",
        message: `Your target (${targetCalories} kcal) is below your BMR (${bmr} kcal). Make sure to prioritize protein and resistance training.`
      });
    }

    // Timeline
    let timeline = { has_target: false, message: "Maintain current weight" };
    if (targetWeightKg && Math.abs(weightKg - targetWeightKg) > 0.1 && dailyDelta !== 0) {
      const diffKg = targetWeightKg - weightKg;
      const isLosing = diffKg < 0;
      if ((isLosing && dailyDelta < 0) || (!isLosing && dailyDelta > 0)) {
        const totalNeededKcal = Math.abs(diffKg) * 7700;
        const daysNeeded = Math.ceil(totalNeededKcal / Math.abs(dailyDelta));
        const weeksNeeded = Math.round((daysNeeded / 7) * 10) / 10;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysNeeded);
        timeline = {
          has_target: true,
          achievable: true,
          current_weight_kg: weightKg,
          target_weight_kg: Math.round(targetWeightKg * 10) / 10,
          weight_change_kg: Math.round(diffKg * 10) / 10,
          days_needed: daysNeeded,
          weeks_needed: weeksNeeded,
          projected_date: targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          weekly_rate_kg: Math.round((Math.abs(dailyDelta) * 7 / 7700) * 100) / 100
        };
      }
    }

    const heightM = heightCm / 100;
    const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    let bmiCategory = "Normal weight";
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
    else if (bmi >= 30) bmiCategory = "Obese";

    return {
      inputs: { gender, age, weight_kg: weightKg, height_cm: heightCm, unit_system: unit, formula },
      bmi: { score: bmi, category: bmiCategory },
      bmr,
      tdee,
      daily_calorie_delta: dailyDelta,
      target_calories: targetCalories,
      safety: { is_safe: alerts.filter(a => a.type === "danger").length === 0, min_safe_calories: minSafe, alerts },
      macros,
      timeline,
      meal_distribution: {
        breakfast: { percentage: 25, calories: Math.round(targetCalories * 0.25) },
        lunch: { percentage: 35, calories: Math.round(targetCalories * 0.35) },
        dinner: { percentage: 30, calories: Math.round(targetCalories * 0.30) },
        snacks: { percentage: 10, calories: Math.round(targetCalories * 0.10) }
      },
      energy_breakdown: {
        bmr,
        tef: Math.round(tdee * 0.10),
        neat: Math.round(tdee * 0.15),
        eat: Math.max(0, tdee - (bmr + Math.round(tdee * 0.25))),
        tdee
      }
    };
  }
};
