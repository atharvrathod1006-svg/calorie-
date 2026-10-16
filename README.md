# NutriGlance Calorie Tracker 🥗⚡
### Advanced Calorie & Macronutrient Tracker with Supabase Backend

A modern, scientifically grounded web application for calculating **Basal Metabolic Rate (BMR)**, **Total Daily Energy Expenditure (TDEE)**, **Macronutrient Distributions**, **Goal Timelines**, and **Daily Meal Calorie Logging** directly backed by **Supabase** (PostgreSQL & Auth).

---

## 🌟 Key Features

1. **⚡ Direct Supabase Integration**:
   - Direct connection from frontend to Supabase PostgreSQL database using `@supabase/supabase-js`.
   - Built-in Supabase Configuration modal with 1-click **Test & Connect**.
   - Offline resilience: automatically synchronizes with browser `localStorage` if Supabase credentials are not yet configured.
2. **Scientific Metabolic Calculations**:
   - **Mifflin-St Jeor Equation**: ADA clinical gold-standard for metabolic rate prediction.
   - **Revised Harris-Benedict (1984)**: Classic baseline calculation.
   - **Katch-McArdle Formula**: Precise metabolic rate calculation based on Lean Body Mass and Body Fat %.
3. **Activity & Energy Expenditure Breakdown**:
   - 5 activity levels (Sedentary, Light, Moderate, Very Active, Extremely Active).
   - Visual breakdown of **BMR** (Basal Rate), **TEF** (Thermic Effect of Food), **NEAT** (Non-Exercise Activity), and **EAT** (Exercise Thermogenesis).
4. **Weight Targets & Projected Goal Timeline**:
   - Goal presets: Maintain, Mild Loss (-250 kcal), Standard Loss (-500 kcal), Aggressive Loss (-1000 kcal), Mild Gain (+250 kcal), Muscle Gain (+500 kcal), and Custom Deficit.
   - Computes target completion date, days and weeks needed, and weekly pace based on energy balance principles (7,700 kcal per kg of fat).
5. **Macronutrient Distribution & Interactive Donut Chart**:
   - Presets: Balanced (45/30/25), High-Protein (35/40/25), Low-Carb (20/40/40), Ketogenic (5/25/70).
   - Interactive custom sliders with 100% total balance validator.
   - Grams, calories, and protein per kg of bodyweight.
   - Interactive Chart.js donut chart.
6. **Interactive Food Search, Vegetarian Filters & Meal Tracker**:
   - Curated nutritional database including rich Indian & international vegetarian staples (Paneer, Dal, Chickpeas, Soya Chunks, Quinoa, Dahi, etc.).
   - Dedicated `🌱 Vegetarian` filter button and badges.
   - Quick Add Custom Food entry form with **direct gram input (`g`)**, portion steppers, and auto-calculating macros.
   - Real-time calorie meter progress bar with remaining calorie budget.
   - Active date switcher (Today, Yesterday, Custom date) for logging past meals.
7. **📊 Calorie History & Analytics Dashboard**:
   - View intake history across **Yesterday**, **Last Week (7 Days)**, **Last Month (30 Days)**, and **Custom Date Ranges**.
   - 5 KPI summary cards: Total Consumed, Daily Average, Avg Balance vs Target, Average Daily Macros, Tracking Adherence.
   - Interactive Chart.js daily trend line and bar chart against target goal.
   - Itemized day-by-day accordion list of all logged meals.
   - 30 days of pre-seeded historical meal data.
8. **📄 Downloadable PDF Nutrition Report**:
   - One-click branded PDF export powered by `jsPDF` and `html2canvas`.
   - Comprehensive executive summary, macro ratios, and complete daily nutrition ledger.
   - Native print preview layout fallback.
9. **🔐 Google Sign-In & Supabase Auth**:
   - Google Identity Services & Supabase OAuth support with 1-click Demo Account fallback.
   - Dedicated **History** quick-access menu in the top login/navigation bar.

---

## 📁 Project Architecture

```
calorie-calculator/
├── frontend/
│   ├── index.html              # Modern UI with Tailwind CSS, Chart.js, jsPDF & Supabase
│   ├── css/
│   │   └── style.css           # Styling, animations, transitions, and print layout
│   └── js/
│       ├── supabase.js         # Supabase client service, CRUD, and SQL schema
│       ├── api.js              # Business logic, metabolic engine, and offline cache
│       └── app.js              # Controllers, Chart.js charts, history & UI state
├── run.bat                     # Windows 1-click launcher
├── run.ps1                     # PowerShell launch script
├── push.bat                    # 1-click GitHub push script
└── README.md                   # Application documentation
```

---

## ⚡ Connecting to Supabase (3 Simple Steps)

### Step 1: Create a Free Supabase Project
1. Go to [Supabase.com](https://supabase.com/) and click **Start your project**.
2. Give your project a name (e.g. `nutriglance`) and set a database password.

### Step 2: Run the SQL Setup Script
1. In your Supabase Dashboard, open the **SQL Editor** tab from the left sidebar.
2. Click **New query**, paste the following SQL script, and click **Run**:

```sql
-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Meals Table
create table if not exists public.meals (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  date text not null,
  meal_type text not null,
  name text not null,
  serving text,
  grams numeric,
  calories integer not null default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. User Target Goals Table
create table if not exists public.user_targets (
  user_id uuid references auth.users on delete cascade primary key,
  target_calories integer default 2150,
  weight numeric,
  target_weight numeric,
  height numeric,
  age integer,
  gender text,
  activity_level text,
  goal text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.user_targets enable row level security;

-- 5. RLS Policies
create policy "Allow all profiles access" on public.profiles for all using (true) with check (true);
create policy "Allow all meals access" on public.meals for all using (true) with check (true);
create policy "Allow all targets access" on public.user_targets for all using (true) with check (true);
```

### Step 3: Enter Credentials in NutriGlance
1. Open NutriGlance in your browser (`http://127.0.0.1:5000` or double-click `run.bat`).
2. Click the **⚡ Supabase** button in the top navigation bar.
3. Paste your **Supabase Project URL** and **Anon Public Key** (found in *Supabase Dashboard → Project Settings → API*).
4. Click **⚡ Save & Test Connection** — your meals and data will now synchronize with Supabase in the cloud!

---

## 🚀 How to Run Locally

### Option 1: Double-Click (Windows)
Double-click `run.bat` in the project root folder. It will launch the local web server and open your default browser automatically.

### Option 2: PowerShell
Run the included PowerShell script:
```powershell
.\run.ps1
```

### Option 3: Direct Browser Open
Simply double-click `frontend/index.html` in your file explorer. NutriGlance is a zero-build client application that works out of the box in any browser!
