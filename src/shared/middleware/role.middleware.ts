// src/shared/middleware/role.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { AppError } from './error.middleware'

/**
 * Middleware that checks if a user has one of the required roles
 * @param roles Array of allowed roles for the route
 * @returns Middleware function that validates user role
 */
export const roleMiddleware = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Check if user exists in the request (set by authMiddleware)
        if (!req.user) {
            return next(new AppError('User not authenticated', 401))
        }

        // Convert user's role to Role type and check if it is in the allowed roles array
        if (!roles.includes(req.user.role as Role)) {
            return next(new AppError('You do not have permission to access this resource', 403))
        }

        // If user has the required role, proceed to the next middleware/controller
        next()
    }
}