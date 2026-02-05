# Vony Loan App (Supabase)

This project has been migrated off Base44 and now uses Supabase for auth, database, storage, and serverless functions.

## Setup
1. Create a Supabase project.
2. Enable Google provider in Supabase Auth.
3. Create the database tables (see schema notes below).
4. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET` (optional, default: `public`)

## PayPal (Live)
Deploy the Supabase Edge Functions in `supabase/functions` and set secrets:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_BASE=https://api-m.paypal.com`

## Schema Notes (high level)
Tables expected:
- `profiles` (id = auth user id, email, full_name, username, theme_preference, profile_picture_url, phone, location, role)
- `public_profiles` (id, user_id, username, full_name, profile_picture_url)
- `loans`
- `loan_agreements`
- `payments`
- `paypal_connections`
- `venmo_connections`

Row Level Security should allow users to read their own records and update their own profile.
