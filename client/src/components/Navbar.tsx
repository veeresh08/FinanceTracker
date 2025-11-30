import React from 'react';
import { useUser } from '../UserContext';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin';
  onNavigate: (page: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin') => void;
  userName?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout, isAdmin }) => {
  const { currentUser } = useUser();
  
  // Build nav items dynamically based on admin status
  const navItems: Array<{ id: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin', label: string, icon: string }> = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'loans', label: 'Loans', icon: '💰' },
    { id: 'investments', label: 'Investments', icon: '📈' },
    { id: 'monthly', label: 'Monthly Tracker', icon: '📅' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // Add admin item if user is admin
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: '🔐' });
  }

  // Removed user switching for security - each authenticated user sees only their own data

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Premium Logo/Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Wealth<span className="text-sky-400">Flow</span>
              </h1>
            </div>
          </div>

          {/* Premium Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  currentPage === item.id
                    ? 'text-white bg-slate-800 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {currentPage === item.id && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full mb-1"></span>
                )}
              </button>
            ))}
            
            {/* Premium Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="p-2 text-slate-400 hover:text-white"
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

      {/* Mobile menu */}
      <div id="mobile-menu" className="hidden md:hidden bg-slate-900 border-t border-slate-800">
        <div className="px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 ${
                currentPage === item.id
                  ? 'text-white bg-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-base font-medium flex items-center gap-3 text-rose-400 hover:bg-rose-500/10"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

