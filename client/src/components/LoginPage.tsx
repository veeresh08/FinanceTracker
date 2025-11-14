import React, { useState } from 'react';
import axios from 'axios';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [authMethod, setAuthMethod] = useState<'password' | 'otp' | 'google'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    otp: '',
    user_name: '',
    monthly_salary: '',
    other_income: '',
    currency: 'INR'
  });

  const API_URL = 'http://localhost:3001/api';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: formData.username,
        password: formData.password
      }, { withCredentials: true });

      onLoginSuccess(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        user_name: formData.user_name,
        monthly_salary: Number(formData.monthly_salary),
        other_income: Number(formData.other_income || 0),
        currency: formData.currency
      }, { withCredentials: true });

      onLoginSuccess(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/request-otp`, {
        phone: formData.phone
      });

      setOtpSent(true);
      setError('');
      // Show OTP in console for testing
      console.log('OTP:', response.data.otp_debug);
      alert(`OTP sent to ${formData.phone}. Check console for OTP (testing mode)`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        phone: formData.phone,
        otp: formData.otp,
        user_name: formData.user_name || formData.phone,
        monthly_salary: Number(formData.monthly_salary || 0),
        other_income: Number(formData.other_income || 0),
        currency: formData.currency
      }, { withCredentials: true });

      if (response.data.needsProfile) {
        setError('Please complete your profile');
      } else {
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In callback
  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');

    try {
      // Send the credential (JWT token) to our backend
      const result = await axios.post(`${API_URL}/auth/google`, {
        credential: response.credential
      }, { withCredentials: true });

      onLoginSuccess(result.data.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.response?.data?.error || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Sign-In when component mounts
  React.useEffect(() => {
    const GOOGLE_CLIENT_ID = '46815400135-ovvd2t9lghb3m2sr2anv6sup1rq66ckn.apps.googleusercontent.com';
    
    const initGoogleSignIn = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false // Disable FedCM to avoid 403 errors
        });

        // Render the Google button
        const googleButtonDiv = document.getElementById('googleSignInButton');
        if (googleButtonDiv && googleButtonDiv.children.length === 0) {
          (window as any).google.accounts.id.renderButton(
            googleButtonDiv,
            {
              theme: 'outline',
              size: 'large',
              width: 350,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
        }
      } else {
        // Retry after 500ms if Google SDK not loaded yet
        setTimeout(initGoogleSignIn, 500);
      }
    };

    initGoogleSignIn();
  }, [mode]); // Re-initialize when switching between login/register

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Image/Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center text-white p-12">
          <div className="mb-8">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <span className="text-6xl">₹</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-center">Loan Tracker</h1>
            <p className="text-xl text-center text-white/90">Track your loans, plan your future</p>
          </div>

          <div className="space-y-4 text-white/90">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <p>Visualize your loan payments</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <p>Track monthly expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <p>Plan your debt-free journey</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome Back!' : mode === 'register' ? 'Create Account' : 'Phone Login'}
            </h2>
            <p className="text-gray-600">
              {mode === 'login' ? 'Sign in to continue' : mode === 'register' ? 'Sign up to get started' : 'Login with OTP'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Auth Method Tabs */}
          {mode !== 'register' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setAuthMethod('password'); setMode('login'); setOtpSent(false); }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  authMethod === 'password' && mode === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { setAuthMethod('otp'); setMode('otp'); setOtpSent(false); }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  authMethod === 'otp' && mode === 'otp'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📱 OTP
              </button>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username*</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name*</label>
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password*</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary*</label>
                  <input
                    type="number"
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({...formData, monthly_salary: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Income</label>
                  <input
                    type="number"
                    value={formData.other_income}
                    onChange={(e) => setFormData({...formData, other_income: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* OTP Form */}
          {mode === 'otp' && (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleRequestOTP}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => setFormData({...formData, otp: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                      maxLength={6}
                      placeholder="000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (Optional)</label>
                    <input
                      type="number"
                      value={formData.monthly_salary}
                      onChange={(e) => setFormData({...formData, monthly_salary: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-blue-600 font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Google Sign In */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button - Rendered by Google */}
            <div className="mt-4 flex justify-center">
              <div id="googleSignInButton"></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Secure sign-in with your Google account
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center text-sm">
            {mode === 'register' ? (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

