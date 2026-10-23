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

-- 1. Create or Upgrade Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key
);

-- Ensure all required columns exist on profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Trigger to auto-create public.profiles entry when user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill any existing users from auth.users into public.profiles
insert into public.profiles (id, email, full_name)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- 2. Create or Upgrade Meals Table
create table if not exists public.meals (
  id text primary key
);

alter table public.meals add column if not exists user_id text;
alter table public.meals add column if not exists date text;
alter table public.meals add column if not exists meal_type text default 'breakfast';
alter table public.meals add column if not exists name text default 'Food Item';
alter table public.meals add column if not exists serving text;
alter table public.meals add column if not exists grams numeric;
alter table public.meals add column if not exists calories integer default 0;
alter table public.meals add column if not exists protein numeric default 0;
alter table public.meals add column if not exists carbs numeric default 0;
alter table public.meals add column if not exists fat numeric default 0;
alter table public.meals add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- Ensure user_id allows null and remove auth.users FK constraint if present
alter table public.meals drop constraint if exists meals_user_id_fkey;
alter table public.meals alter column user_id drop not null;

-- 3. Create or Upgrade User Targets Table
create table if not exists public.user_targets (
  id text primary key
);

alter table public.user_targets add column if not exists user_id text;
alter table public.user_targets add column if not exists target_calories integer default 2150;
alter table public.user_targets add column if not exists tdee integer;
alter table public.user_targets add column if not exists bmr integer;
alter table public.user_targets add column if not exists weight numeric;
alter table public.user_targets add column if not exists target_weight numeric;
alter table public.user_targets add column if not exists height numeric;
alter table public.user_targets add column if not exists age integer;
alter table public.user_targets add column if not exists gender text;
alter table public.user_targets add column if not exists activity_level text;
alter table public.user_targets add column if not exists goal text;
alter table public.user_targets add column if not exists protein_g numeric;
alter table public.user_targets add column if not exists carbs_g numeric;
alter table public.user_targets add column if not exists fat_g numeric;
alter table public.user_targets add column if not exists macro_preset text;
alter table public.user_targets add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

alter table public.user_targets drop constraint if exists user_targets_user_id_fkey;
alter table public.user_targets alter column user_id drop not null;

-- 4. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.user_targets enable row level security;

-- Open policies with DO EXCEPTION blocks so they never fail on duplicates
do $$
begin
  drop policy if exists "Allow all profiles access" on public.profiles;
  create policy "Allow all profiles access" on public.profiles for all to public using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  drop policy if exists "Allow all meals access" on public.meals;
  create policy "Allow all meals access" on public.meals for all to public using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  drop policy if exists "Allow all user_targets access" on public.user_targets;
  drop policy if exists "Allow all targets access" on public.user_targets;
  create policy "Allow all user_targets access" on public.user_targets for all to public using (true) with check (true);
exception
  when duplicate_object then null;
end $$;
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



  // -------------------------------------------------------------
  // Email Authentication via Supabase
  // -------------------------------------------------------------
  async signUpWithEmail(email, password, fullName = "") {
    if (!this.client) {
      throw new Error("Please configure your Supabase URL & Anon Key first.");
    }
    const cleanEmail = (email || "").trim();
    const cleanPassword = (password || "").trim();
    if (!cleanEmail || !cleanPassword) {
      throw new Error("Email and password are required.");
    }
    if (cleanPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const { data, error } = await this.client.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: fullName.trim() || cleanEmail.split("@")[0]
        }
      }
    });

    if (error) throw error;
    return data;
  },

  async signInWithEmail(email, password) {
    if (!this.client) {
      throw new Error("Please configure your Supabase URL & Anon Key first.");
    }
    const cleanEmail = (email || "").trim();
    const cleanPassword = (password || "").trim();
    if (!cleanEmail || !cleanPassword) {
      throw new Error("Please enter both email and password.");
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword
    });

    if (error) throw error;
    return data;
  },

  async resetPassword(email) {
    if (!this.client) {
      throw new Error("Please configure your Supabase URL & Anon Key first.");
    }
    const cleanEmail = (email || "").trim();
    if (!cleanEmail) throw new Error("Please enter your email address.");

    const { data, error } = await this.client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + window.location.pathname
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
          picture: session.user.user_metadata?.avatar_url || "",
          provider: "supabase_email"
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
      const user = await this.getCurrentUser();
      let query = this.client.from("meals").select("*").order("created_at", { ascending: true });
      if (user && user.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }
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
      const user = await this.getCurrentUser();
      const record = {
        id: meal.id || Math.random().toString(36).substring(2, 10),
        user_id: (user && user.id) ? user.id : (meal.user_id || null),
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
  },

  // -------------------------------------------------------------
  // User Profiles & Calculated Targets via Supabase
  // -------------------------------------------------------------
  async upsertProfile(user) {
    if (!this.client || !this.isConfigured() || !user || !user.id) return null;
    try {
      const profile = {
        id: user.id,
        email: user.email || "",
        full_name: user.name || user.email?.split("@")[0] || "User",
        avatar_url: user.picture || "",
        updated_at: new Date().toISOString()
      };
      const { data, error } = await this.client.from("profiles").upsert(profile, { onConflict: "id" });
      if (error) {
        console.warn("Supabase upsertProfile error:", error);
        return { error: error.message };
      }
      return { success: true, data };
    } catch (e) {
      console.warn("Supabase upsertProfile exception:", e);
      return { error: e.message };
    }
  },

  async fetchProfile(userId) {
    if (!this.client || !this.isConfigured()) return null;
    try {
      const user = await this.getCurrentUser();
      const uid = userId || user?.id;
      if (!uid) return null;
      const { data, error } = await this.client.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) {
        console.warn("Supabase fetchProfile error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase fetchProfile exception:", e);
      return null;
    }
  },

  async saveUserTargets(payload, result) {
    if (!this.client || !this.isConfigured()) return null;
    try {
      const user = await this.getCurrentUser();
      const targetId = user?.id || "guest_targets";
      const record = {
        id: targetId,
        user_id: user?.id || null,
        target_calories: result?.target_calories || 2150,
        tdee: result?.tdee || 2650,
        bmr: result?.bmr || 1680,
        weight: payload?.weight ? parseFloat(payload.weight) : null,
        target_weight: payload?.target_weight ? parseFloat(payload.target_weight) : null,
        height: payload?.height ? parseFloat(payload.height) : null,
        age: payload?.age ? parseInt(payload.age) : null,
        gender: payload?.gender || "male",
        activity_level: payload?.activity || "moderate",
        goal: payload?.goal || "maintain",
        protein_g: result?.macros?.protein?.grams || null,
        carbs_g: result?.macros?.carbs?.grams || null,
        fat_g: result?.macros?.fat?.grams || null,
        macro_preset: payload?.macro_preset || "balanced",
        updated_at: new Date().toISOString()
      };
      const { data, error } = await this.client.from("user_targets").upsert(record, { onConflict: "id" });
      if (error) {
        console.warn("Supabase saveUserTargets error:", error);
        return { error: error.message };
      }
      return { success: true, data };
    } catch (e) {
      console.warn("Supabase saveUserTargets exception:", e);
      return { error: e.message };
    }
  },

  async fetchUserTargets() {
    if (!this.client || !this.isConfigured()) return null;
    try {
      const user = await this.getCurrentUser();
      const targetId = user?.id || "guest_targets";
      const { data, error } = await this.client.from("user_targets").select("*").eq("id", targetId).maybeSingle();
      if (error) {
        console.warn("Supabase fetchUserTargets error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase fetchUserTargets exception:", e);
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

