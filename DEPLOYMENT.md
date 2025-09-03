# Deployment Guide

## Frontend (Vercel)

The frontend is configured to deploy to Vercel at `https://revado-mobile-react.vercel.app`

### Setup
1. Push code to GitHub
2. Connect repository to Vercel
3. Set build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Environment Variables
Add these in Vercel dashboard:
```
VITE_API_URL=https://revado-mobile-react-backend-production.up.railway.app/api
```

## Backend (Railway)

The backend is configured to deploy to Railway at `https://revado-mobile-react-backend-production.up.railway.app`

### Setup
1. Push code to GitHub
2. Connect repository to Railway
3. Set root directory to `/backend`
4. Railway will auto-detect Node.js and use `npm start`

### Environment Variables
Add these in Railway dashboard:
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://revado-mobile-react.vercel.app
```

Optional (for AI features):
```
ENABLE_AI_ANALYSIS=true
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL=claude-3-5-sonnet-20241022
```

### Database
The SQLite database will be created automatically on first run. For production, consider:
1. Using Railway's volume mount for persistent storage
2. Or migrating to PostgreSQL (Railway provides PostgreSQL service)

## CORS Configuration

The backend is configured to accept requests from:
- `https://revado-mobile-react.vercel.app` (production)
- `https://revado-mobile-react-*.vercel.app` (preview deployments)
- `http://localhost:5173` (local development)

## Testing Production Setup

1. Frontend health check:
   ```
   curl https://revado-mobile-react.vercel.app
   ```

2. Backend health check:
   ```
   curl https://revado-mobile-react-backend-production.up.railway.app/api/health
   ```

3. Test CORS:
   ```javascript
   fetch('https://revado-mobile-react-backend-production.up.railway.app/api/health', {
     headers: { 'X-User-Id': 'test' }
   }).then(r => r.json()).then(console.log)
   ```

## Local Development

For local development with production-like setup:

1. Frontend:
   ```bash
   npm run build
   npm run preview
   ```

2. Backend:
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

## Troubleshooting

### CORS Issues
- Check browser console for CORS errors
- Verify FRONTEND_URL env var in Railway
- Check allowed origins in backend/server.js

### API Connection Issues
- Verify VITE_API_URL in Vercel env vars
- Check Railway logs for backend errors
- Ensure backend is running on port 3001

### File Upload Issues
- Railway has ephemeral filesystem - uploaded files won't persist across deployments
- Consider using cloud storage (S3, Cloudinary) for production file storage
- Or use Railway volumes for persistent storage