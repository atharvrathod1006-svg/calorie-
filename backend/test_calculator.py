import os
import sys
import datetime
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from calculator import (
    convert_to_metric,
    calculate_bmr,
    calculate_tdee,
    calculate_macros,
    check_health_safety,
    project_weight_timeline,
    full_calorie_calculation
)
from food_database import search_foods, get_food_by_id
from app import app, MEAL_LOG


class TestCalorieEngine(unittest.TestCase):

    def test_unit_conversion(self):
        # 154 lbs -> ~69.85 kg
        w_kg, h_cm = convert_to_metric(154, 5, "imperial", height_inches=9)
        self.assertAlmostEqual(w_kg, 69.85, delta=0.5)
        # 5'9" = 69 inches = 175.26 cm
        self.assertAlmostEqual(h_cm, 175.26, delta=0.5)

    def test_mifflin_bmr(self):
        # Male, 70kg, 175cm, 25 years old
        # BMR = (10*70) + (6.25*175) - (5*25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
        bmr_male = calculate_bmr("male", 70, 175, 25, formula="mifflin")
        self.assertEqual(bmr_male, 1674)

        # Female, 60kg, 165cm, 30 years old
        # BMR = (10*60) + (6.25*165) - (5*30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
        bmr_female = calculate_bmr("female", 60, 165, 30, formula="mifflin")
        self.assertEqual(bmr_female, 1320)

    def test_harris_bmr(self):
        # Male, 70kg, 175cm, 25 years old
        # BMR = 88.362 + (13.397 * 70) + (4.799 * 175) - (5.677 * 25) = 88.362 + 937.79 + 839.825 - 141.925 = 1724.05 -> 1724
        bmr_harris = calculate_bmr("male", 70, 175, 25, formula="harris")
        self.assertEqual(bmr_harris, 1724)

    def test_katch_bmr(self):
        # 80kg, 15% body fat -> LBM = 80 * 0.85 = 68kg
        # BMR = 370 + 21.6 * 68 = 370 + 1468.8 = 1838.8 -> 1839
        bmr_katch = calculate_bmr("male", 80, 180, 28, formula="katch", body_fat=15)
        self.assertEqual(bmr_katch, 1839)

    def test_tdee_calculation(self):
        bmr = 1674
        # Moderate activity = 1.55
        tdee = calculate_tdee(bmr, "moderate")
        self.assertEqual(tdee, round(1674 * 1.55))

    def test_macro_distribution(self):
        target_calories = 2000
        macros = calculate_macros(target_calories, weight_kg=70)
        self.assertIn("balanced", macros)
        self.assertIn("high_protein", macros)
        self.assertIn("low_carb", macros)
        self.assertIn("keto", macros)

        balanced = macros["balanced"]
        # Carbs 45% = 900 kcal = 225g
        self.assertEqual(balanced["grams"]["carbs"], 225)
        # Protein 30% = 600 kcal = 150g
        self.assertEqual(balanced["grams"]["protein"], 150)
        # Fat 25% = 500 kcal = ~56g (500 / 9)
        self.assertEqual(balanced["grams"]["fat"], 56)

    def test_health_safety_warnings(self):
        # Male on 1200 calories should trigger a clinical minimum safety alert
        safety = check_health_safety("male", 1200, 1600, 2400, -1200)
        self.assertFalse(safety["is_safe"])
        self.assertTrue(any(a["type"] == "danger" for a in safety["alerts"]))

    def test_timeline_projection(self):
        # 80 kg to 75 kg with 500 kcal deficit
        # 5 kg to lose * 7700 = 38,500 kcal needed
        # 38,500 / 500 = 77 days = 11 weeks
        timeline = project_weight_timeline(80, 75, -500)
        self.assertTrue(timeline["has_target"])
        self.assertEqual(timeline["days_needed"], 77)
        self.assertEqual(timeline["weeks_needed"], 11.0)

    def test_food_database(self):
        all_foods = search_foods()
        self.assertGreater(len(all_foods), 15)

        chicken = search_foods(query="chicken")
        self.assertGreaterEqual(len(chicken), 1)
        self.assertIn("Chicken", chicken[0]["name"])

        veg_foods = search_foods(category="vegetarian")
        self.assertGreaterEqual(len(veg_foods), 20)

        paneer = search_foods(query="paneer")
        self.assertGreaterEqual(len(paneer), 1)
        self.assertTrue(paneer[0]["vegetarian"])

        item = get_food_by_id("p1")
        self.assertIsNotNone(item)
        self.assertEqual(item["calories"], 165)


class TestFlaskAPI(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        MEAL_LOG.clear()

    def test_api_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertEqual(json_data["status"], "healthy")

    def test_api_calculate(self):
        payload = {
            "gender": "male",
            "age": 28,
            "weight": 75,
            "height": 180,
            "activity_level": "moderate",
            "goal": "weight_loss"
        }
        res = self.client.post("/api/calculate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("bmr", data)
        self.assertIn("tdee", data)
        self.assertIn("target_calories", data)
        self.assertEqual(data["daily_calorie_delta"], -500)

    def test_api_meals_flow(self):
        # 1. Add food from database
        add_res = self.client.post("/api/meals", json={"meal_type": "lunch", "food_id": "p1", "servings": 2})
        self.assertEqual(add_res.status_code, 201)
        entry = add_res.get_json()["entry"]
        self.assertEqual(entry["calories"], 330)  # 165 * 2

        # 2. Get meals
        get_res = self.client.get("/api/meals")
        self.assertEqual(get_res.status_code, 200)
        totals = get_res.get_json()["totals"]
        self.assertEqual(totals["calories"], 330)

        # 3. Delete meal
        del_res = self.client.delete(f"/api/meals/{entry['id']}")
        self.assertEqual(del_res.status_code, 200)

        # 4. Verify empty
        get_res2 = self.client.get("/api/meals")
        self.assertEqual(len(get_res2.get_json()["meals"]), 0)

    def test_api_history_and_google_auth(self):
        # Add a meal for yesterday and today
        today_str = datetime.date.today().isoformat()
        yesterday_str = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

        self.client.post("/api/meals", json={"date": yesterday_str, "name": "Oatmeal", "calories": 300, "protein": 10, "carbs": 50, "fat": 5})
        self.client.post("/api/meals", json={"date": today_str, "name": "Paneer Rice", "calories": 600, "protein": 30, "carbs": 60, "fat": 20})

        # Test yesterday history
        res_y = self.client.get("/api/history?period=yesterday")
        self.assertEqual(res_y.status_code, 200)
        data_y = res_y.get_json()
        self.assertEqual(data_y["total_calories"], 300)

        # Test week history
        res_w = self.client.get("/api/history?period=last_week")
        self.assertEqual(res_w.status_code, 200)
        data_w = res_w.get_json()
        self.assertEqual(data_w["total_calories"], 900)
        self.assertEqual(len(data_w["daily_breakdown"]), 7)

        # Test google auth
        auth_res = self.client.post("/api/auth/google", json={"email": "user@example.com", "name": "Test User"})
        self.assertEqual(auth_res.status_code, 200)
        auth_data = auth_res.get_json()
        self.assertTrue(auth_data["success"])
        self.assertEqual(auth_data["user"]["email"], "user@example.com")


if __name__ == "__main__":
    unittest.main()
