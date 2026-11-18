# Turnable: product photos to 3D

Turnable is a web app that turns **photos of a product** (front, back, top, bottom) into a **3D model** you can spin, recolor and restyle in the browser.

Users **sign in with their Google (Gmail) account** and can **subscribe** to a paid plan to unlock more features.

This README is also a **step-by-step course**. If you are a student, follow it from top to bottom. By the end you will have built, run and deployed a real web app with logins, payments, a database and 3D graphics.

---

## Table of contents

1. [What the app does](#1-what-the-app-does)
2. [The tools we use (and why)](#2-the-tools-we-use-and-why)
3. [How the app works: the big picture](#3-how-the-app-works-the-big-picture)
4. [The project folders explained](#4-the-project-folders-explained)
5. [Step 1: Prepare your computer](#step-1-prepare-your-computer)
6. [Step 2: Download the code and install it](#step-2-download-the-code-and-install-it)
7. [Step 3: Create the database (Neon)](#step-3-create-the-database-neon)
8. [Step 4: Set up "Sign in with Google"](#step-4-set-up-sign-in-with-google)
9. [Step 5: Set up subscriptions (Stripe)](#step-5-set-up-subscriptions-stripe)
10. [Step 6: Optional: AI 3D models and file storage](#step-6-optional-ai-3d-models-and-file-storage)
11. [Step 7: Run the app on your computer](#step-7-run-the-app-on-your-computer)
12. [Step 8: Put your code on GitHub](#step-8-put-your-code-on-github)
13. [Step 9: Deploy to Vercel (put it online)](#step-9-deploy-to-vercel-put-it-online)
14. [How the code works: a guided tour](#how-the-code-works-a-guided-tour)
15. [Ideas to practice](#ideas-to-practice)
16. [Troubleshooting](#troubleshooting)
17. [Glossary](#glossary)

---

## 1. What the app does

| Feature | How it works |
| --- | --- |
| **Upload photos** | Add a photo for the front, back, top and bottom (left and right are optional). |
| **Instant 3D** | Photos are placed on the faces of a 3D box or bottle shape. Ready in seconds. |
| **AI 3D** (paid plans) | Photos are sent to an AI service (Meshy) that rebuilds the real shape of the product. |
| **Edit the 3D model** | Change color, finish (matte, satin, glossy, metallic, glass), size, lighting and background. |
| **Download** | Save a PNG picture, or (paid plans) a `.glb` 3D file you can use in other apps. |
| **Sign in with Google** | No passwords to manage. Users click one button. |
| **Subscriptions** | Free, Pro ($9/month) and Studio ($29/month) plans, paid with Stripe. |

---

## 2. The tools we use (and why)

Don't worry if you don't know these yet. Each one is explained when we use it.

| Tool | What it is | Why we use it |
| --- | --- | --- |
| **Next.js** | A framework for building websites with React | Lets us build the pages **and** the server code (API) in one project |
| **React** | A library to build user interfaces from "components" | The standard way to build interactive web pages |
| **TypeScript** | JavaScript with types | Catches many mistakes before you run the code |
| **Tailwind CSS** | Styling with small class names like `p-4 text-lg` | Fast styling without writing big CSS files |
| **Three.js** + **React Three Fiber** | 3D graphics in the browser | Draws and animates our 3D product |
| **Auth.js** (NextAuth) | A login library | Handles "Sign in with Google" securely |
| **PostgreSQL** (on **Neon**) | A database | Stores users, subscriptions and projects |
| **Drizzle ORM** | Lets us talk to the database with TypeScript | Easier and safer than writing raw SQL |
| **Stripe** | An online payments service | Handles cards, monthly billing and cancellations |
| **Vercel Blob** | File storage | Stores uploaded photos and 3D files |
| **Meshy API** (optional) | An AI service that makes 3D models from photos | Powers the "AI 3D" feature |
| **Vercel** | A hosting service | Puts our app on the internet for free |

---

## 3. How the app works: the big picture

```
            ┌──────────────────────── BROWSER (the user's computer) ────────────────────────┐
            │                                                                                │
            │  Pages (React)  ──►  3D viewer (Three.js)  ──►  Editor controls (color, size…) │
            │        │                                                                       │
            └────────┼───────────────────────────────────────────────────────────────────────┘
                     │  fetch("/api/...")
            ┌────────▼──────────────── SERVER (Next.js API routes) ─────────────────────────┐
            │                                                                                │
            │  /api/auth/*        → Auth.js   ──► Google (who is this user?)                 │
            │  /api/upload        → saves photos  ──► Vercel Blob                            │
            │  /api/projects      → saves projects ──► PostgreSQL database                   │
            │  /api/stripe/*      → payments  ──► Stripe                                     │
            │  /api/projects/…/status → asks the AI if the model is ready ──► Meshy          │
            └────────────────────────────────────────────────────────────────────────────────┘
```

**A user's journey:**

1. The user clicks **Sign in** → Google asks "Do you allow Turnable to see your name and email?" → the user is logged in and a row is created in the `user` table.
2. On **New product**, they choose photos. The browser **shrinks** each photo, then sends it to `/api/upload`, which stores it and returns a URL.
3. They click **Build 3D model**. The server saves a **project** (name + photo URLs + default settings) in the database.
4. The **editor** page loads the project. Three.js puts each photo on one face of a 3D box.
5. When the user changes the color or size, React updates the `settings` object and the 3D view redraws instantly. **Save changes** sends the settings to the server.
6. To upgrade, the user picks a plan → our server asks Stripe for a **checkout page** → the user pays on Stripe → Stripe calls our **webhook** → we update the user's plan in the database.

---

## 4. The project folders explained

```
Product-3D-Studio/
├── src/
│   ├── app/                     ← Every folder here is a page (URL) of the website
│   │   ├── page.tsx             ← Home page  (/)
│   │   ├── layout.tsx           ← The frame around every page (navbar + footer)
│   │   ├── globals.css          ← Colors, fonts and shared styles
│   │   ├── login/               ← /login
│   │   ├── pricing/             ← /pricing
│   │   ├── dashboard/           ← /dashboard  (list of my products)
│   │   ├── account/             ← /account    (my plan, billing)
│   │   ├── studio/new/          ← /studio/new (upload photos)
│   │   ├── studio/[id]/         ← /studio/abc123 (the 3D editor). [id] = any value
│   │   └── api/                 ← Server code. These are not pages, they return JSON
│   │       ├── auth/            ← Google login (handled by Auth.js)
│   │       ├── upload/          ← Receives photos
│   │       ├── projects/        ← Create / update / delete projects
│   │       └── stripe/          ← Checkout, billing portal, webhook
│   ├── components/              ← Reusable pieces of UI
│   │   ├── three/               ← Everything 3D (the scene, materials, lights)
│   │   └── studio/              ← The upload form and the editor
│   ├── db/
│   │   ├── schema.ts            ← Our database tables, written in TypeScript
│   │   └── index.ts             ← The database connection
│   ├── lib/                     ← Helper code (plans, settings, Stripe, AI, storage)
│   └── auth.ts                  ← Login configuration
├── .env.example                 ← List of secret keys the app needs (copy to .env.local)
├── drizzle.config.ts            ← Database tool configuration
└── package.json                 ← List of libraries and commands
```

> 💡 **Rule of thumb:** files in `src/app/**/page.tsx` are **pages**, files in `src/app/api/**/route.ts` are **API endpoints**.

---

## Step 1: Prepare your computer

Install these programs (all free):

1. **Node.js** (version 20 or newer): https://nodejs.org → download the "LTS" version.
   Check it worked by opening a terminal and typing:
   ```bash
   node -v
   ```
   You should see something like `v22.x.x`.
2. **Git**: https://git-scm.com/downloads
   ```bash
   git --version
   ```
3. **A code editor**: [Visual Studio Code](https://code.visualstudio.com) is a great choice.
4. Create free accounts on:
   - [GitHub](https://github.com) (to store your code)
   - [Vercel](https://vercel.com) (to put your app online; sign up **with your GitHub account**)
   - [Neon](https://neon.tech) (database)
   - [Stripe](https://stripe.com) (payments; you don't need a real business for test mode)
   - A Google account (you already have one if you use Gmail)

> 🖥️ **What is a terminal?** It's a window where you type commands. On Mac open **Terminal**; on Windows open **PowerShell**; in VS Code use **Terminal → New Terminal**.

---

## Step 2: Download the code and install it

```bash
# 1. Download the project
#    (if you made your own copy with "Fork", use your own GitHub URL instead)
git clone https://github.com/djyacine95/Product-3D-Studio.git

# 2. Go into the project folder
cd Product-3D-Studio

# 3. Install all the libraries listed in package.json (takes 1–2 minutes)
npm install

# 4. Create your own secrets file from the example
cp .env.example .env.local
```

On Windows PowerShell, step 4 is: `copy .env.example .env.local`

Open `.env.local` in your editor. We will fill it in during the next steps.

> 🔐 **Important:** `.env.local` contains secret keys. It is listed in `.gitignore`, so Git will never upload it. **Never** share these keys or put them in your code.

---

## Step 3: Create the database (Neon)

The database stores users, subscriptions and projects.

1. Go to https://console.neon.tech and click **New Project**. Give it any name, e.g. `turnable`.
2. On the project dashboard click **Connect**. Copy the **connection string**. It looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Paste it into `.env.local`:
   ```
   DATABASE_URL=postgresql://neondb_owner:abc123@ep-cool-name...
   ```
4. Create the tables. This reads `src/db/schema.ts` and builds the tables for you:
   ```bash
   npm run db:push
   ```
   You should see `[✓] Changes applied`.
5. (Optional) Look inside your database in a nice web view:
   ```bash
   npm run db:studio
   ```

> 📚 **Learn:** open `src/db/schema.ts`. Each `pgTable("user", {...})` is a table, and each line inside is a column. If you add a column, run `npm run db:push` again.

---

## Step 4: Set up "Sign in with Google"

We need to tell Google about our app, so it can show the "Sign in with Google" screen.

### 4.1 Create a secret for Auth.js

```bash
npx auth secret
```

This adds a random `AUTH_SECRET` to your `.env.local` (if it writes to `.env` instead, copy the line into `.env.local`). Auth.js uses it to encrypt login cookies.

### 4.2 Create Google credentials

1. Open https://console.cloud.google.com and sign in.
2. At the top, click the project selector → **New Project** → name it `Turnable` → **Create**.
3. In the search bar type **"Google Auth Platform"** (also called *OAuth consent screen*) and open it. Click **Get started**:
   - **App name:** `Turnable`
   - **User support email:** your email
   - **Audience:** `External`
   - **Contact email:** your email → **Create**
4. Go to **Clients** → **Create client**:
   - **Application type:** `Web application`
   - **Name:** `Turnable web`
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
   - Click **Create**.
5. Copy the **Client ID** and **Client secret** into `.env.local`:
   ```
   AUTH_GOOGLE_ID=1234567890-abc.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxx
   ```
6. While the app is in "Testing" mode, only accounts listed under **Audience → Test users** can sign in. Add your own Gmail address there. When you are ready for everyone, click **Publish app**.

> 📚 **Learn:** open `src/auth.ts`. That's the whole login setup: one provider (`Google`) plus an adapter that saves users to our database. Auth.js automatically creates the URLs `/api/auth/signin`, `/api/auth/callback/google` and `/api/auth/signout`.

---

## Step 5: Set up subscriptions (Stripe)

Stripe has a **test mode** with fake money, so you can try everything without real cards.

### 5.1 Get your API key

1. Open https://dashboard.stripe.com and make sure **Test mode** is ON (switch at the top).
2. Go to **Developers → API keys**. Copy the **Secret key** (starts with `sk_test_`):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 5.2 Create the two paid plans

1. Go to **Product catalog → Add product**.
2. Create **Pro**: price `9.00 USD`, **Recurring**, **Monthly** → Save.
3. Create **Studio**: price `29.00 USD`, **Recurring**, **Monthly** → Save.
4. Open each product and copy its **Price ID** (starts with `price_`):
   ```
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_STUDIO=price_...
   ```

### 5.3 Turn on the Customer Portal

This is Stripe's ready-made page where users can change plan, update their card or cancel.

Go to **Settings → Billing → Customer portal** and click **Activate** (in test mode). Allow customers to *switch plans* and add both products.

### 5.4 Receive webhooks on your computer

A **webhook** is Stripe calling *our* server to say "this user just paid" or "this subscription was canceled". On your own computer, Stripe can't reach `localhost`, so we use the **Stripe CLI** to forward the messages.

1. Install the Stripe CLI: https://docs.stripe.com/stripe-cli
2. Log in:
   ```bash
   stripe login
   ```
3. Start forwarding (keep this terminal open while you test):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. It prints a secret like `whsec_...`. Put it in `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

> 💳 **Test card:** `4242 4242 4242 4242`, any future date, any CVC, any ZIP code.

> 📚 **Learn:** the payment flow is in three small files:
> - `src/app/api/stripe/checkout/route.ts`: creates the payment page
> - `src/app/api/stripe/webhook/route.ts`: updates the user's plan when Stripe tells us
> - `src/app/api/stripe/portal/route.ts`: opens the "manage billing" page
>
> The plans themselves (prices, limits, features) are described in `src/lib/plans.ts`.

---

## Step 6: Optional: AI 3D models and file storage

The app works without these two. Add them when you're ready.

### File storage (Vercel Blob)

Without it, photos are saved **inside the database** as text ("data URLs"). That's OK for learning, but slow for real use. In production, use Vercel Blob:

1. In Vercel, open your project → **Storage** → **Create** → **Blob** → connect it to your project.
2. Vercel adds `BLOB_READ_WRITE_TOKEN` to your project automatically.
3. To use it on your computer too, copy the token from **Storage → your store → .env.local tab** into your `.env.local`.

### AI 3D reconstruction (Meshy)

1. Create an account at https://www.meshy.ai and open the **API** page of the developer platform.
2. Create an API key and put it in `.env.local`:
   ```
   MESHY_API_KEY=msy_...
   ```
3. AI building uses paid credits on Meshy. Our app only lets **Pro** and **Studio** users use it, with a monthly limit (see `aiPerMonth` in `src/lib/plans.ts`).

> 📚 **Learn:** AI building takes minutes, so it can't happen in one request. Look at `src/lib/meshy.ts` and `src/app/api/projects/[id]/status/route.ts`:
> 1. We **start** a task and get a task ID.
> 2. The editor **asks every 5 seconds** "is it done?" (this is called *polling*).
> 3. When it's done, we copy the 3D file to our storage and show it.

---

## Step 7: Run the app on your computer

```bash
npm run dev
```

Open http://localhost:3000 in your browser. 🎉

**Try the whole flow:**

1. Play with the 3D tea box on the home page (colors and finishes).
2. Click **Sign in** → sign in with Google.
3. Click **New product** → add 4 photos → **Build 3D model**.
4. In the editor, change the color, finish and size → **Save changes**.
5. Click **Download image (PNG)**.
6. Go to **Pricing** → **Choose Pro** → pay with the test card `4242 4242 4242 4242`.
7. Back on **Account**, your plan now says **Pro**, and **Download 3D file (GLB)** is unlocked in the editor.

> 🛑 To stop the app, press `Ctrl + C` in the terminal.

**Useful commands**

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode (reloads when you save a file) |
| `npm run build` | Build the optimized production version (also checks for errors) |
| `npm start` | Run the production version (after `build`) |
| `npm run lint` | Check the code for common mistakes |
| `npm run db:push` | Update the database tables to match `schema.ts` |
| `npm run db:studio` | Browse your database in the browser |

---

## Step 8: Put your code on GitHub

Vercel deploys straight from GitHub, so your code must be there.

**Option A: with the terminal**

1. On GitHub click **New repository**, name it `turnable`, leave it **empty**, and click **Create**.
2. In your project folder:
   ```bash
   git add .
   git commit -m "My first version of Turnable"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/turnable.git
   git push -u origin main
   ```

**Option B: without the terminal**

On your new GitHub repository page, click **uploading an existing file** and drag in the project files. Do **not** upload `node_modules`, `.next` or `.env.local`.

---

## Step 9: Deploy to Vercel (put it online)

### 9.1 Import the project

1. Go to https://vercel.com/new.
2. Find your `turnable` repository and click **Import**.
3. Vercel detects **Next.js** automatically. Don't click Deploy yet. First open **Environment Variables**.

### 9.2 Add your environment variables

Add each line from your `.env.local` (name on the left, value on the right):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string |
| `AUTH_SECRET` | the same secret as in `.env.local` |
| `AUTH_GOOGLE_ID` | your Google client ID |
| `AUTH_GOOGLE_SECRET` | your Google client secret |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_PRICE_PRO` | `price_...` |
| `STRIPE_PRICE_STUDIO` | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | leave empty for now, we'll add it in 9.4 |
| `MESHY_API_KEY` | (optional) |

> 💡 Tip: you can paste your whole `.env.local` into the first field. Vercel splits it into lines for you. Don't add `AUTH_TRUST_HOST` or `NEXT_PUBLIC_APP_URL=http://localhost:3000` on Vercel.

Now click **Deploy**. After about a minute you get a URL like `https://turnable-yourname.vercel.app`. 🚀

### 9.3 Tell Google about your new address

Back in Google Cloud Console → **Google Auth Platform → Clients → Turnable web**, add:

- **Authorized JavaScript origins:** `https://turnable-yourname.vercel.app`
- **Authorized redirect URIs:** `https://turnable-yourname.vercel.app/api/auth/callback/google`

Save. Google sign-in now works on your live site.

### 9.4 Tell Stripe about your new address

1. In Stripe (test mode) go to **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://turnable-yourname.vercel.app/api/stripe/webhook`
3. **Events to send:** select
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**, then **Reveal** the **Signing secret** (`whsec_...`).
5. In Vercel → your project → **Settings → Environment Variables**, set `STRIPE_WEBHOOK_SECRET` to that value.

### 9.5 Add file storage and redeploy

1. Vercel → your project → **Storage → Create → Blob** → connect it (adds `BLOB_READ_WRITE_TOKEN`).
2. Go to **Deployments**, click the **⋯** menu on the latest one → **Redeploy**. New environment variables only apply after a redeploy.

✅ **Your app is live.** From now on, every `git push` to GitHub deploys a new version automatically.

> 🏁 **Going live with real payments:** switch Stripe to live mode, create the products again, and replace the `sk_test_`, `price_` and `whsec_` values with the live ones.

---

## How the code works: a guided tour

Read the files in this order. Every file has comments explaining what it does.

### 1. Logging in: `src/auth.ts`

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {...}), // save users in our database
  providers: [Google],                // "Sign in with Google"
  session: { strategy: "database" },
});
```

- `auth()` tells us who is logged in. We use it in pages and API routes.
- `signIn("google")` and `signOut()` are used by the buttons.
- `src/lib/current-user.ts` has `requireUser()`, which sends visitors to `/login` if they're not signed in. Every private page starts with it.

### 2. The database: `src/db/schema.ts`

Three tables matter to us: `user` (with the subscription columns), `project` (one per product) and the Auth.js tables (`account`, `session`). Reading data looks like this:

```ts
const list = await db.select().from(projects).where(eq(projects.userId, user.id));
```

> 🔒 **Security:** we always filter by `userId`, so users can only see and edit **their own** projects.

### 3. Uploading photos: `src/lib/image.ts` → `src/app/api/upload/route.ts`

1. In the browser, `shrinkImage()` draws the photo on a `<canvas>` at max 1024 px and turns it into a JPEG. A 6 MB phone photo becomes about 200 KB.
2. `uploadImage()` sends it to `/api/upload` with `FormData`.
3. The server checks the user is logged in, checks the file type and size, then saves it with `saveFile()` (`src/lib/storage.ts`).

### 4. The 3D scene: `src/components/three/product-scene.tsx`

This is the most interesting file. Key ideas:

- `<Canvas>` creates a 3D world. Inside it we add a **camera**, **lights** and a **mesh** (a 3D object).
- A mesh = **geometry** (the shape) + **material** (how its surface looks).
- `<boxGeometry args={[width, height, depth]} />` makes a box. A box has 6 faces, so we give it **6 materials**, each with one photo as its `map` (texture):
  ```ts
  // Three.js face order: right, left, top, bottom, front, back
  [tex.right, tex.left, tex.top, tex.bottom, tex.front, tex.back].map((t) => makeMaterial(settings, t))
  ```
- `makeMaterial()` turns our simple settings into real material values:
  `color` tints the photo, `roughness` controls matte vs shiny, `metalness` makes it look like metal.
- For the **bottle** shape we glue the front and back photos side by side on a canvas and wrap them around a cylinder.
- `<OrbitControls>` lets you turn and zoom with the mouse. `autoRotate` spins it.
- **AI models** are `.glb` files, loaded with `useGLTF(url)`. We go through every part of the model (`traverse`) and replace its material, so the same color and finish controls work.
- **Downloads:** `GLTFExporter` converts the 3D object into a `.glb` file; `canvas.toDataURL()` takes a PNG screenshot.

> ⚠️ 3D only works in the browser, so `scene-loader.tsx` loads it with `dynamic(..., { ssr: false })`.

### 5. The editor: `src/components/studio/editor.tsx`

All editor options live in **one object**, `settings` (see `src/lib/settings.ts`). Every control calls `update("color", "#5b5bd6")`, React re-renders, and the 3D scene picks up the new value. This pattern ("one state object → many controls → one view") is used in lots of real apps.

### 6. Plans and limits: `src/lib/plans.ts` + `src/lib/usage.ts`

- `plans.ts` describes each plan: price, max products, AI builds per month, and whether GLB export is allowed.
- `usage.ts` counts what the user has used. The API checks these limits **on the server** before creating a project. Never trust only the browser: anyone can change JavaScript in their browser!

### 7. Payments: `src/app/api/stripe/*`

```
User clicks "Choose Pro"
   → POST /api/stripe/checkout       (we create a Stripe Checkout Session)
   → browser goes to checkout.stripe.com
   → user pays
   → Stripe calls POST /api/stripe/webhook   (signed, so we can trust it)
   → we set user.plan = "pro" in the database
   → user returns to /account and sees the new plan
```

### 8. Colors and fonts: `src/app/globals.css`

All colors are defined once in the `@theme` block (`--color-primary`, `--color-aqua`...). Change a value there and the whole app updates. Fonts are installed from npm (`@fontsource-variable/...`), so the app doesn't need to download them while building.

---

## Ideas to practice

Start with the easy ones:

1. 🟢 **Change the theme:** pick new colors in `globals.css`.
2. 🟢 **Add a new color swatch** to `COLOR_SWATCHES` in `src/lib/settings.ts`.
3. 🟢 **Add a new finish**, e.g. "Rubber" (`roughness: 1`), in `FINISHES`.
4. 🟡 **Add a new plan** "Team" in `plans.ts` and a matching product in Stripe.
5. 🟡 **Add a text label** on the product: add a `labelText` setting and draw it with drei's `<Text>` component.
6. 🟡 **Rename a product** from the dashboard without opening the editor.
7. 🔴 **Share link:** a public page `/share/[id]` that shows a read-only 3D viewer.
8. 🔴 **Auto-save:** save settings 1 second after the last change (search for "debounce").

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| `Error 400: redirect_uri_mismatch` when signing in | The redirect URI in Google Cloud must match **exactly**: `http://localhost:3000/api/auth/callback/google` (or your Vercel URL). |
| "Access blocked: app has not completed verification" | Add your Gmail under **Google Auth Platform → Audience → Test users**, or publish the app. |
| `UntrustedHost` error when using `npm start` | Add `AUTH_TRUST_HOST=true` to `.env.local` (not needed on Vercel). |
| Database errors / "relation does not exist" | Check `DATABASE_URL` and run `npm run db:push`. |
| I paid but my plan is still Free | The webhook didn't arrive. Locally: is `stripe listen` running, and is `STRIPE_WEBHOOK_SECRET` the one it printed? On Vercel: check **Stripe → Webhooks → your endpoint → Event deliveries**. |
| "Manage billing" does nothing | Activate the Customer Portal in Stripe (Step 5.3). |
| I changed environment variables on Vercel but nothing changed | Redeploy. Variables only apply to new deployments. |
| The 3D view is empty | Your browser or computer may have WebGL turned off. Try another browser, and check the browser console (F12) for errors. |
| "AI 3D" is greyed out | Add `MESHY_API_KEY`, and make sure you're on the Pro or Studio plan. |

---

## Glossary

- **API route:** server code that answers a URL with data (JSON) instead of a web page.
- **Component:** a reusable piece of UI in React, like `<PricingTable />`.
- **Environment variable:** a setting (often secret) given to the app from outside the code, e.g. `STRIPE_SECRET_KEY`.
- **ORM:** a library that lets you use the database with code instead of SQL (here: Drizzle).
- **OAuth:** the standard that lets "Sign in with Google" work without sharing your password.
- **Webhook:** a message one service sends to another when something happens (Stripe → our app).
- **Mesh / Geometry / Material / Texture:** the 3D object / its shape / its surface look / an image painted on it.
- **GLB:** a single-file 3D format that works in most 3D tools, game engines and websites.
- **Deploy:** put your app on a server so anyone on the internet can use it.

---

Happy building! 🧊
