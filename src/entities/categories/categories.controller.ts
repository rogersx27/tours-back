// src/entities/categories/categories.controller.ts
import { Request, Response } from 'express'
import { categoriesService } from './categories.service'
import { responseHelper } from '../../shared/utils/response'
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryQueryFilter
} from './categories.types'

export const categoriesController = {
    // Get all categories
    async getAllCategories(req: Request, res: Response) {
        const filter: CategoryQueryFilter = {
            search: req.query.search as string,
            limit: req.query.limit ? Number(req.query.limit) : 50,
            offset: req.query.offset ? Number(req.query.offset) : 0
        }

        try {
            const categories = await categoriesService.getAllCategories(filter)

            return responseHelper.success(res, {
                categories,
                pagination: {
                    limit: filter.limit,
                    offset: filter.offset
                }
            })
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get category by ID
    async getCategoryById(req: Request, res: Response) {
        const { id } = req.params

        try {
            const category = await categoriesService.getCategoryById(id)

            if (!category) {
                return responseHelper.notFound(res, 'Category not found')
            }

            return responseHelper.success(res, category)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Create new category
    async createCategory(req: Request, res: Response) {
        const data: CreateCategoryDto = req.body

        // Validate
        if (!data.name || data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Category name is required')
        }

        try {
            const category = await categoriesService.createCategory(data)

            return responseHelper.created(res, category, 'Category created successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'A category with this name already exists')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update category
    async updateCategory(req: Request, res: Response) {
        const { id } = req.params
        const data: UpdateCategoryDto = req.body

        // Validate
        if (!data.name || data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Category name is required')
        }

        try {
            const category = await categoriesService.updateCategory(id, data)

            return responseHelper.success(res, category, 'Category updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Category not found')
            }

            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'A category with this name already exists')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Delete category
    async deleteCategory(req: Request, res: Response) {
        const { id } = req.params

        try {
            // Check if category can be deleted
            const canDelete = await categoriesService.canDeleteCategory(id)

            if (!canDelete) {
                return responseHelper.badRequest(
                    res,
                    'Cannot delete category because it contains tours. Remove the tours first.'
                )
            }

            await categoriesService.deleteCategory(id)

            return responseHelper.success(res, null, 'Category deleted successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Category not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    }
}