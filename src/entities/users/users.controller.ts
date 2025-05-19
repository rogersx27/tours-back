// src/entities/users/users.controller.ts
import { Request, Response } from 'express'
import { usersService } from './users.service'
// import { reservationsService } from '../reservations/reservations.service'
import { AppError } from '../../shared/middleware/error.middleware'
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
            throw new AppError('Email, name and password are required', 400)
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            throw new AppError('Invalid email format', 400)
        }

        try {
            const user = await usersService.createUser(userData)

            // Remove sensitive data from response
            const { password, ...userResponse } = user as any

            res.status(201).json({
                success: true,
                data: userResponse,
                message: 'User registered successfully'
            })
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError('Email already exists', 400)
            }
            throw error
        }
    },

    // Get user profile
    async getProfile(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Get different profile data based on user role
        const user = req.user?.role === Role.GUIDE
            ? await usersService.getGuideProfile(userId)
            : await usersService.getUserProfile(userId)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        res.status(200).json({
            success: true,
            data: user
        })
    },

    // Update user profile
    async updateProfile(req: Request, res: Response) {
        const userId = req.user?.id
        const updateData: UpdateUserDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Basic validation
        if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
            throw new AppError('Invalid email format', 400)
        }

        try {
            const updatedUser = await usersService.updateProfile(userId, updateData)

            res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully'
            })
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError('Email already exists', 400)
            }
            throw error
        }
    },

    // Change password
    async changePassword(req: Request, res: Response) {
        const userId = req.user?.id
        const passwordData: UpdatePasswordDto = req.body

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        // Validate password data
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            throw new AppError('Current password and new password are required', 400)
        }

        // Validate password strength
        if (passwordData.newPassword.length < 8) {
            throw new AppError('New password must be at least 8 characters long', 400)
        }

        try {
            await usersService.updatePassword(userId, passwordData)

            res.status(200).json({
                success: true,
                message: 'Password updated successfully'
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Get user reservations
    async getUserReservations(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        try {
            // const reservations = await reservationsService.getUserReservations(userId)

            res.status(200).json({
                success: true,
                data: "reservations"
            })
        } catch (error: any) {
            throw error
        }
    },

    // Create new user (admin)
    async createUser(req: Request, res: Response) {
        const userData: CreateUserDto = req.body

        // Validate required fields
        if (!userData.email || !userData.name || !userData.password) {
            throw new AppError('Email, name and password are required', 400)
        }

        try {
            const user = await usersService.createUser(userData)

            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully'
            })
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError('Email already exists', 400)
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

        res.status(200).json({
            success: true,
            data: users,
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
            throw new AppError('User not found', 404)
        }

        res.status(200).json({
            success: true,
            data: user
        })
    },

    // Toggle user active status (admin)
    async toggleUserStatus(req: Request, res: Response) {
        const { id } = req.params

        try {
            const user = await usersService.toggleUserStatus(id)

            res.status(200).json({
                success: true,
                data: user,
                message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
            })
        } catch (error: any) {
            throw new AppError(error.message, 400)
        }
    },

    // Get guide dashboard
    async getGuideDashboard(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const guideProfile = await usersService.getGuideProfile(userId)

        if (!guideProfile) {
            throw new AppError('Guide profile not found', 404)
        }

        res.status(200).json({
            success: true,
            data: guideProfile
        })
    },

    // Get admin dashboard
    async getAdminDashboard(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        const dashboardData = await usersService.getAdminDashboard(userId)

        if (!dashboardData) {
            throw new AppError('Admin profile not found', 404)
        }

        res.status(200).json({
            success: true,
            data: dashboardData
        })
    },

    // Get guide tours
    async getGuideTours(req: Request, res: Response) {
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('User not authenticated', 401)
        }

        try {
            // const tours = await reservationsService.getGuideTours(userId)

            res.status(200).json({
                success: true,
                data: "tours"
            })
        } catch (error: any) {
            throw error
        }
    }
}