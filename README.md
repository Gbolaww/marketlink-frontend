# MarketLink web app

The website for MarketLink, a marketplace that connects shoppers with vendors near them in Nigeria. Shoppers
search by product and location, add items to a cart, check out with delivery details and pay with Paystack.
Vendors manage their store, products, orders and payouts. Admins approve vendors.

Built with React 19, TypeScript, Vite, React Router, TanStack Query and Tailwind CSS 4.
The API lives in [`marketlink-backend`](https://github.com/Gbolaww/marketlink-backend).

## Run it locally

You need Node.js 20.19 or newer (or 22.12+) and the backend running (see its README).

```bash
npm install
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run lint` | ESLint |

### Where the API is

`VITE_API_URL` sets the API address. It is read from `.env` (committed, pointing at `http://localhost:8000`) and
can be overridden by a real environment variable. The backend only accepts requests from sites listed in its
`FRONTEND_URL` / `CORS_ORIGINS`, and in development it allows `http://localhost:5173`. If you run the
site on another port, add it to the backend's `CORS_ORIGINS`.

> **Heads-up:** `VITE_API_URL` is baked into the build. Changing it means rebuilding.

## Pages

| Address | Who | What |
|---|---|---|
| `/` | everyone | Landing page with search and nearby products |
| `/search` | everyone | Search by text, sort, distance, "use my location" |
| `/product/:id` | everyone | Product details, add to cart / buy now |
| `/cart` | everyone | Cart (one vendor per order) |
| `/checkout` | customer | Contact and delivery details, then payment |
| `/orders/callback` | customer | Where Paystack sends people back; confirms the payment |
| `/orders/:id` | customer | Order status timeline and printable receipt |
| `/account` | customer | Order history |
| `/vendor-dashboard` | vendor | Store, catalogue (add/edit, photos), orders, payouts |
| `/admin` | admin | Approve or reject vendors |
| `/auth` | everyone | Sign in / create account |
| `/security` | signed in | Two-factor authentication (required for admins) |

Signed-in state (tokens and user) lives in the browser's `localStorage` (see `src/lib/auth.ts`). Pages that need
a role redirect to `/auth` or `/` otherwise.

## Project layout

```
src/
  pages/            one file per page above
  components/
    layout/         header, footer, page shell
    ui/             buttons, inputs, badges, tabs
    ...             product card, image, rating, dashboard pieces, auth intro animation
  lib/
    api.ts          the axios client and every API call (one place to change an endpoint)
    auth.ts         tokens and current user
    cart.ts         cart kept in localStorage
    delivery.ts     remembered delivery details, Nigerian states
    products.ts     maps API search rows to the shape the UI uses
    usePaymentSync.ts   confirms unpaid orders with the backend
    utils.ts        money, dates, status labels, error messages
```

Money is stored and sent as **minor units** (kobo): `₦1,500.00` is `150000`. Format with `formatPrice()`.

## How payment works (so you can debug it)

1. **Checkout** sends `POST /orders` with the items and delivery details and gets back a Paystack `checkout_url`.
2. The customer pays on Paystack and is sent to `/orders/callback?reference=...`.
3. That page calls `POST /orders/verify`. The backend asks Paystack directly whether the payment succeeded and
   marks the order paid. This also works when Paystack's webhook can't reach the backend (for example locally).
4. `usePaymentSync` does the same for any unpaid order when the customer opens their orders, so someone who paid
   and closed the tab still sees the right status.

## Deploying

Full guide, covering the database, Redis, photo storage, payments, email and a go-live checklist, is in the
backend repo: [DEPLOYMENT.md](https://github.com/Gbolaww/marketlink-backend/blob/main/DEPLOYMENT.md).

For this repo, on any static host (Vercel, Netlify, Cloudflare Pages, ...):

- **Build command:** `npm run build`
- **Output folder:** `dist`
- **Environment variable (set before building):** `VITE_API_URL=https://api.your-domain.com`
- **Single-page-app routing:** the site has client-side routes, so unknown paths must serve `index.html`. This repo
  already includes it: `vercel.json` (Vercel) and `public/_redirects` (Netlify and Cloudflare Pages). Other hosts
  need the same "rewrite everything to `/index.html`" rule.

If a live build still points at `localhost`, the site shows a "This site isn't set up yet" message instead of
failing mysteriously. That means `VITE_API_URL` wasn't set on the host that built it.

## Conventions

- Talk to the backend only through `src/lib/api.ts`.
- Tailwind with design tokens in `src/index.css` (colors, fonts, shadows). Prefer the token classes
  (`bg-card`, `text-muted-foreground`, `border-border`) over raw colors.
- Run `npm run lint` and `npm run build` before opening a pull request. There is no automated test suite yet.
