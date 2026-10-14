/**
 * Member Announcement: 20 Free Passes Live for MOVE YUH RASS
 * 
 * Delivers exclusive first-access notification to registered members informing them
 * that 20 complimentary unisex passes are currently live, and once claimed,
 * Early Bird pricing ($20 Female / $25 Male) auto-activates.
 * 
 * Usage:
 *   npx tsx scripts/send-free-tickets-member-announcement.ts --preview
 *   npx tsx scripts/send-free-tickets-member-announcement.ts --to test@example.com
 *   npx tsx scripts/send-free-tickets-member-announcement.ts --live
 *   npx tsx scripts/send-free-tickets-member-announcement.ts --live --limit=10
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';
import { sendEmail } from '../server/email-provider';

export function getFreeTicketsEmailHtml(recipientName: string = 'Soca Family') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>First Access: 20 Free Passes Live for MOVE YUH RASS | Savage Gentlemen</title>
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
    🔥 Registered Member Exclusive: 20 Complimentary Unisex Passes just unlocked for MOVE YUH RASS (Nov 27 @ The Ainsworth). Claim yours before Early Bird activates!
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070707;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; background-color: #0F0F0F; border: 1px solid #222222; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
          
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

          <!-- Exclusive Member Access Ribbon -->
          <tr>
            <td align="center" style="padding: 14px 20px; background: linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #B45309 100%);">
              <span style="font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #000000;">
                ⚡ REGISTERED MEMBERS ONLY &bull; FIRST PRIORITY ACCESS ⚡
              </span>
            </td>
          </tr>

          <!-- Hero Flyer Image -->
          <tr>
            <td align="center" style="padding: 0; background-color: #000000;">
              <a href="https://www.savgent.com/events/4" target="_blank" style="text-decoration: none; display: block;">
                <img src="https://www.savgent.com/images/early_bird_official_9x16.jpg" alt="MOVE YUH RASS - Nov 27 @ The Ainsworth" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Main Announcement Body -->
          <tr>
            <td style="padding: 36px 32px 24px;" class="mobile-padding">
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #D4AF37; margin-bottom: 8px;">
                PRIORITY DROP &bull; THANKSGIVING WEEKEND
              </div>
              <h1 style="margin: 0 0 16px; font-size: 32px; line-height: 1.15; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px;">
                MOVE YUH RASS <span style="color: #EF4444;">🔥</span>
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                Wah gwan, <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #9CA3AF;">
                Because you are a registered member of the Savage Gentlemen community, you get <strong style="color: #FFFFFF;">exclusive first-access</strong> before the general public.
              </p>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #9CA3AF;">
                We have just unlocked <strong style="color: #F59E0B;">20 Complimentary Unisex Passes ($0)</strong> to our flagship Thanksgiving weekend fete: <strong style="color: #FFFFFF;">MOVE YUH RASS</strong>, taking over the waterfront at <strong style="color: #FFFFFF;">The Ainsworth in Hoboken</strong> on <strong style="color: #FFFFFF;">Friday, November 27, 2026</strong>.
              </p>

              <!-- Urgent Tier Progression Rule Callout -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: linear-gradient(135deg, #1C1917 0%, #171513 100%); border-left: 4px solid #F59E0B; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #F59E0B; margin-bottom: 6px;">
                      ⚡ How the Drop Works:
                    </div>
                    <div style="font-size: 14px; line-height: 1.6; color: #D1D5DB;">
                      There are strictly <strong style="color: #FFFFFF;">20 free passes</strong> in the vault. The moment pass #20 is claimed, our ticketing engine will <strong style="color: #FFFFFF;">immediately lock the free tier and auto-activate Early Bird pricing</strong> ($20 Female / $25 Male).
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Primary Call To Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 50px; background: linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%); box-shadow: 0 8px 25px rgba(212,175,55,0.45);">
                          <a href="https://www.savgent.com/events/4" target="_blank" class="btn" style="display: inline-block; padding: 18px 42px; font-size: 16px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #000000; text-decoration: none; border-radius: 50px;">
                            🎟️ CLAIM YOUR FREE TICKET NOW &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 10px; font-size: 12px; color: #9CA3AF;">
                      Strict limit: 2 tickets per member &bull; Fast checkout with zero fees
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Event Details Breakdown Card -->
          <tr>
            <td style="padding: 0 32px 28px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #161616 0%, #111111 100%); border: 1px solid #2A2A2A; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 16px;">
                      📍 Event Coordinates & Details
                    </div>
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">📅 Date:</strong>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          Friday, November 27, 2026
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">⏰ Time:</strong>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          10:00 PM &ndash; 2:30 AM EST
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🏢 Venue:</strong>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          The Ainsworth (310 Sinatra Dr, Hoboken, NJ)
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🎵 Music:</strong>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #F3F4F6; font-weight: 600;">
                          Soca &bull; Dancehall &bull; Afrobeats
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #9CA3AF;">
                          <strong style="color: #FFFFFF;">🛂 Soca Passport:</strong>
                        </td>
                        <td align="right" style="padding: 10px 0; font-size: 14px; color: #10B981; font-weight: 700;">
                          +75 Loyalty Credits Earned
                        </td>
                      </tr>
                    </table>

                    <!-- Tiers Progression Matrix -->
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #333333;">
                      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9CA3AF; margin-bottom: 10px;">
                        📊 Tier Progression Schedule:
                      </div>
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #9CA3AF;">
                        <tr>
                          <td style="padding: 4px 0; color: #10B981; font-weight: 700;">• Tier 1: Free Unisex Pass (First 20)</td>
                          <td align="right" style="padding: 4px 0; color: #10B981; font-weight: 700;">$0.00 (LIVE)</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">• Tier 2: Early Bird Female</td>
                          <td align="right" style="padding: 4px 0; color: #FFFFFF;">$20.00</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">• Tier 2: Early Bird Male</td>
                          <td align="right" style="padding: 4px 0; color: #FFFFFF;">$25.00</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">• Tier 3: General Admission</td>
                          <td align="right" style="padding: 4px 0; color: #9CA3AF;">$30 F / $35 M</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">• VIP Bottle Service Tables</td>
                          <td align="right" style="padding: 4px 0; color: #D4AF37;">From $250.00</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- VIP Table Service Pitch -->
          <tr>
            <td style="padding: 0 32px 32px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #141414; border: 1px solid #222222; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 6px;">
                      🍾 VIP BOTTLE SERVICE
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
                      Reserve Your Waterfront Table
                    </div>
                    <div style="font-size: 13px; line-height: 1.6; color: #9CA3AF; margin-bottom: 14px;">
                      Experience MOVE YUH RASS with dedicated server service, premium bottles, and skip-the-line VIP entry for your crew. Table inventory is strictly limited to 6 packages.
                    </div>
                    <a href="https://www.savgent.com/events/4" target="_blank" style="font-size: 13px; font-weight: 700; color: #D4AF37; text-decoration: none;">
                      Explore VIP Packages &amp; Reserve &rarr;
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

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 24px; background-color: #0A0A0A;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #6B7280;">
                You are receiving this exclusive notification as a registered member of <strong>Savage Gentlemen</strong>.
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #4B5563;">
                &copy; 2026 Savage Gentlemen. 310 Sinatra Dr, Hoboken, NJ 07030. All rights reserved.
              </p>
              <div>
                <a href="https://www.savgent.com" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">SavGent.com</a>
                <span style="color: #4B5563;">&bull;</span>
                <a href="https://www.savgent.com/events/4" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Claim Pass</a>
                <span style="color: #4B5563;">&bull;</span>
                <a href="https://www.instagram.com/savgent" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Instagram</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
}

interface Recipient {
  email: string;
  name: string;
  source: string;
}

const DELAY_BETWEEN_EMAILS_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gatherMembers(): Promise<Recipient[]> {
  const memberMap = new Map<string, Recipient>();

  // 1. Neon DB registered users
  try {
    const users = await db.execute(sql`
      SELECT email, display_name, username 
      FROM users 
      WHERE email IS NOT NULL AND email != ''
    `);
    for (const u of users.rows) {
      const email = (u.email as string)?.trim().toLowerCase();
      if (email && email.includes('@') && !email.includes('example.com') && !email.includes('placeholder')) {
        let rawName = (u.display_name as string)?.trim() || (u.username as string)?.trim();
        let firstName = 'Soca Family';
        if (rawName && !/^\d/.test(rawName) && rawName !== 'Ms.') {
          firstName = rawName.split(/[\s_]/)[0];
        }
        memberMap.set(email, {
          email,
          name: firstName,
          source: 'Registered Community Member',
        });
      }
    }
    console.log(`✅ Loaded ${memberMap.size} registered users from database.`);
  } catch (err: any) {
    console.warn('⚠️ Could not load database users (quota or connection issue):', err.message);
  }

  // 2. Fallback to attendee CSVs if database is suspended or empty
  if (memberMap.size === 0) {
    console.log('ℹ️ Pulling community members from attendee databases...');
    const rirCsvPath = path.join(process.cwd(), 'attached_assets', 'emailcsv_1752687394393.csv');
    if (fs.existsSync(rirCsvPath)) {
      try {
        const csvContent = fs.readFileSync(rirCsvPath, 'utf-8');
        const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });
        for (const r of records) {
          const email = r['Buyer email']?.trim().toLowerCase();
          const firstName = r['Buyer first name']?.trim();
          if (email && email.includes('@')) {
            if (!memberMap.has(email)) {
              memberMap.set(email, {
                email,
                name: firstName || 'Soca Family',
                source: 'Community Member (Past Attendee)',
              });
            }
          }
        }
      } catch (err: any) {
        console.error('⚠️ Could not parse CSV:', err.message);
      }
    }
  }

  return Array.from(memberMap.values());
}

async function main() {
  const isPreview = process.argv.includes('--preview');
  const isLive = process.argv.includes('--live');
  const toArg = process.argv.find((arg) => arg.startsWith('--to=') || arg === '--to');
  let testToEmail: string | undefined;

  if (toArg) {
    if (toArg.startsWith('--to=')) {
      testToEmail = toArg.split('=')[1];
    } else {
      const idx = process.argv.indexOf('--to');
      testToEmail = process.argv[idx + 1];
    }
  }

  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('===============================================================');
  console.log('🔥 MOVE YUH RASS — FREE MEMBER TICKETS ANNOUNCEMENT ENGINE');
  console.log(`Mode: ${testToEmail ? `🎯 TEST DISPATCH TO: ${testToEmail}` : isLive ? '🚀 LIVE SEND TO ALL' : isPreview ? '👁️ HTML PREVIEW' : '👀 DRY RUN'}`);
  console.log(`Active Provider: ${process.env.EMAIL_PROVIDER || 'brevo'}`);
  console.log('===============================================================\n');

  // Preview Mode
  if (isPreview) {
    const html = getFreeTicketsEmailHtml('Alex');
    const previewDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }
    const previewPath = path.join(previewDir, 'free-tickets-member-email.html');
    fs.writeFileSync(previewPath, html);
    console.log(`✅ Preview HTML written to: ${previewPath}`);
    console.log('Subject: 🔥 FIRST ACCESS: 20 Free Passes Just Dropped for MOVE YUH RASS (Members Only)');
    process.exit(0);
  }

  // Single Test Email Mode
  if (testToEmail) {
    console.log(`Dispatching test member announcement to ${testToEmail}...`);
    const html = getFreeTicketsEmailHtml('Alex');
    try {
      const success = await sendEmail({
        to: testToEmail,
        subject: `🔥 FIRST ACCESS: 20 Free Passes Just Dropped for MOVE YUH RASS (Members Only)`,
        html,
      });
      if (success) {
        console.log(`✅ DELIVERED successfully to ${testToEmail}`);
      } else {
        console.log(`❌ FAILED (Email provider returned false)`);
      }
    } catch (err: any) {
      console.error(`❌ Send error:`, err?.message || err);
    }
    process.exit(0);
  }

  // Gather Members for broadcast
  let members = await gatherMembers();
  if (limit) {
    console.log(`Applying recipient limit of ${limit}.`);
    members = members.slice(0, limit);
  }

  console.log(`Found ${members.length} member recipient(s).\n`);

  if (!isLive) {
    console.log('Member list preview (first 10):');
    members.slice(0, 10).forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.email.padEnd(35)} | Name: ${m.name.padEnd(15)} | Source: ${m.source}`);
    });
    console.log('\n⚠️ DRY RUN ONLY. No emails sent.');
    console.log('To send a test email, run:');
    console.log('  npx tsx scripts/send-free-tickets-member-announcement.ts --to your-email@domain.com');
    console.log('To execute live broadcast, run:');
    console.log('  npx tsx scripts/send-free-tickets-member-announcement.ts --live\n');
    process.exit(0);
  }

  // Live Broadcast
  console.log(`🚀 Starting live broadcast to ${members.length} members...\n`);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const html = getFreeTicketsEmailHtml(member.name);
    try {
      process.stdout.write(`[${i + 1}/${members.length}] Sending to ${member.email} (${member.name})... `);
      const ok = await sendEmail({
        to: member.email,
        subject: `🔥 FIRST ACCESS: 20 Free Passes Just Dropped for MOVE YUH RASS (Members Only)`,
        html,
      });
      if (ok) {
        sent++;
        console.log('✅ DELIVERED');
      } else {
        failed++;
        console.log('❌ REJECTED');
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ ERROR: ${err?.message || err}`);
    }

    if (i < members.length - 1) {
      await sleep(DELAY_BETWEEN_EMAILS_MS);
    }
  }

  console.log('\n===============================================================');
  console.log(`🏁 BROADCAST COMPLETE: ${sent} sent, ${failed} failed.`);
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Fatal announcement error:', err);
  process.exit(1);
});
