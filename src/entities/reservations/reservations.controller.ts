// src/entities/reservations/reservations.controller.ts
import { Request, Response } from 'express'
import { reservationsService } from './reservations.service'
import { responseHelper } from '../../shared/utils/response'
import { ReservationStatus, PaymentStatus } from '@prisma/client'
import {
    CreateReservationDto,
    UpdateReservationDto,
    UpdateReservationStatusDto,
    UpdatePaymentStatusDto,
    AssignGuideDto,
    ReservationQueryFilter
} from './reservations.types'

export const reservationsController = {
    // Get all reservations with filtering (admin)
    async getAllReservations(req: Request, res: Response) {
        const filter: ReservationQueryFilter = {
            userId: req.query.userId as string,
            tourId: req.query.tourId as string,
            guideId: req.query.guideId as string,
            status: req.query.status as ReservationStatus | undefined,
            paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
            fromDate: req.query.fromDate as string,
            toDate: req.query.toDate as string,
            search: req.query.search as string,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            offset: req.query.offset ? Number(req.query.offset) : 0
        }

        try {
            const reservations = await reservationsService.getAllReservations(filter)

            return responseHelper.success(res, {
                reservations,
                pagination: {
                    limit: filter.limit,
                    offset: filter.offset
                }
            })
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get reservation by ID
    async getReservationById(req: Request, res: Response) {
        const { id } = req.params

        try {
            const reservation = await reservationsService.getReservationById(id)

            if (!reservation) {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            // Check if user has permission to view this reservation
            if (req.user?.role !== 'ADMIN' &&
                req.user?.role !== 'GUIDE' &&
                req.user?.id !== reservation.userId) {
                return responseHelper.forbidden(res, 'You do not have permission to view this reservation')
            }

            return responseHelper.success(res, reservation)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Create new reservation (customer)
    async createReservation(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'Authentication required')
        }

        const reservationData: CreateReservationDto = req.body

        // Validate required fields
        if (!reservationData.tourId || !reservationData.reservationDate || !reservationData.peopleCount) {
            return responseHelper.badRequest(
                res,
                'Tour ID, reservation date, and number of people are required'
            )
        }

        // Validate people count
        if (reservationData.peopleCount < 1) {
            return responseHelper.badRequest(res, 'Number of people must be at least 1')
        }

        try {
            const reservation = await reservationsService.createReservation(userId, reservationData)

            return responseHelper.created(res, reservation, 'Reservation created successfully')
        } catch (error: any) {
            if (error.message.includes('Tour not found')) {
                return responseHelper.badRequest(res, 'Tour not found')
            }

            if (error.message.includes('Tour is not available')) {
                return responseHelper.badRequest(res, 'Tour is not available for booking')
            }

            if (error.message.includes('No price range available')) {
                return responseHelper.badRequest(res, error.message)
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update reservation (customer, admin)
    async updateReservation(req: Request, res: Response) {
        const { id } = req.params
        const updateData: UpdateReservationDto = req.body

        try {
            // Check if reservation exists and user has permission
            const reservation = await reservationsService.getReservationById(id)

            if (!reservation) {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            // Only allow admin or the reservation owner to update
            if (req.user?.role !== 'ADMIN' && req.user?.id !== reservation.userId) {
                return responseHelper.forbidden(
                    res,
                    'You do not have permission to update this reservation'
                )
            }

            // Validate people count if provided
            if (updateData.peopleCount !== undefined && updateData.peopleCount < 1) {
                return responseHelper.badRequest(res, 'Number of people must be at least 1')
            }

            const updatedReservation = await reservationsService.updateReservation(id, updateData)

            return responseHelper.success(res, updatedReservation, 'Reservation updated successfully')
        } catch (error: any) {
            if (error.message.includes('Reservation not found')) {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            if (error.message.includes('Cannot update a reservation')) {
                return responseHelper.badRequest(res, error.message)
            }

            if (error.message.includes('No price range available')) {
                return responseHelper.badRequest(res, error.message)
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update reservation status (admin)
    async updateReservationStatus(req: Request, res: Response) {
        const { id } = req.params
        const updateData: UpdateReservationStatusDto = req.body

        // Validate status value
        if (!Object.values(ReservationStatus).includes(updateData.status)) {
            return responseHelper.badRequest(res, 'Invalid reservation status')
        }

        try {
            const reservation = await reservationsService.updateReservationStatus(id, updateData)

            return responseHelper.success(
                res,
                reservation,
                `Reservation status updated to ${updateData.status}`
            )
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Update payment status (admin)
    async updatePaymentStatus(req: Request, res: Response) {
        const { id } = req.params
        const updateData: UpdatePaymentStatusDto = req.body

        // Validate payment status value
        if (!Object.values(PaymentStatus).includes(updateData.paymentStatus)) {
            return responseHelper.badRequest(res, 'Invalid payment status')
        }

        try {
            const reservation = await reservationsService.updatePaymentStatus(id, updateData)

            return responseHelper.success(
                res,
                reservation,
                `Payment status updated to ${updateData.paymentStatus}`
            )
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Assign guide to reservation (admin)
    async assignGuide(req: Request, res: Response) {
        const { id } = req.params
        const assignData: AssignGuideDto = req.body

        if (!assignData.guideId) {
            return responseHelper.badRequest(res, 'Guide ID is required')
        }

        try {
            const reservation = await reservationsService.assignGuide(id, assignData)

            return responseHelper.success(res, reservation, 'Guide assigned successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            if (error.message.includes('Guide not found')) {
                return responseHelper.badRequest(res, error.message)
            }

            return responseHelper.serverError(res, error.message)
        }
    },

    // Get user reservations (customer)
    async getUserReservations(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'Authentication required')
        }

        try {
            const reservations = await reservationsService.getUserReservations(userId)

            return responseHelper.success(res, reservations)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Get guide tours (guide)
    async getGuideTours(req: Request, res: Response) {
        const guideId = req.user?.id

        if (!guideId || req.user?.role !== 'GUIDE') {
            return responseHelper.forbidden(res, 'You do not have permission to access this resource')
        }

        try {
            const reservations = await reservationsService.getGuideTours(guideId)

            return responseHelper.success(res, reservations)
        } catch (error: any) {
            return responseHelper.serverError(res, error.message)
        }
    },

    // Cancel reservation (customer, admin)
    async cancelReservation(req: Request, res: Response) {
        const { id } = req.params

        try {
            // Check if reservation exists and user has permission
            const reservation = await reservationsService.getReservationById(id)

            if (!reservation) {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            // Only allow admin or the reservation owner to cancel
            if (req.user?.role !== 'ADMIN' && req.user?.id !== reservation.userId) {
                return responseHelper.forbidden(
                    res,
                    'You do not have permission to cancel this reservation'
                )
            }

            // Only allow cancellation of PENDING or CONFIRMED reservations
            if (reservation.status !== ReservationStatus.PENDING &&
                reservation.status !== ReservationStatus.CONFIRMED) {
                return responseHelper.badRequest(
                    res,
                    `Cannot cancel a reservation with status ${reservation.status}`
                )
            }

            const cancelledReservation = await reservationsService.cancelReservation(id)

            return responseHelper.success(res, cancelledReservation, 'Reservation cancelled successfully')
        } catch (error: any) {
            if (error.code === 'P2025') {
                return responseHelper.notFound(res, 'Reservation not found')
            }

            return responseHelper.serverError(res, error.message)
        }
    }
}