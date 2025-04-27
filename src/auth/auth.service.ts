/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// import { EmailService } from 'src/email/email.service';
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    // private readonly emailService: EmailService,
  ) {}

  /**
   * Validates a user based on email and password.
   * Used by the LocalStrategy.
   * @param email - User's email.
   * @param pass - User's plain text password.
   * @returns The user object without the password if valid, otherwise null.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * Handles user login after validation.
   * Generates a JWT token.
   * @param user - The validated user object (without password).
   * @returns An object containing the access token and user info.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: Omit<User, 'password'>): Promise<AuthResponseDto> {
    const accessToken = this.tokenService.generateAccessToken(user as User);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Registers a new user.
   * @param registerUserDto - DTO containing registration data.
   * @returns An object containing the access token and user info.
   * @throws ConflictException if email is already taken.
   * @throws InternalServerErrorException on database error.
   */
  async register(registerUserDto: RegisterUserDto): Promise<AuthResponseDto> {
    const { name, password, email } = registerUserDto;

    // check if the user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in already registered.');
    }

    try {
      const newUser = await this.userService.createUser({
        email,
        name,
        password,
      });
      return this.login(newUser);
    } catch (error) {
      console.error('Register error: ', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'email') {
          throw new ConflictException('Email already in already registered.');
        }
      }
      throw new InternalServerErrorException('Failed to register user.');
    }
  }

  /**
   * Initiates the password reset process.
   * Generates a reset token, saves it, and sends a reset email.
   * @param email - The email of the user requesting the reset.
   * @throws NotFoundException if the email doesn't belong to any user.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.warn('Password reset requested for non-existent email:', email);
      return;
    }

    const resetToken = this.tokenService.generateSecureRandomToken();
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log(
      `Password Reset Email Sent (simulation): To ${email}, URL: ${resetUrl}`,
    );
  }

  /**
   * Resets the user's password using a valid reset token.
   * @param token - The password reset token.
   * @param newPassword - The new password to set.
   * @throws BadRequestException if the token is invalid or expired.
   * @throws NotFoundException if the token is valid but the user doesn't exist.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const passwordResetRecord = await this.prisma.passwordResetToken.findUnique(
      {
        where: { token },
        include: {
          user: true,
        },
      },
    );

    if (!passwordResetRecord || passwordResetRecord.expiresAt < new Date()) {
      if (passwordResetRecord) {
        await this.prisma.passwordResetToken.delete({
          where: { id: passwordResetRecord.id },
        });
      }
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const userId = passwordResetRecord.userId;
    try {
      await this.userService.updateUserPassword(userId, newPassword);

      await this.prisma.passwordResetToken.delete({
        where: { id: passwordResetRecord.id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found.');
      }
      console.error('Error resetting password:', error);
      throw new InternalServerErrorException('Failed to reset password.');
    }
  }

  /**
   * Handles Google OAuth login/registration.
   * @param userProfile - Profile information returned by Google strategy.
   * @returns An object containing the access token and user info.
   */
  async handleGoogleLogin(userProfile: any): Promise<AuthResponseDto> {
    try {
      const user = await this.userService.findOrCreateFromGoogle(userProfile);
      return this.login(user);
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to handle Google login.');
    }
  }
  
  /**
   * Logs out a user.
   * @returns A message indicating the user has been logged out.
   */
  logout() {
    return 'Logged out successfully';
  }
}
