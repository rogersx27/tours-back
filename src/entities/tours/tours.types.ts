// src/entities/tours/tours.types.ts
import { Tour, Category, Inclusion, PriceRange } from '@prisma/client'

// Request DTOs
export interface CreateTourDto {
    name: string
    description: string
    duration: string
    durationMinutes: number
    image?: string
    isActive?: boolean
    categoryId: string
    inclusions?: string[] // Array of inclusion IDs
    prices?: TourPriceDto[] // Array of price objects
}

export interface UpdateTourDto {
    name?: string
    description?: string
    duration?: string
    durationMinutes?: number
    image?: string
    isActive?: boolean
    categoryId?: string
}

export interface TourPriceDto {
    priceRangeId: string
    price: number
}

export interface UpdateTourInclusionsDto {
    inclusionIds: string[]
}

export interface UpdateTourPricesDto {
    prices: TourPriceDto[]
}

// Response DTOs
export interface TourResponse {
    id: string
    name: string
    description: string
    duration: string
    durationMinutes: number
    image: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    categoryId: string
    category?: CategoryResponse
}

export interface TourDetailResponse extends TourResponse {
    category: CategoryResponse
    inclusions: InclusionResponse[]
    prices: TourPriceResponse[]
}

export interface CategoryResponse {
    id: string
    name: string
}

export interface InclusionResponse {
    id: string
    name: string
    icon: string | null
}

export interface TourPriceResponse {
    id: string
    tourId: string
    priceRangeId: string
    price: number
    priceRange: PriceRangeResponse
}

export interface PriceRangeResponse {
    id: string
    name: string
    minPeople: number
    maxPeople: number | null
}

// Query filters
export interface TourQueryFilter {
    categoryId?: string
    search?: string
    isActive?: boolean
    minPrice?: number
    maxPrice?: number
    minDuration?: number
    maxDuration?: number
    inclusions?: string[] // Inclusion IDs to filter by
    limit?: number
    offset?: number
}