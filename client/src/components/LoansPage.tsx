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
  
  // What-If Calculator state
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [selectedLoanForWhatIf, setSelectedLoanForWhatIf] = useState<Loan | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);
  const [prepaymentMonths, setPrepaymentMonths] = useState(0);
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

  // Calculate What-If scenario for prepayment
  const calculatePrepaymentScenario = (loan: Loan, prepayment: number, earlyPayoffMonths: number) => {
    if (!loan) return null;

    // Original scenario
    const originalTotal = loan.monthly_payment * loan.tenure;
    const originalInterest = loan.total_interest || 0;
    
    // With prepayment
    const remainingPrincipal = loan.principal - prepayment;
    if (remainingPrincipal <= 0) {
      return {
        newTenure: 0,
        newMonthlyPayment: 0,
        interestSaved: originalInterest,
        timeSaved: loan.tenure,
        totalSaved: originalTotal - prepayment
      };
    }

    // Calculate new tenure if paying off early
    const newTenure = loan.tenure - earlyPayoffMonths;
    
    // Recalculate monthly payment for remaining principal
    const monthlyRate = loan.interest_rate / 100 / 12;
    const newMonthlyPayment = remainingPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, newTenure)) / (Math.pow(1 + monthlyRate, newTenure) - 1);
    
    const newTotalPayment = prepayment + (newMonthlyPayment * newTenure);
    const newInterest = newTotalPayment - loan.principal;
    const interestSaved = originalInterest - newInterest;
    const timeSaved = earlyPayoffMonths;

    return {
      newTenure,
      newMonthlyPayment,
      interestSaved,
      timeSaved,
      totalSaved: originalTotal - newTotalPayment
    };
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
                const monthsElapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                const progress = Math.min((monthsElapsed / loan.tenure) * 100, 100);
                const remaining = Math.max(0, loan.tenure - monthsElapsed);
                const amountPaid = loan.monthly_payment * monthsElapsed;
                const amountRemaining = loan.monthly_payment * remaining;

                return (
                  <div key={loan.id} className="bg-white rounded-lg p-4 shadow">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{loan.name}</h3>
                        <p className="text-xs text-gray-600">Started: {new Date(loan.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">₹{loan.monthly_payment.toLocaleString()}/mo</p>
                        <p className="text-xs text-gray-600">{remaining} months left</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-600 font-medium">Paid: ₹{amountPaid.toLocaleString()} ({monthsElapsed} months)</span>
                        <span className="text-gray-600">Remaining: ₹{amountRemaining.toLocaleString()} ({remaining} months)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                          className="absolute h-4 bg-gradient-to-r from-blue-500 via-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{width: `${progress}%`}}
                        >
                          <span className="absolute right-2 top-0.5 text-xs font-bold text-white drop-shadow">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs border-t pt-2">
                      <div>
                        <p className="text-gray-600">Principal</p>
                        <p className="font-bold text-blue-600">₹{loan.principal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Interest</p>
                        <p className="font-bold text-red-600">₹{(loan.total_interest || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-bold text-purple-600">₹{(loan.principal + (loan.total_interest || 0)).toLocaleString()}</p>
                      </div>
                    </div>
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
                    <p className="text-xs text-gray-600">Avg Progress</p>
                    <p className="text-lg font-bold text-green-600">
                      {(() => {
                        const avgProgress = loans.filter(l => l.status === 'active').reduce((sum, loan) => {
                          const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                          return sum + Math.min((elapsed / loan.tenure) * 100, 100);
                        }, 0) / Math.max(loans.filter(l => l.status === 'active').length, 1);
                        return avgProgress.toFixed(1);
                      })()}%
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
      </div>
    </div>
  );
};

export default LoansPage;

