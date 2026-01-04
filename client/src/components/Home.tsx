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
