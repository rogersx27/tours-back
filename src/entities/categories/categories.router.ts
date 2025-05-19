// src/entities/categories/categories.router.ts
import { Router } from 'express'
import { categoriesController } from './categories.controller'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { roleMiddleware } from '../../shared/middleware/role.middleware'
import { Role } from '@prisma/client'

const router = Router()

// Public routes - available to everyone
router.get('/', categoriesController.getAllCategories)
router.get('/:id', categoriesController.getCategoryById)

// Protected routes - require authentication and specific roles
router.use(authMiddleware)

// Admin routes
router.post('/', roleMiddleware([Role.ADMIN]), categoriesController.createCategory)
router.put('/:id', roleMiddleware([Role.ADMIN]), categoriesController.updateCategory)
router.delete('/:id', roleMiddleware([Role.ADMIN]), categoriesController.deleteCategory)

export default router