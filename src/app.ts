// src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'

// Routers
import authRouter from './entities/auth/auth.router'
import usersRouter from './entities/users/users.router'

// Middleware
import { errorMiddleware } from './shared/middleware/error.middleware'
import { authMiddleware } from './shared/middleware/auth.middleware'

const app = express()

// Basic middleware
app.use(helmet())
app.use(cors(
  {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/users', authMiddleware, usersRouter)

app.use('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running'
  })
})

// Error handling
app.use(errorMiddleware)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

export default app