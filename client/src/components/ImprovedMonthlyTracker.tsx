import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import { MonthlyRecord, UserProfile, Loan } from '../types';
import { useUser } from '../UserContext';

const ImprovedMonthlyTracker: React.FC = () => {
  const { currentUser } = useUser();
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    salary: 0, // Will be populated from profile when opening form
    other_income: 0, // Will be populated from profile when opening form
    rent: 0,
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    credit_card: 0,
    investments: 0,
    emergency_fund: 0,
    notes: '',
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [recordsRes, profileRes, loansRes, investmentsRes] = await Promise.all([
        api.getMonthlyRecords(currentUser.id),
        api.getProfile(currentUser.id),
        api.getLoans(currentUser.id),
        api.getInvestments(currentUser.id)
      ]);
      setRecords(recordsRes.data);
      setProfile(profileRes.data);
      setLoans(loansRes.data);
      
      // Calculate total monthly investment from active investments (include null status as active)
      const activeInvestments = investmentsRes.data.filter((inv: any) => inv.status === 'active' || inv.status === null);
      const totalMonthlyInvestment = activeInvestments.reduce((sum: number, inv: any) => sum + inv.monthly_contribution, 0);
      
      // Store for auto-population
      (window as any).__MONTHLY_INVESTMENT__ = totalMonthlyInvestment;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const totalExpenses = (formData.rent || 0) + (formData.food || 0) + 
        (formData.transport || 0) + (formData.utilities || 0) + (formData.entertainment || 0);
      
      const payload = {
        ...formData,
        user_id: currentUser.id,
        other_expenses: totalExpenses,
        rent: formData.rent || 0,
        food: formData.food || 0,
        transport: formData.transport || 0,
        utilities: formData.utilities || 0,
        entertainment: formData.entertainment || 0,
        investments: formData.investments || 0,
        emergency_fund: formData.emergency_fund || 0,
        credit_card: formData.credit_card || 0,
      };

      if (editingId) {
        await api.updateMonthlyRecord(editingId, payload);
        setEditingId(null);
      } else {
        await api.createMonthlyRecord(payload);
      }
      
      await fetchData();
      setShowAddForm(false);
      resetForm();
      alert(editingId ? '✅ Record updated!' : '✅ Record added!');
    } catch (error) {
      console.error('Error saving record:', error);
      alert('❌ Failed to save record');
    }
  };

  const handleEdit = (record: MonthlyRecord) => {
    setFormData({
      month: record.month,
      year: record.year,
      salary: record.salary,
      other_income: record.other_income,
      rent: 0,
      food: 0,
      transport: 0,
      utilities: 0,
      entertainment: 0,
      credit_card: record.credit_card || 0,
      investments: record.investments || 0,
      emergency_fund: record.emergency_fund || 0,
      notes: record.notes || '',
    });
    setEditingId(record.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number, month: string, year: number) => {
    if (window.confirm(`Delete record for ${month} ${year}?`)) {
      try {
        await api.deleteMonthlyRecord(id);
        await fetchData();
        alert('✅ Record deleted!');
      } catch (error) {
        alert('❌ Failed to delete record');
      }
    }
  };

  const resetForm = () => {
    // Use the SELECTED month and year from dropdowns, not current date
    const monthToUse = selectedMonth === 'all' ? new Date().toLocaleString('default', { month: 'long' }) : selectedMonth;
    
    // Get auto-populated investment amount
    const monthlyInvestmentAmount = (window as any).__MONTHLY_INVESTMENT__ || 0;
    
    setFormData({
      month: monthToUse,
      year: selectedYear,
      salary: profile?.monthly_salary || 0, // Pre-fill with profile salary but allow editing
      other_income: profile?.other_income || 0, // Pre-fill with profile other income
      rent: 0,
      food: 0,
      transport: 0,
      utilities: 0,
      entertainment: 0,
      credit_card: 0,
      investments: monthlyInvestmentAmount, // ✅ AUTO-POPULATED from active investments!
      emergency_fund: 0,
      notes: '',
    });
    setEditingId(null);
  };

  const filteredRecords = records.filter(record => {
    if (selectedMonth === 'all') return record.year === selectedYear;
    return record.month === selectedMonth && record.year === selectedYear;
  });

  const currencySymbol = profile?.currency === 'INR' ? '₹' : profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : '$';

  const years = Array.from(new Set(records.map(r => r.year))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  // Calculate totals
  const totalIncome = filteredRecords.reduce((sum, r) => sum + r.total_income, 0);
  const totalLoanPayments = filteredRecords.reduce((sum, r) => sum + r.total_loan_payment, 0);
  const totalExpenses = filteredRecords.reduce((sum, r) => sum + r.other_expenses, 0);
  const totalInvestments = filteredRecords.reduce((sum, r) => sum + (r.investments || 0), 0);
  const totalEmergencyFund = filteredRecords.reduce((sum, r) => sum + (r.emergency_fund || 0), 0);
  const totalSavings = filteredRecords.reduce((sum, r) => sum + r.savings, 0);

  // Prepare breakdown data for single month or aggregate
  const getBreakdownData = () => {
    if (filteredRecords.length === 0) return [];
    
    return [
      { name: 'Loan EMI', value: totalLoanPayments, color: '#ef4444', percent: (totalLoanPayments/totalIncome*100).toFixed(1) },
      { name: 'Expenses', value: totalExpenses, color: '#f97316', percent: (totalExpenses/totalIncome*100).toFixed(1) },
      { name: 'Investments', value: totalInvestments, color: '#3b82f6', percent: (totalInvestments/totalIncome*100).toFixed(1) },
      { name: 'Emergency Fund', value: totalEmergencyFund, color: '#22c55e', percent: (totalEmergencyFund/totalIncome*100).toFixed(1) },
      { name: 'Savings', value: totalSavings, color: '#8b5cf6', percent: (totalSavings/totalIncome*100).toFixed(1) },
    ].filter(item => item.value > 0);
  };

  const breakdownData = getBreakdownData();

  // For bar chart - show comparison
  const barChartData = filteredRecords.length > 0 ? [{
    name: selectedMonth !== 'all' ? selectedMonth : 'Total',
    Income: totalIncome,
    'Loan EMI': totalLoanPayments,
    'Expenses': totalExpenses,
    'Investments': totalInvestments,
    'Emergency Fund': totalEmergencyFund,
    'Savings': totalSavings,
  }] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">💰 Monthly Financial Tracker</h1>
              <p className="mt-2 text-base text-gray-700 font-medium">Track income, loans, investments, expenses & build wealth</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <button
                onClick={() => { 
                  if (showAddForm) {
                    setShowAddForm(false);
                    resetForm();
                  } else {
                    resetForm(); // Pre-fill with profile data
                    setShowAddForm(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {showAddForm ? 'Cancel' : '+ Add Record'}
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm font-medium text-blue-800">
                📅 Adding record for: <strong>{formData.month} {formData.year}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You can change the month/year in the form below if needed
              </p>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{editingId ? 'Edit Record' : 'Add New Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })} required>
                    {months.map((month) => (<option key={month} value={month}>{month}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Total Income</p>
                  <p className="text-xl font-bold text-green-600">{currencySymbol} {((formData.salary || 0) + (formData.other_income || 0)).toLocaleString()}</p>
                </div>

                <div className="md:col-span-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">💰 Income</h3>
                  <p className="text-xs text-gray-600 mb-3">💡 <strong>Note:</strong> Salary is pre-filled from your profile but can be edited if it changed this month</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Monthly salary"
                    value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Other Income</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Freelance, etc."
                    value={formData.other_income || ''} onChange={(e) => setFormData({ ...formData, other_income: parseFloat(e.target.value) || 0 })} /></div>

                <div className="md:col-span-3 border-t pt-4"><h3 className="text-sm font-semibold text-gray-900 mb-3">💳 Expenses</h3></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">🏠 Rent</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.rent || ''}
                    onChange={(e) => setFormData({ ...formData, rent: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">🍔 Food</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.food || ''}
                    onChange={(e) => setFormData({ ...formData, food: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">🚗 Transport</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.transport || ''}
                    onChange={(e) => setFormData({ ...formData, transport: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">💡 Utilities</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.utilities || ''}
                    onChange={(e) => setFormData({ ...formData, utilities: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">🎬 Entertainment</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.entertainment || ''}
                    onChange={(e) => setFormData({ ...formData, entertainment: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">💳 Credit Card</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="CC payments"
                    value={formData.credit_card || ''} onChange={(e) => setFormData({ ...formData, credit_card: parseFloat(e.target.value) || 0 })} /></div>

                <div className="md:col-span-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">💎 Savings & Investments</h3>
                  <p className="text-xs text-gray-600 mb-3">💡 <strong>Auto-populated:</strong> Investment amount is pre-filled from your active investments in the Investments page, but you can edit it if needed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📈 Investments (SIP/ESPP/MF)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50" placeholder="Auto-filled from Investments"
                    value={formData.investments || ''} onChange={(e) => setFormData({ ...formData, investments: parseFloat(e.target.value) || 0 })} />
                  <p className="text-xs text-gray-500 mt-1">✅ Auto-populated: ₹{((window as any).__MONTHLY_INVESTMENT__ || 0).toLocaleString()} (editable)</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">🛡️ Emergency Fund</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Emergency savings"
                    value={formData.emergency_fund || ''} onChange={(e) => setFormData({ ...formData, emergency_fund: parseFloat(e.target.value) || 0 })} /></div>

                <div className="md:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">💵 Total Income</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">🏦 Loan EMI</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalLoanPayments.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">📈 Investments</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalInvestments.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">💳 Expenses</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">🛡️ E-Fund</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalEmergencyFund.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl shadow-xl p-5 hover:scale-105 transition-transform">
            <p className="text-xs opacity-90 mb-1 font-semibold">💰 Savings</p>
            <p className="text-3xl font-extrabold">{currencySymbol}{totalSavings.toLocaleString()}</p>
          </div>
        </div>

        {/* Current Month At-a-Glance */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl border-2 border-indigo-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">💎</span>
            This Month At-a-Glance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Side */}
            <div className="bg-white rounded-xl p-5 shadow">
              <h3 className="text-lg font-semibold text-green-600 mb-4">💰 Money Coming In</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Salary</span>
                  <span className="text-xl font-bold text-green-600">{currencySymbol}{(profile?.monthly_salary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Other Income</span>
                  <span className="text-xl font-bold text-green-600">{currencySymbol}{(profile?.other_income || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-green-600">{currencySymbol}{((profile?.monthly_salary || 0) + (profile?.other_income || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Expenses Side */}
            <div className="bg-white rounded-xl p-5 shadow">
              <h3 className="text-lg font-semibold text-red-600 mb-4">💸 Money Going Out</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🏦 Loan EMI</span>
                  <span className="text-lg font-bold text-red-600">{currencySymbol}{loans.filter(l => l.status === 'active').reduce((s, l) => s + l.monthly_payment, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📈 Investments (SIP/ESPP)</span>
                  <span className="text-lg font-bold text-blue-600">{currencySymbol}{((window as any).__MONTHLY_INVESTMENT__ || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-red-200">
                  <span className="font-bold text-gray-900">Obligations</span>
                  <span className="text-xl font-extrabold text-red-600">{currencySymbol}{(loans.filter(l => l.status === 'active').reduce((s, l) => s + l.monthly_payment, 0) + ((window as any).__MONTHLY_INVESTMENT__ || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* In Hand Money */}
          <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90 mb-1">💵 Money Available After Obligations</p>
                <p className="text-xs opacity-80">Income - (Loans + Investments)</p>
              </div>
              <p className="text-4xl font-extrabold">
                {currencySymbol}{(
                  ((profile?.monthly_salary || 0) + (profile?.other_income || 0)) - 
                  loans.filter(l => l.status === 'active').reduce((s, l) => s + l.monthly_payment, 0) - 
                  ((window as any).__MONTHLY_INVESTMENT__ || 0)
                ).toLocaleString()}
              </p>
            </div>
            <p className="text-xs mt-3 opacity-90">
              ✨ This is what you have left for expenses, emergency fund, and additional savings after paying loans and investments
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        {filteredRecords.length > 0 && (
          <>
            {/* Income Flow Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Income Flow Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Income</span>
                    <span className="text-lg font-bold text-green-600">{currencySymbol} {totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Loan EMI (-)</span>
                    <span className="text-lg font-bold text-red-600">- {currencySymbol} {totalLoanPayments.toLocaleString()} ({(totalLoanPayments/totalIncome*100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full" style={{width: `${(totalLoanPayments/totalIncome*100)}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Investments (-)</span>
                    <span className="text-lg font-bold text-blue-600">- {currencySymbol} {((window as any).__MONTHLY_INVESTMENT__ || totalInvestments).toLocaleString()} ({(((window as any).__MONTHLY_INVESTMENT__ || totalInvestments)/totalIncome*100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{width: `${(((window as any).__MONTHLY_INVESTMENT__ || totalInvestments)/totalIncome*100)}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Other Expenses (-)</span>
                    <span className="text-lg font-bold text-orange-600">- {currencySymbol} {totalExpenses.toLocaleString()} ({(totalExpenses/totalIncome*100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{width: `${(totalExpenses/totalIncome*100)}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Emergency Fund (-)</span>
                    <span className="text-lg font-bold text-green-600">- {currencySymbol} {totalEmergencyFund.toLocaleString()} ({(totalEmergencyFund/totalIncome*100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{width: `${(totalEmergencyFund/totalIncome*100)}%`}}></div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-900">Net Savings / Remaining</span>
                    <span className="text-xl font-bold text-purple-600">
                      {currencySymbol} {(totalIncome - totalLoanPayments - ((window as any).__MONTHLY_INVESTMENT__ || totalInvestments) - totalExpenses - totalEmergencyFund).toLocaleString()} 
                      ({((totalIncome - totalLoanPayments - ((window as any).__MONTHLY_INVESTMENT__ || totalInvestments) - totalExpenses - totalEmergencyFund)/totalIncome*100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-600 h-4 rounded-full" style={{width: `${((totalIncome - totalLoanPayments - ((window as any).__MONTHLY_INVESTMENT__ || totalInvestments) - totalExpenses - totalEmergencyFund)/totalIncome*100)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Breakdown Section */}
            {loans.filter(l => l.status === 'active').length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Active Loans Breakdown</h3>
                <p className="text-sm text-gray-600 mb-4">Here are all your active loans and their monthly payments that are automatically deducted from your income.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {loans.filter(l => l.status === 'active').map((loan) => (
                    <div key={loan.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{loan.name}</h4>
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Active</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{loan.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Principal:</span>
                          <span className="font-bold text-blue-600">{currencySymbol}{loan.principal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest:</span>
                          <span className="font-medium">{loan.interest_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tenure:</span>
                          <span className="font-medium">{loan.tenure} months</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span className="text-gray-900 font-semibold">Monthly EMI:</span>
                          <span className="text-lg font-bold text-red-600">{currencySymbol}{loan.monthly_payment.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loan Impact on Budget */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-3">📊 Loan Impact on Your Budget</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Total Loan EMI</p>
                      <p className="text-2xl font-bold text-red-600">{currencySymbol}{totalLoanPayments.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Per month</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">% of Income</p>
                      <p className="text-2xl font-bold text-orange-600">{(totalLoanPayments/totalIncome*100).toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">{(totalLoanPayments/totalIncome*100) > 40 ? '🚨 High!' : (totalLoanPayments/totalIncome*100) > 30 ? '⚠️ Moderate' : '✅ Healthy'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Active Loans</p>
                      <p className="text-2xl font-bold text-blue-600">{loans.filter(l => l.status === 'active').length}</p>
                      <p className="text-xs text-gray-500 mt-1">Total loans</p>
                    </div>
                  </div>
                </div>

                {/* Loan Comparison Chart */}
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">📈 Monthly Loan Payment Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={loans.filter(l => l.status === 'active').map(loan => ({
                        name: loan.name.length > 15 ? loan.name.substring(0, 15) + '...' : loan.name,
                        EMI: loan.monthly_payment,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`} />
                      <Bar dataKey="EMI" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Where Your Money Goes</h3>
                {breakdownData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={breakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {breakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {breakdownData.map((item, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></div>
                          <span className="text-gray-700">{item.name}: {item.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data to display</p>
                )}
              </div>

              {/* Expense Breakdown Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Expense Breakdown Comparison</h3>
                {filteredRecords.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={filteredRecords.map(r => ({
                      name: `${r.month.substring(0, 3)} ${r.year}`,
                      'Rent': r.rent || 0,
                      'Food': r.food || 0,
                      'Transport': r.transport || 0,
                      'Utilities': r.utilities || 0,
                      'Entertainment': r.entertainment || 0,
                      'Credit Card': r.credit_card || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      <Bar dataKey="Rent" stackId="a" fill="#f97316" />
                      <Bar dataKey="Food" stackId="a" fill="#fb923c" />
                      <Bar dataKey="Transport" stackId="a" fill="#fdba74" />
                      <Bar dataKey="Utilities" stackId="a" fill="#fed7aa" />
                      <Bar dataKey="Entertainment" stackId="a" fill="#ffedd5" />
                      <Bar dataKey="Credit Card" stackId="a" fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data to display</p>
                )}
              </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Financial Insights & Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📊 Savings Rate</h4>
                  <p className="text-2xl font-bold text-purple-600">{totalIncome > 0 ? (totalSavings/totalIncome*100).toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {(totalSavings/totalIncome*100) >= 20 ? '✅ Great! Target: 20%+' : 
                     (totalSavings/totalIncome*100) >= 10 ? '⚠️ Good start. Try to reach 20%' : 
                     '🚨 Too low. Try to save at least 10%'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">💳 Debt Burden</h4>
                  <p className="text-2xl font-bold text-red-600">{totalIncome > 0 ? (totalLoanPayments/totalIncome*100).toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {(totalLoanPayments/totalIncome*100) < 30 ? '✅ Healthy level' : 
                     (totalLoanPayments/totalIncome*100) < 40 ? '⚠️ Monitor closely' : 
                     '🚨 Too high! Focus on reducing debt'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📈 Investment Rate</h4>
                  <p className="text-2xl font-bold text-blue-600">{totalIncome > 0 ? (totalInvestments/totalIncome*100).toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {(totalInvestments/totalIncome*100) >= 15 ? '✅ Excellent!' : 
                     (totalInvestments/totalIncome*100) >= 10 ? '✅ Good! Try 15%' : 
                     '📊 Target: 10-15% of income'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🛡️ Emergency Fund</h4>
                  <p className="text-2xl font-bold text-green-600">{currencySymbol}{totalEmergencyFund.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Target: 6 months expenses = {currencySymbol}{((totalLoanPayments + totalExpenses) * 6).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 Records {selectedMonth !== 'all' ? `- ${selectedMonth} ${selectedYear}` : `- ${selectedYear}`}
            </h2>
          </div>
          
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg text-gray-600 mb-2">No records found</p>
              <p className="text-sm text-gray-500">Add your first record to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-red-50">EMI</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-orange-50">🏠 Rent</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-orange-50">🍔 Food</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-orange-50">🚗 Travel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-orange-50">💡 Utils</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-orange-50">🎬 Fun</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-purple-50">💳 CC</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-blue-50">📈 Invest</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-green-50">🛡️ E-Fund</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-purple-100">💰 Left</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.month}</div>
                        <div className="text-sm text-gray-500">{record.year}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {currencySymbol}{record.total_income.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-red-50">
                        {currencySymbol}{record.total_loan_payment.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-700 bg-orange-50">
                        {currencySymbol}{(record.rent || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-700 bg-orange-50">
                        {currencySymbol}{(record.food || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-700 bg-orange-50">
                        {currencySymbol}{(record.transport || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-700 bg-orange-50">
                        {currencySymbol}{(record.utilities || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-700 bg-orange-50">
                        {currencySymbol}{(record.entertainment || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600 bg-purple-50">
                        {currencySymbol}{(record.credit_card || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600 bg-blue-50">
                        {currencySymbol}{(record.investments || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600 bg-green-50">
                        {currencySymbol}{(record.emergency_fund || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-700 bg-purple-100">
                        {currencySymbol}{record.savings.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800 font-medium mr-3">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(record.id, record.month, record.year)} className="text-red-600 hover:text-red-800 font-medium">
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedMonthlyTracker;

