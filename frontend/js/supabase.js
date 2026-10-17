/**
 * Supabase Client & Service Integration for NutriGlance
 * Handles direct Supabase database operations, authentication, and table syncing.
 */

const SUPABASE_STORAGE_URL_KEY = "nutriglance_supabase_url";
const SUPABASE_STORAGE_KEY_KEY = "nutriglance_supabase_key";

const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- NutriGlance Calorie Tracker - Supabase SQL Schema
-- Copy and paste this into your Supabase SQL Editor:
-- ========================================================

-- 1. Create Meals Table
create table if not exists public.meals (
  id text primary key,
  user_id text,
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

-- Ensure user_id allows null and remove auth.users FK constraint if present
alter table public.meals drop constraint if exists meals_user_id_fkey;
alter table public.meals alter column user_id drop not null;

-- 2. Create User Target Goals Table
create table if not exists public.user_targets (
  id text primary key,
  user_id text,
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

-- 3. Row Level Security (RLS) Configuration
alter table public.meals enable row level security;
alter table public.user_targets enable row level security;

-- Drop any conflicting or restrictive policies
drop policy if exists "Allow all meals access" on public.meals;
drop policy if exists "Enable read access for all users" on public.meals;
drop policy if exists "Enable insert for all users" on public.meals;
drop policy if exists "Enable insert for authenticated users only" on public.meals;
drop policy if exists "Allow all targets access" on public.user_targets;

-- Create open RLS policies for public (allows both anon and authenticated users to read & write)
create policy "Allow all meals access" on public.meals for all to public using (true) with check (true);
create policy "Allow all targets access" on public.user_targets for all to public using (true) with check (true);
`;

const SupabaseService = {
  client: null,

  getUrl() {
    if (window.__ENV__ && window.__ENV__.SUPABASE_URL) return window.__ENV__.SUPABASE_URL;
    return localStorage.getItem(SUPABASE_STORAGE_URL_KEY) || "";
  },

  getAnonKey() {
    if (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) return window.__ENV__.SUPABASE_ANON_KEY;
    return localStorage.getItem(SUPABASE_STORAGE_KEY_KEY) || "";
  },

  isConfigured() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    return Boolean(url && key && url.startsWith("https://") && key.length > 20);
  },

  init() {
    const url = this.getUrl();
    const key = this.getAnonKey();

    if (this.isConfigured()) {
      if (!window.supabase || !window.supabase.createClient) {
        console.warn("Supabase JS SDK library not loaded yet.");
        return false;
      }
      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        console.log("⚡ Supabase Client initialized successfully with URL:", url);
        return true;
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
        this.client = null;
        return false;
      }
    } else {
      this.client = null;
      return false;
    }
  },

  saveCredentials(url, anonKey) {
    if (!url || !anonKey) {
      throw new Error("Both Supabase URL and Anon Public Key are required.");
    }
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const cleanKey = anonKey.trim();

    localStorage.setItem(SUPABASE_STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(SUPABASE_STORAGE_KEY_KEY, cleanKey);
    return this.init();
  },

  clearCredentials() {
    localStorage.removeItem(SUPABASE_STORAGE_URL_KEY);
    localStorage.removeItem(SUPABASE_STORAGE_KEY_KEY);
    this.client = null;
  },

  async testConnection() {
    if (!window.supabase || !window.supabase.createClient) {
      return { success: false, message: "Supabase JS SDK library is not loaded. Please check your internet connection." };
    }
    if (!this.client) {
      this.init();
    }
    if (!this.client) {
      return { success: false, message: "Could not initialize client. Check that your URL starts with https:// and anon key is valid." };
    }
    try {
      // 1. Test Read Permissions
      const { data, error } = await this.client.from("meals").select("id").limit(1);
      if (error) {
        if (error.code === "42P01" || (error.message && error.message.includes("does not exist"))) {
          return { success: false, message: "Connected, but the 'meals' table does not exist. Please run the SQL Setup Script below in Supabase SQL Editor." };
        }
        return { success: false, message: `Connected, but table query returned: ${error.message}` };
      }

      // 2. Test Write/Insert Permissions (Catches RLS and foreign-key blocks immediately!)
      const testId = "_ping_" + Math.random().toString(36).substring(2, 8);
      const { error: insertErr } = await this.client.from("meals").insert([{
        id: testId,
        date: new Date().toISOString().split("T")[0],
        meal_type: "breakfast",
        name: "Connection Verification Ping",
        calories: 0
      }]);

      if (insertErr) {
        return {
          success: false,
          message: `Connected, but CANNOT save meals: ${insertErr.message}. (Row Level Security is blocking inserts. Run the SQL script below in Supabase SQL editor to allow saving data).`
        };
      }

      // Clean up ping record
      await this.client.from("meals").delete().eq("id", testId);

      return { success: true, message: "✓ Connected & verified read/write access to Supabase successfully!" };
    } catch (e) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  },

  async syncLocalMeals() {
    if (!this.client) return { success: false, message: "Supabase not connected." };
    try {
      const local = JSON.parse(localStorage.getItem("calorie_meals") || "[]");
      if (!local || local.length === 0) {
        return { success: true, count: 0, message: "No local meals to sync." };
      }

      const records = local.map(m => ({
        id: m.id || Math.random().toString(36).substring(2, 10),
        date: m.date || new Date().toISOString().split("T")[0],
        meal_type: m.meal_type || "breakfast",
        name: m.name || "Food Item",
        serving: m.serving || "",
        grams: m.grams ? parseFloat(m.grams) : null,
        calories: parseInt(m.calories || 0),
        protein: parseFloat(m.protein || 0),
        carbs: parseFloat(m.carbs || 0),
        fat: parseFloat(m.fat || 0),
        created_at: m.created_at || new Date().toISOString()
      }));

      const { data, error } = await this.client.from("meals").upsert(records, { onConflict: "id" });
      if (error) {
        console.warn("Supabase syncLocalMeals error:", error);
        return { success: false, message: error.message };
      }
      return { success: true, count: records.length, message: `Successfully synced ${records.length} meals to Supabase!` };
    } catch (e) {
      console.warn("Supabase syncLocalMeals exception:", e);
      return { success: false, message: e.message };
    }
  },



  async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    localStorage.removeItem("nutriglance_user");
  },

  async getCurrentUser() {
    if (!this.client) return null;
    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (session && session.user) {
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          picture: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80",
          provider: "supabase"
        };
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase session:", e);
    }
    return null;
  },

  onAuthStateChange(callback) {
    if (!this.client) return null;
    return this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // -------------------------------------------------------------
  // Meals CRUD via Supabase
  // -------------------------------------------------------------
  async fetchMeals(date = "") {
    if (!this.client) return null;
    try {
      let query = this.client.from("meals").select("*").order("created_at", { ascending: true });
      if (date && date !== "all") {
        query = query.eq("date", date);
      }
      const { data, error } = await query;
      if (error) {
        console.warn("Supabase fetchMeals error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase fetchMeals exception:", e);
      return null;
    }
  },

  async insertMeal(meal) {
    if (!this.client) return null;
    try {
      const record = {
        id: meal.id || Math.random().toString(36).substring(2, 10),
        user_id: meal.user_id || null,
        date: meal.date,
        meal_type: meal.meal_type || "breakfast",
        name: meal.name,
        serving: meal.serving || "",
        grams: meal.grams ? parseFloat(meal.grams) : null,
        calories: parseInt(meal.calories || 0),
        protein: parseFloat(meal.protein || 0),
        carbs: parseFloat(meal.carbs || 0),
        fat: parseFloat(meal.fat || 0),
        created_at: meal.created_at || new Date().toISOString()
      };

      const { data, error } = await this.client.from("meals").insert([record]).select();
      if (error) {
        console.error("❌ Supabase insertMeal error:", error);
        return { error: error.message || "Failed to insert into Supabase" };
      }
      return { success: true, data: data && data[0] ? data[0] : record };
    } catch (e) {
      console.error("❌ Supabase insertMeal exception:", e);
      return { error: e.message || "Network exception saving to Supabase" };
    }
  },

  async deleteMeal(mealId) {
    if (!this.client) return null;
    try {
      const { error } = await this.client.from("meals").delete().eq("id", mealId);
      if (error) {
        console.warn("Supabase deleteMeal error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Supabase deleteMeal exception:", e);
      return false;
    }
  },

  async clearMeals(date = "") {
    if (!this.client) return null;
    try {
      let query = this.client.from("meals").delete();
      if (date) {
        query = query.eq("date", date);
      } else {
        query = query.neq("id", "none");
      }
      const { error } = await query;
      if (error) {
        console.warn("Supabase clearMeals error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Supabase clearMeals exception:", e);
      return false;
    }
  },

  async fetchHistory(startDate, endDate) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from("meals")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) {
        console.warn("Supabase fetchHistory error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase fetchHistory exception:", e);
      return null;
    }
  }
};

// Explicitly attach to window for global access across all scripts
window.SupabaseService = SupabaseService;

// Auto-initialize if credentials exist
document.addEventListener("DOMContentLoaded", () => {
  SupabaseService.init();
});

