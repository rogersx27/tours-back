// src/entities/categories/categories.types.ts
// Request DTOs
export interface CreateCategoryDto {
    name: string
}

export interface UpdateCategoryDto {
    name: string
}

// Response DTOs
export interface CategoryResponse {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
}

export interface CategoryDetailResponse extends CategoryResponse {
    tourCount: number
}

// Query filters
export interface CategoryQueryFilter {
    search?: string
    limit?: number
    offset?: number
}