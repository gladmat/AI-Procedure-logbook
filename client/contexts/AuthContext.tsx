import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  AuthUser, 
  UserProfile, 
  UserFacility,
  getCurrentUser, 
  login as authLogin, 
  signup as authSignup,
  logout as authLogout,
  updateProfile as authUpdateProfile,
  getUserFacilities,
  createFacility as authCreateFacility,
  deleteFacility as authDeleteFacility,
} from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  facilities: UserFacility[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addFacility: (name: string, isPrimary?: boolean) => Promise<void>;
  removeFacility: (id: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facilities, setFacilities] = useState<UserFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      if (data) {
        setUser(data.user);
        setProfile(data.profile || null);
        setFacilities(data.facilities || []);
      } else {
        setUser(null);
        setProfile(null);
        setFacilities([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setFacilities([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await authLogin(email, password);
    setUser(data.user);
    setProfile(data.profile || null);
    setFacilities(data.facilities || []);
  };

  const signup = async (email: string, password: string) => {
    const data = await authSignup(email, password);
    setUser(data.user);
    setProfile(data.profile || null);
    setFacilities([]);
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    setProfile(null);
    setFacilities([]);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    const updated = await authUpdateProfile(profileData);
    setProfile(updated);
  };

  const addFacility = async (name: string, isPrimary: boolean = false) => {
    const facility = await authCreateFacility(name, isPrimary);
    setFacilities(prev => [...prev, facility]);
  };

  const removeFacility = async (id: string) => {
    await authDeleteFacility(id);
    setFacilities(prev => prev.filter(f => f.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        facilities,
        isLoading,
        isAuthenticated: !!user,
        onboardingComplete: profile?.onboardingComplete ?? false,
        login,
        signup,
        logout,
        updateProfile,
        addFacility,
        removeFacility,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
