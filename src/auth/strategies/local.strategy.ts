/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }
  /**
   * Validates the user based on email and password provided during login.
   * @param email - The email submitted by the user.
   * @param password - The password submitted by the user.
   * @returns The validated user object (without password).
   * @throws UnauthorizedException if validation fails.
   */
  async validate(email: string, password: string): Promise<any> {
		const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
