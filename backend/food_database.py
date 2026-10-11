"""
Curated Food & Nutritional Database
Provides calorie and macronutrient reference data for meal tracking,
including vegetarian and plant-based staples.
"""

FOOD_DATABASE = [
    # -------------------------------------------------------------
    # Proteins & Legumes (Non-Veg & Vegetarian)
    # -------------------------------------------------------------
    {"id": "p1", "name": "Chicken Breast (Cooked, skinless)", "category": "Protein", "serving": "100g", "calories": 165, "protein": 31.0, "carbs": 0.0, "fat": 3.6, "vegetarian": False},
    {"id": "p2", "name": "Salmon Fillet (Baked)", "category": "Protein", "serving": "100g", "calories": 208, "protein": 22.0, "carbs": 0.0, "fat": 13.0, "vegetarian": False},
    {"id": "p3", "name": "Whole Large Egg", "category": "Protein", "serving": "1 large (50g)", "calories": 72, "protein": 6.3, "carbs": 0.4, "fat": 4.8, "vegetarian": True},
    {"id": "p4", "name": "Egg Whites", "category": "Protein", "serving": "100g (~3 whites)", "calories": 52, "protein": 11.0, "carbs": 0.7, "fat": 0.2, "vegetarian": True},
    {"id": "p5", "name": "Canned Tuna in Water", "category": "Protein", "serving": "100g drained", "calories": 116, "protein": 26.0, "carbs": 0.0, "fat": 1.0, "vegetarian": False},
    {"id": "p6", "name": "Lean Ground Beef (90/10)", "category": "Protein", "serving": "100g cooked", "calories": 217, "protein": 26.1, "carbs": 0.0, "fat": 11.8, "vegetarian": False},
    {"id": "p7", "name": "Tofu (Firm)", "category": "Protein", "serving": "100g", "calories": 83, "protein": 10.0, "carbs": 2.0, "fat": 5.0, "vegetarian": True},
    {"id": "p8", "name": "Whey Protein Powder", "category": "Protein", "serving": "1 scoop (30g)", "calories": 120, "protein": 24.0, "carbs": 3.0, "fat": 1.5, "vegetarian": True},
    {"id": "p9", "name": "Turkey Breast (Sliced)", "category": "Protein", "serving": "100g", "calories": 104, "protein": 22.0, "carbs": 1.5, "fat": 1.0, "vegetarian": False},
    {"id": "p10", "name": "Shrimp (Cooked)", "category": "Protein", "serving": "100g", "calories": 99, "protein": 24.0, "carbs": 0.2, "fat": 0.3, "vegetarian": False},

    # ⭐ Vegetarian High-Protein Staples
    {"id": "v1", "name": "Paneer (Indian Cottage Cheese)", "category": "Protein", "serving": "100g", "calories": 265, "protein": 18.3, "carbs": 1.2, "fat": 20.8, "vegetarian": True},
    {"id": "v2", "name": "Low-Fat Paneer", "category": "Protein", "serving": "100g", "calories": 150, "protein": 25.0, "carbs": 3.0, "fat": 4.0, "vegetarian": True},
    {"id": "v3", "name": "Soya Chunks / Meal Maker (Cooked)", "category": "Protein", "serving": "100g", "calories": 120, "protein": 17.0, "carbs": 9.0, "fat": 0.5, "vegetarian": True},
    {"id": "v4", "name": "Boiled Chickpeas (Chana / Garbanzo)", "category": "Protein", "serving": "100g", "calories": 164, "protein": 8.9, "carbs": 27.4, "fat": 2.6, "vegetarian": True},
    {"id": "v5", "name": "Cooked Yellow Dal / Lentils", "category": "Protein", "serving": "100g (~1/2 cup)", "calories": 116, "protein": 9.0, "carbs": 20.0, "fat": 0.4, "vegetarian": True},
    {"id": "v6", "name": "Kidney Beans / Rajma (Cooked)", "category": "Protein", "serving": "100g", "calories": 127, "protein": 8.7, "carbs": 22.8, "fat": 0.5, "vegetarian": True},
    {"id": "v7", "name": "Moong Dal (Yellow Split, Cooked)", "category": "Protein", "serving": "100g", "calories": 105, "protein": 7.0, "carbs": 19.0, "fat": 0.4, "vegetarian": True},
    {"id": "v8", "name": "Edamame (Steamed green soybeans)", "category": "Protein", "serving": "100g", "calories": 122, "protein": 11.9, "carbs": 8.9, "fat": 5.2, "vegetarian": True},
    {"id": "v9", "name": "Tempeh (Cultured Soy)", "category": "Protein", "serving": "100g", "calories": 192, "protein": 20.3, "carbs": 7.6, "fat": 10.8, "vegetarian": True},
    {"id": "v10", "name": "Black Beans (Cooked)", "category": "Protein", "serving": "100g", "calories": 132, "protein": 8.9, "carbs": 23.7, "fat": 0.5, "vegetarian": True},
    {"id": "v11", "name": "Plant / Pea Protein Powder", "category": "Protein", "serving": "1 scoop (30g)", "calories": 115, "protein": 24.0, "carbs": 2.0, "fat": 1.5, "vegetarian": True},

    # -------------------------------------------------------------
    # Carbohydrates & Grains (Vegetarian)
    # -------------------------------------------------------------
    {"id": "c1", "name": "White Rice (Cooked)", "category": "Carbs", "serving": "1 cup (158g)", "calories": 205, "protein": 4.2, "carbs": 44.5, "fat": 0.4, "vegetarian": True},
    {"id": "c2", "name": "Brown Rice (Cooked)", "category": "Carbs", "serving": "1 cup (195g)", "calories": 218, "protein": 4.5, "carbs": 45.8, "fat": 1.6, "vegetarian": True},
    {"id": "c3", "name": "Rolled Oats (Dry)", "category": "Carbs", "serving": "1/2 cup (40g)", "calories": 150, "protein": 5.0, "carbs": 27.0, "fat": 2.5, "vegetarian": True},
    {"id": "c4", "name": "Whole Wheat Bread", "category": "Carbs", "serving": "1 slice (40g)", "calories": 92, "protein": 4.0, "carbs": 17.0, "fat": 1.2, "vegetarian": True},
    {"id": "c5", "name": "Sweet Potato (Baked)", "category": "Carbs", "serving": "1 medium (150g)", "calories": 135, "protein": 3.0, "carbs": 31.0, "fat": 0.2, "vegetarian": True},
    {"id": "c6", "name": "Potato (Boiled)", "category": "Carbs", "serving": "1 medium (150g)", "calories": 130, "protein": 3.0, "carbs": 30.0, "fat": 0.2, "vegetarian": True},
    {"id": "c7", "name": "Pasta (Cooked)", "category": "Carbs", "serving": "1 cup (140g)", "calories": 220, "protein": 8.0, "carbs": 43.0, "fat": 1.3, "vegetarian": True},
    {"id": "c8", "name": "Quinoa (Cooked)", "category": "Carbs", "serving": "1 cup (185g)", "calories": 222, "protein": 8.1, "carbs": 39.4, "fat": 3.6, "vegetarian": True},
    {"id": "c9", "name": "Whole Wheat Roti / Chapati", "category": "Carbs", "serving": "1 medium (40g)", "calories": 120, "protein": 3.5, "carbs": 22.0, "fat": 1.5, "vegetarian": True},

    # -------------------------------------------------------------
    # Dairy & Plant-Based Alternatives (Vegetarian)
    # -------------------------------------------------------------
    {"id": "d1", "name": "Greek Yogurt (Non-fat, Plain)", "category": "Dairy", "serving": "1 cup (170g)", "calories": 100, "protein": 17.0, "carbs": 6.0, "fat": 0.7, "vegetarian": True},
    {"id": "d2", "name": "Cottage Cheese (Low fat 2%)", "category": "Dairy", "serving": "1/2 cup (113g)", "calories": 90, "protein": 13.0, "carbs": 4.5, "fat": 2.5, "vegetarian": True},
    {"id": "d3", "name": "Whole Milk", "category": "Dairy", "serving": "1 cup (244ml)", "calories": 149, "protein": 7.7, "carbs": 11.7, "fat": 8.0, "vegetarian": True},
    {"id": "d4", "name": "Almond Milk (Unsweetened)", "category": "Dairy", "serving": "1 cup (240ml)", "calories": 30, "protein": 1.0, "carbs": 1.0, "fat": 2.5, "vegetarian": True},
    {"id": "d5", "name": "Cheddar Cheese", "category": "Dairy", "serving": "1 oz (28g)", "calories": 113, "protein": 7.0, "carbs": 0.4, "fat": 9.3, "vegetarian": True},
    {"id": "d6", "name": "Plain Dahi / Curd (Yogurt)", "category": "Dairy", "serving": "1 cup (200g)", "calories": 120, "protein": 7.0, "carbs": 9.4, "fat": 6.0, "vegetarian": True},
    {"id": "d7", "name": "Soy Milk (Unsweetened)", "category": "Dairy", "serving": "1 cup (240ml)", "calories": 80, "protein": 7.0, "carbs": 4.0, "fat": 4.0, "vegetarian": True},

    # -------------------------------------------------------------
    # Fruits & Vegetables (Vegetarian)
    # -------------------------------------------------------------
    {"id": "f1", "name": "Banana", "category": "Fruit", "serving": "1 medium (118g)", "calories": 105, "protein": 1.3, "carbs": 27.0, "fat": 0.3, "vegetarian": True},
    {"id": "f2", "name": "Apple", "category": "Fruit", "serving": "1 medium (182g)", "calories": 95, "protein": 0.5, "carbs": 25.0, "fat": 0.3, "vegetarian": True},
    {"id": "f3", "name": "Blueberries", "category": "Fruit", "serving": "1 cup (148g)", "calories": 84, "protein": 1.1, "carbs": 21.4, "fat": 0.5, "vegetarian": True},
    {"id": "f4", "name": "Broccoli (Steamed)", "category": "Vegetable", "serving": "1 cup (150g)", "calories": 55, "protein": 3.7, "carbs": 11.2, "fat": 0.6, "vegetarian": True},
    {"id": "f5", "name": "Spinach / Palak (Cooked)", "category": "Vegetable", "serving": "1 cup (180g)", "calories": 41, "protein": 5.3, "carbs": 6.7, "fat": 0.5, "vegetarian": True},
    {"id": "f6", "name": "Green Peas (Boiled)", "category": "Vegetable", "serving": "1 cup (160g)", "calories": 134, "protein": 8.6, "carbs": 25.0, "fat": 0.4, "vegetarian": True},
    {"id": "f7", "name": "Avocado", "category": "Fats", "serving": "1/2 fruit (100g)", "calories": 160, "protein": 2.0, "carbs": 8.5, "fat": 14.7, "vegetarian": True},

    # -------------------------------------------------------------
    # Healthy Fats, Nuts & Seeds (Vegetarian)
    # -------------------------------------------------------------
    {"id": "n1", "name": "Almonds", "category": "Fats", "serving": "1 oz (28g / ~23 nuts)", "calories": 164, "protein": 6.0, "carbs": 6.1, "fat": 14.2, "vegetarian": True},
    {"id": "n2", "name": "Peanut Butter (Natural)", "category": "Fats", "serving": "2 tbsp (32g)", "calories": 190, "protein": 8.0, "carbs": 7.0, "fat": 16.0, "vegetarian": True},
    {"id": "n3", "name": "Roasted Peanuts", "category": "Fats", "serving": "1 oz (28g)", "calories": 166, "protein": 7.3, "carbs": 4.6, "fat": 14.1, "vegetarian": True},
    {"id": "n4", "name": "Olive Oil (Extra Virgin)", "category": "Fats", "serving": "1 tbsp (14g)", "calories": 119, "protein": 0.0, "carbs": 0.0, "fat": 13.5, "vegetarian": True},
    {"id": "n5", "name": "Walnuts", "category": "Fats", "serving": "1 oz (28g)", "calories": 185, "protein": 4.3, "carbs": 3.9, "fat": 18.5, "vegetarian": True},
    {"id": "n6", "name": "Chia Seeds (Raw)", "category": "Fats", "serving": "1 oz (28g)", "calories": 138, "protein": 4.7, "carbs": 11.9, "fat": 8.7, "vegetarian": True},
    {"id": "n7", "name": "Hummus (Chickpea Tahini Dip)", "category": "Fats", "serving": "2 tbsp (30g)", "calories": 75, "protein": 2.4, "carbs": 4.3, "fat": 5.2, "vegetarian": True},
]


def search_foods(query=None, category=None):
    """
    Search and filter foods by name substring or category.
    Supports filtering by 'Vegetarian' category or keyword.
    """
    results = FOOD_DATABASE

    if category and category.strip().lower() != "all":
        cat_lower = category.strip().lower()
        if cat_lower in ["vegetarian", "veg"]:
            results = [f for f in results if f.get("vegetarian", False)]
        else:
            results = [f for f in results if f["category"].lower() == cat_lower]

    if query and query.strip():
        q = query.strip().lower()
        if q in ["veg", "vegetarian"]:
            results = [f for f in results if f.get("vegetarian", False)]
        else:
            results = [
                f for f in results
                if q in f["name"].lower()
                or q in f["category"].lower()
                or (f.get("vegetarian", False) and q == "veg")
            ]

    return results


def get_food_by_id(food_id):
    """
    Retrieve single food item by unique ID.
    """
    for item in FOOD_DATABASE:
        if item["id"] == food_id:
            return item
    return None
