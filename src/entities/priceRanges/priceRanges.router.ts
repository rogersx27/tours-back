// src/entities/priceRanges/priceRanges.router.ts
import { Router } from 'express'
import { priceRangesController } from './priceRanges.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// Public routes - available to everyone
router.get('/', priceRangesController.getAllPriceRanges)
router.get('/:id', priceRangesController.getPriceRangeById)

// Protected routes - require authentication and specific roles
router.use(authMiddleware)

// Admin routes
router.post('/', roleMiddleware([Role.ADMIN]), priceRangesController.createPriceRange)
router.put('/:id', roleMiddleware([Role.ADMIN]), priceRangesController.updatePriceRange)
router.delete('/:id', roleMiddleware([Role.ADMIN]), priceRangesController.deletePriceRange)

export default router