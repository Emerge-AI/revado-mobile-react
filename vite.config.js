import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if HTTPS certificates exist
const httpsConfig = (() => {
  const certPath = path.resolve('./certs/localhost.pem')
  const keyPath = path.resolve('./certs/localhost-key.pem')
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('🔒 HTTPS enabled with local certificates')
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  }
  
  console.log('⚠️  HTTPS certificates not found. Run ./setup-https.sh to enable HTTPS')
  console.log('   Face ID/Touch ID will NOT work without HTTPS!')
  return false
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsConfig,
    host: true, // Allow external connections (for testing on phone)
    port: 5173,
  }
})
