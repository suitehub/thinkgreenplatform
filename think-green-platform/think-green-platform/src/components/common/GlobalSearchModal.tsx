import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, BookOpen, Receipt, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { Badge } from './Badge';

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

  useEffect(() => {
    if (isOpen) {
      setQuery('');
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

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {query.trim() && totalResults === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="font-semibold text-slate-600">Nenhum resultado encontrado</p>
              <p className="text-slate-400 text-xs">Tente buscar por "STU00184", "Ahmed", "Inglês" ou "Futebol"</p>
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
