/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsNotEmpty({ message: 'Password is required.'})
  @IsString({message: 'Password must be a string.'})
  @MinLength(8, {message: 'Password must be at least 8 characters long.'})
  password: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string.' })
	@IsNotEmpty({message: 'Name is required.'})
  name?: string;
}
