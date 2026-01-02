import React from 'react';
import { useUser } from '../UserContext';
import { useTheme } from '../ThemeContext';
import { Sun, Moon, Menu, X, LogOut, Home, LayoutDashboard, Wallet, TrendingUp, Calendar, User, Lock } from 'lucide-react';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin';
  onNavigate: (page: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin') => void;
  userName?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout, isAdmin }) => {
  const { currentUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  // Build nav items dynamically based on admin status
  const navItems: Array<{ id: 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile' | 'admin', label: string, icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'loans', label: 'Loans', icon: <Wallet size={20} /> },
    { id: 'investments', label: 'Investments', icon: <TrendingUp size={20} /> },
    { id: 'monthly', label: 'Monthly Tracker', icon: <Calendar size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  // Add admin item if user is admin
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: <Lock size={20} /> });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border/40 transition-colors duration-300">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            ₹
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline-block">
            WealthFlow
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${currentPage === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Actions (Theme Toggle & User/Logout) */}
        <div className="flex items-center gap-2">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile / Logout */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser.user_name}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors
                  ${currentPage === item.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
          
          {currentUser && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Signed in as {currentUser.user_name}</span>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
