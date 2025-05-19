// src/entities/tours/tours.service.ts
import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import {
    CreateTourDto,
    UpdateTourDto,
    TourResponse,
    TourDetailResponse,
    TourQueryFilter,
    UpdateTourInclusionsDto,
    UpdateTourPricesDto,
    TourPriceDto
} from './tours.types'

export const toursService = {
    // Get all tours with filtering
    async getAllTours(filter: TourQueryFilter = {}): Promise<TourResponse[]> {
        const {
            categoryId,
            search,
            isActive,
            minPrice,
            maxPrice,
            minDuration,
            maxDuration,
            inclusions,
            limit = 10,
            offset = 0
        } = filter

        // Build the where clause
        const where: Prisma.TourWhereInput = {}

        // Category filter
        if (categoryId) {
            where.categoryId = categoryId
        }

        // Active status filter
        if (isActive !== undefined) {
            where.isActive = isActive
        }

        // Text search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
            ]
        }

        // Duration filters - Use a separate object to build duration filter
        if (minDuration !== undefined || maxDuration !== undefined) {
            where.durationMinutes = {};

            if (minDuration !== undefined) {
                where.durationMinutes.gte = minDuration;
            }

            if (maxDuration !== undefined) {
                where.durationMinutes.lte = maxDuration;
            }
        }

        // Price range filters
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.prices = {
                some: {
                    ...(minPrice !== undefined && { price: { gte: minPrice } }),
                    ...(maxPrice !== undefined && { price: { lte: maxPrice } })
                }
            }
        }

        // Inclusions filter
        if (inclusions && inclusions.length > 0) {
            where.inclusions = {
                some: {
                    inclusionId: {
                        in: inclusions
                    }
                }
            }
        }

        // Fetch tours with filters
        const tours = await prisma.tour.findMany({
            where,
            include: {
                category: true
            },
            take: limit,
            skip: offset,
            orderBy: { name: 'asc' }
        })

        // Map to response type
        return tours.map(tour => ({
            id: tour.id,
            name: tour.name,
            description: tour.description,
            duration: tour.duration,
            durationMinutes: tour.durationMinutes,
            image: tour.image,
            isActive: tour.isActive,
            createdAt: tour.createdAt,
            updatedAt: tour.updatedAt,
            categoryId: tour.categoryId,
            category: {
                id: tour.category.id,
                name: tour.category.name
            }
        }))
    },

    // Get tour by ID
    async getTourById(id: string): Promise<TourDetailResponse | null> {
        const tour = await prisma.tour.findUnique({
            where: { id },
            include: {
                category: true,
                inclusions: {
                    include: {
                        inclusion: true
                    }
                },
                prices: {
                    include: {
                        priceRange: true
                    }
                }
            }
        })

        if (!tour) return null

        // Map to response type
        return {
            id: tour.id,
            name: tour.name,
            description: tour.description,
            duration: tour.duration,
            durationMinutes: tour.durationMinutes,
            image: tour.image,
            isActive: tour.isActive,
            createdAt: tour.createdAt,
            updatedAt: tour.updatedAt,
            categoryId: tour.categoryId,
            category: {
                id: tour.category.id,
                name: tour.category.name
            },
            inclusions: tour.inclusions.map(ti => ({
                id: ti.inclusion.id,
                name: ti.inclusion.name,
                icon: ti.inclusion.icon
            })),
            prices: tour.prices.map(tp => ({
                id: tp.id,
                tourId: tp.tourId,
                priceRangeId: tp.priceRangeId,
                price: Number(tp.price),
                priceRange: {
                    id: tp.priceRange.id,
                    name: tp.priceRange.name,
                    minPeople: tp.priceRange.minPeople,
                    maxPeople: tp.priceRange.maxPeople
                }
            }))
        }
    },

    // Create new tour
    async createTour(data: CreateTourDto): Promise<TourDetailResponse> {
        const { inclusions = [], prices = [], ...tourData } = data

        // Start a transaction
        const tour = await prisma.$transaction(async (prisma) => {
            // Create the tour
            const newTour = await prisma.tour.create({
                data: {
                    ...tourData,
                    isActive: data.isActive ?? true
                },
                include: {
                    category: true
                }
            })

            // Add inclusions if provided
            if (inclusions.length > 0) {
                await this.addTourInclusions(newTour.id, inclusions, prisma)
            }

            // Add prices if provided
            if (prices.length > 0) {
                await this.addTourPrices(newTour.id, prices, prisma)
            }

            return newTour
        })

        // Fetch the complete tour with relations
        return this.getTourById(tour.id) as Promise<TourDetailResponse>
    },

    // Update tour
    async updateTour(id: string, data: UpdateTourDto): Promise<TourResponse> {
        // Update tour information
        const updatedTour = await prisma.tour.update({
            where: { id },
            data,
            include: {
                category: true
            }
        })

        return {
            id: updatedTour.id,
            name: updatedTour.name,
            description: updatedTour.description,
            duration: updatedTour.duration,
            durationMinutes: updatedTour.durationMinutes,
            image: updatedTour.image,
            isActive: updatedTour.isActive,
            createdAt: updatedTour.createdAt,
            updatedAt: updatedTour.updatedAt,
            categoryId: updatedTour.categoryId,
            category: {
                id: updatedTour.category.id,
                name: updatedTour.category.name
            }
        }
    },

    // Update tour inclusions
    async updateTourInclusions(
        tourId: string,
        data: UpdateTourInclusionsDto
    ): Promise<void> {
        await prisma.$transaction(async (prisma) => {
            // Delete existing inclusions
            await prisma.tourInclusion.deleteMany({
                where: { tourId }
            })

            // Add new inclusions
            if (data.inclusionIds.length > 0) {
                await this.addTourInclusions(tourId, data.inclusionIds, prisma)
            }
        })
    },

    // Helper to add tour inclusions
    async addTourInclusions(
        tourId: string,
        inclusionIds: string[],
        prismaClient: any = prisma
    ): Promise<void> {
        // Create inclusion relationships
        await prismaClient.tourInclusion.createMany({
            data: inclusionIds.map(inclusionId => ({
                tourId,
                inclusionId
            })),
            skipDuplicates: true
        })
    },

    // Update tour prices
    async updateTourPrices(tourId: string, data: UpdateTourPricesDto): Promise<void> {
        await prisma.$transaction(async (prisma) => {
            // Delete existing prices
            await prisma.tourPrice.deleteMany({
                where: { tourId }
            })

            // Add new prices
            if (data.prices.length > 0) {
                await this.addTourPrices(tourId, data.prices, prisma)
            }
        })
    },

    // Helper to add tour prices
    async addTourPrices(
        tourId: string,
        prices: TourPriceDto[],
        prismaClient: any = prisma
    ): Promise<void> {
        // Create price relationships
        await prismaClient.tourPrice.createMany({
            data: prices.map(price => ({
                tourId,
                priceRangeId: price.priceRangeId,
                price: price.price
            })),
            skipDuplicates: true
        })
    },

    // Delete tour
    async deleteTour(id: string): Promise<void> {
        await prisma.tour.delete({
            where: { id }
        })
    },

    // Toggle tour active status
    async toggleTourStatus(id: string): Promise<TourResponse> {
        // Get current status
        const tour = await prisma.tour.findUnique({
            where: { id },
            select: { isActive: true }
        })

        if (!tour) {
            throw new Error('Tour not found')
        }

        // Toggle status
        const updatedTour = await prisma.tour.update({
            where: { id },
            data: { isActive: !tour.isActive },
            include: {
                category: true
            }
        })

        return {
            id: updatedTour.id,
            name: updatedTour.name,
            description: updatedTour.description,
            duration: updatedTour.duration,
            durationMinutes: updatedTour.durationMinutes,
            image: updatedTour.image,
            isActive: updatedTour.isActive,
            createdAt: updatedTour.createdAt,
            updatedAt: updatedTour.updatedAt,
            categoryId: updatedTour.categoryId,
            category: {
                id: updatedTour.category.id,
                name: updatedTour.category.name
            }
        }
    },

    // Get tours by category
    async getToursByCategory(categoryId: string): Promise<TourResponse[]> {
        const tours = await prisma.tour.findMany({
            where: {
                categoryId,
                isActive: true
            },
            include: {
                category: true
            },
            orderBy: { name: 'asc' }
        })

        return tours.map(tour => ({
            id: tour.id,
            name: tour.name,
            description: tour.description,
            duration: tour.duration,
            durationMinutes: tour.durationMinutes,
            image: tour.image,
            isActive: tour.isActive,
            createdAt: tour.createdAt,
            updatedAt: tour.updatedAt,
            categoryId: tour.categoryId,
            category: {
                id: tour.category.id,
                name: tour.category.name
            }
        }))
    }
}