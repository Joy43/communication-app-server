-- Create a test user with the ID your app is trying to call
-- Make sure to update the email and other fields as needed

INSERT INTO "users" (
  "id",
  "email",
  "name",
  "password",
  "isOnline",
  "lastActiveAt",
  "createdAt",
  "updatedAt"
) VALUES (
  '67ae2477-73bd-4349-8178-2215539e51f0',
  'testrecipient@example.com',
  'Test Recipient User',
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash this properly
  false,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Or if you just want to see what users exist:
SELECT id, email, name, "isOnline", "lastActiveAt" FROM "users" ORDER BY "createdAt" DESC LIMIT 10;
