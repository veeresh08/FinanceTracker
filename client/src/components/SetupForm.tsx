import React, { useState } from 'react';

interface SetupFormProps {
  onComplete: () => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    user_name: '',
    currency: 'INR',
    monthly_salary: '',
    other_income: '',
  });
  const [loans, setLoans] = useState<any[]>([]);
  const [currentLoan, setCurrentLoan] = useState({
    loan_name: '',
    loan_type: 'personal',
    principal_amount: '',
    interest_rate: '',
    loan_term_months: '',
    start_date: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: profile.user_name,
          currency: profile.currency,
          monthly_salary: parseFloat(profile.monthly_salary),
          other_income: parseFloat(profile.other_income) || 0,
        }),
      });
      if (response.ok) {
        setStep(2);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleAddLoan = () => {
    if (currentLoan.loan_name && currentLoan.principal_amount) {
      setLoans([...loans, currentLoan]);
      setCurrentLoan({
        loan_name: '',
        loan_type: 'personal',
        principal_amount: '',
        interest_rate: '',
        loan_term_months: '',
        start_date: '',
      });
    }
  };

  const handleSubmitLoans = async () => {
    try {
      for (const loan of loans) {
        await fetch('http://localhost:3001/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...loan,
            principal_amount: parseFloat(loan.principal_amount),
            interest_rate: parseFloat(loan.interest_rate),
            loan_term_months: parseInt(loan.loan_term_months),
          }),
        });
      }
      onComplete();
    } catch (error) {
      console.error('Error creating loans:', error);
    }
  };

  const removeLoan = (index: number) => {
    setLoans(loans.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Loan Tracker 💰
          </h1>
          <p className="text-gray-600">Let's set up your financial profile</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div className="w-8 h-8 rounded-full flex items-center justify-center mx-2 bg-primary-600 text-white font-bold">
            1
          </div>
          <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'} font-bold`}>
            2
          </div>
          <div className={`flex-1 h-2 rounded bg-gray-200`} />
        </div>

        {step === 1 && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Information</h2>
            
            <div>
              <label className="label">Your Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your name"
                value={profile.user_name}
                onChange={(e) => setProfile({ ...profile, user_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Currency *</label>
              <select
                className="input-field"
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </select>
            </div>

            <div>
              <label className="label">Monthly Salary *</label>
              <input
                type="number"
                className="input-field"
                placeholder="Enter your monthly salary"
                value={profile.monthly_salary}
                onChange={(e) => setProfile({ ...profile, monthly_salary: e.target.value })}
                required
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Other Monthly Income (optional)</label>
              <input
                type="number"
                className="input-field"
                placeholder="Additional income sources"
                value={profile.other_income}
                onChange={(e) => setProfile({ ...profile, other_income: e.target.value })}
                step="0.01"
              />
            </div>

            {profile.monthly_salary && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Monthly Income</p>
                <p className="text-2xl font-bold text-primary-700">
                  {profile.currency === 'INR' ? '₹' : '$'}{(parseFloat(profile.monthly_salary) + parseFloat(profile.other_income || '0')).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-lg">
              Continue to Loans →
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Your Loans</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Loan Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Home Loan"
                  value={currentLoan.loan_name}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Loan Type *</label>
                <select
                  className="input-field"
                  value={currentLoan.loan_type}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_type: e.target.value })}
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
                <label className="label">Principal Amount *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Loan amount"
                  value={currentLoan.principal_amount}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, principal_amount: e.target.value })}
                  step="0.01"
                />
              </div>

              <div>
                <label className="label">Interest Rate (%) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Annual rate"
                  value={currentLoan.interest_rate}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, interest_rate: e.target.value })}
                  step="0.01"
                />
              </div>

              <div>
                <label className="label">Loan Term (months) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Duration"
                  value={currentLoan.loan_term_months}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_term_months: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={currentLoan.start_date}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, start_date: e.target.value })}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddLoan}
              className="btn-secondary w-full"
            >
              + Add This Loan
            </button>

            {loans.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Added Loans ({loans.length})</h3>
                <div className="space-y-2">
                  {loans.map((loan, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{loan.loan_name}</p>
                        <p className="text-sm text-gray-600">
                          {profile.currency === 'INR' ? '₹' : '$'}{parseFloat(loan.principal_amount).toLocaleString('en-IN', {maximumFractionDigits: 0})} @ {loan.interest_rate}% for {loan.loan_term_months} months
                        </p>
                      </div>
                      <button
                        onClick={() => removeLoan(index)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmitLoans}
                className="btn-primary flex-1"
                disabled={loans.length === 0}
              >
                Complete Setup →
              </button>
            </div>

            {loans.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                You can also skip and add loans later
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupForm;

