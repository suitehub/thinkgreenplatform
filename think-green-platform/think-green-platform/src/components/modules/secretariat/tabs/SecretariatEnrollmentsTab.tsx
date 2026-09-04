import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Eye,
  TrendingUp,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { Badge } from '../../../common/Badge';
import { Modal } from '../../../common/Modal';
import { formatCurrency } from '../../../../lib/storage';
import { Enrollment, Course, Student } from '../../../../types';
import { StudentDossierModal } from '../StudentDossierModal';

export const SecretariatEnrollmentsTab: React.FC = () => {
  const {
    state,
    updateEnrollmentStatus,
    addEnrollmentToStudent,
    updateCourseFee,
    updateCourse,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Inspect student dossier
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  // Modal for new enrollment to existing student
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(state.students[0]?.studentId || '');
  const [selectedCourseId, setSelectedCourseId] = useState(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [installmentsCount, setInstallmentsCount] = useState(4);
  const [selectedEnrollmentForDetail, setSelectedEnrollmentForDetail] = useState<Enrollment | null>(null);

  // Course Fee Editing Modal
  const [editingCourseForFee, setEditingCourseForFee] = useState<Course | null>(null);
  const [newFeeValue, setNewFeeValue] = useState<number>(0);
  const [applyToPendingCharges, setApplyToPendingCharges] = useState<boolean>(true);
  const [feeChangeReason, setFeeChangeReason] = useState<string>('Reajuste semestral / atualização de tabela');
  const [showFeeSuccessAlert, setShowFeeSuccessAlert] = useState<string | null>(null);

  // Course Price Table View Modal
  const [isPriceTableModalOpen, setIsPriceTableModalOpen] = useState(false);

  const filteredEnrollments = state.enrollments.filter((enr) => {
    const matchesSearch =
      enr.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = filterCourse === 'ALL' || enr.courseId === filterCourse;
    const matchesStatus = filterStatus === 'ALL' || enr.status === filterStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleOpenEditFee = (course: Course) => {
    setEditingCourseForFee(course);
    setNewFeeValue(course.monthlyFee);
    setApplyToPendingCharges(true);
    setFeeChangeReason('Reajuste semestral da Secretaria');
  };

  const handleSaveCourseFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseForFee || newFeeValue <= 0) return;

    updateCourseFee(editingCourseForFee.id, newFeeValue, applyToPendingCharges);
    setShowFeeSuccessAlert(`Mensalidade do curso "${editingCourseForFee.name}" atualizada para ${formatCurrency(newFeeValue, 'EGP')} com sucesso!`);
    setEditingCourseForFee(null);

    setTimeout(() => {
      setShowFeeSuccessAlert(null);
    }, 4000);
  };

  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !selectedClassId) return;

    addEnrollmentToStudent(selectedStudentId, selectedCourseId, selectedClassId, installmentsCount);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert Banner */}
      {showFeeSuccessAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-semibold animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{showFeeSuccessAlert}</span>
          </div>
          <button
            onClick={() => setShowFeeSuccessAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Stats & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Secretaria • Matrículas, Cursos & Mensalidades
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Gestão de Matrículas & Tabela de Mensalidades
          </h2>
          <p className="text-xs text-slate-500">
            Controle de vínculos acadêmicos, alteração de valores de mensalidades e planos financeiros por curso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPriceTableModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-700" /> Tabela de Mensalidades
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Matrícula em Curso
          </button>
        </div>
      </div>

      {/* Courses Overview Cards with Quick "Alterar Mensalidade" Action */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Cursos Ofertados & Valores Vigentes ({state.courses.length})
          </h3>
          <span className="text-[11px] text-slate-400">Clique em "Alterar Valor" para reajustar a mensalidade</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.courses.map((course) => {
            const courseEnrollments = state.enrollments.filter((e) => e.courseId === course.id);
            const activeEnrollments = courseEnrollments.filter((e) => e.status === 'ATIVA');
            const classesCount = state.classes.filter((c) => c.courseId === course.id).length;

            return (
              <div
                key={course.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {course.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{course.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Matrículas Ativas</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {activeEnrollments.length}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ {courseEnrollments.length} tot.</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Mensalidade</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {formatCurrency(course.monthlyFee, 'EGP')}
                      </span>
                    </div>
                  </div>

                  {/* Alterar Mensalidade Button */}
                  <button
                    onClick={() => handleOpenEditFee(course)}
                    className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3" /> Alterar Valor da Mensalidade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrollments Table Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Livro de Matrículas Ativas ({filteredEnrollments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Vínculos ativos de estudantes por turma, curso e plano de pagamento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aluno, ID ou turma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl w-48 sm:w-56"
              />
            </div>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">Todos os Cursos</option>
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatCurrency(c.monthlyFee, 'EGP')}/mês)
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ATIVA">Ativa</option>
              <option value="BLOQUEADA">Bloqueada</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Aluno</th>
                <th className="px-4 py-3">Estudante</th>
                <th className="px-4 py-3">Curso & Código</th>
                <th className="px-4 py-3">Turma Alocada</th>
                <th className="px-4 py-3">Data Matrícula</th>
                <th className="px-4 py-3">Plano Financeiro</th>
                <th className="px-4 py-3">Status Matrícula</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma matrícula encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const student = state.students.find((s) => s.studentId === enr.studentId);
                  const course = state.courses.find((c) => c.id === enr.courseId);

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {enr.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{enr.studentName}</p>
                        <p className="text-[11px] text-slate-400">{student?.phone || 'Sem telefone'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">{enr.courseName}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {enr.className}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {enr.enrollmentDate}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 font-mono">
                          {formatCurrency(enr.paymentPlan.installmentAmount, 'EGP')}
                          <span className="text-[10px] text-slate-400 font-normal"> /mês</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {enr.paymentPlan.installmentsCount} parcelas ({formatCurrency(enr.paymentPlan.totalAmount, 'EGP')} total)
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={enr.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEnrollmentForDetail(enr)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Ver detalhes da matrícula e parcelas"
                          >
                            Detalhes
                          </button>

                          {course && (
                            <button
                              onClick={() => handleOpenEditFee(course)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 cursor-pointer"
                              title={`Alterar valor da mensalidade de ${course.name}`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {enr.status === 'ATIVA' ? (
                            <button
                              onClick={() => updateEnrollmentStatus(enr.id, 'BLOQUEADA')}
                              className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title="Bloquear matrícula por inadimplência ou decisão da secretaria"
                            >
                              Bloquear
                            </button>
                          ) : (
                            <button
                              onClick={() => updateEnrollmentStatus(enr.id, 'ATIVA')}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Desbloquear matrícula"
                            >
                              Desbloquear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alterar Valor da Mensalidade do Curso */}
      {editingCourseForFee && (
        <Modal
          isOpen={!!editingCourseForFee}
          onClose={() => setEditingCourseForFee(null)}
          title={`Alterar Mensalidade • ${editingCourseForFee.name}`}
          subtitle={`Código: ${editingCourseForFee.code} • Categoria: ${editingCourseForFee.category}`}
        >
          <form onSubmit={handleSaveCourseFee} className="space-y-4 text-xs">
            {/* Current vs New comparison */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Valor Atual da Mensalidade</span>
                <p className="text-xl font-bold font-mono text-slate-600 mt-1">
                  {formatCurrency(editingCourseForFee.monthlyFee, 'EGP')}
                </p>
                <span className="text-[10px] text-slate-400">Por aluno / mês</span>
              </div>

              <div>
                <span className="text-[11px] text-emerald-700 block font-semibold">Novo Valor Proposto</span>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {formatCurrency(newFeeValue || 0, 'EGP')}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {newFeeValue > editingCourseForFee.monthlyFee ? (
                    `+${formatCurrency(newFeeValue - editingCourseForFee.monthlyFee, 'EGP')} de reajuste`
                  ) : newFeeValue < editingCourseForFee.monthlyFee ? (
                    `-${formatCurrency(editingCourseForFee.monthlyFee - newFeeValue, 'EGP')} de redução`
                  ) : (
                    'Sem alteração'
                  )}
                </span>
              </div>
            </div>

            {/* Input New Value */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Novo Valor da Mensalidade (EGP) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={50000}
                  step={5}
                  required
                  value={newFeeValue}
                  onChange={(e) => setNewFeeValue(Number(e.target.value))}
                  className="w-full pl-3 pr-16 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-base text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                  EGP/mês
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Exemplos: 400 EGP (básico), 450 EGP (intermediário), 600 EGP (especializado).
              </p>
            </div>

            {/* Total Semester Simulation */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Simulação de Planos com o Novo Valor:
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">4 Parcelas (Semestre):</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency((newFeeValue || 0) * 4, 'EGP')}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">6 Parcelas:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency((newFeeValue || 0) * 6, 'EGP')}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">1 Parcela (À Vista):</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency(newFeeValue || 0, 'EGP')}</span>
                </div>
              </div>
            </div>

            {/* Retroactive / Future Charges Checkbox */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToPendingCharges}
                  onChange={(e) => setApplyToPendingCharges(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Reajustar também cobranças futuras pendentes de alunos já matriculados
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    Se marcado, todas as parcelas ainda não pagas (status REGULAR/PENDENTE) dos alunos matriculados neste curso serão atualizadas para o novo valor. Parcelas já quitadas não serão afetadas.
                  </span>
                </div>
              </label>
            </div>

            {/* Justification / Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Motivo / Justificativa da Alteração
              </label>
              <input
                type="text"
                value={feeChangeReason}
                onChange={(e) => setFeeChangeReason(e.target.value)}
                placeholder="Ex: Reajuste do período letivo 2026/1 aprovado pela diretoria"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCourseForFee(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar Novo Valor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Tabela Completa de Preços & Mensalidades */}
      {isPriceTableModalOpen && (
        <Modal
          isOpen={isPriceTableModalOpen}
          onClose={() => setIsPriceTableModalOpen(false)}
          size="lg"
          title="Tabela de Mensalidades & Preços dos Cursos"
          subtitle="Visualize e altere os valores praticados para todos os cursos do Think Green Community Center"
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Curso</th>
                    <th className="px-4 py-3">Carga Horária</th>
                    <th className="px-4 py-3">Alunos Ativos</th>
                    <th className="px-4 py-3">Mensalidade Vigente</th>
                    <th className="px-4 py-3">Plano Semestral (4x)</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.courses.map((c) => {
                    const activeStudents = state.enrollments.filter(
                      (e) => e.courseId === c.id && e.status === 'ATIVA'
                    ).length;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                          {c.code}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.category}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {c.totalHours} horas
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {activeStudents} alunos
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(c.monthlyFee, 'EGP')}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {formatCurrency(c.monthlyFee * 4, 'EGP')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setIsPriceTableModalOpen(false);
                              handleOpenEditFee(c);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Edit2 className="w-3 h-3" /> Alterar Valor
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPriceTableModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Detalhes da Matrícula */}
      {selectedEnrollmentForDetail && (
        <Modal
          isOpen={!!selectedEnrollmentForDetail}
          onClose={() => setSelectedEnrollmentForDetail(null)}
          title={`Matrícula de ${selectedEnrollmentForDetail.studentName}`}
          subtitle={`ID: ${selectedEnrollmentForDetail.studentId} • Curso: ${selectedEnrollmentForDetail.courseName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Turma Vinculada</span>
                <p className="font-bold text-slate-800">{selectedEnrollmentForDetail.className}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Data de Matrícula</span>
                <p className="font-bold text-slate-800 font-mono">{selectedEnrollmentForDetail.enrollmentDate}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Valor da Parcela / Mensalidade</span>
                <p className="font-bold text-emerald-700 font-mono">
                  {formatCurrency(selectedEnrollmentForDetail.paymentPlan.installmentAmount, 'EGP')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plano Total ({selectedEnrollmentForDetail.paymentPlan.installmentsCount}x)</span>
                <p className="font-bold text-slate-900 font-mono">
                  {formatCurrency(selectedEnrollmentForDetail.paymentPlan.totalAmount, 'EGP')}
                </p>
              </div>
            </div>

            {/* Carnê Financeiro */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Carnê de Mensalidades Gerado</h4>
              <div className="space-y-2">
                {state.charges
                  .filter((c) => c.enrollmentId === selectedEnrollmentForDetail.id)
                  .map((chg) => (
                    <div
                      key={chg.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Parcela {chg.installmentNumber}/{chg.totalInstallments}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">Vencimento: {chg.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          {formatCurrency(chg.amount, 'EGP')}
                        </span>
                        <Badge status={chg.status} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEnrollmentForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nova Matrícula */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Nova Matrícula em Curso"
          subtitle="Vincule um estudante já cadastrado a um novo curso ou turma"
        >
          <form onSubmit={handleCreateEnrollment} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione o Aluno *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                required
              >
                {state.students.map((stu) => (
                  <option key={stu.studentId} value={stu.studentId}>
                    {stu.studentId} — {stu.name} ({stu.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione o Curso *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const matchingClass = state.classes.find((c) => c.courseId === e.target.value);
                  if (matchingClass) setSelectedClassId(matchingClass.id);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                required
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {formatCurrency(c.monthlyFee, 'EGP')}/mês
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione a Turma & Horário *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                required
              >
                {state.classes
                  .filter((c) => c.courseId === selectedCourseId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.schedule} ({c.room})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Número de Parcelas</label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              >
                <option value={1}>1 Parcela (À Vista)</option>
                <option value={2}>2 Parcelas Semestrais</option>
                <option value={4}>4 Parcelas Mensais (Padrão)</option>
                <option value={6}>6 Parcelas Mensais</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirmar Matrícula
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Dossier Modal */}
      {inspectStudent && (
        <StudentDossierModal
          student={inspectStudent}
          isOpen={!!inspectStudent}
          onClose={() => setInspectStudent(null)}
        />
      )}
    </div>
  );
};
