/**
 * IslandLyric.bot — Email Templates
 * Uses the existing Brevo SMTP email infrastructure.
 */

import { sendEmail } from './email-brevo';

/**
 * Send the completed lyric video download link to the customer.
 */
export async function sendLyricVideoEmail(
  recipientEmail: string,
  songName: string,
  downloadUrl: string
): Promise<boolean> {
  const subject = `🎶 Your Lyric Video is Ready! — ${songName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Lyric Video is Ready</title>
    </head>
    <body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a0a 0%,#0a1a0a 100%); border-radius:16px; overflow:hidden; border:1px solid rgba(255,215,0,0.2);">
              
              <!-- Header -->
              <tr>
                <td style="padding:40px 40px 20px; text-align:center;">
                  <div style="font-size:48px; margin-bottom:16px;">🎶</div>
                  <h1 style="color:#FFD700; font-size:28px; margin:0 0 8px; letter-spacing:2px;">YOUR VIDEO IS READY</h1>
                  <p style="color:#999; font-size:14px; margin:0; letter-spacing:1px;">IslandLyric.bot</p>
                </td>
              </tr>

              <!-- Song Name -->
              <tr>
                <td style="padding:0 40px 30px; text-align:center;">
                  <div style="background:rgba(255,215,0,0.08); border:1px solid rgba(255,215,0,0.15); border-radius:12px; padding:20px;">
                    <p style="color:#aaa; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin:0 0 8px;">Song</p>
                    <p style="color:#fff; font-size:20px; font-weight:bold; margin:0;">${songName}</p>
                  </div>
                </td>
              </tr>

              <!-- Download Button -->
              <tr>
                <td style="padding:0 40px 30px; text-align:center;">
                  <a href="${downloadUrl}" 
                     style="display:inline-block; background:linear-gradient(135deg,#FFD700,#FFA500); color:#000; font-weight:bold; font-size:18px; padding:16px 48px; border-radius:50px; text-decoration:none; letter-spacing:1px;">
                    ⬇ DOWNLOAD VIDEO
                  </a>
                  <p style="color:#666; font-size:12px; margin-top:12px;">
                    Link expires in 7 days. Download and save your video.
                  </p>
                </td>
              </tr>

              <!-- Upsell -->
              <tr>
                <td style="padding:0 40px 30px;">
                  <div style="background:rgba(0,168,107,0.08); border:1px solid rgba(0,168,107,0.2); border-radius:12px; padding:24px; text-align:center;">
                    <p style="color:#00A86B; font-size:16px; font-weight:bold; margin:0 0 8px;">✨ Want 4K + No Watermark?</p>
                    <p style="color:#999; font-size:14px; margin:0 0 16px;">Upgrade your video for just $10 more.</p>
                    <p style="color:#666; font-size:13px; margin:0;">Reply to this email to upgrade.</p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px 30px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
                  <p style="color:#555; font-size:12px; margin:0;">
                    Made with ❤️ by <a href="https://www.savgent.com" style="color:#FFD700; text-decoration:none;">Savage Gentlemen</a>
                  </p>
                  <p style="color:#444; font-size:11px; margin:8px 0 0;">
                    Questions? Reply to this email or contact info@savgent.com
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`[IslandLyric] Video email ${result ? 'sent' : 'FAILED'} to ${recipientEmail}`);
    return result;
  } catch (error) {
    console.error('[IslandLyric] Failed to send video email:', error);
    return false;
  }
}

/**
 * Send an error notification to the customer when video generation fails.
 */
export async function sendLyricErrorEmail(
  recipientEmail: string,
  songName: string
): Promise<boolean> {
  const subject = `⚠️ Issue with your Lyric Video — ${songName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:0; background:#0a0a0a; font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a; padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a; border-radius:16px; overflow:hidden; border:1px solid rgba(255,100,100,0.2);">
              <tr>
                <td style="padding:40px; text-align:center;">
                  <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
                  <h1 style="color:#ff6b6b; font-size:24px; margin:0 0 16px;">Video Generation Issue</h1>
                  <p style="color:#ccc; font-size:16px; line-height:1.6; margin:0 0 20px;">
                    We encountered an issue generating your lyric video for <strong>"${songName}"</strong>.
                    Our team has been notified and a full refund will be processed within 24 hours.
                  </p>
                  <p style="color:#999; font-size:14px; margin:0;">
                    We apologize for the inconvenience. Feel free to try again or reply to this email for support.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 30px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
                  <p style="color:#555; font-size:12px; margin:0;">IslandLyric.bot by <a href="https://www.savgent.com" style="color:#FFD700; text-decoration:none;">Savage Gentlemen</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    return await sendEmail({ to: recipientEmail, subject, html });
  } catch (error) {
    console.error('[IslandLyric] Failed to send error email:', error);
    return false;
  }
}
