
# H2H Frontend Scaffold v0.3 (Blue×Gold)

## Quick Start (inside your `frontend/` project)
1) Backup your current `src/` then copy these files into `frontend/`
2) Ensure dependencies:
   ```bash
   npm i react-router-dom
   npm i -D tailwindcss postcss autoprefixer
   ```
3) Place `tailwind.config.js`, `postcss.config.js`, and `src/index.css` in your project root as provided.
4) Set up env:
   - `.env` → `VITE_API_BASE=http://localhost:4000`
5) Run:
   ```bash
   npm run dev
   ```

Routes included:
- /auth/register, /auth/login
- /items, /items/:id
- /checkout?itemId=1
- Home redirects to /items

Replace mock API with your real endpoints in `src/lib/api.js` and pages.
