# Alternative Email Service Setup Guide

## Available Email Providers

I've configured three email service alternatives to replace SendGrid:

### 1. MailerSend (Recommended)
- **Free Tier**: 3,000 emails/month
- **Cost**: $1 per 1,000 emails after free tier
- **Setup**: Fastest and most generous free tier

### 2. Brevo (formerly Sendinblue)
- **Free Tier**: 300 emails/day (9,000/month)
- **Cost**: $15/month for 10,000 emails
- **Setup**: All-in-one platform with marketing features

### 3. SendGrid (Fallback)
- **Current**: Blocked by credit limits
- **Keep**: For when account is upgraded

## Quick Setup Instructions

### Option A: MailerSend (Recommended)

1. **Sign up**: Go to [mailersend.com](https://mailersend.com)
2. **Create account**: Free registration
3. **Get SMTP credentials**:
   - Username: Your MailerSend username
   - Password: Your MailerSend password
   - SMTP Host: smtp.mailersend.net
   - Port: 587

4. **Add environment variables**:
   ```bash
   MAILERSEND_SMTP_USERNAME=your_username
   MAILERSEND_SMTP_PASSWORD=your_password
   MAILERSEND_FROM_EMAIL=tickets@savgent.com
   EMAIL_PROVIDER=mailersend
   ```

### Option B: Brevo (Alternative)

1. **Sign up**: Go to [brevo.com](https://brevo.com)
2. **Create account**: Free registration
3. **Get SMTP credentials**:
   - Login: Your Brevo email
   - SMTP Key: Generate in account settings
   - SMTP Host: smtp-relay.brevo.com
   - Port: 587

4. **Add environment variables**:
   ```bash
   BREVO_SMTP_LOGIN=your_email
   BREVO_SMTP_KEY=your_smtp_key
   BREVO_FROM_EMAIL=tickets@savgent.com
   EMAIL_PROVIDER=brevo
   ```

## Environment Variables Setup

Add these to your Replit secrets:

```
EMAIL_PROVIDER=mailersend
MAILERSEND_SMTP_USERNAME=your_username
MAILERSEND_SMTP_PASSWORD=your_password
MAILERSEND_FROM_EMAIL=tickets@savgent.com
```

## Testing the New Email Service

After setup, test with:
```bash
npx tsx test-alternative-email.mjs
```

## Sending the Free Tickets

Once configured, send all 16 free tickets:
```bash
npx tsx resend-rhythm-riddim-free-tickets-alternative.mjs
```

## Automatic Provider Switching

The system will automatically:
1. Try the configured provider first
2. Fall back to other providers if the first fails
3. Find the first working provider automatically

## Benefits of New Setup

- **No credit limits**: Fresh accounts with full quotas
- **Better pricing**: More emails for less cost
- **Faster setup**: No DNS configuration required
- **Backup options**: Multiple providers for reliability

## Next Steps

1. Choose your preferred provider (MailerSend recommended)
2. Sign up for the service
3. Add the environment variables to Replit
4. Test the connection
5. Send the 16 free tickets immediately

The system is ready to send emails as soon as you provide the credentials!