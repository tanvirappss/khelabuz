# Deployment Guide: World Cup 2026 Football Platform

This document describes how to deploy the database schema, register triggers, publish Edge Functions, and deploy the Next.js admin dashboard to production.

---

## 1. Supabase Database Setup

1. **Create Project**: Go to the [Supabase Dashboard](https://supabase.com) and create a new project.
2. **Execute Database Schema**:
   - Open the **SQL Editor** in the Supabase Dashboard.
   - Click "New Query" and paste the contents of [schema.sql](file:///c:/Users/Admin/Downloads/football%20app/supabase/schema.sql).
   - Run the query to create all tables, indexes, and Row Level Security (RLS) policies.
3. **Execute Triggers**:
   - Create a second "New Query" and paste the contents of [triggers.sql](file:///c:/Users/Admin/Downloads/football%20app/supabase/triggers.sql).
   - Run the query to install the PL/pgSQL database automation.
4. **Seed Mock Data (Optional)**:
   - Create a third query, paste the contents of [seed.sql](file:///c:/Users/Admin/Downloads/football%20app/supabase/seed.sql), and execute it to fill the tables with World Cup teams, matches, and default ad network configurations.

---

## 2. Supabase Edge Functions Deployment

Our Edge Function `send-push` forwards database notifications to OneSignal.

1. **Install Supabase CLI**:
   - Follow instructions on [Supabase CLI docs](https://supabase.com/docs/guides/cli) to install on your computer (e.g. `scoop install supabase` or `npm install -g supabase`).
2. **Login and Link Project**:
   ```bash
   # Login to your account
   supabase login

   # Link CLI to your project (Get API Reference ID from project settings)
   supabase link --project-ref your-project-ref
   ```
3. **Set Secrets (Environment Variables)**:
   Set the OneSignal credentials so the Deno script can authenticate with OneSignal's API:
   ```bash
   supabase secrets set ONESIGNAL_APP_ID="your-onesignal-app-id"
   supabase secrets set ONESIGNAL_REST_API_KEY="your-onesignal-rest-api-key"
   ```
4. **Deploy Edge Function**:
   ```bash
   supabase functions deploy send-push --no-verify-jwt
   ```
5. **Enable Database Webhook**:
   - In the Supabase Dashboard, navigate to **Database** -> **Webhooks**.
   - Create a Webhook called `on_notification_added`.
   - Table: `notifications`.
   - Events: Check `INSERT`.
   - Target: Select `Supabase Edge Function` and select the `send-push` function.
   - Click Save.

---

## 3. Next.js Admin Panel Deployment

The Next.js admin dashboard runs on Vercel or any Node.js hosting platform.

1. **Add Environmental Variables**:
   Configure the following environment variables in your deployment hosting settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL (e.g. `https://your-ref.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Public Anonymous Key.
2. **Build and Start**:
   ```bash
   # Navigate to the admin folder
   cd admin

   # Install dependencies
   npm install

   # Compile production build
   npm run build

   # Start server
   npm run start
   ```
3. **Vercel Deploy (Recommended)**:
   - Push your code to a Git repository (GitHub/GitLab).
   - Connect the repo to Vercel.
   - Vercel automatically detects Next.js settings. Input your environment variables and deploy.
