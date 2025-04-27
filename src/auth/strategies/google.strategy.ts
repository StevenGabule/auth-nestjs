/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Profile,
  Strategy as GoogleStrategyVendor,
  VerifyCallback,
} from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  GoogleStrategyVendor,
  'google',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Called by Passport after successful authentication with Google.
   * @param accessToken - Google Access Token (rarely needed directly).
   * @param refreshToken - Google Refresh Token (store securely if long-term access needed).
   * @param profile - User profile information from Google.
   * @param done - Callback function to pass control back to Passport.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log('Google Profile:', profile);
    try {
      // Use AuthService to find or create the user based on the Google profile
      // The AuthService.handleGoogleLogin method will encapsulate this logic
      // We just need to pass the profile data
      // Note: We don't call handleGoogleLogin directly here. Passport expects us to call `done`.
      // The user object returned by `findOrCreateFromGoogle` will be passed via `done`.
      const user =
        await this.authService.userService.findOrCreateFromGoogle(profile);

      // Pass the user object to Passport. This will be available in the request handler (req.user)
      // for the route guarded by AuthGuard('google')

      done(null, user);
    } catch (error) {
			// Handle errors during user lookup/creation
			console.error("Error during Google validation:", error);
			done(error, false); // Signal an error to Passport
    }
  }
}
