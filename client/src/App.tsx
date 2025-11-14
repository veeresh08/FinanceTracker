import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ImprovedDashboard from './components/ImprovedDashboard';
import LoansPage from './components/LoansPage';
import InvestmentsPage from './components/InvestmentsPage';
import ImprovedMonthlyTracker from './components/ImprovedMonthlyTracker';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginPage';
import { UserProvider, useUser } from './UserContext';
import { api } from './api';

type PageType = 'home' | 'dashboard' | 'loans' | 'investments' | 'monthly' | 'profile';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const { currentUser, setCurrentUser, refreshUsers } = useUser();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.checkAuth();
      if (response.data.isAuthenticated) {
        setIsAuthenticated(true);
        setAuthUser(response.data.user);
        // Load user profiles
        await refreshUsers();
        // Set current user from auth profile
        if (response.data.user.profile) {
          setCurrentUser(response.data.user.profile);
        }
      } else {
        // If not authenticated, show login page
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // For now, bypass auth on error and show login page
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (user: any) => {
    setIsAuthenticated(true);
    setAuthUser(user);
    // Reload profiles and set current user
    await refreshUsers();
    if (user.profile) {
      setCurrentUser(user.profile);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setAuthUser(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render page based on current navigation
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'dashboard':
        return <ImprovedDashboard />;
      case 'loans':
        return <LoansPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'monthly':
        return <ImprovedMonthlyTracker />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        userName={authUser?.username || authUser?.phone || currentUser?.user_name}
        onLogout={handleLogout}
      />
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
