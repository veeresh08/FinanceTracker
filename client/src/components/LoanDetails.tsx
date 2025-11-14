import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../api';
import { Loan, PaymentSchedule } from '../types';

interface LoanDetailsProps {
  loanId: number;
  onBack: () => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ loanId, onBack }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      const [loanResponse, scheduleResponse] = await Promise.all([
        api.getLoan(loanId),
        api.getLoanSchedule(loanId),
      ]);
      setLoan(loanResponse.data);
      setSchedule(scheduleResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await api.deleteLoan(loanId);
        onBack();
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  if (loading || !loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare chart data - sample every 6 months for readability
  const chartData = schedule.filter((_, index) => index % 6 === 0 || index === schedule.length - 1);

  const totalPaid = loan.monthly_payment * loan.loan_term_months;
  const progressPercent = ((loan.loan_term_months - schedule.length) / loan.loan_term_months) * 100;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-primary-600 hover:text-primary-800 font-medium"
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
        >
          Delete Loan
        </button>
      </div>

      {/* Loan Header Card */}
      <div className="card mb-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{loan.loan_name}</h1>
            <p className="text-primary-100 capitalize">{loan.loan_type.replace('_', ' ')} Loan</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Status</p>
            <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              {loan.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm opacity-90">Principal Amount</p>
            <p className="text-2xl font-bold">${loan.principal_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Interest Rate</p>
            <p className="text-2xl font-bold">{loan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Monthly Payment</p>
            <p className="text-2xl font-bold">${loan.monthly_payment.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Loan Term</p>
            <p className="text-2xl font-bold">{loan.loan_term_months} months</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Interest</p>
          <p className="text-3xl font-bold text-red-600">${loan.total_interest.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">
            {((loan.total_interest / loan.principal_amount) * 100).toFixed(1)}% of principal
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Amount Payable</p>
          <p className="text-3xl font-bold text-gray-800">${totalPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">
            Principal + Interest over {Math.floor(loan.loan_term_months / 12)} years
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Loan End Date</p>
          <p className="text-3xl font-bold text-green-600">
            {new Date(
              new Date(loan.start_date).setMonth(
                new Date(loan.start_date).getMonth() + loan.loan_term_months
              )
            ).getFullYear()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(
              new Date(loan.start_date).setMonth(
                new Date(loan.start_date).getMonth() + loan.loan_term_months
              )
            ).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Balance Over Time Chart */}
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📉 Remaining Balance Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
              }}
            />
            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#0ea5e9"
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Principal vs Interest Chart */}
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">💰 Principal vs Interest Payments</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
              }}
            />
            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="principal"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Principal Payment"
            />
            <Line
              type="monotone"
              dataKey="interest"
              stroke="#ef4444"
              strokeWidth={2}
              name="Interest Payment"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Schedule Table */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📅 Payment Schedule</h2>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Payment</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Principal</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Interest</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedule.map((payment) => (
                <tr key={payment.month} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">{payment.month}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-gray-800">
                    ${payment.payment.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-blue-600">
                    ${payment.principal.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-red-600">
                    ${payment.interest.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                    ${payment.balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">
                    ${payment.totalInterest.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;


