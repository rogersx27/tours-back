// src/entities/categories/categories.service.ts
import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryResponse,
    CategoryDetailResponse,
    CategoryQueryFilter
} from './categories.types'

export const categoriesService = {
    // Get all categories
    async getAllCategories(filter: CategoryQueryFilter = {}): Promise<CategoryResponse[]> {
        const { search, limit = 50, offset = 0 } = filter

        // Build where clause
        const where: Prisma.CategoryWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive
                }
            }
            : {}

        // Fetch categories
        const categories = await prisma.category.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { name: 'asc' }
        })

        return categories.map(category => ({
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        }))
    },

    // Get category by ID
    async getCategoryById(id: string): Promise<CategoryDetailResponse | null> {
        const category = await prisma.category.findUnique({
            where: { id }
        })

        if (!category) return null

        // Count tours in this category
        const tourCount = await prisma.tour.count({
            where: { categoryId: id }
        })

        return {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            tourCount
        }
    },

    // Create new category
    async createCategory(data: CreateCategoryDto): Promise<CategoryResponse> {
        const category = await prisma.category.create({
            data
        })

        return {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        }
    },

    // Update category
    async updateCategory(id: string, data: UpdateCategoryDto): Promise<CategoryResponse> {
        const category = await prisma.category.update({
            where: { id },
            data
        })

        return {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        }
    },

    // Delete category
    async deleteCategory(id: string): Promise<void> {
        await prisma.category.delete({
            where: { id }
        })
    },

    // Check if category can be deleted (has no tours)
    async canDeleteCategory(id: string): Promise<boolean> {
        const tourCount = await prisma.tour.count({
            where: { categoryId: id }
        })

        return tourCount === 0
    }
}