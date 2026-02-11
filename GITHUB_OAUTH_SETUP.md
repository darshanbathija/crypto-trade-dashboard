# GitHub OAuth Setup Guide

**⚠️ IMPORTANT:** Authentication is currently disabled for testing. Follow this guide to enable it properly.

## Step 1: Create a GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"** (or "New GitHub App")
3. Fill in the details:
   - **Application name**: `Crypto Trade Dashboard`
   - **Homepage URL**: `https://crypto-trade-dashboard.vercel.app`
   - **Authorization callback URL**: `https://crypto-trade-dashboard.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. You'll see your **Client ID** (copy this)
6. Click **"Generate a new client secret"** and copy it immediately (you can't see it again!)

## Step 2: Generate AUTH_SECRET

Run this command to generate a random secret:
```bash
openssl rand -base64 32
```
Or use an online generator: https://generate-secret.vercel.app/32

## Step 3: Add Environment Variables to Vercel

Go to: https://vercel.com/darshanbathijas-projects/crypto-trade-dashboard/settings/environment-variables

Add these three variables (for all environments):

```
AUTH_SECRET = <paste the generated secret from step 2>
GITHUB_ID = <paste the Client ID from step 1>
GITHUB_SECRET = <paste the Client Secret from step 1>
```

## Step 4: Re-enable Authentication

In `middleware.ts`, uncomment the auth middleware:

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

## Step 5: Redeploy

1. Commit and push changes
2. Vercel will automatically redeploy

## Step 6: Test

Visit: https://crypto-trade-dashboard.vercel.app

You should now be able to sign in with GitHub!

---

## Local Development Setup

For local development, add these to your `.env` file:

```bash
AUTH_SECRET="your_generated_secret"
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
```

**Local callback URL for testing:**
```
http://localhost:3000/api/auth/callback/github
```

Add this as a second callback URL in your GitHub OAuth app settings.
