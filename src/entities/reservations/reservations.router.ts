// src/entities/reservations/reservations.router.ts
import { Router } from 'express'
import { reservationsController } from './reservations.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Customer routes
router.get('/my-reservations', reservationsController.getUserReservations)
router.post('/', reservationsController.createReservation)
router.put('/:id', reservationsController.updateReservation) // Customers can only update their own
router.post('/:id/cancel', reservationsController.cancelReservation) // Customers can only cancel their own

// Guide routes
router.get('/guide-tours', roleMiddleware([Role.GUIDE, Role.ADMIN]), reservationsController.getGuideTours)

// Admin routes
router.get('/', roleMiddleware([Role.ADMIN]), reservationsController.getAllReservations)
router.put('/:id/status', roleMiddleware([Role.ADMIN]), reservationsController.updateReservationStatus)
router.put('/:id/payment-status', roleMiddleware([Role.ADMIN]), reservationsController.updatePaymentStatus)
router.put('/:id/assign-guide', roleMiddleware([Role.ADMIN]), reservationsController.assignGuide)

// Shared routes - Role-based access is handled in the controller
router.get('/:id', reservationsController.getReservationById)

export default router