/**
 * Save the Date Preview Dispatcher: MOVE YUH RASŚ
 * 
 * Usage:
 *   npx tsx scripts/send-save-the-date-preview.ts --to test@example.com
 *   npx tsx scripts/send-save-the-date-preview.ts --to info@savgent.com --send
 */

import 'dotenv/config';
import { sendEmail } from '../server/email-provider';

export function getSaveTheDateHtml(recipientName: string = 'Soca Family') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Save the Date: MOVE YUH RASŚ | Savage Gentlemen</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #070707; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .gold-gradient {
      background: linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #AA771C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070707; color: #E5E5E5;">

  <!-- Preheader text (Visible in inbox preview pane) -->
  <div style="display: none; font-size: 1px; color: #070707; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    🔥 Sneak Peek: MOVE YUH RASŚ hits NYC/NJ Thanksgiving Weekend (Nov 27) + Major SavGent.com upgrades now live!
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070707;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; background-color: #0F0F0F; border: 1px solid #222222; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.8);">
          
          <!-- Top Brand Header Bar -->
          <tr>
            <td align="center" style="padding: 28px 24px 20px; background: linear-gradient(180deg, #181818 0%, #0F0F0F 100%); border-bottom: 1px solid #1F1F1F;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://sgxmedia.com/logo.png" alt="Savage Gentlemen" width="170" style="display: block; width: 170px; max-width: 100%; height: auto; filter: drop-shadow(0 4px 12px rgba(212,175,55,0.2));">
                    <div style="margin-top: 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #D4AF37; font-weight: 600;">
                      The Caribbean Luxury Experience
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Exclusive Sneak Preview Ribbon -->
          <tr>
            <td align="center" style="padding: 12px 20px; background: linear-gradient(90deg, #7F1D1D 0%, #B91C1C 50%, #991B1B 100%);">
              <span style="font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF;">
                ⚡ VIP SNEAK PREVIEW &bull; SUBSCRIBER EXCLUSIVE ⚡
              </span>
            </td>
          </tr>

          <!-- Hero Event Flyer Section -->
          <tr>
            <td align="center" style="padding: 0; background-color: #000000;">
              <a href="https://www.savgent.com/events" target="_blank" style="text-decoration: none; display: block;">
                <img src="https://www.savgent.com/images/move_yuh_rass_teaser_4x5_perfect.jpg" alt="MOVE YUH RASŚ - Save The Date Nov 27" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Intro & Save The Date Announcement -->
          <tr>
            <td style="padding: 36px 32px 24px;" class="mobile-padding">
              <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; color: #D4AF37; margin-bottom: 8px;">
                SAVE THE DATE &bull; THANKSGIVING WEEKEND
              </div>
              <h1 style="margin: 0 0 16px; font-size: 32px; line-height: 1.15; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px;">
                MOVE YUH RASŚ <span style="color: #EF4444;">🔥</span>
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
                Wah gwan, <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #9CA3AF;">
                When de bass rumble and de riddim take over, yuh have no choice but to move. Savage Gentlemen presents <strong style="color: #FFFFFF;">MOVE YUH RASŚ</strong> — an unapologetic explosion of authentic Caribbean energy, sound, and pride right on the waterfront.
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #9CA3AF;">
                We're bringing non-stop Soca, raw Dancehall heat, and infectious Afrobeats commanded by top-tier island selectors. Grab yuh team, hoist yuh flag high, and lock this date into your calendar before public drops.
              </p>
            </td>
          </tr>

          <!-- Event Details Breakdown Card -->
          <tr>
            <td style="padding: 0 32px 28px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #161616 0%, #111111 100%); border: 1px solid #2A2A2A; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 16px;">
                      📍 Event Intel at a Glance
                    </div>
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">📅 Date:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          Friday, November 27, 2026
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">⏰ Time:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          10:00 PM &ndash; 2:30 AM EST
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🏢 Venue:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          The Ainsworth (Hoboken, NJ)
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🎟️ Tickets Drop:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #D4AF37; font-weight: 700;">
                          Friday, Oct 16 @ 12:00 PM EST
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🛂 Soca Passport:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0; font-size: 14px; color: #10B981; font-weight: 700;">
                          +75 to +250 Loyalty Credits
                        </td>
                      </tr>
                    </table>

                    <!-- Tiers Highlights -->
                    <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed #333333; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
                      ✨ <strong style="color: #E5E5E5;">Tier Offerings:</strong> $20 Early Bird (Limited 50 slots) &bull; $30 GA &bull; $40 Late Release &bull; Solo & Duo VIP Table Packages ($250 & $400 with premium bottles & skip-line entry).
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 50px; background: linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%); box-shadow: 0 6px 20px rgba(212,175,55,0.4);">
                    <a href="https://www.savgent.com/events" target="_blank" class="btn" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #000000; text-decoration: none; border-radius: 50px;">
                      🔥 VIEW EVENT & GET EARLY ACCESS &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #2A2A2A 50%, transparent 100%);"></div>
            </td>
          </tr>

          <!-- What's New on SavGent.com Section -->
          <tr>
            <td style="padding: 32px 32px 20px;" class="mobile-padding">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 6px;">
                PLATFORM EVOLUTION
              </div>
              <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">
                What's New on SavGent.com 🚀
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
                We’ve rolled out high-performance upgrades across the entire platform to elevate your carnival and fete experience:
              </p>

              <!-- Feature 1: Soca Passport -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; background: #141414; border: 1px solid #222222; border-radius: 10px;">
                <tr>
                  <td width="54" valign="top" style="padding: 16px 0 16px 16px; font-size: 24px;">
                    🛂
                  </td>
                  <td valign="top" style="padding: 16px 16px 16px 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      Soca Passport Loyalty System
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #9CA3AF;">
                      Earn credits on every event check-in and ticket purchase. Progress through 4 tiers (Bronze &rarr; Silver &rarr; Gold &rarr; Elite) and unlock VIP perks, secret discounts, and fete badges.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Feature 2: High-Def Streaming & Audio -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; background: #141414; border: 1px solid #222222; border-radius: 10px;">
                <tr>
                  <td width="54" valign="top" style="padding: 16px 0 16px 16px; font-size: 24px;">
                    🎧
                  </td>
                  <td valign="top" style="padding: 16px 16px 16px 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      Instant Audio & Video Streaming
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #9CA3AF;">
                      Experience native 206 byte-range audio streaming with zero lag. Listen to curated Caribbean soundclashes, live mixes, and background video previews directly in your browser.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Feature 3: Streetwear & Merch Catalog -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; background: #141414; border: 1px solid #222222; border-radius: 10px;">
                <tr>
                  <td width="54" valign="top" style="padding: 16px 0 16px 16px; font-size: 24px;">
                    👑
                  </td>
                  <td valign="top" style="padding: 16px 16px 16px 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      Luxury Caribbean Streetwear Drops
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #9CA3AF;">
                      Browse our updated storefront featuring satin flag bandanas, metallic embroidered snapbacks, and full-bleed designer carnival jerseys made for the road.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Feature 4: Fast QR Gate Check-ins -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #141414; border: 1px solid #222222; border-radius: 10px;">
                <tr>
                  <td width="54" valign="top" style="padding: 16px 0 16px 16px; font-size: 24px;">
                    ⚡
                  </td>
                  <td valign="top" style="padding: 16px 16px 16px 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      Instant Digital QR Tickets
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #9CA3AF;">
                      Your tickets now come delivered directly to your inbox with high-contrast dynamic QR codes for instant, zero-delay door scanning with haptic check-in feedback.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Secondary CTA -->
          <tr>
            <td align="center" style="padding: 12px 32px 36px;" class="mobile-padding">
              <a href="https://www.savgent.com" target="_blank" style="display: inline-block; font-size: 14px; font-weight: 700; color: #D4AF37; text-decoration: none; border-bottom: 1px solid #D4AF37; padding-bottom: 2px;">
                Explore All Features at www.savgent.com &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 24px; background-color: #080808; border-top: 1px solid #1A1A1A; text-align: center;">
              
              <!-- Social Links -->
              <div style="margin-bottom: 18px;">
                <a href="https://instagram.com/savagegentlemen_" target="_blank" style="margin: 0 10px; font-size: 13px; color: #D4AF37; text-decoration: none; font-weight: 600;">Instagram</a>
                <span style="color: #444;">&bull;</span>
                <a href="https://www.savgent.com" target="_blank" style="margin: 0 10px; font-size: 13px; color: #D4AF37; text-decoration: none; font-weight: 600;">Website</a>
                <span style="color: #444;">&bull;</span>
                <a href="mailto:info@savgent.com" style="margin: 0 10px; font-size: 13px; color: #D4AF37; text-decoration: none; font-weight: 600;">Contact Us</a>
              </div>

              <p style="margin: 0 0 10px; font-size: 12px; line-height: 1.5; color: #666666;">
                You are receiving this email because you are a registered member of Savage Gentlemen or attended a previous event.
              </p>
              
              <p style="margin: 0; font-size: 12px; color: #4B5563;">
                &copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.<br>
                Hoboken &bull; NYC &bull; Worldwide Caribbean Culture
              </p>
            </td>
          </tr>

        </table>
        <!-- End Container -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

async function run() {
  const args = process.argv.slice(2);
  const toIndex = args.indexOf('--to');
  const targetEmail = toIndex !== -1 ? args[toIndex + 1] : 'info@savgent.com';
  const shouldSend = args.includes('--send');

  console.log('========================================================');
  console.log('🔥 SAVE THE DATE TEMPLATE: MOVE YUH RASŚ');
  console.log(`Target: ${targetEmail}`);
  console.log(`Mode: ${shouldSend ? 'LIVE DISPATCH' : 'DRY RUN (preview only)'}`);
  console.log('========================================================\n');

  const html = getSaveTheDateHtml('Soca Family');

  if (shouldSend) {
    console.log(`Sending email via active provider...`);
    const success = await sendEmail({
      to: targetEmail,
      subject: '🔥 SNEAK PEEK: MOVE YUH RASŚ (Nov 27) + Major Platform Upgrades!',
      html,
    });
    console.log(`Result: ${success ? '✅ SUCCESS: Email dispatched!' : '❌ FAILED: Check SMTP config'}`);
  } else {
    console.log('Preview HTML generated successfully (' + html.length + ' bytes).');
    console.log('To send a live test to your inbox, run:');
    console.log(`  npx tsx scripts/send-save-the-date-preview.ts --to ${targetEmail} --send\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
