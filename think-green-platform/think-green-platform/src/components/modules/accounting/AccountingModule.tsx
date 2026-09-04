import React, { useState } from 'react';
import {
  PieChart,
  CreditCard,
  Layers,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency } from '../../../lib/storage';

interface AccountingModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({ currentTab, setCurrentTab }) => {
  const { state, createTransaction } = useApp();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState(1500);
  const [txType, setTxType] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [txCostCenter, setTxCostCenter] = useState('ADMIN');
  const [txCategory, setTxCategory] = useState('Honorários Docentes');

  // Accounting aggregates
  const totalRevenue = state.transactions
    .filter((t) => t.type === 'RECEITA')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = state.transactions
    .filter((t) => t.type === 'DESPESA')
    .reduce((acc, t) => acc + t.amount, 0);

  const netResult = totalRevenue - totalExpense;

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction({
      description: txDesc,
      amount: txAmount,
      type: txType,
      costCenter: txCostCenter as any,
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
    });
    setIsTxModalOpen(false);
    setTxDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Controladoria & Contabilidade
            </span>
            <span className="text-xs text-slate-400">Think Green Financial Core</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Demonstrativo Contábil & DRE Mensal
          </h1>
          <p className="text-xs text-slate-500">
            Acompanhamento de receitas, despesas operacionais por centro de custo e resultado líquido.
          </p>
        </div>

        <button
          onClick={() => setIsTxModalOpen(true)}
          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="w-4 h-4" /> Novo Lançamento Contábil
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Operacional Bruta"
          value={formatCurrency(totalRevenue, 'EGP')}
          subtitle="Mensalidades e matrículas"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Despesas Operacionais"
          value={formatCurrency(totalExpense, 'EGP')}
          subtitle="Salas, campos e professores"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Superávit Líquido (DRE)"
          value={formatCurrency(netResult, 'EGP')}
          subtitle="Resultado operacional líquido"
          icon={PieChart}
          color="purple"
        />
        <StatCard
          title="Centros de Custo"
          value="3 Centros"
          subtitle="Idiomas, Esportes, Admin"
          icon={Layers}
          color="sky"
        />
      </div>

      {/* DRE SUMMARY TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            Demonstrativo do Resultado do Exercício (DRE Sintético)
          </h2>
          <span className="text-xs font-semibold text-slate-500">Exercício 2025 • Cairo, Egito</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-3 bg-emerald-50/70 rounded-xl font-bold text-emerald-950">
            <span>(+) RECEITA BRUTA COM CURSOS E SERVIÇOS</span>
            <span className="font-mono text-sm">{formatCurrency(totalRevenue, 'EGP')}</span>
          </div>

          <div className="pl-4 space-y-1.5 text-slate-600">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span>• Mensalidades Cursos Livres de Idiomas</span>
              <span className="font-mono font-semibold">18.500,00 EGP</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span>• Mensalidades Esportes & Saúde (Futebol e Treinos)</span>
              <span className="font-mono font-semibold">14.000,00 EGP</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-rose-50/70 rounded-xl font-bold text-rose-950 mt-3">
            <span>(-) DESPESAS OPERACIONAIS TOTAIS</span>
            <span className="font-mono text-sm">-{formatCurrency(totalExpense, 'EGP')}</span>
          </div>

          <div className="pl-4 space-y-1.5 text-slate-600">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span>• Aluguel de Quadras e Salas no Cairo</span>
              <span className="font-mono font-semibold">-4.500,00 EGP</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span>• Honorários Docentes e Treinadores</span>
              <span className="font-mono font-semibold">-6.000,00 EGP</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span>• Material Didático e Esportivo</span>
              <span className="font-mono font-semibold">-1.200,00 EGP</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-purple-900 text-white rounded-2xl font-black text-sm mt-4 shadow-sm">
            <span>(=) RESULTADO LÍQUIDO DO CENTRO (SUPERÁVIT OPERACIONAL)</span>
            <span className="font-mono text-lg text-emerald-300">
              {formatCurrency(netResult, 'EGP')}
            </span>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS LEDGER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          Livro Razão & Extrato de Lançamentos
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Centro de Custo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Valor (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-mono">{tx.date}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{tx.description}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.costCenter}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        tx.type === 'RECEITA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      tx.type === 'RECEITA' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {tx.type === 'RECEITA' ? '+' : '-'}
                    {formatCurrency(tx.amount, 'EGP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançamento Contábil */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Novo Lançamento Contábil"
      >
        <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Pagamento de aluguel de quadra de futebol"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={txType}
                onChange={(e: any) => setTxType(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              >
                <option value="DESPESA">Despesa (-)</option>
                <option value="RECEITA">Receita (+)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Valor (EGP)</label>
              <input
                type="number"
                required
                min="1"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Centro de Custo</label>
              <select
                value={txCostCenter}
                onChange={(e) => setTxCostCenter(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="LANGUAGES">Idiomas & Cursos Livres</option>
                <option value="SPORTS">Esportes & Saúde</option>
                <option value="ADMIN">Administrativo & Infraestrutura</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoria</label>
              <input
                type="text"
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsTxModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold"
            >
              Registrar Lançamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
