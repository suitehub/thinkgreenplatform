/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { StudentPortal } from './components/modules/student/StudentPortal';
import { TeacherPortal } from './components/modules/teacher/TeacherPortal';
import { SecretariatModule } from './components/modules/secretariat/SecretariatModule';
import { FinanceModule } from './components/modules/finance/FinanceModule';
import { AcademicModule } from './components/modules/academic/AcademicModule';
import { AccountingModule } from './components/modules/accounting/AccountingModule';
import { AdminModule } from './components/modules/admin/AdminModule';

const AuthenticatedLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('student_home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);

  // Sync initial tab when user role changes
  useEffect(() => {
    switch (currentUser.role) {
      case 'STUDENT':
        setCurrentTab('student_home');
        break;
      case 'TEACHER':
        setCurrentTab('teacher_home');
        break;
      case 'SECRETARIAT':
        setCurrentTab('sec_home');
        break;
      case 'FINANCE':
        setCurrentTab('fin_home');
        break;
      case 'ACCOUNTING':
        setCurrentTab('acc_home');
        break;
      case 'SUPER_ADMIN':
        setCurrentTab('admin_home');
        break;
      default:
        setCurrentTab('student_home');
    }
  }, [currentUser.role]);

  // Navigate to student detail from global search
  const handleNavigateToStudent = (studentId: string) => {
    setSelectedStudentForDetail(studentId);
    if (currentUser.role === 'SECRETARIAT' || currentUser.role === 'SUPER_ADMIN') {
      setCurrentTab('sec_students');
    }
  };

  // Render appropriate module view based on role and tab
  const renderContent = () => {
    if (currentUser.role === 'STUDENT') {
      return <StudentPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

    if (currentUser.role === 'TEACHER') {
      return <TeacherPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

    if (currentUser.role === 'SECRETARIAT') {
      return (
        <SecretariatModule
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          selectedStudentIdForDetail={selectedStudentForDetail}
        />
      );
    }

    if (currentUser.role === 'FINANCE') {
      return <FinanceModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

    if (currentUser.role === 'ACCOUNTING') {
      return <AccountingModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

    // SUPER_ADMIN can access all tabs
    if (currentTab.startsWith('sec_')) {
      return (
        <SecretariatModule
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          selectedStudentIdForDetail={selectedStudentForDetail}
        />
      );
    }
    if (currentTab.startsWith('fin_')) {
      return <FinanceModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }
    if (currentTab.startsWith('acad_')) {
      return <AcademicModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }
    if (currentTab.startsWith('acc_')) {
      return <AccountingModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }
    if (currentTab.startsWith('teacher_')) {
      return <TeacherPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }
    if (currentTab.startsWith('student_')) {
      return <StudentPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

    return <AdminModule currentTab={currentTab} setCurrentTab={setCurrentTab} />;
  };

  // If logged in as STUDENT, render the dedicated Think Green Portal Estudante screen
  if (currentUser.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans antialiased selection:bg-[#075e38] selection:text-white">
        <StudentPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  // If logged in as TEACHER, render the dedicated Think Green Painel do Professor screen
  if (currentUser.role === 'TEACHER') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans antialiased selection:bg-[#075e38] selection:text-white">
        <TeacherPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  // If logged in as SECRETARIAT, render the dedicated Think Green Painel da Secretaria screen
  if (currentUser.role === 'SECRETARIAT') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-[#075e38] selection:text-white">
        <SecretariatModule
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          selectedStudentIdForDetail={selectedStudentForDetail}
          standalone={true}
        />
      </div>
    );
  }

  // If logged in as FINANCE, render the dedicated Think Green Painel Financeiro screen
  if (currentUser.role === 'FINANCE') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-[#075e38] selection:text-white">
        <FinanceModule
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          standalone={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800 font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* Dynamic Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Topbar */}
        <Topbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateToStudent={handleNavigateToStudent}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
