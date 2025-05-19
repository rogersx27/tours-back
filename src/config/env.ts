// src/config/env.ts
import dotenv from 'dotenv'

dotenv.config()

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  API_URL: process.env.API_URL || 'http://localhost:3000',
  API_PRODUCTION_URL: process.env.API_PRODUCTION_URL || 'https://api.example.com',
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is required`)
  }
})

export default config