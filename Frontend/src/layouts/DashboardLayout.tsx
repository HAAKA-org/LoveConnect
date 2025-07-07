import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-pink-50 pb-16">
      <main className="h-full">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default DashboardLayout;