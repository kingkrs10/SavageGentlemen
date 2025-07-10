# MailerSend Domain Configuration Fix

## Issue Identified
When adding a domain to MailerSend, you're getting "Domain name is not valid" error.

## Solution
Remove the "https://" prefix from the domain name. Enter only: `savgent.com` or `www.savgent.com`

**Incorrect**: `https://www.savgent.com`
**Correct**: `www.savgent.com` or `savgent.com`

## Alternative: Use Brevo Instead
Since MailerSend has trial limitations anyway, I recommend switching to Brevo which:
- Has no trial restrictions
- Offers 300 emails/day free
- Doesn't require domain verification for basic sending

## Brevo Setup Instructions
1. Go to brevo.com
2. Sign up for free account
3. Go to SMTP & API settings
4. Get your SMTP credentials
5. Use them in the email system

This will bypass both the domain verification and trial account limitations.