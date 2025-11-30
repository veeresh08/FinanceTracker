import React, { useEffect, useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../api';
import { DashboardAnalytics, UserProfile } from '../types';
import { useUser } from '../UserContext';

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#e879f9'];

const ModernDashboard: React.FC = () => {
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

  // Timeline Data Logic (Optimized)
  const timelineData = useMemo(() => {
    if (!analytics?.loans?.length) return [];
    const loans = analytics.loans;
    const data: any[] = [];
    const maxTenure = Math.max(...loans.map(l => l.tenure), 0);
    const step = maxTenure <= 36 ? 1 : maxTenure <= 120 ? 3 : 6;
    
    for (let month = 0; month <= maxTenure; month += step) {
      let totalBalance = 0;
      loans.forEach(loan => {
        if (month <= loan.tenure) {
          const monthlyRate = loan.interestRate / 12 / 100;
          const remainingMonths = loan.tenure - month;
          if (remainingMonths > 0) {
            totalBalance += loan.monthlyPayment * ((Math.pow(1 + monthlyRate, remainingMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)));
          }
        }
      });
      data.push({ month, totalBalance: Math.round(totalBalance) });
    }
    return data;
  }, [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!analytics || !profile) return null;

  const { summary, loans, recommendations } = analytics;
  const currencySymbol = profile.currency === 'INR' ? '₹' : '$';
  const netWorth = (summary.totalInvested || 0) - summary.totalDebt; // Simplified net worth

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section with Gradient Overlay */}
      <div className="relative pt-8 pb-12 px-6 lg:px-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-sky-500"></div>
              <span className="text-sky-400 uppercase tracking-widest text-xs font-bold">Overview</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-2">
              {greeting}, <span className="gradient-text">{currentUser?.user_name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 max-w-md">
              Here's your financial breakdown for today. You're making great progress on your goals.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-1">Estimated Net Worth</p>
              <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currencySymbol} {Math.abs(netWorth).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xl">💎</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Debt & Loan Cards */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-midnight p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                  <span className="badge-status badge-danger">High Priority</span>
                </div>
                <p className="text-slate-400 text-sm">Total Debt</p>
                <h3 className="text-2xl text-white mt-1">{currencySymbol} {summary.totalDebt.toLocaleString()}</h3>
              </div>

              <div className="card-midnight p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="badge-status badge-info">Monthly</span>
                </div>
                <p className="text-slate-400 text-sm">Monthly Payment</p>
                <h3 className="text-2xl text-white mt-1">{currencySymbol} {summary.monthlyPayments.toLocaleString()}</h3>
              </div>

              <div className="card-midnight p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="badge-status badge-success">Target</span>
                </div>
                <p className="text-slate-400 text-sm">Debt Free In</p>
                <h3 className="text-2xl text-white mt-1">{summary.yearsRemaining} Years</h3>
              </div>
            </div>

            {/* Loan Repayment Chart (Sleek Area Chart) */}
            <div className="card-midnight">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl text-white">Repayment Projection</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Projected Balance
                  </span>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      tick={{fontSize: 12}} 
                      tickFormatter={(val) => `${Math.floor(val/12)}y`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{fontSize: 12}} 
                      tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: any) => [`${currencySymbol} ${value.toLocaleString()}`, 'Remaining Debt']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalBalance" 
                      stroke="#38bdf8" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Loans List */}
            <div className="space-y-4">
              <h3 className="text-xl text-white font-bold">Active Loans</h3>
              {loans.map((loan, idx) => (
                <div key={idx} className="card-midnight p-0 hover:border-sky-500/30 group transition-all">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        ['bg-sky-500/10 text-sky-400', 'bg-violet-500/10 text-violet-400', 'bg-pink-500/10 text-pink-400'][idx % 3]
                      }`}>
                        {['🏠', '🚗', '🎓', '💳'][idx % 4]}
                      </div>
                      <div>
                        <h4 className="text-white text-lg">{loan.name}</h4>
                        <p className="text-slate-400 text-sm">{loan.interestRate}% Interest • {loan.tenure} Months Left</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Balance</p>
                        <p className="text-white font-bold">{currencySymbol} {loan.principal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Monthly</p>
                        <p className="text-sky-400 font-bold">{currencySymbol} {loan.monthlyPayment.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar at Bottom */}
                  <div className="h-1 w-full bg-slate-800">
                    <div 
                      className={`h-full ${['bg-sky-500', 'bg-violet-500', 'bg-pink-500'][idx % 3]}`} 
                      style={{ width: `${Math.random() * 40 + 10}%` }} // Mock progress for visual, ideally calculated
                    ></div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Insights & Goals */}
          <div className="space-y-8">
            
            {/* Financial Health Score */}
            <div className="card-midnight relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-xl text-white mb-6 relative z-10">Financial Health</h3>
              
              <div className="flex flex-col items-center justify-center relative z-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* SVG Circle Progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="#1e293b" strokeWidth="12" fill="none" />
                    <circle 
                      cx="96" cy="96" r="88" 
                      stroke="#34d399" 
                      strokeWidth="12" 
                      fill="none" 
                      strokeDasharray={2 * Math.PI * 88}
                      strokeDashoffset={2 * Math.PI * 88 * (1 - (summary.debtToIncomeRatio < 30 ? 0.85 : summary.debtToIncomeRatio < 50 ? 0.6 : 0.4))}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-bold text-white">
                      {summary.debtToIncomeRatio < 30 ? '85' : summary.debtToIncomeRatio < 50 ? '65' : '45'}
                    </span>
                    <span className="block text-xs text-slate-400 uppercase font-bold">Score</span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className={`text-lg font-medium ${summary.debtToIncomeRatio < 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {summary.debtToIncomeRatio < 40 ? 'Excellent Condition' : 'Needs Attention'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Your debt-to-income ratio is {summary.debtToIncomeRatio.toFixed(1)}%. 
                    {summary.debtToIncomeRatio < 40 ? ' Keep it up!' : ' Try to reduce high-interest debt.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations Widget */}
            <div className="card-midnight">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl text-white">Smart Insights</h3>
              </div>
              
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                    <p className={`text-sm font-medium mb-1 ${rec.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {rec.type === 'warning' ? 'Optimization Opportunity' : 'Great Job'}
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">{rec.message}</p>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>No recommendations yet. Add more loan data!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Goal Card (Mockup) */}
            <div className="card-midnight relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold">Emergency Fund</h3>
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-4">Target: {currencySymbol} 100,000</p>
                
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full w-[45%]"></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{currencySymbol} 45,000</span>
                  <span className="text-slate-400">45%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;

