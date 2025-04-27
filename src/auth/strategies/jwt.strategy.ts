/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from 'src/user/user.service';

interface JwtPayload {
	sub: string;
	email: string;
	name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly userService: UserService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET')!,
		});
	}

	/**
   * Validates the JWT payload.
   * Called by Passport after verifying the token signature and expiration.
   * @param payload - The decoded JWT payload.
   * @returns The user object or necessary payload data to attach to the request.
   * @throws UnauthorizedException if user not found or token is invalid.
   */
	async validate(payload: JwtPayload) {
		const user = await this.userService.findById(payload.sub);
		if(!user) {
			throw new UnauthorizedException('User associated with token not found.');
		}

		return {
			userId: payload.sub,
			email: payload.email,
			name: payload.name
		}
	}
	
}