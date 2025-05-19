// src/entities/inclusions/inclusions.types.ts
// Request DTOs
export interface CreateInclusionDto {
    name: string
    icon?: string
}

export interface UpdateInclusionDto {
    name?: string
    icon?: string
}

// Response DTOs
export interface InclusionResponse {
    id: string
    name: string
    icon: string | null
    createdAt: Date
    updatedAt: Date
}

export interface InclusionDetailResponse extends InclusionResponse {
    usageCount: number
}

// Query filters
export interface InclusionQueryFilter {
    search?: string
    limit?: number
    offset?: number
}