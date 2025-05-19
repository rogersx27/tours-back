// src/entities/users/users.service.ts
import { prisma } from '../../lib/prisma'
import { Role, User } from '@prisma/client'
import bcrypt from 'bcrypt'
import {
    CreateUserDto,
    UpdateUserDto,
    UpdatePasswordDto,
    UserResponse,
    UserProfileResponse,
    GuideProfileResponse,
    AdminDashboardResponse,
    UserQueryFilter
} from './users.types'
import { ReservationStatus } from '@prisma/client'

export const usersService = {
    // Get user by ID
    async getUserById(id: string): Promise<UserResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) return null

        return this.mapToUserResponse(user)
    },

    // Get all users (admin)
    async getAllUsers(filter: UserQueryFilter = {}): Promise<UserResponse[]> {
        const { role, isActive, search, limit = 10, offset = 0 } = filter

        // Build the where clause
        const where: any = {}

        if (role !== undefined) {
            where.role = role
        }

        if (isActive !== undefined) {
            where.isActive = isActive
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Query users with filters
        const users = await prisma.user.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        })

        return users.map(this.mapToUserResponse)
    },

    // Create new user
    async createUser(data: CreateUserDto): Promise<UserResponse> {
        // Hash the password
        const hashedPassword = await bcrypt.hash(data.password, 10)

        // Create the user
        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                role: data.role || Role.CUSTOMER
            }
        })

        return this.mapToUserResponse(user)
    },

    // Update user profile
    async updateProfile(id: string, data: UpdateUserDto): Promise<UserResponse> {
        const user = await prisma.user.update({
            where: { id },
            data
        })

        return this.mapToUserResponse(user)
    },

    // Update user password
    async updatePassword(id: string, data: UpdatePasswordDto): Promise<boolean> {
        // Get user
        const user = await prisma.user.findUnique({
            where: { id },
            select: { password: true }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Check current password
        const passwordValid = await bcrypt.compare(data.currentPassword, user.password)
        if (!passwordValid) {
            throw new Error('Current password is incorrect')
        }

        // Update password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10)
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        })

        return true
    },

    // Toggle user active status (admin)
    async toggleUserStatus(id: string): Promise<UserResponse> {
        // Get current status
        const user = await prisma.user.findUnique({
            where: { id },
            select: { isActive: true }
        })

        if (!user) {
            throw new Error('User not found')
        }

        // Toggle status
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive }
        })

        return this.mapToUserResponse(updatedUser)
    },

    // Get profile with reservation stats (customer)
    async getUserProfile(id: string): Promise<UserProfileResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) return null

        // Count user reservations
        const reservationsCount = await prisma.reservation.count({
            where: { userId: id }
        })

        return {
            ...this.mapToUserResponse(user),
            reservationsCount
        }
    },

    // Get guide profile with stats
    async getGuideProfile(id: string): Promise<GuideProfileResponse | null> {
        const user = await prisma.user.findUnique({
            where: {
                id,
                role: Role.GUIDE
            }
        })

        if (!user) return null

        // Get upcoming tours count
        const upcomingToursCount = await prisma.reservation.count({
            where: {
                guideId: id,
                reservationDate: {
                    gte: new Date()
                },
                status: {
                    in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING]
                }
            }
        })

        // Get completed tours count
        const completedToursCount = await prisma.reservation.count({
            where: {
                guideId: id,
                status: ReservationStatus.COMPLETED
            }
        })

        // Could add rating functionality here if needed

        return {
            ...this.mapToUserResponse(user),
            upcomingToursCount,
            completedToursCount
        }
    },

    // Get admin dashboard stats
    async getAdminDashboard(id: string): Promise<AdminDashboardResponse | null> {
        const user = await prisma.user.findUnique({
            where: {
                id,
                role: Role.ADMIN
            }
        })

        if (!user) return null

        // Gather system stats for admin dashboard
        const totalUsers = await prisma.user.count()

        const totalReservations = await prisma.reservation.count()

        const pendingReservations = await prisma.reservation.count({
            where: {
                status: ReservationStatus.PENDING
            }
        })

        return {
            ...this.mapToUserResponse(user),
            totalUsers,
            totalReservations,
            pendingReservations
        }
    },

    // Helper: Map User model to UserResponse
    mapToUserResponse(user: User): UserResponse {
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