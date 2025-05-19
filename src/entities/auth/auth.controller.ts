// src/entities/auth/auth.controller.ts
import { Request, Response } from 'express'
import { authService } from './auth.service'
import { AppError } from '../../shared/middleware/error.middleware'
import { responseHelper as response } from '../../shared/utils/response'
import {
  RegisterDto,
  LoginDto,
  UpdatePasswordDto
} from './auth.types'

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    const { email, name, password, phone, address }: RegisterDto = req.body

    // Validate input
    if (!email || !name || !password) {
      throw new AppError('Email, name, and password are required', 400)
    }

    if (!validateEmail(email)) {
      throw new AppError('Invalid email format', 400)
    }

    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters', 400)
    }

    try {
      const result = await authService.register({
        email,
        name,
        password,
        phone,
        address
      })

      return response.created(res, result, 'User registered successfully')
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 400)
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    const { email, password }: LoginDto = req.body

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    try {
      const result = await authService.login({ email, password })
      return response.success(res, result, 'Login successful')
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 401)
    }
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      return response.unauthorized(res, 'Authentication required')
    }

    try {
      const user = await authService.getCurrentUser(userId)
      return response.success(res, user)
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 400)
    }
  },

  // Update password
  async updatePassword(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      return response.unauthorized(res, 'Authentication required')
    }

    const { currentPassword, newPassword }: UpdatePasswordDto = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return response.badRequest(res, 'Current password and new password are required')
    }

    if (!validatePassword(newPassword)) {
      return response.badRequest(res, 'New password must be at least 8 characters')
    }

    try {
      await authService.updatePassword(userId, {
        currentPassword,
        newPassword
      })

      return response.success(res, null, 'Password updated successfully')
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return response.badRequest(res, error.message)
      }
      throw new AppError(error.message, error.statusCode || 400)
    }
  },

  // Logout user (simple implementation)
  async logout(req: Request, res: Response) {
    // In a stateless JWT implementation, we can't actually invalidate the token
    // without implementing a token blacklist or using short-lived tokens with refresh tokens

    // For now, just return success and let the client delete the token
    return response.success(res, null, 'Logged out successfully')
  }
}