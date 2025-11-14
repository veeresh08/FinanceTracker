import axios from 'axios';
import { UserProfile, Loan, IncomeSource, DashboardAnalytics, PaymentSchedule, MonthlyRecord, Goal, MonthlyExpense, ExpenseCategory, ExtraPayment, Investment } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

export const api = {
  // Authentication
  checkAuth: () => axios.get(`${API_BASE_URL}/auth/status`),
  login: (username: string, password: string) => 
    axios.post(`${API_BASE_URL}/auth/login`, { username, password }),
  register: (data: any) => axios.post(`${API_BASE_URL}/auth/register`, data),
  logout: () => axios.post(`${API_BASE_URL}/auth/logout`),
  requestOTP: (phone: string) => axios.post(`${API_BASE_URL}/auth/request-otp`, { phone }),
  verifyOTP: (phone: string, otp: string, profileData?: any) => 
    axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone, otp, ...profileData }),
  googleAuth: (google_id: string, email: string, name: string) =>
    axios.post(`${API_BASE_URL}/auth/google`, { google_id, email, name }),

  // Profile
  getUsers: () => axios.get<UserProfile[]>(`${API_BASE_URL}/users`),
  getProfile: (user_id?: number) => {
    const params = user_id ? `?user_id=${user_id}` : '';
    return axios.get<UserProfile>(`${API_BASE_URL}/profile${params}`);
  },
  createProfile: (data: Partial<UserProfile>) => axios.post<UserProfile>(`${API_BASE_URL}/profile`, data),
  updateProfile: (id: number, data: Partial<UserProfile>) => 
    axios.put<UserProfile>(`${API_BASE_URL}/profile/${id}`, data),

  // Income Sources
  getIncomeSources: () => axios.get<IncomeSource[]>(`${API_BASE_URL}/income-sources`),
  createIncomeSource: (data: Partial<IncomeSource>) => 
    axios.post<IncomeSource>(`${API_BASE_URL}/income-sources`, data),

  // Loans
  getLoans: (user_id?: number) => {
    const params = user_id ? `?user_id=${user_id}` : '';
    return axios.get<Loan[]>(`${API_BASE_URL}/loans${params}`);
  },
  getLoan: (id: number) => axios.get<Loan>(`${API_BASE_URL}/loans/${id}`),
  createLoan: (data: Partial<Loan> & { user_id?: number }) => axios.post<Loan>(`${API_BASE_URL}/loans`, data),
  updateLoan: (id: number, data: Partial<Loan>) => axios.put<Loan>(`${API_BASE_URL}/loans/${id}`, data),
  deleteLoan: (id: number) => axios.delete(`${API_BASE_URL}/loans/${id}`),
  getLoanSchedule: (id: number) => axios.get<PaymentSchedule[]>(`${API_BASE_URL}/loans/${id}/schedule`),

  // Analytics
  getDashboardAnalytics: (user_id?: number) => {
    const params = user_id ? `?user_id=${user_id}` : '';
    return axios.get<DashboardAnalytics>(`${API_BASE_URL}/dashboard/analytics${params}`);
  },

  // Monthly Records
  getMonthlyRecords: (user_id?: number) => {
    const params = user_id ? `?user_id=${user_id}` : '';
    return axios.get<MonthlyRecord[]>(`${API_BASE_URL}/monthly-records${params}`);
  },
  createMonthlyRecord: (data: Partial<MonthlyRecord>) => 
    axios.post<MonthlyRecord>(`${API_BASE_URL}/monthly-records`, data),
  updateMonthlyRecord: (id: number, data: Partial<MonthlyRecord>) => 
    axios.put<MonthlyRecord>(`${API_BASE_URL}/monthly-records/${id}`, data),
  deleteMonthlyRecord: (id: number) => axios.delete(`${API_BASE_URL}/monthly-records/${id}`),

  // Goals
  getGoals: () => axios.get<Goal[]>(`${API_BASE_URL}/goals`),
  createGoal: (data: Partial<Goal>) => axios.post<Goal>(`${API_BASE_URL}/goals`, data),
  updateGoal: (id: number, data: Partial<Goal>) => axios.put<Goal>(`${API_BASE_URL}/goals/${id}`, data),

  // Monthly Expenses
  getExpenses: (month?: string, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year.toString());
    return axios.get<MonthlyExpense[]>(`${API_BASE_URL}/expenses?${params.toString()}`);
  },
  createExpense: (data: Partial<MonthlyExpense>) => axios.post<MonthlyExpense>(`${API_BASE_URL}/expenses`, data),
  updateExpense: (id: number, data: Partial<MonthlyExpense>) => axios.put<MonthlyExpense>(`${API_BASE_URL}/expenses/${id}`, data),
  deleteExpense: (id: number) => axios.delete(`${API_BASE_URL}/expenses/${id}`),

  // Expense Categories
  getExpenseCategories: () => axios.get<ExpenseCategory[]>(`${API_BASE_URL}/expense-categories`),

  // Extra Payments
  getExtraPayments: (loan_id?: number) => {
    const params = loan_id ? `?loan_id=${loan_id}` : '';
    return axios.get<ExtraPayment[]>(`${API_BASE_URL}/extra-payments${params}`);
  },
  createExtraPayment: (data: Partial<ExtraPayment>) => axios.post<ExtraPayment>(`${API_BASE_URL}/extra-payments`, data),
  deleteExtraPayment: (id: number) => axios.delete(`${API_BASE_URL}/extra-payments/${id}`),

  // Investments
  getInvestments: (user_id?: number) => {
    const params = user_id ? `?user_id=${user_id}` : '';
    return axios.get<Investment[]>(`${API_BASE_URL}/investments${params}`);
  },
  createInvestment: (data: Partial<Investment> & { user_id?: number }) => 
    axios.post<Investment>(`${API_BASE_URL}/investments`, data),
  updateInvestment: (id: number, data: Partial<Investment>) => 
    axios.put<Investment>(`${API_BASE_URL}/investments/${id}`, data),
  deleteInvestment: (id: number) => axios.delete(`${API_BASE_URL}/investments/${id}`),
};

