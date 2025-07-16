// CSV Analysis Script

// Parse CSV data
const csvData = `"Event name","Event date","Issue date","Type","Code","Status","Entitlement","Buyer first name","Buyer last name","Buyer email"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-22 14:04","ADMISSION","AQMUF","Redeemed","RIR Comps","Michael","Hilliman","Luga.ea@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-22 13:00","ADMISSION","C4YFR","Redeemed","RIR Comps","Brandon","Parrish","Bdparrish@live.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-22 13:00","ADMISSION","7C10B","Redeemed","RIR Comps","Brandon","Parrish","Bdparrish@live.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-22 12:58","ADMISSION","XJA35","Redeemed","RIR Comps","Jumoke","Charles","Jumoke.charles1@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-22 12:58","ADMISSION","PBFY7","Redeemed","RIR Comps","Jumoke","Charles","Jumoke.charles1@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-21 16:09","ADMISSION","RT38I","Redeemed","RIR General Entry Tix","Jordan","Tapia","jordan.tapia133@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-21 16:09","ADMISSION","FHD2M","Redeemed","RIR General Entry Tix","Jordan","Tapia","jordan.tapia133@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-21 06:12","ADMISSION","A56DF","Active","RIR General Entry Tix","Samantha ","Marchan","Smarchan1892@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-20 12:34","ADMISSION","PK615","Active","RIR General Entry Tix","Lawrence","Campbell","Lcampbell973@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-20 12:34","ADMISSION","O7EUW","Active","RIR General Entry Tix","Lawrence","Campbell","Lcampbell973@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-19 07:29","ADMISSION","ZDQC1","Redeemed","RIR General Entry Tix","Brandon","White","Brandonwhite2020@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-19 07:29","ADMISSION","16543","Redeemed","RIR General Entry Tix","Brandon","White","Brandonwhite2020@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-17 21:03","ADMISSION","YW8GT","Active","RIR General Entry Tix","Jeff","Gee","Jeffvisualarts@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-17 12:30","ADMISSION","AGJT3","Cancelled","Bottle pkg information ","JEFF","CAMPBELL","campbelljeff18@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-16 11:38","ADMISSION","WQ32M","Active","RIR Tier 2 Tickets","Janelle","Clayton","clayton7j@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-13 07:21","ADMISSION","4UGVA","Redeemed","RIR Tier 2 Tickets","Indira ","Singh","EmpressInde@icloud.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-13 07:21","ADMISSION","46RV2","Redeemed","RIR Tier 2 Tickets","Indira ","Singh","EmpressInde@icloud.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-10 20:39","ADMISSION","NC6IJ","Active","RIR Tier 2 Tickets","Jaye","Dee","Queenj101@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-10 20:39","ADMISSION","YZ2OU","Active","RIR Tier 2 Tickets","Jaye","Dee","Queenj101@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-10 15:33","ADMISSION","MGXKJ","Redeemed","RIR Tier 2 Tickets","Janaye","Williams","Janayeimani@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-10 15:33","ADMISSION","3VM10","Redeemed","RIR Tier 2 Tickets","Janaye","Williams","Janayeimani@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-09 15:33","ADMISSION","XCLN9","Redeemed","RIR Tier 2 Tickets","Ruben","Jean-Baptiste","Ianess550@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-09 15:26","ADMISSION","PDTG6","Active","RIR Tier 2 Tickets","Nadialine","Moody","Nadialine.Moody@yahoo.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-09 14:29","ADMISSION","P64DG","Redeemed","RIR Early Bird","Carlton","Carty Jr","carlton.cartyjr@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-08 21:05","ADMISSION","B0CJ1","Active","RIR Early Bird","Jasmine ","Moore","Jazzybrown35@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-08 14:17","ADMISSION","4EI01","Redeemed","RIR Early Bird","Wanda","Morose","Wandamorose12@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-08 08:58","ADMISSION","OTIYW","Redeemed","RIR Early Bird","Paulette ","Marks","Paulettemarks@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-08 07:53","ADMISSION","4V0YF","Redeemed","RIR Early Bird","Denise ","Williams","D.mindful1@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-08 07:53","ADMISSION","PEWBK","Redeemed","RIR Early Bird","Denise ","Williams","D.mindful1@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-07 12:22","ADMISSION","IMVK0","Active","RIR Early Bird","Ruben ","Jean-Baptiste","Ianess550@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-07 12:22","ADMISSION","7O3F6","Active","RIR Early Bird","Ruben ","Jean-Baptiste","Ianess550@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-07 11:11","ADMISSION","YBZ69","Active","Bottle pkg information ","Kea","Coleman ","Xolove0711xo@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 19:39","ADMISSION","4F1ZV","Redeemed","RIR Early Bird","Shauntel","Pierre","Shauntelp90210@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 17:46","ADMISSION","FC0G8","Active","RIR Early Bird","Tiffany","Sobers ","Sobers34@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 17:46","ADMISSION","9BP4M","Active","RIR Early Bird","Tiffany","Sobers ","Sobers34@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 14:32","ADMISSION","NUP4C","Redeemed","RIR Early Bird","Jeremy ","Parchment ","jparch77@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 14:32","ADMISSION","XSUT7","Active","RIR Early Bird","Gerrie","Cummings","Gerriemcummings@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 14:32","ADMISSION","R15PW","Active","RIR Early Bird","Gerrie","Cummings","Gerriemcummings@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-06 11:16","ADMISSION","VPYTO","Redeemed","RIR Early Bird","Zaratu","Umar","zaratuu@gmail.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-05 14:33","ADMISSION","Y42OV","Redeemed","RIR Early Bird","ODETTA","ARTHUR","samath8975@aol.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-05 14:33","ADMISSION","S0UDZ","Redeemed","RIR Early Bird","ODETTA","ARTHUR","samath8975@aol.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-04 20:30","ADMISSION","EDBIP","Redeemed","RIR Early Bird","Emmanuela","Jean-Baptiste","ejeanbaptiste92@yahoo.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-04 20:30","ADMISSION","Y06XC","Redeemed","RIR Early Bird","Emmanuela","Jean-Baptiste","ejeanbaptiste92@yahoo.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-04 20:30","ADMISSION","HRC3Y","Redeemed","RIR Early Bird","Emmanuela","Jean-Baptiste","ejeanbaptiste92@yahoo.com"
"Rhythm in Riddim","2025-03-22 23:00","2025-03-04 20:30","ADMISSION","W1K0X","Redeemed","RIR Early Bird","Emmanuela","Jean-Baptiste","ejeanbaptiste92@yahoo.com"`;

// Existing database ticket holders (from the database query)
const existingTicketHolders = [
  '275mlkdrive@gmail.com',
  'Nadialine.Moody@yahoo.com',
  'alexiasimongy@gmail.com',
  'ayshz.coleman@icloud.com',
  'carlottallbrowne@gmail.com',
  'deniseclaire0527@gmail.com',
  'ejeanbaptiste92@yahoo.com',
  'elmikae@gmail.com',
  'emilsevere201@gmail.com',
  'guest@example.com',
  'info@savgent.com',
  'jeffvisualarts@gmail.com',
  'jueustache@yahoo.com',
  'kmotayne33@gmail.com',
  'la.e.greene@gmail.com',
  'mariefrazier1@gmail.com',
  'marilineleslie09@gmail.com',
  'meleesa.payne@icloud.com',
  'mobiletest@example.com',
  'rodneyjeanbaptiste@gmail.com',
  'spyctrini@yahoo.com',
  'test@example.com',
  'thicksweetness925@yahoo.com',
  'zaratuu@gmail.com'
];

// Parse CSV and extract unique email addresses
const lines = csvData.trim().split('\n');
const csvRecords = [];

lines.slice(1).forEach(line => {
  const parts = line.split('","');
  if (parts.length >= 10) {
    const email = parts[9].replace(/"/g, '').trim();
    const firstName = parts[7].replace(/"/g, '').trim();
    const lastName = parts[8].replace(/"/g, '').trim();
    const status = parts[5].replace(/"/g, '').trim();
    
    csvRecords.push({
      email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      status
    });
  }
});

// Get unique email addresses from CSV
const uniqueCSVEmails = [...new Set(csvRecords.map(r => r.email))];

// Find users who need tickets (in CSV but not in database)
const needsTickets = [];
const csvEmailMap = new Map();

// Create a map of CSV emails to user details
csvRecords.forEach(record => {
  if (!csvEmailMap.has(record.email)) {
    csvEmailMap.set(record.email, record);
  }
});

// Check which CSV emails don't have tickets in the database
uniqueCSVEmails.forEach(email => {
  if (!existingTicketHolders.includes(email)) {
    needsTickets.push(csvEmailMap.get(email));
  }
});

console.log('\n=== TICKET ANALYSIS RESULTS ===');
console.log(`Total unique emails in CSV: ${uniqueCSVEmails.length}`);
console.log(`Total existing ticket holders: ${existingTicketHolders.length}`);
console.log(`Users who need tickets: ${needsTickets.length}`);

console.log('\n=== USERS WHO NEED TICKETS ===');
needsTickets.forEach((user, index) => {
  console.log(`${index + 1}. ${user.fullName} (${user.email}) - Status: ${user.status}`);
});

console.log('\n=== ALREADY HAVE TICKETS ===');
const alreadyHaveTickets = [];
uniqueCSVEmails.forEach(email => {
  if (existingTicketHolders.includes(email)) {
    alreadyHaveTickets.push(csvEmailMap.get(email));
  }
});

alreadyHaveTickets.forEach((user, index) => {
  console.log(`${index + 1}. ${user.fullName} (${user.email})`);
});

// Export for use in ticket creation
module.exports = { needsTickets, alreadyHaveTickets };