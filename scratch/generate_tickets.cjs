const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, 'tickets_temp');
const MAPPING_FILE = path.join(__dirname, 'ticket_mapping.json');
const TICKETS_COUNT = 100;

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

async function generateTickets() {
    const mapping = [];
    console.log(`Generating ${TICKETS_COUNT} tickets...`);

    for (let i = 1; i <= TICKETS_COUNT; i++) {
        const ticketId = uuidv4();
        // The URL for validation - using the real domain as base
        const validationUrl = `https://www.savgent.com/verify/elysium/${ticketId}`;
        const fileName = `ticket_${i.toString().padStart(3, '0')}.png`;
        const filePath = path.join(TEMP_DIR, fileName);

        await QRCode.toFile(filePath, validationUrl, {
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            width: 400,
            margin: 2
        });

        mapping.push({
            index: i,
            id: ticketId,
            url: validationUrl,
            file: fileName
        });

        if (i % 10 === 0) console.log(`Progress: ${i}/${TICKETS_COUNT}`);
    }

    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
    console.log(`Successfully generated ${TICKETS_COUNT} QR codes.`);
    console.log(`Mapping saved to ${MAPPING_FILE}`);
}

generateTickets().catch(err => {
    console.error('Error generating tickets:', err);
    process.exit(1);
});
