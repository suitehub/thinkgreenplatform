import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  BookOpen,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Plus,
  FileText,
  Upload,
  Edit,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { Student, Course, ClassRoom, Enrollment } from '../../../types';
import { formatCurrency } from '../../../lib/storage';
import { SecretariatEnrollmentsTab } from './tabs/SecretariatEnrollmentsTab';
import { SecretariatClassesTab } from './tabs/SecretariatClassesTab';
import { SecretariatDocumentsTab } from './tabs/SecretariatDocumentsTab';
import { SecretariatImportTab } from './tabs/SecretariatImportTab';
import { StudentDossierModal } from './StudentDossierModal';

interface SecretariatModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedStudentIdForDetail?: string | null;
}

export const SecretariatModule: React.FC<SecretariatModuleProps> = ({
  currentTab,
  setCurrentTab,
  selectedStudentIdForDetail,
}) => {
  const {
    state,
    createStudentWithEnrollment,
    addEnrollmentToStudent,
    updateStudent,
    updateEnrollmentStatus,
  } = useApp();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selected student for complete administrative dossier
  const [inspectStudent, setInspectStudent] = useState<Student | null>(() => {
    if (selectedStudentIdForDetail) {
      return state.students.find((s) => s.studentId === selectedStudentIdForDetail) || null;
    }
    return null;
  });

  // Sync inspectStudent if state.students changes or selectedStudentIdForDetail is passed
  useEffect(() => {
    if (selectedStudentIdForDetail) {
      const found = state.students.find((s) => s.studentId === selectedStudentIdForDetail);
      if (found) setInspectStudent(found);
    }
  }, [selectedStudentIdForDetail, state.students]);

  // Keep inspected student in sync with latest state
  const currentInspectedStudent = inspectStudent
    ? state.students.find((s) => s.studentId === inspectStudent.studentId) || inspectStudent
    : null;

  // 5-Step "Novo Aluno" Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    phone: '+20 10 ',
    nationalId: '',
    birthDate: '',
    city: 'Cairo',
    address: '',
    guardianName: '',
    guardianPhone: '',
    notes: '',
    courseId: state.courses[0]?.id || 'course_eng',
    classId: state.classes[0]?.id || 'class_eng_a',
    installmentsCount: 4,
  });

  const [createdStudentResult, setCreatedStudentResult] = useState<{
    student: Student;
    enrollment: Enrollment;
  } | null>(null);

  // Add Extra Course Modal state
  const [extraEnrollmentModalStudent, setExtraEnrollmentModalStudent] = useState<Student | null>(null);
  const [extraCourseId, setExtraCourseId] = useState(state.courses[1]?.id || state.courses[0]?.id);
  const [extraClassId, setExtraClassId] = useState(state.classes[1]?.id || state.classes[0]?.id);

  // Filtered Students List
  const filteredStudents = state.students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);

    const studentEnrollments = state.enrollments.filter((e) => e.studentId === s.studentId);

    const matchesCourse =
      filterCourse === 'ALL' || studentEnrollments.some((e) => e.courseId === filterCourse);

    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createStudentWithEnrollment(
      {
        name: newStudentForm.name,
        email: newStudentForm.email,
        phone: newStudentForm.phone,
        nationalId: newStudentForm.nationalId,
        birthDate: newStudentForm.birthDate,
        city: newStudentForm.city,
        address: newStudentForm.address,
        guardianName: newStudentForm.guardianName,
        guardianPhone: newStudentForm.guardianPhone,
        notes: newStudentForm.notes,
      },
      newStudentForm.courseId,
      newStudentForm.classId,
      newStudentForm.installmentsCount
    );

    setCreatedStudentResult(result);
    setWizardStep(5); // Success step
  };

  const handleAddExtraEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraEnrollmentModalStudent) return;
    addEnrollmentToStudent(extraEnrollmentModalStudent.studentId, extraCourseId, extraClassId, 4);
    setExtraEnrollmentModalStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Módulo Secretaria
            </span>
            <span className="text-xs text-slate-400">Vida Escolar & Cadastros Integrados</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Secretaria & Atendimento ao Aluno
          </h1>
          <p className="text-xs text-slate-500">
            Gerenciamento único de alunos, matrículas múltiplas, turmas e geração do ID Student (STU00000).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setWizardStep(1);
              setCreatedStudentResult(null);
              setCurrentTab('sec_new_student');
            }}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Novo Aluno (Fluxo Integrado)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Alunos"
          value={state.students.length}
          subtitle="Cadastros unificados"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Matrículas Ativas"
          value={state.enrollments.filter((e) => e.status === 'ATIVA').length}
          subtitle="Distribuição em 4 cursos"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Turmas em Andamento"
          value={state.classes.length}
          subtitle="Capacidade monitorada"
          icon={BookOpen}
          color="sky"
        />
        <StatCard
          title="Documentos em Arquivo"
          value={state.students.reduce((acc, s) => acc + s.documents.length, 0)}
          subtitle="Certidões e contratos"
          icon={FileText}
          color="amber"
        />
      </div>

      {/* TAB 1: NOVO ALUNO - WIZARD COMPLETO */}
      {currentTab === 'sec_new_student' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-700" />
              Cadastro de Novo Aluno & Matrícula Automática
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              O fluxo cria simultaneamente o cadastro geral, gera o ID Student único, provisiona a conta e gera as parcelas financeiras.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-bold text-slate-400">
            <div className={`flex items-center gap-1.5 ${wizardStep >= 1 ? 'text-purple-700' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 1 ? 'bg-purple-700 text-white' : 'bg-slate-100'}`}>
                1
              </span>
              <span>Dados Pessoais</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 ${wizardStep >= 2 ? 'text-purple-700' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 2 ? 'bg-purple-700 text-white' : 'bg-slate-100'}`}>
                2
              </span>
              <span>Curso & Turma</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 ${wizardStep >= 3 ? 'text-purple-700' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 3 ? 'bg-purple-700 text-white' : 'bg-slate-100'}`}>
                3
              </span>
              <span>Plano Financeiro</span>
            </div>
          </div>

          {/* Wizard Forms */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tarek Mahmoud Ibrahim"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+20 10 1234 5678"
                    value={newStudentForm.phone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email de Contato</label>
                  <input
                    type="email"
                    placeholder="aluno@email.com"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade / Distrito</label>
                  <input
                    type="text"
                    value={newStudentForm.city}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, city: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Responsável (se menor)</label>
                  <input
                    type="text"
                    placeholder="Ex: Mahmoud Ibrahim"
                    value={newStudentForm.guardianName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone do Responsável</label>
                  <input
                    type="text"
                    placeholder="+20 10 9988 7766"
                    value={newStudentForm.guardianPhone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianPhone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!newStudentForm.name.trim()}
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1"
                >
                  Próximo: Escolher Curso <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Selecione o Curso / Frente</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => {
                        const matchingClass = state.classes.find((c) => c.courseId === course.id);
                        setNewStudentForm({
                          ...newStudentForm,
                          courseId: course.id,
                          classId: matchingClass ? matchingClass.id : newStudentForm.classId,
                        });
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        newStudentForm.courseId === course.id
                          ? 'border-purple-600 bg-purple-50/80 font-bold ring-1 ring-purple-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{course.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{course.description}</p>
                      <p className="text-xs font-mono font-bold text-emerald-700 mt-2">
                        {formatCurrency(course.monthlyFee, 'EGP')} / mês
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Selecione a Turma & Horário</label>
                <select
                  value={newStudentForm.classId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, classId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-xs"
                >
                  {state.classes
                    .filter((c) => c.courseId === newStudentForm.courseId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} • {c.schedule} ({c.room})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1"
                >
                  Próximo: Plano Financeiro <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <form onSubmit={handleFinishWizard} className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800 text-sm">Resumo da Nova Matrícula:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <p>Aluno: <strong className="text-slate-900">{newStudentForm.name}</strong></p>
                  <p>
                    Curso: <strong className="text-slate-900">{state.courses.find((c) => c.id === newStudentForm.courseId)?.name}</strong>
                  </p>
                  <p>
                    Turma: <strong className="text-slate-900">{state.classes.find((c) => c.id === newStudentForm.classId)?.name}</strong>
                  </p>
                  <p>
                    Mensalidade Base:{' '}
                    <strong className="text-emerald-700 font-mono">
                      {formatCurrency(state.courses.find((c) => c.id === newStudentForm.courseId)?.monthlyFee || 0, 'EGP')} / mês
                    </strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número de Parcelas do Plano Financeiro
                </label>
                <select
                  value={newStudentForm.installmentsCount}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, installmentsCount: Number(e.target.value) })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                >
                  <option value={1}>1 Parcela (Quitação Integral à Vista)</option>
                  <option value={2}>2 Parcelas Semestrais</option>
                  <option value={4}>4 Parcelas Mensais (Padrão)</option>
                  <option value={6}>6 Parcelas Mensais</option>
                </select>
                <div className="mt-2 p-2.5 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-purple-800 font-medium">Total Calculado do Plano:</span>
                  <span className="font-mono font-bold text-purple-900 text-sm">
                    {formatCurrency(
                      (state.courses.find((c) => c.id === newStudentForm.courseId)?.monthlyFee || 0) * newStudentForm.installmentsCount,
                      'EGP'
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-[11px] leading-relaxed">
                <strong>Automação Imediata:</strong> Ao confirmar, o sistema gerará o ID Student permanente (STU00000), criará as parcelas no Financeiro, o acesso no AVA e o diário de presença do professor.
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Gerar STU ID & Concluir Matrícula
                </button>
              </div>
            </form>
          )}

          {wizardStep === 5 && createdStudentResult && (
            <div className="p-8 text-center max-w-lg mx-auto bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Matrícula Concluída com Sucesso!
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {createdStudentResult.student.name}
                </h3>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-xs space-y-2">
                <p className="text-slate-500 font-medium">ID Student Gerado Automaticamente:</p>
                <p className="font-mono text-2xl font-black text-purple-700">
                  {createdStudentResult.student.studentId}
                </p>
                <p className="text-[11px] text-slate-500">
                  {createdStudentResult.enrollment.courseName} • {createdStudentResult.enrollment.className}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentTab('sec_students')}
                  className="px-5 py-2 bg-purple-700 text-white rounded-xl font-bold text-xs hover:bg-purple-800"
                >
                  Ir para Lista de Alunos
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALUNOS & CADASTROS (MASTER TABLE) */}
      {(currentTab === 'sec_home' || currentTab === 'sec_students' || !currentTab) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                Cadastro Central de Alunos ({filteredStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Identificador permanente STU00000 — 1 Aluno para Múltiplas Matrículas
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar STU ID ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
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
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID Student</th>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Cursos Matriculados</th>
                  <th className="px-4 py-3">Turmas</th>
                  <th className="px-4 py-3">Status Cadastral</th>
                  <th className="px-4 py-3">Financeiro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => {
                  const enrollments = state.enrollments.filter((e) => e.studentId === stu.studentId);
                  const charges = state.charges.filter((c) => c.studentId === stu.studentId);
                  const hasOverdue = charges.some((c) => c.status === 'EM ATRASO');
                  const hasPending = charges.some((c) => c.status === 'PENDENTE');

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {stu.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={stu.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={stu.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{stu.name}</p>
                            <p className="text-[11px] text-slate-400">{stu.phone || stu.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {enrollments.map((e) => (
                            <span
                              key={e.id}
                              className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded"
                            >
                              {e.courseName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {enrollments.map((e) => e.className).join(', ') || 'Sem turma'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={stu.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {hasOverdue ? (
                          <Badge status="EM ATRASO" />
                        ) : hasPending ? (
                          <Badge status="PENDENTE" />
                        ) : (
                          <Badge status="REGULAR" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectStudent(stu)}
                            className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Ver Ficha Completa do Aluno"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ficha
                          </button>
                          <button
                            onClick={() => setExtraEnrollmentModalStudent(stu)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Adicionar Novo Curso a este Aluno"
                          >
                            <Plus className="w-3.5 h-3.5" /> +Curso
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MATRÍCULAS & CURSOS */}
      {currentTab === 'sec_enrollments' && <SecretariatEnrollmentsTab />}

      {/* TAB 4: TURMAS & HORÁRIOS */}
      {currentTab === 'sec_classes' && <SecretariatClassesTab />}

      {/* TAB 5: DOCUMENTOS DOS ALUNOS */}
      {currentTab === 'sec_documents' && <SecretariatDocumentsTab />}

      {/* TAB 6: IMPORTAR PLANILHAS */}
      {currentTab === 'sec_import' && <SecretariatImportTab />}

      {/* Ficha Completa 360° do Aluno (Do Pessoal ao Plural) */}
      {currentInspectedStudent && (
        <StudentDossierModal
          student={currentInspectedStudent}
          isOpen={!!currentInspectedStudent}
          onClose={() => setInspectStudent(null)}
          onOpenExtraEnrollment={(stu) => {
            setInspectStudent(null);
            setExtraEnrollmentModalStudent(stu);
          }}
        />
      )}

      {/* Modal Adicionar Novo Curso a Aluno Existente */}
      {extraEnrollmentModalStudent && (
        <Modal
          isOpen={!!extraEnrollmentModalStudent}
          onClose={() => setExtraEnrollmentModalStudent(null)}
          title={`Adicionar Novo Curso para ${extraEnrollmentModalStudent.name}`}
          subtitle={`Mantendo o mesmo ID Student: ${extraEnrollmentModalStudent.studentId}`}
        >
          <form onSubmit={handleAddExtraEnrollment} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione o Novo Curso</label>
              <select
                value={extraCourseId}
                onChange={(e) => {
                  setExtraCourseId(e.target.value);
                  const matchingClass = state.classes.find((c) => c.courseId === e.target.value);
                  if (matchingClass) setExtraClassId(matchingClass.id);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(c.monthlyFee, 'EGP')}/mês)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione a Turma</label>
              <select
                value={extraClassId}
                onChange={(e) => setExtraClassId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
              >
                {state.classes
                  .filter((c) => c.courseId === extraCourseId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.schedule}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setExtraEnrollmentModalStudent(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              >
                Confirmar Matrícula
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
