const Database = require('better-sqlite3');
const path = require('path');

// Use process.cwd() instead of __dirname for compatibility
const db = new Database(path.join(process.cwd(), 'loan-tracker.db'));

// 🚀 PERFORMANCE OPTIMIZATIONS for SQLite
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('synchronous = NORMAL'); // Faster writes, safe enough for non-critical data
db.pragma('cache_size = 10000'); // 10MB cache for faster queries
db.pragma('temp_store = MEMORY'); // Keep temp tables in memory

// Initialize database tables
export function initializeDatabase() {
  // Authentication Users table - for login credentials
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
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Profile table - financial data linked to auth_users
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

  // Payment History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      payment_amount REAL NOT NULL,
      principal_paid REAL NOT NULL,
      interest_paid REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id)
    )
  `);

  // Income Sources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Monthly Records table - Track income/expenses per month
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
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profile(id),
      UNIQUE(user_id, month, year)
    )
  `);

  // Goals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Monthly Expenses table - Detailed expense tracking
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

  // Expense Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Insert default expense categories if none exist
  db.exec(`
    INSERT OR IGNORE INTO expense_categories (category_name, icon, color) VALUES
    ('Rent', '🏠', '#3b82f6'),
    ('Food', '🍔', '#10b981'),
    ('Travel', '🚗', '#f59e0b'),
    ('Utilities', '💡', '#8b5cf6'),
    ('Entertainment', '🎬', '#ec4899'),
    ('Healthcare', '⚕️', '#ef4444'),
    ('Shopping', '🛍️', '#06b6d4'),
    ('Education', '📚', '#84cc16'),
    ('Other', '💰', '#6b7280')
  `);

  // Extra Payments table - Track additional payments to loans
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

  // Migrations: Add user_id columns if they don't exist (for existing databases)
  try {
    // Check if user_id exists in loans table
    const loansColumns = db.prepare("PRAGMA table_info(loans)").all() as any[];
    if (!loansColumns.some((col: any) => col.name === 'user_id')) {
      db.exec(`ALTER TABLE loans ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      console.log('Added user_id column to loans table');
    }

    // Check if user_id exists in monthly_records table
    const recordsColumns = db.prepare("PRAGMA table_info(monthly_records)").all() as any[];
    if (!recordsColumns.some((col: any) => col.name === 'user_id')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      console.log('Added user_id column to monthly_records table');
    }

    // Check if user_id exists in monthly_expenses table
    const expensesColumns = db.prepare("PRAGMA table_info(monthly_expenses)").all() as any[];
    if (!expensesColumns.some((col: any) => col.name === 'user_id')) {
      db.exec(`ALTER TABLE monthly_expenses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      console.log('Added user_id column to monthly_expenses table');
    }

    // Check if investments, emergency_fund, credit_card exist in monthly_records
    if (!recordsColumns.some((col: any) => col.name === 'investments')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN investments REAL DEFAULT 0`);
      console.log('Added investments column to monthly_records table');
    }
    if (!recordsColumns.some((col: any) => col.name === 'emergency_fund')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN emergency_fund REAL DEFAULT 0`);
      console.log('Added emergency_fund column to monthly_records table');
    }
    if (!recordsColumns.some((col: any) => col.name === 'credit_card')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN credit_card REAL DEFAULT 0`);
      console.log('Added credit_card column to monthly_records table');
    }
  } catch (error) {
    console.log('Migration check completed (columns may already exist)');
  }

  // Add detailed expense columns to monthly_records
  try {
    const monthlyRecordsExpenseCols = db.prepare("PRAGMA table_info(monthly_records)").all() as any[];
    
    if (!monthlyRecordsExpenseCols.find(col => col.name === 'rent')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN rent REAL DEFAULT 0`);
      console.log('Added rent column to monthly_records table');
    }
    if (!monthlyRecordsExpenseCols.find(col => col.name === 'food')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN food REAL DEFAULT 0`);
      console.log('Added food column to monthly_records table');
    }
    if (!monthlyRecordsExpenseCols.find(col => col.name === 'transport')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN transport REAL DEFAULT 0`);
      console.log('Added transport column to monthly_records table');
    }
    if (!monthlyRecordsExpenseCols.find(col => col.name === 'utilities')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN utilities REAL DEFAULT 0`);
      console.log('Added utilities column to monthly_records table');
    }
    if (!monthlyRecordsExpenseCols.find(col => col.name === 'entertainment')) {
      db.exec(`ALTER TABLE monthly_records ADD COLUMN entertainment REAL DEFAULT 0`);
      console.log('Added entertainment column to monthly_records table');
    }
  } catch (error) {
    console.log('Expense column migration check completed (columns may already exist)');
  }

  // Add auth_user_id column to user_profile for authentication linkage
  try {
    const profileColumns = db.prepare("PRAGMA table_info(user_profile)").all() as any[];
    
    if (!profileColumns.find(col => col.name === 'auth_user_id')) {
      db.exec(`ALTER TABLE user_profile ADD COLUMN auth_user_id INTEGER UNIQUE`);
      console.log('Added auth_user_id column to user_profile table');
    }
  } catch (error) {
    console.log('Auth column migration check completed (column may already exist)');
  }

  // 🚀 PERFORMANCE OPTIMIZATION: Create indexes for faster queries
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_records_user ON monthly_records(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_records_user_date ON monthly_records(user_id, year, month)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user ON monthly_expenses(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_date ON monthly_expenses(user_id, year, month)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_extra_payments_loan ON extra_payments(loan_id)`);
    console.log('✅ Performance indexes created successfully');
  } catch (error) {
    console.log('Indexes may already exist');
  }

  console.log('Database initialized successfully');
}

module.exports = { default: db, initializeDatabase };

