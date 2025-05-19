// src/entities/users/users.router.ts
import { Router } from 'express'
import { usersController } from './users.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// Public routes
router.post('/register', usersController.register)

// Protected routes - require authentication
router.use(authMiddleware)

// User profile routes (all authenticated users)
router.get('/profile', usersController.getProfile)
router.put('/profile', usersController.updateProfile)
router.put('/change-password', usersController.changePassword)
router.get('/reservations', usersController.getUserReservations)

// Guide specific routes
router.get('/guide-dashboard', roleMiddleware([Role.GUIDE, Role.ADMIN]), usersController.getGuideDashboard)
router.get('/guide-tours', roleMiddleware([Role.GUIDE, Role.ADMIN]), usersController.getGuideTours)

// Admin only routes
router.get('/', roleMiddleware([Role.ADMIN]), usersController.getAllUsers)
router.get('/admin-dashboard', roleMiddleware([Role.ADMIN]), usersController.getAdminDashboard)
router.get('/:id', roleMiddleware([Role.ADMIN]), usersController.getUserById)
router.post('/', roleMiddleware([Role.ADMIN]), usersController.createUser)
router.put('/:id/toggle-status', roleMiddleware([Role.ADMIN]), usersController.toggleUserStatus)

export default router