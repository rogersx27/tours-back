// src/entities/inclusions/inclusions.service.ts
import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
    CreateInclusionDto,
    UpdateInclusionDto,
    InclusionResponse,
    InclusionDetailResponse,
    InclusionQueryFilter
} from './inclusions.types'

export const inclusionsService = {
    // Get all inclusions
    async getAllInclusions(filter: InclusionQueryFilter = {}): Promise<InclusionResponse[]> {
        const { search, limit = 50, offset = 0 } = filter

        // Build where clause
        const where: Prisma.InclusionWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive
                }
            }
            : {}

        // Fetch inclusions
        const inclusions = await prisma.inclusion.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { name: 'asc' }
        })

        return inclusions.map(inclusion => ({
            id: inclusion.id,
            name: inclusion.name,
            icon: inclusion.icon,
            createdAt: inclusion.createdAt,
            updatedAt: inclusion.updatedAt
        }))
    },

    // Get inclusion by ID
    async getInclusionById(id: string): Promise<InclusionDetailResponse | null> {
        const inclusion = await prisma.inclusion.findUnique({
            where: { id }
        })

        if (!inclusion) return null

        // Count tours using this inclusion
        const usageCount = await prisma.tourInclusion.count({
            where: { inclusionId: id }
        })

        return {
            id: inclusion.id,
            name: inclusion.name,
            icon: inclusion.icon,
            createdAt: inclusion.createdAt,
            updatedAt: inclusion.updatedAt,
            usageCount
        }
    },

    // Create new inclusion
    async createInclusion(data: CreateInclusionDto): Promise<InclusionResponse> {
        const inclusion = await prisma.inclusion.create({
            data
        })

        return {
            id: inclusion.id,
            name: inclusion.name,
            icon: inclusion.icon,
            createdAt: inclusion.createdAt,
            updatedAt: inclusion.updatedAt
        }
    },

    // Update inclusion
    async updateInclusion(id: string, data: UpdateInclusionDto): Promise<InclusionResponse> {
        const inclusion = await prisma.inclusion.update({
            where: { id },
            data
        })

        return {
            id: inclusion.id,
            name: inclusion.name,
            icon: inclusion.icon,
            createdAt: inclusion.createdAt,
            updatedAt: inclusion.updatedAt
        }
    },

    // Delete inclusion
    async deleteInclusion(id: string): Promise<void> {
        await prisma.inclusion.delete({
            where: { id }
        })
    },

    // Check if inclusion can be deleted (not used by any tour)
    async canDeleteInclusion(id: string): Promise<boolean> {
        const usageCount = await prisma.tourInclusion.count({
            where: { inclusionId: id }
        })

        return usageCount === 0
    }
}