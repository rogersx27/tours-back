// src/entities/inclusions/inclusions.controller.ts
import { Request, Response } from 'express'
import { inclusionsService } from './inclusions.service'
import { responseHelper } from '../../shared/utils/response'
import {
    CreateInclusionDto,
    UpdateInclusionDto,
    InclusionQueryFilter
} from './inclusions.types'

export const inclusionsController = {
    // Get all inclusions
    async getAllInclusions(req: Request, res: Response) {
        const filter: InclusionQueryFilter = {
            search: req.query.search as string,
            limit: req.query.limit ? Number(req.query.limit) : 50,
            offset: req.query.offset ? Number(req.query.offset) : 0
        }

        try {
            const inclusions = await inclusionsService.getAllInclusions(filter)

            return responseHelper.success(res, {
                inclusions,
                pagination: {
                    limit: filter.limit,
                    offset: filter.offset
                }
            })
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get inclusion by ID
    async getInclusionById(req: Request, res: Response) {
        const { id } = req.params

        try {
            const inclusion = await inclusionsService.getInclusionById(id)

            if (!inclusion) {
                return responseHelper.notFound(res, 'Inclusion not found')
            }

            return responseHelper.success(res, inclusion)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Create new inclusion
    async createInclusion(req: Request, res: Response) {
        const data: CreateInclusionDto = req.body

        // Validate
        if (!data.name || data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Inclusion name is required')
        }

        try {
            const inclusion = await inclusionsService.createInclusion(data)

            return responseHelper.created(res, inclusion, 'Inclusion created successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'An inclusion with this name already exists')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update inclusion
    async updateInclusion(req: Request, res: Response) {
        const { id } = req.params
        const data: UpdateInclusionDto = req.body

        // Validate that at least one field is provided
        if (Object.keys(data).length === 0) {
            return responseHelper.badRequest(res, 'No update data provided')
        }

        // Validate name if provided
        if (data.name !== undefined && data.name.trim() === '') {
            return responseHelper.badRequest(res, 'Inclusion name cannot be empty')
        }

        try {
            const inclusion = await inclusionsService.updateInclusion(id, data)

            return responseHelper.success(res, inclusion, 'Inclusion updated successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Inclusion not found')
            }

            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'An inclusion with this name already exists')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Delete inclusion
    async deleteInclusion(req: Request, res: Response) {
        const { id } = req.params

        try {
            // Check if inclusion can be deleted
            const canDelete = await inclusionsService.canDeleteInclusion(id)

            if (!canDelete) {
                return responseHelper.badRequest(
                    res,
                    'Cannot delete inclusion because it is used by one or more tours'
                )
            }

            await inclusionsService.deleteInclusion(id)

            return responseHelper.success(res, null, 'Inclusion deleted successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Inclusion not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    }
}