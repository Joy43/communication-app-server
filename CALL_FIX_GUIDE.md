# How to Fix "Recipient user not found" Error

## Problem

Your app is trying to call user ID `67ae2477-73bd-4349-8178-2215539e51f0` which doesn't exist in the database.

## Solution Summary

The backend is working correctly - it's preventing invalid calls. You need to update your React Native app to use valid user IDs.

---

## ✅ Solution 1: Use the Existing Users API (RECOMMENDED)

Your backend already has an endpoint to get all users:

### API Endpoint

```
GET /private-message/users/all
Authorization: Bearer YOUR_JWT_TOKEN
```

### React Native Example

```javascript
// Fetch all available users
const fetchUsers = async () => {
  try {
    const response = await fetch(
      'http://your-api-url/private-message/users/all',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${yourAuthToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const users = await response.json();
    console.log('Available users:', users);

    // Now use these user IDs for calls
    // users will have: id, name, email, profilePicture, isOnline, status

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// Start a call with a valid user
const startCall = (recipientUserId) => {
  socket.emit('start-call', {
    hostUserId: currentUser.id,
    recipientUserId: recipientUserId, // Use ID from fetchUsers()
    title: 'Video Call',
  });
};
```

---

## ✅ Solution 2: Use WebSocket to Get Online Users

I've added a new WebSocket event to get currently online users:

### WebSocket Event

```javascript
// Get online users who are available for calling
socket.emit('get-online-users');

socket.on('online-users', (data) => {
  console.log('Online users:', data.users);
  // data.users is an array of user IDs that are currently connected
});
```

---

## ✅ Solution 3: Check Database Directly

### Using Prisma Studio

1. Prisma Studio is running at: http://localhost:5555
2. Open it in your browser
3. Click on "User" table
4. Copy valid user IDs from there

### Using SQL

```sql
-- See all users
SELECT id, email, name FROM "users" ORDER BY "createdAt" DESC;

-- Check if specific user exists
SELECT * FROM "users" WHERE id = '67ae2477-73bd-4349-8178-2215539e51f0';
```

---

## ✅ Solution 4: Create a Test User (For Development Only)

If you need that specific user ID for testing:

```bash
# Connect to your database
psql $DATABASE_URL

# Create the user (adjust fields as needed)
INSERT INTO "users" (id, email, name, "createdAt", "updatedAt")
VALUES (
  '67ae2477-73bd-4349-8178-2215539e51f0',
  'testuser@example.com',
  'Test User',
  NOW(),
  NOW()
);
```

---

## 🔍 Debugging

The backend now logs detailed information:

```
Creating call: {
  hostUserId: '2f7faa8e-80a7-45ac-9560-5670aa19e51f',
  recipientUserId: '67ae2477-73bd-4349-8178-2215539e51f0',
  title: undefined
}
User validation: { hostUserExists: true, recipientUserExists: false }
```

This shows:

- ✅ Host user EXISTS
- ❌ Recipient user DOES NOT EXIST

---

## 🎯 Best Practice

**Always fetch users from the backend** before showing them in your app:

1. When user opens the call screen → Fetch users from `/private-message/users/all`
2. Display the users in your UI
3. When user selects someone to call → Use their ID from the fetched list
4. Never hardcode or cache user IDs in your app

---

## 📝 Current Valid User

Based on the logs, this user ID is valid and exists:

```
✅ 2f7faa8e-80a7-45ac-9560-5670aa19e51f
```

You can test calling functionality by having two users with valid IDs call each other.
