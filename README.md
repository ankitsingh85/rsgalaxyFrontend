# RS Galaxy Hotel — Frontend

Next.js 14 + TypeScript + TailwindCSS + Zustand

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Make sure backend is running on http://localhost:5000
npm run dev
```

Opens at **http://localhost:3000**

## Pages
- `/` — Home page with hero, search, About, Goa, Rishikesh, Featured Hotels
- `/hotels` — Hotel listing with filters
- `/hotels/[id]` — Hotel detail + room list
- `/rooms` — All rooms with type filter
- `/rooms/[id]` — Room detail + booking form
- `/contact` — Contact form
- `/login` — Login (with demo accounts)
- `/register` — Register new account
- `/dashboard` — Customer dashboard
- `/admin` — Admin panel (TODO)
- `/manager` — Manager panel (TODO)

## Stack
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS 3
- Zustand (state management)
- Axios (HTTP)
- js-cookie (token storage)
- react-hot-toast (notifications)
- lucide-react (icons)
