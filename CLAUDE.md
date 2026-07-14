# Prosettings Project Guide

This file outlines the build, development, and style guidelines for the Prosettings project.

## Development & Build Commands
- **Start Development Server**: `npm run dev` (starts on port 3000 by default)
- **Production Build**: `npm run build`
- **Start Production Server**: `npm run start`
- **Lint Code**: `npm run lint`

## Architecture & Stack
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (vanilla CSS, no Tailwind v3 config)
- **Database / Backend**: Supabase (via `@supabase/supabase-js`)

## Code Style & Custom Guidelines

### 1. Database & Environment Setup
- Local configuration is loaded from `.env.local`.
- Never commit `.env.local` to Git. Keep the Supabase project URL (`NEXT_PUBLIC_SUPABASE_URL`) and Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) updated locally.
- SQL migrations/schemas are located under `supabase/schema.sql` and `supabase/membership_schema.sql`.

### 2. User & Member Profiles (`/profile`)
- **Team / Organisation**: The "Team / Organisation" input field has been removed from the user profile form.
- **Saving Profile**: Do not store or update the user's team information in the database.
- **Preview Card**: Hardcode the user's role on the preview card as `"Community Member"`.

### 3. Players Directory Filters (`/players`)
- **Custom Dropdowns**: Use custom styled dropdowns (`TeamSearchSelect` and `CountrySearchSelect`) instead of native HTML `<select>` tags.
- **Trigger Buttons**: Must contain vector icons (e.g. Users for Team, Flag for Nation) and clear buttons (`×`) when active.
- **Search-Select**: Integrate the search input *inside* the dropdown panel. Searching is real-time and filters the options.
- **Font Styling**: Always use sans-serif typography (`font-sans` or default layout font) for buttons and inputs. Avoid using `font-mono` unless displaying technical code values.
- **Team Logos**: Do not generate placeholder/typographic initials for team logos (leave the logo container `div` blank for future image styling).
- **Flag Emojis**: Render country flag emojis dynamically in the dropdown list and trigger using character code conversions from the 2-letter country code.

### 4. Code Standards
- Use functional React components and standard hooks.
- Use explicit type definitions for APIs and helper functions.
- Follow the Tailwind CSS v4 conventions for styling.
