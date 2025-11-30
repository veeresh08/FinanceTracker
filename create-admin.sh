#!/bin/bash

# Script to create admin user: veeresh@gmail.com with password veeresh@33

echo "🔐 Creating Admin User..."
echo "========================="

cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Create SQL commands to:
# 1. Check if user exists
# 2. If not, create the user
# 3. Make them admin

# Generate bcrypt hash for password "veeresh@33"
# We'll need to do this via node
node << 'EOF'
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(process.cwd(), 'loan-tracker.db');
const db = new Database(DB_FILE);

async function createAdminUser() {
  try {
    // Hash password
    const password_hash = await bcrypt.hash('veeresh@33', 10);
    
    // Check if user already exists
    const existing = db.prepare('SELECT * FROM auth_users WHERE email = ?').get('veeresh@gmail.com');
    
    if (existing) {
      console.log('✅ User veeresh@gmail.com already exists');
      
      // Update to make admin and update password
      db.prepare('UPDATE auth_users SET is_admin = 1, password_hash = ?, is_verified = 1 WHERE email = ?')
        .run(password_hash, 'veeresh@gmail.com');
      console.log('✅ Updated to admin with new password');
      console.log(`📧 Email: veeresh@gmail.com`);
      console.log(`🔑 Password: veeresh@33`);
    } else {
      // Create new admin user
      const result = db.prepare(`
        INSERT INTO auth_users (username, email, password_hash, auth_method, is_verified, is_admin)
        VALUES (?, ?, ?, 'password', 1, 1)
      `).run('veeresh', 'veeresh@gmail.com', password_hash);
      
      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: veeresh@gmail.com`);
      console.log(`👤 Username: veeresh`);
      console.log(`🔑 Password: veeresh@33`);
      
      // Create default profile
      db.prepare(`
        INSERT INTO user_profile (auth_user_id, user_name, currency, monthly_salary, other_income, total_income)
        VALUES (?, 'Veeresh Admin', 'INR', 0, 0, 0)
      `).run(result.lastInsertRowid);
      
      console.log('✅ Profile created');
    }
    
    // Show all admin users
    const admins = db.prepare('SELECT id, username, email, is_admin FROM auth_users WHERE is_admin = 1').all();
    console.log('\n👑 Current Admin Users:');
    admins.forEach(admin => {
      console.log(`   ${admin.id}. ${admin.username} (${admin.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

createAdminUser();
EOF

echo ""
echo "========================="
echo "✅ Done!"
echo ""
echo "🚀 Now you can login at: http://localhost:5173"
echo "   Email: veeresh@gmail.com"
echo "   Password: veeresh@33"
echo ""
echo "🔐 After login, you'll see the Admin link in navbar!"

