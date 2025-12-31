import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { api } from '../api';
import { MonthlyRecord, UserProfile } from '../types';
import { useUser } from '../UserContext';
import { 
  TrendingUp, Receipt, Target, Plus, Edit2, Trash2, Calendar,
  TrendingDown, DollarSign, Activity, PieChart as PieChartIcon, Coffee, Home, Lightbulb, CreditCard,
  CheckCircle2, Circle
} from 'lucide-react';

const ImprovedMonthlyTracker: React.FC = () => {
  const { currentUser } = useUser();
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [paidStatus, setPaidStatus] = useState<{ [key: string]: boolean }>({});

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

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const savedStatus = localStorage.getItem(`paid_status_${currentUser.id}`);
      if (savedStatus) setPaidStatus(JSON.parse(savedStatus));
    }
  }, [currentUser]);

  const togglePaid = (recordId: number, category: string) => {
    const key = `${recordId}_${category}`;
    const newStatus = { ...paidStatus, [key]: !paidStatus[key] };
    setPaidStatus(newStatus);
    localStorage.setItem(`paid_status_${currentUser?.id}`, JSON.stringify(newStatus));
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [recordsRes, profileRes] = await Promise.all([
        api.getMonthlyRecords(currentUser.id),
        api.getProfile(currentUser.id)
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
    if (!currentUser) return;
    try {
      const totalExpenses = (formData.rent || 0) + (formData.food || 0) + 
        (formData.transport || 0) + (formData.utilities || 0) + (formData.entertainment || 0);
      
      const payload = {
        ...formData,
        user_id: currentUser.id,
        other_expenses: totalExpenses,
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
      rent: record.rent || 0,
      food: record.food || 0,
      transport: record.transport || 0,
      utilities: record.utilities || 0,
      entertainment: record.entertainment || 0,
      credit_card: record.credit_card || 0,
      investments: record.investments || 0,
      emergency_fund: record.emergency_fund || 0,
      notes: record.notes || '',
    });
    setEditingId(record.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`Delete this record?`)) {
      try {
        await api.deleteMonthlyRecord(id);
        await fetchData();
      } catch (error) {
        alert('❌ Failed to delete record');
      }
    }
  };

  const resetForm = () => {
    const monthToUse = selectedMonth === 'all' ? new Date().toLocaleString('default', { month: 'long' }) : selectedMonth;
    const monthlyInvestmentAmount = (window as any).__MONTHLY_INVESTMENT__ || 0;
    
    setFormData({
      month: monthToUse,
      year: selectedYear,
      salary: profile?.monthly_salary || 0,
      other_income: profile?.other_income || 0,
      rent: 0, food: 0, transport: 0, utilities: 0, entertainment: 0, credit_card: 0,
      investments: monthlyInvestmentAmount,
      emergency_fund: 0, notes: '',
    });
    setEditingId(null);
  };

  const filteredRecords = records.filter(record => {
    if (selectedMonth === 'all') return record.year === selectedYear;
    return record.month === selectedMonth && record.year === selectedYear;
  });

  const currencySymbol = profile?.currency === 'INR' ? '₹' : '$';
  const years = Array.from(new Set(records.map(r => r.year))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear());

  // === ANALYTICS & CALCULATIONS ===
  const totalIncome = filteredRecords.reduce((sum, r) => sum + r.total_income, 0);
  const totalLoanPayments = filteredRecords.reduce((sum, r) => sum + r.total_loan_payment, 0);
  const totalExpenses = filteredRecords.reduce((sum, r) => sum + r.other_expenses, 0);
  const totalInvestments = filteredRecords.reduce((sum, r) => sum + (r.investments || 0), 0);
  const totalCreditCard = filteredRecords.reduce((sum, r) => sum + (r.credit_card || 0), 0);
  const totalEmergencyFund = filteredRecords.reduce((sum, r) => sum + (r.emergency_fund || 0), 0);
  
  // Specific Category Totals for Analysis
  const totalRent = filteredRecords.reduce((sum, r) => sum + (r.rent || 0), 0);
  const totalFood = filteredRecords.reduce((sum, r) => sum + (r.food || 0), 0);
  const totalTransport = filteredRecords.reduce((sum, r) => sum + (r.transport || 0), 0);
  const totalEntertainment = filteredRecords.reduce((sum, r) => sum + (r.entertainment || 0), 0);
  const totalUtilities = filteredRecords.reduce((sum, r) => sum + (r.utilities || 0), 0);

  const totalOutflow = totalLoanPayments + totalExpenses + totalInvestments + totalCreditCard + totalEmergencyFund;
  const totalSavings = totalIncome - totalOutflow;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Percentage Calculations for Progress Bars
  const pLoan = totalIncome > 0 ? (totalLoanPayments / totalIncome) * 100 : 0;
  const pCC = totalIncome > 0 ? (totalCreditCard / totalIncome) * 100 : 0;
  const pLiving = totalIncome > 0 ? ((totalRent + totalFood + totalTransport + totalUtilities) / totalIncome) * 100 : 0;
  const pFun = totalIncome > 0 ? (totalEntertainment / totalIncome) * 100 : 0;
  const pInv = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const pSave = totalIncome > 0 ? (Math.max(0, totalSavings) / totalIncome) * 100 : 0;

  // Health Logic
  const getRecommendations = () => {
    const recs = [];
    if (savingsRate < 20) recs.push({ type: 'danger', msg: "Savings Rate Low (<20%)", tip: "Try to cut down on entertainment or dining out." });
    else recs.push({ type: 'success', msg: "Healthy Savings Rate (>20%)", tip: "Great job! Consider increasing your SIPs." });

    if (pLoan > 40) recs.push({ type: 'danger', msg: "High Debt Burden (>40%)", tip: "Your EMIs are eating up a large chunk of income. Avoid new loans." });
    
    if (totalEmergencyFund === 0) recs.push({ type: 'warning', msg: "No Emergency Fund Added", tip: "Start small. Even ₹5,000/month helps build a safety net." });
    
    if (pFun > 15) recs.push({ type: 'warning', msg: "High Lifestyle Spend (>15%)", tip: "You're spending a lot on fun/entertainment. Is this sustainable?" });

    return recs;
  };

  const recommendations = getRecommendations();

  // Donut Data
  const donutData = [
    { name: 'Needs (Living)', value: totalRent + totalFood + totalUtilities + totalTransport, color: '#f97316' }, // Orange
    { name: 'Wants (Fun)', value: totalEntertainment + totalCreditCard, color: '#a855f7' }, // Purple
    { name: 'Debts (EMI)', value: totalLoanPayments, color: '#ef4444' }, // Red
    { name: 'Future (Save)', value: totalInvestments + totalEmergencyFund + Math.max(0, totalSavings), color: '#22c55e' } // Green
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="h-8 w-8 text-blue-600" />
              Monthly Tracker
            </h1>
            <p className="text-muted-foreground mt-1">Income Analysis • Expenses • Savings</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="px-4 py-2 rounded-lg border bg-card text-foreground font-medium"
              value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">📅 All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              className="px-4 py-2 rounded-lg border bg-card text-foreground font-medium"
              value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => { setShowAddForm(!showAddForm); if(!showAddForm) resetForm(); }}
              className="btn-premium flex items-center gap-2"
            >
              {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Record</>}
            </button>
          </div>
        </div>

        {/* ==================== ADD/EDIT FORM ==================== */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 mb-8 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Receipt size={20}/> {editingId ? 'Edit Record' : 'Add New Record'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Month & Year Selection */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-border">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Select Month</label>
                  <select 
                    className="input-premium w-full" 
                    value={formData.month} 
                    onChange={e => setFormData({...formData, month: e.target.value})}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Enter Year</label>
                  <input 
                    type="number" 
                    className="input-premium w-full" 
                    value={formData.year} 
                    onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
                    placeholder="2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl border bg-green-50/50 dark:bg-green-900/10 border-green-100 col-span-2">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex gap-2 items-center"><DollarSign size={16}/> Income</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium">Salary</label><input type="number" className="input-premium" value={formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">Other</label><input type="number" className="input-premium" value={formData.other_income} onChange={e => setFormData({...formData, other_income: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 col-span-2">
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex gap-2 items-center"><Home size={16}/> Living</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium">Rent</label><input type="number" className="input-premium" value={formData.rent} onChange={e => setFormData({...formData, rent: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">Food</label><input type="number" className="input-premium" value={formData.food} onChange={e => setFormData({...formData, food: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">Travel</label><input type="number" className="input-premium" value={formData.transport} onChange={e => setFormData({...formData, transport: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">Utils</label><input type="number" className="input-premium" value={formData.utilities} onChange={e => setFormData({...formData, utilities: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 col-span-2">
                  <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-3 flex gap-2 items-center"><Target size={16}/> Lifestyle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium">Fun/Ent</label><input type="number" className="input-premium" value={formData.entertainment} onChange={e => setFormData({...formData, entertainment: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">Cards</label><input type="number" className="input-premium" value={formData.credit_card} onChange={e => setFormData({...formData, credit_card: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 col-span-2">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex gap-2 items-center"><TrendingUp size={16}/> Future</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium">Invest</label><input type="number" className="input-premium" value={formData.investments} onChange={e => setFormData({...formData, investments: parseFloat(e.target.value) || 0})} /></div>
                    <div><label className="text-xs font-medium">E-Fund</label><input type="number" className="input-premium" value={formData.emergency_fund} onChange={e => setFormData({...formData, emergency_fund: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary-premium">Cancel</button><button type="submit" className="btn-premium">Save Record</button></div>
            </form>
          </div>
        )}

        {/* ==================== 1. INCOME VISUALIZER ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Utilization Card */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <PieChartIcon className="text-primary"/> Where is your Money Going?
            </h2>
            
            {/* Total Income Stacked Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Income Utilization</span>
                <span className="text-muted-foreground">{totalOutflow.toLocaleString()} / {totalIncome.toLocaleString()}</span>
              </div>
              <div className="h-8 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner border border-gray-200 dark:border-gray-700">
                {pLoan > 0 && <div style={{width: `${pLoan}%`}} className="bg-red-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Loans">EMI</div>}
                {pCC > 0 && <div style={{width: `${pCC}%`}} className="bg-purple-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Credit Card">CC</div>}
                {pLiving > 0 && <div style={{width: `${pLiving}%`}} className="bg-orange-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Living">Live</div>}
                {pFun > 0 && <div style={{width: `${pFun}%`}} className="bg-pink-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Fun">Fun</div>}
                {pInv > 0 && <div style={{width: `${pInv}%`}} className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Investments">Inv</div>}
                {pSave > 0 && <div style={{width: `${pSave}%`}} className="bg-green-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Savings">Sav</div>}
              </div>
            </div>

            {/* Individual Breakdown Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* EMI */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><TrendingDown size={14} className="text-red-500"/> Loan EMI</span>
                  <span className="font-bold text-red-600">{currencySymbol}{totalLoanPayments.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div style={{width: `${pLoan}%`}} className="bg-red-500 h-full rounded-full"/></div>
              </div>

              {/* Credit Card */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><CreditCard size={14} className="text-purple-500"/> Credit Card</span>
                  <span className="font-bold text-purple-600">{currencySymbol}{totalCreditCard.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div style={{width: `${pCC}%`}} className="bg-purple-500 h-full rounded-full"/></div>
              </div>

              {/* Living Expenses */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Home size={14} className="text-orange-500"/> Living (Rent/Food)</span>
                  <span className="font-bold text-orange-600">{currencySymbol}{(totalRent+totalFood+totalUtilities+totalTransport).toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div style={{width: `${pLiving}%`}} className="bg-orange-500 h-full rounded-full"/></div>
              </div>

              {/* Fun */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Coffee size={14} className="text-pink-500"/> Fun & Ent</span>
                  <span className="font-bold text-pink-600">{currencySymbol}{totalEntertainment.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div style={{width: `${pFun}%`}} className="bg-pink-500 h-full rounded-full"/></div>
              </div>

              {/* Investments */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> Investments</span>
                  <span className="font-bold text-blue-600">{currencySymbol}{totalInvestments.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div style={{width: `${pInv}%`}} className="bg-blue-500 h-full rounded-full"/></div>
              </div>
            </div>
          </div>

          {/* Money Left / Savings Card */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-emerald-100 font-medium mb-1">Net Savings / Money Left</h3>
              <p className="text-xs text-emerald-200 mb-6">Calculated after Loans, CC, Bills & Investments</p>
              
              <div className="text-5xl font-extrabold tracking-tight">
                {currencySymbol}{totalSavings.toLocaleString()}
              </div>
              {totalSavings < 0 && <div className="mt-2 bg-red-500/20 border border-red-400/50 rounded px-2 py-1 text-xs font-bold inline-block">DEFICIT WARNING</div>}
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm flex justify-between items-center">
                <p className="text-xs text-emerald-100">Savings Rate</p>
                <div className="text-right">
                  <span className="text-xl font-bold">{savingsRate.toFixed(1)}%</span>
                  <p className="text-[10px]">{savingsRate > 20 ? '🎉 Excellent' : '⚠️ Target 20%'}</p>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* ==================== 2. DETAILED EXPANDED TABLE ==================== */}
        <div className="card overflow-hidden shadow-md mb-8">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Calendar size={18}/> Detailed Monthly Records</h3>
            <span className="text-xs text-muted-foreground">{filteredRecords.length} records found</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right text-green-600">Income</th>
                  <th className="px-4 py-3 text-right text-red-600">EMI</th>
                  <th className="px-4 py-3 text-right">Rent</th>
                  <th className="px-4 py-3 text-right">Food</th>
                  <th className="px-4 py-3 text-right">Travel</th>
                  <th className="px-4 py-3 text-right">Utils</th>
                  <th className="px-4 py-3 text-right text-pink-600">Fun</th>
                  <th className="px-4 py-3 text-right text-purple-600">CC</th>
                  <th className="px-4 py-3 text-right text-blue-600">Invest</th>
                  <th className="px-4 py-3 text-right text-emerald-600">E-Fund</th>
                  <th className="px-4 py-3 text-right font-bold bg-green-50/50 dark:bg-green-900/10">Leftover</th>
                  <th className="px-4 py-3 text-center min-w-[140px]">Payment Checklist</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map(record => {
                  const net = record.total_income - record.total_loan_payment - record.other_expenses - (record.investments||0) - (record.emergency_fund||0) - (record.credit_card||0);
                  return (
                    <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <div className="text-foreground">{record.month}</div>
                        <div className="text-xs text-muted-foreground">{record.year}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{currencySymbol}{record.total_income.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{currencySymbol}{record.total_loan_payment.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right opacity-80">{currencySymbol}{(record.rent||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right opacity-80">{currencySymbol}{(record.food||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right opacity-80">{currencySymbol}{(record.transport||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right opacity-80">{currencySymbol}{(record.utilities||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-pink-600 font-medium">{currencySymbol}{(record.entertainment||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-purple-600 font-medium">{currencySymbol}{(record.credit_card||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-medium">{currencySymbol}{(record.investments||0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{currencySymbol}{(record.emergency_fund||0).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-bold bg-green-50/30 dark:bg-green-900/10 ${net < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {currencySymbol}{net.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <button 
                            onClick={() => togglePaid(record.id, 'rent')} 
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide w-full justify-start transition-all ${
                              paidStatus[`${record.id}_rent`] 
                                ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' 
                                : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {paidStatus[`${record.id}_rent`] ? <CheckCircle2 size={12} className="fill-green-600 text-white" /> : <Circle size={12} />}
                            Rent
                          </button>
                          <button 
                            onClick={() => togglePaid(record.id, 'cc')} 
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide w-full justify-start transition-all ${
                              paidStatus[`${record.id}_cc`] 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200 shadow-sm' 
                                : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {paidStatus[`${record.id}_cc`] ? <CheckCircle2 size={12} className="fill-purple-600 text-white" /> : <Circle size={12} />}
                            Card
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button onClick={() => handleEdit(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== 3. INSIGHTS & RECOMMENDATIONS ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18}/> 6-Month Spend Trend</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={records.slice(0, 6).reverse()}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="total_income" stroke="#22c55e" fill="url(#colorIncome)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="other_expenses" stroke="#f97316" fill="transparent" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border-indigo-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Lightbulb size={18}/> Smart Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.length > 0 ? recommendations.map((rec, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${rec.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : rec.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                  <p className="font-bold mb-1">{rec.msg}</p>
                  <p className="opacity-90 text-xs">{rec.tip}</p>
                </div>
              )) : (
                <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
                  <p className="font-bold">Everything looks good!</p>
                  <p className="text-xs">Keep up the great financial habits.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Needs vs Wants Donut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><PieChartIcon size={18}/> Needs vs Wants</h3>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `${currencySymbol}${val.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18}/> Burn Rate</h3>
            <div className="flex flex-col justify-center h-[200px] text-center">
              <p className="text-muted-foreground text-sm mb-2">You are spending approximately</p>
              <p className="text-4xl font-extrabold text-foreground">{currencySymbol}{((totalExpenses + totalCreditCard)/30).toFixed(0)}</p>
              <p className="text-muted-foreground text-sm mt-2">per day on lifestyle & bills</p>
              <div className="mt-6 p-3 bg-muted/30 rounded-lg text-xs">
                Does not include Loans or Investments
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImprovedMonthlyTracker;
