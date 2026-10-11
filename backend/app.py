"""
Flask REST API Server for NutriGlance Calorie Tracker
Serves calculation endpoints, food database search, historical calorie tracking,
meal logging, Google authentication, and the frontend web app.
"""

import os
import uuid
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from calculator import (
    full_calorie_calculation,
    ACTIVITY_MULTIPLIERS,
    GOAL_ADJUSTMENTS
)
from food_database import search_foods, get_food_by_id

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# In-memory meal store for active session
# Structure: [{
#   "id": str, "user_id": str, "date": "YYYY-MM-DD",
#   "meal_type": "breakfast"|"lunch"|"dinner"|"snacks",
#   "name": str, "serving": str, "grams": float,
#   "calories": int, "protein": float, "carbs": float, "fat": float,
#   "created_at": str
# }]
MEAL_LOG = []


def seed_historical_meals():
    """
    Pre-seed 30 days of realistic nutrition history so the user can
    immediately test Yesterday, Last Week, and Last Month history & PDF reports.
    """
    global MEAL_LOG
    today = datetime.date.today()

    sample_daily_templates = [
        # Template A: High Protein Indian Vegetarian
        [
            {"meal_type": "breakfast", "name": "Rolled Oats with Almond Milk & Berries", "serving": "1 bowl (180g)", "grams": 180, "calories": 284, "protein": 9.1, "carbs": 52.4, "fat": 4.5},
            {"meal_type": "lunch", "name": "Paneer (Indian Cottage Cheese) with Brown Rice", "serving": "150g Paneer + 1 cup Rice", "grams": 345, "calories": 615, "protein": 32.0, "carbs": 47.0, "fat": 32.8},
            {"meal_type": "dinner", "name": "Cooked Yellow Dal with 2 Whole Wheat Rotis", "serving": "1 bowl Dal + 2 Rotis", "grams": 280, "calories": 472, "protein": 25.0, "carbs": 64.0, "fat": 3.8},
            {"meal_type": "snacks", "name": "Greek Yogurt with Banana & Roasted Peanuts", "serving": "1 cup + 1 fruit + nuts", "grams": 220, "calories": 371, "protein": 25.6, "carbs": 40.0, "fat": 15.1},
        ],
        # Template B: Balanced Fitness Day
        [
            {"meal_type": "breakfast", "name": "Whole Large Eggs (2) & Whole Wheat Bread", "serving": "2 eggs + 2 slices", "grams": 180, "calories": 328, "protein": 20.6, "carbs": 34.8, "fat": 12.0},
            {"meal_type": "lunch", "name": "Soya Chunks Curry with White Rice & Steamed Broccoli", "serving": "1 plate (350g)", "grams": 350, "calories": 545, "protein": 32.4, "carbs": 79.7, "fat": 2.1},
            {"meal_type": "dinner", "name": "Tofu & Mixed Veg Stir-Fry with Quinoa", "serving": "1 large bowl (320g)", "grams": 320, "calories": 490, "protein": 26.2, "carbs": 61.4, "fat": 12.6},
            {"meal_type": "snacks", "name": "Plant / Pea Protein Shake with Almonds", "serving": "1 scoop + 1 oz almonds", "grams": 58, "calories": 279, "protein": 30.0, "carbs": 8.1, "fat": 15.7},
        ],
        # Template C: Low-Carb / High Protein
        [
            {"meal_type": "breakfast", "name": "Egg Whites (3) with Spinach & Cheddar", "serving": "1 omelette (150g)", "grams": 150, "calories": 235, "protein": 26.2, "carbs": 3.5, "fat": 11.2},
            {"meal_type": "lunch", "name": "Boiled Chickpeas (Chana) Salad with Avocado", "serving": "1 bowl (250g)", "grams": 250, "calories": 570, "protein": 24.3, "carbs": 58.0, "fat": 27.3},
            {"meal_type": "dinner", "name": "Low-Fat Paneer & Palak (Spinach) Bhurji", "serving": "200g serving", "grams": 200, "calories": 341, "protein": 55.3, "carbs": 12.7, "fat": 8.5},
            {"meal_type": "snacks", "name": "Plain Dahi / Curd with Chia Seeds & Apple", "serving": "1 bowl (220g)", "grams": 220, "calories": 353, "protein": 12.2, "carbs": 46.3, "fat": 15.0},
        ],
        # Template D: Light / Deficit Day
        [
            {"meal_type": "breakfast", "name": "Rolled Oats with Peanut Butter & Apple", "serving": "1 bowl (180g)", "grams": 180, "calories": 385, "protein": 13.5, "carbs": 59.0, "fat": 18.5},
            {"meal_type": "lunch", "name": "Kidney Beans / Rajma with Steamed Rice", "serving": "1 bowl Rajma + 1 cup Rice", "grams": 300, "calories": 537, "protein": 21.6, "carbs": 90.1, "fat": 1.4},
            {"meal_type": "dinner", "name": "Moong Dal with 2 Rotis & Green Salad", "serving": "1 bowl Dal + 2 Rotis", "grams": 260, "calories": 450, "protein": 21.0, "carbs": 63.0, "fat": 3.4},
            {"meal_type": "snacks", "name": "Edamame & Hummus Dip with Carrots", "serving": "1 portion (150g)", "grams": 150, "calories": 297, "protein": 16.7, "carbs": 17.5, "fat": 15.6},
        ]
    ]

    # Populate 30 days of past logs (Day 29 ago down to Yesterday)
    for day_offset in range(29, 0, -1):
        target_date = (today - datetime.timedelta(days=day_offset)).isoformat()
        template = sample_daily_templates[day_offset % len(sample_daily_templates)]

        for item in template:
            MEAL_LOG.append({
                "id": str(uuid.uuid4())[:8],
                "user_id": "demo_user",
                "date": target_date,
                "meal_type": item["meal_type"],
                "name": item["name"],
                "serving": item["serving"],
                "grams": item.get("grams", 100),
                "calories": item["calories"],
                "protein": item["protein"],
                "carbs": item["carbs"],
                "fat": item["fat"],
                "created_at": f"{target_date}T12:00:00Z"
            })

    # Today initial sample meals
    today_str = today.isoformat()
    today_meals = [
        {"meal_type": "breakfast", "name": "Rolled Oats with Almond Milk & Berries", "serving": "1 bowl (180g)", "grams": 180, "calories": 284, "protein": 9.1, "carbs": 52.4, "fat": 4.5},
        {"meal_type": "lunch", "name": "Paneer (Indian Cottage Cheese) with Brown Rice", "serving": "150g Paneer + 1 cup Rice", "grams": 345, "calories": 615, "protein": 32.0, "carbs": 47.0, "fat": 32.8}
    ]
    for item in today_meals:
        MEAL_LOG.append({
            "id": str(uuid.uuid4())[:8],
            "user_id": "demo_user",
            "date": today_str,
            "meal_type": item["meal_type"],
            "name": item["name"],
            "serving": item["serving"],
            "grams": item.get("grams", 100),
            "calories": item["calories"],
            "protein": item["protein"],
            "carbs": item["carbs"],
            "fat": item["fat"],
            "created_at": f"{today_str}T08:30:00Z"
        })


# Seed initial history
seed_historical_meals()


@app.route("/")
def index():
    """Serve main frontend web page."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    """Serve frontend static assets."""
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Service healthcheck."""
    return jsonify({
        "status": "healthy",
        "service": "NutriGlance Calorie Tracker API",
        "version": "1.2.0",
        "total_logged_meals": len(MEAL_LOG)
    })


@app.route("/api/metadata", methods=["GET"])
def get_metadata():
    """Return activity multipliers and goal presets."""
    return jsonify({
        "activity_levels": ACTIVITY_MULTIPLIERS,
        "goals": GOAL_ADJUSTMENTS,
        "formulas": [
            {
                "id": "mifflin",
                "name": "Mifflin-St Jeor",
                "description": "Gold standard equation validated by clinical studies. Best for general population."
            },
            {
                "id": "harris",
                "name": "Revised Harris-Benedict",
                "description": "Historical benchmark updated in 1984. Good for standard metabolic tracking."
            },
            {
                "id": "katch",
                "name": "Katch-McArdle",
                "description": "Calculates based on Lean Body Mass. Most accurate if you know your Body Fat %."
            }
        ]
    })


@app.route("/api/calculate", methods=["POST"])
def calculate():
    """
    Calculate BMR, TDEE, macro split, target calories, and timeline.
    """
    data = request.get_json() or {}

    try:
        # Validate required numerical inputs
        age = int(data.get("age", 25))
        weight = float(data.get("weight", 70))
        height = float(data.get("height", 175))

        if age < 10 or age > 120:
            return jsonify({"error": "Age must be between 10 and 120."}), 400
        if weight <= 20 or weight > 500:
            return jsonify({"error": "Weight must be between 20kg (44lbs) and 500kg (1100lbs)."}), 400
        if height <= 50 or height > 300:
            return jsonify({"error": "Height must be between 50cm (20in) and 300cm (118in)."}), 400

        result = full_calorie_calculation(data)
        return jsonify({"success": True, "data": result})

    except ValueError as e:
        return jsonify({"error": f"Invalid numeric input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Internal calculation error: {str(e)}"}), 500


@app.route("/api/foods", methods=["GET"])
def foods():
    """
    Search foods by keyword query or category.
    """
    query = request.args.get("q", "").strip()
    category = request.args.get("category", "all").strip()
    results = search_foods(query=query, category=category)
    return jsonify({"success": True, "count": len(results), "foods": results})


@app.route("/api/meals", methods=["GET"])
def get_meals():
    """
    Retrieve logged meals and summary totals.
    Accepts optional 'date' parameter (defaults to today 'YYYY-MM-DD').
    Pass date='all' to fetch all historical meals.
    """
    date_param = request.args.get("date", "").strip()
    if not date_param:
        date_param = datetime.date.today().isoformat()

    if date_param.lower() == "all":
        filtered_meals = MEAL_LOG
    else:
        filtered_meals = [m for m in MEAL_LOG if m.get("date") == date_param]

    total_calories = sum(m.get("calories", 0) for m in filtered_meals)
    total_protein = round(sum(m.get("protein", 0) for m in filtered_meals), 1)
    total_carbs = round(sum(m.get("carbs", 0) for m in filtered_meals), 1)
    total_fat = round(sum(m.get("fat", 0) for m in filtered_meals), 1)

    return jsonify({
        "success": True,
        "date": date_param,
        "meals": filtered_meals,
        "totals": {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fat": total_fat
        }
    })


@app.route("/api/meals", methods=["POST"])
def add_meal():
    """
    Add meal item to log. Supports today, yesterday, or any past date.
    Accepts existing food_id or custom meal object.
    """
    data = request.get_json() or {}
    meal_type = data.get("meal_type", "breakfast").lower()
    food_id = data.get("food_id")
    date_str = data.get("date", "").strip() or datetime.date.today().isoformat()
    user_id = data.get("user_id", "demo_user")

    if food_id:
        food_item = get_food_by_id(food_id)
        if not food_item:
            return jsonify({"error": "Food item not found."}), 404

        grams = data.get("grams")
        if grams is not None and str(grams).strip() != "":
            grams_float = float(grams)
            servings = grams_float / 100.0
            serving_label = f"{grams_float:g}g"
        else:
            servings = float(data.get("servings", 1.0))
            serving_label = f"{servings}x ({food_item['serving']})"

        entry = {
            "id": str(uuid.uuid4())[:8],
            "user_id": user_id,
            "date": date_str,
            "meal_type": meal_type,
            "name": food_item["name"],
            "serving": serving_label,
            "grams": float(grams) if grams is not None and str(grams).strip() != "" else None,
            "calories": round(food_item["calories"] * servings),
            "protein": round(food_item["protein"] * servings, 1),
            "carbs": round(food_item["carbs"] * servings, 1),
            "fat": round(food_item["fat"] * servings, 1),
            "created_at": datetime.datetime.now().isoformat()
        }
    else:
        name = data.get("name", "Custom Food").strip()
        grams = data.get("grams")
        try:
            calories = int(data.get("calories", 0) or 0)
            protein = float(data.get("protein", 0) or 0)
            carbs = float(data.get("carbs", 0) or 0)
            fat = float(data.get("fat", 0) or 0)
            serving = data.get("serving", "").strip()

            if grams is not None and str(grams).strip() != "":
                grams_float = float(grams)
                if not serving or serving.lower() == f"{grams_float:g}g":
                    serving = f"{grams_float:g}g"
                elif f"{grams_float:g}g" not in serving:
                    serving = f"{serving} ({grams_float:g}g)"
            elif not serving:
                serving = "1 portion"

            if calories <= 0 and (protein > 0 or carbs > 0 or fat > 0):
                calories = round((protein * 4) + (carbs * 4) + (fat * 9))
        except (ValueError, TypeError):
            return jsonify({"error": "Nutritional values must be numbers."}), 400

        entry = {
            "id": str(uuid.uuid4())[:8],
            "user_id": user_id,
            "date": date_str,
            "meal_type": meal_type,
            "name": name,
            "serving": serving,
            "grams": float(grams) if grams is not None and str(grams).strip() != "" else None,
            "calories": calories,
            "protein": round(protein, 1),
            "carbs": round(carbs, 1),
            "fat": round(fat, 1),
            "created_at": datetime.datetime.now().isoformat()
        }

    MEAL_LOG.append(entry)
    return jsonify({"success": True, "entry": entry}), 201


@app.route("/api/meals/<meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    """
    Remove logged meal item by id.
    """
    global MEAL_LOG
    initial_len = len(MEAL_LOG)
    MEAL_LOG = [m for m in MEAL_LOG if m["id"] != meal_id]

    if len(MEAL_LOG) == initial_len:
        return jsonify({"error": "Meal entry not found."}), 404

    return jsonify({"success": True, "message": "Meal deleted."})


@app.route("/api/meals", methods=["DELETE"])
def clear_meals():
    """
    Clear logged meals (optionally for a specific date).
    """
    global MEAL_LOG
    date_param = request.args.get("date")
    if date_param:
        MEAL_LOG = [m for m in MEAL_LOG if m.get("date") != date_param]
        return jsonify({"success": True, "message": f"Meals for {date_param} cleared."})

    MEAL_LOG = []
    return jsonify({"success": True, "message": "Meal log cleared."})


# -----------------------------------------------------------------
# Calorie Consumption History & Analytics API
# -----------------------------------------------------------------
@app.route("/api/history", methods=["GET"])
def get_history():
    """
    Retrieve calorie and macro consumption history across periods:
    - yesterday: Only the previous calendar day
    - last_week: The past 7 days (including today or yesterday)
    - last_month: The past 30 days
    - custom: Between start_date and end_date
    """
    period = request.args.get("period", "last_week").lower()
    start_str = request.args.get("start_date", "").strip()
    end_str = request.args.get("end_date", "").strip()
    target_calories = int(request.args.get("target_calories", 2150))

    today = datetime.date.today()

    if period == "yesterday":
        start_date = today - datetime.timedelta(days=1)
        end_date = start_date
        period_label = f"Yesterday ({start_date.strftime('%a, %b %d, %Y')})"
    elif period in ["last_week", "week", "7d"]:
        start_date = today - datetime.timedelta(days=6)
        end_date = today
        period_label = f"Last 7 Days ({start_date.strftime('%b %d')} – {end_date.strftime('%b %d, %Y')})"
    elif period in ["last_month", "month", "30d"]:
        start_date = today - datetime.timedelta(days=29)
        end_date = today
        period_label = f"Last 30 Days ({start_date.strftime('%b %d')} – {end_date.strftime('%b %d, %Y')})"
    elif period == "custom" and start_str and end_str:
        try:
            start_date = datetime.date.fromisoformat(start_str)
            end_date = datetime.date.fromisoformat(end_str)
            period_label = f"Custom Period ({start_date.strftime('%b %d, %Y')} – {end_date.strftime('%b %d, %Y')})"
        except ValueError:
            start_date = today - datetime.timedelta(days=6)
            end_date = today
            period_label = "Last 7 Days"
    else:
        # Default 7 days
        start_date = today - datetime.timedelta(days=6)
        end_date = today
        period_label = f"Last 7 Days ({start_date.strftime('%b %d')} – {end_date.strftime('%b %d, %Y')})"

    # Collect day-by-day entries
    day_count = (end_date - start_date).days + 1
    daily_breakdown = []
    period_meals = []

    total_calories = 0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    logged_days_count = 0

    cur = start_date
    while cur <= end_date:
        cur_iso = cur.isoformat()
        day_meals = [m for m in MEAL_LOG if m.get("date") == cur_iso]

        day_cals = sum(m.get("calories", 0) for m in day_meals)
        day_p = round(sum(m.get("protein", 0) for m in day_meals), 1)
        day_c = round(sum(m.get("carbs", 0) for m in day_meals), 1)
        day_f = round(sum(m.get("fat", 0) for m in day_meals), 1)

        if day_cals > 0:
            logged_days_count += 1

        total_calories += day_cals
        total_protein += day_p
        total_carbs += day_c
        total_fat += day_f
        period_meals.extend(day_meals)

        delta = day_cals - target_calories

        daily_breakdown.append({
            "date": cur_iso,
            "day_name": cur.strftime("%a"),
            "full_day": cur.strftime("%A, %b %d"),
            "calories": day_cals,
            "target": target_calories,
            "delta": delta,
            "protein": day_p,
            "carbs": day_c,
            "fat": day_f,
            "meals_count": len(day_meals),
            "meals": day_meals
        })

        cur += datetime.timedelta(days=1)

    effective_days = max(1, day_count)
    daily_avg_calories = round(total_calories / effective_days)
    avg_protein = round(total_protein / effective_days, 1)
    avg_carbs = round(total_carbs / effective_days, 1)
    avg_fat = round(total_fat / effective_days, 1)
    avg_delta = daily_avg_calories - target_calories

    # Macro calories calculation
    p_cals = round(total_protein * 4)
    c_cals = round(total_carbs * 4)
    f_cals = round(total_fat * 9)
    macro_sum = max(1, p_cals + c_cals + f_cals)

    return jsonify({
        "success": True,
        "period": period,
        "period_label": period_label,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "day_count": day_count,
        "logged_days_count": logged_days_count,
        "target_calories": target_calories,
        "total_calories": total_calories,
        "daily_avg_calories": daily_avg_calories,
        "avg_delta": avg_delta,
        "macros": {
            "total_protein": round(total_protein, 1),
            "total_carbs": round(total_carbs, 1),
            "total_fat": round(total_fat, 1),
            "avg_protein": avg_protein,
            "avg_carbs": avg_carbs,
            "avg_fat": avg_fat,
            "percentages": {
                "protein": round((p_cals / macro_sum) * 100),
                "carbs": round((c_cals / macro_sum) * 100),
                "fat": round((f_cals / macro_sum) * 100)
            }
        },
        "daily_breakdown": daily_breakdown,
        "meals": period_meals
    })


# -----------------------------------------------------------------
# Google Authentication API
# -----------------------------------------------------------------
@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    """
    Handle Google Sign-In authentication.
    Accepts credential token or profile object and creates/returns authenticated user session.
    """
    data = request.get_json() or {}
    email = data.get("email", "alex.morgan@gmail.com")
    name = data.get("name", "Alex Morgan")
    picture = data.get("picture", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80")
    user_id = data.get("sub", str(uuid.uuid4())[:12])

    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "provider": "google",
        "logged_in_at": datetime.datetime.now().isoformat()
    }

    return jsonify({
        "success": True,
        "user": user,
        "token": f"nutriglance_token_{user_id}",
        "message": f"Successfully signed in as {name}"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"==================================================")
    print(f" NutriGlance Calorie Tracker Server Running on:   ")
    print(f" http://127.0.0.1:{port}                         ")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
