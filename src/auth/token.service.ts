/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generates a JWT access token for a user.
   * @param user - The user object.
   * @returns The generated JWT string.
   */
  generateAccessToken(user: User): string {
    const payload = { email: user.email, sub: user.id, name: user.name };
    return this.jwtService.sign(payload);
  }

  /**
   * Generates a secure random token string for password reset.
   * @param length - The desired length of the token (default 32 bytes -> 64 hex chars).
   * @returns A random hexadecimal string.
   */
  generateSecureRandomToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }
}
