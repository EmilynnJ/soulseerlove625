# SoulSeer Psychic Reading App

## Features
- Reader and client dashboards
- Scheduling and availability management
- Booking and real-time booking management
- Secure Stripe payments
- Wallet with top-up
- Real-time and persistent chat
- Reviews and feedback
- Mystical, accessible UI

---

## Setup & Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set environment variables:**
   Create a `.env` file in the root:
   ```env
   VITE_API_BASE=https://your-backend-url/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. **Run the app locally:**
   ```bash
   npm run dev
   ```

---

## Netlify Deployment

1. **Connect your repo to Netlify.**
2. **Ensure the following build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set environment variables in Netlify dashboard:**
   - `VITE_API_BASE`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
4. **SPA Routing:** Already handled by `netlify.toml`.

---

## Required Environment Variables
- `VITE_API_BASE` — Backend API base URL
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key

---

## Backend API Endpoints (Required)

**Availability**
- `GET /readers/:readerId/availability`
- `POST /readers/:readerId/availability`

**Bookings**
- `POST /bookings`
- `GET /bookings` (client)
- `GET /bookings/reader` (reader)
- `POST /bookings/:id/accept`
- `POST /bookings/:id/decline`

**Payments**
- `POST /payment-intent`

**Wallet**
- `GET /wallet`
- `POST /wallet/topup`

**Reviews**
- `POST /reviews`

**Chat/Session**
- `POST /sessions/:sessionId/messages`

---

## Notes
- All booking/payment/availability features require a backend that implements the above endpoints.
- Stripe payments are handled via the backend for security.
- SPA routing is configured for Netlify; all client routes will work with direct links.
- For best results, use Node.js 18+ and the latest npm.

---

## License
MIT


## Project info

**URL**: https://lovable.dev/projects/73e7c14a-76ac-4e1f-9bc8-ceac7247a0a6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/73e7c14a-76ac-4e1f-9bc8-ceac7247a0a6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/73e7c14a-76ac-4e1f-9bc8-ceac7247a0a6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
