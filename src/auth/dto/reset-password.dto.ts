/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
	@IsNotEmpty({message: 'Password is required.'})
	@IsString()
	token: string;
	
	@IsNotEmpty({message: 'Password is required.'})
	@IsString({message: 'Password must be a string.'})
	@MinLength(8, {message: 'Password must be at least 8 characters long.'})
	newPassword: string;
}
