import { useDocumentTitle, useScrollTop } from '@/hooks';
import React from 'react';

const Dashboard = () => {
  useDocumentTitle('Welcome | Admin Dashboard');
  useScrollTop();

  return (
    <div className="loader">
      <h2>Welcome to admin dashboard</h2>
      <span className="text-subtle">Use the Orders menu to review all customer orders.</span>
    </div>
  );
};

export default Dashboard;
