// User Profile
export interface UserProfile {
  id: number;
  user_name: string;
  currency: string;
  monthly_salary: number;
  other_income: number;
  total_income: number;
  // Auth fields
  username?: string;
  email?: string;
  phone?: string;
  auth_method?: string;
  auth_user_id?: number;
}

// Loan
export interface Loan {
  id: number;
  name: string;
  type: string;
  principal: number;
  interest_rate: number;
  tenure: number;
  start_date: string;
  monthly_payment: number;
  status: string;
  // Old field names for compatibility
  loan_name?: string;
  loan_type?: string;
  principal_amount?: number;
  loan_term_months?: number;
  remaining_balance?: number;
  total_interest?: number;
}

// Payment Schedule
export interface PaymentSchedule {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

// Income Source
export interface IncomeSource {
  id: number;
  source_name: string;
  amount: number;
  frequency: string;
}

// Dashboard Analytics
export interface DashboardAnalytics {
  summary: {
    totalLoans: number;
    totalDebt: number;
    monthlyPayments: number;
    totalIncome: number;
    availableAfterLoans: number;
    yearsRemaining: number;
    allLoansClearedBy: string;
    debtToIncomeRatio: number;
    totalPrincipal: number;
    totalInterest: number;
  };
  loans: {
    id: number;
    name: string;
    principal: number;
    monthlyPayment: number;
    remainingBalance: number;
    interest: number;
    tenure: number;
    interestRate: number;
  }[];
  recommendations: {
    type: string;
    message: string;
  }[];
}

// Monthly Record
export interface MonthlyRecord {
  id: number;
  month: string;
  year: number;
  salary: number;
  other_income: number;
  total_income: number;
  total_loan_payment: number;
  other_expenses: number;
  savings: number;
  investments?: number;
  emergency_fund?: number;
  credit_card?: number;
  // Detailed expenses
  rent?: number;
  food?: number;
  transport?: number;
  utilities?: number;
  entertainment?: number;
  notes?: string;
}

// Goal
export interface Goal {
  id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  status: string;
}

// Monthly Expense
export interface MonthlyExpense {
  id: number;
  month: string;
  year: number;
  category: string;
  amount: number;
  description?: string;
}

// Expense Category
export interface ExpenseCategory {
  id: number;
  category_name: string;
  icon?: string;
  color?: string;
  is_active: number;
}

// Extra Payment
export interface ExtraPayment {
  id: number;
  loan_id: number;
  payment_date: string;
  amount: number;
  notes?: string;
}

// Investment
export interface Investment {
  id: number;
  user_id: number;
  name: string;
  type: 'espp' | 'sip' | 'mutual_fund' | 'stocks' | 'fd' | 'ppf' | 'nps' | 'other';
  principal: number;
  monthly_contribution: number;
  expected_return_rate: number; // Annual percentage
  start_date: string;
  tenure_months: number;
  current_value?: number;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  // ESPP-specific fields
  purchase_price?: number; // Price per share you pay
  current_stock_price?: number; // Current market price
  discount_percent?: number; // ESPP discount (usually 10-15%)
  shares_per_month?: number; // How many shares you buy per month
  vesting_months?: number; // Vesting period (usually 24 months)
  lookback_months?: number; // Lookback period (usually 6 months)
  created_at?: string;
  updated_at?: string;
}

// Investment Projection
export interface InvestmentProjection {
  month: number;
  invested: number;
  returns: number;
  total: number;
}
