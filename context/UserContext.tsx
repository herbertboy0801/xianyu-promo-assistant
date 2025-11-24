import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, QrConfig } from '../types';
import { supabase } from '../services/supabase';

interface UserContextType {
  user: UserProfile | null;
  allUsers: UserProfile[]; // For admin to see
  globalConfig: { masterTemplate?: string; qrConfig?: QrConfig };
  updateUser: (profile: Partial<UserProfile>) => void;
  updateGlobalConfig: (config: { masterTemplate?: string; qrConfig?: QrConfig }) => Promise<void>;
  login: (nickname: string, password?: string, isAdminLogin?: boolean) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, nickname: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  toggleUserRole: (targetNickname: string, role: UserRole) => Promise<void>; // Admin action
  deleteUser: (targetNickname: string) => Promise<void>; // Admin action
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'xianyu_current_user_v2';
const DEFAULT_QR_CONFIG: QrConfig = {
  x: 47, y: 1694, size: 165,
  zoom: 1.2, cropX: 0, cropY: -4,
  titleX: 50, titleY: 10, titleSize: 40, titleColor: '#000000',
  priceX: 50, priceY: 20, priceSize: 60, priceColor: '#ff0000'
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [globalConfig, setGlobalConfig] = useState<{ masterTemplate?: string; qrConfig?: QrConfig }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth Listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // User is signed in, fetch profile
        const { email } = session.user;
        // Try to find user by email in our 'users' table
        // Note: We primarily key by nickname, but for Auth we need to link them.
        // For simplicity in this migration, let's assume we query by email if available, 
        // or we might need to rely on local storage if the link isn't established yet.

        // Strategy: 
        // 1. If we have a session, try to find a user profile with this email.
        if (email) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (data) {
            const userData: UserProfile = {
              ...data,
              roles: data.roles || ['promoter'],
              qrConfig: data.qr_config, // Map snake_case to camelCase
              qrCode: data.qr_code,     // Map snake_case to camelCase
              masterTemplate: data.master_template // Map snake_case to camelCase
            };
            setUser(userData);
            if (userData.roles.includes('admin')) {
              fetchAllUsers();
            }
          }
        }
      } else {
        // Check localStorage for legacy "Nickname only" login (no Supabase Auth)
        const storedNickname = localStorage.getItem(CURRENT_USER_KEY);
        if (storedNickname) {
          fetchUserProfile(storedNickname);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Fetch Global Config
    fetchGlobalConfig();

    // Failsafe: Force loading to false after 5 seconds
    const timer = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) {
          console.warn("Auth listener timeout, forcing app load.");
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchGlobalConfig = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (data) {
      setGlobalConfig({
        masterTemplate: data.master_template,
        qrConfig: data.qr_config
      });
    }
  };

  const fetchUserProfile = async (nickname: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname)
        .single();

      if (data) {
        const userData = { ...data, roles: data.roles || ['promoter'] } as UserProfile;
        setUser(userData);
        if (userData.roles.includes('admin')) {
          fetchAllUsers();
        }
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (data) {
      setAllUsers(data.map(u => ({ ...u, roles: u.roles || ['promoter'] } as UserProfile)));
    }
  };

  const updateUser = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profile };
    setUser(updatedUser);

    try {
      // Map frontend camelCase to DB snake_case if needed, 
      // but if we created table with matching names or just use JSONB it's easier.
      // Based on SQL plan: nickname, email, roles, qr_code, qr_config, join_date
      // We need to map fields manually or ensure DB columns match.
      // Let's assume we map manually for safety.

      const updates: any = {};
      if (profile.qrCode !== undefined) updates.qr_code = profile.qrCode;
      if (profile.qrConfig !== undefined) updates.qr_config = profile.qrConfig;
      if (profile.roles !== undefined) updates.roles = profile.roles;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('nickname', user.nickname);

      if (error) throw error;
    } catch (e) {
      console.error("Error updating user:", e);
      alert("保存失败");
    }
  };

  const updateGlobalConfig = async (config: { masterTemplate?: string; qrConfig?: QrConfig }) => {
    setGlobalConfig(prev => ({ ...prev, ...config }));
    try {
      const updates: any = {};
      if (config.masterTemplate !== undefined) updates.master_template = config.masterTemplate;
      if (config.qrConfig !== undefined) updates.qr_config = config.qrConfig;

      // Upsert 'default' settings
      const { error } = await supabase
        .from('global_settings')
        .upsert({ id: 'default', ...updates });

      if (error) throw error;
    } catch (e) {
      console.error("Error updating global config:", e);
      alert("全局配置保存失败");
    }
  };

  // Legacy Nickname Login (No Auth, just DB check)
  const login = async (nickname: string, password?: string, isAdminLogin?: boolean) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname)
        .maybeSingle();

      if (!data) {
        // Register if not exists (Legacy flow)
        const newUser = {
          nickname,
          roles: ['promoter'],
          role: 'promoter', // Legacy field
          qr_code: '',
          qr_config: DEFAULT_QR_CONFIG,
          join_date: Date.now()
        };

        const { error: insertError } = await supabase.from('users').insert(newUser);
        if (insertError) throw insertError;

        // Map back to UserProfile (camelCase)
        const userProfile: UserProfile = {
          nickname: newUser.nickname,
          roles: newUser.roles as UserRole[],
          role: newUser.role as UserRole,
          qrCode: newUser.qr_code,
          qrConfig: newUser.qr_config,
          joinDate: newUser.join_date
        };
        setUser(userProfile);
        localStorage.setItem(CURRENT_USER_KEY, nickname);
      } else {
        // Login
        // Verify password if set
        if (data.password && data.password !== password) {
          throw new Error("密码错误");
        }

        const userData: UserProfile = {
          ...data,
          roles: data.roles || ['promoter'],
          qrConfig: data.qr_config,
          qrCode: data.qr_code,
          masterTemplate: data.master_template
        };
        setUser(userData);
        localStorage.setItem(CURRENT_USER_KEY, nickname);
        if (userData.roles.includes('admin')) await fetchAllUsers();
      }
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // User profile will be fetched by onAuthStateChange
    } catch (error: any) {
      console.error("Email login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, nickname: string) => {
    setIsLoading(true);
    try {
      // 1. Check if nickname exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', nickname)
        .single();

      if (existingUser) {
        throw new Error("该昵称已被使用，请换一个");
      }

      // 2. Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname }
        }
      });

      if (error) throw error;

      // 3. Create User Profile in DB
      const newUser = {
        nickname,
        email,
        roles: ['promoter'],
        qr_config: DEFAULT_QR_CONFIG,
        join_date: Date.now()
      };

      const { error: insertError } = await supabase.from('users').insert(newUser);
      if (insertError) throw insertError;

      // User profile will be fetched by onAuthStateChange
    } catch (error: any) {
      console.error("Email register failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google login failed", error);
      alert("Google 登录失败: " + error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      alert("重置密码邮件已发送");
    } catch (error: any) {
      console.error("Password reset failed", error);
      alert("发送失败: " + error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const toggleUserRole = async (targetNickname: string, roleToToggle: UserRole) => {
    const targetUser = allUsers.find(u => u.nickname === targetNickname);
    if (!targetUser) return;

    const currentRoles = targetUser.roles || [];
    let newRoles: UserRole[];

    if (currentRoles.includes(roleToToggle)) {
      newRoles = currentRoles.filter(r => r !== roleToToggle);
    } else {
      newRoles = [...currentRoles, roleToToggle];
    }
    if (!newRoles.includes('promoter')) newRoles.push('promoter');

    try {
      const { error } = await supabase
        .from('users')
        .update({ roles: newRoles })
        .eq('nickname', targetNickname);

      if (error) throw error;

      // Update local state
      setAllUsers(prev => prev.map(u => u.nickname === targetNickname ? { ...u, roles: newRoles } : u));
      if (user?.nickname === targetNickname) {
        setUser(prev => prev ? { ...prev, roles: newRoles } : null);
      }
    } catch (e) {
      console.error("Error toggling role:", e);
      alert("权限修改失败");
    }
  };

  const deleteUser = async (targetNickname: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('nickname', targetNickname);

      if (error) throw error;
      setAllUsers(prev => prev.filter(u => u.nickname !== targetNickname));
    } catch (e) {
      console.error("Error deleting user:", e);
      alert("删除失败");
    }
  };

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    return user.roles?.includes(role) || false;
  };

  return (
    <UserContext.Provider value={{
      user,
      allUsers,
      globalConfig,
      updateUser,
      updateGlobalConfig,
      login,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      resetPassword,
      logout,
      toggleUserRole,
      deleteUser,
      isAuthenticated: !!user,
      isLoading,
      hasRole
    }}>
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
