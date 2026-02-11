# Authentication Setup Guide

This dashboard uses NextAuth.js with GitHub OAuth for authentication.

## Setup Steps

### 1. Generate AUTH_SECRET

Run this command to generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output and add it to your environment variables as `AUTH_SECRET`.

### 2. Create a GitHub OAuth App

1. Go to GitHub Settings: https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `Crypto Trade Dashboard` (or your preferred name)
   - **Homepage URL**:
     - For development: `http://localhost:3000`
     - For production: `https://your-vercel-url.vercel.app`
   - **Authorization callback URL**:
     - For development: `http://localhost:3000/api/auth/callback/github`
     - For production: `https://your-vercel-url.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** → This is your `GITHUB_ID`
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret** → This is your `GITHUB_SECRET`

### 3. Add Environment Variables

#### For Local Development (.env.local)

```env
AUTH_SECRET="your_generated_secret_here"
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
```

#### For Vercel Deployment

1. Go to your Vercel project: https://vercel.com/darshanbathijas-projects/crypto-trade-dashboard/settings/environment-variables
2. Add these three environment variables:
   - `AUTH_SECRET` = (paste your generated secret)
   - `GITHUB_ID` = (paste your GitHub OAuth Client ID)
   - `GITHUB_SECRET` = (paste your GitHub OAuth Client Secret)
3. Make sure to add them to **all environments** (Development, Preview, Production)

### 4. Restricting Access

By default, any GitHub user can sign in. To restrict access to only your account:

1. After someone signs in, check their GitHub user ID
2. Update `auth.ts` to add an authorized users check:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Only allow specific GitHub usernames
    const allowedUsers = ["yourgithubusername"]
    if (account?.provider === "github" && profile?.login) {
      return allowedUsers.includes(profile.login as string)
    }
    return false
  },
  // ... other callbacks
}
```

### 5. Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You should be redirected to the login page
4. Click "Sign in with GitHub"
5. After authorization, you'll be redirected back to the dashboard

## Troubleshooting

- **Error: "Configuration" error**: Make sure all three environment variables are set
- **Error: "Callback URL mismatch"**: Ensure the callback URL in your GitHub OAuth App matches your deployment URL
- **Not redirecting after login**: Check that the `redirectTo` path is correct in `app/login/page.tsx`

## Security Notes

- Never commit your `.env` or `.env.local` files
- Rotate your `AUTH_SECRET` and GitHub credentials periodically
- For production, consider restricting access to specific GitHub users (see step 4 above)
