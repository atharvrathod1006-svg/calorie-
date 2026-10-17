/**
 * NutriGlance Calorie Tracker Main Application Logic
 */

let macroChart = null;
let historyChart = null;
let currentCalculation = null;
let activeMacroPreset = "balanced";
let activeMealDate = new Date().toISOString().split("T")[0];
let currentHistoryPeriod = "last_week";
let customHistoryStartDate = "";
let customHistoryEndDate = "";
let currentHistoryData = null;
let currentUser = null;
let currentUnitSystem = "metric";

// Time of day helper to default meal category logically
function getDefaultMealCategory() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 19) return "snacks";
  return "dinner";
}
window.getDefaultMealCategory = getDefaultMealCategory;

function setUnitSystem(unit) {
  if (unit === currentUnitSystem) return;
  const oldUnit = currentUnitSystem;
  currentUnitSystem = unit;

  const metricBtn = document.getElementById("unitMetricBtn");
  const imperialBtn = document.getElementById("unitImperialBtn");
  const metricHeight = document.getElementById("metricHeightContainer");
  const imperialHeight = document.getElementById("imperialHeightContainer");
  const weightLabel = document.getElementById("weightUnitLabel");
  const targetWeightLabel = document.getElementById("targetWeightUnitLabel");

  const weightInput = document.getElementById("weightInput");
  const targetWeightInput = document.getElementById("targetWeightInput");
  const heightCmInput = document.getElementById("heightCmInput");
  const heightFeetInput = document.getElementById("heightFeetInput");
  const heightInchesInput = document.getElementById("heightInchesInput");

  if (unit === "imperial") {
    if (metricBtn) { metricBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"; }
    if (imperialBtn) { imperialBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-blue-600 text-white shadow-sm"; }
    if (metricHeight) metricHeight.classList.add("hidden");
    if (imperialHeight) imperialHeight.classList.remove("hidden");
    if (weightLabel) weightLabel.textContent = "lbs";
    if (targetWeightLabel) targetWeightLabel.textContent = "lbs";

    // Convert values from metric to imperial
    if (weightInput && weightInput.value) {
      weightInput.value = Math.round(parseFloat(weightInput.value) * 2.20462);
    }
    if (targetWeightInput && targetWeightInput.value) {
      targetWeightInput.value = Math.round(parseFloat(targetWeightInput.value) * 2.20462);
    }
    if (heightCmInput && heightCmInput.value) {
      const totalIn = Math.round(parseFloat(heightCmInput.value) / 2.54);
      const ft = Math.floor(totalIn / 12);
      const inRem = totalIn % 12;
      if (heightFeetInput) heightFeetInput.value = ft;
      if (heightInchesInput) heightInchesInput.value = inRem;
    }
  } else {
    if (metricBtn) { metricBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-blue-600 text-white shadow-sm"; }
    if (imperialBtn) { imperialBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"; }
    if (metricHeight) metricHeight.classList.remove("hidden");
    if (imperialHeight) imperialHeight.classList.add("hidden");
    if (weightLabel) weightLabel.textContent = "kg";
    if (targetWeightLabel) targetWeightLabel.textContent = "kg";

    // Convert values from imperial to metric
    if (weightInput && weightInput.value) {
      weightInput.value = Math.round((parseFloat(weightInput.value) / 2.20462) * 10) / 10;
    }
    if (targetWeightInput && targetWeightInput.value) {
      targetWeightInput.value = Math.round((parseFloat(targetWeightInput.value) / 2.20462) * 10) / 10;
    }
    if (heightFeetInput && heightInchesInput) {
      const ft = parseInt(heightFeetInput.value || 5);
      const inRem = parseInt(heightInchesInput.value || 9);
      const cm = Math.round(((ft * 12) + inRem) * 2.54);
      if (heightCmInput) heightCmInput.value = cm;
    }
  }

  saveFormData();
  calculateAndRender(false);
}
window.setUnitSystem = setUnitSystem;

// DOM Elements
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initGoalSelection();
  initFormulaToggle();
  initCustomMacroSliders();
  initEventListeners();
  initFoodSearch();
  initActiveMealDate();

  // Check Supabase cloud database status
  await updateSupabaseStatusIndicator();
  await initSupabaseAuth();

  // Load saved form data or run default calculation
  loadSavedFormData();
  calculateAndRender();

  // Load meals & historical analytics
  await loadMeals();
  await loadHistory(currentHistoryPeriod);
});

// -------------------------------------------------------------
// Theme Management
// -------------------------------------------------------------
function initTheme() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      localStorage.setItem("theme", currentTheme);
      updateThemeIcon();
      if (macroChart) {
        updateChartColors();
      }
    });
  }
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains("dark");
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.innerHTML = isDark
      ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
      : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
  }
}

// -------------------------------------------------------------
// Supabase Cloud Connection & Modal Handlers
// -------------------------------------------------------------
async function updateSupabaseStatusIndicator() {
  const statusText = document.getElementById("supabaseStatusText");
  const statusDot = document.getElementById("supabaseStatusDot");
  const alertBox = document.getElementById("supabaseConnectionAlert");
  const alertMsg = document.getElementById("supabaseAlertMessage");
  const alertDot = document.getElementById("supabaseAlertDot");

  const isConfigured = window.SupabaseService && window.SupabaseService.isConfigured();

  if (isConfigured) {
    if (statusText) statusText.textContent = "Supabase Connected";
    if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";

    if (alertBox) alertBox.className = "p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between";
    if (alertMsg) alertMsg.textContent = "Status: Supabase connected to project";
    if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
  } else {
    if (statusText) statusText.textContent = "Connect Supabase";
    if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-amber-400";

    if (alertBox) alertBox.className = "p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between";
    if (alertMsg) alertMsg.textContent = "Status: Running in offline LocalStorage mode";
    if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-slate-400";
  }
}

window.openSupabaseModal = function() {
  const modal = document.getElementById("supabaseConfigModal");
  if (!modal) return;
  modal.classList.remove("hidden");

  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  const sqlPre = document.getElementById("supabaseSqlPre");

  if (urlInput && window.SupabaseService) urlInput.value = window.SupabaseService.getUrl();
  if (keyInput && window.SupabaseService) keyInput.value = window.SupabaseService.getAnonKey();
  if (sqlPre && typeof SUPABASE_SQL_SCHEMA !== "undefined") {
    sqlPre.textContent = SUPABASE_SQL_SCHEMA;
  }

  updateSupabaseStatusIndicator();
};

window.closeSupabaseModal = function() {
  const modal = document.getElementById("supabaseConfigModal");
  if (modal) modal.classList.add("hidden");
};

window.handleSaveSupabaseConfig = async function() {
  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  const alertMsg = document.getElementById("supabaseAlertMessage");
  const alertDot = document.getElementById("supabaseAlertDot");

  const url = urlInput ? urlInput.value.trim() : "";
  const key = keyInput ? keyInput.value.trim() : "";

  if (!url || !key) {
    alert("Please enter both the Supabase Project URL and Anon API Key.");
    return;
  }

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  if (!service) {
    if (alertMsg) alertMsg.textContent = "Supabase module is still initializing. Please wait a moment and try again.";
    if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500";
    return;
  }

  try {
    if (alertMsg) alertMsg.textContent = "Testing connection to Supabase...";
    service.saveCredentials(url, key);
    const test = await service.testConnection();

    if (test.success) {
      if (alertMsg) alertMsg.textContent = "✓ Connected! Syncing existing meals to cloud...";
      if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
      
      try {
        const syncRes = await service.syncLocalMeals();
        if (syncRes && syncRes.count > 0) {
          if (alertMsg) alertMsg.textContent = `✓ Connected & uploaded ${syncRes.count} meals to Supabase!`;
        } else {
          if (alertMsg) alertMsg.textContent = test.message || "✓ Connected to Supabase successfully!";
        }
      } catch (syncErr) {
        console.warn("Auto-sync error:", syncErr);
      }

      updateSupabaseStatusIndicator();
      setTimeout(() => {
        closeSupabaseModal();
        loadMeals();
        loadHistory(currentHistoryPeriod);
      }, 1500);
    } else {
      if (alertMsg) alertMsg.textContent = test.message;
      if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500";
      updateSupabaseStatusIndicator();
    }
  } catch (err) {
    if (alertMsg) alertMsg.textContent = "Error: " + err.message;
    if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
  }
};

window.handleSyncLocalMealsToCloud = async function() {
  const btn = document.getElementById("syncToCloudBtn");
  const alertMsg = document.getElementById("supabaseAlertMessage");
  const alertDot = document.getElementById("supabaseAlertDot");

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  if (!service || !service.isConfigured()) {
    alert("Please enter and save your Supabase credentials first.");
    return;
  }

  if (btn) btn.disabled = true;
  if (alertMsg) alertMsg.textContent = "Syncing local meals to Supabase cloud...";

  try {
    const res = await service.syncLocalMeals();
    if (res.success) {
      if (alertMsg) alertMsg.textContent = `✓ ${res.message || 'Synced successfully!'}`;
      if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
      await loadMeals();
    } else {
      if (alertMsg) alertMsg.textContent = `Sync failed: ${res.message}. (Did you run the SQL script in Supabase?)`;
      if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
    }
  } catch (e) {
    if (alertMsg) alertMsg.textContent = "Error during sync: " + e.message;
    if (alertDot) alertDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
  }
  if (btn) btn.disabled = false;
};

window.handleClearSupabaseConfig = function() {
  if (confirm("Disconnect Supabase and switch back to offline LocalStorage mode?")) {
    const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
    if (service) service.clearCredentials();
    const urlInput = document.getElementById("supabaseUrlInput");
    const keyInput = document.getElementById("supabaseKeyInput");
    if (urlInput) urlInput.value = "";
    if (keyInput) keyInput.value = "";
    updateSupabaseStatusIndicator();
  }
};

window.copySupabaseSqlScript = function() {
  if (typeof SUPABASE_SQL_SCHEMA !== "undefined") {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA).then(() => {
      const btn = document.getElementById("copySqlBtn");
      if (btn) {
        btn.textContent = "✓ Copied!";
        setTimeout(() => { btn.textContent = "Copy SQL"; }, 2000);
      }
    });
  }
};



// -------------------------------------------------------------
// Goal Selection & Custom Deficit
// -------------------------------------------------------------
function initGoalSelection() {
  const goalSelect = document.getElementById("goalSelect");
  const customGoalContainer = document.getElementById("customGoalContainer");

  if (goalSelect) {
    goalSelect.addEventListener("change", () => {
      const isCustom = goalSelect.value === "custom";
      if (customGoalContainer) {
        customGoalContainer.classList.toggle("hidden", !isCustom);
      }
      calculateAndRender();
    });
  }
}

// -------------------------------------------------------------
// Formula Selection & Body Fat Toggle
// -------------------------------------------------------------
function initFormulaToggle() {
  const formulaSelect = document.getElementById("formulaSelect");
  const bodyFatContainer = document.getElementById("bodyFatContainer");

  if (formulaSelect) {
    formulaSelect.addEventListener("change", () => {
      const isKatch = formulaSelect.value === "katch";
      if (bodyFatContainer) {
        bodyFatContainer.classList.toggle("hidden", !isKatch);
      }
      calculateAndRender();
    });
  }
}

// -------------------------------------------------------------
// Custom Macro Sliders
// -------------------------------------------------------------
function initCustomMacroSliders() {
  const carbsSlider = document.getElementById("customCarbsSlider");
  const proteinSlider = document.getElementById("customProteinSlider");
  const fatSlider = document.getElementById("customFatSlider");

  const carbsVal = document.getElementById("customCarbsVal");
  const proteinVal = document.getElementById("customProteinVal");
  const fatVal = document.getElementById("customFatVal");
  const totalVal = document.getElementById("customTotalVal");

  function updateCustomValues() {
    if (!carbsSlider || !proteinSlider || !fatSlider) return;

    const c = parseInt(carbsSlider.value);
    const p = parseInt(proteinSlider.value);
    const f = parseInt(fatSlider.value);
    const total = c + p + f;

    carbsVal.textContent = `${c}%`;
    proteinVal.textContent = `${p}%`;
    fatVal.textContent = `${f}%`;
    totalVal.textContent = `${total}%`;

    if (total === 100) {
      totalVal.className = "text-emerald-600 dark:text-emerald-400 font-bold";
    } else {
      totalVal.className = "text-red-500 font-bold";
    }

    if (activeMacroPreset === "custom" && currentCalculation) {
      applyMacroSplit("custom", { carbs_pct: c, protein_pct: p, fat_pct: f });
    }
  }

  [carbsSlider, proteinSlider, fatSlider].forEach(slider => {
    if (slider) slider.addEventListener("input", updateCustomValues);
  });
}

// -------------------------------------------------------------
// Event Listeners
// -------------------------------------------------------------
function initEventListeners() {
  const form = document.getElementById("calorieForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleCalculateClick(e);
    });

    // Instant calculation on any input change (0ms delay)
    form.querySelectorAll("input, select").forEach(input => {
      input.addEventListener("input", () => {
        saveFormData();
        calculateAndRender();
      });
      input.addEventListener("change", () => {
        saveFormData();
        calculateAndRender();
      });
    });
  }

  // Gender Radio buttons
  const genderRadios = document.querySelectorAll("input[name='gender']");
  genderRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      saveFormData();
      calculateAndRender();
    });
  });

  // Macro Preset Buttons
  const presetBtns = document.querySelectorAll(".macro-preset-btn");
  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      presetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const presetKey = btn.dataset.preset;
      activeMacroPreset = presetKey;

      const customContainer = document.getElementById("customMacroSlidersContainer");
      if (customContainer) {
        customContainer.classList.toggle("hidden", presetKey !== "custom");
      }

      if (currentCalculation) {
        let customSplit = null;
        if (presetKey === "custom") {
          customSplit = {
            carbs_pct: parseInt(document.getElementById("customCarbsSlider").value || 40),
            protein_pct: parseInt(document.getElementById("customProteinSlider").value || 30),
            fat_pct: parseInt(document.getElementById("customFatSlider").value || 30)
          };
        }
        applyMacroSplit(presetKey, customSplit);
      }
    });
  });

  // Print Report Button
  const printBtn = document.getElementById("printReportBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  // Meal Clear Button
  const clearMealsBtn = document.getElementById("clearMealsBtn");
  if (clearMealsBtn) {
    clearMealsBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear today's logged meals?")) {
        await Api.clearMeals();
        await loadMeals();
      }
    });
  }

  // Custom Food Form & Real-time Listeners
  const customFoodForm = document.getElementById("customFoodForm");
  if (customFoodForm) {
    customFoodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleCustomFoodSubmit(e);
    });

    // Real-time preview updates on typing
    const customInputs = ["customFoodName", "customFoodGrams", "customFoodCalories", "customFoodProtein", "customFoodCarbs", "customFoodFat", "customFoodServing", "customFoodMealType"];
    customInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          if (id === "customFoodGrams") onCustomGramsChanged();
          else updateCustomFoodPreview();
        });
        el.addEventListener("change", () => {
          if (id === "customFoodGrams") onCustomGramsChanged();
          else updateCustomFoodPreview();
        });
      }
    });
  }
}

// -------------------------------------------------------------
// Calculation & UI Render (Instant 0ms + Async Server Sync)
// -------------------------------------------------------------
function calculateAndRender(forceAnimate = false) {
  const payload = collectFormData();
  if (!payload) return;

  // 1. Instantaneous 0ms Synchronous Calculation for immediate responsiveness
  const instantResult = Api.calculateClientSide(payload);
  currentCalculation = instantResult;
  renderResults(instantResult, forceAnimate);

  // 2. Non-blocking asynchronous sync with backend if online
  if (Api.isOnline) {
    Api.calculate(payload).then(serverResult => {
      if (serverResult) {
        currentCalculation = serverResult;
        renderResults(serverResult, false);
      }
    }).catch(() => {});
  }
}

function collectFormData() {
  const gender = document.querySelector("input[name='gender']:checked")?.value || "male";
  const age = parseInt(document.getElementById("ageInput")?.value || 25);
  const unit_system = currentUnitSystem || "metric";

  const weight = parseFloat(document.getElementById("weightInput")?.value || 70);
  const targetWeight = document.getElementById("targetWeightInput")?.value || null;

  let height = 175;
  let height_inches = 0;
  if (unit_system === "imperial") {
    height = parseFloat(document.getElementById("heightFeetInput")?.value || 5);
    height_inches = parseFloat(document.getElementById("heightInchesInput")?.value || 9);
  } else {
    height = parseFloat(document.getElementById("heightCmInput")?.value || 175);
  }

  const activity_level = document.getElementById("activitySelect")?.value || "moderate";
  const formula = document.getElementById("formulaSelect")?.value || "mifflin";
  const body_fat = document.getElementById("bodyFatInput")?.value || null;

  const goal = document.getElementById("goalSelect")?.value || "maintain";
  let custom_delta = null;
  if (goal === "custom") {
    custom_delta = document.getElementById("customGoalDeltaInput")?.value || 0;
  }

  let custom_split = null;
  if (activeMacroPreset === "custom") {
    custom_split = {
      carbs_pct: parseInt(document.getElementById("customCarbsSlider")?.value || 45),
      protein_pct: parseInt(document.getElementById("customProteinSlider")?.value || 30),
      fat_pct: parseInt(document.getElementById("customFatSlider")?.value || 25)
    };
  }

  return {
    gender,
    age,
    unit_system,
    weight,
    height,
    height_inches,
    target_weight: targetWeight,
    activity_level,
    formula,
    body_fat,
    goal,
    custom_delta,
    custom_split
  };
}

function renderResults(data, forceAnimate = false) {
  const errBanner = document.getElementById("formErrorBanner");
  const errMsg = document.getElementById("formErrorMessage");

  if (!data || data.error) {
    if (errBanner && errMsg && data?.error) {
      errMsg.textContent = data.error;
      errBanner.classList.remove("hidden");
    }
    return;
  } else if (errBanner) {
    errBanner.classList.add("hidden");
  }

  // Hero values
  animateNumber("targetCaloriesVal", data.target_calories, forceAnimate);
  animateNumber("bmrVal", data.bmr, forceAnimate);
  animateNumber("tdeeVal", data.tdee, forceAnimate);

  // BMI Card
  const bmiVal = document.getElementById("bmiVal");
  const bmiBadge = document.getElementById("bmiBadge");
  if (bmiVal && data.bmi) {
    bmiVal.textContent = data.bmi.score;
    if (bmiBadge) {
      bmiBadge.textContent = data.bmi.category;
      let badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      if (data.bmi.category === "Normal weight") {
        badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
      } else if (data.bmi.category === "Overweight") {
        badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
      } else if (data.bmi.category === "Obese" || data.bmi.category === "Underweight") {
        badgeColor = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      }
      bmiBadge.className = `text-xs px-2 py-0.5 rounded font-semibold ${badgeColor}`;
    }
  }

  // Daily Delta Display
  const deltaVal = document.getElementById("dailyDeltaVal");
  if (deltaVal) {
    const delta = data.daily_calorie_delta;
    if (delta > 0) {
      deltaVal.innerHTML = `<span class="text-emerald-500">+${delta} kcal</span> (Surplus)`;
    } else if (delta < 0) {
      deltaVal.innerHTML = `<span class="text-blue-500">${delta} kcal</span> (Deficit)`;
    } else {
      deltaVal.innerHTML = `<span class="text-slate-500">0 kcal</span> (Maintenance)`;
    }
  }

  // Clinical Safety Alerts
  renderSafetyAlerts(data.safety);

  // Target Timeline Card
  renderTimelineCard(data.timeline);

  // Energy Expenditure Breakdown Bar
  renderEnergyBreakdown(data.energy_breakdown);

  // Meal Distribution
  renderMealDistribution(data.meal_distribution);

  // Apply Macro Split
  applyMacroSplit(activeMacroPreset, data.inputs?.custom_split);

  // Update Meal Tracker Goal reference
  updateMealGoalTracker();
}

function renderSafetyAlerts(safety) {
  const container = document.getElementById("safetyAlertsContainer");
  if (!container) return;

  if (!safety || !safety.alerts || safety.alerts.length === 0) {
    container.innerHTML = `
      <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Optimal & Safe Intake</h4>
          <p class="text-xs text-emerald-700 dark:text-emerald-400">Caloric intake is within safe physiological bounds for sustainable body composition changes.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = safety.alerts.map(a => {
    const isDanger = a.type === "danger";
    const bgClass = isDanger ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300" : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300";
    const iconClass = isDanger ? "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400";

    return `
      <div class="p-3.5 rounded-xl border flex items-start gap-3 ${bgClass} mb-2">
        <div class="w-8 h-8 rounded-lg ${iconClass} flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <div>
          <h4 class="text-xs font-bold">${a.title}</h4>
          <p class="text-xs mt-0.5 opacity-90">${a.message}</p>
        </div>
      </div>
    `;
  }).join("");
}

function renderTimelineCard(timeline) {
  const card = document.getElementById("timelineCard");
  if (!card) return;

  if (!timeline || !timeline.has_target) {
    card.classList.add("hidden");
    return;
  }

  card.classList.remove("hidden");
  const dateVal = document.getElementById("timelineDateVal");
  const weeksVal = document.getElementById("timelineWeeksVal");
  const paceVal = document.getElementById("timelinePaceVal");
  const messageVal = document.getElementById("timelineMessageVal");

  if (timeline.achievable) {
    const isImperial = currentUnitSystem === "imperial";
    dateVal.textContent = timeline.projected_date;
    weeksVal.textContent = `${timeline.weeks_needed} weeks (${timeline.days_needed} days)`;

    if (isImperial) {
      const weeklyLbs = Math.round(timeline.weekly_rate_kg * 2.20462 * 10) / 10;
      const targetLbs = Math.round(timeline.target_weight_kg * 2.20462 * 10) / 10;
      const currentLbs = Math.round(timeline.current_weight_kg * 2.20462 * 10) / 10;
      paceVal.textContent = `${weeklyLbs} lbs/week (~${timeline.weekly_rate_kg} kg)`;
      messageVal.textContent = `Pacing to reach ${targetLbs} lbs from ${currentLbs} lbs with your current daily deficit/surplus.`;
    } else {
      paceVal.textContent = `${timeline.weekly_rate_kg} kg/week (~${Math.round(timeline.weekly_rate_kg * 2.20462 * 10) / 10} lbs)`;
      messageVal.textContent = `Pacing to reach ${timeline.target_weight_kg} kg from ${timeline.current_weight_kg} kg with your current daily deficit/surplus.`;
    }
  } else {
    dateVal.textContent = "--";
    weeksVal.textContent = "--";
    paceVal.textContent = "--";
    messageVal.textContent = timeline.message;
  }
}

function renderEnergyBreakdown(breakdown) {
  if (!breakdown) return;
  const bmrBar = document.getElementById("energyBmrBar");
  const tefBar = document.getElementById("energyTefBar");
  const neatBar = document.getElementById("energyNeatBar");
  const eatBar = document.getElementById("energyEatBar");

  const total = breakdown.tdee || 1;
  const bmrPct = Math.round((breakdown.bmr / total) * 100);
  const tefPct = Math.round((breakdown.tef / total) * 100);
  const neatPct = Math.round((breakdown.neat / total) * 100);
  const eatPct = Math.max(0, 100 - (bmrPct + tefPct + neatPct));

  if (bmrBar) { bmrBar.style.width = `${bmrPct}%`; bmrBar.title = `BMR: ${breakdown.bmr} kcal (${bmrPct}%)`; }
  if (tefBar) { tefBar.style.width = `${tefPct}%`; tefBar.title = `TEF: ${breakdown.tef} kcal (${tefPct}%)`; }
  if (neatBar) { neatBar.style.width = `${neatPct}%`; neatBar.title = `NEAT: ${breakdown.neat} kcal (${neatPct}%)`; }
  if (eatBar) { eatBar.style.width = `${eatPct}%`; eatBar.title = `Exercise: ${breakdown.eat} kcal (${eatPct}%)`; }

  const bmrLegend = document.getElementById("legendBmrVal");
  const tefLegend = document.getElementById("legendTefVal");
  const neatLegend = document.getElementById("legendNeatVal");
  const eatLegend = document.getElementById("legendEatVal");

  if (bmrLegend) bmrLegend.textContent = `${breakdown.bmr} kcal`;
  if (tefLegend) tefLegend.textContent = `${breakdown.tef} kcal`;
  if (neatLegend) neatLegend.textContent = `${breakdown.neat} kcal`;
  if (eatLegend) eatLegend.textContent = `${breakdown.eat} kcal`;
}

function renderMealDistribution(dist) {
  if (!dist) return;
  const b = document.getElementById("mealBreakfastCal");
  const l = document.getElementById("mealLunchCal");
  const d = document.getElementById("mealDinnerCal");
  const s = document.getElementById("mealSnacksCal");

  if (b) b.textContent = `${dist.breakfast.calories} kcal`;
  if (l) l.textContent = `${dist.lunch.calories} kcal`;
  if (d) d.textContent = `${dist.dinner.calories} kcal`;
  if (s) s.textContent = `${dist.snacks.calories} kcal`;
}

// -------------------------------------------------------------
// Macronutrient Split & Donut Chart
// -------------------------------------------------------------
function applyMacroSplit(presetKey, customSplit) {
  if (!currentCalculation) return;

  const weightKg = currentCalculation.inputs?.weight_kg || (currentUnitSystem === "imperial" ? (parseFloat(document.getElementById("weightInput")?.value || 154) / 2.20462) : parseFloat(document.getElementById("weightInput")?.value || 70));

  let splitData;
  if (presetKey === "custom" && customSplit) {
    const target = currentCalculation.target_calories;
    const c_cals = Math.round(target * (customSplit.carbs_pct / 100));
    const p_cals = Math.round(target * (customSplit.protein_pct / 100));
    const f_cals = Math.round(target * (customSplit.fat_pct / 100));
    const p_grams = Math.round(p_cals / 4);
    splitData = {
      label: "Custom Split",
      percentages: customSplit,
      calories: { carbs: c_cals, protein: p_cals, fat: f_cals, total: target },
      grams: { carbs: Math.round(c_cals / 4), protein: p_grams, fat: Math.round(f_cals / 9) },
      protein_per_kg: Math.round((p_grams / Math.max(1, weightKg)) * 100) / 100
    };
  } else {
    splitData = currentCalculation.macros[presetKey] || currentCalculation.macros.balanced;
  }

  // Update cards
  const carbGrams = document.getElementById("macroCarbsGrams");
  const carbCals = document.getElementById("macroCarbsCals");
  const carbPct = document.getElementById("macroCarbsPct");

  const proteinGrams = document.getElementById("macroProteinGrams");
  const proteinCals = document.getElementById("macroProteinCals");
  const proteinPct = document.getElementById("macroProteinPct");
  const proteinPerKg = document.getElementById("macroProteinPerKg");

  const fatGrams = document.getElementById("macroFatGrams");
  const fatCals = document.getElementById("macroFatCals");
  const fatPct = document.getElementById("macroFatPct");

  if (carbGrams) carbGrams.textContent = `${splitData.grams.carbs}g`;
  if (carbCals) carbCals.textContent = `${splitData.calories.carbs} kcal`;
  if (carbPct) carbPct.textContent = `${splitData.percentages.carbs}%`;

  if (proteinGrams) proteinGrams.textContent = `${splitData.grams.protein}g`;
  if (proteinCals) proteinCals.textContent = `${splitData.calories.protein} kcal`;
  if (proteinPct) proteinPct.textContent = `${splitData.percentages.protein}%`;

  if (proteinPerKg) {
    const pGrams = splitData.grams.protein;
    const pPerKg = Math.round((pGrams / Math.max(1, weightKg)) * 100) / 100;
    const pPerLb = Math.round((pGrams / Math.max(1, weightKg * 2.20462)) * 100) / 100;

    if (currentUnitSystem === "imperial") {
      proteinPerKg.textContent = `${pPerLb} g/lb (${pPerKg} g/kg)`;
    } else {
      proteinPerKg.textContent = `${pPerKg} g/kg bodyweight`;
    }
  }

  if (fatGrams) fatGrams.textContent = `${splitData.grams.fat}g`;
  if (fatCals) fatCals.textContent = `${splitData.calories.fat} kcal`;
  if (fatPct) fatPct.textContent = `${splitData.percentages.fat}%`;

  renderMacroChart(splitData);
}

function renderMacroChart(split) {
  const canvas = document.getElementById("macroChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const data = [split.calories.carbs, split.calories.protein, split.calories.fat];
  const labels = ["Carbohydrates", "Protein", "Fats"];

  if (macroChart) {
    macroChart.data.datasets[0].data = data;
    macroChart.update();
    return;
  }

  const isDark = document.documentElement.classList.contains("dark");

  macroChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          "#3b82f6", // Carbs: Blue
          "#ef4444", // Protein: Red
          "#f59e0b", // Fat: Amber
        ],
        borderWidth: 2,
        borderColor: isDark ? "#1e293b" : "#ffffff",
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = Math.round((val / total) * 100);
              const grams = label === "Fats" ? Math.round(val / 9) : Math.round(val / 4);
              return ` ${label}: ${val} kcal (${pct}%) • ${grams}g`;
            }
          }
        }
      }
    }
  });
}

function updateChartColors() {
  if (!macroChart) return;
  const isDark = document.documentElement.classList.contains("dark");
  macroChart.data.datasets[0].borderColor = isDark ? "#1e293b" : "#ffffff";
  macroChart.update();
}

// -------------------------------------------------------------
// Interactive Meal Tracker & Food Database
// -------------------------------------------------------------
async function initFoodSearch() {
  const searchInput = document.getElementById("foodSearchInput");
  const categoryTabs = document.querySelectorAll(".food-cat-btn");
  let activeCategory = "all";

  async function performSearch() {
    const q = searchInput?.value || "";
    const foods = await Api.getFoods(q, activeCategory);
    renderFoodSearchResults(foods);
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce(performSearch, 50));
  }

  categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      categoryTabs.forEach(t => {
        t.classList.remove("bg-blue-600", "bg-emerald-600", "text-white");
        t.classList.add("text-slate-600", "dark:text-slate-300");
      });
      if (tab.dataset.category === "vegetarian") {
        tab.classList.add("bg-emerald-600", "text-white");
      } else {
        tab.classList.add("bg-blue-600", "text-white");
      }
      tab.classList.remove("text-slate-600", "dark:text-slate-300");

      activeCategory = tab.dataset.category;
      performSearch();
    });
  });

  // Initial load
  await performSearch();
}

function renderFoodSearchResults(foods) {
  const container = document.getElementById("foodSearchResults");
  if (!container) return;

  if (!foods || foods.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">No foods found matching your search.</div>`;
    return;
  }

  const defaultCat = getDefaultMealCategory();

  container.innerHTML = foods.map(f => `
    <div class="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-blue-400 transition-all">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <h5 class="text-xs font-semibold text-slate-900 dark:text-white">${f.name}</h5>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${f.category}</span>
          ${f.vegetarian ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">🌱 Veg</span>` : ""}
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          ${f.serving} • <strong class="text-blue-600 dark:text-blue-400">${f.calories} kcal</strong> (P: ${f.protein}g | C: ${f.carbs}g | F: ${f.fat}g)
        </p>
      </div>
      <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        <div class="flex items-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden" title="Enter grams consumed (or leave empty to use 1x serving)">
          <input type="number" id="grams_${f.id}" placeholder="100" min="1" max="2000" class="w-12 text-xs py-1 px-1 bg-transparent text-center font-bold text-blue-600 dark:text-blue-400 outline-none">
          <span class="text-[10px] text-slate-400 pr-1.5 font-semibold">g</span>
        </div>
        <select id="mealType_${f.id}" class="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200">
          <option value="breakfast" ${defaultCat === "breakfast" ? "selected" : ""}>Breakfast</option>
          <option value="lunch" ${defaultCat === "lunch" ? "selected" : ""}>Lunch</option>
          <option value="dinner" ${defaultCat === "dinner" ? "selected" : ""}>Dinner</option>
          <option value="snacks" ${defaultCat === "snacks" ? "selected" : ""}>Snack</option>
        </select>
        <button onclick="addFoodToMeal('${f.id}')" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer">
          + Add
        </button>
      </div>
    </div>
  `).join("");
}

window.addFoodToMeal = async function(foodId) {
  const gramsInput = document.getElementById(`grams_${foodId}`);
  const mealTypeSelect = document.getElementById(`mealType_${foodId}`);
  const gramsVal = gramsInput && gramsInput.value ? parseFloat(gramsInput.value) : null;
  const mealType = mealTypeSelect ? mealTypeSelect.value : "breakfast";

  let servings = 1.0;
  if (gramsVal && gramsVal > 0) {
    servings = gramsVal / 100.0;
  }

  const entry = await Api.addMeal({
    food_id: foodId,
    servings: servings,
    grams: gramsVal,
    meal_type: mealType,
    date: activeMealDate
  });

  // Success toast
  const toast = document.getElementById("calcSuccessToast");
  const toastMsg = document.getElementById("calcToastMessage");
  if (toast && toastMsg && entry) {
    toastMsg.textContent = `✓ Added ${entry.name} (${entry.calories} kcal) to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}!`;
    toast.className = "p-3 rounded-xl bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center justify-between transition-all";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  await loadMeals();
};

async function loadMeals() {
  const data = await Api.getMeals(activeMealDate);
  renderMealLog(data.meals, data.totals);
  updateMealGoalTracker(data.totals);
  if (typeof loadHistory === "function" && currentHistoryPeriod) {
    loadHistory(currentHistoryPeriod, customHistoryStartDate, customHistoryEndDate);
  }
}

function renderMealLog(meals, totals) {
  const container = document.getElementById("loggedMealsContainer");
  const emptyState = document.getElementById("emptyMealsState");
  const countBadge = document.getElementById("mealCountBadge");

  if (countBadge) countBadge.textContent = `${meals.length} items`;

  if (!meals || meals.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    if (container) container.innerHTML = "";
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  // Group by meal type
  const groups = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  meals.forEach(m => {
    const type = m.meal_type || "breakfast";
    if (!groups[type]) groups[type] = [];
    groups[type].push(m);
  });

  const typeLabels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snacks & Treats"
  };

  container.innerHTML = Object.entries(groups).map(([type, items]) => {
    if (items.length === 0) return "";
    const groupCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);

    return `
      <div class="mb-4">
        <div class="flex items-center justify-between pb-1 mb-2 border-b border-slate-200 dark:border-slate-700">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">${typeLabels[type]}</span>
          <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">${groupCalories} kcal</span>
        </div>
        <div class="space-y-1.5">
          ${items.map(item => `
            <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between gap-2 text-xs border border-slate-100 dark:border-slate-700/50">
              <div class="min-w-0 flex-1">
                <span class="font-medium text-slate-800 dark:text-slate-200 truncate block sm:inline">${item.name}</span>
                <span class="text-slate-400 text-[11px] sm:ml-1">(${item.serving})</span>
              </div>
              <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                <span class="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">${item.calories} kcal</span>
                <span class="text-[10px] text-slate-400 hidden xs:inline sm:inline">P:${item.protein} C:${item.carbs} F:${item.fat}</span>
                <button onclick="removeMeal('${item.id}')" class="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

window.removeMeal = async function(mealId) {
  await Api.deleteMeal(mealId);
  await loadMeals();
};

function updateMealGoalTracker(totals = null) {
  if (!currentCalculation) return;

  const target = currentCalculation.target_calories;
  let consumed = 0;
  let pConsumed = 0, cConsumed = 0, fConsumed = 0;

  if (totals) {
    consumed = totals.calories || 0;
    pConsumed = totals.protein || 0;
    cConsumed = totals.carbs || 0;
    fConsumed = totals.fat || 0;
  } else {
    const local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
    consumed = local.reduce((sum, m) => sum + (m.calories || 0), 0);
    pConsumed = local.reduce((sum, m) => sum + (m.protein || 0), 0);
    cConsumed = local.reduce((sum, m) => sum + (m.carbs || 0), 0);
    fConsumed = local.reduce((sum, m) => sum + (m.fat || 0), 0);
  }

  const remaining = target - consumed;
  const pct = Math.min(100, Math.round((consumed / target) * 100));

  const consumedVal = document.getElementById("trackerConsumedVal");
  const targetVal = document.getElementById("trackerTargetVal");
  const remainingVal = document.getElementById("trackerRemainingVal");
  const bar = document.getElementById("trackerProgressBar");

  if (consumedVal) consumedVal.textContent = `${consumed} kcal`;
  if (targetVal) targetVal.textContent = `${target} kcal`;
  if (remainingVal) {
    if (remaining >= 0) {
      remainingVal.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">${remaining} kcal remaining</span>`;
    } else {
      remainingVal.innerHTML = `<span class="text-red-500 font-bold">${Math.abs(remaining)} kcal over target</span>`;
    }
  }

  if (bar) {
    bar.style.width = `${pct}%`;
    if (remaining < 0) {
      bar.className = "h-3 rounded-full bg-red-500 transition-all duration-500";
    } else if (pct > 90) {
      bar.className = "h-3 rounded-full bg-amber-500 transition-all duration-500";
    } else {
      bar.className = "h-3 rounded-full bg-blue-600 transition-all duration-500";
    }
  }

  // Macro tracker totals
  const pEl = document.getElementById("trackerTotalProtein");
  const cEl = document.getElementById("trackerTotalCarbs");
  const fEl = document.getElementById("trackerTotalFat");

  if (pEl) pEl.textContent = `${pConsumed}g`;
  if (cEl) cEl.textContent = `${cConsumed}g`;
  if (fEl) fEl.textContent = `${fConsumed}g`;
}

// -------------------------------------------------------------
// Form Persistence & Utilities
// -------------------------------------------------------------
function saveFormData() {
  const data = collectFormData();
  if (data) {
    localStorage.setItem("calorie_form_data", JSON.stringify(data));
  }
}

function loadSavedFormData() {
  const saved = localStorage.getItem("calorie_form_data");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    if (data.unit_system && data.unit_system !== currentUnitSystem) {
      setUnitSystem(data.unit_system);
    }
    if (data.gender) {
      const radio = document.querySelector(`input[name='gender'][value='${data.gender}']`);
      if (radio) radio.checked = true;
    }
    if (data.age) document.getElementById("ageInput").value = data.age;
    if (data.weight) {
      document.getElementById("weightInput").value = data.weight;
    }
    if (data.unit_system === "imperial") {
      if (data.height) {
        const ftEl = document.getElementById("heightFeetInput");
        if (ftEl) ftEl.value = data.height;
      }
      if (data.height_inches !== undefined) {
        const inEl = document.getElementById("heightInchesInput");
        if (inEl) inEl.value = data.height_inches;
      }
    } else {
      if (data.height) {
        const cmEl = document.getElementById("heightCmInput");
        if (cmEl) cmEl.value = data.height;
      }
    }
    if (data.target_weight) document.getElementById("targetWeightInput").value = data.target_weight;
    if (data.activity_level) document.getElementById("activitySelect").value = data.activity_level;
    if (data.formula) {
      document.getElementById("formulaSelect").value = data.formula;
      if (data.formula === "katch") {
        document.getElementById("bodyFatContainer").classList.remove("hidden");
      }
    }
    if (data.body_fat) document.getElementById("bodyFatInput").value = data.body_fat;
    if (data.goal) {
      document.getElementById("goalSelect").value = data.goal;
      if (data.goal === "custom") {
        document.getElementById("customGoalContainer").classList.remove("hidden");
        document.getElementById("customGoalDeltaInput").value = data.custom_delta || 0;
      }
    }
  } catch (e) {
    console.warn("Could not restore saved form state:", e);
  }
}

function animateNumber(elementId, targetValue, forceAnimate = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let startVal = parseInt(el.textContent.replace(/,/g, "")) || 0;
  if (forceAnimate) {
    // Start slightly below target value to visibly animate counter and spin numbers
    startVal = Math.max(0, Math.round(targetValue * 0.94));
    el.classList.add("opacity-80");
    setTimeout(() => el.classList.remove("opacity-80"), 150);
  }

  const duration = 120;
  const startTime = performance.now();

  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(startVal + (targetValue - startVal) * progress);
    el.textContent = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// -------------------------------------------------------------
// Interactive Calculate Button Handler & Field Validation
// -------------------------------------------------------------
window.handleCalculateClick = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Clear any previous error banner
  const errBanner = document.getElementById("formErrorBanner");
  const errMsg = document.getElementById("formErrorMessage");
  if (errBanner) errBanner.classList.add("hidden");

  // Validate fields
  const weightInput = document.getElementById("weightInput");
  const ageInput = document.getElementById("ageInput");
  const heightCmInput = document.getElementById("heightCmInput");
  const heightFeetInput = document.getElementById("heightFeetInput");
  const heightInchesInput = document.getElementById("heightInchesInput");

  const weight = parseFloat(weightInput?.value);
  const minWeight = currentUnitSystem === "imperial" ? 44 : 20;
  const maxWeight = currentUnitSystem === "imperial" ? 880 : 400;
  const unitLabel = currentUnitSystem === "imperial" ? "lbs" : "kg";

  if (isNaN(weight) || weight < minWeight || weight > maxWeight) {
    if (errBanner && errMsg) {
      errMsg.textContent = `Please enter a valid weight between ${minWeight} and ${maxWeight} ${unitLabel}.`;
      errBanner.classList.remove("hidden");
    }
    weightInput?.focus();
    return;
  }

  const age = parseInt(ageInput?.value);
  if (isNaN(age) || age < 10 || age > 120) {
    if (errBanner && errMsg) {
      errMsg.textContent = "Please enter an age between 10 and 120 years.";
      errBanner.classList.remove("hidden");
    }
    ageInput?.focus();
    return;
  }

  if (currentUnitSystem === "imperial") {
    const ft = parseFloat(heightFeetInput?.value);
    const inVal = parseFloat(heightInchesInput?.value || 0);
    if (isNaN(ft) || ft < 1 || ft > 8 || isNaN(inVal) || inVal < 0 || inVal > 11.9) {
      if (errBanner && errMsg) {
        errMsg.textContent = "Please enter a valid height in feet (1-8 ft) and inches (0-11 in).";
        errBanner.classList.remove("hidden");
      }
      heightFeetInput?.focus();
      return;
    }
  } else {
    const cm = parseFloat(heightCmInput?.value);
    if (isNaN(cm) || cm < 50 || cm > 280) {
      if (errBanner && errMsg) {
        errMsg.textContent = "Please enter a valid height between 50 and 280 centimeters.";
        errBanner.classList.remove("hidden");
      }
      heightCmInput?.focus();
      return;
    }
  }

  // Execute full calculation with force animation
  saveFormData();
  calculateAndRender(true);

  // Button visual feedback state
  const btn = document.getElementById("calculateCaloriesBtn");
  const btnText = document.getElementById("calcBtnText");
  const originalText = "Calculate Daily Calories";

  if (btn && btnText) {
    btnText.textContent = "✓ Calculated!";
    btn.classList.add("ring-4", "ring-emerald-400", "scale-[1.02]");

    setTimeout(() => {
      btnText.textContent = originalText;
      btn.classList.remove("ring-4", "ring-emerald-400", "scale-[1.02]");
    }, 1300);
  }

  // Hero Card pulse ring highlight
  const heroCard = document.getElementById("heroTargetCard");
  if (heroCard) {
    heroCard.classList.add("ring-4", "ring-white/80", "scale-[1.02]");
    setTimeout(() => {
      heroCard.classList.remove("ring-4", "ring-white/80", "scale-[1.02]");
    }, 450);
  }

  // Toast confirmation
  const toast = document.getElementById("calcSuccessToast");
  const toastMsg = document.getElementById("calcToastMessage");
  if (toast && toastMsg && currentCalculation && !currentCalculation.error) {
    toastMsg.textContent = `Daily Target: ${currentCalculation.target_calories.toLocaleString()} kcal/day • TDEE: ${currentCalculation.tdee.toLocaleString()} kcal`;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
  }

  // Smooth scroll to results if on mobile/small screen
  const resultsSection = document.getElementById("resultsSection");
  if (resultsSection && window.innerWidth < 1024) {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// -------------------------------------------------------------
// Quick 1-Click Profile Presets & Steppers
// -------------------------------------------------------------
window.applyQuickPreset = function(type) {
  const presets = {
    male_loss: { gender: "male", age: 25, weight: 78, height: 178, targetWeight: 72, activity: "moderate", goal: "weight_loss", formula: "mifflin" },
    female_tone: { gender: "female", age: 26, weight: 62, height: 165, targetWeight: 58, activity: "light", goal: "mild_loss", formula: "mifflin" },
    muscle_gain: { gender: "male", age: 24, weight: 75, height: 180, targetWeight: 82, activity: "active", goal: "weight_gain", formula: "mifflin" },
    maintenance: { gender: "male", age: 28, weight: 70, height: 175, targetWeight: "", activity: "moderate", goal: "maintain", formula: "mifflin" }
  };

  const p = presets[type];
  if (!p) return;

  const radio = document.querySelector(`input[name='gender'][value='${p.gender}']`);
  if (radio) radio.checked = true;

  document.getElementById("ageInput").value = p.age;
  if (currentUnitSystem === "imperial") {
    document.getElementById("weightInput").value = Math.round(p.weight * 2.20462 * 10) / 10;
    if (p.targetWeight) {
      document.getElementById("targetWeightInput").value = Math.round(p.targetWeight * 2.20462 * 10) / 10;
    } else {
      document.getElementById("targetWeightInput").value = "";
    }
    const totalInches = p.height / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    const heightFeetInput = document.getElementById("heightFeetInput");
    const heightInchesInput = document.getElementById("heightInchesInput");
    if (heightFeetInput) heightFeetInput.value = feet;
    if (heightInchesInput) heightInchesInput.value = inches;
  } else {
    document.getElementById("weightInput").value = p.weight;
    document.getElementById("heightCmInput").value = p.height;
    document.getElementById("targetWeightInput").value = p.targetWeight;
  }

  document.getElementById("activitySelect").value = p.activity;
  document.getElementById("goalSelect").value = p.goal;
  document.getElementById("formulaSelect").value = p.formula;

  document.getElementById("customGoalContainer")?.classList.add("hidden");
  document.getElementById("bodyFatContainer")?.classList.add("hidden");

  saveFormData();
  calculateAndRender();
};

window.adjustInput = function(inputId, delta) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const current = parseFloat(el.value) || 0;
  const min = el.min ? parseFloat(el.min) : 0;
  const max = el.max ? parseFloat(el.max) : 9999;
  const next = Math.max(min, Math.min(max, Math.round((current + delta) * 10) / 10));
  el.value = next;
  saveFormData();
  calculateAndRender();
};

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// -------------------------------------------------------------
// Quick Add Custom Food & Grams Calculator State & Functions
// -------------------------------------------------------------
let customFoodCalcMode = "total"; // "total" or "per100g"
let basePer100g = { calories: 0, protein: 0, carbs: 0, fat: 0 };

window.setCustomCalcMode = function(mode) {
  customFoodCalcMode = mode;
  const totalBtn = document.getElementById("customModeTotalBtn");
  const p100gBtn = document.getElementById("customMode100gBtn");
  const hint = document.getElementById("customModeHint");
  const prefix = document.getElementById("nutritionLabelPrefix");

  if (mode === "total") {
    totalBtn?.classList.add("bg-blue-600", "text-white");
    totalBtn?.classList.remove("text-slate-600", "dark:text-slate-300");
    p100gBtn?.classList.remove("bg-blue-600", "text-white");
    p100gBtn?.classList.add("text-slate-600", "dark:text-slate-300");
    if (hint) hint.textContent = "(Amount you are eating)";
    if (prefix) prefix.textContent = "Nutrition per Portion";
  } else {
    p100gBtn?.classList.add("bg-blue-600", "text-white");
    p100gBtn?.classList.remove("text-slate-600", "dark:text-slate-300");
    totalBtn?.classList.remove("bg-blue-600", "text-white");
    totalBtn?.classList.add("text-slate-600", "dark:text-slate-300");
    if (hint) hint.textContent = "(Nutrition auto-scales based on grams)";
    if (prefix) prefix.textContent = "Nutrition per 100g (Auto-scales)";

    basePer100g = {
      calories: parseFloat(document.getElementById("customFoodCalories")?.value || 0),
      protein: parseFloat(document.getElementById("customFoodProtein")?.value || 0),
      carbs: parseFloat(document.getElementById("customFoodCarbs")?.value || 0),
      fat: parseFloat(document.getElementById("customFoodFat")?.value || 0)
    };
  }
  updateCustomFoodPreview();
};

window.adjustCustomGrams = function(delta) {
  const gramsInput = document.getElementById("customFoodGrams");
  if (!gramsInput) return;
  const current = parseFloat(gramsInput.value) || 100;
  const next = Math.max(1, current + delta);
  gramsInput.value = next;
  onCustomGramsChanged();
};

window.setCustomGrams = function(amount) {
  const gramsInput = document.getElementById("customFoodGrams");
  if (!gramsInput) return;
  gramsInput.value = amount;
  onCustomGramsChanged();
};

function onCustomGramsChanged() {
  if (customFoodCalcMode === "per100g") {
    const grams = parseFloat(document.getElementById("customFoodGrams")?.value || 100);
    const ratio = grams / 100.0;
    const cEl = document.getElementById("customFoodCalories");
    const pEl = document.getElementById("customFoodProtein");
    const carbEl = document.getElementById("customFoodCarbs");
    const fEl = document.getElementById("customFoodFat");

    if (basePer100g.calories > 0 && cEl) cEl.value = Math.round(basePer100g.calories * ratio);
    if (basePer100g.protein > 0 && pEl) pEl.value = Math.round(basePer100g.protein * ratio * 10) / 10;
    if (basePer100g.carbs > 0 && carbEl) carbEl.value = Math.round(basePer100g.carbs * ratio * 10) / 10;
    if (basePer100g.fat > 0 && fEl) fEl.value = Math.round(basePer100g.fat * ratio * 10) / 10;
  }
  updateCustomFoodPreview();
}

window.autoCalcCustomCalories = function() {
  const p = parseFloat(document.getElementById("customFoodProtein")?.value || 0);
  const c = parseFloat(document.getElementById("customFoodCarbs")?.value || 0);
  const f = parseFloat(document.getElementById("customFoodFat")?.value || 0);
  const total = Math.round((p * 4) + (c * 4) + (f * 9));
  const cEl = document.getElementById("customFoodCalories");
  if (cEl) cEl.value = total;
  if (customFoodCalcMode === "per100g") {
    basePer100g.calories = total;
  }
  updateCustomFoodPreview();
};

window.updateCustomFoodPreview = function() {
  const name = document.getElementById("customFoodName")?.value.trim();
  const grams = document.getElementById("customFoodGrams")?.value || 100;
  let calories = parseFloat(document.getElementById("customFoodCalories")?.value || 0);
  const p = parseFloat(document.getElementById("customFoodProtein")?.value || 0);
  const c = parseFloat(document.getElementById("customFoodCarbs")?.value || 0);
  const f = parseFloat(document.getElementById("customFoodFat")?.value || 0);

  if (calories === 0 && (p > 0 || c > 0 || f > 0)) {
    calories = Math.round((p * 4) + (c * 4) + (f * 9));
  }

  const previewEl = document.getElementById("previewSummaryText");
  if (!previewEl) return;

  if (name) {
    previewEl.innerHTML = `<span class="text-blue-600 dark:text-blue-400 font-bold">${name}</span> • <span class="font-bold text-slate-800 dark:text-slate-200">${grams}g</span> • <span class="font-bold text-emerald-600 dark:text-emerald-400">${calories} kcal</span> <span class="text-slate-400 text-[10px]">(P: ${p}g | C: ${c}g | F: ${f}g)</span>`;
  } else {
    previewEl.textContent = "Enter food details above";
  }
};

window.handleCustomFoodSubmit = async function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const errBox = document.getElementById("customFoodError");
  const errText = document.getElementById("customFoodErrorText");
  if (errBox) errBox.classList.add("hidden");

  const nameInput = document.getElementById("customFoodName");
  const name = nameInput ? nameInput.value.trim() : "";
  if (!name) {
    if (errBox && errText) {
      errText.textContent = "Please enter a food name (e.g. Steamed Rice, Boiled Eggs).";
      errBox.classList.remove("hidden");
    }
    nameInput?.focus();
    return;
  }

  const gramsInput = document.getElementById("customFoodGrams");
  const grams = gramsInput && parseFloat(gramsInput.value) > 0 ? parseFloat(gramsInput.value) : 100;

  const mealType = document.getElementById("customFoodMealType")?.value || "lunch";
  let calories = parseInt(document.getElementById("customFoodCalories")?.value || 0);
  const protein = parseFloat(document.getElementById("customFoodProtein")?.value || 0);
  const carbs = parseFloat(document.getElementById("customFoodCarbs")?.value || 0);
  const fat = parseFloat(document.getElementById("customFoodFat")?.value || 0);
  let serving = document.getElementById("customFoodServing")?.value.trim() || `${grams}g`;

  if (calories <= 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
  }

  if (calories <= 0 && protein === 0 && carbs === 0 && fat === 0) {
    if (errBox && errText) {
      errText.textContent = "Please enter either calories or macronutrients (protein, carbs, fat).";
      errBox.classList.remove("hidden");
    }
    document.getElementById("customFoodCalories")?.focus();
    return;
  }

  const btn = document.getElementById("addCustomFoodBtn");
  const btnText = document.getElementById("customFoodBtnText");
  if (btnText) btnText.textContent = "Adding...";

  const entry = await Api.addMeal({
    meal_type: mealType,
    name: name,
    grams: grams,
    calories: calories,
    protein: protein,
    carbs: carbs,
    fat: fat,
    serving: serving,
    date: activeMealDate
  });

  // Visual success feedback
  if (btn && btnText) {
    btnText.textContent = "✓ Added to Log!";
    btn.classList.add("ring-4", "ring-emerald-400", "scale-105");
    setTimeout(() => {
      btnText.textContent = "+ Add to Meal Log";
      btn.classList.remove("ring-4", "ring-emerald-400", "scale-105");
    }, 1300);
  }

  // Toast confirmation
  const toast = document.getElementById("calcSuccessToast");
  const toastMsg = document.getElementById("calcToastMessage");
  if (toast && toastMsg) {
    toastMsg.textContent = `✓ Added ${name} (${grams}g • ${calories} kcal) to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}!`;
    toast.className = "p-3 rounded-xl bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center justify-between transition-all";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3500);
  }

  // Reset form inputs
  if (nameInput) nameInput.value = "";
  const calInput = document.getElementById("customFoodCalories");
  const pInput = document.getElementById("customFoodProtein");
  const cInput = document.getElementById("customFoodCarbs");
  const fInput = document.getElementById("customFoodFat");
  const servInput = document.getElementById("customFoodServing");

  if (calInput) calInput.value = "";
  if (pInput) pInput.value = "";
  if (cInput) cInput.value = "";
  if (fInput) fInput.value = "";
  if (servInput) servInput.value = "";
  if (gramsInput) gramsInput.value = "100";

  updateCustomFoodPreview();

  // Reload meals and update live tracker
  await loadMeals();
};

// -------------------------------------------------------------
// Active Meal Date Management
// -------------------------------------------------------------
function initActiveMealDate() {
  const dateInput = document.getElementById("activeMealDateInput");
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.max = todayStr;
  }
}

window.setActiveMealDate = function(mode) {
  const today = new Date();
  const dateInput = document.getElementById("activeMealDateInput");
  const todayBtn = document.getElementById("dateFilterTodayBtn");
  const yestBtn = document.getElementById("dateFilterYesterdayBtn");
  const label = document.getElementById("activeDiaryDateLabel");

  if (mode === "today") {
    activeMealDate = today.toISOString().split("T")[0];
    if (todayBtn) {
      todayBtn.className = "px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm transition-all";
    }
    if (yestBtn) {
      yestBtn.className = "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all";
    }
    if (label) label.textContent = "Today";
  } else if (mode === "yesterday") {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    activeMealDate = yest.toISOString().split("T")[0];
    if (yestBtn) {
      yestBtn.className = "px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm transition-all";
    }
    if (todayBtn) {
      todayBtn.className = "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all";
    }
    if (label) label.textContent = "Yesterday";
  }

  if (dateInput) dateInput.value = activeMealDate;
  loadMeals();
};

window.onActiveMealDateChanged = function(newDate) {
  if (!newDate) return;
  activeMealDate = newDate;
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const todayBtn = document.getElementById("dateFilterTodayBtn");
  const yestBtn = document.getElementById("dateFilterYesterdayBtn");
  const label = document.getElementById("activeDiaryDateLabel");

  if (todayBtn) todayBtn.className = newDate === todayStr ? "px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm transition-all" : "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all";
  if (yestBtn) yestBtn.className = newDate === yesterdayStr ? "px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm transition-all" : "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all";

  if (label) {
    if (newDate === todayStr) label.textContent = "Today";
    else if (newDate === yesterdayStr) label.textContent = "Yesterday";
    else label.textContent = newDate;
  }

  loadMeals();
};

// -------------------------------------------------------------
// Calorie History & Period Analytics Logic
// -------------------------------------------------------------
window.selectHistoryPeriod = function(period) {
  currentHistoryPeriod = period;

  const yesterdayBtn = document.getElementById("periodYesterdayBtn");
  const weekBtn = document.getElementById("periodWeekBtn");
  const monthBtn = document.getElementById("periodMonthBtn");
  const customBtn = document.getElementById("periodCustomBtn");
  const customContainer = document.getElementById("customDateRangeContainer");

  const allBtns = [yesterdayBtn, weekBtn, monthBtn, customBtn];
  allBtns.forEach(b => {
    if (b) {
      b.className = "px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all";
    }
  });

  if (period === "yesterday" && yesterdayBtn) yesterdayBtn.className = "px-2.5 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition-all";
  if (period === "last_week" && weekBtn) weekBtn.className = "px-2.5 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition-all";
  if (period === "last_month" && monthBtn) monthBtn.className = "px-2.5 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition-all";
  if (period === "custom" && customBtn) customBtn.className = "px-2.5 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition-all";

  if (customContainer && period !== "custom") {
    customContainer.classList.add("hidden");
  }

  loadHistory(period);
};

window.toggleCustomDateInputs = function() {
  const customContainer = document.getElementById("customDateRangeContainer");
  if (!customContainer) return;

  const isHidden = customContainer.classList.contains("hidden");
  if (isHidden) {
    customContainer.classList.remove("hidden");
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);

    const startInput = document.getElementById("historyStartDateInput");
    const endInput = document.getElementById("historyEndDateInput");
    if (startInput && !startInput.value) startInput.value = twoWeeksAgo.toISOString().split("T")[0];
    if (endInput && !endInput.value) endInput.value = today.toISOString().split("T")[0];
  } else {
    customContainer.classList.add("hidden");
  }
};

window.applyCustomDateRange = function() {
  const startInput = document.getElementById("historyStartDateInput");
  const endInput = document.getElementById("historyEndDateInput");
  if (!startInput || !endInput) return;

  customHistoryStartDate = startInput.value;
  customHistoryEndDate = endInput.value;
  if (!customHistoryStartDate || !customHistoryEndDate) {
    alert("Please select both start and end dates.");
    return;
  }
  selectHistoryPeriod("custom");
  loadHistory("custom", customHistoryStartDate, customHistoryEndDate);
};

window.loadHistory = async function(period = "last_week", startDate = "", endDate = "") {
  const targetCals = currentCalculation ? currentCalculation.target_calories : 2150;
  const data = await Api.getHistory(period, startDate, endDate, targetCals);
  currentHistoryData = data;

  renderHistoryKPIs(data);
  renderHistoryChart(data);
  renderHistoryDailyList(data);
};

function renderHistoryKPIs(data) {
  if (!data) return;

  const labelEl = document.getElementById("currentPeriodLabel");
  const totalCalsEl = document.getElementById("historyTotalCalories");
  const daysLoggedEl = document.getElementById("historyDaysLoggedSub");
  const dailyAvgEl = document.getElementById("historyDailyAvgCalories");
  const targetCompEl = document.getElementById("historyTargetComparisonSub");
  const avgDeltaEl = document.getElementById("historyAvgDelta");
  const paceSubEl = document.getElementById("historyPaceSub");
  const avgPEl = document.getElementById("historyAvgProtein");
  const avgCEl = document.getElementById("historyAvgCarbs");
  const avgFEl = document.getElementById("historyAvgFat");

  const pPctEl = document.getElementById("historyProteinPct");
  const cPctEl = document.getElementById("historyCarbsPct");
  const fPctEl = document.getElementById("historyFatPct");
  const pTotalEl = document.getElementById("historyProteinTotalGrams");
  const cTotalEl = document.getElementById("historyCarbsTotalGrams");
  const fTotalEl = document.getElementById("historyFatTotalGrams");

  const pBar = document.getElementById("historyProteinBar");
  const cBar = document.getElementById("historyCarbsBar");
  const fBar = document.getElementById("historyFatBar");
  const adherenceEl = document.getElementById("historyAdherencePct");
  const advisoryEl = document.getElementById("historyAdvisoryText");

  if (labelEl) labelEl.textContent = data.period_label;

  if (data.logged_days_count === 0) {
    if (totalCalsEl) totalCalsEl.textContent = "0";
    if (daysLoggedEl) daysLoggedEl.textContent = `0 recorded days (${data.day_count} total)`;
    if (dailyAvgEl) dailyAvgEl.textContent = "--";
    if (targetCompEl) targetCompEl.textContent = `Target: ${data.target_calories ? data.target_calories.toLocaleString() : "--"} kcal`;
    if (avgDeltaEl) {
      avgDeltaEl.className = "text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500";
      avgDeltaEl.textContent = "--";
    }
    if (paceSubEl) paceSubEl.textContent = "No logged meals in this period";

    if (avgPEl) avgPEl.textContent = "--g";
    if (avgCEl) avgCEl.textContent = "--g";
    if (avgFEl) avgFEl.textContent = "--g";
    if (pPctEl) pPctEl.textContent = "--%";
    if (cPctEl) cPctEl.textContent = "--%";
    if (fPctEl) fPctEl.textContent = "--%";
    if (pTotalEl) pTotalEl.textContent = "0g total";
    if (cTotalEl) cTotalEl.textContent = "0g total";
    if (fTotalEl) fTotalEl.textContent = "0g total";

    if (pBar) pBar.style.width = "0%";
    if (cBar) cBar.style.width = "0%";
    if (fBar) fBar.style.width = "0%";

    if (adherenceEl) adherenceEl.textContent = "--";
    if (advisoryEl) advisoryEl.textContent = "No data yet. Log your meals using the tracker above to view historical consistency and intake trends.";
    return;
  }

  if (totalCalsEl) totalCalsEl.textContent = data.total_calories.toLocaleString();
  if (daysLoggedEl) daysLoggedEl.textContent = `In ${data.logged_days_count} recorded days (${data.day_count} total)`;
  if (dailyAvgEl) dailyAvgEl.textContent = data.daily_avg_calories.toLocaleString();
  if (targetCompEl) targetCompEl.textContent = `vs ${data.target_calories.toLocaleString()} kcal Target`;

  if (avgDeltaEl) {
    if (data.avg_delta <= 0) {
      avgDeltaEl.className = "text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400";
      avgDeltaEl.textContent = `-${Math.abs(data.avg_delta)} kcal/day`;
    } else {
      avgDeltaEl.className = "text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400";
      avgDeltaEl.textContent = `+${data.avg_delta} kcal/day`;
    }
  }

  if (paceSubEl) {
    const weeklyRate = Math.abs(Math.round((data.avg_delta * 7 / 7700) * 100) / 100);
    paceSubEl.textContent = data.avg_delta <= 0 ? `~${weeklyRate} kg/week deficit rate` : `~${weeklyRate} kg/week surplus rate`;
  }

  if (data.macros) {
    if (avgPEl) avgPEl.textContent = `${data.macros.avg_protein}g`;
    if (avgCEl) avgCEl.textContent = `${data.macros.avg_carbs}g`;
    if (avgFEl) avgFEl.textContent = `${data.macros.avg_fat}g`;

    if (pPctEl) pPctEl.textContent = `${data.macros.percentages.protein}%`;
    if (cPctEl) cPctEl.textContent = `${data.macros.percentages.carbs}%`;
    if (fPctEl) fPctEl.textContent = `${data.macros.percentages.fat}%`;

    if (pTotalEl) pTotalEl.textContent = `${data.macros.total_protein}g total`;
    if (cTotalEl) cTotalEl.textContent = `${data.macros.total_carbs}g total`;
    if (fTotalEl) fTotalEl.textContent = `${data.macros.total_fat}g total`;

    if (pBar) pBar.style.width = `${data.macros.percentages.protein}%`;
    if (cBar) cBar.style.width = `${data.macros.percentages.carbs}%`;
    if (fBar) fBar.style.width = `${data.macros.percentages.fat}%`;
  }

  if (adherenceEl) {
    const pct = Math.round((data.logged_days_count / Math.max(1, data.day_count)) * 100);
    adherenceEl.textContent = `${pct}%`;
  }

  if (advisoryEl) {
    if (data.daily_avg_calories < 1200) {
      advisoryEl.textContent = "⚠️ Average calories are critically low (<1,200 kcal). Consider increasing healthy nutrient-dense staples.";
    } else if (Math.abs(data.avg_delta) <= 150) {
      advisoryEl.textContent = "✓ Good intake consistency! Average calories closely match your designated target.";
    } else if (data.avg_delta < -500) {
      advisoryEl.textContent = "⚡ Caloric deficit recorded. Ensure sufficient daily protein to maintain lean muscle mass.";
    } else {
      advisoryEl.textContent = "✓ Caloric intake is sustainably aligned with estimated metabolic requirements.";
    }
  }
}

function renderHistoryChart(data) {
  const canvas = document.getElementById("historyTrendChart");
  if (!canvas || !data) return;

  const ctx = canvas.getContext("2d");
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(0, 0, 0, 0.05)";

  const labels = data.daily_breakdown.map(d => `${d.day_name} ${d.date.slice(5)}`);
  const caloriesData = data.daily_breakdown.map(d => d.calories);
  const targetData = data.daily_breakdown.map(d => d.target);

  const backgroundColors = data.daily_breakdown.map(d => {
    if (d.calories === 0) return isDark ? "#334155" : "#e2e8f0";
    if (d.calories > d.target + 100) return "#ef4444";
    if (d.calories < d.target - 250) return "#3b82f6";
    return "#10b981";
  });

  if (historyChart) {
    historyChart.destroy();
  }

  historyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Calories Consumed",
          data: caloriesData,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36
        },
        {
          label: "Target Reference",
          data: targetData,
          type: "line",
          borderColor: "#10b981",
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const d = data.daily_breakdown[context.dataIndex];
              if (context.dataset.type === "line") {
                return `Target: ${context.parsed.y} kcal`;
              }
              const deltaStr = d.delta > 0 ? `+${d.delta} kcal over` : `${d.delta} kcal under`;
              return [
                `Consumed: ${context.parsed.y} kcal (${deltaStr})`,
                `Macros: P: ${d.protein}g | C: ${d.carbs}g | F: ${d.fat}g`,
                `Meals: ${d.meals_count} logged`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } },
          beginAtZero: true
        }
      }
    }
  });
}

function renderHistoryDailyList(data) {
  const container = document.getElementById("historyDailyAccordionContainer");
  const countEl = document.getElementById("historyDaysItemCount");
  if (!container || !data) return;

  if (countEl) countEl.textContent = `Showing ${data.daily_breakdown.length} days (${data.logged_days_count} with meals)`;

  if (data.logged_days_count === 0) {
    container.innerHTML = `
      <div class="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-850/50">
        <div class="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </div>
        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">No data yet</p>
        <p class="text-[11px] text-slate-400 mt-1">Start logging meals in the Interactive Meal Logger to populate daily history.</p>
      </div>
    `;
    return;
  }

  const reversedDays = [...data.daily_breakdown].reverse();

  container.innerHTML = reversedDays.map((day, idx) => {
    const isToday = day.date === new Date().toISOString().split("T")[0];
    const deltaClass = day.delta <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500";
    const deltaText = day.delta <= 0 ? `${Math.abs(day.delta)} kcal under` : `+${day.delta} kcal over`;

    return `
      <div class="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 overflow-hidden">
        <button type="button" onclick="toggleDailyAccordion('day_acc_${idx}')" class="w-full p-3 sm:px-4 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full ${day.calories > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}"></span>
            <div>
              <span class="font-bold text-xs text-slate-900 dark:text-white">${day.full_day}</span>
              ${isToday ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">Today</span>` : ""}
              <div class="text-[11px] text-slate-400 mt-0.5">
                ${day.meals_count} meals • <span class="font-semibold text-slate-700 dark:text-slate-300">${day.calories} kcal</span>
                <span class="text-[10px] ml-1 (${deltaClass})">(${deltaText})</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-1.5 text-[10px]">
              <span class="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold">P: ${day.protein}g</span>
              <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold">C: ${day.carbs}g</span>
              <span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-semibold">F: ${day.fat}g</span>
            </div>
            <svg id="arrow_day_acc_${idx}" class="w-4 h-4 text-slate-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </button>

        <div id="day_acc_${idx}" class="hidden p-3.5 sm:px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
          ${day.meals.length === 0 ? `
            <p class="text-xs text-slate-400 italic">No foods logged on this date.</p>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              ${day.meals.map(m => `
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-800 dark:text-slate-200 capitalize text-[11px] text-blue-600 dark:text-blue-400 block">${m.meal_type || 'meal'}</span>
                    <span class="font-medium text-slate-900 dark:text-white">${m.name}</span>
                    <span class="text-slate-400 text-[10px] ml-1">(${m.serving})</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-slate-900 dark:text-white">${m.calories} kcal</span>
                    <span class="text-[10px] text-slate-400 block">P:${m.protein} C:${m.carbs} F:${m.fat}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    `;
  }).join("");
}

window.toggleDailyAccordion = function(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(`arrow_${id}`);
  if (!el) return;

  const isHidden = el.classList.contains("hidden");
  if (isHidden) {
    el.classList.remove("hidden");
    if (arrow) arrow.style.transform = "rotate(180deg)";
  } else {
    el.classList.add("hidden");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  }
};

// -------------------------------------------------------------
// PDF Report Generation & Download Logic
// -------------------------------------------------------------
window.generatePdfReport = function() {
  if (!currentHistoryData) {
    alert("History data is loading. Please try again in a moment.");
    return;
  }

  const d = currentHistoryData;
  const userName = currentUser ? currentUser.name : "Guest User";
  const userEmail = currentUser ? currentUser.email : "Local Offline Account";
  const modal = document.getElementById("periodReportModal");
  const content = document.getElementById("periodReportPdfContent");
  const titleEl = document.getElementById("modalReportTitle");
  const subEl = document.getElementById("modalReportPeriodSubtitle");

  if (titleEl) titleEl.textContent = `NutriGlance Nutritional Report — ${d.period_label}`;
  if (subEl) subEl.textContent = `Generated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  if (content) {
    content.innerHTML = `
      <!-- Report Header -->
      <div class="flex items-start justify-between border-b-2 border-blue-600 pb-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🥗 NutriGlance Calorie Tracker</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Nutritional Energy Balance & History Report</p>
        </div>
        <div class="text-right text-[11px] text-slate-500">
          <p class="font-bold text-slate-800">Nutritional Summary Report</p>
          <p>Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>

      <!-- User & Period Information Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div>
          <span class="text-slate-400 text-[10px] block">CLIENT NAME</span>
          <strong class="text-slate-900 font-bold">${userName}</strong>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] block">CLIENT EMAIL</span>
          <span class="text-slate-700 font-medium truncate block">${userEmail}</span>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] block">REPORTING PERIOD</span>
          <strong class="text-blue-600 font-bold">${d.period_label}</strong>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] block">TARGET CALORIES</span>
          <strong class="text-emerald-600 font-bold">${d.target_calories} kcal/day</strong>
        </div>
      </div>

      <!-- Executive Period Summary Cards -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Executive Nutrition Summary</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-lg border border-slate-200 bg-white">
            <span class="text-[10px] text-slate-500 block">Total Calories</span>
            <span class="text-lg font-black text-slate-900">${d.total_calories.toLocaleString()}</span> <span class="text-[10px]">kcal</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-200 bg-white">
            <span class="text-[10px] text-slate-500 block">Daily Average</span>
            <span class="text-lg font-black text-blue-600">${d.daily_avg_calories.toLocaleString()}</span> <span class="text-[10px]">kcal/day</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-200 bg-white">
            <span class="text-[10px] text-slate-500 block">Net Balance</span>
            <span class="text-lg font-black ${d.avg_delta <= 0 ? 'text-emerald-600' : 'text-amber-600'}">${d.avg_delta <= 0 ? '-' : '+'}${Math.abs(d.avg_delta)}</span> <span class="text-[10px]">kcal</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-200 bg-white">
            <span class="text-[10px] text-slate-500 block">Logging Consistency</span>
            <span class="text-lg font-black text-slate-900">${d.logged_days_count} / ${d.day_count}</span> <span class="text-[10px]">days</span>
          </div>
        </div>
      </div>

      <!-- Macronutrient Distribution Overview -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Macronutrient Distribution</h3>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span class="text-red-500 font-bold block">Protein</span>
            <span class="text-sm font-black text-slate-800">${d.macros.avg_protein}g/day</span>
            <span class="text-[10px] text-slate-500 block">(${d.macros.percentages.protein}% • ${d.macros.total_protein}g total)</span>
          </div>
          <div>
            <span class="text-blue-500 font-bold block">Carbohydrates</span>
            <span class="text-sm font-black text-slate-800">${d.macros.avg_carbs}g/day</span>
            <span class="text-[10px] text-slate-500 block">(${d.macros.percentages.carbs}% • ${d.macros.total_carbs}g total)</span>
          </div>
          <div>
            <span class="text-amber-500 font-bold block">Fats</span>
            <span class="text-sm font-black text-slate-800">${d.macros.avg_fat}g/day</span>
            <span class="text-[10px] text-slate-500 block">(${d.macros.percentages.fat}% • ${d.macros.total_fat}g total)</span>
          </div>
        </div>
      </div>

      <!-- Day-by-Day Audit Table -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Day-by-Day Historical Log</h3>
        <table class="w-full text-left text-[11px] border-collapse border border-slate-200">
          <thead>
            <tr class="bg-slate-100 text-slate-700">
              <th class="p-2 border border-slate-200">Date</th>
              <th class="p-2 border border-slate-200">Calories (kcal)</th>
              <th class="p-2 border border-slate-200">Diff vs Target</th>
              <th class="p-2 border border-slate-200">Protein</th>
              <th class="p-2 border border-slate-200">Carbs</th>
              <th class="p-2 border border-slate-200">Fat</th>
              <th class="p-2 border border-slate-200">Logged Meals</th>
            </tr>
          </thead>
          <tbody>
            ${d.daily_breakdown.map(day => `
              <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="p-2 border border-slate-200 font-semibold">${day.full_day}</td>
                <td class="p-2 border border-slate-200 font-bold">${day.calories}</td>
                <td class="p-2 border border-slate-200 font-semibold ${day.delta <= 0 ? 'text-emerald-600' : 'text-amber-600'}">
                  ${day.delta <= 0 ? '-' : '+'}${Math.abs(day.delta)}
                </td>
                <td class="p-2 border border-slate-200 text-red-600">${day.protein}g</td>
                <td class="p-2 border border-slate-200 text-blue-600">${day.carbs}g</td>
                <td class="p-2 border border-slate-200 text-amber-600">${day.fat}g</td>
                <td class="p-2 border border-slate-200 text-slate-600">${day.meals_count} items</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- Disclaimer & Footer -->
      <div class="pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
        <p>NutriGlance Calorie Tracker • Nutritional Period Log • Informational Reference</p>
        <p>Page 1 of 1 • Strictly Confidential</p>
      </div>
    `;
  }

  if (modal) modal.classList.remove("hidden");
};

window.closePeriodReportModal = function() {
  const modal = document.getElementById("periodReportModal");
  if (modal) modal.classList.add("hidden");
};

window.downloadPdfDirect = async function() {
  const element = document.getElementById("periodReportPdfContent");
  const btnText = document.getElementById("downloadPdfBtnText");
  const btn = document.getElementById("downloadPdfBtn");

  if (!element) return;

  if (btnText) btnText.textContent = "Generating PDF...";
  if (btn) btn.disabled = true;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210; // A4 mm
    const pageHeight = 295; // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safePeriod = (currentHistoryPeriod || "period").replace(/\s+/g, "_");
    pdf.save(`NutriGlance_Nutrition_Report_${safePeriod}.pdf`);

    if (btnText) btnText.textContent = "✓ PDF Downloaded!";
    setTimeout(() => {
      if (btnText) btnText.textContent = "Download PDF";
      if (btn) btn.disabled = false;
    }, 2500);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("PDF generation failed. You can use the Print button to Save as PDF via browser!");
    if (btnText) btnText.textContent = "Download PDF";
    if (btn) btn.disabled = false;
  }
};

window.printPeriodReportDoc = function() {
  window.print();
};

// -------------------------------------------------------------
// History Dropdown & Quick Navigation Actions
// -------------------------------------------------------------
window.toggleNavHistoryDropdown = function(event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById("navHistoryDropdownMenu");
  if (menu) menu.classList.toggle("hidden");
};

window.closeNavHistoryDropdown = function() {
  const menu = document.getElementById("navHistoryDropdownMenu");
  if (menu) menu.classList.add("hidden");
};

window.closeUserDropdown = function() {
  const menu = document.getElementById("userDropdownMenu");
  if (menu) menu.classList.add("hidden");
};

window.navGoToHistory = function(period) {
  closeNavHistoryDropdown();
  closeUserDropdown();

  // Select period
  if (period && typeof selectHistoryPeriod === "function") {
    selectHistoryPeriod(period);
  }

  // Smooth scroll to history section
  const section = document.getElementById("historySection");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.navGeneratePdf = function() {
  closeNavHistoryDropdown();
  closeUserDropdown();

  if (typeof openPdfReportModal === "function") {
    openPdfReportModal();
  }
};

// -------------------------------------------------------------
// Supabase Email Authentication & Session Management
// -------------------------------------------------------------
let currentAuthTab = "signin";

async function initSupabaseAuth() {
  // First check if there is a saved user in localStorage
  try {
    const saved = localStorage.getItem("nutriglance_user");
    if (saved) {
      currentUser = JSON.parse(saved);
    }
  } catch (e) {}

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  if (!service || !service.isConfigured()) {
    updateUserAuthUI();
    return;
  }

  // Check Supabase session
  try {
    const user = await service.getCurrentUser();
    if (user) {
      currentUser = user;
      localStorage.setItem("nutriglance_user", JSON.stringify(user));
    }
  } catch (e) {
    console.warn("Could not check current Supabase user:", e);
  }

  updateUserAuthUI();

  // Listen for login/logout state changes
  service.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      currentUser = await service.getCurrentUser();
      if (currentUser) {
        localStorage.setItem("nutriglance_user", JSON.stringify(currentUser));
      }
      updateUserAuthUI();
      await loadMeals();
      if (typeof loadHistory === "function" && currentHistoryPeriod) {
        await loadHistory(currentHistoryPeriod);
      }
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      localStorage.removeItem("nutriglance_user");
      updateUserAuthUI();
      await loadMeals();
      if (typeof loadHistory === "function" && currentHistoryPeriod) {
        await loadHistory(currentHistoryPeriod);
      }
    }
  });
}

function updateUserAuthUI() {
  const signInBtn = document.getElementById("authSignInBtn");
  const userWidget = document.getElementById("userProfileWidget");
  const userNameSpan = document.getElementById("userNameSpan");
  const userDropdownName = document.getElementById("userDropdownName");
  const userDropdownEmail = document.getElementById("userDropdownEmail");
  const userAvatarText = document.getElementById("userAvatarText");
  const userDropdownAvatar = document.getElementById("userDropdownAvatar");

  if (currentUser) {
    if (signInBtn) signInBtn.classList.add("hidden");
    if (userWidget) userWidget.classList.remove("hidden");

    const displayName = currentUser.name || (currentUser.email ? currentUser.email.split("@")[0] : "User");
    const initial = (displayName.charAt(0) || "U").toUpperCase();

    if (userNameSpan) userNameSpan.textContent = displayName.split(" ")[0];
    if (userDropdownName) userDropdownName.textContent = displayName;
    if (userDropdownEmail) userDropdownEmail.textContent = currentUser.email || "";
    if (userAvatarText) userAvatarText.textContent = initial;
    if (userDropdownAvatar) userDropdownAvatar.textContent = initial;
  } else {
    if (signInBtn) signInBtn.classList.remove("hidden");
    if (userWidget) userWidget.classList.add("hidden");
  }
}

window.openAuthModal = function(tab = "signin") {
  const modal = document.getElementById("emailAuthModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  switchAuthTab(tab);

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  const alertBox = document.getElementById("authAlertBanner");
  const alertMsg = document.getElementById("authAlertMessage");

  if (!service || !service.isConfigured()) {
    if (alertBox && alertMsg) {
      alertMsg.innerHTML = `<span class="flex items-center gap-1.5"><span>💡</span><span>Local mode active. <button type="button" onclick="closeAuthModal(); openSupabaseModal();" class="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 ml-1">Connect Supabase for cloud sync →</button></span></span>`;
      alertBox.className = "p-3 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-between";
      alertBox.classList.remove("hidden");
    }
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById("emailAuthModal");
  if (modal) modal.classList.add("hidden");
  const alertBox = document.getElementById("authAlertBanner");
  if (alertBox) alertBox.classList.add("hidden");
};

window.switchAuthTab = function(tab) {
  currentAuthTab = tab;
  const isSignIn = tab === "signin";

  const tabIn = document.getElementById("authTabSignIn");
  const tabUp = document.getElementById("authTabSignUp");
  const nameField = document.getElementById("authNameField");
  const forgotBtn = document.getElementById("authForgotBtn");
  const submitText = document.getElementById("authSubmitBtnText");
  const modalTitle = document.getElementById("authModalTitle");
  const modalSub = document.getElementById("authModalSubtitle");
  const alertBox = document.getElementById("authAlertBanner");

  if (alertBox) alertBox.classList.add("hidden");

  if (isSignIn) {
    if (tabIn) tabIn.className = "py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all text-center";
    if (tabUp) tabUp.className = "py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-center";
    if (nameField) nameField.classList.add("hidden");
    if (forgotBtn) forgotBtn.classList.remove("hidden");
    if (submitText) submitText.textContent = "Sign In";
    if (modalTitle) modalTitle.textContent = "Welcome Back";
    if (modalSub) modalSub.textContent = "Sign in to access your nutritional targets and meals.";
  } else {
    if (tabIn) tabIn.className = "py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-center";
    if (tabUp) tabUp.className = "py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all text-center";
    if (nameField) nameField.classList.remove("hidden");
    if (forgotBtn) forgotBtn.classList.add("hidden");
    if (submitText) submitText.textContent = "Create Account";
    if (modalTitle) modalTitle.textContent = "Create an Account";
    if (modalSub) modalSub.textContent = "Register with your email to store your meals privately in Supabase.";
  }
};

window.handleEmailAuthSubmit = async function(event) {
  if (event) event.preventDefault();

  const alertBox = document.getElementById("authAlertBanner");
  const alertMsg = document.getElementById("authAlertMessage");
  const emailInput = document.getElementById("authEmailInput");
  const passInput = document.getElementById("authPasswordInput");
  const nameInput = document.getElementById("authFullNameInput");
  const submitBtn = document.getElementById("authSubmitBtn");
  const submitText = document.getElementById("authSubmitBtnText");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passInput ? passInput.value.trim() : "";
  const fullName = nameInput ? nameInput.value.trim() : "";

  if (!email || !password) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = "Please fill in all required fields.";
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
      alertBox.classList.remove("hidden");
    }
    return;
  }

  if (password.length < 6) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = "Password must be at least 6 characters.";
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
      alertBox.classList.remove("hidden");
    }
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.textContent = currentAuthTab === "signin" ? "Signing In..." : "Creating Account...";

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  const isCloud = service && service.isConfigured();

  try {
    if (isCloud) {
      // ⚡ Cloud Authentication with Supabase
      if (currentAuthTab === "signin") {
        const res = await service.signInWithEmail(email, password);
        if (res && res.user) {
          if (alertBox && alertMsg) {
            alertMsg.textContent = "✓ Signed in successfully via Supabase Cloud!";
            alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
            alertBox.classList.remove("hidden");
          }
          currentUser = await service.getCurrentUser();
          if (currentUser) {
            localStorage.setItem("nutriglance_user", JSON.stringify(currentUser));
          }
          updateUserAuthUI();
          setTimeout(() => {
            closeAuthModal();
          }, 900);
        }
      } else {
        const res = await service.signUpWithEmail(email, password, fullName);
        if (res) {
          if (alertBox && alertMsg) {
            if (res.session) {
              alertMsg.textContent = "✓ Account created & signed in successfully!";
              alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
              alertBox.classList.remove("hidden");
              currentUser = await service.getCurrentUser();
              if (currentUser) {
                localStorage.setItem("nutriglance_user", JSON.stringify(currentUser));
              }
              updateUserAuthUI();
              setTimeout(() => {
                closeAuthModal();
              }, 1100);
            } else {
              alertMsg.textContent = "✓ Account created! Please check your email to confirm your account, then sign in.";
              alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
              alertBox.classList.remove("hidden");
              setTimeout(() => {
                switchAuthTab("signin");
              }, 3000);
            }
          }
        }
      }
    } else {
      // 💾 Local Profile Mode (Instant sign-in when Supabase is not yet connected)
      const cleanName = fullName || email.split("@")[0];
      const localId = "local_" + btoa(encodeURIComponent(email)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
      currentUser = {
        id: localId,
        email: email,
        name: cleanName,
        isLocal: true
      };
      localStorage.setItem("nutriglance_user", JSON.stringify(currentUser));
      updateUserAuthUI();

      if (alertBox && alertMsg) {
        alertMsg.textContent = `✓ Welcome, ${cleanName}! Signed in successfully.`;
        alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
        alertBox.classList.remove("hidden");
      }

      setTimeout(() => {
        closeAuthModal();
      }, 800);
    }
  } catch (err) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = err.message || "Authentication error occurred.";
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
      alertBox.classList.remove("hidden");
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = currentAuthTab === "signin" ? "Sign In" : "Create Account";
  }
};

window.handleForgotPassword = async function() {
  const emailInput = document.getElementById("authEmailInput");
  const email = emailInput ? emailInput.value.trim() : "";
  const alertBox = document.getElementById("authAlertBanner");
  const alertMsg = document.getElementById("authAlertMessage");

  if (!email) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = "Please enter your email address above to receive a password reset link.";
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
      alertBox.classList.remove("hidden");
    }
    emailInput?.focus();
    return;
  }

  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  if (!service || !service.isConfigured()) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = "Supabase Cloud is required to send password reset emails. Please connect Supabase first.";
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
      alertBox.classList.remove("hidden");
    }
    return;
  }

  try {
    await service.resetPassword(email);
    if (alertBox && alertMsg) {
      alertMsg.textContent = `✓ Password reset link sent to ${email}!`;
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
      alertBox.classList.remove("hidden");
    }
  } catch (err) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = err.message;
      alertBox.className = "p-3 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
      alertBox.classList.remove("hidden");
    }
  }
};

window.handleSignOut = async function() {
  const service = window.SupabaseService || (typeof SupabaseService !== "undefined" ? SupabaseService : null);
  if (service) {
    try {
      await service.signOut();
    } catch (e) {}
  }
  currentUser = null;
  localStorage.removeItem("nutriglance_user");
  updateUserAuthUI();
  const dropdown = document.getElementById("userDropdownMenu");
  if (dropdown) dropdown.classList.add("hidden");

  const toast = document.getElementById("calcSuccessToast");
  const toastMsg = document.getElementById("calcToastMessage");
  if (toast && toastMsg) {
    toastMsg.textContent = "Signed out of your account.";
    toast.className = "p-3 rounded-xl bg-slate-700 text-white text-xs font-bold shadow-md flex items-center justify-between";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);
  }
};

window.toggleUserDropdown = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("userDropdownMenu");
  if (menu) menu.classList.toggle("hidden");
};

// Global click-outside listener to close dropdowns smoothly
document.addEventListener("click", function(event) {
  const navDropdown = document.getElementById("navHistoryDropdownMenu");
  const navWrapper = document.getElementById("navHistoryDropdownWrapper");
  if (navDropdown && !navDropdown.classList.contains("hidden")) {
    if (navWrapper && !navWrapper.contains(event.target)) {
      navDropdown.classList.add("hidden");
    }
  }

  const userDropdown = document.getElementById("userDropdownMenu");
  const userWidget = document.getElementById("userProfileWidget");
  if (userDropdown && !userDropdown.classList.contains("hidden")) {
    if (userWidget && !userWidget.contains(event.target)) {
      userDropdown.classList.add("hidden");
    }
  }
});




