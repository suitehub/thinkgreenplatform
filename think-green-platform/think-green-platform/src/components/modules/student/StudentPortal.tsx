import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Award,
  CreditCard,
  FileCheck,
  BookMarked,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Download,
  Upload,
  Play,
  ArrowRight,
  User,
  ShieldCheck,
  Bell,
  ChevronDown,
  X,
  MapPin,
  Sparkles,
  Phone,
  Video,
  ListChecks,
  Star,
  BarChart2,
  DollarSign,
  Banknote,
  Share2,
  Check,
  Copy,
  Filter,
  MoreVertical,
  Activity,
  Globe,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../lib/storage';
import { QuickPaymentModal } from '../../common/QuickPaymentModal';
import { ReceiptModal } from '../../common/ReceiptModal';
import {
  ThinkGardenLogo,
  SoccerBallBadge,
  USAFlagBadge,
  LeavesWatermark,
  BookWatermark,
} from '../../common/ThinkGardenLogos';
import { Charge, PaymentReceipt, Lesson, Assessment, Enrollment, ClassRoom } from '../../../types';

interface StudentPortalProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

type StudentActiveNav = 'materias' | 'aulas' | 'atividades' | 'notas' | 'frequencia' | 'financeiro';

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentTab, setCurrentTab }) => {
  const {
    currentUser,
    switchRole,
    state,
    checkExamAccess,
    checkClassroomAccess,
    submitAssignment,
  } = useApp();

  // Local active tab state mapped from parent or default to 'materias'
  const [activeNav, setActiveNav] = useState<StudentActiveNav>('materias');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<'ALL' | 'SOCCER' | 'ENGLISH'>('ALL');

  // Modals & Flyouts
  const [activePaymentCharge, setActivePaymentCharge] = useState<Charge | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [assignmentModal, setAssignmentModal] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isAvisosModalOpen, setIsAvisosModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState<{
    courseName: string;
    classRoom?: ClassRoom;
    enrollment?: Enrollment;
    theme: 'green' | 'purple';
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null);

  // Sync with currentTab if passed externally
  React.useEffect(() => {
    if (!currentTab) return;
    if (currentTab === 'student_materias' || currentTab === 'student_home' || currentTab === 'student_courses') {
      setActiveNav('materias');
    } else if (currentTab === 'student_aulas' || currentTab === 'student_lms') {
      setActiveNav('aulas');
    } else if (currentTab === 'student_atividades') {
      setActiveNav('atividades');
    } else if (currentTab === 'student_notas' || currentTab === 'student_grades') {
      setActiveNav('notas');
    } else if (currentTab === 'student_frequencia' || currentTab === 'student_attendance') {
      setActiveNav('frequencia');
    } else if (currentTab === 'student_financeiro' || currentTab === 'student_finance') {
      setActiveNav('financeiro');
    }
  }, [currentTab]);

  const handleNavChange = (nav: StudentActiveNav) => {
    setActiveNav(nav);
    if (setCurrentTab) {
      if (nav === 'materias') setCurrentTab('student_materias');
      if (nav === 'aulas') setCurrentTab('student_aulas');
      if (nav === 'atividades') setCurrentTab('student_atividades');
      if (nav === 'notas') setCurrentTab('student_notas');
      if (nav === 'frequencia') setCurrentTab('student_frequencia');
      if (nav === 'financeiro') setCurrentTab('student_financeiro');
    }
  };

  // Get student profile
  const student =
    state.students.find((s) => s.studentId === currentUser.studentId) ||
    state.students[0] || {
      id: 'stu-1',
      studentId: 'STU00000',
      name: 'Aluno',
      phone: '+20 10 0000 0000',
      city: 'Cairo',
      enrollmentDate: '2026-02-01',
      status: 'ATIVO',
    };

  // Get student's enrollments
  const studentEnrollments = state.enrollments.filter(
    (e) => e.studentId === student.studentId
  );

  // Get student's charges & financials
  const studentCharges = state.charges.filter(
    (c) => c.studentId === student.studentId
  );

  const studentReceipts = state.receipts.filter(
    (r) => r.studentId === student.studentId
  );

  const hasPendingCharges = studentCharges.some(
    (c) => c.status === 'PENDENTE' || c.status === 'EM ATRASO'
  );

  // Get student's grades
  const studentGrades = state.grades.filter((g) => g.studentId === student.studentId);
  const averageGrade =
    studentGrades.length > 0
      ? Math.round(
          studentGrades.reduce((acc, curr) => acc + curr.percentage, 0) /
            studentGrades.length
        )
      : 88;

  // Get student's attendance
  let totalClassesAttended = 0;
  let totalClassesCounted = 0;
  state.attendance.forEach((att) => {
    const studentRecord = att.students.find((s) => s.studentId === student.studentId);
    if (studentRecord) {
      totalClassesCounted++;
      if (studentRecord.present) totalClassesAttended++;
    }
  });

  const attendanceRate =
    totalClassesCounted > 0
      ? Math.round((totalClassesAttended / totalClassesCounted) * 100)
      : 96;

  // Assessments for student's classes
  const studentClassIds = studentEnrollments.map((e) => e.classId);
  const studentAssessments = state.assessments.filter((a) =>
    studentClassIds.includes(a.classId)
  );

  // Lessons
  const studentLessons = state.lessons.filter((l) =>
    studentClassIds.length === 0 || studentClassIds.includes(l.classId)
  );

  // Assignments
  const studentAssignments = state.assignments.filter((a) =>
    studentClassIds.length === 0 || studentClassIds.includes(a.classId)
  );

  // Identify Soccer & English Classes
  const soccerEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('futebol') ||
      e.courseName.toLowerCase().includes('soccer')
  ) || studentEnrollments[0];

  const soccerClass = state.classes.find(
    (c) =>
      c.id === soccerEnrollment?.classId ||
      c.name.toLowerCase().includes('futebol') ||
      c.name.toLowerCase().includes('soccer')
  ) || state.classes[0];

  const englishEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('inglês') ||
      e.courseName.toLowerCase().includes('ingles') ||
      e.courseName.toLowerCase().includes('english')
  ) || studentEnrollments[1] || studentEnrollments[0];

  const englishClass = state.classes.find(
    (c) =>
      c.id === englishEnrollment?.classId ||
      c.name.toLowerCase().includes('inglês') ||
      c.name.toLowerCase().includes('ingles') ||
      c.name.toLowerCase().includes('english')
  ) || state.classes[1] || state.classes[0];

  const soccerAccess = soccerClass
    ? checkClassroomAccess(student.studentId, soccerClass.id)
    : { allowed: true };

  const englishAccess = englishClass
    ? checkClassroomAccess(student.studentId, englishClass.id)
    : { allowed: true };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentModal) return;
    submitAssignment(
      assignmentModal.id,
      student.studentId,
      submissionText,
      'Trabalho_Submetido_ThinkGarden.pdf'
    );
    setSubmissionSuccess(true);
    setTimeout(() => {
      setAssignmentModal(null);
      setSubmissionSuccess(false);
      setSubmissionText('');
    }, 1500);
  };

  const [viewFeedbackModal, setViewFeedbackModal] = useState<{
    asgTitle: string;
    teacherName: string;
    score: number;
    maxScore: number;
    feedback: string;
    submittedAt?: string;
    status: string;
  } | null>(null);

  const getStudentSubmission = (asgId: string, asgTitle: string) => {
    return state.submissions.find(
      (s) =>
        (s.assignmentId === asgId || s.assignmentTitle === asgTitle) &&
        s.studentId === student.studentId
    );
  };

  const soccerAssignments = [
    ...state.assignments.filter(
      (a) =>
        a.classId === 'class_football_sub15' ||
        a.className?.toLowerCase().includes('futebol') ||
        a.className?.toLowerCase().includes('soccer')
    ),
    {
      id: 'asg_soc_1',
      classId: 'class_football_sub15',
      className: 'Futebol Juvenil Sub-15',
      title: 'Diário de Treino & Hábitos de Sono',
      instructions:
        'Registre suas 7 noites de descanso e hidratação pré e pós-treino da semana para acompanhamento com a equipe física.',
      teacherName: 'Prof. Tarek Mansour',
      dueDate: '08/03/2026 • 23:59',
      maxScore: 100,
      category: 'Diário Prático',
    },
    {
      id: 'asg_soc_2',
      classId: 'class_football_sub15',
      className: 'Futebol Juvenil Sub-15',
      title: 'Relatório de Análise Tática - Posicionamento 4-3-3',
      instructions:
        'Identifique as 3 principais funções do volante de marcação na saída de bola curta e na transição defensiva.',
      teacherName: 'Prof. Tarek Mansour',
      dueDate: '15/03/2026 • 23:59',
      maxScore: 100,
      category: 'Análise Tática',
    },
    {
      id: 'asg_soc_3',
      classId: 'class_football_sub15',
      className: 'Futebol Juvenil Sub-15',
      title: 'Desafio Prático: Controle de Bola e Embaixadinhas',
      instructions:
        'Grave um vídeo curto de até 45 segundos demonstrando controle com ambos os pés e finalização em alvo.',
      teacherName: 'Prof. Tarek Mansour',
      dueDate: '22/03/2026 • 23:59',
      maxScore: 100,
      category: 'Desafio Técnico',
    },
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const englishAssignments = [
    ...state.assignments.filter(
      (a) =>
        a.classId === 'class_eng_a' ||
        a.className?.toLowerCase().includes('inglês') ||
        a.className?.toLowerCase().includes('ingles') ||
        a.className?.toLowerCase().includes('english')
    ),
    {
      id: 'asg_eng_1',
      classId: 'class_eng_a',
      className: 'Inglês Básico A',
      title: 'Tarefa 04: Redação "My Community and Daily Routine"',
      instructions:
        'Escreva um texto de 80 a 120 palavras descrevendo sua rotina diária no Cairo e como você participa das atividades do Think Green Community Center.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '10/03/2026 • 23:59',
      maxScore: 100,
      category: 'Redação',
    },
    {
      id: 'asg_eng_2',
      classId: 'class_eng_a',
      className: 'Inglês Básico A',
      title: 'Exercício 03: Present Continuous vs Simple Past',
      instructions:
        'Complete as 15 frases de fixação preenchendo as lacunas com a forma verbal adequada de acordo com o contexto temporal.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '14/03/2026 • 23:59',
      maxScore: 100,
      category: 'Gramática',
    },
    {
      id: 'asg_eng_3',
      classId: 'class_eng_a',
      className: 'Inglês Básico A',
      title: 'Listening & Pronunciation Quiz 02',
      instructions:
        'Ouça o áudio da conversa na recepção do Centro e responda às 10 questões de interpretação oral.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '20/03/2026 • 23:59',
      maxScore: 100,
      category: 'Listening',
    },
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const handleCopyId = () => {
    navigator.clipboard.writeText(student.studentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const openTurmaHub = (theme: 'green' | 'purple', courseName: string, classObj?: ClassRoom, enrollmentObj?: Enrollment) => {
    setSelectedClassForModal({
      theme,
      courseName,
      classRoom: classObj,
      enrollment: enrollmentObj,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER - WHITE BACKGROUND HERO AS REQUESTED                         */}
      {/* ========================================================================= */}
      <header className="w-full bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          {/* Left: Think Garden Platform Logo */}
          <div className="flex items-center">
            <ThinkGardenLogo />
          </div>

          {/* Center: PORTAL ESTUDANTE Title */}
          <div className="text-center hidden md:block">
            <h1 className="text-base sm:text-xl font-bold tracking-[0.25em] text-slate-900 uppercase">
              PORTAL ESTUDANTE
            </h1>
          </div>

          {/* Right: User Profile Pill & Notification Bell */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all text-left border border-slate-200/80 shadow-2xs"
              >
                {/* Green circular avatar icon with user silhouette */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#075e38] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>

                <div className="flex flex-col pr-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                    Aluno
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium leading-none">
                    {student.studentId || 'STU00000'}
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-600 ml-0.5" />
              </button>

            {/* Profile Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.city || 'Cairo, Egito'}</p>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-1 font-mono"
                    title="Copiar ID Aluno"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {student.studentId}
                  </button>
                </div>

                <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center py-1">
                    <span>Status Matrícula:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {student.status || 'ATIVO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Situação Financeira:</span>
                    <span
                      className={`font-bold ${
                        hasPendingCharges ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                      } px-2 py-0.5 rounded-full`}
                    >
                      {hasPendingCharges ? 'Pendente' : '100% Em Dia'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Alternar Acesso (Demonstração)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        switchRole('TEACHER');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold text-center"
                    >
                      Professor
                    </button>
                    <button
                      onClick={() => {
                        switchRole('SECRETARIAT');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold text-center"
                    >
                      Secretaria
                    </button>
                    <button
                      onClick={() => {
                        switchRole('FINANCE');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold text-center"
                    >
                      Tesouraria
                    </button>
                    <button
                      onClick={() => {
                        switchRole('SUPER_ADMIN');
                        setIsUserMenuOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-semibold text-center"
                    >
                      Admin Geral
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell with Badge 3 */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsUserMenuOpen(false);
              }}
              className="p-2 text-slate-800 hover:text-[#075e38] transition-colors relative"
              aria-label="Avisos e Notificações"
            >
              <Bell className="w-6 h-6" />
              {/* Badge 3 in Green */}
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#075e38] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

            {/* Notifications Flyout */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#075e38]" />
                    <span className="font-bold text-slate-900 text-sm">Avisos do Aluno (3)</span>
                  </div>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  <div
                    onClick={() => {
                      setIsNotifOpen(false);
                      setIsAvisosModalOpen(true);
                    }}
                    className="py-3 cursor-pointer hover:bg-emerald-50/50 px-2 rounded-xl transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#075e38] uppercase">Camp Think Garden 2026</span>
                      <span className="text-slate-400">Hoje</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Inscrições abertas para o Acampamento de Verão 2026 e Oficinas de Línguas!
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setIsNotifOpen(false);
                      handleNavChange('notas');
                    }}
                    className="py-3 cursor-pointer hover:bg-purple-50/50 px-2 rounded-xl transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-700 uppercase">Avaliação de Inglês</span>
                      <span className="text-slate-400">Ontem</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      A 1ª Avaliação Intermediária de Inglês está agendada. Verifique seu status financeiro para liberação.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setIsNotifOpen(false);
                      handleNavChange('aulas');
                    }}
                    className="py-3 cursor-pointer hover:bg-emerald-50/50 px-2 rounded-xl transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-700 uppercase">Soccer Class</span>
                      <span className="text-slate-400">3 dias atrás</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Novo cronograma de treinos práticos e posicionamento tático disponível no AVA.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Main Container - Centered layout for blocks */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {/* ========================================================================= */}
        {/* 2. HORIZONTAL NAVIGATION TABS - CENTERED                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center gap-2 sm:gap-3.5 overflow-x-auto no-scrollbar py-1">
          {/* 1. Matérias Tab */}
          <button
            onClick={() => handleNavChange('materias')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'materias'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Matérias</span>
          </button>

          {/* 2. Aulas Tab */}
          <button
            onClick={() => handleNavChange('aulas')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'aulas'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Aulas</span>
          </button>

          {/* 3. Atividades Tab */}
          <button
            onClick={() => handleNavChange('atividades')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'atividades'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Atividades</span>
          </button>

          {/* 4. Notas Tab */}
          <button
            onClick={() => handleNavChange('notas')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'notas'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Notas</span>
          </button>

          {/* 5. Frequência Tab */}
          <button
            onClick={() => handleNavChange('frequencia')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'frequencia'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Frequência</span>
          </button>

          {/* 6. Financeiro Tab */}
          <button
            onClick={() => handleNavChange('financeiro')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'financeiro'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Financeiro</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2.5 GLOBAL COURSE FILTER SELECTOR BAR (For Aulas, Atividades, Notas, Freq)*/}
        {/* ========================================================================= */}
        {activeNav !== 'materias' && activeNav !== 'financeiro' && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter className="w-4 h-4 text-[#075e38]" />
              <span className="text-xs sm:text-sm font-bold">Filtrar por Turma / Matéria:</span>
            </div>

            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
              <button
                onClick={() => setSelectedCourseFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCourseFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas as Matérias
              </button>
              <button
                onClick={() => setSelectedCourseFilter('SOCCER')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedCourseFilter === 'SOCCER'
                    ? 'bg-[#075e38] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#075e38]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Soccer Class
              </button>
              <button
                onClick={() => setSelectedCourseFilter('ENGLISH')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedCourseFilter === 'ENGLISH'
                    ? 'bg-[#533499] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#533499]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> English Class
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ACTIVE TAB CONTENT                                                     */}
        {/* ========================================================================= */}

        {/* TAB 1: MATÉRIAS */}
        {activeNav === 'materias' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Stack of Course Cards (7 cols or ~68%) */}
            <div className="lg:col-span-8 space-y-6">
              {/* CARD 1: SOCCER CLASS (GREEN GRADIENT) */}
              <div className="bg-gradient-to-r from-[#075e38] via-[#065432] to-[#043d24] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
                {/* Background Leaf Watermark */}
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#0ea862]/20">
                  <LeavesWatermark className="w-64 h-64 sm:w-80 sm:h-80" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
                  {/* Soccer Ball Badge */}
                  <SoccerBallBadge className="w-24 h-24 sm:w-32 sm:h-32" />

                  {/* Text Content & Action Button */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                      SOCCER CLASS
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md font-normal leading-relaxed">
                      Acesse os conteúdos, atividades e recursos da sua turma.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('SOCCER');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#075e38] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Acessar turma</span>
                        <ArrowRight className="w-4 h-4 text-[#075e38] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: ENGLISH CLASS (PURPLE GRADIENT) */}
              <div className="bg-gradient-to-r from-[#533499] via-[#462986] to-[#34186c] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
                {/* Background Book Watermark */}
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#8a63ee]/20">
                  <BookWatermark className="w-64 h-64 sm:w-80 sm:h-80" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
                  {/* USA Flag Badge */}
                  <USAFlagBadge className="w-24 h-24 sm:w-32 sm:h-32" />

                  {/* Text Content & Action Button */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                      ENGLISH CLASS
                    </h2>
                    <p className="text-xs sm:text-sm text-purple-100/90 max-w-md font-normal leading-relaxed">
                      Acesse os conteúdos, atividades e recursos da sua turma.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('ENGLISH');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#533499] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Acessar turma</span>
                        <ArrowRight className="w-4 h-4 text-[#533499] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AVISOS CARD (4 cols or ~32%) */}
            <div className="lg:col-span-4">
              <div
                onClick={() => setIsAvisosModalOpen(true)}
                className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between min-h-[460px] cursor-pointer group"
              >
                {/* Background Leaf Outline in Bottom Right */}
                <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none text-emerald-800/5">
                  <LeavesWatermark className="w-48 h-48" />
                </div>

                {/* Top: Green Bell + AVISOS */}
                <div>
                  <div className="flex items-center gap-2.5 text-[#075e38]">
                    <Bell className="w-6 h-6 stroke-[2.5]" />
                    <span className="font-extrabold tracking-wider text-base sm:text-lg">
                      AVISOS
                    </span>
                  </div>

                  {/* Main Headline */}
                  <div className="mt-8 space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight uppercase">
                      CAMP THINK
                    </h3>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#075e38] leading-tight tracking-tight uppercase">
                      GARDEN
                    </h3>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight uppercase">
                      COMMUNITY
                    </h3>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight uppercase">
                      CENTER
                    </h3>
                  </div>

                  {/* Calendar 2026 Row */}
                  <div className="flex items-center gap-3.5 mt-8">
                    <div className="text-[#075e38]">
                      <Calendar className="w-10 h-10 stroke-[2.2]" />
                    </div>
                    <span className="text-4xl sm:text-5xl font-black text-[#075e38] tracking-tight">
                      2026
                    </span>
                  </div>
                </div>

                {/* Bottom: CLIQUE E SAIBA MAIS */}
                <div className="pt-6 relative z-10">
                  <span className="text-xs font-black tracking-widest text-slate-900 group-hover:text-[#075e38] transition-colors uppercase flex items-center gap-2">
                    CLIQUE E SAIBA MAIS
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AULAS (EXACT REPLICA DESIGN LANGUAGE) */}
        {activeNav === 'aulas' && (
          <div className="space-y-8">
            {/* Active Video Player Banner */}
            {activeLesson && (
              <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 text-white space-y-4 shadow-xl border border-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#075e38] text-white text-xs font-bold px-3 py-1 rounded-full">
                      REPRODUZINDO AULA
                    </span>
                    <h3 className="font-bold text-base sm:text-lg">{activeLesson.title}</h3>
                  </div>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="aspect-video max-h-96 bg-slate-950 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-800">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-inner">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                      Ambiente de Vídeo Aula Interativo • Think Garden Community Center
                    </p>
                    <p className="text-xs text-slate-400">Instrutor(a): {activeLesson.teacherName}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800">
                  <p className="text-slate-300 max-w-2xl">{activeLesson.description}</p>
                  {activeLesson.materials?.length > 0 && (
                    <button
                      onClick={() => alert(`Baixando material: ${activeLesson.materials[0].title}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex-shrink-0"
                    >
                      <Download className="w-4 h-4" /> Baixar Apostila PDF
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. SOCCER CLASS SECTION */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'SOCCER') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#075e38] via-[#065432] to-[#043d24] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#0ea862]/20">
                    <LeavesWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <SoccerBallBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Turma Ativa • Futebol Juvenil
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        SOCCER CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                        Veja todas as aulas programadas da sua turma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Block Alert Banner */}
                {!soccerAccess.allowed && (
                  <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-rose-950 flex items-center gap-1.5">
                          Acesso à Sala de Aula & Treinos de Futebol Bloqueado
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{soccerAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Conforme a política da instituição, a entrada no campo e o acesso às aulas exigem quitação da parcela equivalente no balcão da tesouraria.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Ir para o Financeiro</span>
                    </button>
                  </div>
                )}

                {/* Table of Soccer Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">AULA</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">PROFESSOR</th>
                        <th className="py-3.5 px-4">DATA / HORÁRIO</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURAÇÃO</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          id: 'soc_1',
                          title: 'Treino Tático 06: Transição Ofensiva & Compactação Defensiva',
                          desc: 'Exercícios no campo principal com foco em passes em profundidade e recomposição rápida.',
                          teacher: 'Prof. Tarek Mansour',
                          date: '01/03/2026 - Seg • 15:00',
                          duration: '50 min',
                          tag: 'Tático',
                        },
                        {
                          id: 'soc_2',
                          title: 'Treino 05: Fundamentos de Condução e Drible em Velocidade',
                          desc: 'Circuito com cones, mudança de direção e finalização na entrada da área.',
                          teacher: 'Prof. Tarek Mansour',
                          date: '26/02/2026 - Qui • 15:00',
                          duration: '50 min',
                          tag: 'Técnico',
                        },
                        {
                          id: 'soc_3',
                          title: 'Treino 04: Resistência Física & Circuito Aeróbico',
                          desc: 'Testes de velocidade de 30m, saltos pliométricos e respiração controlada.',
                          teacher: 'Prof. Tarek Mansour',
                          date: '24/02/2026 - Ter • 15:00',
                          duration: '50 min',
                          tag: 'Físico',
                        },
                        {
                          id: 'soc_4',
                          title: 'Treino 03: Cobrança de Faltas, Pênaltis e Bola Parada',
                          desc: 'Posicionamento de barreira e cobranças diretas no ângulo.',
                          teacher: 'Prof. Tarek Mansour',
                          date: '19/02/2026 - Qui • 15:00',
                          duration: '50 min',
                          tag: 'Especial',
                        },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => {
                                  if (!soccerAccess.allowed) {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${soccerAccess.reason}\n\nDirija-se à Tesouraria para regularizar o pagamento em dinheiro físico no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson({
                                    id: item.id,
                                    classId: 'class_football_sub15',
                                    className: 'Futebol Juvenil Sub-15',
                                    title: item.title,
                                    description: item.desc,
                                    date: item.date.split(' - ')[0],
                                    teacherId: 'user_teacher_2',
                                    teacherName: item.teacher,
                                    materials: [
                                      {
                                        id: 'mat_soc',
                                        title: `Prancheta Tática - ${item.title}.pdf`,
                                        type: 'PDF',
                                        url: '#',
                                        size: '1.5 MB',
                                      },
                                    ],
                                  });
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 shadow-xs ${
                                  !soccerAccess.allowed
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'bg-slate-100 hover:bg-[#075e38] text-slate-600 hover:text-white'
                                }`}
                              >
                                {!soccerAccess.allowed ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                              <User className="w-3 h-3 text-[#075e38]" />
                              {item.teacher}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-medium text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {item.date}
                            </span>
                          </td>

                          <td className="py-4 px-4 hidden sm:table-cell text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.duration}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              {!soccerAccess.allowed ? (
                                <button
                                  onClick={() => {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${soccerAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Bloqueado</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson({
                                      id: item.id,
                                      classId: 'class_football_sub15',
                                      className: 'Futebol Juvenil Sub-15',
                                      title: item.title,
                                      description: item.desc,
                                      date: item.date.split(' - ')[0],
                                      teacherId: 'user_teacher_2',
                                      teacherName: item.teacher,
                                      materials: [
                                        {
                                          id: 'mat_soc',
                                          title: `Prancheta Tática - ${item.title}.pdf`,
                                          type: 'PDF',
                                          url: '#',
                                          size: '1.5 MB',
                                        },
                                      ],
                                    })
                                  }
                                  className="px-4 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Assistir aula</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveActionDropdown(
                                      activeActionDropdown === item.id ? null : item.id
                                    )
                                  }
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                  title="Opções"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeActionDropdown === item.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-left animate-in fade-in">
                                    <button
                                      onClick={() => {
                                        alert(`Baixando material complementar de: ${item.title}`);
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#075e38]" /> Baixar Prancheta PDF
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link da aula copiado!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copiar Link
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ENGLISH CLASS SECTION */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'ENGLISH') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#533499] via-[#462986] to-[#34186c] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#8a63ee]/20">
                    <BookWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <USAFlagBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Turma Ativa • Curso Livre de Inglês
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ENGLISH CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                        Veja todas as aulas programadas da sua turma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Block Alert Banner */}
                {!englishAccess.allowed && (
                  <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-rose-950 flex items-center gap-1.5">
                          Acesso à Sala de Aula de Inglês Bloqueado
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{englishAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Conforme a política da instituição, a entrada em sala e o acesso às aulas exigem quitação da parcela equivalente no balcão da tesouraria.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Ir para o Financeiro</span>
                    </button>
                  </div>
                )}

                {/* Table of English Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">AULA</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">PROFESSOR</th>
                        <th className="py-3.5 px-4">DATA / HORÁRIO</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURAÇÃO</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          id: 'eng_1',
                          title: 'Aula 08: Introdução às Conversas do Cotidiano & Comunidade',
                          desc: 'Prática de diálogos no mercado local, cumprimentos formais e informais.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '02/03/2026 - Seg • 14:00',
                          duration: '50 min',
                          tag: 'Conversation',
                        },
                        {
                          id: 'eng_2',
                          title: 'Aula 07: Present Continuous & Ações em Andamento',
                          desc: 'Estruturas de sujeito + to be + verbo com -ing. Exercícios em grupo com cartões.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '25/02/2026 - Qua • 14:00',
                          duration: '50 min',
                          tag: 'Grammar',
                        },
                        {
                          id: 'eng_3',
                          title: 'Aula 06: Simple Present & Daily Routines in Cairo',
                          desc: 'Vocabulário de rotinas, horários e expressões de frequência (always, usually, never).',
                          teacher: 'Profª. Sarah Johnson',
                          date: '23/02/2026 - Seg • 14:00',
                          duration: '50 min',
                          tag: 'Vocabulary',
                        },
                        {
                          id: 'eng_4',
                          title: 'Aula 05: Reading & Comprehension: Think Garden Story',
                          desc: 'Leitura comentada sobre a fundação e impacto comunitário do centro.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '18/02/2026 - Qua • 14:00',
                          duration: '50 min',
                          tag: 'Reading',
                        },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => {
                                  if (!englishAccess.allowed) {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${englishAccess.reason}\n\nDirija-se à Tesouraria para regularizar o pagamento em dinheiro físico no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson({
                                    id: item.id,
                                    classId: 'class_eng_a',
                                    className: 'Inglês Básico A (Beginners)',
                                    title: item.title,
                                    description: item.desc,
                                    date: item.date.split(' - ')[0],
                                    teacherId: 'user_teacher_1',
                                    teacherName: item.teacher,
                                    materials: [
                                      {
                                        id: 'mat_eng',
                                        title: `Apostila Oficial - ${item.title}.pdf`,
                                        type: 'PDF',
                                        url: '#',
                                        size: '2.4 MB',
                                      },
                                    ],
                                  });
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 shadow-xs ${
                                  !englishAccess.allowed
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'bg-purple-50 hover:bg-[#533499] text-purple-700 hover:text-white'
                                }`}
                              >
                                {!englishAccess.allowed ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg text-purple-900 font-semibold border border-purple-100">
                              <User className="w-3 h-3 text-[#533499]" />
                              {item.teacher}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-medium text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {item.date}
                            </span>
                          </td>

                          <td className="py-4 px-4 hidden sm:table-cell text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.duration}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              {!englishAccess.allowed ? (
                                <button
                                  onClick={() => {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${englishAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Bloqueado</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson({
                                      id: item.id,
                                      classId: 'class_eng_a',
                                      className: 'Inglês Básico A (Beginners)',
                                      title: item.title,
                                      description: item.desc,
                                      date: item.date.split(' - ')[0],
                                      teacherId: 'user_teacher_1',
                                      teacherName: item.teacher,
                                      materials: [
                                        {
                                          id: 'mat_eng',
                                          title: `Apostila Oficial - ${item.title}.pdf`,
                                          type: 'PDF',
                                          url: '#',
                                          size: '2.4 MB',
                                        },
                                      ],
                                    })
                                  }
                                  className="px-4 py-1.5 bg-[#533499] hover:bg-[#432681] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Assistir aula</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveActionDropdown(
                                      activeActionDropdown === item.id ? null : item.id
                                    )
                                  }
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                  title="Opções"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeActionDropdown === item.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-left animate-in fade-in">
                                    <button
                                      onClick={() => {
                                        alert(`Baixando apostila em PDF de: ${item.title}`);
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#533499]" /> Baixar Apostila PDF
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link da aula copiado!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copiar Link
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ATIVIDADES & TRABALHOS (EXACT REPLICA DESIGN LANGUAGE) */}
        {activeNav === 'atividades' && (
          <div className="space-y-8">
            {/* 1. SOCCER CLASS ATIVIDADES */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'SOCCER') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#075e38] via-[#065432] to-[#043d24] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#0ea862]/20">
                    <LeavesWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <SoccerBallBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Atividades & Treinos • Futebol
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        SOCCER CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                        Atividades avaliativas, diários de treino e relatórios práticos da turma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Soccer Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ATIVIDADE</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUTOR</th>
                        <th className="py-3.5 px-4">PRAZO DE ENTREGA</th>
                        <th className="py-3.5 px-4">STATUS / NOTA</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {soccerAssignments.map((asg) => {
                        const sub = getStudentSubmission(asg.id, asg.title);
                        const hasVisto = sub && (sub.status === 'VISTO' || sub.status === 'AVALIADO');
                        const isSubmittedPending = sub && sub.status === 'PENDENTE_CORRECAO';
                        const displayScore = sub?.score !== undefined ? sub.score : (sub ? asg.maxScore : undefined);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                  <ListChecks className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm leading-snug">{asg.title}</p>
                                    {asg.category && (
                                      <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                        {asg.category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{asg.instructions}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                                <User className="w-3 h-3 text-[#075e38]" />
                                {asg.teacherName || 'Prof. Tarek Mansour'}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-medium text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {asg.dueDate}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              {hasVisto ? (
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs inline-flex items-center gap-1 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  Visto Realizado • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Entregue • Aguardando Visto
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pendente de Envio
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Prof. Tarek Mansour',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Atividade visualizada e aprovada pelo professor.',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Visto Realizado',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075e38] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Ver Feedback & Visto</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Sua atividade "${asg.title}" já foi enviada!\n\nResposta enviada: "${sub?.content || 'Trabalho em anexo'}"\n\nO professor irá avaliar em breve e dar o visto.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Ver Entrega</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Enviar atividade</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ENGLISH CLASS ATIVIDADES */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'ENGLISH') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#533499] via-[#462986] to-[#34186c] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#8a63ee]/20">
                    <BookWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <USAFlagBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Atividades & Tarefas • Inglês
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ENGLISH CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                        Redações, exercícios gramaticais e quizzes avaliativos da turma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of English Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ATIVIDADE</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">PROFESSOR</th>
                        <th className="py-3.5 px-4">PRAZO DE ENTREGA</th>
                        <th className="py-3.5 px-4">STATUS / NOTA</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {englishAssignments.map((asg) => {
                        const sub = getStudentSubmission(asg.id, asg.title);
                        const hasVisto = sub && (sub.status === 'VISTO' || sub.status === 'AVALIADO');
                        const isSubmittedPending = sub && sub.status === 'PENDENTE_CORRECAO';
                        const displayScore = sub?.score !== undefined ? sub.score : (sub ? asg.maxScore : undefined);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#533499] flex items-center justify-center flex-shrink-0 border border-purple-200">
                                  <ListChecks className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm leading-snug">{asg.title}</p>
                                    {asg.category && (
                                      <span className="text-[9px] font-bold uppercase bg-purple-50 text-[#533499] px-2 py-0.5 rounded-full border border-purple-200/60">
                                        {asg.category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{asg.instructions}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg text-purple-900 font-semibold border border-purple-100">
                                <User className="w-3 h-3 text-[#533499]" />
                                {asg.teacherName || 'Profª. Sarah Johnson'}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-medium text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {asg.dueDate}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              {hasVisto ? (
                                <span className="font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 text-xs inline-flex items-center gap-1 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-[#533499]" />
                                  Visto Realizado • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Entregue • Aguardando Visto
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pendente de Envio
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Profª. Sarah Johnson',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Excelente desempenho na atividade!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Visto Realizado',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#533499] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-purple-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#533499]" />
                                  <span>Ver Feedback & Visto</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Sua atividade "${asg.title}" já foi enviada!\n\nResposta enviada: "${sub?.content || 'Trabalho em anexo'}"\n\nO professor irá avaliar em breve e dar o visto.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Ver Entrega</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#533499] hover:bg-[#432681] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Enviar atividade</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTAS & AVALIAÇÕES */}
        {activeNav === 'notas' && (
          <div className="space-y-6">
            {/* Header summary KPI Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Star className="w-5 h-5 text-amber-500" />
                  Boletim Acadêmico & Provas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Confira suas notas, pesos e a liberação de exames conforme a situação financeira.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] uppercase font-bold text-emerald-800">Média Geral</p>
                  <p className="text-xl font-black text-[#075e38]">{averageGrade} pts</p>
                </div>
              </div>
            </div>

            {/* List of Assessments with Access Gates */}
            <div className="space-y-4">
              {studentAssessments
                .filter((asm) => {
                  if (selectedCourseFilter === 'SOCCER') {
                    return asm.courseName.toLowerCase().includes('futebol') || asm.className.toLowerCase().includes('futebol');
                  }
                  if (selectedCourseFilter === 'ENGLISH') {
                    return asm.courseName.toLowerCase().includes('inglês') || asm.className.toLowerCase().includes('inglês');
                  }
                  return true;
                })
                .map((asm) => {
                  const access = checkExamAccess(student.studentId, asm);
                  const grade = studentGrades.find((g) => g.assessmentId === asm.id);

                  return (
                    <div
                      key={asm.id}
                      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                        access.allowed
                          ? 'border-slate-200 bg-white shadow-xs'
                          : 'border-amber-300 bg-amber-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">
                              {asm.title}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">Data: {asm.date}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {asm.courseName} • Peso: {asm.weight}% • Pontuação Máxima: {asm.maxScore} pts
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {grade ? (
                            <div className="text-right">
                              <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                                {grade.score} / {grade.maxScore} ({grade.percentage}%)
                              </span>
                            </div>
                          ) : access.allowed ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                              <Unlock className="w-4 h-4" /> Prova Liberada
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                              <Lock className="w-4 h-4" /> Prova Bloqueada
                            </span>
                          )}
                        </div>
                      </div>

                      {!access.allowed && (
                        <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">{access.reason}</p>
                            <button
                              onClick={() => handleNavChange('financeiro')}
                              className="mt-1 font-bold text-purple-700 hover:underline cursor-pointer"
                            >
                              Ir para Financeiro & Regularizar →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 5: FREQUÊNCIA & PRESENÇAS */}
        {activeNav === 'frequencia' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                  Frequência & Registro de Presenças
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Mantenha a frequência acima de 75% para garantir aprovação e certificado oficial Think Garden.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] uppercase font-bold text-emerald-800">Presença Geral</p>
                  <p className="text-xl font-black text-[#075e38]">{attendanceRate}%</p>
                </div>
              </div>
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs divide-y divide-slate-100">
              {state.attendance
                .filter((att) => {
                  if (selectedCourseFilter === 'SOCCER') {
                    return att.className.toLowerCase().includes('futebol') || att.className.toLowerCase().includes('soccer');
                  }
                  if (selectedCourseFilter === 'ENGLISH') {
                    return att.className.toLowerCase().includes('inglês') || att.className.toLowerCase().includes('english');
                  }
                  return true;
                })
                .map((att) => {
                  const rec = att.students.find((s) => s.studentId === student.studentId);
                  const isPresent = rec ? rec.present : true;

                  return (
                    <div key={att.id} className="py-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{att.className}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Data: {att.date} • Prof(a). {att.teacherName} {att.notes ? `• ${att.notes}` : ''}
                        </p>
                      </div>

                      <div>
                        {isPresent ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Presente
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200 text-xs">
                            {rec?.justified ? 'Falta Justificada' : 'Ausente'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 6: FINANCEIRO & MENSALIDADES */}
        {activeNav === 'financeiro' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-[#075e38]" />
                  Mensalidades & Recibos Oficiais
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Consulte suas parcelas e realize o pagamento presencial na secretaria/tesouraria do Cairo (100% físico em espécie).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    hasPendingCharges
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {hasPendingCharges ? 'Pendência Financeira' : 'Mensalidades em Dia'}
                </span>
              </div>
            </div>

            {/* In-Person Physical Payment Notice */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-bold text-xs">Aviso aos Alunos e Responsáveis:</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Os recebimentos de mensalidades e matrículas são realizados <strong>exclusivamente de forma presencial no balcão da Secretaria / Tesouraria</strong> em <strong>dinheiro em espécie (EGP)</strong>. Não recebemos pagamentos online. Apresente seu <strong>ID de Aluno ({student.studentId})</strong> na recepção para emissão do recibo oficial autenticado na hora.
                </p>
              </div>
            </div>

            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-semibold">Parcela</th>
                    <th className="pb-3 font-semibold">Curso / Descrição</th>
                    <th className="pb-3 font-semibold">Vencimento</th>
                    <th className="pb-3 font-semibold">Valor</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentCharges.map((chg) => (
                    <tr key={chg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        {chg.installmentNumber}ª de {chg.totalInstallments}
                      </td>
                      <td className="py-3.5 text-slate-700">{chg.courseName}</td>
                      <td className="py-3.5 text-slate-500">{chg.dueDate}</td>
                      <td className="py-3.5 font-mono font-bold text-slate-900">
                        {formatCurrency(chg.amount, 'EGP')}
                      </td>
                      <td className="py-3.5">
                        <Badge status={chg.status} size="sm" />
                      </td>
                      <td className="py-3.5 text-right">
                        {chg.status !== 'PAGO' ? (
                          <button
                            onClick={() => setActivePaymentCharge(chg)}
                            className="px-3.5 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Pagar no Balcão (Caixa)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const rec = studentReceipts.find((r) => r.chargeId === chg.id);
                              if (rec) setSelectedReceipt(rec);
                            }}
                            className="text-[#075e38] hover:underline font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Ver Recibo</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & DIALOGS                                                       */}
      {/* ========================================================================= */}

      {/* MODAL 1: CAMP THINK GARDEN 2026 DETAILS (FROM AVISOS CARD) */}
      {isAvisosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none text-emerald-800/5">
              <LeavesWatermark className="w-56 h-56" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#075e38]">
                <Bell className="w-5 h-5" />
                <span className="font-extrabold tracking-wider text-xs uppercase">
                  Comunicado Oficial
                </span>
              </div>
              <button
                onClick={() => setIsAvisosModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                CAMP THINK <span className="text-[#075e38]">GARDEN</span> COMMUNITY CENTER
              </h2>
              <div className="flex items-center gap-2 text-sm text-[#075e38] font-bold mt-1">
                <Calendar className="w-4 h-4" />
                <span>Edição Oficial • Verão 2026</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed border-y border-slate-100 py-4">
              <p>
                O <strong>Think Garden Community Center</strong> no Cairo convida todos os alunos para a edição 2026 do nosso Acampamento e Oficinas Especiais!
              </p>
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/70 space-y-1.5">
                <p className="font-bold text-[#075e38]">Atividades Inclusas no Programa:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Torneio Interclasses de Futebol (Soccer Camp) no Campo Principal</li>
                  <li>Imersão Intensiva em Língua Inglesa com Professores Nativos</li>
                  <li>Workshops de Sustentabilidade, Horta Urbana e Liderança Comunitária</li>
                  <li>Certificado de Participação e Medalhas Comemorativas 2026</li>
                </ul>
              </div>
              <p className="text-slate-500">
                Alunos com matrícula ativa possuem desconto exclusivo e prioridade na escolha de turmas. Procure a secretaria ou coordenação para garantir sua vaga.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setIsAvisosModalOpen(false)}
                className="px-5 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-full transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TURMA HUB MODAL (WHEN CLICKING ACESSAR TURMA) */}
      {selectedClassForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {selectedClassForModal.theme === 'green' ? (
                  <SoccerBallBadge className="w-12 h-12" />
                ) : (
                  <USAFlagBadge className="w-12 h-12" />
                )}
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedClassForModal.theme === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    Turma Ativa
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-0.5">
                    {selectedClassForModal.courseName}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedClassForModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs border border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Horário das Aulas:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.classRoom?.schedule || 'Terças e Quintas - 15:00 às 17:00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Professor / Instrutor:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.classRoom?.teacherName || 'Corpo Docente Think Garden'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Local:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.theme === 'green' ? 'Campo de Futebol 1 (Cairo)' : 'Sala 102 - Bloco A'}
                </span>
              </div>
              {(() => {
                const classAccess = selectedClassForModal.classRoom
                  ? checkClassroomAccess(student.studentId, selectedClassForModal.classRoom.id)
                  : { allowed: true };

                return (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Acesso à Sala / Campo:</span>
                      {classAccess.allowed ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" /> Liberado via Matrícula
                        </span>
                      ) : (
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> ENTRADA BLOQUEADA (Financeiro)
                        </span>
                      )}
                    </div>
                    {!classAccess.allowed && (
                      <p className="text-[11px] text-rose-700 font-medium mt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        {classAccess.reason}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedClassForModal(null);
                  handleNavChange('atividades');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Ver Atividades
              </button>
              <button
                onClick={() => {
                  setSelectedClassForModal(null);
                  handleNavChange('aulas');
                }}
                className={`px-5 py-2 text-white font-bold text-xs rounded-full transition-colors cursor-pointer ${
                  selectedClassForModal.theme === 'green'
                    ? 'bg-[#075e38] hover:bg-[#064e2e]'
                    : 'bg-[#533499] hover:bg-[#432681]'
                }`}
              >
                Abrir Aulas no AVA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGNMENT SUBMISSION MODAL */}
      {assignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Enviar Atividade</h3>
              <button
                onClick={() => setAssignmentModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <p className="font-bold text-slate-900">{assignmentModal.title}</p>
              <p className="mt-1">{assignmentModal.instructions}</p>
            </div>

            {submissionSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Atividade enviada com sucesso ao professor!
              </div>
            ) : (
              <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Comentários ou Resposta do Aluno
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Escreva sua resposta ou notas explicativas sobre o trabalho..."
                    className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#075e38] outline-none text-xs"
                  />
                </div>

                <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <p className="font-semibold text-slate-700">Arquivo Selecionado:</p>
                  <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                    Trabalho_Submetido_ThinkGarden.pdf (1.4 MB)
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentModal(null)}
                    className="px-4 py-2 border border-slate-200 rounded-full font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold rounded-full transition-colors"
                  >
                    Confirmar Envio
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: FEEDBACK & VISTO VIEWER MODAL */}
      {viewFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center font-bold">
                  <CheckCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {viewFeedbackModal.status}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">
                    {viewFeedbackModal.asgTitle}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setViewFeedbackModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Professor / Avaliador</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewFeedbackModal.teacherName}</span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Pontuação Obtida</span>
                <span className="font-extrabold text-emerald-800 text-base mt-0.5 block">
                  {viewFeedbackModal.score} <span className="text-xs font-normal text-emerald-600">/ {viewFeedbackModal.maxScore} pts</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Feedback & Parecer Pedagógico do Professor:
              </label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                "{viewFeedbackModal.feedback}"
              </div>
            </div>

            {viewFeedbackModal.submittedAt && (
              <p className="text-[11px] text-slate-400 text-right">
                Data do envio: {viewFeedbackModal.submittedAt}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewFeedbackModal(null)}
                className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT MODAL (PHYSICAL CASH AT DESK) */}
      {activePaymentCharge && (
        <QuickPaymentModal
          isOpen={!!activePaymentCharge}
          onClose={() => setActivePaymentCharge(null)}
          charge={activePaymentCharge}
          onSuccess={(receipt) => {
            setActivePaymentCharge(null);
            setSelectedReceipt(receipt);
          }}
        />
      )}

      {/* OFFICIAL RECEIPT CERTIFICATE MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
};
