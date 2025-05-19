// src/entities/priceRanges/priceRanges.service.ts
import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
    CreatePriceRangeDto,
    UpdatePriceRangeDto,
    PriceRangeResponse,
    PriceRangeDetailResponse,
    PriceRangeQueryFilter
} from './priceRanges.types'

export const priceRangesService = {
    // Get all price ranges
    async getAllPriceRanges(filter: PriceRangeQueryFilter = {}): Promise<PriceRangeResponse[]> {
        const { search, limit = 50, offset = 0 } = filter

        // Build where clause
        const where: Prisma.PriceRangeWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive
                }
            }
            : {}

        // Fetch price ranges
        const priceRanges = await prisma.priceRange.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: [
                { minPeople: 'asc' },
                { name: 'asc' }
            ]
        })

        return priceRanges.map(range => ({
            id: range.id,
            name: range.name,
            minPeople: range.minPeople,
            maxPeople: range.maxPeople,
            createdAt: range.createdAt,
            updatedAt: range.updatedAt
        }))
    },

    // Get price range by ID
    async getPriceRangeById(id: string): Promise<PriceRangeDetailResponse | null> {
        const priceRange = await prisma.priceRange.findUnique({
            where: { id }
        })

        if (!priceRange) return null

        // Count tours using this price range
        const usageCount = await prisma.tourPrice.count({
            where: { priceRangeId: id }
        })

        return {
            id: priceRange.id,
            name: priceRange.name,
            minPeople: priceRange.minPeople,
            maxPeople: priceRange.maxPeople,
            createdAt: priceRange.createdAt,
            updatedAt: priceRange.updatedAt,
            usageCount
        }
    },

    // Create new price range
    async createPriceRange(data: CreatePriceRangeDto): Promise<PriceRangeResponse> {
        // Validate min/max people
        if (data.maxPeople !== null && data.maxPeople !== undefined && data.minPeople > data.maxPeople) {
            throw new Error('Minimum people cannot be greater than maximum people')
        }

        const priceRange = await prisma.priceRange.create({
            data
        })

        return {
            id: priceRange.id,
            name: priceRange.name,
            minPeople: priceRange.minPeople,
            maxPeople: priceRange.maxPeople,
            createdAt: priceRange.createdAt,
            updatedAt: priceRange.updatedAt
        }
    },

    // Update price range
    async updatePriceRange(id: string, data: UpdatePriceRangeDto): Promise<PriceRangeResponse> {
        // Fetch current data if we need to validate min/max
        if ((data.minPeople !== undefined || data.maxPeople !== undefined) &&
            !(data.minPeople !== undefined && data.maxPeople !== undefined)) {
            const current = await prisma.priceRange.findUnique({
                where: { id },
                select: { minPeople: true, maxPeople: true }
            })

            if (!current) {
                throw new Error('Price range not found')
            }

            const minPeople = data.minPeople !== undefined ? data.minPeople : current.minPeople
            const maxPeople = data.maxPeople !== undefined ? data.maxPeople : current.maxPeople

            // Validate min/max
            if (maxPeople !== null && minPeople > maxPeople) {
                throw new Error('Minimum people cannot be greater than maximum people')
            }
        } else if (data.minPeople !== undefined && data.maxPeople !== undefined &&
            data.maxPeople !== null && data.minPeople > data.maxPeople) {
            // Validate if both provided
            throw new Error('Minimum people cannot be greater than maximum people')
        }

        const priceRange = await prisma.priceRange.update({
            where: { id },
            data
        })

        return {
            id: priceRange.id,
            name: priceRange.name,
            minPeople: priceRange.minPeople,
            maxPeople: priceRange.maxPeople,
            createdAt: priceRange.createdAt,
            updatedAt: priceRange.updatedAt
        }
    },

    // Delete price range
    async deletePriceRange(id: string): Promise<void> {
        await prisma.priceRange.delete({
            where: { id }
        })
    },

    // Check if price range can be deleted (not used by any tour)
    async canDeletePriceRange(id: string): Promise<boolean> {
        const usageCount = await prisma.tourPrice.count({
            where: { priceRangeId: id }
        })

        return usageCount === 0
    },

    // Validate price ranges for overlaps
    async validatePriceRangeOverlap(
        minPeople: number,
        maxPeople: number | null,
        excludeId?: string
    ): Promise<boolean> {
        // Build query to find overlapping ranges
        const where: any = {
            OR: [
                // Case 1: New range completely contains an existing range
                {
                    minPeople: { gte: minPeople },
                    ...(maxPeople !== null ? { maxPeople: { lte: maxPeople } } : {})
                },
                // Case 2: New range's min is within an existing range
                {
                    minPeople: { lte: minPeople },
                    ...(maxPeople !== null ? { maxPeople: { gte: minPeople } } : { maxPeople: null })
                },
                // Case 3: New range's max is within an existing range
                ...(maxPeople !== null ? [{
                    minPeople: { lte: maxPeople },
                    maxPeople: { gte: maxPeople }
                }] : [])
            ]
        }

        // Exclude current record if updating
        if (excludeId) {
            where.id = { not: excludeId }
        }

        // Count overlapping ranges
        const overlapCount = await prisma.priceRange.count({ where })

        return overlapCount === 0
    }
}