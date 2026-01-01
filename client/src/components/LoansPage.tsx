import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Loan } from '../types';
import { useUser } from '../UserContext';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Edit2, Trash2, Plus, Download, Upload, Lightbulb, TrendingUp, Calendar, DollarSign,
  Activity, ChevronDown, ChevronUp, Wallet
} from 'lucide-react';

const LoansPage: React.FC = () => {
  const { currentUser } = useUser();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [showExtraPaymentCalc, setShowExtraPaymentCalc] = useState<number | null>(null);
  const [newLoan, setNewLoan] = useState({
    name: '',
    type: 'personal',
    principal: 0,
    interest_rate: 0,
    tenure: 12,
    monthly_payment: 0,
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  useEffect(() => {
    if (currentUser) {
      fetchLoans();
    }
  }, [currentUser]);

  const fetchLoans = async () => {
    if (!currentUser) return;
    try {
      const response = await api.getLoans(currentUser.id);
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!currentUser) return;
    try {
      const response = await api.exportLoans(currentUser.id, format);
      const { data, count } = response.data;
      if (count === 0) {
        alert('No loans to export!');
        return;
      }
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loans_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting loans:', error);
      alert('❌ Failed to export loans');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const format = file.name.endsWith('.csv') ? 'csv' : 'json';
      const data = format === 'json' ? JSON.parse(text) : text;
      const response = await api.importLoans(currentUser.id, data, format);
      const { imported, errors, message } = response.data;
      await fetchLoans();
      alert(`${message}\n\n✅ Imported: ${imported}\n❌ Errors: ${errors}`);
      event.target.value = '';
    } catch (error) {
      console.error('Error importing loans:', error);
      alert('❌ Failed to import loans. Please check the file format.');
      event.target.value = '';
    }
  };

  const calculateAccurateAmortization = (loan: Loan) => {
    const monthlyRate = loan.interest_rate / 100 / 12;
    const months = loan.tenure;
    const principal = loan.principal;
    let balance = principal;
    const schedule = [];
    for (let month = 1; month <= months; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = loan.monthly_payment - interestPayment;
      balance = Math.max(0, balance - principalPayment);
      schedule.push({
        installmentNo: month,
        payment: loan.monthly_payment,
        principal: principalPayment,
        interest: interestPayment,
        closingPrincipal: balance
      });
    }
    return schedule;
  };

  const getCurrentInstallmentInfo = (loan: Loan) => {
    const startDate = new Date(loan.start_date);
    const today = new Date();
    const monthsElapsed = Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()));
    const currentInstallmentNo = Math.min(monthsElapsed + 1, loan.tenure);
    const schedule = calculateAccurateAmortization(loan);
    const currentInstallment = schedule[currentInstallmentNo - 1] || schedule[0];
    const remainingInstallments = Math.max(0, loan.tenure - monthsElapsed);
    const currentInstallmentDate = new Date(startDate);
    currentInstallmentDate.setMonth(currentInstallmentDate.getMonth() + currentInstallmentNo - 1);
    
    return {
      currentInstallmentNo,
      totalInstallments: loan.tenure,
      remainingInstallments,
      currentOutstanding: currentInstallment.closingPrincipal,
      currentMonthPrincipal: currentInstallment.principal,
      currentMonthInterest: currentInstallment.interest,
      currentInstallmentDate,
      schedule
    };
  };

  const calculateExtraPaymentImpact = (loan: Loan, extraAmount: number) => {
    const installmentInfo = getCurrentInstallmentInfo(loan);
    const { currentOutstanding, remainingInstallments } = installmentInfo;
    if (extraAmount <= 0) return null;
    const newOutstanding = Math.max(0, currentOutstanding - extraAmount);
    const monthlyRate = loan.interest_rate / 100 / 12;
    let newTenure = 0;
    if (newOutstanding > 0 && loan.monthly_payment > newOutstanding * monthlyRate) {
      newTenure = Math.ceil(Math.log(loan.monthly_payment / (loan.monthly_payment - newOutstanding * monthlyRate)) / Math.log(1 + monthlyRate));
    }
    const tenureReduction = remainingInstallments - newTenure;
    const emiSavings = tenureReduction * loan.monthly_payment;
    return {
      newOutstanding,
      newTenure,
      tenureReduction,
      emiSavings,
      monthsSaved: tenureReduction,
      yearsSaved: Math.floor(tenureReduction / 12),
      monthsRemaining: tenureReduction % 12
    };
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan({ ...loan });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingLoan) return;
    try {
      const updateData = {
        name: editingLoan.name,
        type: editingLoan.type,
        principal: editingLoan.principal,
        interest_rate: editingLoan.interest_rate,
        tenure: editingLoan.tenure,
        start_date: editingLoan.start_date,
        status: editingLoan.status || 'active'
      };
      await api.updateLoan(editingLoan.id, updateData);
      await fetchLoans();
      setEditingLoan(null);
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('❌ Failed to update loan');
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await api.createLoan({ ...newLoan, user_id: currentUser.id });
      await fetchLoans();
      setShowAddForm(false);
      setNewLoan({
        name: '',
        type: 'personal',
        principal: 0,
        interest_rate: 0,
        tenure: 12,
        monthly_payment: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteLoan(id);
      await fetchLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalMonthlyPayment = activeLoans.reduce((sum, loan) => sum + loan.monthly_payment, 0);
  const totalInterest = loans.reduce((sum, loan) => sum + (loan.total_interest || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900/50 p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              Your Loans <Wallet className="text-indigo-600" />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage, Track & Eliminate your Debt</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative inline-block">
              <button onClick={() => document.getElementById('loan-import-file')?.click()} className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded-xl transition-all flex items-center gap-2 border border-green-200 dark:border-green-800 font-medium">
                <Upload size={18} /> Import
              </button>
              <input id="loan-import-file" type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
            </div>
            
            <button onClick={() => handleExport('json')} className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 rounded-xl transition-all flex items-center gap-2 border border-purple-200 dark:border-purple-800 font-medium">
              <Download size={18} /> Export
            </button>

            <button onClick={() => { setShowAddForm(true); setEditingLoan(null); }} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 font-medium">
              <Plus size={18} /> Add New Loan
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-medium mb-1">Total Active Loans</p>
              <p className="text-4xl font-bold">{activeLoans.length}</p>
            </div>
            <Activity className="absolute right-4 bottom-4 text-blue-400/30 w-16 h-16" />
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-medium mb-1">Total Principal</p>
              <p className="text-3xl font-bold">₹{totalPrincipal.toLocaleString()}</p>
            </div>
            <DollarSign className="absolute right-4 bottom-4 text-indigo-400/30 w-16 h-16" />
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Monthly EMI</p>
              <p className="text-3xl font-bold">₹{totalMonthlyPayment.toLocaleString()}</p>
            </div>
            <Calendar className="absolute right-4 bottom-4 text-purple-400/30 w-16 h-16" />
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-orange-100 text-sm font-medium mb-1">Total Interest</p>
              <p className="text-3xl font-bold">₹{totalInterest.toLocaleString()}</p>
            </div>
            <TrendingUp className="absolute right-4 bottom-4 text-orange-400/30 w-16 h-16" />
          </div>
        </div>

        {/* Tabular Loan List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📋 All Loans
            </h2>
            <span className="text-sm text-gray-500">{loans.length} active loans</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left">Loan Name</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-right">Principal</th>
                  <th className="px-6 py-4 text-right">Monthly EMI</th>
                  <th className="px-6 py-4 text-left">Start Date</th>
                  <th className="px-6 py-4 text-left">Payoff Date</th>
                  <th className="px-6 py-4 text-left w-48">Progress</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loans.map((loan) => {
                   const installmentInfo = getCurrentInstallmentInfo(loan);
                   const progress = Math.min((installmentInfo.currentInstallmentNo / loan.tenure) * 100, 100);
                   const payoffDate = new Date(loan.start_date);
                   payoffDate.setMonth(payoffDate.getMonth() + loan.tenure);

                   return (
                    <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{loan.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                          {loan.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">₹{loan.principal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-purple-600 dark:text-purple-400">₹{loan.monthly_payment.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(loan.start_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payoffDate.toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-green-600">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(loan)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(loan.id, loan.name)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Dashboard per Loan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            📊 Detailed Loan Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeLoans.map(loan => {
              const info = getCurrentInstallmentInfo(loan);
              const { currentInstallmentNo, currentOutstanding, currentMonthPrincipal, currentMonthInterest, remainingInstallments } = info;
              const preclosureCharge = currentOutstanding * 0.04;
              const totalPreclosure = currentOutstanding + preclosureCharge;
              const savings = (loan.monthly_payment * remainingInstallments) - totalPreclosure;

              return (
                <div key={loan.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{loan.name}</h3>
                      <p className="text-xs text-gray-500">Started: {new Date(loan.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                        EMI #{currentInstallmentNo} / {loan.tenure}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">This Month</p>
                      <p className="font-bold text-blue-600 text-sm">₹{loan.monthly_payment.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Principal</p>
                      <p className="font-bold text-green-600 text-sm">₹{Math.round(currentMonthPrincipal).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Interest</p>
                      <p className="font-bold text-red-600 text-sm">₹{Math.round(currentMonthInterest).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-800 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Outstanding Principal</p>
                        <p className="text-xl font-extrabold text-orange-600">₹{Math.round(currentOutstanding).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Months Left</p>
                        <p className="text-xl font-extrabold text-gray-800 dark:text-gray-200">{remainingInstallments}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preclosure Insight */}
                  <div className={`p-3 rounded-lg text-xs border mb-4 ${savings > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                    <div className="flex gap-2 items-start">
                      <Lightbulb size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Preclosure Analysis</p>
                        <p>
                          {savings > 0 
                            ? `You could save ₹${Math.round(savings).toLocaleString()} by closing this loan today (paying ₹${Math.round(totalPreclosure).toLocaleString()}).` 
                            : `Not recommended to close early yet. Preclosure cost is higher than remaining EMIs.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                     <button onClick={() => setExpandedSchedule(expandedSchedule === loan.id ? null : loan.id)} className="flex-1 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-center items-center gap-2">
                       {expandedSchedule === loan.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                       {expandedSchedule === loan.id ? 'Hide Schedule' : 'Schedule'}
                     </button>
                     <button onClick={() => setShowExtraPaymentCalc(showExtraPaymentCalc === loan.id ? null : loan.id)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex justify-center items-center gap-2">
                       <DollarSign size={14}/> Extra Payment
                     </button>
                  </div>

                  {/* Expanded Sections (Simplified for brevity but functional) */}
                  {expandedSchedule === loan.id && (
                    <div className="mt-4 max-h-60 overflow-y-auto border rounded bg-white dark:bg-gray-800 text-xs">
                      <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                          <tr><th className="p-2 text-left">#</th><th className="p-2 text-right">Principal</th><th className="p-2 text-right">Interest</th><th className="p-2 text-right">Balance</th></tr>
                        </thead>
                        <tbody>
                          {info.schedule.map(s => (
                            <tr key={s.installmentNo} className={s.installmentNo === currentInstallmentNo ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                              <td className="p-2">{s.installmentNo}</td>
                              <td className="p-2 text-right">₹{Math.round(s.principal).toLocaleString()}</td>
                              <td className="p-2 text-right">₹{Math.round(s.interest).toLocaleString()}</td>
                              <td className="p-2 text-right">₹{Math.round(s.closingPrincipal).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {showExtraPaymentCalc === loan.id && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800 animate-in fade-in">
                      <h4 className="font-bold text-sm text-green-800 dark:text-green-300 mb-2">💰 Impact of ₹50,000 Extra Payment</h4>
                      {(() => {
                        const impact = calculateExtraPaymentImpact(loan, 50000);
                        if (!impact) return null;
                        return (
                          <div className="text-xs space-y-1 text-green-700 dark:text-green-400">
                            <p>• Saves <strong>{impact.tenureReduction} months</strong> of tenure</p>
                            <p>• Saves <strong>₹{impact.emiSavings.toLocaleString()}</strong> in future interest</p>
                            <p>• New Balance: ₹{impact.newOutstanding.toLocaleString()}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts & Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Principal vs Interest Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loans.map(l => ({ name: l.name, Principal: l.principal, Interest: l.total_interest || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Interest" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Loan Distribution (by Principal)</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={loans.map(l => ({ name: l.name, value: l.principal }))}
                     cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                   >
                     {loans.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Calculation Formulas Info - Collapsible */}
        <div className="mt-8 mb-6">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:from-gray-800 hover:to-black transition-all flex items-center justify-center gap-3 font-medium shadow-lg"
          >
            <span className="text-2xl">ℹ️</span>
            <span>{showFormulaInfo ? 'Hide' : 'Show'} Calculation Formulas & How We Calculate</span>
            <span className="text-xl">{showFormulaInfo ? '▲' : '▼'}</span>
          </button>
          
          {showFormulaInfo && (
            <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📐 Mathematical Formulas Used in Our Calculations
              </h3>
              
              <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">1️⃣ Monthly EMI Calculation</h4>
                  <p className="font-mono bg-white dark:bg-black/20 p-2 rounded mb-2 border border-gray-200 dark:border-gray-700">
                    EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
                  </p>
                  <p><strong>P</strong> = Principal, <strong>r</strong> = Monthly Interest Rate, <strong>n</strong> = Tenure in Months</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">2️⃣ Amortization (Monthly Breakdown)</h4>
                  <p>For each month:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Interest = Outstanding Balance × Monthly Rate</li>
                    <li>Principal Paid = EMI - Interest</li>
                    <li>New Balance = Outstanding Balance - Principal Paid</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Forms & Modals */}
        {(showAddForm || editingLoan) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingLoan ? '✏️ Edit Loan' : '➕ Add New Loan'}
                </h2>
                <button onClick={() => { setShowAddForm(false); setEditingLoan(null); }} className="text-gray-500 hover:text-gray-700">
                  <Trash2 size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={editingLoan ? handleSaveEdit : handleAddLoan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Loan Name</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.name : newLoan.name} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, name: e.target.value }) : setNewLoan({ ...newLoan, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.type : newLoan.type} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, type: e.target.value as any }) : setNewLoan({ ...newLoan, type: e.target.value })}>
                        <option value="personal">Personal Loan</option>
                        <option value="home">Home Loan</option>
                        <option value="car">Car Loan</option>
                        <option value="education">Education Loan</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Principal (₹)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.principal : newLoan.principal} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, principal: parseFloat(e.target.value) }) : setNewLoan({ ...newLoan, principal: parseFloat(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                      <input type="number" step="0.1" className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.interest_rate : newLoan.interest_rate} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, interest_rate: parseFloat(e.target.value) }) : setNewLoan({ ...newLoan, interest_rate: parseFloat(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tenure (Months)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.tenure : newLoan.tenure} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, tenure: parseInt(e.target.value) }) : setNewLoan({ ...newLoan, tenure: parseInt(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Monthly EMI (₹)</label>
                      {editingLoan ? (
                        <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-500 text-sm">Auto-calculated</div>
                      ) : (
                        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={newLoan.monthly_payment} onChange={(e) => setNewLoan({ ...newLoan, monthly_payment: parseFloat(e.target.value) })} required />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input type="date" className="w-full px-3 py-2 border rounded-lg" value={editingLoan ? editingLoan.start_date : newLoan.start_date} onChange={(e) => editingLoan ? setEditingLoan({ ...editingLoan, start_date: e.target.value }) : setNewLoan({ ...newLoan, start_date: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <button type="button" onClick={() => { setShowAddForm(false); setEditingLoan(null); }} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Loan</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoansPage;
