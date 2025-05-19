// src/entities/auth/auth.service.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../shared/middleware/error.middleware'
import { Role, User } from '@prisma/client'
import {
    RegisterDto,
    LoginDto,
    AuthResponse,
    UserAuthResponse,
    JWTPayload,
    UpdatePasswordDto
} from './auth.types'
import { jwtUtils } from '../../shared/utils/jwt'
import config from '../../config/env'

export const authService = {
    // Generate JWT token
    generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        return jwt.sign(payload, config.JWT_SECRET as jwt.Secret, {
            expiresIn: config.JWT_EXPIRES_IN,
        })
    },

    // Verify JWT token
    verifyToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.JWT_SECRET as jwt.Secret) as JWTPayload
        } catch (error) {
            throw new AppError('Invalid or expired token', 401)
        }
    },

    // Register new user
    async register(data: RegisterDto): Promise<AuthResponse> {
        const { email, name, password, phone, address } = data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            throw new AppError('User with this email already exists', 400)
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                phone,
                address,
                role: Role.CUSTOMER // Default role for self-registration
            }
        })

        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive
            },
            token
        }
    },

    // Login user
    async login(data: LoginDto): Promise<AuthResponse> {
        const { email, password } = data

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || !user.password) {
            throw new AppError('Invalid email or password', 401)
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AppError('Your account has been deactivated. Please contact support.', 403)
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401)
        }

        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive
            },
            token
        }
    },

    // Get current user
    async getCurrentUser(userId: string): Promise<UserAuthResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw new AppError('User not found', 404)
        }

        return this.mapToUserAuthResponse(user)
    },

    // Update password
    async updatePassword(userId: string, data: UpdatePasswordDto): Promise<void> {
        const { currentPassword, newPassword } = data

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user || !user.password) {
            throw new AppError('User not found', 404)
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            throw new AppError('Current password is incorrect', 400)
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })
    },

    // Helper: Map User model to UserAuthResponse
    mapToUserAuthResponse(user: User): UserAuthResponse {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            address: user.address,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    }
}