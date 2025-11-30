import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminUser, ActivityLog, PlatformStatistics } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [filterActionType, setFilterActionType] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/statistics`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/activity-logs?limit=100`, { withCredentials: true })
      ]);

      setUsers(usersRes.data.users);
      setStatistics(statsRes.data);
      setActivityLogs(logsRes.data.logs);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      alert(error.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users/${userId}`, { withCredentials: true });
      setUserDetails(res.data);
      setSelectedUser(users.find(u => u.id === userId) || null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to fetch user details');
    }
  };

  const makeAdmin = async (userId: number) => {
    if (!confirm('Are you sure you want to make this user an admin?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/make-admin/${userId}`, {}, { withCredentials: true });
      alert('User promoted to admin successfully');
      fetchAdminData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to make user admin');
    }
  };

  const removeAdmin = async (userId: number) => {
    if (!confirm('Are you sure you want to remove admin rights from this user?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/remove-admin/${userId}`, {}, { withCredentials: true });
      alert('Admin rights removed successfully');
      fetchAdminData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove admin rights');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getActionTypeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'login_success': 'bg-green-100 text-green-800',
      'login_failed': 'bg-red-100 text-red-800',
      'logout': 'bg-gray-100 text-gray-800',
      'admin_view_users': 'bg-blue-100 text-blue-800',
      'admin_view_logs': 'bg-purple-100 text-purple-800',
      'admin_grant': 'bg-orange-100 text-orange-800',
      'admin_revoke': 'bg-yellow-100 text-yellow-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔐 Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage users and monitor platform activity</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Activity Logs ({activityLogs.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow">
              <div className="text-sm font-medium text-blue-600 mb-2">Total Users</div>
              <div className="text-3xl font-bold text-blue-900">{statistics.users.total}</div>
              <div className="mt-2 text-sm text-blue-700">
                {statistics.users.active} active (last 30 days)
              </div>
              <div className="text-xs text-blue-600 mt-1">
                +{statistics.users.new} new (last 7 days)
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow">
              <div className="text-sm font-medium text-green-600 mb-2">Total Loans</div>
              <div className="text-3xl font-bold text-green-900">{statistics.loans.count}</div>
              <div className="mt-2 text-sm text-green-700">
                {formatCurrency(statistics.loans.total_amount)}
              </div>
              <div className="text-xs text-green-600 mt-1">Total loan amount</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow">
              <div className="text-sm font-medium text-purple-600 mb-2">Total Investments</div>
              <div className="text-3xl font-bold text-purple-900">{statistics.investments.count}</div>
              <div className="mt-2 text-sm text-purple-700">
                {formatCurrency(statistics.investments.total_value)}
              </div>
              <div className="text-xs text-purple-600 mt-1">Total investment value</div>
            </div>
          </div>

          {/* Daily Active Users Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">📈 Daily Active Users (Last 7 Days)</h3>
            <div className="space-y-2">
              {statistics.daily_active_users.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-200 rounded-full h-6 relative">
                      <div
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${(day.active_users / Math.max(...statistics.daily_active_users.map(d => d.active_users))) * 100}%`
                        }}
                      >
                        <span className="text-white text-xs font-bold">{day.active_users}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">🎯 Activity by Type (Last 30 Days)</h3>
            <div className="space-y-2">
              {statistics.activity_by_type.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionTypeColor(activity.action_type)}`}>
                    {activity.action_type}
                  </span>
                  <span className="text-gray-900 font-bold">{activity.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">🏆 Most Active Users (Last 30 Days)</h3>
            <div className="space-y-3">
              {statistics.top_users.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">
                      {index + 1}. {user.username}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {user.activity_count} actions
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.username}
                            {user.is_admin === 1 && (
                              <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.user_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{user.email}</div>
                      <div className="text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {user.auth_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.data_summary && (
                        <div className="text-xs">
                          <div>💰 {user.data_summary.loans} loans ({formatCurrency(user.data_summary.total_loan_amount)})</div>
                          <div>📈 {user.data_summary.investments} investments ({formatCurrency(user.data_summary.total_investment_value)})</div>
                          <div>📅 {user.data_summary.monthly_records} records</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => fetchUserDetails(user.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                      {user.is_admin === 0 ? (
                        <button
                          onClick={() => makeAdmin(user.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => removeAdmin(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Details Modal */}
          {selectedUser && userDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">
                    👤 {selectedUser.username}
                  </h2>
                  <button
                    onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold mb-2">Basic Info</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Email: {userDetails.user.email}</div>
                      <div>Phone: {userDetails.user.phone}</div>
                      <div>Auth Method: {userDetails.user.auth_method}</div>
                      <div>Created: {formatDate(userDetails.user.created_at)}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-bold mb-2">💰 Loans ({userDetails.loans.length})</h3>
                    {userDetails.loans.map((loan: any) => (
                      <div key={loan.id} className="text-sm mb-2">
                        • {loan.loan_name}: {formatCurrency(loan.principal_amount)} @ {loan.interest_rate}%
                      </div>
                    ))}
                  </div>

                  <div className="bg-purple-50 p-4 rounded">
                    <h3 className="font-bold mb-2">📈 Investments ({userDetails.investments.length})</h3>
                    {userDetails.investments.map((inv: any) => (
                      <div key={inv.id} className="text-sm mb-2">
                        • {inv.name}: {formatCurrency(inv.current_value || inv.principal)} ({inv.type})
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-50 p-4 rounded max-h-64 overflow-y-auto">
                    <h3 className="font-bold mb-2">📋 Recent Activity</h3>
                    {userDetails.activity_logs.map((log: ActivityLog) => (
                      <div key={log.id} className="text-xs mb-2 pb-2 border-b">
                        <span className={`px-2 py-1 rounded ${getActionTypeColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                        <div className="text-gray-600 mt-1">{log.action_description}</div>
                        <div className="text-gray-500">{formatDate(log.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <select
              value={filterActionType}
              onChange={(e) => setFilterActionType(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="">All Actions</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="logout">Logout</option>
              <option value="admin_view_users">Admin View Users</option>
              <option value="admin_view_logs">Admin View Logs</option>
            </select>
            <button
              onClick={fetchAdminData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs
                    .filter(log => !filterActionType || log.action_type === filterActionType)
                    .map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{log.username || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs">{log.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.action_description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

