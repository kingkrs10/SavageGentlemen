-- Create email marketing tables
CREATE TABLE IF NOT EXISTS email_lists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'active',
    source TEXT,
    user_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_list_subscribers (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES email_lists(id),
    subscriber_id INTEGER NOT NULL REFERENCES email_subscribers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(list_id, subscriber_id)
);

CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_for TIMESTAMP,
    list_id INTEGER REFERENCES email_lists(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaign_stats (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id),
    sent INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    opened INTEGER DEFAULT 0,
    clicked INTEGER DEFAULT 0,
    bounced INTEGER DEFAULT 0,
    unsubscribed INTEGER DEFAULT 0,
    complaints INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create test data
INSERT INTO email_lists (name, description) 
VALUES 
  ('General Subscribers', 'Main subscriber list for newsletters'),
  ('Event Attendees', 'Subscribers who have attended events')
ON CONFLICT DO NOTHING;

-- Insert a few test subscribers
INSERT INTO email_subscribers (email, first_name, last_name, status, source) 
VALUES 
  ('test1@example.com', 'Test', 'User', 'active', 'website'),
  ('test2@example.com', 'Jane', 'Doe', 'active', 'event'),
  ('test3@example.com', 'John', 'Smith', 'active', 'import')
ON CONFLICT DO NOTHING;