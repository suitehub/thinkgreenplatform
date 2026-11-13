import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  User,
  BookOpen,
  Receipt,
  ArrowRight,
  Download,
  Smartphone,
  Share,
} from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { Badge } from './Badge';
import { usePwaInstall } from '../../lib/pwa';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
  onSelectReceipt?: (receiptId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectReceipt,
}) => {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const { canInstall, isStandalone, isIos, install } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setShowIosHelp(false);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { students: [], classes: [], receipts: [], lessons: [] };

    const students = state.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
    );

    const classes = state.classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q)
    );

    const receipts = state.receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q)
    );

    const lessons = state.lessons.filter(
      (l) => l.title.toLowerCase().includes(q) || l.className.toLowerCase().includes(q)
    );

    return { students, classes, receipts, lessons };
  }, [query, state]);

  const totalResults =
    searchResults.students.length +
    searchResults.classes.length +
    searchResults.receipts.length +
    searchResults.lessons.length;

  const installQuery = /(app|aplicativo|instalar|baixar|pwa|download)/i.test(query);
  const showInstallOption = !isStandalone && canInstall && (!query.trim() || installQuery);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    const result = await install();
    if (result === 'unavailable') setShowIosHelp(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID Student (STU00000), nome, turma, recibo ou aula..."
            autoFocus
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Install App (PWA) */}
        {showInstallOption && (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#075e38] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Baixar o aplicativo Think Green</p>
                  <p className="text-[11px] text-emerald-800">
                    Instale no celular ou computador e abra direto pela tela inicial, como um app.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstall}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#075e38] hover:bg-[#064a2c] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar app
              </button>
            </div>

            {showIosHelp && (
              <div className="mt-3 pt-3 border-t border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" /> No iPhone/iPad (Safari):
                </p>
                <p>1. Toque em <strong>Compartilhar</strong> (ícone de quadrado com seta).</p>
                <p>2. Escolha <strong>Adicionar à Tela de Início</strong>.</p>
                <p>3. Confirme em <strong>Adicionar</strong> — o ícone do Think Green aparece na tela inicial.</p>
                <p className="pt-1 text-emerald-700">No Chrome/Edge: menu ⋮ → <strong>Instalar aplicativo</strong>.</p>
              </div>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {query.trim() && totalResults === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="font-semibold text-slate-600">Nenhum resultado encontrado</p>
              <p className="text-slate-400 text-xs">Tente buscar por "STU00186", "Inglês" ou "Futebol"</p>
            </div>
          )}

          {/* Students */}
          {searchResults.students.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                Alunos ({searchResults.students.length})
              </p>
              <div className="space-y-1.5">
                {searchResults.students.map((student) => {
                  const enrollments = state.enrollments.filter((e) => e.studentId === student.studentId);
                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        if (onSelectStudent) onSelectStudent(student.studentId);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 group-hover:text-purple-700">
                              {student.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              {student.studentId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {enrollments.map((e) => e.courseName).join(' • ') || 'Sem matrícula ativa'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Classes */}
          {searchResults.classes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Turmas ({searchResults.classes.length})
              </p>
              <div className="space-y-1.5">
                {searchResults.classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {c.teacherName} • {c.schedule} • {c.room}
                      </p>
                    </div>
                    <Badge status="ATIVA" size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipts */}
          {searchResults.receipts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                Recibos de Pagamento ({searchResults.receipts.length})
              </p>
              <div className="space-y-1.5">
                {searchResults.receipts.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (onSelectReceipt) onSelectReceipt(r.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-amber-800">
                          {r.receiptNumber}
                        </span>
                        <span className="font-mono text-emerald-700 font-bold">{r.amount} EGP</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {r.studentName} ({r.studentId}) • {r.date}
                      </p>
                    </div>
                    <span className="text-[11px] text-purple-700 font-medium group-hover:underline">
                      Ver Recibo →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick shortcuts hint */}
          {!query.trim() && (
            <div className="pt-4 border-t border-slate-100 text-center text-slate-400 text-xs">
              <p>Dica: Digite o nome do aluno ou código da turma para ver fichas, matrículas e finanças.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
