# 🚀 START SERVERS - Quick Guide

## ✅ **STEP-BY-STEP INSTRUCTIONS:**

### **Step 1: Start Backend Server (Terminal 1)**

Open a NEW terminal and run:

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
npm run server
```

**Wait for this success message:**
```
Added investments column to monthly_records table
Added emergency_fund column to monthly_records table
Added credit_card column to monthly_records table
Added rent column to monthly_records table
Added food column to monthly_records table
Added transport column to monthly_records table
Added utilities column to monthly_records table
Added entertainment column to monthly_records table
✅ Performance indexes created successfully
Database initialized successfully
🚀 Server running on http://localhost:3001
```

✅ **Backend is running on http://localhost:3001**

---

### **Step 2: Start Frontend Client (Terminal 2)**

Open ANOTHER NEW terminal and run:

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker/client"
npm run dev
```

**Wait for this success message:**
```
VITE v7.1.10  ready in 404 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend is running on http://localhost:5173**

---

### **Step 3: Open Browser**

1. Go to: **http://localhost:5173** (NOT 3002!)
2. You should see the **beautiful gradient Login Page**
3. Try **Sign Up**:
   - Username: `myusername` (must be unique)
   - Full Name: `My Full Name`
   - Email: `myemail@example.com` (must be unique)
   - Phone: `1234567890` (must be unique)
   - Password: `password123`
   - Monthly Salary: `100000`
   - Other Income: `5000` (optional)
4. Click **"Create Account"**

✅ **You'll be automatically logged in and see your Dashboard!**

---

## 🔍 **TROUBLESHOOTING:**

### **If Backend Won't Start:**

```bash
# Kill any process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart backend
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
npm run server
```

### **If Frontend Won't Start:**

```bash
# Kill any process on port 5173
lsof -ti:5173 | xargs kill -9

# Restart frontend
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker/client"
npm run dev
```

### **If Database Errors:**

```bash
# Delete old databases
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
rm loan-tracker.db
rm server/sessions.db

# Restart backend (will recreate databases)
npm run server
```

### **If CORS Errors Still Appear:**

1. **Hard refresh browser:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear browser cache:** `Cmd+Shift+Delete`
3. **Close and reopen browser**
4. **Check both servers are running** on correct ports (3001 and 5173)

---

## ✅ **WHAT SHOULD BE RUNNING:**

| Server   | Port | URL                        | Status |
|----------|------|----------------------------|--------|
| Backend  | 3001 | http://localhost:3001      | ✅     |
| Frontend | 5173 | http://localhost:5173      | ✅     |

---

## 📝 **COMMON ERRORS:**

### **"CORS policy" error:**
- ✅ **Fixed** in server.ts with explicit OPTIONS handler
- **Solution:** Hard refresh browser (`Cmd+Shift+R`)

### **"net::ERR_CONNECTION_REFUSED":**
- **Problem:** Backend server not running
- **Solution:** Start backend server (Step 1 above)

### **"404 Not Found":**
- **Problem:** Wrong URL or port
- **Solution:** Use http://localhost:5173 (not 3001)

### **"Registration failed" / "Login failed":**
- **Problem:** Database not initialized, wrong credentials, or duplicate username/email/phone
- **Solution:** 
  1. Try with **completely new** username, email, and phone
  2. If still fails, delete databases and restart backend

### **"Registration succeeded but page won't load":**
- **Problem:** Backend server might have crashed after database creation
- **Solution:** 
  1. Check backend terminal for errors
  2. If crashed, restart backend: `npm run server`
  3. Refresh browser

---

## 🎯 **QUICK START (Copy-Paste):**

### Terminal 1 (Backend):
```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker" && npm run server
```

### Terminal 2 (Frontend):
```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker/client" && npm run dev
```

### Browser:
```
http://localhost:5173
```

---

**That's it! Both servers should be running and the login page should work!** 🚀

