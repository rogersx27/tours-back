// src/entities/auth/auth.types.ts
import { Role } from '@prisma/client'

// Request DTOs
export interface RegisterDto {
    email: string
    name: string
    password: string
    phone?: string
    address?: string
}

export interface LoginDto {
    email: string
    password: string
}

export interface UpdatePasswordDto {
    currentPassword: string
    newPassword: string
}

// Response DTOs
export interface AuthResponse {
    user: {
        id: string
        email: string
        name: string
        role: Role
        isActive: boolean
    }
    token: string
}

export interface UserAuthResponse {
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

// JWT payload
export interface JWTPayload {
    id: string
    email: string
    role: Role
    iat?: number
    exp?: number
}