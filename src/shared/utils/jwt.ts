import jwt from 'jsonwebtoken'
import config from '../../config/env'
import { AppError } from '../middleware/error.middleware'
import { JWTPayload } from '../../entities/auth/auth.types'

// Utilidad para manejar tokens JWT
export const jwtUtils = {
    // Generar token con tipado correcto
    sign(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        return jwt.sign(payload, config.JWT_SECRET as jwt.Secret, {
            expiresIn: config.JWT_EXPIRES_IN,
        })
    },

    // Verificar token con tipado correcto
    verify(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.JWT_SECRET as jwt.Secret) as JWTPayload
        } catch (error) {
            throw new AppError('Invalid or expired token', 401)
        }
    }
}