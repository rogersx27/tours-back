// src/entities/tours/tours.router.ts
import { Router } from 'express'
import { toursController } from './tours.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// Public routes - available to everyone
router.get('/', toursController.getAllTours)
router.get('/:id', toursController.getTourById)
router.get('/category/:categoryId', toursController.getToursByCategory)

// Protected routes - require authentication and specific roles
router.use(authMiddleware)

// Admin & guide routes
router.post('/', roleMiddleware([Role.ADMIN]), toursController.createTour)
router.put('/:id', roleMiddleware([Role.ADMIN]), toursController.updateTour)
router.put('/:id/inclusions', roleMiddleware([Role.ADMIN]), toursController.updateTourInclusions)
router.put('/:id/prices', roleMiddleware([Role.ADMIN]), toursController.updateTourPrices)
router.delete('/:id', roleMiddleware([Role.ADMIN]), toursController.deleteTour)
router.put('/:id/toggle-status', roleMiddleware([Role.ADMIN]), toursController.toggleTourStatus)

export default router