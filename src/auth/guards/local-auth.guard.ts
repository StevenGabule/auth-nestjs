/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
   // This guard triggers the LocalStrategy's validate method
   // If validate succeeds, it attaches user to request and allows access
   // If validate throws an error (e.g., UnauthorizedException), it denies access
}
