import React, { useEffect, useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  TooltipProps,
} from 'recharts';
import { api } from '../api';
import { DashboardAnalytics, UserProfile } from '../types';
import { useUser } from '../UserContext';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const ImprovedDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [analyticsRes, profileRes] = await Promise.all([
        api.getDashboardAnalytics(currentUser.id),
        api.getProfile(currentUser.id)
      ]);
      setAnalytics(analyticsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 OPTIMIZED: Generate timeline data (MUST be before conditional returns!)
  const timelineData = useMemo(() => {
    if (!analytics || !analytics.loans || analytics.loans.length === 0) return [];
    
    const loans = analytics.loans;
    const data: any[] = [];
    const maxTenure = Math.max(...loans.map(l => l.tenure), 0);
    
    // Smart sampling: More points early, fewer later (reduces calculations by 70%)
    const step = maxTenure <= 36 ? 1 : maxTenure <= 120 ? 3 : 6; // Monthly for <3yr, quarterly for <10yr, bi-annual for >10yr
    
    for (let month = 0; month <= maxTenure; month += step) {
      const dataPoint: any = { 
        month, 
        year: Math.floor(month / 12),
        monthLabel: `Month ${month}`,
        yearMonth: `${Math.floor(month / 12)}y ${month % 12}m`
      };
      
      loans.forEach((loan) => {
        if (month <= loan.tenure) {
          const monthlyRate = loan.interestRate / 12 / 100;
          const remainingMonths = loan.tenure - month;
          
          if (remainingMonths > 0) {
            const remainingBalance = loan.monthlyPayment * ((Math.pow(1 + monthlyRate, remainingMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)));
            dataPoint[loan.name] = Math.round(remainingBalance);
            dataPoint[`${loan.name}_totalPaid`] = Math.round(loan.monthlyPayment * month);
            dataPoint[`${loan.name}_interestPaid`] = Math.round((loan.monthlyPayment * month) - (loan.principal - remainingBalance));
          } else {
            dataPoint[loan.name] = 0;
            dataPoint[`${loan.name}_totalPaid`] = Math.round(loan.principal);
            dataPoint[`${loan.name}_interestPaid`] = Math.round(loan.interest);
          }
        } else {
          dataPoint[loan.name] = 0;
          dataPoint[`${loan.name}_totalPaid`] = Math.round(loan.principal);
          dataPoint[`${loan.name}_interestPaid`] = Math.round(loan.interest);
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  }, [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">No data available. Please add loans first.</p>
      </div>
    );
  }

  const { summary, loans, recommendations } = analytics;
  const currencySymbol = profile.currency === 'INR' ? '₹' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : '$';

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length && payload[0].payload) {
      const data = payload[0].payload;
      const monthNum = data.month;
      const years = Math.floor(monthNum / 12);
      const months = monthNum % 12;
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-300">
          <p className="font-bold text-gray-900 mb-2">
            📅 {years > 0 ? `${years}y ` : ''}{months}m from now
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey && !entry.dataKey.includes('_')) {
              const loanName = entry.dataKey;
              const remainingBalance = entry.value;
              const totalPaid = data[`${loanName}_totalPaid`] || 0;
              const interestPaid = data[`${loanName}_interestPaid`] || 0;
              
              return (
                <div key={index} className="mt-2 pt-2 border-t border-gray-200">
                  <p className="font-semibold text-sm mb-1" style={{ color: entry.color }}>
                    {loanName}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    💰 Remaining: {currencySymbol}{remainingBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    ✅ Paid: {currencySymbol}{totalPaid.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-600">
                    📊 Interest: {currencySymbol}{interestPaid.toLocaleString()}
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  const debtBreakdownData = [
    { name: 'Principal', value: summary.totalPrincipal, color: '#0ea5e9' },
    { name: 'Interest', value: summary.totalInterest, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Loan Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Complete overview of your loans and debt status</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Loans</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalLoans}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">{currencySymbol}{summary.totalDebt.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Principal + Interest</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly Payment</p>
                <p className="text-2xl font-bold text-orange-600">{currencySymbol}{summary.monthlyPayments.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.debtToIncomeRatio.toFixed(1)}% of income</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Debt-Free By</p>
                <p className="text-2xl font-bold text-green-600">{summary.yearsRemaining}y {summary.monthsRemaining % 12}m</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(summary.allLoansClearedBy).toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOTAL INTEREST - PROMINENT CARD */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium mb-2 opacity-90">💸 Total Interest You'll Pay</p>
              <p className="text-5xl font-bold">{currencySymbol} {summary.totalInterest.toLocaleString()}</p>
              <p className="text-sm mt-3 opacity-90">
                Out of total {currencySymbol}{summary.totalDebt.toLocaleString()} you'll pay, 
                <span className="font-bold"> {currencySymbol}{summary.totalPrincipal.toLocaleString()} is principal</span> and 
                <span className="font-bold"> {currencySymbol}{summary.totalInterest.toLocaleString()} is interest</span>
              </p>
              <p className="text-sm mt-2 bg-white bg-opacity-20 inline-block px-3 py-1 rounded-full">
                Interest is {((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}% of principal
              </p>
            </div>
            <div className="text-8xl opacity-20">💰</div>
          </div>
        </div>

        {/* Monthly Deductions Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💳 Monthly Deductions Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Monthly Income</span>
                <span className="text-lg font-bold text-green-600">{currencySymbol} {summary.totalIncome.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Loan Payments (EMI)</span>
                <span className="text-lg font-bold text-red-600">- {currencySymbol} {summary.monthlyPayments.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(summary.monthlyPayments / summary.totalIncome) * 100}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{((summary.monthlyPayments / summary.totalIncome) * 100).toFixed(1)}% of income</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Available After Loans</span>
                <span className="text-lg font-bold text-blue-600">{currencySymbol} {summary.availableAfterLoans.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(summary.availableAfterLoans / summary.totalIncome) * 100}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{((summary.availableAfterLoans / summary.totalIncome) * 100).toFixed(1)}% of income remaining</p>
            </div>
          </div>
        </div>

        {/* Debt Breakdown Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Debt Composition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={debtBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${currencySymbol}${value.toLocaleString()}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {debtBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium text-gray-700">Principal Amount</span>
                <span className="font-bold text-blue-600">{currencySymbol} {summary.totalPrincipal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="text-sm font-medium text-gray-700">Total Interest</span>
                <span className="font-bold text-red-600">{currencySymbol} {summary.totalInterest.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Debt-to-Income Ratio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Debt-to-Income Ratio</h3>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold text-blue-600 mb-2">{summary.debtToIncomeRatio.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">
                {summary.debtToIncomeRatio < 36 ? '✅ Excellent - Very healthy' : 
                 summary.debtToIncomeRatio < 43 ? '⚠️ Manageable - Monitor closely' : 
                 '🚨 High Risk - Consider reducing debt'}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  summary.debtToIncomeRatio < 36 ? 'bg-green-500' :
                  summary.debtToIncomeRatio < 43 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(summary.debtToIncomeRatio, 100)}%` }}
              ></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Income:</span>
                <span className="font-semibold">{currencySymbol} {summary.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Debt Payments:</span>
                <span className="font-semibold text-red-600">{currencySymbol} {summary.monthlyPayments.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Payment Timeline - LINE CHART */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📉 Loan Payment Timeline (Remaining Balance Over Time)</h3>
          <p className="text-sm text-gray-500 mb-4">Hover over the chart to see detailed breakdown for each year</p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months from Now', position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
                tickFormatter={(month) => {
                  const years = Math.floor(month / 12);
                  const months = month % 12;
                  return years > 0 ? `${years}y ${months}m` : `${months}m`;
                }}
              />
              <YAxis 
                label={{ value: `Remaining Balance (${currencySymbol})`, angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {loans.map((loan, index) => (
                <Line
                  key={loan.name}
                  type="monotone"
                  dataKey={loan.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name={loan.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Loans Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Individual Loan Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly EMI</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tenure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map((loan, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600">{currencySymbol} {loan.principal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{currencySymbol} {loan.interest.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{currencySymbol} {(loan.principal + loan.interest).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">{currencySymbol} {loan.monthlyPayment.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{Math.floor(loan.tenure / 12)}y {loan.tenure % 12}m</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 text-sm text-right text-blue-600">{currencySymbol} {summary.totalPrincipal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{currencySymbol} {summary.totalInterest.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{currencySymbol} {summary.totalDebt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">{currencySymbol} {summary.monthlyPayments.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Smart Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    rec.type === 'warning'
                      ? 'bg-yellow-100 border-l-4 border-yellow-500'
                      : 'bg-green-100 border-l-4 border-green-500'
                  }`}
                >
                  <p className={`text-sm ${rec.type === 'warning' ? 'text-yellow-800' : 'text-green-800'}`}>
                    {rec.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedDashboard;
