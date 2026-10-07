import { useState } from 'react';
import { ControlAuthProvider, useControlAuth } from './contexts/AuthContext';
import ControlLogin from './components/auth/ControlLogin';
import ControlLayout from './components/layout/ControlLayout';
import OverviewTab from './components/dashboard/OverviewTab';
import PackagesTab from './components/packages/PackagesTab';
import AdminsTab from './components/admins/AdminsTab';
import EmployeesTab from './components/employees/EmployeesTab';
import CompaniesTab from './components/companies/CompaniesTab';

function ControlAppContent() {
  const { isAuthenticated } = useControlAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAuthenticated) {
    return <ControlLogin />;
  }

  return (
    <ControlLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
      {activeTab === 'packages' && <PackagesTab />}
      {activeTab === 'admins' && <AdminsTab />}
      {activeTab === 'employees' && <EmployeesTab />}
      {activeTab === 'companies' && <CompaniesTab />}
    </ControlLayout>
  );
}

export default function App() {
  return (
    <ControlAuthProvider>
      <ControlAppContent />
    </ControlAuthProvider>
  );
}
