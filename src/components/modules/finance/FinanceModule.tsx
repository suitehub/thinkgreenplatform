import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { FinanceTopbar } from './FinanceTopbar';
import { FinanceSidebar } from './FinanceSidebar';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceChargesTab } from './FinanceChargesTab';
import { FinanceCashRegisterTab } from './FinanceCashRegisterTab';
import { FinanceReceiptsTab } from './FinanceReceiptsTab';
import { FinanceOverdueTab } from './FinanceOverdueTab';
import { FinanceReportsTab } from './FinanceReportsTab';
import { NewChargeModal } from './NewChargeModal';
import { QuickPaymentModal } from '../../common/QuickPaymentModal';
import { ReceiptModal } from '../../common/ReceiptModal';
import { Charge, PaymentReceipt } from '../../../types';

interface FinanceModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  standalone?: boolean;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  currentTab,
  setCurrentTab,
  standalone = true,
}) => {
  const { state } = useApp();

  const [activePaymentCharge, setActivePaymentCharge] = useState<Charge | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isNewChargeModalOpen, setIsNewChargeModalOpen] = useState(false);

  // Normalize active tab
  const activeTab = currentTab || 'fin_overview';

  // Quick Payment Trigger
  const handleOpenQuickPayment = (charge?: Charge) => {
    if (charge) {
      setActivePaymentCharge(charge);
    } else {
      // Find the first pending or overdue charge
      const firstUnpaid = state.charges.find(
        (c) => c.status === 'PENDENTE' || c.status === 'EM ATRASO'
      );
      if (firstUnpaid) {
        setActivePaymentCharge(firstUnpaid);
      } else if (state.charges.length > 0) {
        setActivePaymentCharge(state.charges[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#075e38] selection:text-white">
      {/* 1. TOP HEADER (Exact Think Green Platform Header) */}
      <FinanceTopbar />

      {/* 2. MAIN BODY (Sidebar + Content Workspace) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-7 flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Left Sidebar Menu */}
        <FinanceSidebar
          currentTab={activeTab}
          setCurrentTab={setCurrentTab}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: PAINEL GERAL (OVERVIEW DASHBOARD) */}
          {(activeTab === 'fin_overview' ||
            activeTab === 'fin_home' ||
            activeTab === 'finance' ||
            !activeTab) && (
            <FinanceOverviewTab
              onNavigateTab={(t) => setCurrentTab(t)}
              onOpenNewChargeModal={() => setIsNewChargeModalOpen(true)}
              onOpenQuickPaymentModal={handleOpenQuickPayment}
              onViewReceipt={(rec) => setSelectedReceipt(rec)}
            />
          )}

          {/* TAB 2: MENSALIDADES & COBRANÇAS */}
          {activeTab === 'fin_charges' && (
            <FinanceChargesTab
              onOpenQuickPaymentModal={(chg) => setActivePaymentCharge(chg)}
              onViewReceipt={(rec) => setSelectedReceipt(rec)}
              onOpenNewChargeModal={() => setIsNewChargeModalOpen(true)}
            />
          )}

          {/* TAB 3: CONTROLE DE CAIXA */}
          {activeTab === 'fin_cash_register' && <FinanceCashRegisterTab />}

          {/* TAB 4: RECIBOS EMITIDOS */}
          {activeTab === 'fin_receipts' && (
            <FinanceReceiptsTab onViewReceipt={(rec) => setSelectedReceipt(rec)} />
          )}

          {/* TAB 5: INADIMPLÊNCIA & STATUS */}
          {activeTab === 'fin_inadimplencia' && (
            <FinanceOverdueTab
              onOpenQuickPaymentModal={(chg) => setActivePaymentCharge(chg)}
            />
          )}

          {/* TAB 6: RELATÓRIOS FINANCEIROS */}
          {activeTab === 'fin_reports' && <FinanceReportsTab />}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {/* Quick Payment Modal */}
      <QuickPaymentModal
        charge={activePaymentCharge}
        isOpen={!!activePaymentCharge}
        onClose={() => setActivePaymentCharge(null)}
        onSuccess={(rec) => setSelectedReceipt(rec)}
      />

      {/* View / Print Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* New Charge / Carnê Modal */}
      <NewChargeModal
        isOpen={isNewChargeModalOpen}
        onClose={() => setIsNewChargeModalOpen(false)}
      />
    </div>
  );
};
