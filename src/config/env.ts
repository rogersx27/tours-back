// src/config/env.ts
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // URLs
  API_URL: process.env.API_URL || 'http://localhost:3000',
  API_PRODUCTION_URL: process.env.API_PRODUCTION_URL || 'https://api.example.com',

  // Cors
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // File uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024, // 5MB

  // Pagination
  DEFAULT_PAGE_SIZE: process.env.DEFAULT_PAGE_SIZE ? parseInt(process.env.DEFAULT_PAGE_SIZE) : 10,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is required`)
  }
})

export default config