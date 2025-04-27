/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@prisma/client';

interface RequestWithUser {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * POST /auth/register
   * Registers a new user.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Return 201 Created on success
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerUserDto);
  }

  /**
   * POST /auth/login
   * Logs in a user using email and password.
   * Uses the LocalAuthGuard to trigger the LocalStrategy.
   */
  @UseGuards(LocalAuthGuard) // Apply the LocalAuthGuard
  @Post('login')
  @HttpCode(HttpStatus.OK) // Return 200 OK on success
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }
  /**
   * GET /auth/google
   * Initiates the Google OAuth2 authentication flow.
   * Redirects the user to Google's consent screen.
   */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    // Guard initiates the Google OAuth2 flow
    // No specific logic needed here, Passport handles the redirect
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    HttpStatus.OK; // Indicate the start of the flow
  }

  /**
   * GET /auth/google/callback
   * Callback URL for Google OAuth2. Google redirects here after user grants permission.
   * The GoogleOAuthGuard processes the callback, calls GoogleStrategy.validate,
   * which in turn calls AuthService.handleGoogleLogin.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: RequestWithUser, @Res() res: Response) {
    // If GoogleOAuthGuard passes, req.user contains the user object from GoogleStrategy.validate
    // We now need to generate our application's JWT for this user
    const authResponse = await this.authService.login(req.user); // Generate JWT

    // Redirect user to the frontend, potentially passing the token
    // Option 1: Redirect with token in query parameter (less secure)
    // res.redirect(`YOUR_FRONTEND_LOGIN_SUCCESS_URL?token=${authResponse.accessToken}`);

    // Option 2: Redirect and have frontend fetch token via another mechanism (e.g., cookie, dedicated endpoint)
    // Set HttpOnly cookie (more secure)
    res.cookie('accessToken', authResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // Or 'strict' depending on your needs
      path: '/',
      expires: new Date(Date.now() + 3600000),
    });

    res.redirect('YOUR_FRONTEND_DASHBOARD_URL'); // Redirect to dashboard or logged-in area

    // Option 3: Return token in response body (if frontend makes AJAX call to this endpoint)
    // return authResponse; // This might not work well with browser redirects
  }

  /**
   * POST /auth/logout
   * Logs out the user. (Implementation depends on strategy)
   */
  @UseGuards(JwtAuthGuard) // Requires user to be logged in to log out
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content
  logout() {
    // For basic JWT, server-side logout isn't strictly necessary.
    // Client should discard the token.
    // If implementing token blacklisting or refresh tokens, add logic here.
    this.authService.logout();
  }

  /**
   * POST /auth/forgot-password
   * Initiates the password reset process for a given email.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // Return 200 OK even if email not found (security)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    // Return a generic success message regardless of whether the email existed
    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * PATCH /auth/reset-password
   * Resets the password using a token provided via DTO.
   */
  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password has been successfully reset.' };
  }

  // Note: Profile endpoint is moved to UserController
  // Note: Delete Account endpoint is moved to UserController
}
