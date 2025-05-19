// src/entities/reservations/reservations.service.ts
import { prisma } from '../../lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { Prisma, ReservationStatus, PaymentStatus, Role } from '@prisma/client'
import {
    CreateReservationDto,
    UpdateReservationDto,
    UpdateReservationStatusDto,
    UpdatePaymentStatusDto,
    AssignGuideDto,
    ReservationResponse,
    ReservationDetailResponse,
    ReservationQueryFilter
} from './reservations.types'

export const reservationsService = {
    // Get all reservations with filtering
    async getAllReservations(filter: ReservationQueryFilter = {}): Promise<ReservationResponse[]> {
        const {
            userId,
            tourId,
            guideId,
            status,
            paymentStatus,
            fromDate,
            toDate,
            search,
            limit = 10,
            offset = 0
        } = filter

        // Build where clause
        const where: Prisma.ReservationWhereInput = {}

        // User filter
        if (userId) {
            where.userId = userId
        }

        // Tour filter
        if (tourId) {
            where.tourId = tourId
        }

        // Guide filter
        if (guideId) {
            where.guideId = guideId
        }

        // Status filter
        if (status) {
            where.status = status
        }

        // Payment status filter
        if (paymentStatus) {
            where.paymentStatus = paymentStatus
        }

        // Date range
        if (fromDate || toDate) {
            where.reservationDate = {};

            if (fromDate) {
                where.reservationDate.gte = new Date(fromDate);
            }

            if (toDate) {
                where.reservationDate.lte = new Date(toDate);
            }
        }

        // Search - look in tour name, user name, or notes
        if (search) {
            where.OR = [
                {
                    tour: {
                        name: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive
                        }
                    }
                },
                {
                    user: {
                        name: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive
                        }
                    }
                },
                {
                    notes: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive
                    }
                }
            ]
        }

        // Fetch reservations
        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            take: limit,
            skip: offset,
            orderBy: {
                reservationDate: 'desc'
            }
        })

        // Map to response type
        return reservations.map(reservation => ({
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }))
    },

    // Get reservation by ID
    async getReservationById(id: string): Promise<ReservationDetailResponse | null> {
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                payments: true
            }
        })

        if (!reservation) return null

        // Map to response type
        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide,
            payments: reservation.payments.map(payment => ({
                id: payment.id,
                reservationId: payment.reservationId,
                amount: Number(payment.amount),
                paymentMethod: payment.paymentMethod,
                transactionId: payment.transactionId,
                status: payment.status,
                paidAt: payment.paidAt,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }))
        }
    },

    // Create new reservation
    async createReservation(userId: string, data: CreateReservationDto): Promise<ReservationResponse> {
        const { tourId, reservationDate, peopleCount, notes } = data

        // Get tour details and verify it exists
        const tour = await prisma.tour.findUnique({
            where: { id: tourId },
            include: {
                prices: {
                    include: {
                        priceRange: true
                    }
                }
            }
        })

        if (!tour) {
            throw new Error('Tour not found')
        }

        if (!tour.isActive) {
            throw new Error('Tour is not available for booking')
        }

        // Determine price based on number of people
        const applicablePriceRange = tour.prices.find(price =>
            peopleCount >= price.priceRange.minPeople &&
            (price.priceRange.maxPeople === null || peopleCount <= price.priceRange.maxPeople)
        )

        if (!applicablePriceRange) {
            throw new Error(`No price range available for ${peopleCount} people`)
        }

        // Calculate total price
        const totalPrice = new Decimal(applicablePriceRange.price).mul(peopleCount)

        // Create reservation
        const reservation = await prisma.reservation.create({
            data: {
                tourId,
                userId,
                reservationDate: new Date(reservationDate),
                peopleCount,
                totalPrice,
                status: ReservationStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                notes
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }
    },

    // Update reservation
    async updateReservation(id: string, data: UpdateReservationDto): Promise<ReservationResponse> {
        const { reservationDate, peopleCount, notes } = data

        // Get current reservation
        const currentReservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                tour: {
                    include: {
                        prices: {
                            include: {
                                priceRange: true
                            }
                        }
                    }
                }
            }
        })

        if (!currentReservation) {
            throw new Error('Reservation not found')
        }

        // Only allow updates if reservation is in PENDING status
        if (currentReservation.status !== ReservationStatus.PENDING) {
            throw new Error('Cannot update a reservation that is not in PENDING status')
        }

        // Prepare update data
        const updateData: any = {
            ...(reservationDate && { reservationDate: new Date(reservationDate) }),
            ...(notes !== undefined && { notes })
        }

        // If people count changes, recalculate price
        if (peopleCount && peopleCount !== currentReservation.peopleCount) {
            const applicablePriceRange = currentReservation.tour.prices.find(price =>
                peopleCount >= price.priceRange.minPeople &&
                (price.priceRange.maxPeople === null || peopleCount <= price.priceRange.maxPeople)
            )

            if (!applicablePriceRange) {
                throw new Error(`No price range available for ${peopleCount} people`)
            }

            // Calculate new total price
            const totalPrice = new Decimal(applicablePriceRange.price).mul(peopleCount)

            updateData.peopleCount = peopleCount
            updateData.totalPrice = totalPrice
        }

        // Update reservation
        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: updateData,
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: updatedReservation.id,
            tourId: updatedReservation.tourId,
            userId: updatedReservation.userId,
            guideId: updatedReservation.guideId,
            reservationDate: updatedReservation.reservationDate,
            peopleCount: updatedReservation.peopleCount,
            totalPrice: Number(updatedReservation.totalPrice),
            status: updatedReservation.status,
            paymentStatus: updatedReservation.paymentStatus,
            notes: updatedReservation.notes,
            createdAt: updatedReservation.createdAt,
            updatedAt: updatedReservation.updatedAt,
            tour: updatedReservation.tour,
            user: updatedReservation.user,
            guide: updatedReservation.guide
        }
    },

    // Update reservation status
    async updateReservationStatus(id: string, data: UpdateReservationStatusDto): Promise<ReservationResponse> {
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                status: data.status
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }
    },

    // Update payment status
    async updatePaymentStatus(id: string, data: UpdatePaymentStatusDto): Promise<ReservationResponse> {
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                paymentStatus: data.paymentStatus
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }
    },

    // Assign guide to reservation
    async assignGuide(id: string, data: AssignGuideDto): Promise<ReservationResponse> {
        // Verify that the guide exists and has GUIDE role
        const guide = await prisma.user.findFirst({
            where: {
                id: data.guideId,
                role: Role.GUIDE,
                isActive: true
            }
        })

        if (!guide) {
            throw new Error('Guide not found or not active')
        }

        // Update the reservation
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                guideId: data.guideId
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }
    },

    // Get user reservations
    async getUserReservations(userId: string): Promise<ReservationResponse[]> {
        const reservations = await prisma.reservation.findMany({
            where: {
                userId
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                reservationDate: 'desc'
            }
        })

        return reservations.map(reservation => ({
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }))
    },

    // Get guide tours
    async getGuideTours(guideId: string): Promise<ReservationResponse[]> {
        const reservations = await prisma.reservation.findMany({
            where: {
                guideId
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                reservationDate: 'desc'
            }
        })

        return reservations.map(reservation => ({
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }))
    },

    // Cancel reservation
    async cancelReservation(id: string): Promise<ReservationResponse> {
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                status: ReservationStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        image: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        return {
            id: reservation.id,
            tourId: reservation.tourId,
            userId: reservation.userId,
            guideId: reservation.guideId,
            reservationDate: reservation.reservationDate,
            peopleCount: reservation.peopleCount,
            totalPrice: Number(reservation.totalPrice),
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
            tour: reservation.tour,
            user: reservation.user,
            guide: reservation.guide
        }
    }
}