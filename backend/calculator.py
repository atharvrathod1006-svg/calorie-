"""
Calorie & Macro Calculation Engine
Scientific formulas for BMR, TDEE, macronutrient distribution, and weight projection.
"""

from datetime import datetime, timedelta
import math


def convert_to_metric(weight, height, unit_system="metric", height_inches=0):
    """
    Converts inputs to metric (kg, cm) if provided in imperial.
    """
    if unit_system.lower() == "imperial":
        # weight in lbs -> kg
        weight_kg = float(weight) * 0.45359237
        # height in feet + inches -> cm
        total_inches = (float(height) * 12) + float(height_inches or 0)
        height_cm = total_inches * 2.54
    else:
        weight_kg = float(weight)
        height_cm = float(height)
    return round(weight_kg, 2), round(height_cm, 2)


def calculate_bmr(gender, weight_kg, height_cm, age, formula="mifflin", body_fat=None):
    """
    Calculates Basal Metabolic Rate (BMR) using specified scientific formula.
    - mifflin: Mifflin-St Jeor (gold standard)
    - harris: Revised Harris-Benedict (1984 Roza and Shizgal)
    - katch: Katch-McArdle (accounts for body fat % and lean body mass)
    """
    gender = gender.lower().strip()
    age = float(age)

    if formula == "katch" and body_fat is not None and float(body_fat) > 0:
        bf = float(body_fat)
        lean_mass_kg = weight_kg * (1 - (bf / 100.0))
        # Katch-McArdle formula: 370 + 21.6 * lean body mass (kg)
        bmr = 370 + (21.6 * lean_mass_kg)
        return round(bmr)

    if formula == "harris":
        if gender == "male":
            bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
        return round(bmr)

    # Default to Mifflin-St Jeor
    if gender == "male":
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) + 5
    else:
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) - 161
    return round(bmr)


ACTIVITY_MULTIPLIERS = {
    "sedentary": {"factor": 1.2, "label": "Sedentary (little or no exercise, desk job)"},
    "light": {"factor": 1.375, "label": "Lightly Active (light exercise/sports 1-3 days/week)"},
    "moderate": {"factor": 1.55, "label": "Moderately Active (moderate exercise 3-5 days/week)"},
    "active": {"factor": 1.725, "label": "Very Active (hard exercise/sports 6-7 days/week)"},
    "extra": {"factor": 1.9, "label": "Extremely Active (hard exercise daily & physical job)"}
}

GOAL_ADJUSTMENTS = {
    "maintain": {"calorie_delta": 0, "label": "Maintain current weight", "weekly_change_kg": 0.0},
    "mild_loss": {"calorie_delta": -250, "label": "Mild weight loss (-0.25 kg / ~0.5 lb per week)", "weekly_change_kg": -0.25},
    "weight_loss": {"calorie_delta": -500, "label": "Standard weight loss (-0.5 kg / ~1.0 lb per week)", "weekly_change_kg": -0.5},
    "extreme_loss": {"calorie_delta": -1000, "label": "Aggressive weight loss (-1.0 kg / ~2.0 lb per week)", "weekly_change_kg": -1.0},
    "mild_gain": {"calorie_delta": 250, "label": "Mild weight / muscle gain (+0.25 kg / ~0.5 lb per week)", "weekly_change_kg": 0.25},
    "weight_gain": {"calorie_delta": 500, "label": "Standard weight / muscle gain (+0.5 kg / ~1.0 lb per week)", "weekly_change_kg": 0.5},
}


def calculate_tdee(bmr, activity_level="moderate"):
    """
    Calculates Total Daily Energy Expenditure (TDEE).
    """
    level_info = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), ACTIVITY_MULTIPLIERS["moderate"])
    multiplier = level_info["factor"]
    tdee = bmr * multiplier
    return round(tdee)


def calculate_energy_breakdown(tdee, bmr):
    """
    Approximates components of TDEE:
    - BMR: Basal Metabolic Rate
    - TEF: Thermic Effect of Food (~10%)
    - NEAT: Non-Exercise Activity Thermogenesis (~15%)
    - EAT: Exercise Activity Thermogenesis (the rest)
    """
    tef = round(tdee * 0.10)
    neat = round(tdee * 0.15)
    eat = max(0, tdee - (bmr + tef + neat))
    return {
        "bmr": bmr,
        "tef": tef,
        "neat": neat,
        "eat": eat,
        "tdee": tdee
    }


def calculate_macros(target_calories, weight_kg=None, custom_split=None):
    """
    Computes macronutrient gram & calorie targets for various diet protocols:
    Carbs: 4 kcal/g | Protein: 4 kcal/g | Fat: 9 kcal/g
    """
    splits = {
        "balanced": {"label": "Balanced Diet", "carbs_pct": 45, "protein_pct": 30, "fat_pct": 25},
        "high_protein": {"label": "High Protein / Athletic", "carbs_pct": 35, "protein_pct": 40, "fat_pct": 25},
        "low_carb": {"label": "Low Carb", "carbs_pct": 20, "protein_pct": 40, "fat_pct": 40},
        "keto": {"label": "Ketogenic", "carbs_pct": 5, "protein_pct": 25, "fat_pct": 70},
    }

    if custom_split and isinstance(custom_split, dict):
        splits["custom"] = {
            "label": "Custom Ratios",
            "carbs_pct": float(custom_split.get("carbs_pct", 40)),
            "protein_pct": float(custom_split.get("protein_pct", 30)),
            "fat_pct": float(custom_split.get("fat_pct", 30)),
        }

    results = {}
    for name, split in splits.items():
        c_pct = split["carbs_pct"]
        p_pct = split["protein_pct"]
        f_pct = split["fat_pct"]

        c_cals = round(target_calories * (c_pct / 100.0))
        p_cals = round(target_calories * (p_pct / 100.0))
        f_cals = round(target_calories * (f_pct / 100.0))

        c_grams = round(c_cals / 4.0)
        p_grams = round(p_cals / 4.0)
        f_grams = round(f_cals / 9.0)

        protein_per_kg = round(p_grams / weight_kg, 2) if weight_kg and weight_kg > 0 else None

        results[name] = {
            "label": split["label"],
            "percentages": {"carbs": c_pct, "protein": p_pct, "fat": f_pct},
            "calories": {"carbs": c_cals, "protein": p_cals, "fat": f_cals, "total": target_calories},
            "grams": {"carbs": c_grams, "protein": p_grams, "fat": f_grams},
            "protein_per_kg": protein_per_kg
        }

    return results


def check_health_safety(gender, target_calories, bmr, tdee, daily_delta):
    """
    Checks for clinical safety warnings regarding caloric intake.
    """
    warnings = []
    min_safe_calories = 1500 if gender.lower() == "male" else 1200

    if target_calories < min_safe_calories:
        warnings.append({
            "type": "danger",
            "title": "Caloric Intake Critically Low",
            "message": f"A target of {target_calories} kcal is below the general clinical minimum ({min_safe_calories} kcal for {gender}s). Prolonged intake below this level can lead to muscle loss, nutrient deficiencies, and metabolic slowdown. Consider a milder deficit."
        })
    elif target_calories < bmr:
        warnings.append({
            "type": "warning",
            "title": "Below Basal Metabolic Rate",
            "message": f"Your target ({target_calories} kcal) is slightly below your BMR ({bmr} kcal). While manageable for short periods, prioritize adequate protein and strength training to preserve lean mass."
        })

    if daily_delta < -1000:
        warnings.append({
            "type": "caution",
            "title": "Aggressive Caloric Deficit",
            "message": f"A deficit of {abs(daily_delta)} kcal/day exceeds standard clinical recommendations (-500 to -750 kcal/day). We recommend a more sustainable deficit for long-term consistency."
        })

    is_safe = len([w for w in warnings if w["type"] == "danger"]) == 0
    return {"is_safe": is_safe, "min_safe_calories": min_safe_calories, "alerts": warnings}


def project_weight_timeline(current_weight_kg, target_weight_kg, daily_calorie_delta):
    """
    Projects timeline and milestone dates to achieve target weight.
    1 kg body fat = ~7,700 kcal energy equivalent (or ~3,500 kcal per lb).
    """
    if target_weight_kg is None or target_weight_kg <= 0 or abs(current_weight_kg - target_weight_kg) < 0.1:
        return {
            "has_target": False,
            "message": "Maintain current weight"
        }

    weight_diff_kg = target_weight_kg - current_weight_kg
    is_losing = weight_diff_kg < 0
    needed_kg = abs(weight_diff_kg)

    if daily_calorie_delta == 0:
        return {
            "has_target": True,
            "achievable": False,
            "message": "At maintenance calories, weight will remain stable. Select a deficit or surplus to calculate your goal timeline."
        }

    # Verify direction matches delta
    if (is_losing and daily_calorie_delta > 0) or (not is_losing and daily_calorie_delta < 0):
        return {
            "has_target": True,
            "achievable": False,
            "message": "Your goal weight direction conflicts with your caloric deficit/surplus."
        }

    total_kcal_needed = needed_kg * 7700.0
    days_needed = math.ceil(total_kcal_needed / abs(daily_calorie_delta))
    weeks_needed = round(days_needed / 7.0, 1)

    target_date = datetime.now() + timedelta(days=days_needed)

    return {
        "has_target": True,
        "achievable": True,
        "current_weight_kg": current_weight_kg,
        "target_weight_kg": target_weight_kg,
        "weight_change_kg": round(weight_diff_kg, 1),
        "days_needed": days_needed,
        "weeks_needed": weeks_needed,
        "projected_date": target_date.strftime("%B %d, %Y"),
        "weekly_rate_kg": round(abs(daily_calorie_delta) * 7.0 / 7700.0, 2)
    }


def calculate_meal_breakdown(target_calories):
    """
    Generates recommended meal calorie budgets based on standard daily distribution:
    - Breakfast: 25%
    - Lunch: 35%
    - Dinner: 30%
    - Snacks: 10%
    """
    return {
        "breakfast": {"percentage": 25, "calories": round(target_calories * 0.25)},
        "lunch": {"percentage": 35, "calories": round(target_calories * 0.35)},
        "dinner": {"percentage": 30, "calories": round(target_calories * 0.30)},
        "snacks": {"percentage": 10, "calories": round(target_calories * 0.10)},
    }


def full_calorie_calculation(payload):
    """
    Complete calculation pipeline from request payload.
    """
    gender = payload.get("gender", "male").lower()
    age = int(payload.get("age", 25))
    unit_system = payload.get("unit_system", "metric").lower()
    raw_weight = payload.get("weight", 70)
    raw_height = payload.get("height", 175)
    height_inches = payload.get("height_inches", 0)
    raw_target_weight = payload.get("target_weight", None)

    # Convert to metric for calculation
    weight_kg, height_cm = convert_to_metric(raw_weight, raw_height, unit_system, height_inches)

    target_weight_kg = None
    if raw_target_weight:
        if unit_system == "imperial":
            target_weight_kg = round(float(raw_target_weight) * 0.45359237, 2)
        else:
            target_weight_kg = float(raw_target_weight)

    activity = payload.get("activity_level", "moderate")
    formula = payload.get("formula", "mifflin")
    body_fat = payload.get("body_fat", None)
    goal = payload.get("goal", "maintain")
    custom_delta = payload.get("custom_delta", None)
    custom_split = payload.get("custom_split", None)

    # 1. BMR
    bmr = calculate_bmr(gender, weight_kg, height_cm, age, formula=formula, body_fat=body_fat)

    # 2. TDEE
    tdee = calculate_tdee(bmr, activity_level=activity)

    # 3. Energy breakdown
    energy_breakdown = calculate_energy_breakdown(tdee, bmr)

    # 4. Target Calories
    if custom_delta is not None and str(custom_delta).strip() != "":
        daily_delta = int(custom_delta)
    else:
        goal_info = GOAL_ADJUSTMENTS.get(goal, GOAL_ADJUSTMENTS["maintain"])
        daily_delta = goal_info["calorie_delta"]

    target_calories = max(500, tdee + daily_delta)

    # 5. Safety check
    safety = check_health_safety(gender, target_calories, bmr, tdee, daily_delta)

    # 6. Macros
    macros = calculate_macros(target_calories, weight_kg=weight_kg, custom_split=custom_split)

    # 7. Timeline
    timeline = project_weight_timeline(weight_kg, target_weight_kg, daily_delta)

    # 8. Meal Breakdown
    meals = calculate_meal_breakdown(target_calories)

    # BMI calculation
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 1)
    if bmi < 18.5:
        bmi_status = "Underweight"
    elif bmi < 25.0:
        bmi_status = "Normal weight"
    elif bmi < 30.0:
        bmi_status = "Overweight"
    else:
        bmi_status = "Obese"

    return {
        "inputs": {
            "gender": gender,
            "age": age,
            "weight_kg": weight_kg,
            "height_cm": height_cm,
            "unit_system": unit_system,
            "activity_level": activity,
            "formula": formula,
            "body_fat": body_fat,
            "goal": goal,
            "target_weight_kg": target_weight_kg
        },
        "bmi": {
            "score": bmi,
            "category": bmi_status
        },
        "bmr": bmr,
        "tdee": tdee,
        "daily_calorie_delta": daily_delta,
        "target_calories": target_calories,
        "energy_breakdown": energy_breakdown,
        "safety": safety,
        "macros": macros,
        "timeline": timeline,
        "meal_distribution": meals
    }
