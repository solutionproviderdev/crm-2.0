"use client";

import * as React from "react";
import type { User } from "@/lib/types";

const UserContext = React.createContext<{
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
} | undefined>(undefined);

export function UserProvider({ 
  initialUser, 
  children 
}: { 
  initialUser: User; 
  children: React.ReactNode 
}) {
  const [user, setUser] = React.useState<User | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
