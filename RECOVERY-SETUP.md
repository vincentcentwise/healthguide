# HealthGuide Password Recovery Setup

## Files

Copy these files into the matching locations in the HealthGuide project:

- `forgot-password.html`
- `reset-password.html`
- `js/forgot-password.js`
- `js/reset-password.js`

The scripts expect your existing `js/supabase.js` to export `supabase`.

## Supabase URL configuration

In Supabase Authentication → URL Configuration, add the deployed reset page to the allowed Redirect URLs.

Example:

`https://YOUR-DOMAIN/reset-password.html`

For local development, also add the exact local URL you use, for example:

`http://localhost:5500/reset-password.html`

Use the actual port used by your local server.

## Login page

Make the existing "Forgot password?" link point to:

`./forgot-password.html`

If the login page supports a `reset=success` query parameter, display a small confirmation message when the user returns after a successful reset.

## Security behavior

The forgot-password page intentionally does not reveal whether an email address belongs to a HealthGuide account. This prevents account enumeration.

The reset page requires a valid Supabase recovery session before showing the password form.

Never place the Supabase service-role key in frontend JavaScript.

## Forgot email

Supabase can securely reset a password when the user knows the account email, but the application should not expose or guess a user's email address. If HealthGuide later needs a "Forgot email?" feature, implement it as an account-recovery/support workflow rather than an email-enumeration endpoint.
