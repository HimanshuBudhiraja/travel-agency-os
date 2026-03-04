#!/bin/bash
# TravelOS — one-shot deploy to Vercel via GitHub
# Run this from the project root: bash deploy.sh
set -e

export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/local/bin:$PATH"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   TravelOS — Deploy to Vercel            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Install GitHub CLI if missing ──────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "📦 Installing GitHub CLI..."
  brew install gh
fi

# ── Step 2: GitHub login ───────────────────────────────────────────────────
echo ""
echo "🔐 Step 1/4 — Log in to GitHub (browser will open)..."
gh auth login --web

# ── Step 3: Create GitHub repo and push ───────────────────────────────────
echo ""
echo "📁 Step 2/4 — Creating GitHub repository 'travel-agency-os'..."
gh repo create travel-agency-os \
  --private \
  --description "AI-Native Travel Agency OS — B2B SaaS platform" \
  --source=. \
  --remote=origin \
  --push

echo "✓ Code pushed to GitHub."

# ── Step 4: Vercel login + deploy ─────────────────────────────────────────
echo ""
echo "🚀 Step 3/4 — Log in to Vercel (browser will open)..."
node /opt/homebrew/lib/node_modules/vercel/dist/index.js login

echo ""
echo "⚡ Step 4/4 — Deploying to Vercel..."
node /opt/homebrew/lib/node_modules/vercel/dist/index.js \
  deploy \
  --prod \
  --yes \
  --name travel-agency-os \
  --build-env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅  Deployed! Your site is live.                               ║"
echo "║                                                                  ║"
echo "║  NEXT STEP — Add real environment variables in Vercel:          ║"
echo "║  https://vercel.com/dashboard → your project → Settings → Env  ║"
echo "║                                                                  ║"
echo "║  Required keys (see .env.example for all):                      ║"
echo "║  • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (from clerk.com)          ║"
echo "║  • CLERK_SECRET_KEY                   (from clerk.com)          ║"
echo "║  • DATABASE_URL                        (Neon/Supabase/Railway)  ║"
echo "║  • OPENAI_API_KEY                      (from platform.openai.com)║"
echo "║  • STRIPE_SECRET_KEY                   (from stripe.com)        ║"
echo "║  • TWILIO_ACCOUNT_SID + AUTH_TOKEN     (from twilio.com)        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
