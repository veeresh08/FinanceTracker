import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { UserProfile } from '../types';
import { useUser } from '../UserContext';

const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser, allUsers, refreshUsers, loadingUsers } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  // Removed creatingNewUser state - users should register via signup page for security

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      setEditedProfile(currentUser);
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!profile || !editedProfile || !currentUser) return;

    try {
      await api.updateProfile(profile.id, editedProfile);
      await refreshUsers();
      setEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile');
    }
  };

  if (loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">No profile found</p>
        </div>
      </div>
    );
  }

  const currencySymbol = profile.currency === 'INR' ? '₹' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : '$';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with User Selector */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your account information and preferences</p>
          </div>
          {/* Removed user selector for security - each user can only see their own profile */}
        </div>

        {/* Incomplete Profile Warning */}
        {profile && (!profile.monthly_salary || !(profile as any).email || !(profile as any).phone) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-yellow-700">
                  Some information is missing. Please update your profile to use all features of the app.
                  {!profile.monthly_salary && ' Monthly salary is required for loan calculations.'}
                  {!(profile as any).email && ' Email is recommended for notifications.'}
                  {!(profile as any).phone && ' Phone number enables OTP login.'}
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
                >
                  Update Profile Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Profile Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {profile.user_name ? profile.user_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{profile.user_name || 'No Name'}</h2>
                  <p className="text-sm text-gray-500">Member since {new Date(profile.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            {editing ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Information</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your name"
                        value={editedProfile.user_name || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, user_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                        value={(editedProfile as any).email || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value } as any)}
                      />
                      <p className="mt-1 text-xs text-gray-500">Used for notifications and account recovery</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234567890"
                        value={(editedProfile as any).phone || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value } as any)}
                      />
                      <p className="mt-1 text-xs text-gray-500">For OTP login and SMS alerts</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editedProfile.currency || 'INR'}
                        onChange={(e) => setEditedProfile({ ...editedProfile, currency: e.target.value })}
                      >
                        <option value="INR">₹ Indian Rupee (INR)</option>
                        <option value="USD">$ US Dollar (USD)</option>
                        <option value="EUR">€ Euro (EUR)</option>
                        <option value="GBP">£ Pound Sterling (GBP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Salary ({currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 128000"
                        value={editedProfile.monthly_salary || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, monthly_salary: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Monthly Income ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Freelance, investments, etc."
                        value={editedProfile.other_income || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, other_income: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditedProfile(profile);
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-base font-medium text-gray-900">{profile.user_name || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Username</p>
                    <p className="text-base font-medium text-gray-900">{(profile as any).username || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-base font-medium text-gray-900">{(profile as any).email || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">{(profile as any).phone || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Login Method</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(profile as any).auth_method === 'google' && '🔐 Google'}
                      {(profile as any).auth_method === 'password' && '🔑 Password'}
                      {(profile as any).auth_method === 'otp' && '📱 OTP'}
                      {!(profile as any).auth_method && 'Standard'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preferred Currency</p>
                    <p className="text-base font-medium text-gray-900">
                      {currencySymbol} {profile.currency}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monthly Salary</p>
                    <p className="text-base font-medium text-gray-900">
                      {currencySymbol} {profile.monthly_salary?.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Other Monthly Income</p>
                    <p className="text-base font-medium text-gray-900">
                      {currencySymbol} {(profile.other_income || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Monthly Income</p>
                    <p className="text-base font-semibold text-green-600">
                      {currencySymbol} {((profile.monthly_salary || 0) + (profile.other_income || 0)).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Account Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {!editing && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Account Age</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.floor((Date.now() - new Date(profile.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Currency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{profile.currency}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
