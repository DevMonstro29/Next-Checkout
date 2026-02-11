import { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileContextType {
  isAdmin: boolean;
  setProfile: (data: { approved?: boolean; isAdmin?: boolean }) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  const setProfile = (data: { approved?: boolean; isAdmin?: boolean }) => {
    if (data.isAdmin !== undefined) setIsAdmin(data.isAdmin);
  };

  return (
    <ProfileContext.Provider value={{ isAdmin, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
