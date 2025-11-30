import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Investment } from '../types';
import { useUser } from '../UserContext';

const InvestmentsPage: React.FC = () => {
  const { currentUser } = useUser();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Projection calculator state
  const [principal, setPrincipal] = useState(50000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'sip' as Investment['type'],
    principal: 0,
    monthly_contribution: 0,
    expected_return_rate: 12,
    start_date: new Date().toISOString().split('T')[0],
    tenure_months: 60,
    current_value: 0,
    notes: '',
    // ESPP-specific fields
    purchase_price: 0,
    current_stock_price: 0,
    discount_percent: 15,
    shares_per_month: 0,
    vesting_months: 24,
    lookback_months: 6
  });

  useEffect(() => {
    if (currentUser) {
      fetchInvestments();
    }
  }, [currentUser]);

  const fetchInvestments = async () => {
    if (!currentUser) return;
    try {
      const response = await api.getInvestments(currentUser.id);
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export investments to JSON or CSV
  const handleExport = async (format: 'json' | 'csv') => {
    if (!currentUser) return;
    try {
      const response = await api.exportInvestments(currentUser.id, format);
      const { data, count } = response.data;
      
      if (count === 0) {
        alert('No investments to export!');
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
      link.download = `investments_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`✅ Successfully exported ${count} investment(s) as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error exporting investments:', error);
      alert('❌ Failed to export investments');
    }
  };

  // Import investments from file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const format = file.name.endsWith('.csv') ? 'csv' : 'json';
      const data = format === 'json' ? JSON.parse(text) : text;

      const response = await api.importInvestments(currentUser.id, data, format);
      const { imported, errors, message } = response.data;
      
      await fetchInvestments();
      alert(`${message}\n\n✅ Imported: ${imported}\n❌ Errors: ${errors}`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing investments:', error);
      alert('❌ Failed to import investments. Please check the file format.');
      event.target.value = '';
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingId(investment.id);
    setFormData({
      name: investment.name,
      type: investment.type,
      principal: investment.principal,
      monthly_contribution: investment.monthly_contribution,
      expected_return_rate: investment.expected_return_rate,
      start_date: investment.start_date,
      tenure_months: investment.tenure_months,
      current_value: investment.current_value || 0,
      notes: investment.notes || '',
      // ESPP fields
      purchase_price: investment.purchase_price || 0,
      current_stock_price: investment.current_stock_price || 0,
      discount_percent: investment.discount_percent || 15,
      shares_per_month: investment.shares_per_month || 0,
      vesting_months: investment.vesting_months || 24,
      lookback_months: investment.lookback_months || 6
    });
    setShowAddForm(true);
  };

  // Calculate ESPP gains
  const calculateESPPGains = (inv: Investment) => {
    if (inv.type !== 'espp' || !inv.current_stock_price || !inv.purchase_price) {
      return { totalGain: 0, gainPercent: 0, totalShares: 0, totalInvested: 0 };
    }

    const monthsElapsed = Math.floor((new Date().getTime() - new Date(inv.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const totalShares = (inv.shares_per_month || 0) * monthsElapsed;
    const totalInvested = (inv.purchase_price || 0) * totalShares;
    const currentValue = (inv.current_stock_price || 0) * totalShares;
    const totalGain = currentValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return { totalGain, gainPercent, totalShares, totalInvested, currentValue };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      if (editingId) {
        await api.updateInvestment(editingId, formData);
        alert('✅ Investment updated successfully!');
        setEditingId(null);
      } else {
        await api.createInvestment({ ...formData, user_id: currentUser.id });
        alert('✅ Investment added successfully!');
      }
      
      await fetchInvestments();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        name: '', type: 'sip', principal: 0, monthly_contribution: 0,
        expected_return_rate: 12, start_date: new Date().toISOString().split('T')[0],
        tenure_months: 60, current_value: 0, notes: '',
        // Reset ESPP fields too
        purchase_price: 0, current_stock_price: 0, discount_percent: 15,
        shares_per_month: 0, vesting_months: 24, lookback_months: 6
      });
    } catch (error) {
      console.error('Error saving investment:', error);
      alert('❌ Failed to save investment');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete investment "${name}"?`)) return;
    try {
      await api.deleteInvestment(id);
      await fetchInvestments();
      alert('✅ Investment deleted!');
    } catch (error) {
      alert('❌ Failed to delete investment');
    }
  };

  // Calculate future value
  const calculateFV = (p: number, m: number, r: number, t: number) => {
    const monthlyRate = r / 12 / 100;
    const months = t * 12;
    
    // Future value of initial principal
    const fvPrincipal = p * Math.pow(1 + monthlyRate, months);
    
    // Future value of monthly SIP
    const fvSIP = m * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    
    return {
      total: fvPrincipal + fvSIP,
      invested: p + (m * months),
      returns: (fvPrincipal + fvSIP) - (p + (m * months))
    };
  };

  const projection = calculateFV(principal, monthly, rate, years);
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.principal || 0) + (inv.monthly_contribution * inv.tenure_months), 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
  const monthlyInvestment = investments.filter(i => i.status === 'active' || i.status === null).reduce((sum, inv) => sum + inv.monthly_contribution, 0);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">💹 Investment Portfolio</h1>
            <p className="text-muted-foreground">Track your ESPP, SIP, Mutual Funds & more</p>
          </div>
          <div className="flex gap-3">
            {/* Import/Export Buttons */}
            <div className="relative inline-block">
              <button
                onClick={() => document.getElementById('investment-import-file')?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                title="Import investments from JSON or CSV file"
              >
                📥 Import
              </button>
              <input
                id="investment-import-file"
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
              />
            </div>
            
            <div className="relative inline-block group">
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                title="Export investments to file"
              >
                📤 Export
              </button>
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border hidden group-hover:block z-10">
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
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add Investment'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <p className="text-sm opacity-90">Total Invested</p>
            <p className="text-3xl font-bold">₹{totalInvested.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
            <p className="text-sm opacity-90">Current Value</p>
            <p className="text-3xl font-bold">₹{totalCurrent.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
            <p className="text-sm opacity-90">Monthly SIP</p>
            <p className="text-3xl font-bold">₹{monthlyInvestment.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
            <p className="text-sm opacity-90">Active Investments</p>
            <p className="text-3xl font-bold">{investments.filter(i => i.status === 'active').length}</p>
          </div>
        </div>

        {/* Projection Calculator */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🎯 Investment Projection Calculator</h2>
          <p className="text-sm text-muted-foreground mb-4">Play around with these values to see your potential returns!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Amount (₹)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly SIP (₹)</label>
              <input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expected Return (%)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Years</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📊 Projection Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount Invested</p>
                <p className="text-2xl font-bold text-blue-600">₹{projection.invested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Returns</p>
                <p className="text-2xl font-bold text-green-600">₹{Math.round(projection.returns).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{Math.round(projection.total).toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
              💡 If you invest ₹{principal.toLocaleString()} initially + ₹{monthly.toLocaleString()}/month for {years} years at {rate}% return,
              you'll have <strong>₹{Math.round(projection.total).toLocaleString()}</strong> 
              (Returns: ₹{Math.round(projection.returns).toLocaleString()} = {((projection.returns/projection.invested)*100).toFixed(1)}% gain)
            </p>
          </div>
        </div>

        {/* Add/Edit Investment Form */}
        {showAddForm && (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? '✏️ Edit Investment' : '➕ Add New Investment'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Investment Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Company ESPP 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Investment['type']})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="espp">📈 ESPP (Employee Stock Plan)</option>
                    <option value="sip">💹 SIP (Systematic Investment)</option>
                    <option value="mutual_fund">📊 Mutual Fund</option>
                    <option value="stocks">📉 Stocks</option>
                    <option value="fd">🏦 Fixed Deposit</option>
                    <option value="ppf">🏛️ PPF</option>
                    <option value="nps">💼 NPS</option>
                    <option value="other">💵 Other</option>
                  </select>
                </div>

                {/* ESPP-Specific Fields */}
                {formData.type === 'espp' && (
                  <>
                    <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📈 ESPP Stock Details - Required for Calculations!</p>
                      <p className="text-xs text-blue-600 mb-2">⚠️ <strong>Purchase Price is REQUIRED</strong> - Enter the price YOU paid per share after discount (e.g., $85.50). Without this, shares won't calculate!</p>
                      <p className="text-xs text-muted-foreground">Current stock price is used to show your gains. Update it regularly to track performance.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">💰 Purchase Price per Share ($)*</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({...formData, purchase_price: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g., 85.50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Price YOU pay per share after discount</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">📊 Current Stock Price ($)*</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.current_stock_price}
                        onChange={(e) => setFormData({...formData, current_stock_price: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g., 150.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Current market price per share</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">🎁 ESPP Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({...formData, discount_percent: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="15"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Usually 10-15%</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        📦 Shares Purchased/Month 
                        <span className="ml-2 text-blue-600 cursor-help" title="Auto-calculated from: Monthly Contribution ÷ Purchase Price">ℹ️</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price > 0 && formData.monthly_contribution > 0 
                          ? (formData.monthly_contribution / (formData.purchase_price * 83)).toFixed(2) 
                          : formData.shares_per_month}
                        onChange={(e) => setFormData({...formData, shares_per_month: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg bg-blue-50 dark:bg-blue-900/20"
                        placeholder="Auto-calculated"
                        disabled
                      />
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Auto-calculated: ₹{formData.monthly_contribution.toLocaleString()} ÷ (${formData.purchase_price} × ₹83 exchange) = {formData.purchase_price > 0 ? (formData.monthly_contribution / (formData.purchase_price * 83)).toFixed(2) : 0} shares
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">⏱️ Vesting Period (months)</label>
                      <input
                        type="number"
                        value={formData.vesting_months}
                        onChange={(e) => setFormData({...formData, vesting_months: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="24"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Usually 24 months (2 years)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">🔙 Lookback Period (months)</label>
                      <input
                        type="number"
                        value={formData.lookback_months}
                        onChange={(e) => setFormData({...formData, lookback_months: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="6"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Usually 6 months</p>
                    </div>

                    {formData.current_stock_price > 0 && formData.purchase_price > 0 && (
                      <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">💰 Instant Gain Calculation</p>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Purchase Price</p>
                            <p className="font-bold">${formData.purchase_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Price</p>
                            <p className="font-bold">${formData.current_stock_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gain per Share</p>
                            <p className="font-bold text-green-600">${(formData.current_stock_price - formData.purchase_price).toFixed(2)} ({((formData.current_stock_price - formData.purchase_price) / formData.purchase_price * 100).toFixed(1)}%)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Initial Principal (₹)</label>
                  <input
                    type="number"
                    value={formData.principal}
                    onChange={(e) => setFormData({...formData, principal: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Contribution (₹) *</label>
                  <input
                    type="number"
                    value={formData.monthly_contribution}
                    onChange={(e) => setFormData({...formData, monthly_contribution: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Annual Return (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expected_return_rate}
                    onChange={(e) => setFormData({...formData, expected_return_rate: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tenure (months) *</label>
                  <input
                    type="number"
                    value={formData.tenure_months}
                    onChange={(e) => setFormData({...formData, tenure_months: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Value (₹)</label>
                  <input
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({...formData, current_value: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  💾 Add Investment
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Investments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.map((inv) => {
            const projected = calculateFV(inv.principal, inv.monthly_contribution, inv.expected_return_rate, inv.tenure_months / 12);
            const monthsElapsed = inv.start_date ? Math.floor((new Date().getTime() - new Date(inv.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
            const progress = Math.min((monthsElapsed / inv.tenure_months) * 100, 100);
            
            return (
              <div key={inv.id} className="bg-card rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{inv.name}</h3>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium mt-2">
                      {inv.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(inv)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 font-medium text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id, inv.name)}
                      className="text-red-600 hover:text-red-800 dark:text-red-300 font-medium text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {inv.type === 'espp' ? (
                  /* ESPP-Specific Display */
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-3">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">📈 Stock Details</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Purchase Price</p>
                          <p className="font-bold text-blue-600">${inv.purchase_price?.toFixed(2) || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Price</p>
                          <p className="font-bold text-green-600">${inv.current_stock_price?.toFixed(2) || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Discount</p>
                          <p className="font-bold">{inv.discount_percent || 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Shares/Month</p>
                          <p className="font-bold">{inv.shares_per_month?.toFixed(2) || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    {(() => {
                      const esppGains = calculateESPPGains(inv);
                      return esppGains.totalShares > 0 ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                          <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">💰 Current Holdings</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Total Shares</p>
                              <p className="font-bold">{esppGains.totalShares.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Invested</p>
                              <p className="font-bold">${esppGains.totalInvested.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Current Value</p>
                              <p className="font-bold text-green-600">${esppGains.currentValue?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Gain</p>
                              <p className="font-bold text-green-600">${esppGains.totalGain.toLocaleString()} ({esppGains.gainPercent.toFixed(1)}%)</p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Monthly Contribution:</span>
                      <span className="font-bold">₹{inv.monthly_contribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vesting Period:</span>
                      <span className="font-bold">{inv.vesting_months || 24} months</span>
                    </div>
                  </div>
                ) : (
                  /* Regular Investment Display */
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="font-bold text-blue-600">₹{inv.principal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly SIP:</span>
                      <span className="font-bold">₹{inv.monthly_contribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Return:</span>
                      <span className="font-bold text-green-600">{inv.expected_return_rate}% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span className="font-bold">{inv.tenure_months} months ({(inv.tenure_months/12).toFixed(1)} years)</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Progress: {progress.toFixed(0)}% ({monthsElapsed}/{inv.tenure_months} months)</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                  </div>
                </div>

                <div className="pt-3 border-t bg-green-50 dark:bg-green-900/20 -mx-6 px-6 py-3 mt-3 rounded-b-lg">
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-2"><strong>Projected Maturity Value:</strong></p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Invested</p>
                      <p className="font-bold">₹{projected.invested.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Returns</p>
                      <p className="font-bold text-green-600">₹{Math.round(projected.returns).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-purple-600">₹{Math.round(projected.total).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {inv.notes && (
                  <p className="mt-3 text-sm text-muted-foreground italic">📝 {inv.notes}</p>
                )}
              </div>
            );
          })}
        </div>

        {investments.length === 0 && !showAddForm && (
          <div className="text-center py-12 bg-card rounded-lg">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-xl text-muted-foreground mb-2">No investments yet</p>
            <p className="text-muted-foreground mb-4">Start tracking your SIP, ESPP, Mutual Funds, and more!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Add Your First Investment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentsPage;

