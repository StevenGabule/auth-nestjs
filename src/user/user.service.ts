/* eslint-disable prettier/prettier */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async createUser(data: {email: string, password?: string, name?: string, googleId?: string}): Promise<User> {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword || '',
        name: data.name || '',
        googleId: data.googleId || '',
      },
    });
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    if(!user) {
      throw new Error('User not found');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new NotFoundException(`User with id ${userId} not found`);
        }
      }
      throw error;
    }
  }

  async findOrCreateFromGoogle(profile: {id: string, emails: {value: string}[], displayName: string}): Promise<User> {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    if(!email) {
      throw new Error('Email not provided by Google profile.');
    }

    let user = await this.findByGoogleId(googleId);
    if(user) {
      return user;
    }

    user = await this.findByEmail(email);
    if(user) {
      throw new ConflictException('A user with this email already exists. Please log in traditionally or link your Google account.');
    }

    return this.createUser({email, name, googleId});
  }
}
