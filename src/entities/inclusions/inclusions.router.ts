// src/entities/inclusions/inclusions.router.ts
import { Router } from 'express'
import { inclusionsController } from './inclusions.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// Public routes - available to everyone
router.get('/', inclusionsController.getAllInclusions)
router.get('/:id', inclusionsController.getInclusionById)

// Protected routes - require authentication and specific roles
router.use(authMiddleware)

// Admin routes
router.post('/', roleMiddleware([Role.ADMIN]), inclusionsController.createInclusion)
router.put('/:id', roleMiddleware([Role.ADMIN]), inclusionsController.updateInclusion)
router.delete('/:id', roleMiddleware([Role.ADMIN]), inclusionsController.deleteInclusion)

export default router