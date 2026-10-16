/**
 * Supabase Client & Service Integration for NutriGlance
 * Handles direct Supabase database operations, authentication, and table syncing.
 */

const SUPABASE_STORAGE_URL_KEY = "nutriglance_supabase_url";
const SUPABASE_STORAGE_KEY_KEY = "nutriglance_supabase_key";

const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- NutriGlance Calorie Tracker - Supabase SQL Schema
-- Copy and run this in your Supabase SQL Editor:
-- ========================================================

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

-- 5. RLS Policies (Allow access to own records or public anonymous test logging)
create policy "Allow all profiles access" on public.profiles for all using (true) with check (true);
create policy "Allow all meals access" on public.meals for all using (true) with check (true);
create policy "Allow all targets access" on public.user_targets for all using (true) with check (true);
`;

const SupabaseService = {
  client: null,

  getUrl() {
    return localStorage.getItem(SUPABASE_STORAGE_URL_KEY) || "";
  },

  getAnonKey() {
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

    if (this.isConfigured() && window.supabase && window.supabase.createClient) {
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
    if (!this.client) {
      return { success: false, message: "Supabase client is not initialized." };
    }
    try {
      const { data, error } = await this.client.from("meals").select("id").limit(1);
      if (error) {
        return { success: false, message: `Connected, but table query returned: ${error.message}. (Did you run the SQL setup script?)` };
      }
      return { success: true, message: "Connected to Supabase database successfully!" };
    } catch (e) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  },

  // -------------------------------------------------------------
  // Authentication via Supabase
  // -------------------------------------------------------------
  async signInWithGoogle() {
    if (!this.client) {
      throw new Error("Please configure your Supabase URL & Anon Key first.");
    }
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return data;
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
          provider: "supabase_google"
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
        console.warn("Supabase insertMeal error:", error);
        return null;
      }
      return data && data[0] ? data[0] : record;
    } catch (e) {
      console.warn("Supabase insertMeal exception:", e);
      return null;
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

// Auto-initialize if credentials exist
document.addEventListener("DOMContentLoaded", () => {
  SupabaseService.init();
});
