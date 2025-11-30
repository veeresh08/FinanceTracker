# 🔐 Admin Dashboard - Complete Guide

## Overview

The Admin Dashboard allows you (as the administrator) to monitor and manage all users on your WealthFlow platform. You can track user activity, view their financial data, and manage admin privileges.

---

## 🎯 Features

### 1. **Platform Overview** 📊
- Total users count
- Active users (last 30 days)
- New users (last 7 days)
- Total loans and investments across platform
- Daily active users chart
- Activity breakdown by type
- Top 10 most active users

### 2. **User Management** 👥
- View all registered users
- See each user's:
  - Contact information (email, phone)
  - Authentication method (password/OTP/Google)
  - Number of loans and total loan amount
  - Number of investments and total value
  - Monthly records count
  - Last login time
- View detailed user information (loans, investments, activity)
- Grant/revoke admin privileges

### 3. **Activity Tracking** 📋
- Real-time activity logs
- Track user actions:
  - Login success/failure
  - Logout
  - Admin actions
  - Data modifications
- Filter by action type
- View IP addresses and timestamps
- See user agent (browser/device info)

---

## 🚀 How to Access Admin Dashboard

### Step 1: Make Yourself Admin

The first user needs to be made admin manually in the database:

```bash
# Connect to your database
sqlite3 loan-tracker.db

# Make your user an admin (replace USERNAME with your username)
UPDATE auth_users SET is_admin = 1 WHERE username = 'YOUR_USERNAME';

# Exit SQLite
.exit
```

**Or via Cloud Run:**

```bash
# Download database from GCS
gsutil cp gs://wealthflow-db-veeresh-2024/database/loan-tracker.db ./temp-db.db

# Update in database
sqlite3 temp-db.db "UPDATE auth_users SET is_admin = 1 WHERE username = 'YOUR_USERNAME';"

# Upload back to GCS
gsutil cp ./temp-db.db gs://wealthflow-db-veeresh-2024/database/loan-tracker.db

# Restart Cloud Run to load updated database
gcloud run services update wealthflow --region=us-central1
```

### Step 2: Login

1. Login to your account normally
2. You'll see a new **🔐 Admin** link in the navigation bar
3. Click it to access the admin dashboard

---

## 📊 Admin Dashboard Sections

### Overview Tab

**Platform Statistics:**
- **Total Users**: All registered users
- **Active Users**: Users who logged in within last 30 days
- **New Users**: Users registered in last 7 days
- **Total Loans**: Active loans count and total amount
- **Total Investments**: Active investments count and total value

**Charts:**
- **Daily Active Users**: Bar chart showing activity for last 7 days
- **Activity by Type**: Breakdown of different actions (logins, admin actions, etc.)
- **Top Users**: Most active users by action count (last 30 days)

### Users Tab

**User List Table** shows:
- Username and full name
- Admin badge (if user is admin)
- Email and phone
- Authentication method
- Data summary (loans, investments, records)
- Last login time
- Action buttons

**Actions:**
- **View Details**: Opens modal with complete user information
  - Basic info
  - All loans
  - All investments
  - Recent activity logs
- **Make Admin**: Grants admin privileges to user
- **Remove Admin**: Revokes admin privileges (can't remove your own)

### Activity Logs Tab

**Activity Log Table** shows:
- Timestamp
- User (username and email)
- Action type with color coding
- Description
- IP address

**Filters:**
- Filter by action type
- Refresh to get latest logs

**Action Types:**
- `login_success`: Successful login
- `login_failed`: Failed login attempt
- `logout`: User logged out
- `admin_view_users`: Admin viewed all users
- `admin_view_logs`: Admin viewed activity logs
- `admin_view_stats`: Admin viewed statistics
- `admin_grant`: Admin rights granted to user
- `admin_revoke`: Admin rights revoked from user

---

## 🔒 Security Features

1. **Role-Based Access**: Only users with `is_admin=1` can access admin endpoints
2. **Activity Logging**: All admin actions are logged
3. **IP Tracking**: IP addresses are recorded for audit trail
4. **Self-Protection**: Admins cannot remove their own admin rights
5. **Authentication Required**: Must be logged in to access any admin feature

---

## 📈 What Data Can You Track?

### Per User:
- Registration date and last login
- Authentication method used
- Total number of loans and total loan amount
- Total number of investments and total investment value
- Number of monthly expense records
- Complete activity history
- IP addresses of login attempts

### Platform-Wide:
- User growth (total, active, new)
- Financial data aggregated (all loans, all investments)
- Most active users
- Daily user engagement
- Action patterns (what users do most)

---

## 💡 Use Cases

### 1. Monitor Platform Health
- Check how many users are active
- See if users are actually using features
- Identify drop-off patterns

### 2. User Support
- View user's complete financial data
- Help troubleshoot issues
- Verify data integrity

### 3. Security Monitoring
- Track failed login attempts
- Identify suspicious activity
- Monitor admin actions

### 4. Growth Analysis
- Track new user sign-ups
- See which features are most used
- Identify power users

---

## 🛠️ API Endpoints (Admin Only)

All endpoints require admin authentication:

```
GET  /api/admin/users                    - List all users with data summary
GET  /api/admin/users/:userId            - Get specific user details
GET  /api/admin/statistics               - Get platform statistics
GET  /api/admin/activity-logs            - Get activity logs (with filters)
POST /api/admin/make-admin/:userId       - Grant admin rights
POST /api/admin/remove-admin/:userId     - Revoke admin rights
```

---

## 🎨 UI Features

- **Color-Coded Actions**: Different colors for different action types
- **Responsive Design**: Works on desktop and tablet
- **Real-time Data**: Refresh button to get latest data
- **Modal Details**: Click user to see detailed popup
- **Sortable Data**: Tables organized by relevance
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

---

## 📝 Activity Logs Examples

```
✅ login_success
User: john@example.com
Description: User logged in successfully
IP: 192.168.1.1
Time: 2024-11-30 10:30:15

❌ login_failed
User: unknown@test.com
Description: Failed login attempt for username: unknown
IP: 203.0.113.1
Time: 2024-11-30 10:25:00

🔐 admin_view_users
User: admin@wealthflow.com
Description: Admin viewed all users
IP: 192.168.1.1
Time: 2024-11-30 11:00:00
```

---

## 🚨 Important Notes

1. **Privacy**: You can see all user data. Use responsibly and follow privacy laws.
2. **Backup Before Changes**: Always backup database before making admin changes.
3. **Don't Remove Your Own Admin**: You'll lock yourself out!
4. **Monitor Failed Logins**: Multiple failed attempts might indicate brute force attack.
5. **Regular Audits**: Check activity logs regularly for suspicious activity.

---

## 🔍 Troubleshooting

### Can't see Admin link in navbar?
- Check if you set `is_admin=1` in database
- Logout and login again
- Clear browser cache

### "Admin access required" error?
- Your account doesn't have admin privileges
- Update database using SQL command above
- Restart server/container

### No activity logs showing?
- They're automatically created when users perform actions
- Login/logout to generate test logs
- Check database table `activity_logs`

---

## 📊 Database Schema

### New Columns in `auth_users`:
```sql
is_admin INTEGER DEFAULT 0  -- 0 = normal user, 1 = admin
```

### New Table: `activity_logs`:
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL,
  action_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id)
);
```

---

## 🎉 Benefits

✅ **Track User Engagement** - See who's actually using your app  
✅ **Monitor Platform Health** - Quick stats on users, loans, investments  
✅ **Security Monitoring** - Track failed logins and suspicious activity  
✅ **User Support** - View complete user data to help with issues  
✅ **Growth Analysis** - Understand user behavior and growth patterns  
✅ **Admin Management** - Grant/revoke admin access easily  
✅ **Audit Trail** - Complete history of all actions  

---

## 🚀 Next Steps

1. Make yourself admin in the database
2. Login and click the Admin link
3. Explore the three tabs (Overview, Users, Activity)
4. Grant admin rights to trusted users if needed
5. Monitor platform regularly

---

**Your admin dashboard is now ready!** 🎊

Monitor your platform, support users, and grow your WealthFlow application with confidence!

