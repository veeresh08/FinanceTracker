import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { DashboardAnalytics, UserProfile } from '../types';
import { useUser } from '../UserContext';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Calendar, Target, AlertTriangle, CheckCircle, DollarSign, PieChart, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const { currentUser } = useUser();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser]);

  const fetchAnalytics = async () => {
    if (!currentUser) return;
    try {
      const [analyticsRes, profileRes, investmentsRes] = await Promise.all([
        api.getDashboardAnalytics(currentUser.id),
        api.getProfile(currentUser.id),
        api.getInvestments(currentUser.id)
      ]);
      setAnalytics(analyticsRes.data);
      setProfile(profileRes.data);
      setInvestments(investmentsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary;
  const currencySymbol = profile?.currency === 'INR' ? '₹' : profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : '$';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Hero Section */}
        <div className="text-center py-12 animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className="inline-flex items-center justify-center p-2 bg-accent/50 rounded-full mb-6 backdrop-blur-sm">
            <span className="text-sm font-medium px-3">👋 Welcome back</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {currentUser?.user_name || 'User'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your complete financial command center. Track, analyze, and grow your wealth.
          </p>
        </div>

        {/* Quick Stats Grid */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100">
            
            {/* Active Loans */}
            <div className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <div className="card-header pb-2">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <CreditCard size={24} />
                  </div>
                  <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-none">Active</span>
                </div>
              </div>
              <div className="card-content">
                <div className="text-sm font-medium text-muted-foreground">Active Loans</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.totalLoans}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Manage loans <ArrowRight size={12} />
                </div>
              </div>
            </div>

            {/* Total Debt */}
            <div className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
              <div className="card-header pb-2">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                    <TrendingDown size={24} />
                  </div>
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-none">Outstanding</span>
                </div>
              </div>
              <div className="card-content">
                <div className="text-sm font-medium text-muted-foreground">Total Debt</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{currencySymbol}{summary.totalDebt.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Track progress <ArrowRight size={12} />
                </div>
              </div>
            </div>

            {/* Monthly Payment */}
            <div className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <div className="card-header pb-2">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                    <Calendar size={24} />
                  </div>
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-none">Monthly</span>
                </div>
              </div>
              <div className="card-content">
                <div className="text-sm font-medium text-muted-foreground">Monthly Payment</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{currencySymbol}{summary.monthlyPayments.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  View breakdown <ArrowRight size={12} />
                </div>
              </div>
            </div>

            {/* Debt Free Goal */}
            <div className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <div className="card-header pb-2">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                    <Target size={24} />
                  </div>
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-none">Goal</span>
                </div>
              </div>
              <div className="card-content">
                <div className="text-sm font-medium text-muted-foreground">Debt-Free In</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.yearsRemaining}<span className="text-lg ml-1 text-muted-foreground font-medium">years</span></div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Stay on track <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Insights */}
        {analytics && analytics.recommendations && analytics.recommendations.length > 0 && (
          <div className="card bg-accent/50 dark:bg-accent/10 border-none shadow-md animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Smart Insights</h2>
                  <p className="text-sm text-muted-foreground">AI-powered recommendations for you</p>
                </div>
              </div>
            </div>
            <div className="card-content space-y-3">
              {analytics.recommendations.slice(0, 3).map((rec, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border flex items-start gap-3 bg-background/50 backdrop-blur-sm
                    ${rec.type === 'success' ? 'border-green-200 dark:border-green-900' : 
                      rec.type === 'warning' ? 'border-yellow-200 dark:border-yellow-900' : 
                      'border-blue-200 dark:border-blue-900'}`}
                >
                  <div className="mt-0.5">
                    {rec.type === 'success' ? (
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    ) : rec.type === 'warning' ? (
                      <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment Portfolio */}
        {investments.length > 0 && (
          <div className="card overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-700 delay-300">
            <div className="card-header bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <PieChart size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Investment Portfolio</h2>
                    <p className="text-sm text-muted-foreground">Your wealth building dashboard</p>
                  </div>
                </div>
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-none px-3 py-1">
                  Growing
                </span>
              </div>
            </div>
            <div className="card-content pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Invested */}
                <div className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                    <Wallet size={16} className="text-blue-500" />
                    Total Invested
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.principal || 0) + (inv.monthly_contribution * inv.tenure_months), 0).toLocaleString()}
                  </p>
                  <div className="w-full bg-secondary h-1.5 mt-3 rounded-full overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/200 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* Current Value */}
                <div className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                    <TrendingUp size={16} className="text-green-500" />
                    Current Value
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-3 font-medium">
                    <TrendingUp size={12} /> Growing steadily
                  </div>
                </div>

                {/* Monthly SIP */}
                <div className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                    <Calendar size={16} className="text-purple-500" />
                    Monthly SIP
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {currencySymbol}{investments.filter(i => i.status === 'active').reduce((sum, inv) => sum + inv.monthly_contribution, 0).toLocaleString()}
                  </p>
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-none mt-3 text-[10px]">
                    Auto-invested
                  </span>
                </div>

                {/* Active Plans */}
                <div className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                    <Target size={16} className="text-orange-500" />
                    Active Plans
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {investments.filter(i => i.status === 'active').length}
                  </p>
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-none mt-3 text-[10px]">
                    All on track
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        {summary && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-400">
            {/* Total Interest */}
            <div className="card overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-1">Total Interest</p>
                    <h3 className="text-3xl font-bold">{currencySymbol}{summary.totalInterest.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                  <span className="text-red-100">Burden</span>
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                    {((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Income */}
            <div className="card overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Monthly Income</p>
                    <h3 className="text-3xl font-bold">{currencySymbol}{summary.totalIncome.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DollarSign size={20} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                  <span className="text-green-100">Savings potential</span>
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                    {currencySymbol}{summary.availableAfterLoans.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Principal */}
            <div className="card overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Principal Amount</p>
                    <h3 className="text-3xl font-bold">{currencySymbol}{summary.totalPrincipal.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Wallet size={20} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                  <span className="text-blue-100">Remaining</span>
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                    {currencySymbol}{summary.totalDebt.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4 animate-in fade-in duration-700 delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-muted-foreground text-sm">
            <span>🚀 You're on the right track! Keep managing your finances wisely.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

          <div className="portfolio-card mb-16 animate-zoom-in overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Investment Portfolio</h2>
                  <p className="text-gray-600 font-medium">Your wealth building dashboard</p>
                </div>
              </div>
              <div className="badge badge-purple text-lg px-6 py-2">
                <span className="pulse-dot bg-purple-500 mr-2"></span>
                Growing
              </div>
            </div>
            <div className="responsive-grid-4">
              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Total Invested</span>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.principal || 0) + (inv.monthly_contribution * inv.tenure_months), 0).toLocaleString()}
                </p>
                <div className="progress-bar-container mt-3">
                  <div className="progress-bar-fill progress-gradient-blue" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Current Value</span>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0).toLocaleString()}
                </p>
                <div className="metric-change-positive mt-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                  <span>Growing steadily</span>
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Monthly SIP</span>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {currencySymbol}{investments.filter(i => i.status === 'active').reduce((sum, inv) => sum + inv.monthly_contribution, 0).toLocaleString()}
                </p>
                <div className="badge badge-purple mt-2">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                  Auto-invested
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Active Plans</span>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {investments.filter(i => i.status === 'active').length}
                </p>
                <div className="badge badge-green mt-2">All on track</div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Financial Summary */}
        {summary && profile && (
          <div className="responsive-grid-3 mb-16">
            <div className="glass-card-hover animate-slide-up overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Total Interest</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Over Time</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-red-600 mb-3 counter-up">{currencySymbol}{summary.totalInterest.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Amount you'll pay in interest</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Interest Burden</span>
                  <span className="font-bold text-red-600">{((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="glass-card-hover animate-slide-up overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Monthly Income</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Salary</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-green-600 mb-3 counter-up">{currencySymbol}{summary.totalIncome.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Your total monthly earnings</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Available for savings</span>
                  <span className="font-bold text-green-600">{currencySymbol}{summary.availableAfterLoans.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="glass-card-hover animate-slide-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Principal</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Borrowed</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-blue-600 mb-3 counter-up">{currencySymbol}{summary.totalPrincipal.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Total amount borrowed</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Remaining to pay</span>
                  <span className="font-bold text-blue-600">{currencySymbol}{summary.totalDebt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Financial Goals */}
        {summary && (
          <div className="glass-card shadow-2xl p-10 animate-fade-in">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Your Financial Goals</h2>
                <p className="text-gray-600 font-medium text-lg">Track your progress to financial freedom</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Main Goal Card */}
              <div className="success-card hover-lift-subtle card-interactive">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">Become Debt-Free 🎉</p>
                        <p className="text-sm text-gray-600 font-semibold mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          Target: <span className="ml-1 text-green-700">{new Date(summary.allLoansClearedBy).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl animate-bounce-in">✅</div>
                </div>
              </div>

              {/* Financial Health Metrics */}
              <div className="responsive-grid-2">
                <div className="info-card hover-lift-subtle shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="font-bold text-gray-700">Debt-to-Income Ratio</span>
                    </div>
                    <div className={`health-indicator ${
                      summary.debtToIncomeRatio < 36 ? 'health-excellent' :
                      summary.debtToIncomeRatio < 43 ? 'health-good' :
                      'health-poor'
                    }`}>
                      {summary.debtToIncomeRatio < 36 ? '✅ Excellent' : 
                       summary.debtToIncomeRatio < 43 ? '⚠️ Good' : 
                       '🚨 High'}
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-blue-700 mb-4">{summary.debtToIncomeRatio.toFixed(1)}%</p>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill progress-gradient-blue"
                      style={{ width: `${Math.min(summary.debtToIncomeRatio, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 font-medium">
                    {summary.debtToIncomeRatio < 36 
                      ? 'Your debt level is very manageable relative to your income' 
                      : summary.debtToIncomeRatio < 43 
                      ? 'Your debt level is manageable but could be improved'
                      : 'Consider reducing debt to improve financial health'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg hover-lift-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="font-bold text-gray-700">Available After Loans</span>
                    </div>
                    <div className="badge badge-purple">Disposable</div>
                  </div>
                  <p className="text-4xl font-extrabold text-purple-700 mb-4">{currencySymbol}{summary.availableAfterLoans.toLocaleString()}</p>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill progress-gradient-purple"
                      style={{ width: `${(summary.availableAfterLoans / summary.totalIncome) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-600 font-medium">
                      {((summary.availableAfterLoans / summary.totalIncome) * 100).toFixed(1)}% of income remaining
                    </p>
                    <div className="badge badge-green text-xs">
                      <span className="pulse-dot bg-green-500 mr-1"></span>
                      Healthy
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Freedom Progress */}
            <div className="mt-8 pt-8 border-t-2 border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-7 h-7 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Financial Freedom Journey
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Years Remaining</p>
                  <p className="text-3xl font-bold text-gradient-green">{summary.yearsRemaining}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-6 overflow-hidden shadow-inner mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-full flex items-center justify-end pr-4 shadow-lg transition-all duration-1000"
                  style={{ width: `${Math.max(10, 100 - (summary.yearsRemaining * 10))}%` }}
                >
                  <span className="text-white text-xs font-bold drop-shadow">
                    {Math.max(10, 100 - (summary.yearsRemaining * 10)).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Started</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">Now</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="pulse-dot bg-yellow-500 mx-auto mb-2"></div>
                  <p className="text-sm font-semibold text-gray-600">In Progress</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{summary.yearsRemaining}y left</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Goal</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{new Date(summary.allLoansClearedBy).getFullYear()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-block p-8 glass-card rounded-3xl">
            <p className="text-2xl font-bold text-gradient-blue mb-2">
              You're on the right track! 🚀
            </p>
            <p className="text-gray-600 font-medium">
              Keep managing your finances wisely and you'll achieve your goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

          <div className="portfolio-card mb-16 animate-zoom-in overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Investment Portfolio</h2>
                  <p className="text-gray-600 font-medium">Your wealth building dashboard</p>
                </div>
              </div>
              <div className="badge badge-purple text-lg px-6 py-2">
                <span className="pulse-dot bg-purple-500 mr-2"></span>
                Growing
              </div>
            </div>
            <div className="responsive-grid-4">
              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Total Invested</span>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.principal || 0) + (inv.monthly_contribution * inv.tenure_months), 0).toLocaleString()}
                </p>
                <div className="progress-bar-container mt-3">
                  <div className="progress-bar-fill progress-gradient-blue" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Current Value</span>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {currencySymbol}{investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0).toLocaleString()}
                </p>
                <div className="metric-change-positive mt-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                  <span>Growing steadily</span>
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Monthly SIP</span>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {currencySymbol}{investments.filter(i => i.status === 'active').reduce((sum, inv) => sum + inv.monthly_contribution, 0).toLocaleString()}
                </p>
                <div className="badge badge-purple mt-2">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                  Auto-invested
                </div>
              </div>

              <div className="metric-card hover-lift-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="metric-label text-xs">Active Plans</span>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {investments.filter(i => i.status === 'active').length}
                </p>
                <div className="badge badge-green mt-2">All on track</div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Financial Summary */}
        {summary && profile && (
          <div className="responsive-grid-3 mb-16">
            <div className="glass-card-hover animate-slide-up overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Total Interest</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Over Time</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-red-600 mb-3 counter-up">{currencySymbol}{summary.totalInterest.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Amount you'll pay in interest</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Interest Burden</span>
                  <span className="font-bold text-red-600">{((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="glass-card-hover animate-slide-up overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Monthly Income</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Salary</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-green-600 mb-3 counter-up">{currencySymbol}{summary.totalIncome.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Your total monthly earnings</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Available for savings</span>
                  <span className="font-bold text-green-600">{currencySymbol}{summary.availableAfterLoans.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="glass-card-hover animate-slide-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white mb-6 -mt-6 -mx-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Principal</h3>
                  </div>
                  <div className="badge bg-white/20 text-white border-white/30">Borrowed</div>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-blue-600 mb-3 counter-up">{currencySymbol}{summary.totalPrincipal.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Total amount borrowed</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Remaining to pay</span>
                  <span className="font-bold text-blue-600">{currencySymbol}{summary.totalDebt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Financial Goals */}
        {summary && (
          <div className="glass-card shadow-2xl p-10 animate-fade-in">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Your Financial Goals</h2>
                <p className="text-gray-600 font-medium text-lg">Track your progress to financial freedom</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Main Goal Card */}
              <div className="success-card hover-lift-subtle card-interactive">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">Become Debt-Free 🎉</p>
                        <p className="text-sm text-gray-600 font-semibold mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          Target: <span className="ml-1 text-green-700">{new Date(summary.allLoansClearedBy).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl animate-bounce-in">✅</div>
                </div>
              </div>

              {/* Financial Health Metrics */}
              <div className="responsive-grid-2">
                <div className="info-card hover-lift-subtle shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="font-bold text-gray-700">Debt-to-Income Ratio</span>
                    </div>
                    <div className={`health-indicator ${
                      summary.debtToIncomeRatio < 36 ? 'health-excellent' :
                      summary.debtToIncomeRatio < 43 ? 'health-good' :
                      'health-poor'
                    }`}>
                      {summary.debtToIncomeRatio < 36 ? '✅ Excellent' : 
                       summary.debtToIncomeRatio < 43 ? '⚠️ Good' : 
                       '🚨 High'}
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-blue-700 mb-4">{summary.debtToIncomeRatio.toFixed(1)}%</p>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill progress-gradient-blue"
                      style={{ width: `${Math.min(summary.debtToIncomeRatio, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 font-medium">
                    {summary.debtToIncomeRatio < 36 
                      ? 'Your debt level is very manageable relative to your income' 
                      : summary.debtToIncomeRatio < 43 
                      ? 'Your debt level is manageable but could be improved'
                      : 'Consider reducing debt to improve financial health'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg hover-lift-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <span className="font-bold text-gray-700">Available After Loans</span>
                    </div>
                    <div className="badge badge-purple">Disposable</div>
                  </div>
                  <p className="text-4xl font-extrabold text-purple-700 mb-4">{currencySymbol}{summary.availableAfterLoans.toLocaleString()}</p>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill progress-gradient-purple"
                      style={{ width: `${(summary.availableAfterLoans / summary.totalIncome) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-600 font-medium">
                      {((summary.availableAfterLoans / summary.totalIncome) * 100).toFixed(1)}% of income remaining
                    </p>
                    <div className="badge badge-green text-xs">
                      <span className="pulse-dot bg-green-500 mr-1"></span>
                      Healthy
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Freedom Progress */}
            <div className="mt-8 pt-8 border-t-2 border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-7 h-7 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Financial Freedom Journey
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Years Remaining</p>
                  <p className="text-3xl font-bold text-gradient-green">{summary.yearsRemaining}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-6 overflow-hidden shadow-inner mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-full flex items-center justify-end pr-4 shadow-lg transition-all duration-1000"
                  style={{ width: `${Math.max(10, 100 - (summary.yearsRemaining * 10))}%` }}
                >
                  <span className="text-white text-xs font-bold drop-shadow">
                    {Math.max(10, 100 - (summary.yearsRemaining * 10)).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Started</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">Now</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="pulse-dot bg-yellow-500 mx-auto mb-2"></div>
                  <p className="text-sm font-semibold text-gray-600">In Progress</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{summary.yearsRemaining}y left</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Goal</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{new Date(summary.allLoansClearedBy).getFullYear()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-block p-8 glass-card rounded-3xl">
            <p className="text-2xl font-bold text-gradient-blue mb-2">
              You're on the right track! 🚀
            </p>
            <p className="text-gray-600 font-medium">
              Keep managing your finances wisely and you'll achieve your goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
