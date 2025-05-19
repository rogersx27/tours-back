// src/entities/priceRanges/priceRanges.controller.ts
import { Request, Response } from 'express'
import { priceRangesService } from './priceRanges.service'
import { responseHelper } from '../../shared/utils/response'
import {
    CreatePriceRangeDto,
    UpdatePriceRangeDto,
    PriceRangeQueryFilter
} from './priceRanges.types'

export const priceRangesController = {
    // Get all price ranges
    async getAllPriceRanges(req: Request, res: Response) {
        const filter: PriceRangeQueryFilter = {
            search: req.query.search as string,
            limit: req.query.limit ? Number(req.query.limit) : 50,
            offset: req.query.offset ? Number(req.query.offset) : 0
        }

        try {
            const priceRanges = await priceRangesService.getAllPriceRanges(filter)

            return responseHelper.success(res, {
                priceRanges,
                pagination: {
                    limit: filter.limit,
                    offset: filter.offset
                }
            })
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get price range by ID
    async getPriceRangeById(req: Request, res: Response) {
        const { id } = req.params

        try {
            const priceRange = await priceRangesService.getPriceRangeById(id)

            if (!priceRange) {
                return responseHelper.notFound(res, 'Price range not found')
            }

            return responseHelper.success(res, priceRange)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Create new price range
    async createPriceRange(req: Request, res: Response) {
        const data: CreatePriceRangeDto = req.body

        // Validate required fields
        if (!data.name || data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Price range name is required')
        }

        if (data.minPeople === undefined || data.minPeople < 1) {
            return responseHelper.badRequest(res, 'Minimum people must be at least 1')
        }

        // Validate max people if provided
        if (data.maxPeople !== undefined && data.maxPeople !== null && data.maxPeople < data.minPeople) {
            return responseHelper.badRequest(res, 'Maximum people must be greater than or equal to minimum people')
        }

        try {
            // Check for overlapping ranges
            const noOverlap = await priceRangesService.validatePriceRangeOverlap(
                data.minPeople,
                data.maxPeople || null
            )

            if (!noOverlap) {
                return responseHelper.badRequest(
                    res,
                    'This price range overlaps with an existing range'
                )
            }

            const priceRange = await priceRangesService.createPriceRange(data)

            return responseHelper.created(res, priceRange, 'Price range created successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'A price range with this name already exists')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update price range
    async updatePriceRange(req: Request, res: Response) {
        const { id } = req.params
        const data: UpdatePriceRangeDto = req.body

        // Validate that at least one field is provided
        if (Object.keys(data).length === 0) {
            return responseHelper.badRequest(res, 'No update data provided')
        }

        // Validate name if provided
        if (data.name !== undefined && data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Price range name cannot be empty')
        }

        // Validate min people if provided
        if (data.minPeople !== undefined && data.minPeople < 1) {
            return responseHelper.badRequest(res, 'Minimum people must be at least 1')
        }

        try {
            // Check for overlapping ranges if changing people values
            if (data.minPeople !== undefined || data.maxPeople !== undefined) {
                // Get current values first
                const current = await priceRangesService.getPriceRangeById(id)

                if (!current) {
                    return responseHelper.notFound(res, 'Price range not found')
                }

                const minPeople = data.minPeople !== undefined ? data.minPeople : current.minPeople
                const maxPeople = data.maxPeople !== undefined ? data.maxPeople : current.maxPeople

                const noOverlap = await priceRangesService.validatePriceRangeOverlap(
                    minPeople,
                    maxPeople,
                    id
                )

                if (!noOverlap) {
                    return responseHelper.badRequest(
                        res,
                        'This price range would overlap with an existing range'
                    )
                }
            }

            const priceRange = await priceRangesService.updatePriceRange(id, data)

            return responseHelper.success(res, priceRange, 'Price range updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Price range not found')
            }

            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'A price range with this name already exists')
            }

            if (error.message.includes('Minimum people cannot be greater than')) {
                return responseHelper.badRequest(res, error.message)
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Delete price range
    async deletePriceRange(req: Request, res: Response) {
        const { id } = req.params

        try {
            // Check if price range can be deleted
            const canDelete = await priceRangesService.canDeletePriceRange(id)

            if (!canDelete) {
                return responseHelper.badRequest(
                    res,
                    'Cannot delete price range because it is used by one or more tours'
                )
            }

            await priceRangesService.deletePriceRange(id)

            return responseHelper.success(res, null, 'Price range deleted successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Price range not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    }
}