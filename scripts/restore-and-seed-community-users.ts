import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';

interface RestoredUser {
  username: string;
  email: string;
  displayName: string;
  firebaseId: string | null;
  source: string;
}

export function generateRestoreSql(): string {
  const usersPath = path.join(process.cwd(), 'server', 'services', 'restored-users.json');
  const members: RestoredUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  let sqlOutput = `
-- =========================================================
-- Savage Gentlemen: Autonomous Community & Member Restore
-- =========================================================

DO $$
DECLARE
    v_user_id integer;
    v_exists boolean;
BEGIN
`;

  for (const m of members) {
    const cleanEmail = m.email.toLowerCase().trim().replace(/'/g, "''");
    const cleanUsername = m.username.replace(/'/g, "''");
    const cleanDisplayName = m.displayName.replace(/'/g, "''");
    const fbId = m.firebaseId ? `'${m.firebaseId.replace(/'/g, "''")}'` : 'NULL';
    const pwdHash = crypto.createHash('sha256').update(m.email + 'Savage2026!').digest('hex');

    sqlOutput += `
    -- ${cleanEmail} (${m.source})
    SELECT id INTO v_user_id FROM users WHERE LOWER(email) = '${cleanEmail}' OR LOWER(username) = '${cleanUsername}' LIMIT 1;
    IF v_user_id IS NULL THEN
        INSERT INTO users (username, password, display_name, email, role, is_guest, is_pro, firebase_id, created_at, updated_at)
        VALUES ('${cleanUsername}', '${pwdHash}', '${cleanDisplayName}', '${cleanEmail}', 'user', false, false, ${fbId}, NOW(), NOW())
        RETURNING id INTO v_user_id;
    END IF;

    -- Ensure Soca Passport Profile
    SELECT EXISTS (SELECT 1 FROM passport_profiles WHERE user_id = v_user_id) INTO v_exists;
    IF NOT v_exists THEN
        INSERT INTO passport_profiles (user_id, handle, total_points, current_tier, created_at, updated_at)
        VALUES (v_user_id, '${cleanUsername}', 100, 'BRONZE', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Ensure Email Subscriber Record
    SELECT EXISTS (SELECT 1 FROM email_subscribers WHERE LOWER(email) = '${cleanEmail}') INTO v_exists;
    IF NOT v_exists THEN
        INSERT INTO email_subscribers (email, first_name, status, source, user_id, created_at, updated_at)
        VALUES ('${cleanEmail}', '${cleanDisplayName.split(' ')[0]}', 'active', '${m.source}', v_user_id, NOW(), NOW());
    END IF;
`;
  }

  sqlOutput += `
END $$;
`;

  return sqlOutput;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sqlContent = generateRestoreSql();
  const outPath = path.join(process.cwd(), 'restore-users.sql');
  fs.writeFileSync(outPath, sqlContent);
  console.log(`✅ Generated SQL restoration script with ${outPath}`);
}
