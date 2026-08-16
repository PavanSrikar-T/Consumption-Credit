import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Default to not logged in
  const [isLoading, setIsLoading] = useState(false);

  const login = (newUser: User) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(newUser);
      
      // Bootstrap the mock data appropriately based on persona
      import('../api/mockData').then(({ initializeCreditLines, resetCreditLine }) => {
        if (newUser.vpa === 'existing@super.money') {
          initializeCreditLines([{ name: 'RBL Bank', approvedLimit: 25000, interestRate: 18.0 }], 82);
        } else {
          resetCreditLine();
        }
      });
      
      setIsLoading(false);
    }, 500);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
