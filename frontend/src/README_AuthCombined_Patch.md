# H2H Frontend — Auth Combined Patch v0.4

What this patch adds
- `src/pages/auth/AuthCombined.jsx` — Single page with Login/Register tabs.
- Updated `src/App.jsx`:
  - Adds route `/auth` (tab switch via `?tab=login|register`)
  - Adds aliases: `/login` → `/auth?tab=login` and `/register` → `/auth?tab=register`

How to apply
1) Unzip and copy `src/pages/auth/AuthCombined.jsx` to your project:
   `/Users/rnaibro/H2H_Thailand_v0.1.62/frontend/src/pages/auth/AuthCombined.jsx`

2) Replace your `src/App.jsx` with the one in this patch.

3) Run the dev server:
   ```bash
   cd /Users/rnaibro/H2H_Thailand_v0.1.62/frontend
   npm run dev
   ```

4) Open:
   - http://localhost:5173/auth?tab=login
   - http://localhost:5173/auth?tab=register
   - Aliases also work: /login and /register
