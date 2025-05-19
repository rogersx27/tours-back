// src/entities/reservations/reservations.types.ts
import { ReservationStatus, PaymentStatus, Role } from '@prisma/client'

// Request DTOs
export interface CreateReservationDto {
    tourId: string
    reservationDate: Date | string
    peopleCount: number
    notes?: string
}

export interface UpdateReservationDto {
    reservationDate?: Date | string
    peopleCount?: number
    notes?: string
}

export interface UpdateReservationStatusDto {
    status: ReservationStatus
}

export interface UpdatePaymentStatusDto {
    paymentStatus: PaymentStatus
}

export interface AssignGuideDto {
    guideId: string
}

// Response DTOs
export interface ReservationResponse {
    id: string
    tourId: string
    userId: string
    guideId: string | null
    reservationDate: Date
    peopleCount: number
    totalPrice: number
    status: ReservationStatus
    paymentStatus: PaymentStatus
    notes: string | null
    createdAt: Date
    updatedAt: Date
    tour: {
        id: string
        name: string
        duration: string
        image: string | null
    }
    user: {
        id: string
        name: string
        email: string
        phone: string | null
    }
    guide: {
        id: string
        name: string
        email: string
        phone: string | null
    } | null
}

export interface ReservationDetailResponse extends ReservationResponse {
    payments: PaymentResponse[]
}

export interface PaymentResponse {
    id: string
    reservationId: string
    amount: number
    paymentMethod: string
    transactionId: string | null
    status: PaymentStatus
    paidAt: Date | null
    createdAt: Date
    updatedAt: Date
}

// Query filters
export interface ReservationQueryFilter {
    userId?: string
    tourId?: string
    guideId?: string
    status?: ReservationStatus
    paymentStatus?: PaymentStatus
    fromDate?: Date | string
    toDate?: Date | string
    search?: string
    limit?: number
    offset?: number
}