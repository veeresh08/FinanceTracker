import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { DashboardAnalytics, UserProfile } from '../types';
import { useUser } from '../UserContext';

const Home: React.FC = () => {
  const { currentUser } = useUser();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser]);

  const fetchAnalytics = async () => {
    if (!currentUser) return;
    try {
      const [analyticsRes, profileRes] = await Promise.all([
        api.getDashboardAnalytics(currentUser.id),
        api.getProfile(currentUser.id)
      ]);
      setAnalytics(analyticsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const summary = analytics?.summary;
  const currencySymbol = profile?.currency === 'INR' ? '₹' : '$';

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 px-6 lg:px-12 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">System Operational</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Master Your <br/>
            <span className="gradient-text">Financial Universe</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Welcome back, <span className="text-white font-semibold">{currentUser?.user_name}</span>. 
            Your personal command center for tracking loans, investments, and net worth.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-primary btn-glow">
              Go to Dashboard
            </button>
            <button className="btn-secondary">
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      {summary && (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-20 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Active Loans */}
            <div className="card-midnight group cursor-pointer hover:-translate-y-2">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Loans</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{summary.totalLoans}</h3>
              <p className="text-slate-400 text-sm">Active accounts</p>
            </div>

            {/* Total Debt */}
            <div className="card-midnight group cursor-pointer hover:-translate-y-2">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Debt</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{currencySymbol}{summary.totalDebt.toLocaleString()}</h3>
              <p className="text-slate-400 text-sm">Outstanding balance</p>
            </div>

            {/* Monthly Payment */}
            <div className="card-midnight group cursor-pointer hover:-translate-y-2">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{currencySymbol}{summary.monthlyPayments.toLocaleString()}</h3>
              <p className="text-slate-400 text-sm">Next payment due</p>
            </div>

            {/* Debt Free Date */}
            <div className="card-midnight group cursor-pointer hover:-translate-y-2">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Goal</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{summary.yearsRemaining} Years</h3>
              <p className="text-slate-400 text-sm">To financial freedom</p>
            </div>

          </div>
        </div>
      )}

      {/* Feature Highlight */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Intelligent Insights <br/>
              <span className="text-slate-400">at your fingertips.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              We analyze your debt-to-income ratio, loan amortization schedules, and spending habits to provide actionable recommendations.
            </p>
            
            <ul className="space-y-4">
              {['Real-time net worth tracking', 'Smart loan closure strategies', 'Investment growth projections'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-violet-500 rounded-3xl blur-2xl opacity-20"></div>
            <div className="card-midnight relative p-8 border-slate-700/50">
              {/* Mock UI Element */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="h-2 w-24 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-slate-600 rounded"></div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-700"></div>
              </div>
              <div className="space-y-4">
                <div className="h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                <div className="h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                <div className="h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
