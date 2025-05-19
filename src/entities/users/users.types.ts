// src/entities/users/users.types.ts
import { Role } from "@prisma/client"

// Request DTOs
export interface CreateUserDto {
    email: string
    name: string
    password: string
    phone?: string
    address?: string
    role?: Role
}

export interface UpdateUserDto {
    email?: string
    name?: string
    phone?: string
    address?: string
    isActive?: boolean
}

export interface UpdatePasswordDto {
    currentPassword: string
    newPassword: string
}

// Response DTOs
export interface UserResponse {
    id: string
    email: string
    name: string
    phone: string | null
    address: string | null
    role: Role
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface UserProfileResponse extends UserResponse {
    reservationsCount: number
}

export interface GuideProfileResponse extends UserResponse {
    upcomingToursCount: number
    completedToursCount: number
    averageRating?: number
}

export interface AdminDashboardResponse extends UserResponse {
    totalUsers: number
    totalReservations: number
    pendingReservations: number
}

// Query filters
export interface UserQueryFilter {
    role?: Role
    isActive?: boolean
    search?: string
    limit?: number
    offset?: number
}