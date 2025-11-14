import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../api';
import { MonthlyRecord, UserProfile } from '../types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const EnhancedMonthlyTracker: React.FC = () => {
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    salary: 0,
    other_income: 0,
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, profileRes] = await Promise.all([
        api.getMonthlyRecords(),
        api.getProfile()
      ]);
      setRecords(recordsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const totalExpenses = (formData.rent || 0) + (formData.food || 0) + 
        (formData.transport || 0) + (formData.utilities || 0) + (formData.entertainment || 0) +
        (formData.credit_card || 0);
      
      const payload = {
        ...formData,
        other_expenses: totalExpenses,
        investments: formData.investments || 0,
        emergency_fund: formData.emergency_fund || 0,
        credit_card: formData.credit_card || 0,
      };

      if (editingId) {
        // Update existing record
        await api.updateMonthlyRecord(editingId, payload);
        setEditingId(null);
      } else {
        // Create new record
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
    setFormData({
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      salary: 0,
      other_income: 0,
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
  const totalIncome = filteredRecords.reduce((sum, r) => sum + r.salary + r.other_income, 0);
  const totalLoanPayments = filteredRecords.reduce((sum, r) => sum + r.total_loan_payment, 0);
  const totalExpenses = filteredRecords.reduce((sum, r) => sum + r.other_expenses, 0);
  const totalInvestments = filteredRecords.reduce((sum, r) => sum + (r.investments || 0), 0);
  const totalEmergencyFund = filteredRecords.reduce((sum, r) => sum + (r.emergency_fund || 0), 0);
  const totalSavings = filteredRecords.reduce((sum, r) => sum + r.savings, 0);

  // Prepare pie chart data (where money goes)
  const pieData = [];
  if (totalLoanPayments > 0) pieData.push({ name: 'Loan Payments', value: totalLoanPayments, color: '#ef4444' });
  if (totalExpenses > 0) pieData.push({ name: 'Expenses', value: totalExpenses, color: '#f97316' });
  if (totalInvestments > 0) pieData.push({ name: 'Investments', value: totalInvestments, color: '#3b82f6' });
  if (totalEmergencyFund > 0) pieData.push({ name: 'Emergency Fund', value: totalEmergencyFund, color: '#22c55e' });
  const remaining = totalIncome - totalLoanPayments - totalExpenses - totalInvestments - totalEmergencyFund;
  if (remaining > 0) pieData.push({ name: 'Remaining/Savings', value: remaining, color: '#8b5cf6' });

  // Prepare line chart data (monthly trend)
  const lineChartData = filteredRecords.map(r => ({
    month: `${r.month.substring(0, 3)} ${r.year}`,
    Income: r.total_income,
    Expenses: r.other_expenses + r.total_loan_payment,
    Savings: r.savings,
    Investments: r.investments || 0,
  }));

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
        {/* Header with Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monthly Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">Track income, expenses, savings & investments</p>
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
                onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) resetForm(); }}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{editingId ? 'Edit Record' : 'Add New Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Month & Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Total Income</p>
                  <p className="text-xl font-bold text-blue-600">
                    {currencySymbol} {((formData.salary || 0) + (formData.other_income || 0)).toLocaleString()}
                  </p>
                </div>

                {/* Income Section */}
                <div className="md:col-span-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">💰 Income</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Monthly salary"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Income</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Freelance, etc."
                    value={formData.other_income || ''}
                    onChange={(e) => setFormData({ ...formData, other_income: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Expenses Section */}
                <div className="md:col-span-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">💳 Expenses</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Rent</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.rent || ''}
                    onChange={(e) => setFormData({ ...formData, rent: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🍔 Food</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.food || ''}
                    onChange={(e) => setFormData({ ...formData, food: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Transport</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.transport || ''}
                    onChange={(e) => setFormData({ ...formData, transport: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💡 Utilities</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.utilities || ''}
                    onChange={(e) => setFormData({ ...formData, utilities: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Entertainment</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.entertainment || ''}
                    onChange={(e) => setFormData({ ...formData, entertainment: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💳 Credit Card</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Credit card payments"
                    value={formData.credit_card || ''}
                    onChange={(e) => setFormData({ ...formData, credit_card: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Savings & Investments Section */}
                <div className="md:col-span-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">💎 Savings & Investments</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📈 Investments</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="SIP, Stocks, MF"
                    value={formData.investments || ''}
                    onChange={(e) => setFormData({ ...formData, investments: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🛡️ Emergency Fund</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Emergency savings"
                    value={formData.emergency_fund || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_fund: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddForm(false); resetForm(); }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Income</p>
            <p className="text-2xl font-bold text-green-600">{currencySymbol}{totalIncome.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Loan Payments</p>
            <p className="text-2xl font-bold text-red-600">{currencySymbol}{totalLoanPayments.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Expenses</p>
            <p className="text-2xl font-bold text-orange-600">{currencySymbol}{totalExpenses.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Investments</p>
            <p className="text-2xl font-bold text-blue-600">{currencySymbol}{totalInvestments.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Emergency Fund</p>
            <p className="text-2xl font-bold text-green-600">{currencySymbol}{totalEmergencyFund.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Savings</p>
            <p className="text-2xl font-bold text-purple-600">{currencySymbol}{totalSavings.toLocaleString()}</p>
          </div>
        </div>

        {/* Charts */}
        {filteredRecords.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart - Where Money Goes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Where Your Salary Goes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart - Monthly Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Savings" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Investments" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Records {selectedMonth !== 'all' ? `- ${selectedMonth} ${selectedYear}` : `- ${selectedYear}`}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loans</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investments</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">E-Fund</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Savings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.month}</div>
                        <div className="text-sm text-gray-500">{record.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {currencySymbol}{record.total_income.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {currencySymbol}{record.total_loan_payment.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                        {currencySymbol}{record.other_expenses.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                        {currencySymbol}{(record.investments || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {currencySymbol}{(record.emergency_fund || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                        {currencySymbol}{record.savings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.month, record.year)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
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

export default EnhancedMonthlyTracker;


