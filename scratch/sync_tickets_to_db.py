import json
import os
import json
import os

# Configuration
MAPPING_FILE = '/Users/sg/SavageGentlemen/scratch/ticket_mapping.json'
EVENT_ID = 1
USER_ID = 1
ORDER_ID = 0 # Batch generation
TICKET_TYPE = 'standard'
PRICE = 0.0 # Placeholder for batch generated

# Database Connection (using the environment variables if possible, or standard)
# Since I'm an agent, I'll use the tool to run SQL instead of direct connection
# but for bulk insert, I'll prepare the SQL statements.

def sync_tickets():
    if not os.path.exists(MAPPING_FILE):
        print(f"Error: {MAPPING_FILE} not found.")
        return

    with open(MAPPING_FILE, 'r') as f:
        mapping = json.load(f)

    print(f"Preparing to sync {len(mapping)} tickets to database...")
    
    values = []
    for item in mapping:
        # Columns: user_id, event_id, order_id, qr_code_data, ticket_type, price, attendee_name, status
        qr_data = f"EVENT-1-ORDER-E-{item['id']}"
        values.append((USER_ID, EVENT_ID, ORDER_ID, qr_data, TICKET_TYPE, PRICE, f"Elysium Batch #{item['index']}", 'valid'))

    # I'll output the SQL for the run_sql tool
    sql_template = "INSERT INTO ticket_purchases (user_id, event_id, order_id, qr_code_data, ticket_type, price, attendee_name, status) VALUES %s ON CONFLICT (qr_code_data) DO NOTHING;"
    
    # Actually, I'll just write the SQL to a file so I can run it
    with open('scratch/sync_tickets.sql', 'w') as f:
        f.write("INSERT INTO ticket_purchases (user_id, event_id, order_id, qr_code_data, ticket_type, price, attendee_name, status) VALUES\n")
        rows = []
        for v in values:
            row = f"({v[0]}, {v[1]}, {v[2]}, '{v[3]}', '{v[4]}', {v[5]}, '{v[6]}', '{v[7]}')"
            rows.append(row)
        f.write(",\n".join(rows))
        f.write("\nON CONFLICT (qr_code_data) DO NOTHING;")
    
    print("SQL script generated at scratch/sync_tickets.sql")

if __name__ == "__main__":
    sync_tickets()
