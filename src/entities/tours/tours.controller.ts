// src/entities/tours/tours.controller.ts
import { Request, Response } from 'express'
import { toursService } from './tours.service'
import { responseHelper } from '../../shared/utils/response'
import { AppError } from '../../shared/middleware/error.middleware'
import {
    CreateTourDto,
    UpdateTourDto,
    TourQueryFilter,
    UpdateTourInclusionsDto,
    UpdateTourPricesDto
} from './tours.types'

export const toursController = {
    // Get all tours with filtering
    async getAllTours(req: Request, res: Response) {
        const filter: TourQueryFilter = {
            categoryId: req.query.categoryId as string,
            search: req.query.search as string,
            isActive: req.query.isActive === 'true' ? true :
                req.query.isActive === 'false' ? false : undefined,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
            minDuration: req.query.minDuration ? Number(req.query.minDuration) : undefined,
            maxDuration: req.query.maxDuration ? Number(req.query.maxDuration) : undefined,
            inclusions: req.query.inclusions ?
                (Array.isArray(req.query.inclusions) ?
                    req.query.inclusions as string[] :
                    [req.query.inclusions as string]) :
                undefined,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            offset: req.query.offset ? Number(req.query.offset) : 0
        }

        try {
            const tours = await toursService.getAllTours(filter)

            return responseHelper.success(res, {
                tours,
                pagination: {
                    limit: filter.limit,
                    offset: filter.offset
                }
            })
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get tour by ID
    async getTourById(req: Request, res: Response) {
        const { id } = req.params

        try {
            const tour = await toursService.getTourById(id)

            if (!tour) {
                return responseHelper.notFound(res, 'Tour not found')
            }

            return responseHelper.success(res, tour)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Create new tour
    async createTour(req: Request, res: Response) {
        const tourData: CreateTourDto = req.body

        // Validate required fields
        if (!tourData.name || !tourData.description || !tourData.duration ||
            !tourData.durationMinutes || !tourData.categoryId) {
            return responseHelper.badRequest(
                res,
                'Name, description, duration, durationMinutes, and categoryId are required'
            )
        }

        try {
            const tour = await toursService.createTour(tourData)

            return responseHelper.created(res, tour, 'Tour created successfully')
        } catch (error: any) {
            if (error.code === 'P2003') {
                return responseHelper.badRequest(res, 'Invalid category or inclusion ID')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update tour
    async updateTour(req: Request, res: Response) {
        const { id } = req.params
        const updateData: UpdateTourDto = req.body

        try {
            const tour = await toursService.updateTour(id, updateData)

            return responseHelper.success(res, tour, 'Tour updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Tour not found')
            }

            if (error.code === 'P2003') {
                return responseHelper.badRequest(res, 'Invalid category ID')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update tour inclusions
    async updateTourInclusions(req: Request, res: Response) {
        const { id } = req.params
        const data: UpdateTourInclusionsDto = req.body

        if (!data.inclusionIds || !Array.isArray(data.inclusionIds)) {
            return responseHelper.badRequest(res, 'inclusionIds array is required')
        }

        try {
            await toursService.updateTourInclusions(id, data)

            // Get updated tour
            const updatedTour = await toursService.getTourById(id)

            return responseHelper.success(res, updatedTour, 'Tour inclusions updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Tour not found')
            }

            if (error.code === 'P2003') {
                return responseHelper.badRequest(res, 'Invalid inclusion ID')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update tour prices
    async updateTourPrices(req: Request, res: Response) {
        const { id } = req.params
        const data: UpdateTourPricesDto = req.body

        if (!data.prices || !Array.isArray(data.prices)) {
            return responseHelper.badRequest(res, 'prices array is required')
        }

        try {
            await toursService.updateTourPrices(id, data)

            // Get updated tour
            const updatedTour = await toursService.getTourById(id)

            return responseHelper.success(res, updatedTour, 'Tour prices updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Tour not found')
            }

            if (error.code === 'P2003') {
                return responseHelper.badRequest(res, 'Invalid price range ID')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Delete tour
    async deleteTour(req: Request, res: Response) {
        const { id } = req.params

        try {
            await toursService.deleteTour(id)

            return responseHelper.success(res, null, 'Tour deleted successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Tour not found')
            }

            if (error.code === 'P2003') {
                return responseHelper.badRequest(
                    res,
                    'Cannot delete tour because it is referenced by reservations'
                )
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Toggle tour active status
    async toggleTourStatus(req: Request, res: Response) {
        const { id } = req.params

        try {
            const tour = await toursService.toggleTourStatus(id)

            return responseHelper.success(
                res,
                tour,
                `Tour ${tour.isActive ? 'activated' : 'deactivated'} successfully`
            )
        } catch (error: any) {
            if (error.message === 'Tour not found') {
                return responseHelper.notFound(res, 'Tour not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Get tours by category
    async getToursByCategory(req: Request, res: Response) {
        const { categoryId } = req.params

        if (!categoryId) {
            return responseHelper.badRequest(res, 'Category ID is required')
        }

        try {
            const tours = await toursService.getToursByCategory(categoryId)

            return responseHelper.success(res, tours)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    }
}