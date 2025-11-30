// @ts-nocheck
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectSqlite3 = require('connect-sqlite3');
const { OAuth2Client } = require('google-auth-library');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Google Cloud Storage for database persistence (Cloud Run)
let Storage, storage, bucket;
try {
  Storage = require('@google-cloud/storage').Storage;
} catch (e) {
  console.log('⚠️  @google-cloud/storage not installed (OK for local dev)');
}

const SQLiteStore = connectSqlite3(session);
const app = express();
const PORT = 3001;

// ============================================
// DATABASE PERSISTENCE (Google Cloud Storage)
// ============================================
const DB_FILE = path.join(process.cwd(), 'loan-tracker.db');
const GCS_BUCKET = 'wealthflow-db-veeresh-2024';
const GCS_DB_PATH = 'database/loan-tracker.db';

// Initialize GCS only in production (Cloud Run)
if (process.env.NODE_ENV === 'production' && process.env.K_SERVICE && Storage) {
  try {
    storage = new Storage();
    bucket = storage.bucket(GCS_BUCKET);
    console.log('🪣 GCS initialized for database persistence');
  } catch (error) {
    console.log('⚠️  GCS not available:', error.message);
  }
}

// Download database from GCS
async function downloadDatabaseFromGCS() {
  if (!bucket) return false;
  try {
    const file = bucket.file(GCS_DB_PATH);
    const [exists] = await file.exists();
    if (exists) {
      console.log('📥 Downloading database from GCS...');
      await file.download({ destination: DB_FILE });
      console.log('✅ Database downloaded from GCS');
      return true;
    }
    console.log('ℹ️  No existing database in GCS, creating new one');
    return false;
  } catch (error) {
    console.error('❌ Download error:', error.message);
    return false;
  }
}

// Upload database to GCS
async function uploadDatabaseToGCS() {
  if (!bucket || !fs.existsSync(DB_FILE)) return false;
  try {
    await bucket.upload(DB_FILE, {
      destination: GCS_DB_PATH,
      metadata: { contentType: 'application/x-sqlite3' }
    });
    console.log('✅ Database backed up to GCS');
    return true;
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return false;
  }
}

// Periodic backup (every 10 minutes in production)
if (bucket) {
  setInterval(uploadDatabaseToGCS, 10 * 60 * 1000);
}

// Graceful shutdown - backup before exit
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Backing up database...`);
  await uploadDatabaseToGCS();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// DATABASE SETUP
// ============================================
// Download database from GCS first (if in production)
if (process.env.NODE_ENV === 'production') {
  downloadDatabaseFromGCS().then(() => {
    console.log('📊 Database ready');
  });
}

const db = new Database(DB_FILE);

// Performance optimizations
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

// ============================================
// AUTH HELPERS
// ============================================
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function findUserByUsername(username: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE username = ?');
  return stmt.get(username);
}

function findUserByGoogleId(google_id: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE google_id = ?');
  return stmt.get(google_id);
}

async function createAuthUser(data: {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  google_id?: string;
  auth_method: 'password' | 'otp' | 'google';
}) {
  const { username, email, phone, password, google_id, auth_method } = data;
  let password_hash = null;
  if (password) {
    password_hash = await hashPassword(password);
  }

  const stmt = db.prepare(`
    INSERT INTO auth_users (username, email, phone, password_hash, google_id, auth_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, phone, password_hash, google_id, auth_method);
  
  // Backup after important changes
  if (bucket) uploadDatabaseToGCS().catch(e => console.log('Backup queued'));
  
  return { id: result.lastInsertRowid, ...data };
}

function createUserProfile(auth_user_id: number, data: {
  user_name: string;
  currency?: string;
  monthly_salary: number;
  other_income?: number;
}) {
  const total_income = data.monthly_salary + (data.other_income || 0);
  const stmt = db.prepare(`
    INSERT INTO user_profile (auth_user_id, user_name, currency, monthly_salary, other_income, total_income)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    auth_user_id,
    data.user_name,
    data.currency || 'INR',
    data.monthly_salary,
    data.other_income || 0,
    total_income
  );

  return {
    id: result.lastInsertRowid,
    auth_user_id,
    user_name: data.user_name,
    currency: data.currency || 'INR',
    monthly_salary: data.monthly_salary,
    other_income: data.other_income || 0,
    total_income
  };
}

function getUserProfile(auth_user_id: number) {
  const stmt = db.prepare('SELECT * FROM user_profile WHERE auth_user_id = ?');
  return stmt.get(auth_user_id);
}

function updateLastLogin(auth_user_id: number) {
  const stmt = db.prepare('UPDATE auth_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(auth_user_id);
}

function findUserByPhone(phone: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE phone = ?');
  return stmt.get(phone);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(auth_user_id: number, otp: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const stmt = db.prepare('UPDATE auth_users SET otp = ?, otp_expires_at = ? WHERE id = ?');
  stmt.run(otp, expiresAt.toISOString(), auth_user_id);
}

function verifyOTP(auth_user_id: number, otp: string): boolean {
  const stmt = db.prepare('SELECT otp, otp_expires_at FROM auth_users WHERE id = ?');
  const user: any = stmt.get(auth_user_id);
  
  if (!user || !user.otp || !user.otp_expires_at) {
    return false;
  }
  
  const isExpired = new Date(user.otp_expires_at) < new Date();
  return user.otp === otp && !isExpired;
}

function clearOTP(auth_user_id: number) {
  const stmt = db.prepare('UPDATE auth_users SET otp = NULL, otp_expires_at = NULL, is_verified = 1 WHERE id = ?');
  stmt.run(auth_user_id);
}

// ============================================
// ADMIN & ACTIVITY TRACKING
// ============================================
function logActivity(user_id: number | null, action_type: string, action_description: string, ip_address?: string, user_agent?: string) {
  try {
    const stmt = db.prepare(`
      INSERT INTO activity_logs (user_id, action_type, action_description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(user_id, action_type, action_description, ip_address, user_agent);
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}

function isAdmin(auth_user_id: number): boolean {
  try {
    const stmt = db.prepare('SELECT is_admin FROM auth_users WHERE id = ?');
    const user: any = stmt.get(auth_user_id);
    return user && user.is_admin === 1;
  } catch (error) {
    return false;
  }
}

function getUserDataSummary(auth_user_id: number) {
  try {
    // Count user's loans
    const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans WHERE user_id = ?').get(auth_user_id);
    
    // Count user's investments
    const investmentCount = db.prepare('SELECT COUNT(*) as count FROM investments WHERE user_id = ?').get(auth_user_id);
    
    // Count monthly records
    const recordCount = db.prepare('SELECT COUNT(*) as count FROM monthly_records WHERE user_id = ?').get(auth_user_id);
    
    // Get total loan amount
    const totalLoans = db.prepare('SELECT SUM(principal_amount) as total FROM loans WHERE user_id = ? AND status = "active"').get(auth_user_id);
    
    // Get total investment value
    const totalInvestments = db.prepare('SELECT SUM(current_value) as total FROM investments WHERE user_id = ? AND status = "active"').get(auth_user_id);
    
    return {
      loans: loanCount?.count || 0,
      investments: investmentCount?.count || 0,
      monthly_records: recordCount?.count || 0,
      total_loan_amount: totalLoans?.total || 0,
      total_investment_value: totalInvestments?.total || 0
    };
  } catch (error) {
    console.error('Error getting user data summary:', error);
    return null;
  }
}

// ============================================
// DATABASE INITIALIZATION
// ============================================
function initializeDatabase() {
  // Authentication Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      auth_method TEXT NOT NULL DEFAULT 'password',
      otp TEXT,
      otp_expires_at DATETIME,
      is_verified INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin Activity Logs table
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

  // Create index on activity_logs for faster queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at)`);

  // User Profile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth_user_id INTEGER UNIQUE,
      user_name TEXT NOT NULL,
      currency TEXT DEFAULT 'INR',
      monthly_salary REAL NOT NULL,
      other_income REAL DEFAULT 0,
      total_income REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `);

  // Loans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      loan_name TEXT NOT NULL,
      loan_type TEXT NOT NULL,
      principal_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      loan_term_months INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      monthly_payment REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      total_interest REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profile(id)
    )
  `);

  // Monthly Records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      salary REAL NOT NULL,
      other_income REAL DEFAULT 0,
      total_income REAL NOT NULL,
      total_loan_payment REAL DEFAULT 0,
      other_expenses REAL DEFAULT 0,
      savings REAL DEFAULT 0,
      investments REAL DEFAULT 0,
      emergency_fund REAL DEFAULT 0,
      credit_card REAL DEFAULT 0,
      rent REAL DEFAULT 0,
      food REAL DEFAULT 0,
      transport REAL DEFAULT 0,
      utilities REAL DEFAULT 0,
      entertainment REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profile(id),
      UNIQUE(user_id, month, year)
    )
  `);

  // Monthly Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profile(id)
    )
  `);

  // Extra Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS extra_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    )
  `);

  // Investments table - Track SIP, ESPP, Mutual Funds, etc.
  db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      principal REAL NOT NULL DEFAULT 0,
      monthly_contribution REAL NOT NULL,
      expected_return_rate REAL NOT NULL,
      start_date TEXT NOT NULL,
      tenure_months INTEGER NOT NULL,
      current_value REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profile(id)
    )
  `);

  // Add ESPP-specific columns to investments table
  try {
    const investmentCols = db.prepare("PRAGMA table_info(investments)").all() as any[];
    
    if (!investmentCols.find(col => col.name === 'purchase_price')) {
      db.exec(`ALTER TABLE investments ADD COLUMN purchase_price REAL DEFAULT 0`);
      console.log('Added purchase_price column to investments table');
    }
    if (!investmentCols.find(col => col.name === 'current_stock_price')) {
      db.exec(`ALTER TABLE investments ADD COLUMN current_stock_price REAL DEFAULT 0`);
      console.log('Added current_stock_price column to investments table');
    }
    if (!investmentCols.find(col => col.name === 'discount_percent')) {
      db.exec(`ALTER TABLE investments ADD COLUMN discount_percent REAL DEFAULT 0`);
      console.log('Added discount_percent column to investments table');
    }
    if (!investmentCols.find(col => col.name === 'shares_per_month')) {
      db.exec(`ALTER TABLE investments ADD COLUMN shares_per_month REAL DEFAULT 0`);
      console.log('Added shares_per_month column to investments table');
    }
    if (!investmentCols.find(col => col.name === 'vesting_months')) {
      db.exec(`ALTER TABLE investments ADD COLUMN vesting_months INTEGER DEFAULT 0`);
      console.log('Added vesting_months column to investments table');
    }
    if (!investmentCols.find(col => col.name === 'lookback_months')) {
      db.exec(`ALTER TABLE investments ADD COLUMN lookback_months INTEGER DEFAULT 6`);
      console.log('Added lookback_months column to investments table');
    }
  } catch (error) {
    console.log('ESPP column migration check completed');
  }

  // Performance indexes
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_records_user ON monthly_records(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_records_user_date ON monthly_records(user_id, year, month)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user ON monthly_expenses(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_date ON monthly_expenses(user_id, year, month)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_extra_payments_loan ON extra_payments(loan_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id)`);
    console.log('✅ Performance indexes created successfully');
  } catch (error) {
    console.log('Indexes may already exist');
  }

  console.log('Database initialized successfully');
}

// Initialize database
initializeDatabase();

// Middleware - Dynamic CORS based on environment
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'http://localhost:3000',  // Alternative dev port
];

// In production, allow requests from same origin (Cloud Run serves both frontend and backend)
if (process.env.NODE_ENV === 'production') {
  // Cloud Run URL pattern
  const cloudRunUrl = process.env.CLOUD_RUN_URL || 'https://wealthflow-325113757905.us-central1.run.app';
  allowedOrigins.push(cloudRunUrl);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In production on Cloud Run, allow same-origin requests
    if (process.env.NODE_ENV === 'production' && !origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());

// Add headers for Google Sign-In compatibility
app.use((req: any, res: any, next: any) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Session management
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: process.cwd()
  }) as any,
  secret: 'loan-tracker-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

// Initialize database
initializeDatabase();

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {

  const origin = req.headers.origin;
  
  // In production, allow same-origin
  if (process.env.NODE_ENV === 'production' && origin && !origin.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Expose-Headers', 'set-cookie');
  res.sendStatus(204); // No Content
});

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    authUserId?: number;
    userProfileId?: number;
    isAuthenticated?: boolean;
  }
}

// Helper function to calculate loan amortization
function calculateAmortization(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string
) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const schedule = [];
  let balance = principal;
  let totalInterest = 0;
  const start = new Date(startDate);

  for (let month = 1; month <= months; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;

    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + month - 1);

    schedule.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      totalInterest,
    });
  }

  return { schedule, monthlyPayment, totalInterest };
}

// API Routes

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register with username/password
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone, user_name, monthly_salary, other_income, currency } = req.body;

    // Validation
    if (!username || !password || !user_name || !monthly_salary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create auth user
    const authUser: any = await createAuthUser({
      username,
      email,
      phone,
      password,
      auth_method: 'password'
    });

    // Create user profile
    const profile = createUserProfile(authUser.id, {
      user_name,
      monthly_salary: Number(monthly_salary),
      other_income: Number(other_income || 0),
      currency: currency || 'INR'
    });

    // Set session
    req.session.authUserId = authUser.id;
    req.session.userProfileId = Number(profile.id);
    req.session.isAuthenticated = true;

    res.json({
      success: true,
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        profile: profile
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Login with username/password
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password required' });
    }

    // Find user by username OR email
    let authUser: any = findUserByUsername(username);
    
    // If not found by username, try email
    if (!authUser) {
      const stmt = db.prepare('SELECT * FROM auth_users WHERE email = ?');
      authUser = stmt.get(username);
    }
    
    if (!authUser) {
      logActivity(null, 'login_failed', `Failed login attempt for: ${username}`, req.ip, req.get('user-agent'));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await verifyPassword(password, authUser.password_hash);
    if (!isValid) {
      logActivity(authUser.id, 'login_failed', 'Invalid password', req.ip, req.get('user-agent'));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get or create profile
    let profile: any = getUserProfile(authUser.id);
    if (!profile) {
      // Create default profile if not exists
      profile = createUserProfile(authUser.id, {
        user_name: authUser.username,
        monthly_salary: 0,
        other_income: 0
      });
    }

    // Update last login
    updateLastLogin(authUser.id);

    // Log successful login
    logActivity(authUser.id, 'login_success', 'User logged in successfully', req.ip, req.get('user-agent'));

    // Store in session
    req.session.userId = authUser.id;
    req.session.save();

    res.json({
      success: true,
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        phone: authUser.phone,
        auth_method: authUser.auth_method,
        is_admin: authUser.is_admin === 1
      },
      profile: {
        id: profile.id,
        user_name: profile.user_name,
        currency: profile.currency,
        monthly_salary: profile.monthly_salary,
        other_income: profile.other_income,
        total_income: profile.total_income
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

// Request OTP for phone login
app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Find or create user with phone
    let authUser: any = findUserByPhone(phone);
    if (!authUser) {
      // Create new user with phone
      authUser = await createAuthUser({
        phone,
        auth_method: 'otp'
      });
    }

    // Generate and save OTP
    const otp = generateOTP();
saveOTP(authUser.id, otp);

    // In production, send OTP via SMS service (Twilio, etc.)
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone',
      // Remove in production - only for testing
      otp_debug: otp
    });
  } catch (error: any) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, user_name, monthly_salary, other_income, currency } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Find user
    const authUser: any = findUserByPhone(phone);
    if (!authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP
    const isValid = verifyOTP(authUser.id, otp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP and mark as verified
clearOTP(authUser.id);

    // Get or create profile
    let profile: any = getUserProfile(authUser.id);
    if (!profile && user_name && monthly_salary) {
      // Create profile for new user
      profile = createUserProfile(authUser.id, {
        user_name,
        monthly_salary: Number(monthly_salary),
        other_income: Number(other_income || 0),
        currency: currency || 'INR'
      });
    }

    // Update last login
updateLastLogin(authUser.id);

    // Set session
    req.session.authUserId = authUser.id;
    req.session.userProfileId = profile?.id;
    req.session.isAuthenticated = true;

    res.json({
      success: true,
      needsProfile: !profile,
      user: {
        id: authUser.id,
        phone: authUser.phone,
        profile: profile
      }
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Google OAuth login (simplified - you'll need to add Google OAuth SDK)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential token required' });
    }

    // Verify the Google token
    const GOOGLE_CLIENT_ID = '46815400135-ovvd2t9lghb3m2sr2anv6sup1rq66ckn.apps.googleusercontent.com';
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const google_id = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0];

    if (!google_id || !email) {
      return res.status(400).json({ error: 'Google ID and email required' });
    }

    // Find user by Google ID first
    let authUser: any = findUserByGoogleId(google_id);
    
    // If not found by Google ID, check by email (user might have registered with password before)
    if (!authUser) {
      const stmt = db.prepare('SELECT * FROM auth_users WHERE email = ?');
      authUser = stmt.get(email);
      
      if (authUser) {
        // User exists with this email - link their Google ID
        const updateStmt = db.prepare('UPDATE auth_users SET google_id = ?, auth_method = ? WHERE id = ?');
        updateStmt.run(google_id, 'google', authUser.id);
        authUser.google_id = google_id;
        authUser.auth_method = 'google';
      } else {
        // New user - create account
        authUser = await createAuthUser({
          google_id,
          email,
          username: email.split('@')[0] + '_google',
          auth_method: 'google'
        });
      }
    }

    // Get or create profile
    let profile: any = getUserProfile(authUser.id);
    if (!profile) {
      profile = createUserProfile(authUser.id, {
        user_name: name || email.split('@')[0],
        monthly_salary: 0,
        other_income: 0,
        currency: 'INR'
      });
    }

    // Update last login
updateLastLogin(authUser.id);

    // Set session
    req.session.authUserId = authUser.id;
    req.session.userProfileId = Number(profile.id);
    req.session.isAuthenticated = true;

    res.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        profile: profile
      }
    });
  } catch (error: any) {
    // Suppress UNIQUE constraint errors (user already exists, which is handled above)
    if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('Google auth error:', error);
    }
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Check authentication status
app.get('/api/auth/status', (req: Request, res: Response) => {
  if (req.session.isAuthenticated && req.session.authUserId) {
    const authUser: any = db.prepare('SELECT id, username, email, phone, auth_method FROM auth_users WHERE id = ?')
      .get(req.session.authUserId);
    const profile: any = getUserProfile(req.session.authUserId);

    res.json({
      isAuthenticated: true,
      user: {
        ...authUser,
        profile
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    logActivity(userId, 'logout', 'User logged out', req.ip, req.get('user-agent'));
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Middleware to check admin access
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!isAdmin(req.session.userId)) {
    logActivity(req.session.userId, 'admin_access_denied', 'Attempted to access admin endpoint', req.ip, req.get('user-agent'));
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Get all users with their data summary (ADMIN ONLY)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    logActivity(req.session.userId, 'admin_view_users', 'Admin viewed all users', req.ip, req.get('user-agent'));
    
    const stmt = db.prepare(`
      SELECT 
        au.id,
        au.username,
        au.email,
        au.phone,
        au.auth_method,
        au.is_admin,
        au.is_verified,
        au.last_login,
        au.created_at,
        up.user_name,
        up.currency,
        up.monthly_salary,
        up.other_income,
        up.total_income
      FROM auth_users au
      LEFT JOIN user_profile up ON au.id = up.auth_user_id
      ORDER BY au.created_at DESC
    `);
    
    const users = stmt.all();
    
    // Add data summary for each user
    const usersWithData = users.map(user => {
      const dataSummary = getUserDataSummary(user.id);
      return {
        ...user,
        data_summary: dataSummary
      };
    });
    
    res.json({ users: usersWithData });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user details (ADMIN ONLY)
app.get('/api/admin/users/:userId', requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    
    logActivity(req.session.userId, 'admin_view_user', `Admin viewed user ${userId}`, req.ip, req.get('user-agent'));
    
    // Get user basic info
    const userStmt = db.prepare(`
      SELECT 
        au.*,
        up.*
      FROM auth_users au
      LEFT JOIN user_profile up ON au.id = up.auth_user_id
      WHERE au.id = ?
    `);
    const user = userStmt.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's loans
    const loansStmt = db.prepare('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC');
    const loans = loansStmt.all(userId);
    
    // Get user's investments
    const investmentsStmt = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC');
    const investments = investmentsStmt.all(userId);
    
    // Get user's monthly records
    const recordsStmt = db.prepare('SELECT * FROM monthly_records WHERE user_id = ? ORDER BY year DESC, month DESC LIMIT 12');
    const monthly_records = recordsStmt.all(userId);
    
    // Get user's activity logs (last 50)
    const activityStmt = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    const activity_logs = activityStmt.all(userId);
    
    res.json({
      user,
      loans,
      investments,
      monthly_records,
      activity_logs,
      data_summary: getUserDataSummary(parseInt(userId))
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Get all activity logs (ADMIN ONLY)
app.get('/api/admin/activity-logs', requireAdmin, (req, res) => {
  try {
    const { limit = 100, user_id, action_type } = req.query;
    
    logActivity(req.session.userId, 'admin_view_logs', 'Admin viewed activity logs', req.ip, req.get('user-agent'));
    
    let query = `
      SELECT 
        al.*,
        au.username,
        au.email
      FROM activity_logs al
      LEFT JOIN auth_users au ON al.user_id = au.id
      WHERE 1=1
    `;
    const params = [];
    
    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }
    
    if (action_type) {
      query += ' AND al.action_type = ?';
      params.push(action_type);
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));
    
    const stmt = db.prepare(query);
    const logs = stmt.all(...params);
    
    res.json({ logs, total: logs.length });
  } catch (error) {
    console.error('Admin activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get platform statistics (ADMIN ONLY)
app.get('/api/admin/statistics', requireAdmin, (req, res) => {
  try {
    logActivity(req.session.userId, 'admin_view_stats', 'Admin viewed platform statistics', req.ip, req.get('user-agent'));
    
    // Total users
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM auth_users').get();
    
    // Active users (logged in within last 30 days)
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM auth_users WHERE last_login >= datetime("now", "-30 days")').get();
    
    // New users (registered within last 7 days)
    const newUsers = db.prepare('SELECT COUNT(*) as count FROM auth_users WHERE created_at >= datetime("now", "-7 days")').get();
    
    // Total loans
    const totalLoans = db.prepare('SELECT COUNT(*) as count, SUM(principal_amount) as total_amount FROM loans WHERE status = "active"').get();
    
    // Total investments
    const totalInvestments = db.prepare('SELECT COUNT(*) as count, SUM(current_value) as total_value FROM investments WHERE status = "active"').get();
    
    // Activity by action type (last 30 days)
    const activityByType = db.prepare(`
      SELECT action_type, COUNT(*) as count 
      FROM activity_logs 
      WHERE created_at >= datetime("now", "-30 days")
      GROUP BY action_type
      ORDER BY count DESC
    `).all();
    
    // Daily active users (last 7 days)
    const dailyActiveUsers = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM activity_logs
      WHERE created_at >= datetime("now", "-7 days")
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    
    // Top users by activity
    const topUsers = db.prepare(`
      SELECT 
        al.user_id,
        au.username,
        au.email,
        COUNT(*) as activity_count
      FROM activity_logs al
      LEFT JOIN auth_users au ON al.user_id = au.id
      WHERE al.created_at >= datetime("now", "-30 days")
      GROUP BY al.user_id
      ORDER BY activity_count DESC
      LIMIT 10
    `).all();
    
    res.json({
      users: {
        total: totalUsers.count,
        active: activeUsers.count,
        new: newUsers.count
      },
      loans: {
        count: totalLoans.count,
        total_amount: totalLoans.total_amount || 0
      },
      investments: {
        count: totalInvestments.count,
        total_value: totalInvestments.total_value || 0
      },
      activity_by_type: activityByType,
      daily_active_users: dailyActiveUsers,
      top_users: topUsers
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Make a user admin (ADMIN ONLY)
app.post('/api/admin/make-admin/:userId', requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    
    logActivity(req.session.userId, 'admin_grant', `Admin granted admin rights to user ${userId}`, req.ip, req.get('user-agent'));
    
    const stmt = db.prepare('UPDATE auth_users SET is_admin = 1 WHERE id = ?');
    stmt.run(userId);
    
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Remove admin rights (ADMIN ONLY)
app.post('/api/admin/remove-admin/:userId', requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent removing own admin rights
    if (parseInt(userId) === req.session.userId) {
      return res.status(400).json({ error: 'Cannot remove your own admin rights' });
    }
    
    logActivity(req.session.userId, 'admin_revoke', `Admin revoked admin rights from user ${userId}`, req.ip, req.get('user-agent'));
    
    const stmt = db.prepare('UPDATE auth_users SET is_admin = 0 WHERE id = ?');
    stmt.run(userId);
    
    res.json({ success: true, message: 'Admin rights removed' });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================
// USER PROFILE ROUTES
// ============================================

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT 
        p.*,
        a.username,
        a.email,
        a.phone,
        a.auth_method
      FROM user_profile p
      LEFT JOIN auth_users a ON p.auth_user_id = a.id
      ORDER BY p.id DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    let profile;
    
    if (user_id) {
      profile = db.prepare(`
        SELECT 
          p.*,
          a.username,
          a.email,
          a.phone,
          a.auth_method
        FROM user_profile p
        LEFT JOIN auth_users a ON p.auth_user_id = a.id
        WHERE p.id = ?
      `).get(Number(user_id));
    } else {
      profile = db.prepare(`
        SELECT 
          p.*,
          a.username,
          a.email,
          a.phone,
          a.auth_method
        FROM user_profile p
        LEFT JOIN auth_users a ON p.auth_user_id = a.id
        ORDER BY p.id DESC LIMIT 1
      `).get();
    }
    
    res.json(profile || null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/profile', (req: Request, res: Response) => {
  try {
    const { user_name, currency, monthly_salary, other_income } = req.body;
    const total_income = monthly_salary + (other_income || 0);

    const stmt = db.prepare(`
      INSERT INTO user_profile (user_name, currency, monthly_salary, other_income, total_income)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_name, currency || 'INR', monthly_salary, other_income || 0, total_income);

    res.json({ id: result.lastInsertRowid, user_name, currency: currency || 'INR', monthly_salary, other_income, total_income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

app.put('/api/profile/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_name, currency, monthly_salary, other_income, email, phone } = req.body;
    
    console.log('Updating profile:', { id, user_name, currency, monthly_salary, other_income, email, phone });
    
    const total_income = Number(monthly_salary) + Number(other_income || 0);

    // Update user_profile table
    const profileStmt = db.prepare(`
      UPDATE user_profile 
      SET user_name = ?, currency = ?, monthly_salary = ?, other_income = ?, total_income = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    profileStmt.run(user_name, currency || 'INR', Number(monthly_salary), Number(other_income || 0), total_income, Number(id));

    // Get auth_user_id for this profile
    const profile: any = db.prepare('SELECT auth_user_id FROM user_profile WHERE id = ?').get(Number(id));
    
    // Update email and phone in auth_users table if provided
    if (profile && profile.auth_user_id) {
      const authUpdates: string[] = [];
      const authParams: any[] = [];
      
      if (email !== undefined && email !== null) {
        authUpdates.push('email = ?');
        authParams.push(email);
      }
      if (phone !== undefined && phone !== null) {
        authUpdates.push('phone = ?');
        authParams.push(phone);
      }
      
      if (authUpdates.length > 0) {
        authParams.push(profile.auth_user_id);
        const authStmt = db.prepare(`UPDATE auth_users SET ${authUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        authStmt.run(...authParams);
      }
    }

    res.json({ 
      id: Number(id), 
      user_name, 
      currency: currency || 'INR', 
      monthly_salary: Number(monthly_salary), 
      other_income: Number(other_income || 0), 
      total_income,
      email,
      phone
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: String(error) });
  }
});

// Income Sources Routes
app.get('/api/income-sources', (req: Request, res: Response) => {
  try {
    const sources = db.prepare('SELECT * FROM income_sources').all();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch income sources' });
  }
});

app.post('/api/income-sources', (req: Request, res: Response) => {
  try {
    const { source_name, amount, frequency } = req.body;
    const stmt = db.prepare(`
      INSERT INTO income_sources (source_name, amount, frequency)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(source_name, amount, frequency);
    res.json({ id: result.lastInsertRowid, source_name, amount, frequency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add income source' });
  }
});

// Loan Routes
app.get('/api/loans', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    let loans: any[];
    
    if (user_id) {
      loans = db.prepare('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC').all(Number(user_id));
    } else {
      loans = db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all();
    }
    
    // Add both field name formats for compatibility
    const mappedLoans = loans.map(loan => ({
      ...loan,
      name: loan.loan_name,
      type: loan.loan_type,
      principal: loan.principal_amount,
      tenure: loan.loan_term_months
    }));
    res.json(mappedLoans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

app.post('/api/loans', (req: Request, res: Response) => {
  try {
    // Accept both old and new field names
    const {
      user_id,
      loan_name,
      name,
      loan_type,
      type,
      principal_amount,
      principal,
      interest_rate,
      loan_term_months,
      tenure,
      start_date,
      monthly_payment,
      status
    } = req.body;

    const userId = user_id || 1; // Default to user 1 if not provided
    const loanName = loan_name || name;
    const loanType = loan_type || type;
    const principalAmount = principal_amount || principal;
    const loanTermMonths = loan_term_months || tenure;
    
    // If monthly_payment is provided, use it; otherwise calculate
    let monthlyPaymentValue = monthly_payment;
    let totalInterest = 0;
    
    if (!monthly_payment) {
      const calc = calculateAmortization(
        principalAmount,
        interest_rate,
        loanTermMonths,
        start_date
      );
      monthlyPaymentValue = calc.monthlyPayment;
      totalInterest = calc.totalInterest;
    } else {
      // Estimate total interest if monthly payment is provided
      totalInterest = (monthly_payment * loanTermMonths) - principalAmount;
    }

    const stmt = db.prepare(`
      INSERT INTO loans (
        user_id, loan_name, loan_type, principal_amount, interest_rate,
        loan_term_months, start_date, monthly_payment, 
        remaining_balance, total_interest, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      loanName,
      loanType,
      principalAmount,
      interest_rate,
      loanTermMonths,
      start_date,
      monthlyPaymentValue,
      principalAmount,
      totalInterest,
      status || 'active'
    );

    res.json({
      id: result.lastInsertRowid,
      name: loanName,
      loan_name: loanName,
      type: loanType,
      loan_type: loanType,
      principal: principalAmount,
      principal_amount: principalAmount,
      interest_rate: interest_rate,
      tenure: loanTermMonths,
      loan_term_months: loanTermMonths,
      monthly_payment: monthlyPaymentValue,
      total_interest: totalInterest,
      status: status || 'active'
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan', details: String(error) });
  }
});

app.get('/api/loans/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan: any = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    // Add both field name formats for compatibility
    const mappedLoan = {
      ...loan,
      name: loan.loan_name,
      type: loan.loan_type,
      principal: loan.principal_amount,
      tenure: loan.loan_term_months
    };
    res.json(mappedLoan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loan' });
  }
});

app.delete('/api/loans/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Deleting loan:', id);
    db.prepare('DELETE FROM loans WHERE id = ?').run(Number(id));
    db.prepare('DELETE FROM payment_history WHERE loan_id = ?').run(Number(id));
    db.prepare('DELETE FROM extra_payments WHERE loan_id = ?').run(Number(id));
    res.json({ message: 'Loan deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ error: 'Failed to delete loan', details: String(error) });
  }
});

// Loan Schedule Route
app.get('/api/loans/:id/schedule', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan: any = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const { schedule } = calculateAmortization(
      loan.principal_amount,
      loan.interest_rate,
      loan.loan_term_months,
      loan.start_date
    );

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate schedule' });
  }
});

// Dashboard Analytics Route
app.get('/api/dashboard/analytics', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    let loans: any[];
    let profile: any;
    
    if (user_id) {
      loans = db.prepare("SELECT * FROM loans WHERE user_id = ? AND status = 'active'").all(Number(user_id));
      profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(Number(user_id));
    } else {
      loans = db.prepare("SELECT * FROM loans WHERE status = 'active'").all();
      profile = db.prepare('SELECT * FROM user_profile ORDER BY id DESC LIMIT 1').get();
    }

    const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
    const totalInterest = loans.reduce((sum, loan) => sum + loan.total_interest, 0);
    const totalDebt = totalPrincipal + totalInterest;
    const monthlyPayments = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);

    const totalIncome = profile ? profile.total_income : 0;
    const availableAfterLoans = totalIncome - monthlyPayments;
    const debtToIncomeRatio = totalIncome > 0 ? (monthlyPayments / totalIncome) * 100 : 0;

    // Calculate when all loans will be cleared
    let maxEndDate = new Date();
    loans.forEach((loan) => {
      const endDate = new Date(loan.start_date);
      endDate.setMonth(endDate.getMonth() + loan.loan_term_months);
      if (endDate > maxEndDate) {
        maxEndDate = endDate;
      }
    });

    const today = new Date();
    const monthsRemaining = Math.max(
      0,
      (maxEndDate.getFullYear() - today.getFullYear()) * 12 +
        (maxEndDate.getMonth() - today.getMonth())
    );

    // Smart recommendations with loan priority
    const recommendations = [];
    
    // DTI warnings
    if (debtToIncomeRatio > 43) {
      recommendations.push({
        type: 'warning',
        message: '⚠️ Your debt-to-income ratio is high (>43%). Consider reducing expenses or increasing income.',
      });
    } else if (debtToIncomeRatio > 36) {
      recommendations.push({
        type: 'warning',
        message: '⚠️ DTI ratio is above ideal (36%). Monitor your debt levels closely.',
      });
    }
    
    // Low remaining income
    if (availableAfterLoans < totalIncome * 0.2) {
      recommendations.push({
        type: 'warning',
        message: '⚠️ Less than 20% of income remains after loan payments. Budget carefully and avoid new debt.',
      });
    }
    
    // Good health
    if (availableAfterLoans > totalIncome * 0.5) {
      recommendations.push({
        type: 'success',
        message: '✅ Good financial health! Consider extra payments to clear loans faster and save on interest.',
      });
    }
    
    // Loan priority recommendations (highest interest first)
    if (loans.length > 1) {
      const sortedByInterest = [...loans].sort((a, b) => b.interest_rate - a.interest_rate);
      recommendations.push({
        type: 'info',
        message: `🎯 Priority: Focus on "${sortedByInterest[0].loan_name}" first (highest interest: ${sortedByInterest[0].interest_rate}%). Pay minimum on others.`,
      });
      
      // Show order
      const order = sortedByInterest.map((l, i) => `${i + 1}. ${l.loan_name} (${l.interest_rate}%)`).join(', ');
      recommendations.push({
        type: 'info',
        message: `📋 Recommended payoff order: ${order}`,
      });
    }
    
    // Emergency fund recommendation
    const emergencyFundTarget = totalIncome * 6;
    recommendations.push({
      type: 'info',
      message: `💰 Emergency Fund Target: Build ${emergencyFundTarget.toLocaleString()} (6 months of income) before aggressive loan payoff.`,
    });

    res.json({
      summary: {
        totalLoans: loans.length,
        totalPrincipal,
        totalInterest,
        totalDebt,
        monthlyPayments,
        totalIncome,
        availableAfterLoans,
        debtToIncomeRatio,
        allLoansClearedBy: maxEndDate.toISOString().split('T')[0],
        monthsRemaining,
        yearsRemaining: Math.ceil(monthsRemaining / 12),
      },
      loans: loans.map((loan) => ({
        id: loan.id,
        name: loan.loan_name,
        type: loan.loan_type,
        principal: loan.principal_amount,
        interest: loan.total_interest,
        monthlyPayment: loan.monthly_payment,
        tenure: loan.loan_term_months,
        interestRate: loan.interest_rate,
        clearedBy: new Date(
          new Date(loan.start_date).setMonth(
            new Date(loan.start_date).getMonth() + loan.loan_term_months
          )
        ).toISOString().split('T')[0],
      })),
      recommendations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Monthly Records Routes
app.get('/api/monthly-records', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    let records: any[];
    
    if (user_id) {
      records = db.prepare('SELECT * FROM monthly_records WHERE user_id = ? ORDER BY year DESC, month DESC').all(Number(user_id));
    } else {
      records = db.prepare('SELECT * FROM monthly_records ORDER BY year DESC, month DESC').all();
    }
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly records' });
  }
});

app.post('/api/monthly-records', (req: Request, res: Response) => {
  try {
    const { user_id, month, year, salary, other_income, other_expenses, investments, emergency_fund, credit_card, 
            rent, food, transport, utilities, entertainment, notes } = req.body;
    const userId = user_id || 1; // Default to user 1 if not provided
    const total_income = salary + (other_income || 0);
    
    // Calculate total loan payment for THIS USER'S active loans
    const loans: any[] = db.prepare("SELECT * FROM loans WHERE user_id = ? AND status = 'active'").all(userId);
    const total_loan_payment = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);
    
    // Calculate savings (income - loans - expenses - investments - emergency fund)
    const savings = total_income - total_loan_payment - (other_expenses || 0) - (investments || 0) - (emergency_fund || 0);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO monthly_records (
        user_id, month, year, salary, other_income, total_income, total_loan_payment, other_expenses, 
        investments, emergency_fund, credit_card, rent, food, transport, utilities, entertainment, savings, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId, month, year, salary, other_income || 0, total_income, total_loan_payment, other_expenses || 0,
      investments || 0, emergency_fund || 0, credit_card || 0, rent || 0, food || 0, transport || 0, 
      utilities || 0, entertainment || 0, savings, notes || ''
    );

    res.json({
      id: result.lastInsertRowid, user_id: userId, month, year, salary, other_income, total_income, total_loan_payment,
      other_expenses, investments, emergency_fund, credit_card, rent, food, transport, utilities, entertainment, savings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create monthly record' });
  }
});

app.put('/api/monthly-records/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, month, year, salary, other_income, other_expenses, investments, emergency_fund, credit_card, 
            rent, food, transport, utilities, entertainment, notes } = req.body;
    const userId = user_id || 1;
    const total_income = salary + (other_income || 0);
    
    // Calculate total loan payment for this user's active loans
    const loans: any[] = db.prepare("SELECT * FROM loans WHERE user_id = ? AND status = 'active'").all(userId);
    const total_loan_payment = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);
    
    // Calculate savings
    const savings = total_income - total_loan_payment - (other_expenses || 0) - (investments || 0) - (emergency_fund || 0);

    const stmt = db.prepare(`
      UPDATE monthly_records 
      SET month = ?, year = ?, salary = ?, other_income = ?, total_income = ?, total_loan_payment = ?, 
          other_expenses = ?, investments = ?, emergency_fund = ?, credit_card = ?, 
          rent = ?, food = ?, transport = ?, utilities = ?, entertainment = ?, savings = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(
      month, year, salary, other_income || 0, total_income, total_loan_payment, other_expenses || 0,
      investments || 0, emergency_fund || 0, credit_card || 0, rent || 0, food || 0, transport || 0,
      utilities || 0, entertainment || 0, savings, notes || '', Number(id)
    );

    res.json({
      id: Number(id), month, year, salary, other_income, total_income, total_loan_payment,
      other_expenses, investments, emergency_fund, credit_card, savings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update monthly record' });
  }
});

app.delete('/api/monthly-records/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM monthly_records WHERE id = ?');
    stmt.run(Number(id));
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete monthly record' });
  }
});

// Loan Edit Route
app.put('/api/loans/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Accept both old and new field names
    const {
      loan_name,
      name,
      loan_type,
      type,
      principal_amount,
      principal,
      interest_rate,
      loan_term_months,
      tenure,
      start_date,
      monthly_payment,
      status
    } = req.body;

    const loanName = loan_name || name;
    const loanType = loan_type || type;
    const principalAmount = Number(principal_amount || principal);
    const interestRate = Number(interest_rate);
    const loanTermMonths = Number(loan_term_months || tenure);
    const loanId = Number(id);
    
    console.log('Updating loan:', { id: loanId, loanName, loanType, principalAmount, interestRate, loanTermMonths });

    if (!loanName || !loanType || !principalAmount || !interestRate || !loanTermMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If monthly_payment is provided, use it; otherwise calculate
    let monthlyPaymentValue = monthly_payment ? Number(monthly_payment) : 0;
    let totalInterest = 0;
    
    if (!monthly_payment) {
      const calc = calculateAmortization(
        principalAmount,
        interestRate,
        loanTermMonths,
        start_date || new Date().toISOString().split('T')[0]
      );
      monthlyPaymentValue = calc.monthlyPayment;
      totalInterest = calc.totalInterest;
    } else {
      // Estimate total interest if monthly payment is provided
      totalInterest = (monthlyPaymentValue * loanTermMonths) - principalAmount;
    }

    const stmt = db.prepare(`
      UPDATE loans 
      SET loan_name = ?, loan_type = ?, principal_amount = ?, interest_rate = ?, 
          loan_term_months = ?, start_date = ?, monthly_payment = ?, 
          total_interest = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      loanName, 
      loanType, 
      principalAmount, 
      interestRate, 
      loanTermMonths, 
      start_date || new Date().toISOString().split('T')[0], 
      monthlyPaymentValue, 
      totalInterest, 
      status || 'active', 
      loanId
    );

    console.log('✅ Loan updated successfully. Rows changed:', result.changes);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({ 
      id: loanId, 
      name: loanName,
      loan_name: loanName,
      type: loanType,
      loan_type: loanType,
      principal: principalAmount,
      principal_amount: principalAmount,
      interest_rate: interestRate,
      tenure: loanTermMonths,
      loan_term_months: loanTermMonths,
      monthly_payment: monthlyPaymentValue, 
      total_interest: totalInterest,
      status: status || 'active'
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ error: 'Failed to update loan', details: String(error) });
  }
});

// Goals Routes
app.get('/api/goals', (req: Request, res: Response) => {
  try {
    const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', (req: Request, res: Response) => {
  try {
    const { goal_name, target_amount, current_amount, target_date } = req.body;
    const stmt = db.prepare(`
      INSERT INTO goals (goal_name, target_amount, current_amount, target_date, status)
      VALUES (?, ?, ?, ?, 'active')
    `);
    const result = stmt.run(goal_name, target_amount, current_amount || 0, target_date || null);
    res.json({ id: result.lastInsertRowid, goal_name, target_amount, current_amount, target_date });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { goal_name, target_amount, current_amount, target_date, status } = req.body;
    const stmt = db.prepare(`
      UPDATE goals 
      SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(goal_name, target_amount, current_amount, target_date, status, id);
    res.json({ id, goal_name, target_amount, current_amount, target_date, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Monthly Expenses Routes
app.get('/api/expenses', (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM monthly_expenses';
    const params: any[] = [];
    
    if (month && year) {
      query += ' WHERE month = ? AND year = ?';
      params.push(month, Number(year));
    }
    
    query += ' ORDER BY created_at DESC';
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', (req: Request, res: Response) => {
  try {
    const { month, year, category, amount, description } = req.body;
    const stmt = db.prepare(`
      INSERT INTO monthly_expenses (month, year, category, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(month, year, category, amount, description || '');
    res.json({ id: result.lastInsertRowid, month, year, category, amount, description });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense', details: String(error) });
  }
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year, category, amount, description } = req.body;
    const stmt = db.prepare(`
      UPDATE monthly_expenses 
      SET month = ?, year = ?, category = ?, amount = ?, description = ?
      WHERE id = ?
    `);
    stmt.run(month, year, category, amount, description, Number(id));
    res.json({ id: Number(id), month, year, category, amount, description });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM monthly_expenses WHERE id = ?').run(Number(id));
    res.json({ message: 'Expense deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Expense Categories Routes
app.get('/api/expense-categories', (req: Request, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM expense_categories WHERE is_active = 1').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Extra Payments Routes
app.get('/api/extra-payments', (req: Request, res: Response) => {
  try {
    const { loan_id } = req.query;
    let query = 'SELECT * FROM extra_payments';
    const params: any[] = [];
    
    if (loan_id) {
      query += ' WHERE loan_id = ?';
      params.push(Number(loan_id));
    }
    
    query += ' ORDER BY payment_date DESC';
    const payments = db.prepare(query).all(...params);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching extra payments:', error);
    res.status(500).json({ error: 'Failed to fetch extra payments' });
  }
});

app.post('/api/extra-payments', (req: Request, res: Response) => {
  try {
    const { loan_id, payment_date, amount, notes } = req.body;
    
    // Add payment
    const stmt = db.prepare(`
      INSERT INTO extra_payments (loan_id, payment_date, amount, notes)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(loan_id, payment_date, amount, notes || '');
    
    // Update loan remaining balance
    const loan: any = db.prepare('SELECT remaining_balance FROM loans WHERE id = ?').get(loan_id);
    if (loan) {
      const newBalance = Math.max(0, loan.remaining_balance - amount);
      db.prepare('UPDATE loans SET remaining_balance = ? WHERE id = ?').run(newBalance, loan_id);
    }
    
    res.json({ id: result.lastInsertRowid, loan_id, payment_date, amount, notes });
  } catch (error) {
    console.error('Error creating extra payment:', error);
    res.status(500).json({ error: 'Failed to create extra payment', details: String(error) });
  }
});

app.delete('/api/extra-payments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get payment details before deleting
    const payment: any = db.prepare('SELECT * FROM extra_payments WHERE id = ?').get(Number(id));
    
    if (payment) {
      // Restore loan balance
      const loan: any = db.prepare('SELECT remaining_balance FROM loans WHERE id = ?').get(payment.loan_id);
      if (loan) {
        const newBalance = loan.remaining_balance + payment.amount;
        db.prepare('UPDATE loans SET remaining_balance = ? WHERE id = ?').run(newBalance, payment.loan_id);
      }
    }
    
    // Delete payment
    db.prepare('DELETE FROM extra_payments WHERE id = ?').run(Number(id));
    res.json({ message: 'Extra payment deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting extra payment:', error);
    res.status(500).json({ error: 'Failed to delete extra payment' });
  }
});

// ============================================
// INVESTMENT ROUTES
// ============================================

// Get all investments
app.get('/api/investments', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const userId = user_id ? Number(user_id) : 1;
    const investments = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Create investment
app.post('/api/investments', (req: Request, res: Response) => {
  try {
    const { user_id, name, type, principal, monthly_contribution, expected_return_rate, start_date, tenure_months, current_value, notes,
            purchase_price, current_stock_price, discount_percent, shares_per_month, vesting_months, lookback_months } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO investments (user_id, name, type, principal, monthly_contribution, expected_return_rate, start_date, tenure_months, current_value, notes,
                              purchase_price, current_stock_price, discount_percent, shares_per_month, vesting_months, lookback_months)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      user_id || 1,
      name,
      type,
      principal || 0,
      monthly_contribution,
      expected_return_rate,
      start_date,
      tenure_months,
      current_value || 0,
      notes || '',
      purchase_price || 0,
      current_stock_price || 0,
      discount_percent || 0,
      shares_per_month || 0,
      vesting_months || 24,
      lookback_months || 6
    );
    
    res.json({ 
      id: result.lastInsertRowid,
      user_id: user_id || 1,
      name, type, principal, monthly_contribution, expected_return_rate,
      start_date, tenure_months, current_value, notes
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// Update investment
app.put('/api/investments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, principal, monthly_contribution, expected_return_rate, start_date, tenure_months, current_value, status, notes,
            purchase_price, current_stock_price, discount_percent, shares_per_month, vesting_months, lookback_months } = req.body;
    
    const stmt = db.prepare(`
      UPDATE investments 
      SET name = ?, type = ?, principal = ?, monthly_contribution = ?, expected_return_rate = ?,
          start_date = ?, tenure_months = ?, current_value = ?, status = ?, notes = ?,
          purchase_price = ?, current_stock_price = ?, discount_percent = ?, shares_per_month = ?, vesting_months = ?, lookback_months = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(name, type, principal, monthly_contribution, expected_return_rate, start_date, tenure_months, current_value || 0, status, notes || '',
             purchase_price || 0, current_stock_price || 0, discount_percent || 0, shares_per_month || 0, vesting_months || 24, lookback_months || 6,
             Number(id));
    
    res.json({ id: Number(id), name, type, principal, monthly_contribution, expected_return_rate, start_date, tenure_months, current_value, status, notes });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

// Delete investment
app.delete('/api/investments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM investments WHERE id = ?').run(Number(id));
    res.json({ message: 'Investment deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

// ============================================
// IMPORT/EXPORT ROUTES
// ============================================

// Export loans as JSON or CSV
app.post('/api/loans/export', (req: Request, res: Response) => {
  try {
    const { user_id, format = 'json' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const loans: any[] = db.prepare('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC').all(Number(user_id));
    
    if (format === 'csv') {
      // Convert to CSV
      if (loans.length === 0) {
        return res.json({ data: '', format: 'csv' });
      }
      
      const headers = Object.keys(loans[0]).join(',');
      const rows = loans.map(loan => 
        Object.values(loan).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      res.json({ data: csv, format: 'csv', count: loans.length });
    } else {
      // Return as JSON
      res.json({ data: loans, format: 'json', count: loans.length });
    }
  } catch (error) {
    console.error('Error exporting loans:', error);
    res.status(500).json({ error: 'Failed to export loans' });
  }
});

// Import loans from JSON or CSV
app.post('/api/loans/import', (req: Request, res: Response) => {
  try {
    const { user_id, data, format = 'json' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!data) {
      return res.status(400).json({ error: 'Data required' });
    }

    let loans: any[] = [];
    
    if (format === 'csv') {
      // Parse CSV
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ error: 'Invalid CSV format' });
      }
      
      const headers = lines[0].split(',').map((h: string) => h.trim());
      loans = lines.slice(1).map((line: string) => {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map((v: string) => v.replace(/^"|"$/g, '').trim()) || [];
        const loan: any = {};
        headers.forEach((header: string, index: number) => {
          loan[header] = values[index] || '';
        });
        return loan;
      });
    } else {
      // Parse JSON
      loans = Array.isArray(data) ? data : [data];
    }

    let imported = 0;
    let errors = 0;

    for (const loan of loans) {
      try {
        // Skip loans without required fields
        if (!loan.loan_name && !loan.name) {
          errors++;
          continue;
        }

        const loanName = loan.loan_name || loan.name;
        const loanType = loan.loan_type || loan.type || 'personal';
        const principalAmount = Number(loan.principal_amount || loan.principal || 0);
        const interestRate = Number(loan.interest_rate || 0);
        const loanTermMonths = Number(loan.loan_term_months || loan.tenure || 12);
        const startDate = loan.start_date || new Date().toISOString().split('T')[0];
        const monthlyPayment = Number(loan.monthly_payment || 0);
        const status = loan.status || 'active';

        // Calculate monthly payment if not provided
        let monthlyPaymentValue = monthlyPayment;
        let totalInterest = 0;
        
        if (!monthlyPayment && principalAmount && interestRate && loanTermMonths) {
          const calc = calculateAmortization(principalAmount, interestRate, loanTermMonths, startDate);
          monthlyPaymentValue = calc.monthlyPayment;
          totalInterest = calc.totalInterest;
        } else {
          totalInterest = Number(loan.total_interest || (monthlyPayment * loanTermMonths) - principalAmount);
        }

        const stmt = db.prepare(`
          INSERT INTO loans (
            user_id, loan_name, loan_type, principal_amount, interest_rate,
            loan_term_months, start_date, monthly_payment, 
            remaining_balance, total_interest, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          Number(user_id),
          loanName,
          loanType,
          principalAmount,
          interestRate,
          loanTermMonths,
          startDate,
          monthlyPaymentValue,
          principalAmount,
          totalInterest,
          status
        );
        
        imported++;
      } catch (err) {
        console.error('Error importing loan:', err);
        errors++;
      }
    }

    res.json({ 
      success: true, 
      imported, 
      errors,
      message: `Successfully imported ${imported} loan(s). ${errors} error(s).`
    });
  } catch (error) {
    console.error('Error importing loans:', error);
    res.status(500).json({ error: 'Failed to import loans' });
  }
});

// Export investments as JSON or CSV
app.post('/api/investments/export', (req: Request, res: Response) => {
  try {
    const { user_id, format = 'json' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const investments: any[] = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC').all(Number(user_id));
    
    if (format === 'csv') {
      // Convert to CSV
      if (investments.length === 0) {
        return res.json({ data: '', format: 'csv' });
      }
      
      const headers = Object.keys(investments[0]).join(',');
      const rows = investments.map(inv => 
        Object.values(inv).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      res.json({ data: csv, format: 'csv', count: investments.length });
    } else {
      // Return as JSON
      res.json({ data: investments, format: 'json', count: investments.length });
    }
  } catch (error) {
    console.error('Error exporting investments:', error);
    res.status(500).json({ error: 'Failed to export investments' });
  }
});

// Import investments from JSON or CSV
app.post('/api/investments/import', (req: Request, res: Response) => {
  try {
    const { user_id, data, format = 'json' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!data) {
      return res.status(400).json({ error: 'Data required' });
    }

    let investments: any[] = [];
    
    if (format === 'csv') {
      // Parse CSV
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ error: 'Invalid CSV format' });
      }
      
      const headers = lines[0].split(',').map((h: string) => h.trim());
      investments = lines.slice(1).map((line: string) => {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map((v: string) => v.replace(/^"|"$/g, '').trim()) || [];
        const inv: any = {};
        headers.forEach((header: string, index: number) => {
          inv[header] = values[index] || '';
        });
        return inv;
      });
    } else {
      // Parse JSON
      investments = Array.isArray(data) ? data : [data];
    }

    let imported = 0;
    let errors = 0;

    for (const inv of investments) {
      try {
        // Skip investments without required fields
        if (!inv.name) {
          errors++;
          continue;
        }

        const stmt = db.prepare(`
          INSERT INTO investments (
            user_id, name, type, principal, monthly_contribution, expected_return_rate, 
            start_date, tenure_months, current_value, notes, status,
            purchase_price, current_stock_price, discount_percent, shares_per_month, vesting_months, lookback_months
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          Number(user_id),
          inv.name,
          inv.type || 'sip',
          Number(inv.principal || 0),
          Number(inv.monthly_contribution || 0),
          Number(inv.expected_return_rate || 12),
          inv.start_date || new Date().toISOString().split('T')[0],
          Number(inv.tenure_months || 60),
          Number(inv.current_value || 0),
          inv.notes || '',
          inv.status || 'active',
          Number(inv.purchase_price || 0),
          Number(inv.current_stock_price || 0),
          Number(inv.discount_percent || 0),
          Number(inv.shares_per_month || 0),
          Number(inv.vesting_months || 24),
          Number(inv.lookback_months || 6)
        );
        
        imported++;
      } catch (err) {
        console.error('Error importing investment:', err);
        errors++;
      }
    }

    res.json({ 
      success: true, 
      imported, 
      errors,
      message: `Successfully imported ${imported} investment(s). ${errors} error(s).`
    });
  } catch (error) {
    console.error('Error importing investments:', error);
    res.status(500).json({ error: 'Failed to import investments' });
  }
});

// ============================================
// PRODUCTION: SERVE FRONTEND STATIC FILES
// ============================================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  const frontendPath = path.join(__dirname, '../client/dist');
  app.use(express.static(frontendPath));

  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
  
  console.log('📦 Production mode: Serving frontend from', frontendPath);
}

// Start server
const port = process.env.PORT || PORT;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_PATH || 'loan-tracker.db'}`);
});

