// src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { authService } from '../../entities/auth/auth.service'
import { AppError } from './error.middleware'
import { prisma } from '../../lib/prisma'
import { JWTPayload } from '../../entities/auth/auth.types'

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                role: string
            }
        }
    }
}

/**
 * Middleware to authenticate user requests using JWT token
 * Extracts the token from Authorization header, verifies it,
 * and attaches the user to the request object
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('Authentication required', 401))
        }

        const token = authHeader.split(' ')[1]

        if (!token) {
            return next(new AppError('Authentication required', 401))
        }

        // Verify token
        let decoded: JWTPayload
        try {
            decoded = authService.verifyToken(token)
        } catch (error) {
            return next(new AppError('Invalid or expired token', 401))
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        })

        if (!user) {
            return next(new AppError('User not found', 401))
        }

        // Check if user is active
        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated', 403))
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        }

        next()
    } catch (error) {
        next(new AppError('Authentication failed', 401))
    }
}