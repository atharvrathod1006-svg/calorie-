# NutriGlance Calorie Tracker 🥗🔥
### Advanced Full-Stack Calorie & Macronutrient Calculator

A modern, scientifically grounded full-stack application for calculating **Basal Metabolic Rate (BMR)**, **Total Daily Energy Expenditure (TDEE)**, **Macronutrient Distributions**, **Goal Timelines**, and **Daily Meal Calorie Logging**.

---

## 🌟 Key Features

1. **Scientific Metabolic Calculations**:
   - **Mifflin-St Jeor Equation**: ADA clinical gold-standard for metabolic rate prediction.
   - **Revised Harris-Benedict (1984)**: Classic baseline calculation.
   - **Katch-McArdle Formula**: Precise metabolic rate calculation based on Lean Body Mass and Body Fat %.
2. **Activity & Energy Expenditure Breakdown**:
   - 5 activity levels (Sedentary, Light, Moderate, Very Active, Extremely Active).
   - Visual breakdown of **BMR** (Basal Rate), **TEF** (Thermic Effect of Food), **NEAT** (Non-Exercise Activity), and **EAT** (Exercise Thermogenesis).
3. **Weight Targets & Projected Goal Timeline**:
   - Goal presets: Maintain, Mild Loss (-250 kcal), Standard Loss (-500 kcal), Aggressive Loss (-1000 kcal), Mild Gain (+250 kcal), Muscle Gain (+500 kcal), and Custom Deficit.
   - Computes target completion date, days and weeks needed, and weekly pace based on energy balance principles (7,700 kcal per kg of fat).
4. **Macronutrient Distribution & Interactive Donut Chart**:
   - Presets: Balanced (45/30/25), High-Protein (35/40/25), Low-Carb (20/40/40), Ketogenic (5/25/70).
   - Interactive custom sliders with 100% total balance validator.
   - Grams, calories, and protein per kg of bodyweight.
   - Interactive Chart.js donut chart.
5. **Interactive Food Search, Vegetarian Filters & Meal Tracker**:
   - Curated nutritional database including rich Indian & international vegetarian staples (Paneer, Dal, Chickpeas, Soya Chunks, Quinoa, Dahi, etc.).
   - Dedicated `🌱 Vegetarian` filter button and badges.
   - Quick Add Custom Food entry form with **direct gram input (`g`)**, portion steppers, and auto-calculating macros.
   - Real-time calorie meter progress bar with remaining calorie budget.
   - Active date switcher (Today, Yesterday, Custom date) for logging past meals.
6. **📊 Calorie History & Analytics Dashboard**:
   - View intake history across **Yesterday**, **Last Week (7 Days)**, **Last Month (30 Days)**, and **Custom Date Ranges**.
   - 5 KPI summary cards: Total Consumed, Daily Average, Avg Balance vs Target, Average Daily Macros, Tracking Adherence.
   - Interactive Chart.js daily trend line and bar chart against target goal.
   - Itemized day-by-day accordion list of all logged meals.
   - 30 days of pre-seeded historical meal data.
7. **📄 Downloadable PDF Nutrition Report**:
   - One-click branded PDF export powered by `jsPDF` and `html2canvas`.
   - Comprehensive executive summary, macro ratios, and complete daily nutrition ledger.
   - Native print preview layout fallback.
8. **🔐 Google Sign-In & Profile Sync**:
   - Google Identity Services integration with 1-click Demo Account fallback.
   - User profile sync with avatar and quick account management.
   - Dedicated **History** quick-access menu in the top login/navigation bar.
9. **Clinical Safety & Medical Advisory Checks**:
   - Flags when caloric intake drops below safe clinical thresholds (1,200 kcal for women, 1,500 kcal for men).
10. **Quality-of-Life & Offline Resilience**:
    - Seamless Metric (kg/cm) and Imperial (lbs/ft/in) unit switching with live value conversion.
    - Dark and Light mode theme toggle.
    - LocalStorage synchronization.
    - Built-in client-side calculation fallback if the server is offline.

---

## 📁 Project Architecture

```
calorie-calculator/
├── backend/
│   ├── app.py                  # Flask REST API server with history & Google auth
│   ├── calculator.py           # Mathematical engine (BMR, TDEE, macros, timelines, safety)
│   ├── food_database.py        # Curated nutritional database & vegetarian food logic
│   ├── requirements.txt        # Flask and Flask-CORS dependencies
│   └── test_calculator.py      # Automated unit test suite (13 tests)
├── frontend/
│   ├── index.html              # Responsive UI with Tailwind CSS, Chart.js, jsPDF & Google GIS
│   ├── css/
│   │   └── style.css           # Modern custom styling, transitions, and print layout
│   └── js/
│       ├── api.js              # REST API client with offline history and auth fallback
│       └── app.js              # Controller, Chart.js charts, meal logging & history analytics
├── run.bat                     # Windows double-click launcher
├── run.ps1                     # PowerShell launch script
└── README.md                   # Application documentation
```

---

## 🚀 How to Run the Application

### Option 1: Double-Click (Windows)
Double-click `run.bat` in the project root folder. It will launch the Flask server and open your default browser automatically.

### Option 2: PowerShell
Run the included PowerShell script:
```powershell
.\run.ps1
```

### Option 3: Manual Command Line
1. Navigate to the project directory:
   ```bash
   cd calorie-calculator
   ```
2. Run the Flask backend:
   ```bash
   python backend/app.py
   ```
3. Open your browser and go to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🧪 Running Automated Tests

Run the unit test suite:
```powershell
python -m unittest backend/test_calculator.py
```

All 13 automated unit tests validate formula accuracy, unit conversions, clinical safety warnings, history aggregation, Google authentication, and REST API flows.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and version check |
| `GET` | `/api/metadata` | Metadata about supported formulas, activities, and goals |
| `POST` | `/api/calculate` | Calculate BMR, TDEE, target calories, macros, and timeline |
| `GET` | `/api/foods` | Search food database (`?q=paneer&category=Vegetarian`) |
| `GET` | `/api/meals` | Retrieve logged meals with date filter (`?date=YYYY-MM-DD` or `all`) |
| `POST` | `/api/meals` | Log a food or custom meal entry with grams, macros, and date |
| `DELETE` | `/api/meals/<id>` | Remove a meal entry |
| `DELETE` | `/api/meals` | Clear all logged meals |
| `GET` | `/api/history` | Period history analytics (`?period=yesterday\|last_week\|last_month\|custom`) |
| `POST` | `/api/auth/google` | Google profile authentication and session token |

