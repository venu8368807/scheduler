// lib/google.ts
import { google } from "googleapis";

export function oauthClientFromRefreshToken(refreshToken: string) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

// helper to get calendar instance (auto-refreshes using the refresh token)
export function calendarClientFromRefreshToken(refreshToken: string) {
  const auth = oauthClientFromRefreshToken(refreshToken);
  return google.calendar({ version: "v3", auth });
}

// OAuth client from an access token (no refresh). Useful for buyer's session access token.
export function oauthClientFromAccessToken(accessToken: string) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ access_token: accessToken });
  return oAuth2Client;
}