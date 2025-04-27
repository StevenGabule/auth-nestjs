/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  // This guard initiates the Google OAuth flow when the associated route is accessed.
  // Upon successful authentication with Google and callback, it triggers the GoogleStrategy's validate method.
}