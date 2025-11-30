#!/bin/bash

# Script to create admin user in Cloud Run database (via GCS)

echo "🔐 Creating Admin User in Cloud Run Database"
echo "================================================"

cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Step 1: Download current database from GCS
echo "📥 Step 1: Downloading database from GCS..."
gsutil cp gs://wealthflow-db-veeresh-2024/database/loan-tracker.db ./cloud-db.db

# Step 2: Update database with admin user
echo "🔧 Step 2: Creating admin user..."
node << 'EOF'
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const db = new Database('cloud-db.db');

async function createAdminInCloudDb() {
  try {
    // Add is_admin column if it doesn't exist
    try {
      db.exec('ALTER TABLE auth_users ADD COLUMN is_admin INTEGER DEFAULT 0');
      console.log('✅ Added is_admin column');
    } catch (e) {
      console.log('ℹ️  is_admin column already exists');
    }
    
    // Create activity_logs table if doesn't exist
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action_type TEXT NOT NULL,
          action_description TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES auth_users(id)
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at)');
      console.log('✅ Created activity_logs table');
    } catch (e) {
      console.log('ℹ️  activity_logs table already exists');
    }
    
    // Hash password
    const password_hash = await bcrypt.hash('Admin@2024', 10);
    
    // Check if admin user exists
    let admin = db.prepare('SELECT * FROM auth_users WHERE email = ?').get('admin@wealthflow.com');
    
    if (admin) {
      console.log('✅ Admin user already exists, updating...');
      db.prepare('UPDATE auth_users SET password_hash = ?, is_admin = 1, is_verified = 1 WHERE email = ?')
        .run(password_hash, 'admin@wealthflow.com');
    } else {
      // Check if username "admin" exists
      admin = db.prepare('SELECT * FROM auth_users WHERE username = ?').get('admin');
      
      if (admin) {
        console.log('✅ Found user "admin", updating...');
        db.prepare('UPDATE auth_users SET email = ?, password_hash = ?, is_admin = 1, is_verified = 1 WHERE username = ?')
          .run('admin@wealthflow.com', password_hash, 'admin');
      } else {
        // Create new admin user
        const result = db.prepare(`
          INSERT INTO auth_users (username, email, password_hash, auth_method, is_verified, is_admin)
          VALUES ('admin', 'admin@wealthflow.com', ?, 'password', 1, 1)
        `).run(password_hash);
        
        console.log('✅ Created new admin user');
        
        // Create profile
        db.prepare(`
          INSERT INTO user_profile (auth_user_id, user_name, currency, monthly_salary, other_income, total_income)
          VALUES (?, 'Admin User', 'INR', 0, 0, 0)
        `).run(result.lastInsertRowid);
        
        console.log('✅ Created admin profile');
      }
    }
    
    // Show all admins
    const admins = db.prepare('SELECT id, username, email, is_admin FROM auth_users WHERE is_admin = 1').all();
    console.log('\n👑 Admin Users in Cloud Database:');
    admins.forEach(admin => {
      console.log(`   ${admin.id}. ${admin.username} <${admin.email}>`);
    });
    
    console.log('\n✅ Admin user ready for Cloud Run!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

createAdminInCloudDb();
EOF

# Step 3: Upload updated database back to GCS
echo ""
echo "📤 Step 3: Uploading updated database to GCS..."
gsutil cp ./cloud-db.db gs://wealthflow-db-veeresh-2024/database/loan-tracker.db

# Step 4: Restart Cloud Run to load new database
echo ""
echo "🔄 Step 4: Restarting Cloud Run service..."
gcloud run services update wealthflow --region=us-central1 --project=horizontal-data-435605-b9

# Cleanup
rm -f ./cloud-db.db

echo ""
echo "================================================"
echo "✅ DONE! Admin user created in Cloud Run!"
echo ""
echo "🔐 Cloud Run Admin Login:"
echo "   URL: https://wealthflow-bhtvileluq-uc.a.run.app"
echo "   Username: admin"
echo "   Email: admin@wealthflow.com"
echo "   Password: Admin@2024"
echo ""
echo "⏰ Wait 30-60 seconds for Cloud Run to restart,"
echo "   then try logging in!"
echo "================================================"

