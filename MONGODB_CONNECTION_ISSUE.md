# MongoDB Atlas Connection Issue

## Current Status: ❌ NOT CONNECTED

Your IP (196.189.24.133) is whitelisted, but connection still fails.

## Root Cause: DNS Resolution Failure

Your local DNS server (10.140.5.25) **cannot resolve MongoDB Atlas hostnames**.

### Test Result:
```
Local DNS (10.140.5.25): ✗ FAILS to resolve cluster0.g4aidzg.mongodb.net
Google DNS (8.8.8.8):   ✓ SUCCESS resolving cluster0.g4aidzg.mongodb.net
```

## Quick Solutions

### Solution 1: Change Your DNS to Google DNS (RECOMMENDED & QUICK)

**Windows DNS Change:**
1. Press `Win + R`, type `ncpa.cpl`, press Enter
2. Right-click your network connection → **Properties**
3. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
4. Select **"Use the following DNS server addresses"**:
   - Preferred DNS: `8.8.8.8`
   - Alternate DNS: `8.8.4.4`
5. Click **OK** → **OK**
6. Open Command Prompt and run: `ipconfig /flushdns`

**Then test again:**
```bash
cd backend
.\venv\Scripts\python.exe test_mongodb.py
```

### Solution 2: Use Local MongoDB Instead

If DNS issues persist or you're on a restricted network:

1. **Install MongoDB Community Server**:
   - Download: https://www.mongodb.com/try/download/community
   - Install with default settings
   - Ensure "Install MongoDB as a Service" is checked

2. **Update `.env` file**:
   ```
   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DATABASE=face_attendance
   ```

3. **Restart Django server**

4. **Create admin**:
   ```bash
   .\venv\Scripts\python.exe quick_create_admin.py
   ```

### Solution 3: VPN/Network Change

If you're on a corporate/school network with DNS restrictions:
- Try connecting from a different network (home internet, mobile hotspot)
- Use a VPN to bypass network restrictions

## After Connection is Fixed

Run these commands to create admin and verify:

```bash
cd backend

# Create admin user
.\venv\Scripts\python.exe quick_create_admin.py

# List all users
.\venv\Scripts\python.exe list_users.py

# Restart Django server
# (Stop current one first with Ctrl+C)
.\venv\Scripts\python.exe manage.py runserver
```

## Admin Credentials (Once Created)
- Email: ebisaberhanu1996@gmail.com
- Password: ebisa1234

## Need More Help?

The fastest solution is **changing DNS to Google DNS (8.8.8.8)** - takes 2 minutes and usually fixes the issue immediately.
