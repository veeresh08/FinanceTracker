import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Loan } from '../types';
import { useUser } from '../UserContext';
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
} from 'recharts';

const LoansPage: React.FC = () => {
  const { currentUser } = useUser();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false); // For formula tooltip
  const [showExtraPaymentCalc, setShowExtraPaymentCalc] = useState<number | null>(null); // For extra payment calculator
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

  // Export loans to JSON or CSV
  const handleExport = async (format: 'json' | 'csv') => {
    if (!currentUser) return;
    try {
      const response = await api.exportLoans(currentUser.id, format);
      const { data, count } = response.data;
      
      if (count === 0) {
        alert('No loans to export!');
        return;
      }

      // Create downloadable file
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
      
      alert(`✅ Successfully exported ${count} loan(s) as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error exporting loans:', error);
      alert('❌ Failed to export loans');
    }
  };

  // Import loans from file
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
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing loans:', error);
      alert('❌ Failed to import loans. Please check the file format.');
      event.target.value = '';
    }
  };

  // Calculate accurate amortization schedule for a loan
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

  // Get current installment info for a loan
  const getCurrentInstallmentInfo = (loan: Loan) => {
    const startDate = new Date(loan.start_date);
    const today = new Date();
    
    // Calculate months elapsed from start date
    const monthsElapsed = Math.max(0, 
      (today.getFullYear() - startDate.getFullYear()) * 12 + 
      (today.getMonth() - startDate.getMonth())
    );
    
    const currentInstallmentNo = Math.min(monthsElapsed + 1, loan.tenure);
    const schedule = calculateAccurateAmortization(loan);
    
    // Get current month's data
    const currentInstallment = schedule[currentInstallmentNo - 1] || schedule[0];
    const remainingInstallments = Math.max(0, loan.tenure - monthsElapsed);
    
    // Calculate current month date
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

  // Calculate impact of extra payment
  const calculateExtraPaymentImpact = (loan: Loan, extraAmount: number) => {
    const installmentInfo = getCurrentInstallmentInfo(loan);
    const { currentOutstanding, remainingInstallments } = installmentInfo;
    
    if (extraAmount <= 0) return null;
    
    // New outstanding after extra payment
    const newOutstanding = Math.max(0, currentOutstanding - extraAmount);
    
    // Calculate new tenure with reduced principal
    const monthlyRate = loan.interest_rate / 100 / 12;
    let newTenure = 0;
    
    if (newOutstanding > 0 && loan.monthly_payment > newOutstanding * monthlyRate) {
      // Calculate months needed to pay off new outstanding
      newTenure = Math.ceil(
        Math.log(loan.monthly_payment / (loan.monthly_payment - newOutstanding * monthlyRate)) / 
        Math.log(1 + monthlyRate)
      );
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
      // Prepare clean update data
      const updateData = {
        name: editingLoan.name,
        type: editingLoan.type,
        principal: editingLoan.principal,
        interest_rate: editingLoan.interest_rate,
        tenure: editingLoan.tenure,
        start_date: editingLoan.start_date, // ✅ FIX: Include start_date
        status: editingLoan.status || 'active'
      };
      
      console.log('📤 Sending loan update:', updateData);
      
      await api.updateLoan(editingLoan.id, updateData);
      await fetchLoans();
      setEditingLoan(null);
      alert('✅ Loan updated successfully!');
    } catch (error) {
      console.error('❌ Error updating loan:', error);
      alert('❌ Failed to update loan');
    }
  };

  const handleCancelEdit = () => {
    setEditingLoan(null);
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
      alert('Loan added successfully!');
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteLoan(id);
      await fetchLoans();
      alert('Loan deleted successfully!');
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Loans 💰</h1>
            <p className="text-gray-600">Manage and track all your loans in one place</p>
          </div>
          <div className="flex gap-3">
            {/* Import/Export Buttons */}
            <div className="relative inline-block">
              <button
                onClick={() => document.getElementById('loan-import-file')?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                title="Import loans from JSON or CSV file"
              >
                📥 Import
              </button>
              <input
                id="loan-import-file"
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
              />
            </div>
            
            <div className="relative inline-block group">
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                title="Export loans to file"
              >
                📤 Export
              </button>
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                >
                  📄 Export as JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                >
                  📊 Export as CSV
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingLoan(null);
              }}
              className="btn-primary"
            >
              ➕ Add New Loan
            </button>
          </div>
        </div>

        {/* Add Loan Form */}
        {showAddForm && (
          <div className="card mb-8 bg-green-50 border-2 border-green-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">➕ Add New Loan</h2>
            <form onSubmit={handleAddLoan}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Loan Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Home Loan, Car Loan"
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Loan Type *</label>
                  <select
                    className="input-field"
                    value={newLoan.type}
                    onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                  >
                    <option value="personal">Personal Loan</option>
                    <option value="home">Home Loan</option>
                    <option value="car">Car Loan</option>
                    <option value="education">Education Loan</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g., 500000"
                    value={newLoan.principal || ''}
                    onChange={(e) => setNewLoan({ ...newLoan, principal: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Interest Rate (% per annum) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="e.g., 8.5"
                    value={newLoan.interest_rate || ''}
                    onChange={(e) => setNewLoan({ ...newLoan, interest_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Tenure (months) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g., 60"
                    value={newLoan.tenure || ''}
                    onChange={(e) => setNewLoan({ ...newLoan, tenure: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Monthly Payment (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g., 10000"
                    value={newLoan.monthly_payment || ''}
                    onChange={(e) => setNewLoan({ ...newLoan, monthly_payment: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newLoan.start_date}
                    onChange={(e) => setNewLoan({ ...newLoan, start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="submit" className="btn-primary">
                  💾 Add Loan
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)} 
                  className="btn-secondary"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {editingLoan && (
          <div className="card mb-8 bg-blue-50 border-2 border-blue-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Loan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Loan Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingLoan.name}
                  onChange={(e) => setEditingLoan({ ...editingLoan, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Loan Type *</label>
                <select
                  className="input-field"
                  value={editingLoan.type}
                  onChange={(e) => setEditingLoan({ ...editingLoan, type: e.target.value as any })}
                >
                  <option value="personal">Personal Loan</option>
                  <option value="home">Home Loan</option>
                  <option value="car">Car Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Principal Amount (₹) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={editingLoan.principal}
                  onChange={(e) => setEditingLoan({ ...editingLoan, principal: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">Interest Rate (% per annum) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={editingLoan.interest_rate}
                  onChange={(e) => setEditingLoan({ ...editingLoan, interest_rate: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">Tenure (months) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={editingLoan.tenure}
                  onChange={(e) => {
                    const newTenure = parseInt(e.target.value) || 0;
                    console.log('🔄 Tenure changed to:', newTenure);
                    setEditingLoan({ ...editingLoan, tenure: newTenure });
                  }}
                />
              </div>

              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingLoan.start_date}
                  onChange={(e) => setEditingLoan({ ...editingLoan, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Monthly payment will be automatically recalculated based on principal, interest rate, and tenure.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={handleSaveEdit} className="btn-primary">
                💾 Save Changes
              </button>
              <button onClick={handleCancelEdit} className="btn-secondary">
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loans Table */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">📋 All Loans</h2>
          
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-600 mb-2">No loans found</p>
              <p className="text-gray-500">Add your first loan to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Loan Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Principal</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monthly EMI</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payoff Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Progress</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-800">{loan.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {loan.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-blue-600">
                        ₹{loan.principal.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-purple-600">
                        ₹{loan.monthly_payment.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-left text-sm text-gray-700">
                        {new Date(loan.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-left text-sm font-medium text-green-600">
                        {(() => {
                          const payoff = new Date(loan.start_date);
                          payoff.setMonth(payoff.getMonth() + loan.tenure);
                          return payoff.toLocaleDateString();
                        })()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {(() => {
                          const monthsElapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                          const progress = Math.min((monthsElapsed / loan.tenure) * 100, 100);
                          return (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-700">{progress.toFixed(0)}%</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleEdit(loan)}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm mr-3"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id, loan.name)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm opacity-90 mb-1">Total Active Loans</p>
            <p className="text-4xl font-bold">{loans.filter(l => l.status === 'active').length}</p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-sm opacity-90 mb-1">Total Principal</p>
            <p className="text-4xl font-bold">
              ₹{loans.reduce((sum, loan) => sum + loan.principal, 0).toLocaleString()}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-90 mb-1">Total Monthly Payment</p>
            <p className="text-4xl font-bold">
              ₹{loans.filter(l => l.status === 'active').reduce((sum, loan) => sum + loan.monthly_payment, 0).toLocaleString()}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-sm opacity-90 mb-1">Total Interest</p>
            <p className="text-4xl font-bold">
              ₹{loans.reduce((sum, loan) => sum + (loan.total_interest || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Overall Loan Progress Dashboard */}
        {loans.length > 0 && (
          <div className="card mt-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Overall Loan Repayment Progress
            </h2>
            
            <div className="space-y-4">
              {loans.filter(l => l.status === 'active').map(loan => {
                // Get accurate installment info
                const installmentInfo = getCurrentInstallmentInfo(loan);
                const { 
                  currentInstallmentNo, 
                  totalInstallments, 
                  remainingInstallments,
                  currentOutstanding,
                  currentMonthPrincipal,
                  currentMonthInterest,
                  currentInstallmentDate
                } = installmentInfo;
                
                const progress = Math.min((currentInstallmentNo / totalInstallments) * 100, 100);
                const amountPaid = loan.monthly_payment * (currentInstallmentNo - 1);
                const amountRemaining = loan.monthly_payment * remainingInstallments;
                
                // Calculate total amount to be paid to bank
                const totalToBePaid = loan.principal + (loan.total_interest || 0);
                
                // Use accurate outstanding from amortization schedule
                const outstandingPrincipal = currentOutstanding;
                
                // Preclosure calculation (with 4% penalty)
                const preclosureCharge = outstandingPrincipal * 0.04;
                const preclosureAmount = outstandingPrincipal + preclosureCharge;
                
                // Calculate savings if closed today vs continuing EMIs
                const savingsOnClosure = amountRemaining - preclosureAmount;

                return (
                  <div key={loan.id} className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                    {/* Header with Installment Info */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{loan.name}</h3>
                        <p className="text-xs text-gray-600">Started: {new Date(loan.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-lg mb-1">
                          <p className="text-xs font-medium">Current Installment</p>
                          <p className="text-lg font-bold">#{currentInstallmentNo} / {totalInstallments}</p>
                        </div>
                        <p className="text-xs text-gray-600">{currentInstallmentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Current Month Details */}
                    <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-xs text-gray-700 font-medium">This Month EMI</p>
                        <p className="text-sm font-bold text-blue-600">₹{loan.monthly_payment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-700 font-medium">Principal Part</p>
                        <p className="text-sm font-bold text-green-600">₹{Math.round(currentMonthPrincipal).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-700 font-medium">Interest Part</p>
                        <p className="text-sm font-bold text-red-600">₹{Math.round(currentMonthInterest).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Outstanding Balance Highlight */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-700 font-medium">Outstanding Principal (After This EMI)</p>
                          <p className="text-2xl font-bold text-orange-700">₹{Math.round(currentOutstanding).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Installments Left</p>
                          <p className="text-xl font-bold text-purple-600">{remainingInstallments}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-600 font-medium">Paid: ₹{amountPaid.toLocaleString()} ({currentInstallmentNo - 1} EMIs)</span>
                        <span className="text-gray-600">Remaining: ₹{amountRemaining.toLocaleString()} ({remainingInstallments} EMIs)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                          className="absolute h-4 bg-gradient-to-r from-blue-500 via-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{width: `${progress}%`}}
                        >
                          <span className="absolute right-2 top-0.5 text-xs font-bold text-white drop-shadow">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs border-t pt-3">
                      <div>
                        <p className="text-gray-600">Principal</p>
                        <p className="font-bold text-blue-600">₹{loan.principal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Interest</p>
                        <p className="font-bold text-red-600">₹{(loan.total_interest || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total to Bank</p>
                        <p className="font-bold text-purple-600">₹{totalToBePaid.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Outstanding & Preclosure Analysis */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <span className="mr-2">💡</span>
                        Preclosure Analysis (as of today)
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">Outstanding Principal</p>
                          <p className="font-bold text-orange-600 text-sm">₹{outstandingPrincipal.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">Preclosure Charge (4%)</p>
                          <p className="font-bold text-red-600 text-sm">₹{preclosureCharge.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">Total Preclosure Amount</p>
                          <p className="font-bold text-purple-600 text-sm">₹{preclosureAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-gray-600">
                            {savingsOnClosure >= 0 ? 'You Save 💰' : 'Extra Cost ⚠️'}
                          </p>
                          <p className={`font-bold text-sm ${savingsOnClosure >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {savingsOnClosure >= 0 ? '+' : ''}₹{savingsOnClosure.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {savingsOnClosure >= 0 ? (
                        <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                          ✅ <strong>Good for preclosure!</strong> You'll save ₹{savingsOnClosure.toLocaleString()} by closing today vs continuing EMIs.
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                          ⚠️ <strong>Continue EMIs:</strong> Preclosure would cost ₹{Math.abs(savingsOnClosure).toLocaleString()} more than remaining EMIs.
                        </div>
                      )}
                    </div>

                    {/* View Detailed Schedule Button */}
                    <div className="mt-4 border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setExpandedSchedule(expandedSchedule === loan.id ? null : loan.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                        >
                          {expandedSchedule === loan.id ? '▲' : '▼'} Full Schedule
                        </button>
                        <button
                          onClick={() => setShowExtraPaymentCalc(showExtraPaymentCalc === loan.id ? null : loan.id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                        >
                          💰 Extra Payment
                        </button>
                      </div>
                    </div>

                    {/* Extra Payment Calculator */}
                    {showExtraPaymentCalc === loan.id && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-300">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          💰 Extra Payment Impact Calculator
                        </h4>
                        <p className="text-xs text-gray-600 mb-3">
                          See how an extra one-time payment reduces your loan tenure and saves you money!
                        </p>
                        
                        {[50000, 100000, 200000, currentOutstanding].filter((amt, i, arr) => amt <= currentOutstanding && arr.indexOf(amt) === i).map(amount => {
                          const impact = calculateExtraPaymentImpact(loan, amount);
                          if (!impact) return null;
                          
                          return (
                            <div key={amount} className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-green-700">Pay Extra: ₹{amount.toLocaleString()}</span>
                                {amount === currentOutstanding && (
                                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">FULL CLOSURE</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-blue-50 p-2 rounded">
                                  <p className="text-gray-600">New Outstanding</p>
                                  <p className="font-bold text-blue-700">₹{impact.newOutstanding.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-2 rounded">
                                  <p className="text-gray-600">Months Saved</p>
                                  <p className="font-bold text-purple-700">{impact.tenureReduction} months</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded col-span-2">
                                  <p className="text-gray-600">Total EMI Savings</p>
                                  <p className="font-bold text-green-700 text-lg">₹{impact.emiSavings.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Net Benefit: ₹{(impact.emiSavings - amount).toLocaleString()}
                                    {impact.emiSavings - amount > 0 ? ' 🎉' : ' (Not worth it)'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        <p className="text-xs text-gray-600 mt-2 italic">
                          💡 Tip: Extra payments reduce principal immediately, saving you interest!
                        </p>
                      </div>
                    )}

                    {/* Expandable Amortization Schedule Table */}
                    {expandedSchedule === loan.id && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          📋 Complete Amortization Schedule (Like Bank Statement)
                        </h4>
                        
                        <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                          <table className="w-full text-xs">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left">Instl No.</th>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-right">EMI Amount</th>
                                <th className="px-3 py-2 text-right">Principal</th>
                                <th className="px-3 py-2 text-right">Interest</th>
                                <th className="px-3 py-2 text-right">Closing Principal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {installmentInfo.schedule.map((installment, index) => {
                                const installmentDate = new Date(loan.start_date);
                                installmentDate.setMonth(installmentDate.getMonth() + index);
                                const isCurrent = index + 1 === currentInstallmentNo;
                                const isPast = index + 1 < currentInstallmentNo;
                                
                                return (
                                  <tr 
                                    key={index} 
                                    className={`
                                      ${isCurrent ? 'bg-yellow-100 border-l-4 border-l-yellow-500 font-bold' : ''}
                                      ${isPast ? 'bg-green-50 text-gray-600' : ''}
                                      ${!isPast && !isCurrent ? 'bg-white' : ''}
                                      hover:bg-blue-50 transition-colors
                                    `}
                                  >
                                    <td className="px-3 py-2 text-left">
                                      {installment.installmentNo}
                                      {isCurrent && <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">CURRENT</span>}
                                    </td>
                                    <td className="px-3 py-2 text-left whitespace-nowrap">
                                      {installmentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">
                                      ₹{Math.round(installment.payment).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right text-green-600 font-medium">
                                      ₹{Math.round(installment.principal).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right text-red-600 font-medium">
                                      ₹{Math.round(installment.interest).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-orange-600">
                                      ₹{Math.round(installment.closingPrincipal).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                              <tr>
                                <td colSpan={2} className="px-3 py-2 text-left">TOTAL</td>
                                <td className="px-3 py-2 text-right text-purple-600">
                                  ₹{Math.round(loan.monthly_payment * loan.tenure).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right text-green-600">
                                  ₹{loan.principal.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right text-red-600">
                                  ₹{(loan.total_interest || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-500">
                                  ₹0
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                          <p className="text-gray-700">
                            <strong>📌 How to Read:</strong> 
                            <span className="ml-2">🟨 Yellow = Current Month</span>
                            <span className="ml-2">🟩 Green = Paid</span>
                            <span className="ml-2">⬜ White = Future</span>
                          </p>
                          <p className="text-gray-700 mt-1">
                            <strong>Note:</strong> "Closing Principal" shows the outstanding loan balance after each EMI payment (like your bank statement).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Overall Summary */}
              <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-blue-300">
                <h3 className="font-bold text-gray-900 mb-3">🎯 Combined Loan Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Paid So Far</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{loans.filter(l => l.status === 'active').reduce((sum, loan) => {
                        const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                        return sum + (loan.monthly_payment * elapsed);
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Still to Pay</p>
                    <p className="text-lg font-bold text-orange-600">
                      ₹{loans.filter(l => l.status === 'active').reduce((sum, loan) => {
                        const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                        const remaining = Math.max(0, loan.tenure - elapsed);
                        return sum + (loan.monthly_payment * remaining);
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Outstanding</p>
                    <p className="text-lg font-bold text-purple-600">
                      ₹{loans.filter(l => l.status === 'active').reduce((sum, loan) => {
                        const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                        const principalPerMonth = loan.principal / loan.tenure;
                        const principalPaid = principalPerMonth * elapsed;
                        return sum + Math.max(0, loan.principal - principalPaid);
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Debt-Free In</p>
                    <p className="text-lg font-bold text-purple-600">
                      {(() => {
                        const maxRemaining = Math.max(...loans.filter(l => l.status === 'active').map(loan => {
                          const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                          return Math.max(0, loan.tenure - elapsed);
                        }));
                        return maxRemaining > 12 ? `${Math.floor(maxRemaining/12)}y ${maxRemaining%12}m` : `${maxRemaining}m`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Loan Closure Recommendations */}
        {loans.filter(l => l.status === 'active').length > 0 && (
          <div className="card mt-8 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-3">🎯</span>
              Smart Loan Closure Recommendations
            </h2>
            <p className="text-sm text-gray-700 mb-6">
              Based on interest rates, outstanding amounts, and potential savings, here's the optimal order to close your loans:
            </p>

            {(() => {
              // Calculate loan closure analysis with accurate amortization
              const loanAnalysis = loans.filter(l => l.status === 'active').map(loan => {
                const installmentInfo = getCurrentInstallmentInfo(loan);
                const { currentInstallmentNo, remainingInstallments, currentOutstanding } = installmentInfo;
                
                const amountRemaining = loan.monthly_payment * remainingInstallments;
                const outstandingPrincipal = currentOutstanding;
                
                const preclosureCharge = outstandingPrincipal * 0.04;
                const preclosureAmount = outstandingPrincipal + preclosureCharge;
                const savingsOnClosure = amountRemaining - preclosureAmount;
                
                // Priority score: higher interest rate + higher savings = higher priority
                const priorityScore = (loan.interest_rate * 10) + (savingsOnClosure > 0 ? savingsOnClosure / 10000 : 0);
                
                return {
                  ...loan,
                  outstandingPrincipal,
                  preclosureAmount,
                  savingsOnClosure,
                  priorityScore,
                  currentInstallmentNo,
                  remaining: remainingInstallments
                };
              }).sort((a, b) => b.priorityScore - a.priorityScore);

              return (
                <div className="space-y-4">
                  {loanAnalysis.map((loan, index) => (
                    <div key={loan.id} className="bg-white rounded-lg p-4 shadow border-l-4" 
                         style={{borderLeftColor: index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#6b7280'}}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${index === 0 ? 'text-green-600' : index === 1 ? 'text-orange-600' : 'text-gray-600'}`}>
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{loan.name}</h3>
                            <p className="text-xs text-gray-600">Interest Rate: {loan.interest_rate}% p.a.</p>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                            🏆 CLOSE FIRST
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-gray-600">Outstanding</p>
                          <p className="font-bold text-blue-700">₹{loan.outstandingPrincipal.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-gray-600">Preclosure Amount</p>
                          <p className="font-bold text-purple-700">₹{loan.preclosureAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-gray-600">Potential Savings</p>
                          <p className={`font-bold ${loan.savingsOnClosure >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {loan.savingsOnClosure >= 0 ? '+' : ''}₹{loan.savingsOnClosure.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-gray-600">Months Left</p>
                          <p className="font-bold text-orange-700">{loan.remaining} months</p>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className={`text-xs p-2 rounded ${
                        loan.savingsOnClosure >= 0 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}>
                        {loan.savingsOnClosure >= 0 ? (
                          <>
                            <strong>💡 Smart Move:</strong> {index === 0 && 'PRIORITIZE THIS! '} 
                            <p className="mt-1">
                              <strong>If you continue:</strong> Pay {loan.remaining} more EMIs = ₹{(loan.remaining * loan.monthly_payment).toLocaleString()}
                            </p>
                            <p className="mt-1">
                              <strong>If you close today:</strong> Pay ₹{loan.preclosureAmount.toLocaleString()} (Outstanding + 4% penalty)
                            </p>
                            <p className="mt-1 font-bold text-green-700">
                              💰 YOU SAVE: ₹{loan.savingsOnClosure.toLocaleString()} in EMIs!
                            </p>
                            {index === 0 && (
                              <p className="mt-1 text-xs bg-green-200 p-1 rounded">
                                ⭐ Highest priority: Best interest rate and maximum savings!
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <strong>💡 Recommendation:</strong> Continue with regular EMIs.
                            <p className="mt-1">
                              <strong>If you continue:</strong> Pay {loan.remaining} EMIs = ₹{(loan.remaining * loan.monthly_payment).toLocaleString()}
                            </p>
                            <p className="mt-1">
                              <strong>If you close today:</strong> Would cost ₹{loan.preclosureAmount.toLocaleString()}
                            </p>
                            <p className="mt-1 font-bold text-orange-700">
                              ⚠️ Extra Cost: ₹{Math.abs(loan.savingsOnClosure).toLocaleString()} more than EMIs
                            </p>
                            <p className="mt-1 text-xs">Better to focus on higher-interest loans first.</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Overall Strategy */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 shadow-lg">
                    <h4 className="font-bold text-lg mb-3">📋 Your Debt-Free Strategy</h4>
                    <div className="space-y-2 text-sm">
                      {loanAnalysis[0] && loanAnalysis[0].savingsOnClosure >= 0 && (
                        <>
                          <p>
                            <strong>Step 1: Close {loanAnalysis[0].name} First</strong>
                          </p>
                          <div className="bg-white/20 p-2 rounded ml-4">
                            <p>• Current: Pay {loanAnalysis[0].remaining} EMIs = ₹{(loanAnalysis[0].remaining * loanAnalysis[0].monthly_payment).toLocaleString()}</p>
                            <p>• If closed today: Pay ₹{loanAnalysis[0].preclosureAmount.toLocaleString()}</p>
                            <p className="text-yellow-300 font-bold">• You save: ₹{loanAnalysis[0].savingsOnClosure.toLocaleString()}!</p>
                          </div>
                        </>
                      )}
                      
                      {loanAnalysis.length > 1 && loanAnalysis[1].savingsOnClosure >= 0 && (
                        <>
                          <p>
                            <strong>Step 2: Then Close {loanAnalysis[1].name}</strong>
                          </p>
                          <div className="bg-white/20 p-2 rounded ml-4">
                            <p>• Additional savings: ₹{loanAnalysis[1].savingsOnClosure.toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      
                      <div className="border-t border-white/30 pt-2 mt-3">
                        <p className="font-bold text-lg">
                          💰 Total Potential Savings:{' '}
                          <span className="text-yellow-300">
                            ₹{loanAnalysis.filter(l => l.savingsOnClosure >= 0)
                              .reduce((sum, l) => sum + l.savingsOnClosure, 0).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-xs mt-1">
                          By closing all profitable loans in order, you'll save this much in EMI payments!
                        </p>
                      </div>
                      
                      <p className="text-xs opacity-90 mt-3 border-t border-white/20 pt-2">
                        💡 <strong>Pro Strategy:</strong> Pay minimum EMI on all loans. Use any extra money to close the #1 priority loan. Once closed, move to #2. This minimizes your total interest payment.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Visualizations */}
        {loans.length > 0 && (
          <>
            {/* Loan Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Pie Chart - Loan Distribution by Principal */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Loan Distribution (by Principal)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loans.map(loan => ({
                        name: loan.name,
                        value: loan.principal,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loans.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Monthly Payment Comparison */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Monthly Payment by Loan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={loans.map(loan => ({
                      name: loan.name.length > 15 ? loan.name.substring(0, 15) + '...' : loan.name,
                      payment: loan.monthly_payment,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="payment" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Interest vs Principal Comparison */}
            <div className="card mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Interest vs Principal Breakdown</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={loans.map(loan => ({
                    name: loan.name.length > 20 ? loan.name.substring(0, 20) + '...' : loan.name,
                    Principal: loan.principal,
                    Interest: loan.total_interest || 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Principal" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Interest" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </>
        )}
        
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
            <div className="mt-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-300 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📐 Mathematical Formulas Used in Our Calculations
              </h3>
              
              <div className="space-y-6">
                {/* EMI Calculation */}
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2">1️⃣ Monthly EMI Calculation</h4>
                  <div className="bg-blue-50 p-3 rounded font-mono text-sm mb-2">
                    EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><strong>Where:</strong></p>
                    <p>• P = Principal loan amount</p>
                    <p>• r = Monthly interest rate = (Annual Rate / 12 / 100)</p>
                    <p>• n = Total number of months (tenure)</p>
                    <p className="mt-2 text-blue-700">
                      <strong>Example:</strong> For ₹15L @ 10.8% for 72 months → EMI = ₹28,398
                    </p>
                  </div>
                </div>

                {/* Monthly Interest & Principal */}
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-2">2️⃣ Each Month's Interest & Principal Breakdown</h4>
                  <div className="bg-green-50 p-3 rounded font-mono text-sm mb-2">
                    <p>Interest Payment = Outstanding Balance × (Annual Rate / 12 / 100)</p>
                    <p className="mt-1">Principal Payment = EMI - Interest Payment</p>
                    <p className="mt-1">New Outstanding = Old Outstanding - Principal Payment</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="text-green-700 mt-2">
                      <strong>Why Interest Decreases:</strong> As you pay EMI, outstanding reduces → Less interest next month → More principal next month!
                    </p>
                  </div>
                </div>

                {/* Current Installment */}
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2">3️⃣ Current Installment Number</h4>
                  <div className="bg-purple-50 p-3 rounded font-mono text-sm mb-2">
                    Months Elapsed = (Today's Year - Start Year) × 12 + (Today's Month - Start Month)
                    <p className="mt-1">Current Installment = Months Elapsed + 1</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="text-purple-700 mt-2">
                      <strong>Example:</strong> Start: Feb 2024, Today: Nov 2024 → 9 months elapsed → Installment #10
                    </p>
                  </div>
                </div>

                {/* Outstanding Principal */}
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <h4 className="font-bold text-orange-800 mb-2">4️⃣ Outstanding Principal (Bank Method)</h4>
                  <div className="bg-orange-50 p-3 rounded font-mono text-sm mb-2">
                    <p>We calculate month-by-month using amortization:</p>
                    <p className="mt-1">For each month 1 to N:</p>
                    <p className="ml-4">• Calculate interest on current balance</p>
                    <p className="ml-4">• Principal = EMI - Interest</p>
                    <p className="ml-4">• Reduce balance by principal</p>
                    <p className="mt-1">Outstanding = Balance after current month's EMI</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="text-orange-700 mt-2">
                      <strong>Note:</strong> This matches exactly what your bank shows as "Closing Principal" in their amortization schedule!
                    </p>
                  </div>
                </div>

                {/* Preclosure Calculation */}
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-800 mb-2">5️⃣ Preclosure Amount & Savings</h4>
                  <div className="bg-red-50 p-3 rounded font-mono text-sm mb-2">
                    <p>Preclosure Charge = Outstanding Principal × 4%</p>
                    <p className="mt-1">Total Preclosure = Outstanding + Preclosure Charge</p>
                    <p className="mt-1">Remaining EMIs Cost = Remaining Months × Monthly EMI</p>
                    <p className="mt-1 text-green-700 font-bold">Savings = Remaining EMIs Cost - Total Preclosure</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="text-red-700 mt-2">
                      <strong>If Savings &gt; 0:</strong> You save money by closing early! ✅<br/>
                      <strong>If Savings &lt; 0:</strong> Better to continue EMIs ⚠️
                    </p>
                  </div>
                </div>

                {/* Extra Payment Impact */}
                <div className="bg-white p-4 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-teal-800 mb-2">6️⃣ Extra Payment Impact</h4>
                  <div className="bg-teal-50 p-3 rounded font-mono text-sm mb-2">
                    <p>New Outstanding = Current Outstanding - Extra Amount</p>
                    <p className="mt-1">New Tenure = log(EMI / (EMI - New Outstanding × r)) / log(1 + r)</p>
                    <p className="mt-1">Months Saved = Current Remaining - New Tenure</p>
                    <p className="mt-1 text-green-700 font-bold">Total Savings = Months Saved × EMI</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="text-teal-700 mt-2">
                      <strong>Impact:</strong> Extra payment reduces principal → Less interest → Shorter tenure → Saves EMIs!
                    </p>
                  </div>
                </div>

                {/* Priority Score */}
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-2">7️⃣ Loan Priority Score (For Recommendations)</h4>
                  <div className="bg-indigo-50 p-3 rounded font-mono text-sm mb-2">
                    Priority Score = (Interest Rate × 10) + (Savings / 10000)
                  </div>
                  <div className="text-xs text-gray-700">
                    <p><strong>Logic:</strong></p>
                    <p>• Higher interest rate = Costs more = Higher priority</p>
                    <p>• Higher savings = Save more = Higher priority</p>
                    <p className="text-indigo-700 mt-2">
                      <strong>Result:</strong> Loans are ranked from highest to lowest score → Close highest first!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
                <h4 className="font-bold mb-2">🎓 Why These Formulas?</h4>
                <p className="text-sm">
                  We use the <strong>exact same mathematical formulas that banks use</strong> for loan calculations. 
                  This ensures our numbers match your bank statement perfectly. The amortization method accounts for 
                  the fact that interest is calculated on the reducing balance each month, which is why your 
                  principal portion increases and interest portion decreases over time!
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm text-gray-800">
                  <strong>💡 Verification Tip:</strong> Compare the "Closing Principal" in our detailed schedule 
                  with your bank's amortization statement - they should match exactly for the same month!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoansPage;

