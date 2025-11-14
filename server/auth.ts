const bcrypt = require('bcrypt');
const db = require('./database');

const SALT_ROUNDS = 10;

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create new auth user
export async function createAuthUser(data: {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  google_id?: string;
  auth_method: 'password' | 'google' | 'otp';
}) {
  try {
    let password_hash = null;
    if (data.password) {
      password_hash = await hashPassword(data.password);
    }

    const stmt = db.prepare(`
      INSERT INTO auth_users (username, email, phone, password_hash, google_id, auth_method, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.username || null,
      data.email || null,
      data.phone || null,
      password_hash,
      data.google_id || null,
      data.auth_method,
      data.auth_method === 'google' ? 1 : 0 // Google users are auto-verified
    );

    return { id: result.lastInsertRowid, ...data };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Username, email, or phone already exists');
    }
    throw error;
  }
}

// Find auth user by credentials
export function findUserByUsername(username: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE username = ?');
  return stmt.get(username);
}

export function findUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE email = ?');
  return stmt.get(email);
}

export function findUserByPhone(phone: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE phone = ?');
  return stmt.get(phone);
}

export function findUserByGoogleId(google_id: string) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE google_id = ?');
  return stmt.get(google_id);
}

// Update last login
export function updateLastLogin(auth_user_id: number) {
  const stmt = db.prepare('UPDATE auth_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(auth_user_id);
}

// OTP Management
export function saveOTP(auth_user_id: number, otp: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const stmt = db.prepare(`
    UPDATE auth_users 
    SET otp = ?, otp_expires_at = ?
    WHERE id = ?
  `);
  stmt.run(otp, expiresAt.toISOString(), auth_user_id);
}

export function verifyOTP(auth_user_id: number, otp: string): boolean {
  const stmt = db.prepare(`
    SELECT otp, otp_expires_at 
    FROM auth_users 
    WHERE id = ?
  `);
  const user: any = stmt.get(auth_user_id);
  
  if (!user || !user.otp || !user.otp_expires_at) {
    return false;
  }

  const isExpired = new Date(user.otp_expires_at) < new Date();
  if (isExpired) {
    return false;
  }

  return user.otp === otp;
}

export function clearOTP(auth_user_id: number) {
  const stmt = db.prepare(`
    UPDATE auth_users 
    SET otp = NULL, otp_expires_at = NULL, is_verified = 1
    WHERE id = ?
  `);
  stmt.run(auth_user_id);
}

// Get or create user profile
export function getUserProfile(auth_user_id: number) {
  const stmt = db.prepare('SELECT * FROM user_profile WHERE auth_user_id = ?');
  return stmt.get(auth_user_id);
}

export function createUserProfile(auth_user_id: number, data: {
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

  return { id: result.lastInsertRowid, auth_user_id, ...data, total_income };
}


