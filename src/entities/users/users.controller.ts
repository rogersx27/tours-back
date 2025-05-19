// src/entities/users/users.controller.ts
import { Request, Response } from 'express'
import { usersService } from './users.service'
import { reservationsService } from '../reservations/reservations.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { responseHelper } from '../../shared/utils/response'
import {
    CreateUserDto,
    UpdateUserDto,
    UpdatePasswordDto,
    UserQueryFilter
} from './users.types'
import { Role } from '@prisma/client'

export const usersController = {
    // Register new user (public route)
    async register(req: Request, res: Response) {
        const userData: CreateUserDto = {
            ...req.body,
            role: Role.CUSTOMER // Force role to be CUSTOMER for public registration
        }

        // Validate required fields
        if (!userData.email || !userData.name || !userData.password) {
            return responseHelper.badRequest(res, 'Email, name and password are required')
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            return responseHelper.badRequest(res, 'Invalid email format')
        }

        try {
            const user = await usersService.createUser(userData)

            // Remove sensitive data from response
            const { password, ...userResponse } = user as any

            return responseHelper.created(res, userResponse, 'User registered successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'Email already exists')
            }
            throw error
        }
    },

    // Get user profile
    async getProfile(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        // Get different profile data based on user role
        const user = req.user?.role === Role.GUIDE
            ? await usersService.getGuideProfile(userId)
            : await usersService.getUserProfile(userId)

        if (!user) {
            return responseHelper.notFound(res, 'User not found')
        }

        return responseHelper.success(res, user)
    },

    // Update user profile
    async updateProfile(req: Request, res: Response) {
        const userId = req.user?.id
        const updateData: UpdateUserDto = req.body

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        // Basic validation
        if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
            return responseHelper.badRequest(res, 'Invalid email format')
        }

        try {
            const updatedUser = await usersService.updateProfile(userId, updateData)

            return responseHelper.success(res, updatedUser, 'Profile updated successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'Email already exists')
            }
            throw error
        }
    },

    // Change password
    async changePassword(req: Request, res: Response) {
        const userId = req.user?.id
        const passwordData: UpdatePasswordDto = req.body

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        // Validate password data
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            return responseHelper.badRequest(res, 'Current password and new password are required')
        }

        // Validate password strength
        if (passwordData.newPassword.length < 8) {
            return responseHelper.badRequest(res, 'New password must be at least 8 characters long')
        }

        try {
            await usersService.updatePassword(userId, passwordData)

            return responseHelper.success(res, null, 'Password updated successfully')
        } catch (error: any) {
            return responseHelper.badRequest(res, error.message)
        }
    },

    // Get user reservations
    async getUserReservations(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        try {
            const reservations = await reservationsService.getUserReservations(userId)

            return responseHelper.success(res, reservations)
        } catch (error: any) {
            throw error
        }
    },

    // Create new user (admin)
    async createUser(req: Request, res: Response) {
        const userData: CreateUserDto = req.body

        // Validate required fields
        if (!userData.email || !userData.name || !userData.password) {
            return responseHelper.badRequest(res, 'Email, name and password are required')
        }

        try {
            const user = await usersService.createUser(userData)

            return responseHelper.created(res, user, 'User created successfully')
        } catch (error: any) {
            if (error.code === 'P2002') {
                return responseHelper.badRequest(res, 'Email already exists')
            }
            throw error
        }
    },

    // Get all users (admin)
    async getAllUsers(req: Request, res: Response) {
        const filter: UserQueryFilter = {
            role: req.query.role as Role | undefined,
            isActive: req.query.isActive === 'true' ? true :
                req.query.isActive === 'false' ? false : undefined,
            search: req.query.search as string,
            limit: parseInt(req.query.limit as string) || 10,
            offset: parseInt(req.query.offset as string) || 0
        }

        const users = await usersService.getAllUsers(filter)

        return responseHelper.success(res, {
            users,
            pagination: {
                limit: filter.limit,
                offset: filter.offset
            }
        })
    },

    // Get user by ID (admin)
    async getUserById(req: Request, res: Response) {
        const { id } = req.params

        const user = await usersService.getUserById(id)

        if (!user) {
            return responseHelper.notFound(res, 'User not found')
        }

        return responseHelper.success(res, user)
    },

    // Toggle user active status (admin)
    async toggleUserStatus(req: Request, res: Response) {
        const { id } = req.params

        try {
            const user = await usersService.toggleUserStatus(id)

            return responseHelper.success(
                res,
                user,
                `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
            )
        } catch (error: any) {
            return responseHelper.badRequest(res, error.message)
        }
    },

    // Get guide dashboard
    async getGuideDashboard(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        const guideProfile = await usersService.getGuideProfile(userId)

        if (!guideProfile) {
            return responseHelper.notFound(res, 'Guide profile not found')
        }

        return responseHelper.success(res, guideProfile)
    },

    // Get admin dashboard
    async getAdminDashboard(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        const dashboardData = await usersService.getAdminDashboard(userId)

        if (!dashboardData) {
            return responseHelper.notFound(res, 'Admin profile not found')
        }

        return responseHelper.success(res, dashboardData)
    },

    // Get guide tours
    async getGuideTours(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            return responseHelper.unauthorized(res, 'User not authenticated')
        }

        try {
            const tours = await reservationsService.getGuideTours(userId)

            return responseHelper.success(res, tours)
        } catch (error: any) {
            throw error
        }
    }
}