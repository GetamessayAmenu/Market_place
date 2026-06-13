import React from 'react';

import type { AuthUser } from '../../hooks/useAuth';
import Header from '../navigation/Header';
import Sidebar from '../navigation/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: AuthUser | null;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container-responsive py-6">
            {user && (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Welcome, {user.displayName}</h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
