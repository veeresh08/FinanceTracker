import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from './api';
import { UserProfile } from './types';

interface UserContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  setCurrentUser: (user: UserProfile | null) => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const refreshUsers = async () => {
    try {
      const response = await api.getUsers();
      const users = response.data || [];
      setAllUsers(users);
      
      // If no current user, set the first one
      if (!currentUser && users.length > 0) {
        setCurrentUser(users[0]);
      }
      
      // If current user exists, refresh their data
      if (currentUser) {
        const updated = users.find(u => u.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
        } else if (users.length > 0) {
          // If current user was deleted, switch to first available user
          setCurrentUser(users[0]);
        } else {
          // No users left
          setCurrentUser(null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching users:', error.message || error);
      // Don't crash the app, just set empty state
      setAllUsers([]);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, allUsers, setCurrentUser, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

