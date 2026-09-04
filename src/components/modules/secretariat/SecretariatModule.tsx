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
  Calendar,
  GraduationCap,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { Student, Course, ClassRoom, Enrollment } from '../../../types';
import { formatCurrency } from '../../../lib/storage';
import { SecretariatSidebar } from './SecretariatSidebar';
import { SecretariatTopbar } from './SecretariatTopbar';
import { SecretariatHomeTab } from './tabs/SecretariatHomeTab';
import { SecretariatEnrollmentsTab } from './tabs/SecretariatEnrollmentsTab';
import { SecretariatClassesTab } from './tabs/SecretariatClassesTab';
import { SecretariatDocumentsTab } from './tabs/SecretariatDocumentsTab';
import { SecretariatImportTab } from './tabs/SecretariatImportTab';
import { StudentDossierModal } from './StudentDossierModal';
import { SecretariatSupportModal } from './SecretariatSupportModal';

interface SecretariatModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedStudentIdForDetail?: string | null;
  standalone?: boolean;
}

export const SecretariatModule: React.FC<SecretariatModuleProps> = ({
  currentTab,
  setCurrentTab,
  selectedStudentIdForDetail,
  standalone = true,
}) => {
  const {
    state,
    currentUser,
    logout,
    createStudentWithEnrollment,
    addEnrollmentToStudent,
    updateStudent,
    updateEnrollmentStatus,
  } = useApp();

  // Search and filters for Students Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Support and Mobile Sidebar state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // 3-Step "Novo Aluno" Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    birthDate: '',
    gender: 'MASCULINO',
    rg: '',
    nationalId: '',
    email: '',
    phone: '+20 10 ',
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
      s.phone.includes(searchQuery) ||
      (s.rg && s.rg.includes(searchQuery));

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
        birthDate: newStudentForm.birthDate,
        gender: newStudentForm.gender,
        rg: newStudentForm.rg,
        nationalId: newStudentForm.rg || newStudentForm.nationalId,
        email: newStudentForm.email,
        phone: newStudentForm.phone,
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

  // Content body component rendered inside the module workspace
  const renderTabContent = () => {
    switch (currentTab) {
      case 'sec_home':
      case '':
        return (
          <SecretariatHomeTab
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenNewStudent={() => {
              setWizardStep(1);
              setCreatedStudentResult(null);
              setCurrentTab('sec_new_student');
            }}
          />
        );

      case 'sec_new_student':
        return (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#075e38]" />
                  Cadastro de Novo Aluno & Matrícula Automática
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Geração instantânea do STU ID, criação do plano de parcelas e vínculo na turma.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('sec_students')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Voltar à Lista de Alunos
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-bold text-slate-400">
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 1 ? 'text-[#075e38]' : ''
                }`}
                onClick={() => wizardStep < 5 && setWizardStep(1)}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    wizardStep >= 1 ? 'bg-[#075e38] text-white' : 'bg-slate-100'
                  }`}
                >
                  1
                </span>
                <span>Dados Pessoais</span>
              </div>
              <div className="w-12 h-0.5 bg-slate-200" />
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 2 ? 'text-[#075e38]' : ''
                }`}
                onClick={() => newStudentForm.name && wizardStep < 5 && setWizardStep(2)}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    wizardStep >= 2 ? 'bg-[#075e38] text-white' : 'bg-slate-100'
                  }`}
                >
                  2
                </span>
                <span>Curso & Turma</span>
              </div>
              <div className="w-12 h-0.5 bg-slate-200" />
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 3 ? 'text-[#075e38]' : ''
                }`}
                onClick={() => newStudentForm.name && wizardStep < 5 && setWizardStep(3)}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    wizardStep >= 3 ? 'bg-[#075e38] text-white' : 'bg-slate-100'
                  }`}
                >
                  3
                </span>
                <span>Plano Financeiro</span>
              </div>
            </div>

            {/* Wizard Forms */}
            {wizardStep === 1 && (
              <div className="space-y-4 max-w-2xl mx-auto text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950 text-[11px]">
                  <strong>Dados Cadastrais Oficiais:</strong> Preencha as informações do estudante com atenção para emissão da ficha e conformidade com os registros escolares.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome Completo do Aluno *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Tarek Mahmoud Ibrahim"
                      value={newStudentForm.name || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={newStudentForm.birthDate || ''}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, birthDate: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gênero *</label>
                    <select
                      value={newStudentForm.gender || 'MASCULINO'}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="OUTRO">Outro / Prefiro não informar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      RG (Registro Geral / Identidade) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12.345.678-9 ou ID Nacional"
                      value={newStudentForm.rg || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, rg: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+20 10 1234 5678"
                      value={newStudentForm.phone || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email de Contato</label>
                    <input
                      type="email"
                      placeholder="aluno@email.com"
                      value={newStudentForm.email || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cidade / Distrito</label>
                    <input
                      type="text"
                      value={newStudentForm.city || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Endereço Residencial</label>
                    <input
                      type="text"
                      placeholder="Rua, Número, Bairro / Distrito"
                      value={newStudentForm.address || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome do Responsável (se menor)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mahmoud Ibrahim"
                      value={newStudentForm.guardianName || ''}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telefone do Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="+20 10 9988 7766"
                      value={newStudentForm.guardianPhone || ''}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, guardianPhone: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Observações Médicas / Restrições
                    </label>
                    <input
                      type="text"
                      placeholder="Alergias, restrições físicas ou observações pertinentes..."
                      value={newStudentForm.notes || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={!newStudentForm.name.trim()}
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          newStudentForm.courseId === course.id
                            ? 'border-[#075e38] bg-emerald-50/50 font-bold ring-2 ring-[#075e38]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-sm font-black text-slate-900">{course.name}</p>
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
                    value={newStudentForm.classId || ''}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, classId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-xs bg-white"
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
                    className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Próximo: Plano Financeiro <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <form onSubmit={handleFinishWizard} className="space-y-4 max-w-2xl mx-auto text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="font-bold text-slate-800 text-sm">Resumo da Nova Matrícula:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <p>
                      Aluno: <strong className="text-slate-900">{newStudentForm.name}</strong>
                    </p>
                    <p>
                      RG / Identidade:{' '}
                      <strong className="text-slate-900 font-mono">
                        {newStudentForm.rg || 'Não informado'}
                      </strong>
                    </p>
                    <p>
                      Data de Nascimento:{' '}
                      <strong className="text-slate-900">
                        {newStudentForm.birthDate || 'Não informada'}
                      </strong>
                    </p>
                    <p>
                      Gênero:{' '}
                      <strong className="text-slate-900">{newStudentForm.gender || 'Não informado'}</strong>
                    </p>
                    <p>
                      Telefone / WhatsApp:{' '}
                      <strong className="text-slate-900">{newStudentForm.phone}</strong>
                    </p>
                    <p>
                      Cidade: <strong className="text-slate-900">{newStudentForm.city}</strong>
                    </p>
                    <p>
                      Curso:{' '}
                      <strong className="text-slate-900">
                        {state.courses.find((c) => c.id === newStudentForm.courseId)?.name}
                      </strong>
                    </p>
                    <p>
                      Turma:{' '}
                      <strong className="text-slate-900">
                        {state.classes.find((c) => c.id === newStudentForm.classId)?.name}
                      </strong>
                    </p>
                    <p className="sm:col-span-2 pt-1 border-t border-slate-200">
                      Mensalidade Base:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatCurrency(
                          state.courses.find((c) => c.id === newStudentForm.courseId)?.monthlyFee || 0,
                          'EGP'
                        )}{' '}
                        / mês
                      </strong>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de Parcelas do Plano Financeiro
                  </label>
                  <select
                    value={newStudentForm.installmentsCount ?? 4}
                    onChange={(e) =>
                      setNewStudentForm({
                        ...newStudentForm,
                        installmentsCount: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                  >
                    <option value={1}>1 Parcela (Quitação Integral à Vista)</option>
                    <option value={2}>2 Parcelas Semestrais</option>
                    <option value={4}>4 Parcelas Mensais (Padrão)</option>
                    <option value={6}>6 Parcelas Mensais</option>
                  </select>
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-medium">Total Calculado do Plano:</span>
                    <span className="font-mono font-black text-emerald-950 text-sm">
                      {formatCurrency(
                        (state.courses.find((c) => c.id === newStudentForm.courseId)?.monthlyFee || 0) *
                          newStudentForm.installmentsCount,
                        'EGP'
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/80 text-emerald-950 rounded-xl border border-emerald-200 text-[11px] leading-relaxed">
                  <strong>Automação Imediata:</strong> Ao confirmar, o sistema gerará o ID Student permanente (STU00000), registrará o plano no Financeiro e vinculará a turma ao diário de classe.
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Gerar STU ID & Concluir Matrícula
                  </button>
                </div>
              </form>
            )}

            {wizardStep === 5 && createdStudentResult && (
              <div className="p-8 text-center max-w-lg mx-auto bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Matrícula Concluída com Sucesso!
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {createdStudentResult.student.name}
                  </h3>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-xs space-y-2">
                  <p className="text-slate-500 font-medium">ID Student Gerado Automaticamente:</p>
                  <p className="font-mono text-2xl font-black text-[#075e38]">
                    {createdStudentResult.student.studentId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {createdStudentResult.enrollment.courseName} • {createdStudentResult.enrollment.className}
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentTab('sec_students')}
                    className="px-6 py-2.5 bg-[#075e38] text-white rounded-xl font-bold text-xs hover:bg-[#064e2e] shadow-sm cursor-pointer"
                  >
                    Ir para Lista de Alunos
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'sec_students':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#075e38]" />
                  Cadastro Central de Alunos ({filteredStudents.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identificador permanente STU00000 — 1 Aluno para Múltiplas Matrículas
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar STU, nome ou RG..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden w-48 sm:w-56"
                  />
                </div>

                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  <option value="ALL">Todos os Cursos</option>
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                  <option value="PENDENTE">Pendente</option>
                </select>

                <button
                  onClick={() => {
                    setWizardStep(1);
                    setCreatedStudentResult(null);
                    setCurrentTab('sec_new_student');
                  }}
                  className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Novo Aluno
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">ID Student</th>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">RG / Nasc</th>
                    <th className="px-4 py-3">Cursos Matriculados</th>
                    <th className="px-4 py-3">Turmas</th>
                    <th className="px-4 py-3">Status</th>
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
                      <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-black text-[#075e38] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            {stu.studentId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                stu.avatarUrl ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                              }
                              alt={stu.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900">{stu.name}</p>
                                {stu.level && (
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    {stu.level}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{stu.phone || stu.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <p className="font-mono text-[11px] font-bold text-slate-800">
                            {stu.rg || 'Não informado'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {stu.birthDate || 'Sem data'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {enrollments.map((e) => (
                              <span
                                key={e.id}
                                className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
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
                              className="px-3 py-1.5 text-xs font-bold text-[#075e38] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Ver Ficha Completa do Aluno"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ficha
                            </button>
                            <button
                              onClick={() => setExtraEnrollmentModalStudent(stu)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
        );

      case 'sec_enrollments':
        return <SecretariatEnrollmentsTab />;

      case 'sec_classes':
        return <SecretariatClassesTab />;

      case 'sec_documents':
        return <SecretariatDocumentsTab />;

      case 'sec_import':
        return <SecretariatImportTab />;

      default:
        return (
          <SecretariatHomeTab
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenNewStudent={() => {
              setWizardStep(1);
              setCreatedStudentResult(null);
              setCurrentTab('sec_new_student');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* 1. SIDEBAR (Matching reference image) */}
      <SecretariatSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
        onLogout={logout}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <SecretariatTopbar
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
          onLogout={logout}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* 3. MODALS (Ficha 360, Extra Course, Support) */}
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
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
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
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
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
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Confirmar Matrícula
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Support Modal */}
      <SecretariatSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
