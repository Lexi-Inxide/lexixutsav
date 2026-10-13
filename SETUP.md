# Google and phone sign-in

The site uses Supabase Auth. It supports Google OAuth, phone-number SMS codes, and the existing email/password option. The wallet and payment features are intentionally disabled.

## Connect your Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In **Project Settings → API**, copy the **Project URL** and the **anon/public key**.
3. Put those public values in [`config.js`](./config.js):

   ```js
   window.STORE_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
   };
   ```

   Only use the anon/public key in this browser file. Never put a service-role or secret key in frontend code.
4. In Supabase **Authentication → URL Configuration**, set your deployed website as the Site URL and add it to the allowed redirect URLs. For local testing, add the local development URL too.

## Enable Google

1. In Google Cloud Console, create an OAuth client of type **Web application**.
2. Copy the Supabase callback URL shown in **Supabase → Authentication → Providers → Google** into Google's **Authorized redirect URIs**. It looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
3. Copy the Google client ID and client secret into the Supabase Google provider settings, enable the provider, and save.
4. Test the Register and Login screens from the deployed HTTPS site. Google OAuth will create an account on the first sign-in and sign in existing users afterward.

## Enable phone registration and login

1. In **Supabase → Authentication → Providers → Phone**, enable phone authentication and SMS.
2. Configure an SMS provider (for example Twilio) with the credentials supplied by that provider. Configure its sender/brand and delivery settings for the countries you plan to support.
3. Review Supabase's OTP expiry and rate limits, and check the SMS provider's pricing and destination-country rules.
4. In the site's Phone tab, enter a phone number in international E.164 format, including `+` and country code (for example `+9779812345678`). Request the SMS code, then enter it to register or log in.

Without an SMS provider configured in Supabase, the phone form can be used visually but will return a provider configuration error instead of sending a real text.

## Test and deploy

Open the account section on your deployed site and test both providers. Opening `index.html` directly as a `file://` URL is not suitable for OAuth redirects; use your HTTPS deployment or a local web server whose URL is allowed by Supabase. No payment, wallet balance, or top-up operation is active in this version.
