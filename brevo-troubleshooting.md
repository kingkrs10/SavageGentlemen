# Brevo Email Authentication Troubleshooting

## Current Issue
Authentication failed with error: "535 5.7.8 Authentication failed"

## Possible Causes & Solutions

### 1. Email Address Mismatch
The login email might not match your Brevo account registration.

**Solution:**
- Check what email you used to sign up for Brevo
- Use that exact email as the SMTP login username
- Current attempt: `info@savgent.com`

### 2. SMTP Key Issues
The SMTP key might be:
- Expired
- Copied incorrectly
- Not properly activated

**Solution:**
- Go to Brevo → SMTP & API
- Delete the current SMTP key
- Generate a new SMTP key
- Copy it immediately (it's only shown once)

### 3. Account Verification
Your Brevo account might need verification.

**Solution:**
- Check your email for verification messages
- Complete account verification if required
- Ensure account is active

### 4. Alternative Configuration
Try different port or security settings.

**Current settings:**
- Host: smtp-relay.brevo.com
- Port: 587 (TLS)
- Username: info@savgent.com
- Password: ZmKA8246OLSjhGOO

**Alternative settings to try:**
- Port: 465 (SSL)
- Port: 2525 (Alternative)

## Next Steps
1. **Verify your Brevo login email** - what email did you use to register?
2. **Regenerate SMTP key** - create a fresh one
3. **Check account status** - ensure it's verified and active

## Immediate Solution
While fixing email authentication, use the manual ticket distribution tool:
- `ticket-distribution-immediate.html`
- Generates QR codes for all 3 free tickets
- Ready for WhatsApp/SMS distribution

## Test Command
Once you provide the correct email and new SMTP key:
```bash
EMAIL_PROVIDER=brevo BREVO_SMTP_LOGIN="[YOUR_EMAIL]" BREVO_SMTP_KEY="[NEW_KEY]" npx tsx test-alternative-email.mjs
```