<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HENG YUN ERP — Quick Reference

## Stack
- Next.js 16 (Pages Router, NOT App Router), React 19, TypeScript 5
- PostgreSQL via `pg` Pool (`src/lib/db.ts`), connection from `DATABASE_URL` env var
- JWT auth (jsonwebtoken), bcrypt, OTP/2FA (speakeasy, qrcode)
- Custom CSS (no Tailwind), FontAwesome 6, Chart.js
- ESLint 9 with flat config (`eslint.config.mjs`)

## Commands
| Command | Action |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (only verification; no typecheck, no tests) |

## Config quirks
- Both `next.config.js` and `next.config.ts` exist — `next.config.ts` is the active config
- `@/*` imports map to `./src/*` (via tsconfig paths)
- Next.js uses Turbopack (`next.config.js` enables it)

## Auth & routing
- **Pages Router** — routes live in `src/pages/`, API routes in `src/pages/api/`
- **Middleware** (`src/middleware.ts`): protects `/dashboard/*` and `/api/*`; allows `/api/public/*` freely
- **Client-side auth**: JWT stored in `localStorage` key `token`; `getAuthHeaders()` returns Bearer header
- **HOC guard**: `withAuth()` in `src/components/withAuth.tsx` for component-level protection
- **Roles**: `superadmin`, `admin`, `supervisor`, `service_provider` (`src/lib/roles.ts`)
- **Permission checks**: `hasPermission(userId, perm)` in `src/lib/permissions.ts`, DB-backed via RBAC tables
- **Login flow**: credentials → optional 2FA (TOTP via speakeasy) → JWT; stored in localStorage

## i18n
- `LanguageContext` (`src/contexts/LanguageContext.tsx`) with `{ locale, setLocale, t }`
- Languages: `en`, `rw` (Kinyarwanda), `zh` (Chinese)
- Translations in `src/data/translations.ts` (~3000 lines)
- Use `useTranslation()` hook from `src/hooks/useTranslation.ts`

## CSS architecture
- All CSS in `src/styles/`: `tokens.css` (design tokens), `globals.css`, `header.css`, `components.css`, `responsive.css`, `dashboard.css`
- No CSS-in-JS, no Tailwind — uses custom CSS modules only where needed (`Home.module.css`, `DashboardLayout.module.css`)

## Notable files
- `src/middleware.ts` — Edge middleware for route protection
- `src/data/translations.ts` — i18n dictionary (~3050 lines)
- `src/lib/constants.ts` — hardcoded JWT_SECRET fallback (env `JWT_SECRET` takes precedence)
- `scripts/` — Node.js utility scripts (DB migration, auth migration, etc.)
- `PROMPT.md` — AI-generated PHP conversion artifact; ignore
