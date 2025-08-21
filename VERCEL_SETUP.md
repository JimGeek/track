# Vercel Environment Variables Setup

The frontend needs to be configured with production environment variables in Vercel.

## Required Environment Variables

Go to your Vercel project dashboard and add these environment variables:

### Production Environment Variables

| Variable | Value |
|----------|--------|
| `REACT_APP_API_URL` | `https://track-api.marvelhomes.pro` |
| `REACT_APP_WS_URL` | `wss://track-api.marvelhomes.pro` |
| `REACT_APP_ENV` | `production` |

## How to Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (track)
3. Go to Settings → Environment Variables
4. Add each variable with the values above
5. Set them for "Production" environment
6. Redeploy the application

## After Setting Variables

1. Trigger a new deployment by pushing to main branch or manual redeploy
2. The frontend will now use `https://track-api.marvelhomes.pro` instead of localhost
3. Login should work with credentials: jimit@marvelhomes.pro / BLURAY@ps3

## Current Status

✅ Backend API is working: https://track-api.marvelhomes.pro/api/auth/login/
✅ Admin user created: jimit@marvelhomes.pro
❌ Frontend still using localhost - needs Vercel env vars setup