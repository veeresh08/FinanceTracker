import React from 'react';
import { useUser } from '../UserContext';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile';
  onNavigate: (page: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile') => void;
  userName?: string;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, userName, onLogout }) => {
  const { currentUser, allUsers, setCurrentUser } = useUser();
  
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: '🏠' },
    { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
    { id: 'loans' as const, label: 'Loans', icon: '💰' },
    { id: 'investments' as const, label: 'Investments', icon: '📈' },
    { id: 'monthly' as const, label: 'Monthly Tracker', icon: '📅' },
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
  ];

  // Removed user switching for security - each authenticated user sees only their own data

  return (
    <nav className="navbar-premium animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Premium Logo/Brand */}
          <div className="flex items-center space-x-4 animate-slide-in-right">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <span className="text-white text-2xl font-bold">₹</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                WealthFlow
              </h1>
              <p className="text-xs text-gray-500 font-medium">Financial Management Suite</p>
            </div>
            {currentUser && (
              <div className="hidden lg:flex items-center ml-6 pl-6 border-l-2 border-gray-200">
                <span className="text-xs text-gray-500 font-medium mr-2">Welcome,</span>
                <span className="text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 rounded-full font-bold shadow-md">
                  👤 {currentUser.user_name}
                </span>
              </div>
            )}
          </div>

          {/* Premium Navigation Items */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item ${
                  currentPage === item.id
                    ? 'nav-item-active scale-105 shadow-md'
                    : 'nav-item-inactive'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
                {currentPage === item.id && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></span>
                )}
              </button>
            ))}
            
            {/* Premium Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-4 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full text-sm font-bold hover:from-red-600 hover:to-rose-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Modern Mobile menu button */}
          <div className="md:hidden">
            <button
              className="btn-icon text-gray-600 hover:text-gray-900"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Mobile menu */}
      <div id="mobile-menu" className="hidden md:hidden glass-card m-4 rounded-2xl animate-slide-in-bottom overflow-hidden">
        <div className="p-4 space-y-2">
          {/* Mobile User Info */}
          {currentUser && (
            <div className="mb-4 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {currentUser.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{currentUser.user_name}</p>
                  <p className="text-xs text-gray-500">Account Active</p>
                </div>
              </div>
            </div>
          )}

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center space-x-3 transition-all duration-300 ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          {/* Mobile Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-3 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 mt-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

