import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { MonthlyRecord, UserProfile } from '../types';

const MonthlyTracker: React.FC = () => {
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [newRecord, setNewRecord] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    salary: 0,
    other_income: 0,
    other_expenses: 0,
    rent: 0,
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    notes: '',
  });

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
      const totalOtherExpenses = (newRecord.rent || 0) + (newRecord.food || 0) + 
        (newRecord.transport || 0) + (newRecord.utilities || 0) + (newRecord.entertainment || 0);
      
      await api.createMonthlyRecord({
        ...newRecord,
        other_expenses: totalOtherExpenses
      });
      await fetchData();
      setShowAddForm(false);
      setNewRecord({
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        salary: 0,
        other_income: 0,
        other_expenses: 0,
        rent: 0,
        food: 0,
        transport: 0,
        utilities: 0,
        entertainment: 0,
        notes: '',
      });
      alert('✅ Monthly record added successfully!');
    } catch (error) {
      console.error('Error adding record:', error);
      alert('❌ Failed to add monthly record');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter records
  const filteredRecords = records.filter(record => {
    if (selectedMonth === 'all') return record.year === selectedYear;
    return record.month === selectedMonth && record.year === selectedYear;
  });

  const currencySymbol = profile?.currency === 'INR' ? '₹' : profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : '$';

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

  const totalIncome = filteredRecords.reduce((sum, r) => sum + r.salary + r.other_income, 0);
  const totalLoanPayments = filteredRecords.reduce((sum, r) => sum + r.total_loan_payment, 0);
  const totalExpenses = filteredRecords.reduce((sum, r) => sum + r.other_expenses, 0);
  const totalSavings = filteredRecords.reduce((sum, r) => sum + r.savings, 0);

  // Get unique years
  const years = Array.from(new Set(records.map(r => r.year))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monthly Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">Track your monthly income and expenses</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Month Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Add Record Button */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {showAddForm ? 'Cancel' : '+ Add Record'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Month & Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newRecord.month}
                    onChange={(e) => setNewRecord({ ...newRecord, month: e.target.value })}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newRecord.year}
                    onChange={(e) => setNewRecord({ ...newRecord, year: parseInt(e.target.value) })}
                    required
                  />
                </div>

                {/* Income Section */}
                <div className="md:col-span-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">💰 Income</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 128000"
                    value={newRecord.salary || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, salary: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Income ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Freelance, investments"
                    value={newRecord.other_income || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, other_income: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Total Income</p>
                  <p className="text-xl font-bold text-green-600">
                    {currencySymbol} {((newRecord.salary || 0) + (newRecord.other_income || 0)).toLocaleString()}
                  </p>
                </div>

                {/* Expenses Section */}
                <div className="md:col-span-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">💳 Expenses</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Rent ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Monthly rent"
                    value={newRecord.rent || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, rent: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🍔 Food & Groceries ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Food expenses"
                    value={newRecord.food || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, food: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚗 Transport ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Fuel, public transport"
                    value={newRecord.transport || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, transport: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💡 Utilities ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Electricity, water, internet"
                    value={newRecord.utilities || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, utilities: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Entertainment ({currencySymbol})</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Movies, subscriptions"
                    value={newRecord.entertainment || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, entertainment: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    {currencySymbol} {((newRecord.rent || 0) + (newRecord.food || 0) + (newRecord.transport || 0) + (newRecord.utilities || 0) + (newRecord.entertainment || 0)).toLocaleString()}
                  </p>
                </div>

                {/* Notes */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any additional notes..."
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Save Record
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{currencySymbol} {totalIncome.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Loan Payments</p>
            <p className="text-2xl font-bold text-red-600">{currencySymbol} {totalLoanPayments.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Other Expenses</p>
            <p className="text-2xl font-bold text-orange-600">{currencySymbol} {totalExpenses.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Net Savings</p>
            <p className="text-2xl font-bold text-blue-600">{currencySymbol} {totalSavings.toLocaleString()}</p>
          </div>
        </div>

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
              <p className="text-sm text-gray-500">Add your first monthly record to start tracking</p>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Savings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
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
                        {currencySymbol} {record.total_income.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {currencySymbol} {record.total_loan_payment.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                        {currencySymbol} {record.other_expenses.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                        {currencySymbol} {record.savings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.notes || '-'}
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

export default MonthlyTracker;
