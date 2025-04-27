/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Delete,
  UseGuards,
  NotFoundException,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  /**
   * GET /user/profile
   * Retrieves the profile of the currently authenticated user.
   * Requires a valid JWT token.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<UserProfileDto> {
    const userId = req.user.userId;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  /**
   * DELETE /user/account
   * Deletes the account of the currently authenticated user.
   * Requires a valid JWT token.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: RequestWithUser): Promise<void> {
    const userId = req.user.userId;
    await this.userService.deleteUser(userId);
  }
}
