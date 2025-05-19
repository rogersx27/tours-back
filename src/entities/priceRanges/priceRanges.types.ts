// src/entities/priceRanges/priceRanges.types.ts
// Request DTOs
export interface CreatePriceRangeDto {
    name: string
    minPeople: number
    maxPeople?: number | null
}

export interface UpdatePriceRangeDto {
    name?: string
    minPeople?: number
    maxPeople?: number | null
}

// Response DTOs
export interface PriceRangeResponse {
    id: string
    name: string
    minPeople: number
    maxPeople: number | null
    createdAt: Date
    updatedAt: Date
}

export interface PriceRangeDetailResponse extends PriceRangeResponse {
    usageCount: number
}

// Query filters
export interface PriceRangeQueryFilter {
    search?: string
    limit?: number
    offset?: number
}