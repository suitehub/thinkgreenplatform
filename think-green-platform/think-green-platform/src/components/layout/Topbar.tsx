import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  RotateCcw,
  Sparkles,
  CheckCircle,
  MapPin,
  Clock,
  UserCheck,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { PaymentReceipt } from '../../types';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  onNavigateToStudent?: (studentId: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileSidebar,
  onNavigateToStudent,
}) => {
  const {
    currentUser,
    switchRole,
    switchUserById,
    state,
    resetToDefaultData,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  const unreadNotifs = state.notifications.filter(
    (n) => !n.read && (n.targetRole === 'ALL' || n.targetRole === currentUser.role || n.userId === currentUser.id)
  );

  const handleSelectReceiptId = (receiptId: string) => {
    const found = state.receipts.find((r) => r.id === receiptId);
    if (found) setSelectedReceipt(found);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Spotlight Global Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-md flex items-center justify-between px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:text-slate-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              <span className="truncate">Buscar aluno (STU00000), turma, recibo...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white text-slate-400 border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Center Badge, Notifications, Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Cairo Center Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full text-xs font-semibold text-emerald-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cairo, Egito (مصر)</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900">Notificações do Sistema</h4>
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-purple-600 hover:underline font-semibold"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {state.notifications.length === 0 ? (
                    <p className="p-6 text-center text-slate-400">Nenhuma notificação recente.</p>
                  ) : (
                    state.notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.read ? 'bg-purple-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-bold ${!n.read ? 'text-purple-900' : 'text-slate-800'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Persona Quick Switcher when role is Student */}
          {currentUser.role === 'STUDENT' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 px-2">Aluno:</span>
              <button
                onClick={() => switchUserById('user_student_1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentUser.id === 'user_student_1'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ahmed (STU00184)
              </button>
              <button
                onClick={() => switchUserById('user_student_3')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentUser.id === 'user_student_3'
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title="Aluno com pendência financeira para testar bloqueio automático de prova"
              >
                Youssef (STU00045 - Pendente)
              </button>
            </div>
          )}

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (confirm('Restaurar dados originais de demonstração da Think Green Platform?')) {
                resetToDefaultData();
              }
            }}
            title="Restaurar dados originais"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStudent={onNavigateToStudent}
        onSelectReceipt={handleSelectReceiptId}
      />

      {/* Official Receipt Viewer Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </>
  );
};
