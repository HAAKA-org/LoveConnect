import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  avatar?: string;
  partnerId?: string;
  partnerName?: string;
  partnerEmail?: string;
  isPaired?: boolean;
  partnerCode?: string;
  relationshipStatus?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pin: string) => Promise<boolean>;
  signup: (name: string, email: string, gender: string, pin: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-refresh token every 24 hours (to be safe with 30-day token)
  useEffect(() => {
    if (isAuthenticated) {
      // Only set up refresh interval after initial authentication
      const refreshInterval = setInterval(async () => {
        try {
          await fetch('http://localhost:8000/loveconnect/api/refresh-token/', {
            method: 'POST',
            credentials: 'include'
          });
          console.log('Token refreshed automatically');
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails, user might need to login again
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated]);

  // Check authentication on app start only
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get user from localStorage for immediate UI update
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('user');
          }
        }

        // Then verify with backend (only once on app start)
        const response = await fetch('http://localhost:8000/loveconnect/api/get-user/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          const user: User = {
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            gender: userData.gender,
            isPaired: userData.isPaired,
            partnerCode: userData.partnerCode,
            partnerName: userData.partnerName,
            partnerEmail: userData.pairedWith,
            relationshipStatus: userData.relationshipStatus
          };
          
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // Clear any stale data if backend verification fails
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Don't clear data on network errors - maintain offline state
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Empty dependency array - only run once on mount

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Back online - checking auth status');
      try {
        const response = await fetch('http://localhost:8000/loveconnect/api/get-user/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          const user: User = {
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            gender: userData.gender,
            isPaired: userData.isPaired,
            partnerCode: userData.partnerCode,
            partnerName: userData.partnerName,
            partnerEmail: userData.pairedWith,
            relationshipStatus: userData.relationshipStatus
          };
          
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Online auth check failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const login = async (email: string, pin: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/loveconnect/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, pin })
      });

      const data = await response.json();

      if (response.status === 403) {
        // Handle specific error cases
        if (data.error?.includes('Your partner has taken a break')) {
          throw new Error(data.error);
        }
        if (data.error?.includes('You must pair with your partner')) {
          throw new Error('PAIRING_REQUIRED');
        }
        throw new Error(data.error || 'Access denied');
      }

      if (response.ok) {
        // Login successful - fetch user data
        const userResponse = await fetch('http://localhost:8000/loveconnect/api/get-user/', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user: User = {
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            gender: userData.gender,
            isPaired: userData.isPaired,
            partnerCode: userData.partnerCode,
            partnerName: userData.partnerName,
            partnerEmail: userData.pairedWith,
            relationshipStatus: userData.relationshipStatus
          };
          
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(user));
          return true;
        }
      }
      
      throw new Error(data.error || 'Login failed');
    } catch (error) {
      // Re-throw the error to be handled by the component
      throw error;
    }
  };

  const signup = async (name: string, email: string, gender: string, pin: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/loveconnect/api/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, gender, pin })
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear cookies
      await fetch('http://localhost:8000/loveconnect/api/logout/', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Continue with logout even if backend call fails
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch('http://localhost:8000/loveconnect/api/get-user/', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        const user: User = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          gender: userData.gender,
          isPaired: userData.isPaired,
          partnerCode: userData.partnerCode,
          partnerName: userData.partnerName,
          partnerEmail: userData.pairedWith,
          relationshipStatus: userData.relationshipStatus
        };
        
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUserData, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};