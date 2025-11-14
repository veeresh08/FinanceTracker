import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { api } from '../api';
import { DashboardAnalytics, PaymentSchedule } from '../types';
import LoanDetails from './LoanDetails';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.getDashboardAnalytics();
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { summary, loans, recommendations } = analytics;

  // Prepare data for charts
  const debtBreakdownData = [
    { name: 'Principal', value: summary.totalPrincipal, color: '#0ea5e9' },
    { name: 'Interest', value: summary.totalInterest, color: '#ef4444' },
  ];

  const loanComparisonData = loans.map((loan) => ({
    name: loan.name.length > 15 ? loan.name.substring(0, 15) + '...' : loan.name,
    Principal: loan.principal,
    Interest: loan.interest,
  }));

  const incomeVsDebtData = [
    { name: 'Total Income', value: summary.totalIncome, color: '#10b981' },
    { name: 'Loan Payments', value: summary.monthlyPayments, color: '#ef4444' },
    { name: 'Available', value: summary.availableAfterLoans, color: '#0ea5e9' },
  ];

  const debtToIncomeData = [
    { name: 'Debt Payments', value: summary.debtToIncomeRatio },
    { name: 'Available', value: 100 - summary.debtToIncomeRatio },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {selectedLoanId ? (
        <LoanDetails loanId={selectedLoanId} onBack={() => setSelectedLoanId(null)} />
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Loan Dashboard 💰</h1>
            <p className="text-gray-600">Track your loans, payments, and financial health</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <p className="text-sm opacity-90 mb-1">Total Loans</p>
              <p className="text-3xl font-bold">{summary.totalLoans}</p>
              <p className="text-xs mt-2 opacity-80">Active loans being tracked</p>
            </div>

            <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
              <p className="text-sm opacity-90 mb-1">Total Debt</p>
              <p className="text-3xl font-bold">${summary.totalDebt.toFixed(0)}</p>
              <p className="text-xs mt-2 opacity-80">
                Principal: ${summary.totalPrincipal.toFixed(0)} + Interest: ${summary.totalInterest.toFixed(0)}
              </p>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <p className="text-sm opacity-90 mb-1">Monthly Payment</p>
              <p className="text-3xl font-bold">${summary.monthlyPayments.toFixed(2)}</p>
              <p className="text-xs mt-2 opacity-80">
                {summary.debtToIncomeRatio.toFixed(1)}% of income
              </p>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-sm opacity-90 mb-1">Debt-Free By</p>
              <p className="text-3xl font-bold">{summary.yearsRemaining}y</p>
              <p className="text-xs mt-2 opacity-80">
                {new Date(summary.allLoansClearedBy).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">💡 Recommendations</h2>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`card border-l-4 ${
                      rec.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <p className={rec.type === 'warning' ? 'text-yellow-800' : 'text-green-800'}>
                      {rec.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income vs Debt Overview */}
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">💵 Income Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Loan Payments</p>
                <p className="text-2xl font-bold text-red-600">-${summary.monthlyPayments.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available After Loans</p>
                <p className="text-2xl font-bold text-blue-600">${summary.availableAfterLoans.toFixed(2)}</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(summary.availableAfterLoans / summary.totalIncome) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {((summary.availableAfterLoans / summary.totalIncome) * 100).toFixed(1)}% remaining
                </p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Principal vs Interest */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Total Debt Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={debtBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {debtBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total Principal</p>
                  <p className="text-xl font-bold text-blue-600">${summary.totalPrincipal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="text-xl font-bold text-red-600">${summary.totalInterest.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Debt to Income Ratio */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Debt-to-Income Ratio</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={debtToIncomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => `${value.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Your DTI Ratio</p>
                <p className="text-3xl font-bold text-gray-800">{summary.debtToIncomeRatio.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 mt-1">
                  {summary.debtToIncomeRatio < 36
                    ? '✅ Healthy'
                    : summary.debtToIncomeRatio < 43
                    ? '⚠️ Manageable'
                    : '🚨 High Risk'}
                </p>
              </div>
            </div>

            {/* Loan Comparison */}
            {loans.length > 0 && (
              <div className="card lg:col-span-2">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Loan Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={loanComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="Principal" fill="#0ea5e9" />
                    <Bar dataKey="Interest" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Income Distribution */}
            <div className="card lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Monthly Income Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeVsDebtData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#8884d8">
                    {incomeVsDebtData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loan List */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Your Loans</h2>
            {loans.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No loans added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Loan Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Principal</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Interest</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monthly Payment</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cleared By</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loans.map((loan, index) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="font-medium text-gray-800">{loan.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{loan.type.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          ${loan.principal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">
                          ${loan.interest.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">
                          ${loan.monthlyPayment.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {new Date(loan.clearedBy).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedLoanId(loan.id)}
                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;


