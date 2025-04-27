/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
	@IsNotEmpty({message: 'Email is required.'})
	@IsEmail({}, {message: 'Please provide a valid email address.'})
	email: string;

	@IsNotEmpty({message: 'Password is required.'})
	@IsString({message: 'Password must be a string.'})
	password: string;
}


