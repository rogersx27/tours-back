// src/entities/auth/auth.router.ts
import { Router } from 'express'
import { authController } from './auth.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'

const router = Router()

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser)
router.post('/change-password', authMiddleware, authController.updatePassword)
router.post('/logout', authMiddleware, authController.logout)

export default router