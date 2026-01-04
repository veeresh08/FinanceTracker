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
} from 'recharts';
import { api } from '../api';
import { DashboardAnalytics, UserProfile } from '../types';
import { useUser } from '../UserContext';
import { useTheme } from '../ThemeContext';
import { Wallet, TrendingUp, Calendar, Target, DollarSign, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const ImprovedDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const { theme } = useTheme();
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

  // 🚀 OPTIMIZED: Generate timeline data
  const timelineData = useMemo(() => {
    if (!analytics || !analytics.loans || analytics.loans.length === 0) return [];
    
    const loans = analytics.loans;
    const data: any[] = [];
    const maxTenure = Math.max(...loans.map(l => l.tenure), 0);
    
    const step = maxTenure <= 36 ? 1 : maxTenure <= 120 ? 3 : 6; 
    
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 card">
          <p className="text-lg text-muted-foreground mb-4">No data available. Please add loans first.</p>
          <button className="btn-premium">Add Your First Loan</button>
        </div>
      </div>
    );
  }

  const { summary, loans, recommendations } = analytics;
  const currencySymbol = profile.currency === 'INR' ? '₹' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : '$';

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const data = payload[0].payload;
      const monthNum = data.month;
      const years = Math.floor(monthNum / 12);
      const months = monthNum % 12;
      
      return (
        <div className="bg-background border border-border p-4 rounded-lg shadow-lg text-sm">
          <p className="font-bold text-foreground mb-2">
            📅 {years > 0 ? `${years}y ` : ''}{months}m from now
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey && !entry.dataKey.includes('_')) {
              const loanName = entry.dataKey;
              const remainingBalance = entry.value;
              
              return (
                <div key={index} className="mt-2 pt-2 border-t border-border">
                  <p className="font-semibold mb-1" style={{ color: entry.color }}>
                    {loanName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remaining: <span className="text-foreground font-medium">{currencySymbol}{remainingBalance.toLocaleString()}</span>
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
    { name: 'Principal', value: summary.totalPrincipal, color: '#3b82f6' },
    { name: 'Interest', value: summary.totalInterest, color: '#ef4444' },
  ];

  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Dashboard</h1>
            <p className="text-muted-foreground">Complete overview of your loans and debt status</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6 hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Loans</p>
                <h3 className="text-3xl font-bold text-foreground">{summary.totalLoans}</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-md transition-all border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Debt</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{currencySymbol}{summary.totalDebt.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">Principal + Interest</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-md transition-all border-l-4 border-l-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Payment</p>
                <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{currencySymbol}{summary.monthlyPayments.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">{summary.debtToIncomeRatio.toFixed(1)}% of income</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                <Calendar size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-md transition-all border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Debt-Free By</p>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.yearsRemaining}y</h3>
                <p className="text-xs text-muted-foreground mt-1">{new Date(summary.allLoansClearedBy).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                <Target size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* TOTAL INTEREST - PROMINENT CARD */}
        <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <DollarSign size={300} />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-lg font-medium opacity-90 mb-2 flex items-center gap-2">
                  <AlertCircle size={20} /> Total Interest You'll Pay
                </p>
                <h2 className="text-5xl md:text-6xl font-bold mb-4">{currencySymbol} {summary.totalInterest.toLocaleString()}</h2>
                <p className="text-lg opacity-90 max-w-2xl">
                  Out of total <span className="font-bold border-b border-white/30">{currencySymbol}{summary.totalDebt.toLocaleString()}</span> you'll pay, 
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">{currencySymbol}{summary.totalPrincipal.toLocaleString()} is principal</span> and 
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">{currencySymbol}{summary.totalInterest.toLocaleString()} is interest</span>
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                <p className="text-sm font-medium mb-2">Interest Burden</p>
                <div className="text-3xl font-bold">{((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}%</div>
                <p className="text-xs opacity-75 mt-1">of principal amount</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Deductions Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Wallet size={20} /> Monthly Deductions Breakdown
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Income</span>
                <span className="font-bold text-green-600 dark:text-green-400">{currencySymbol} {summary.totalIncome.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-50 dark:bg-green-900/200 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Loan Payments (EMI)</span>
                <span className="font-bold text-red-600 dark:text-red-400">- {currencySymbol} {summary.monthlyPayments.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-red-50 dark:bg-red-900/200 rounded-full" style={{ width: `${Math.min((summary.monthlyPayments / summary.totalIncome) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground text-right">{((summary.monthlyPayments / summary.totalIncome) * 100).toFixed(1)}% of income</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available After Loans</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{currencySymbol} {summary.availableAfterLoans.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-blue-50 dark:bg-blue-900/200 rounded-full" style={{ width: `${Math.max((summary.availableAfterLoans / summary.totalIncome) * 100, 0)}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground text-right">{((summary.availableAfterLoans / summary.totalIncome) * 100).toFixed(1)}% remaining</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debt Breakdown Pie Chart */}
          <div className="card p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-6">Debt Composition</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {debtBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} 
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Debt-to-Income Ratio */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Debt-to-Income Ratio</h3>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative h-48 w-48 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  {/* Progress Circle */}
                  <path
                    className={`${
                      summary.debtToIncomeRatio < 36 ? 'text-green-500' :
                      summary.debtToIncomeRatio < 43 ? 'text-yellow-500' : 'text-red-500'
                    } transition-all duration-1000 ease-out`}
                    strokeDasharray={`${Math.min(summary.debtToIncomeRatio, 100)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{summary.debtToIncomeRatio.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">Ratio</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className={`font-medium ${
                  summary.debtToIncomeRatio < 36 ? 'text-green-600 dark:text-green-400' :
                  summary.debtToIncomeRatio < 43 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {summary.debtToIncomeRatio < 36 ? '✅ Excellent Health' : 
                   summary.debtToIncomeRatio < 43 ? '⚠️ Moderate Risk' : 
                   '🚨 High Risk'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {summary.debtToIncomeRatio < 36 
                    ? 'Your debt is well managed.' 
                    : 'Consider prioritizing debt repayment to improve financial stability.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Payment Timeline */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Loan Payment Timeline</h3>
          <p className="text-sm text-muted-foreground mb-6">Projected remaining balance over time</p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke={chartTextColor}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(month) => {
                    const years = Math.floor(month / 12);
                    return years > 0 ? `${years}y` : `${month}m`;
                  }}
                  minTickGap={30}
                />
                <YAxis 
                  stroke={chartTextColor}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {loans.map((loan, index) => (
                  <Line
                    key={loan.name}
                    type="monotone"
                    dataKey={loan.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Loans Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Individual Loan Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Loan Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">EMI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loans.map((loan, index) => (
                  <tr key={index} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{loan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400">{currencySymbol} {loan.principal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">{currencySymbol} {loan.interest.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-foreground">{currencySymbol} {(loan.principal + loan.interest).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 dark:text-orange-400">{currencySymbol} {loan.monthlyPayment.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-muted-foreground">{Math.floor(loan.tenure / 12)}y {loan.tenure % 12}m</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-secondary/50 font-semibold">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">TOTAL</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400">{currencySymbol} {summary.totalPrincipal.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">{currencySymbol} {summary.totalInterest.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-foreground">{currencySymbol} {summary.totalDebt.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 dark:text-orange-400">{currencySymbol} {summary.monthlyPayments.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-muted-foreground">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="card p-6 bg-yellow-50 dark:bg-yellow-900/20/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
              Smart Recommendations
            </h3>
            <div className="grid gap-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 shadow-sm ${
                    rec.type === 'warning'
                      ? 'bg-white dark:bg-gray-800 border-l-yellow-500'
                      : 'bg-white dark:bg-gray-800 border-l-green-500'
                  }`}
                >
                  <p className="text-sm text-foreground">{rec.message}</p>
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
                  label={(props: any) => `${props.name}: ${currencySymbol}${props.value.toLocaleString()}`}
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
