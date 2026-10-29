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
  Sun,
  Heart,
  CheckCheck,
  LogOut,
  ExternalLink,
  Printer,
  GraduationCap,
  Layers,
  RotateCcw,
  Headphones,
  Volume2,
  FolderOpen,
  Pin,
  Megaphone,
  HelpCircle,
  Send,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../lib/storage';
import { ReceiptModal } from '../../common/ReceiptModal';
import {
  ThinkGardenLogo,
  SoccerBallBadge,
  USAFlagBadge,
  PreschoolBadge,
  WomenFitBadge,
  LeavesWatermark,
  BookWatermark,
  SunWatermark,
  FitnessWatermark,
} from '../../common/ThinkGardenLogos';
import {
  Charge,
  PaymentReceipt,
  Lesson,
  Assessment,
  Enrollment,
  ClassRoom,
  DidacticMaterial,
  Quiz,
  QuizSubmission,
  GeneralAnnouncement,
} from '../../../types';
import {
  getStoredDidacticMaterials,
  getStoredQuizzes,
  getStoredQuizSubmissions,
  saveStoredQuizSubmissions,
  getStoredGeneralAnnouncements,
} from '../teacher/teacherData';

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
    logout,
    checkExamAccess,
    checkClassroomAccess,
    submitAssignment,
  } = useApp();

  // Local active tab state mapped from parent or default to 'materias'
  const [activeNav, setActiveNav] = useState<StudentActiveNav>('materias');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<'ALL' | 'SOCCER' | 'ENGLISH' | 'PRESCHOOL' | 'WOMENS_FITNESS'>('ALL');

  // Modals & Flyouts
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const lessonViewerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to lesson document viewer whenever a lesson is opened
  React.useEffect(() => {
    if (activeLesson) {
      setTimeout(() => {
        if (lessonViewerRef.current) {
          lessonViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 60);
    }
  }, [activeLesson]);

  // Auto-close active document viewer when changing screen (tab) or subject/course filter
  React.useEffect(() => {
    setActiveLesson(null);
  }, [activeNav, selectedCourseFilter]);

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
    theme: 'green' | 'purple' | 'orange' | 'pink';
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null);

  // =========================================================================
  // AJUSTES 1, 3, 4, 6 STATE
  // =========================================================================
  const [generalAnnouncements, setGeneralAnnouncements] = useState<GeneralAnnouncement[]>(() =>
    getStoredGeneralAnnouncements()
  );
  const [isGeneralMuralDismissed, setIsGeneralMuralDismissed] = useState(false);
  const [didacticMaterials, setDidacticMaterials] = useState<DidacticMaterial[]>(() =>
    getStoredDidacticMaterials()
  );
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => getStoredQuizzes());
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>(() =>
    getStoredQuizSubmissions()
  );

  // Active Quiz Modal & State
  const [activeQuizModal, setActiveQuizModal] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [quizSubmissionResult, setQuizSubmissionResult] = useState<QuizSubmission | null>(null);

  // Active Didactic Material Viewer Modal
  const [activeMaterialModal, setActiveMaterialModal] = useState<DidacticMaterial | null>(null);

  const handleOpenQuiz = (quiz: Quiz) => {
    setActiveQuizModal(quiz);
    setQuizAnswers({});
    setQuizSubmissionResult(null);
  };

  const handleSelectQuizOption = (questionId: string, optionId: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleEssayQuizAnswer = (questionId: string, text: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmitQuiz = (studentObj: { studentId: string; name: string }) => {
    if (!activeQuizModal) return;

    let earnedPoints = 0;
    const studentAnsList: QuizSubmission['answers'] = [];

    activeQuizModal.questions.forEach((q) => {
      const studentAnswer = quizAnswers[q.id];
      let isCorrect = false;

      if (q.type === 'MULTIPLE_CHOICE') {
        const correctOpt = (q.options || []).find((o) => o.isCorrect || o.id === q.correctOptionId);
        if (correctOpt && studentAnswer === correctOpt.id) {
          isCorrect = true;
          earnedPoints += q.points;
        }
      } else if (q.type === 'TRUE_FALSE') {
        if (q.correctBooleanAnswer !== undefined) {
          const isTrueAnswer = studentAnswer === 'true' || studentAnswer === true;
          if (isTrueAnswer === q.correctBooleanAnswer) {
            isCorrect = true;
            earnedPoints += q.points;
          }
        } else {
          const correctOpt = (q.options || []).find((o) => o.isCorrect);
          if (correctOpt && studentAnswer === correctOpt.id) {
            isCorrect = true;
            earnedPoints += q.points;
          }
        }
      } else if (q.type === 'FILL_BLANK') {
        const expected = q.correctBlankAnswer || (q.options || []).find((o) => o.isCorrect)?.text || '';
        if (
          expected &&
          typeof studentAnswer === 'string' &&
          studentAnswer.trim().toLowerCase() === expected.trim().toLowerCase()
        ) {
          isCorrect = true;
          earnedPoints += q.points;
        }
      } else {
        // Essay question - tentative completion points, flagged for teacher feedback
        if (typeof studentAnswer === 'string' && studentAnswer.trim().length > 5) {
          earnedPoints += Math.round(q.points * 0.95);
          isCorrect = true;
        }
      }

      studentAnsList.push({
        questionId: q.id,
        answer: (typeof studentAnswer === 'string' ? studentAnswer : '') || '',
        isCorrect,
      });
    });

    const submission: QuizSubmission = {
      id: `qsub_${Date.now()}`,
      quizId: activeQuizModal.id,
      studentId: studentObj.studentId,
      studentName: studentObj.name,
      score: earnedPoints,
      maxScore: activeQuizModal.totalPoints,
      submittedAt:
        new Date().toLocaleDateString('pt-BR') +
        ' ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      answers: studentAnsList,
      teacherFeedback:
        'Parabéns pela realização da atividade interativa! A compreensão auditiva e as respostas foram processadas pelo sistema.',
    };

    const updated = [
      submission,
      ...quizSubmissions.filter(
        (s) => !(s.quizId === activeQuizModal.id && s.studentId === studentObj.studentId)
      ),
    ];
    setQuizSubmissions(updated);
    saveStoredQuizSubmissions(updated);
    setQuizSubmissionResult(submission);
  };

  // Sync with currentTab if passed externally
  React.useEffect(() => {
    if (!currentTab) return;
    setActiveLesson(null);
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
    setActiveLesson(null);
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

  const getCourseFilterLabel = (filter: 'ALL' | 'SOCCER' | 'ENGLISH' | 'PRESCHOOL' | 'WOMENS_FITNESS') => {
    switch (filter) {
      case 'SOCCER':
        return 'Soccer Class';
      case 'ENGLISH':
        return 'English Class';
      case 'PRESCHOOL':
        return 'Preschool';
      case 'WOMENS_FITNESS':
        return 'Fitness Mulheres';
      default:
        return 'Todas as Matérias';
    }
  };

  const filteredAverageGrade = React.useMemo(() => {
    if (selectedCourseFilter === 'ALL') return averageGrade;
    const matchingAsmIds = studentAssessments
      .filter((asm) => {
        const cName = (asm.courseName || '').toLowerCase();
        const clName = (asm.className || '').toLowerCase();
        if (selectedCourseFilter === 'SOCCER') {
          return cName.includes('futebol') || cName.includes('soccer') || clName.includes('futebol') || clName.includes('soccer');
        }
        if (selectedCourseFilter === 'ENGLISH') {
          return cName.includes('inglês') || cName.includes('english') || cName.includes('ingles') || clName.includes('inglês') || clName.includes('english') || clName.includes('ingles');
        }
        if (selectedCourseFilter === 'PRESCHOOL') {
          return cName.includes('preschool') || cName.includes('pré-escola') || cName.includes('pre-escola') || clName.includes('girassol');
        }
        if (selectedCourseFilter === 'WOMENS_FITNESS') {
          return cName.includes('mulher') || cName.includes('fitness') || clName.includes('circuito');
        }
        return true;
      })
      .map((a) => a.id);

    const matchingGrades = studentGrades.filter((g) => matchingAsmIds.includes(g.assessmentId));
    if (matchingGrades.length === 0) {
      if (selectedCourseFilter === 'SOCCER') return 88;
      if (selectedCourseFilter === 'ENGLISH') return 92;
      if (selectedCourseFilter === 'PRESCHOOL') return 96;
      if (selectedCourseFilter === 'WOMENS_FITNESS') return 90;
      return averageGrade;
    }
    return Math.round(matchingGrades.reduce((acc, curr) => acc + curr.percentage, 0) / matchingGrades.length);
  }, [selectedCourseFilter, studentAssessments, studentGrades, averageGrade]);

  // Requirement 4: Verification of Final Grade Release by Teacher & Final Exam completion
  const isFinalGradeAllowedToView = React.useMemo(() => {
    const targetClasses = state.classes.filter((c) => {
      if (selectedCourseFilter === 'ALL') return studentClassIds.includes(c.id);
      if (selectedCourseFilter === 'SOCCER') return c.id === 'class_soccer';
      if (selectedCourseFilter === 'ENGLISH') return c.id === 'class_eng_a';
      if (selectedCourseFilter === 'PRESCHOOL') return c.id === 'class_preschool_a';
      if (selectedCourseFilter === 'WOMENS_FITNESS') return c.id === 'class_women_circuit';
      return studentClassIds.includes(c.id);
    });

    if (targetClasses.length === 0) return false;

    return targetClasses.every((cls) => {
      const isReleased = cls.isFinalGradeReleased === true;
      const finalExam = studentAssessments.find(
        (a) =>
          a.classId === cls.id &&
          (a.title.toLowerCase().includes('final') ||
            a.title.toLowerCase().includes('exame final') ||
            a.title.toLowerCase().includes('final term'))
      );
      const hasFinalExamGrade = finalExam
        ? studentGrades.some((g) => g.assessmentId === finalExam.id)
        : false;

      return isReleased && hasFinalExamGrade;
    });
  }, [selectedCourseFilter, state.classes, studentClassIds, studentAssessments, studentGrades]);

  const filteredAttendanceRate = React.useMemo(() => {
    if (selectedCourseFilter === 'ALL') return attendanceRate;
    let attended = 0;
    let total = 0;
    state.attendance.forEach((att) => {
      const clName = (att.className || '').toLowerCase();
      let matches = false;
      if (selectedCourseFilter === 'SOCCER') {
        matches = clName.includes('futebol') || clName.includes('soccer');
      } else if (selectedCourseFilter === 'ENGLISH') {
        matches = clName.includes('inglês') || clName.includes('english') || clName.includes('ingles');
      } else if (selectedCourseFilter === 'PRESCHOOL') {
        matches = clName.includes('preschool') || clName.includes('pré-escola') || clName.includes('pre-escola') || clName.includes('girassol');
      } else if (selectedCourseFilter === 'WOMENS_FITNESS') {
        matches = clName.includes('mulher') || clName.includes('fitness') || clName.includes('circuito');
      }
      if (matches) {
        const studentRecord = att.students.find((s) => s.studentId === student.studentId);
        if (studentRecord) {
          total++;
          if (studentRecord.present) attended++;
        }
      }
    });
    return total > 0 ? Math.round((attended / total) * 100) : 100;
  }, [selectedCourseFilter, state.attendance, student.studentId, attendanceRate]);

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

  const preschoolEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('pré-escola') ||
      e.courseName.toLowerCase().includes('pre-escola') ||
      e.courseName.toLowerCase().includes('preschool') ||
      e.courseName.toLowerCase().includes('girassol')
  ) || studentEnrollments.find((e) => e.courseId === 'course_preschool');

  const preschoolClass = state.classes.find(
    (c) =>
      c.id === preschoolEnrollment?.classId ||
      c.courseId === 'course_preschool' ||
      c.name.toLowerCase().includes('girassol')
  ) || state.classes.find((c) => c.courseId === 'course_preschool') || state.classes[2] || state.classes[0];

  const preschoolAccess = preschoolClass
    ? checkClassroomAccess(student.studentId, preschoolClass.id)
    : { allowed: true };

  const womenFitEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('mulher') ||
      e.courseName.toLowerCase().includes('fitness') ||
      e.courseName.toLowerCase().includes('circuito')
  ) || studentEnrollments.find((e) => e.courseId === 'course_women_fit');

  const womenFitClass = state.classes.find(
    (c) =>
      c.id === womenFitEnrollment?.classId ||
      c.courseId === 'course_women_fit' ||
      c.name.toLowerCase().includes('circuito')
  ) || state.classes.find((c) => c.courseId === 'course_women_fit') || state.classes[3] || state.classes[0];

  const womenFitAccess = womenFitClass
    ? checkClassroomAccess(student.studentId, womenFitClass.id)
    : { allowed: true };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentModal) return;
    submitAssignment(
      assignmentModal.id,
      student.studentId,
      submissionText,
      'Trabalho_Submetido_ThinkGreen.pdf'
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

  const preschoolAssignments = [
    ...state.assignments.filter(
      (a) =>
        a.classId === 'class_preschool_a' ||
        a.className?.toLowerCase().includes('preschool') ||
        a.className?.toLowerCase().includes('pré-escola') ||
        a.className?.toLowerCase().includes('pre-escola') ||
        a.className?.toLowerCase().includes('girassol')
    ),
    {
      id: 'asg_pre_1',
      classId: 'class_preschool_a',
      className: 'Turma Girassol (4 a 5 anos)',
      title: 'Atividade de Cores & Desenho: Meu Lugar Favorito no Jardim',
      instructions:
        'Desenho livre utilizando lápis de cor e colagem de elementos da natureza recolhidos no Centro Comunitário.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '12/03/2026 • 12:00',
      maxScore: 100,
      category: 'Arte & Criatividade',
    },
    {
      id: 'asg_pre_2',
      classId: 'class_preschool_a',
      className: 'Turma Girassol (4 a 5 anos)',
      title: 'Desafio Lúdico: Identificação dos Animais em Inglês',
      instructions:
        'Reconhecer e pronunciar os nomes dos 5 animaizinhos da fazenda trabalhados na historinha da semana.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '19/03/2026 • 12:00',
      maxScore: 100,
      category: 'Bilinguismo Infantil',
    },
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const womenFitAssignments = [
    ...state.assignments.filter(
      (a) =>
        a.classId === 'class_women_circuit' ||
        a.className?.toLowerCase().includes('mulher') ||
        a.className?.toLowerCase().includes('fitness') ||
        a.className?.toLowerCase().includes('circuito')
    ),
    {
      id: 'asg_fit_1',
      classId: 'class_women_circuit',
      className: 'Circuito Funcional Feminino - Manhã',
      title: 'Registro de Metas de Saúde & Bem-Estar Semanal',
      instructions:
        'Preencher a ficha de acompanhamento de frequência, ingestão de água e nível de energia nos 3 dias de circuito funcional.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '14/03/2026 • 20:00',
      maxScore: 100,
      category: 'Hábitos Saudáveis',
    },
    {
      id: 'asg_fit_2',
      classId: 'class_women_circuit',
      className: 'Circuito Funcional Feminino - Manhã',
      title: 'Diário de Alongamento & Mobilidade Postural',
      instructions:
        'Praticar os 4 exercícios de descompressão lombar e flexibilidade em casa nos dias sem treino no Centro.',
      teacherName: 'Profª. Sarah Johnson',
      dueDate: '21/03/2026 • 20:00',
      maxScore: 100,
      category: 'Mobilidade',
    },
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const handleCopyId = () => {
    navigator.clipboard.writeText(student.studentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const openTurmaHub = (theme: 'green' | 'purple' | 'orange' | 'pink', courseName: string, classObj?: ClassRoom, enrollmentObj?: Enrollment) => {
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
          {/* Left: Think Green Platform Logo */}
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

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair do Sistema</span>
                  </button>
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
                      <span className="font-bold text-[#075e38] uppercase">Camp Think Green 2026</span>
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
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
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
        {/* 2.5 INTERACTIVE SUBJECT SELECTOR (Aulas, Atividades, Notas, Frequência)    */}
        {/* ========================================================================= */}
        {activeNav !== 'materias' && activeNav !== 'financeiro' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#075e38] border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#075e38]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#075e38] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                      Matérias Matriculadas
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activeNav === 'aulas' && 'Clique no ícone da matéria para ver as aulas'}
                      {activeNav === 'atividades' && 'Clique no ícone da matéria para ver as atividades'}
                      {activeNav === 'notas' && 'Clique no ícone da matéria para ver o boletim'}
                      {activeNav === 'frequencia' && 'Clique no ícone da matéria para ver a frequência'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {activeNav === 'aulas' && 'Acesse as aulas, vídeos e roteiros de estudo por disciplina'}
                    {activeNav === 'atividades' && 'Acompanhe prazos e envie seus trabalhos por disciplina'}
                    {activeNav === 'notas' && 'Consulte as avaliações, notas e pesos por disciplina'}
                    {activeNav === 'frequencia' && 'Acompanhe seus registros de presença e treinos por disciplina'}
                  </h3>
                </div>
              </div>

              {selectedCourseFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCourseFilter('ALL')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ver Todas as Matérias</span>
                </button>
              )}
            </div>

            {/* Grid of Subject Cards with Distinctive Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. TODAS AS MATÉRIAS */}
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('ALL')}
                className={`relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  selectedCourseFilter === 'ALL'
                    ? 'border-slate-800 bg-slate-50/90 ring-2 ring-slate-800/10 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {selectedCourseFilter === 'ALL' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform border-2 border-slate-700">
                    <Layers className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Geral
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Todas as Matérias
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {activeNav === 'aulas' && '14 Aulas'}
                    {activeNav === 'atividades' && '7 Trabalhos'}
                    {activeNav === 'notas' && 'Média Geral'}
                    {activeNav === 'frequencia' && 'Presença'}
                  </span>
                  <span className="font-black text-slate-900">
                    {activeNav === 'aulas' && 'Totais'}
                    {activeNav === 'atividades' && 'Ativos'}
                    {activeNav === 'notas' && `${averageGrade} pts`}
                    {activeNav === 'frequencia' && `${attendanceRate}%`}
                  </span>
                </div>
              </button>

              {/* 2. SOCCER CLASS */}
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('SOCCER')}
                className={`relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  selectedCourseFilter === 'SOCCER'
                    ? 'border-[#075e38] bg-emerald-50/80 ring-2 ring-[#075e38]/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {selectedCourseFilter === 'SOCCER' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#075e38] text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                    <SoccerBallBadge className="w-12 h-12" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                      Futebol
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Soccer Class
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {soccerClass?.name?.split(' - ')[0] || 'Sub-15'}
                  </span>
                  <span className="font-black text-[#075e38]">
                    {activeNav === 'aulas' && '4 Aulas'}
                    {activeNav === 'atividades' && '2 Tarefas'}
                    {activeNav === 'notas' && '88 pts'}
                    {activeNav === 'frequencia' && '100%'}
                  </span>
                </div>
              </button>

              {/* 3. ENGLISH CLASS */}
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('ENGLISH')}
                className={`relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  selectedCourseFilter === 'ENGLISH'
                    ? 'border-[#533499] bg-purple-50/80 ring-2 ring-[#533499]/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {selectedCourseFilter === 'ENGLISH' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#533499] text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                    <USAFlagBadge className="w-12 h-12" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
                      Bilíngue
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      English Class
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {englishClass?.name?.split(' (')[0] || 'Básico A'}
                  </span>
                  <span className="font-black text-[#533499]">
                    {activeNav === 'aulas' && '4 Aulas'}
                    {activeNav === 'atividades' && '2 Tarefas'}
                    {activeNav === 'notas' && '92 pts'}
                    {activeNav === 'frequencia' && '100%'}
                  </span>
                </div>
              </button>

              {/* 4. PRESCHOOL */}
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('PRESCHOOL')}
                className={`relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  selectedCourseFilter === 'PRESCHOOL'
                    ? 'border-[#ea580c] bg-orange-50/80 ring-2 ring-[#ea580c]/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {selectedCourseFilter === 'PRESCHOOL' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                    <PreschoolBadge className="w-12 h-12" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-orange-700 block tracking-wider">
                      Infantil
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Preschool
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {preschoolClass?.name?.split(' (')[0] || 'Girassol'}
                  </span>
                  <span className="font-black text-[#ea580c]">
                    {activeNav === 'aulas' && '3 Aulas'}
                    {activeNav === 'atividades' && '2 Tarefas'}
                    {activeNav === 'notas' && '96 pts'}
                    {activeNav === 'frequencia' && '100%'}
                  </span>
                </div>
              </button>

              {/* 5. FITNESS MULHERES */}
              <button
                type="button"
                onClick={() => setSelectedCourseFilter('WOMENS_FITNESS')}
                className={`relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  selectedCourseFilter === 'WOMENS_FITNESS'
                    ? 'border-[#be185d] bg-pink-50/80 ring-2 ring-[#be185d]/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-pink-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {selectedCourseFilter === 'WOMENS_FITNESS' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#be185d] text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                    <WomenFitBadge className="w-12 h-12" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-pink-700 block tracking-wider">
                      Saúde & Treino
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Fitness Mulheres
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {womenFitClass?.name?.split(' - ')[0] || 'Circuito'}
                  </span>
                  <span className="font-black text-[#be185d]">
                    {activeNav === 'aulas' && '3 Aulas'}
                    {activeNav === 'atividades' && '1 Meta'}
                    {activeNav === 'notas' && '90 pts'}
                    {activeNav === 'frequencia' && '100%'}
                  </span>
                </div>
              </button>
            </div>

            {/* Active filter notification banner */}
            {selectedCourseFilter !== 'ALL' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[#075e38] animate-pulse"></span>
                  <span>
                    Exibindo apenas{' '}
                    {activeNav === 'aulas' && 'aulas'}
                    {activeNav === 'atividades' && 'atividades'}
                    {activeNav === 'notas' && 'avaliações e provas'}
                    {activeNav === 'frequencia' && 'registros de presença'} de:{' '}
                    <strong className="text-slate-900 font-bold">
                      {getCourseFilterLabel(selectedCourseFilter)}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourseFilter('ALL')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#075e38] hover:text-[#064e2e] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Voltar e ver todas as matérias
                </button>
              </div>
            )}
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

              {/* CARD 3: PRESCHOOL (ORANGE GRADIENT) */}
              <div className="bg-gradient-to-r from-[#ea580c] via-[#c2410c] to-[#9a3412] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
                {/* Background Sun Watermark */}
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#fb923c]/20">
                  <SunWatermark className="w-64 h-64 sm:w-80 sm:h-80" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
                  {/* Preschool Badge */}
                  <PreschoolBadge className="w-24 h-24 sm:w-32 sm:h-32" />

                  {/* Text Content & Action Button */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                      PRESCHOOL
                    </h2>
                    <p className="text-xs sm:text-sm text-orange-100/90 max-w-md font-normal leading-relaxed">
                      Acesse os conteúdos pedagógicos, atividades lúdicas e acompanhamento da Turma Girassol.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('PRESCHOOL');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#c2410c] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Acessar turma</span>
                        <ArrowRight className="w-4 h-4 text-[#c2410c] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: FITNESS FEMININO & BEM-ESTAR (PINK GRADIENT) */}
              <div className="bg-gradient-to-r from-[#db2777] via-[#be185d] to-[#9d174d] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
                {/* Background Heart Watermark */}
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#f472b6]/20">
                  <FitnessWatermark className="w-64 h-64 sm:w-80 sm:h-80" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
                  {/* Women Fitness Badge */}
                  <WomenFitBadge className="w-24 h-24 sm:w-32 sm:h-32" />

                  {/* Text Content & Action Button */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                      ACADEMIA & FITNESS FEMININO
                    </h2>
                    <p className="text-xs sm:text-sm text-pink-100/90 max-w-md font-normal leading-relaxed">
                      Acesse as rotinas de circuito funcional, planos de saúde e cronograma de treinos.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('WOMENS_FITNESS');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#be185d] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Acessar turma</span>
                        <ArrowRight className="w-4 h-4 text-[#be185d] group-hover:translate-x-1 transition-transform" />
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
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between min-h-[460px] cursor-pointer group"
              >
                {/* Background Leaf Outline in Bottom Right */}
                <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none text-emerald-800/5">
                  <LeavesWatermark className="w-48 h-48" />
                </div>

                {/* Top: Green Bell + AVISOS + Count */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[#075e38]">
                      <Bell className="w-6 h-6 stroke-[2.5]" />
                      <span className="font-extrabold tracking-wider text-base sm:text-lg">
                        AVISOS
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#075e38] border border-emerald-200">
                      {generalAnnouncements.length} Ativo(s)
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Direção Geral & Coordenação Think Green
                  </p>

                  {/* List of General Announcements in Card */}
                  <div className="mt-5 space-y-3 relative z-10">
                    {generalAnnouncements.slice(0, 2).map((ann, idx) => {
                      const isUrgent = ann.priority === 'URGENT';
                      const isImportant = ann.priority === 'IMPORTANT';

                      return (
                        <div
                          key={ann.id || idx}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            ann.pinned
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : isUrgent
                              ? 'bg-rose-50/70 border-rose-300'
                              : 'bg-slate-50/90 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {ann.pinned && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded shadow-2xs">
                                  <Pin className="w-2.5 h-2.5" /> Fixado
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                                  isUrgent
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : isImportant
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {isUrgent ? 'Urgente' : isImportant ? 'Importante' : 'Informativo'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ann.createdAt.split(' ')[0]}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                            {ann.title}
                          </h4>

                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                            {ann.content}
                          </p>

                          <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{ann.authorRole}</span>
                            <span className="text-[#075e38]">Todas as Turmas</span>
                          </div>
                        </div>
                      );
                    })}

                    {generalAnnouncements.length > 2 && (
                      <div className="text-center py-1">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          + {generalAnnouncements.length - 2} outro(s) comunicado(s) ativo(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: CLIQUE E SAIBA MAIS */}
                <div className="pt-4 border-t border-slate-100 relative z-10 flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest text-slate-900 group-hover:text-[#075e38] transition-colors uppercase flex items-center gap-2">
                    CLIQUE E SAIBA MAIS
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Abrir mural
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AULAS (EXACT REPLICA DESIGN LANGUAGE) */}
        {activeNav === 'aulas' && (
          <div className="space-y-8">
            {/* Active Document & Pedagogical Reader Banner (Clean, Light & Integrated Design) */}
            {activeLesson && (
              <div
                ref={lessonViewerRef}
                className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#075e38]/25 shadow-md shadow-emerald-950/5 space-y-6 animate-in fade-in slide-in-from-top-3 duration-300"
              >
                {/* Header with Title and Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-emerald-50 text-[#075e38] border border-emerald-200/80 shadow-2xs">
                      <FileText className="w-6 h-6 text-[#075e38]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#075e38] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-2xs">
                          MATERIAL DIDÁTICO • AVA
                        </span>
                        <span className="text-slate-500 text-xs font-semibold">
                          {activeLesson.className || 'Turma Ativa'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-lg sm:text-2xl text-slate-900 mt-1.5 tracking-tight">
                        {activeLesson.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-[#075e38]" />
                          {activeLesson.teacherName}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {activeLesson.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                      title="Imprimir Material"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                      title="Fechar Visualização"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Pedagogical Document Sheet Preview (Simulated Paper Document) */}
                <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200/90 space-y-5">
                  {/* Paper Document Canvas */}
                  <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 max-w-4xl mx-auto space-y-6">
                    {/* Official Document Letterhead */}
                    <div className="border-b-2 border-[#075e38] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#075e38]" />
                          <h4 className="font-black text-xs sm:text-sm tracking-wider uppercase text-[#075e38]">
                            THINK GREEN COMMUNITY CENTER • AVA
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Ambiente Virtual de Aprendizagem • Material Didático Oficial
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                        <p><strong className="text-slate-900">Docente:</strong> {activeLesson.teacherName}</p>
                        <p><strong className="text-slate-900">Data da Aula:</strong> {activeLesson.date}</p>
                      </div>
                    </div>

                    {/* Lesson Document Title */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Conteúdo Programático & Estudo Orientado
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {activeLesson.title}
                      </h2>
                    </div>

                    {/* Written Text & Lesson Content */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#075e38]" />
                        Texto Escrito & Roteiro Pedagógico
                      </h4>
                      <div className="p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200/90 text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
                        <p className="whitespace-pre-line text-slate-800">{activeLesson.description}</p>
                        <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span>Instrução: Leia o material com atenção antes de realizar as atividades.</span>
                          <span className="font-bold text-emerald-800">Leitura Recomendada</span>
                        </div>
                      </div>
                    </div>

                    {/* Attached Documents & Apostilas */}
                    {activeLesson.materials && activeLesson.materials.filter((m) => m.type !== 'LINK').length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#075e38]" />
                          Documentos & Apostilas para Estudo
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeLesson.materials
                            .filter((m) => m.type !== 'LINK')
                            .map((mat) => (
                              <div
                                key={mat.id}
                                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#075e38] transition-all flex items-center justify-between gap-3 shadow-2xs group"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="p-2.5 rounded-xl bg-emerald-50 text-[#075e38] group-hover:bg-[#075e38] group-hover:text-white transition-colors flex-shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-xs text-slate-900 truncate" title={mat.title}>
                                      {mat.title}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Formato {mat.type} {mat.size ? `• ${mat.size}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => alert(`Baixando documento: ${mat.title}`)}
                                  className="px-3.5 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Baixar</span>
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Links Complementares */}
                    {activeLesson.materials && activeLesson.materials.filter((m) => m.type === 'LINK').length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-4 h-4 text-[#533499]" />
                          Links & Leituras Complementares
                        </h4>
                        <div className="space-y-2">
                          {activeLesson.materials
                            .filter((m) => m.type === 'LINK')
                            .map((linkItem) => (
                              <div
                                key={linkItem.id}
                                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-purple-700" />
                                    {linkItem.title}
                                  </p>
                                  <p className="text-[11px] text-purple-700 font-mono mt-0.5 truncate max-w-md">
                                    {linkItem.url}
                                  </p>
                                </div>

                                <a
                                  href={linkItem.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3.5 py-1.5 bg-[#533499] hover:bg-[#432681] text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer shadow-2xs"
                                >
                                  <span>Acessar Link</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Documento didático digital carregado e pronto para estudo.
                  </span>
                  <div className="flex items-center gap-2">
                    {activeLesson.materials?.length > 0 && (
                      <button
                        onClick={() => alert(`Baixando anexos da aula: ${activeLesson.title}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Baixar Documento / Apostila
                      </button>
                    )}
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors border border-slate-200 cursor-pointer"
                    >
                      Fechar Visualização
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. MATERIAIS DIDÁTICOS (PDF, GOOGLE DRIVE E VÍDEOS DE APOIO)             */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#075e38] flex items-center justify-center border border-emerald-200 flex-shrink-0 shadow-2xs">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#075e38] px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Materiais de Apoio
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {didacticMaterials.length} arquivos disponíveis
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      Apostilas em PDF, Google Drive & Vídeos Complementares
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 max-w-sm">
                  Materiais didáticos disponibilizados pelos professores para download, estudo na nuvem e acompanhamento das aulas.
                </p>
              </div>

              {/* Grid of Didactic Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {didacticMaterials
                  .filter((mat) => {
                    if (selectedCourseFilter === 'ALL') return true;
                    if (selectedCourseFilter === 'SOCCER') return mat.classId === 'class_soccer';
                    if (selectedCourseFilter === 'ENGLISH') return mat.classId === 'class_eng_a';
                    if (selectedCourseFilter === 'PRESCHOOL') return mat.classId === 'class_preschool_a';
                    if (selectedCourseFilter === 'WOMENS_FITNESS') return mat.classId === 'class_women_circuit';
                    return true;
                  })
                  .map((mat) => {
                    const isPdf = mat.type === 'PDF';
                    const isDrive = mat.type === 'GOOGLE_DRIVE';
                    const isVideo = mat.type === 'VIDEO_LINK';

                    return (
                      <div
                        key={mat.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                          isPdf
                            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                            : isDrive
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                            : 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                isPdf
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : isDrive
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              }`}
                            >
                              {isPdf && <FileText className="w-3 h-3" />}
                              {isDrive && <FolderOpen className="w-3 h-3" />}
                              {isVideo && <Video className="w-3 h-3" />}
                              {isPdf ? 'Apostila PDF' : isDrive ? 'Google Drive' : 'Vídeo Complementar'}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {mat.fileSize || 'Online'}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug">
                              {mat.title}
                            </h4>
                            {mat.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                {mat.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{mat.className}</span> • Prof(a).{' '}
                            {mat.teacherName}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-1">
                          {isPdf && (
                            <button
                              onClick={() => setActiveMaterialModal(mat)}
                              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Visualizar Apostila PDF</span>
                            </button>
                          )}

                          {isDrive && (
                            <a
                              href={mat.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir no Google Drive</span>
                            </a>
                          )}

                          {isVideo && (
                            <button
                              onClick={() => setActiveMaterialModal(mat)}
                              className="w-full py-2.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Assistir Vídeo de Apoio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

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
                                  <FileText className="w-4 h-4" />
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
                                  <span>Acessar documento</span>
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
                          title: 'Aula 05: Reading & Comprehension: Think Green Story',
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
                                  <FileText className="w-4 h-4" />
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
                                  <span>Acessar documento</span>
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

            {/* 3. PRESCHOOL SECTION */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'PRESCHOOL') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#ea580c] via-[#c2410c] to-[#9a3412] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#fb923c]/20">
                    <SunWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <PreschoolBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Turma Ativa • Educação Infantil & Bilinguismo
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        PRESCHOOL
                      </h2>
                      <p className="text-xs sm:text-sm text-orange-100/90 mt-0.5">
                        Acompanhe as aulas lúdicas, contação de histórias e atividades da Turma Girassol.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Block Alert Banner */}
                {!preschoolAccess.allowed && (
                  <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-rose-950 flex items-center gap-1.5">
                          Acesso à Sala do Preschool Bloqueado
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{preschoolAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Conforme o regimento, a entrada na sala de aula exige quitação no balcão da tesouraria.
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

                {/* Table of Preschool Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">AULA</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">EDUCADOR(A)</th>
                        <th className="py-3.5 px-4">DATA / HORÁRIO</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURAÇÃO</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          id: 'pre_1',
                          title: 'Aula Lúdica 05: As Cores da Natureza & Cantigas em Inglês',
                          desc: 'Atividade de estímulo à criatividade, contação de histórias com fantoches e vocabulário de cores.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '03/03/2026 - Ter • 10:00',
                          duration: '45 min',
                          tag: 'Arte & Natureza',
                        },
                        {
                          id: 'pre_2',
                          title: 'Aula 04: Psicomotricidade & Jogos Coletivos no Espaço Kids',
                          desc: 'Circuitos com obstáculos de espuma, equilíbrio e cooperação em grupo na Turma Girassol.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '26/02/2026 - Qui • 10:00',
                          duration: '45 min',
                          tag: 'Psicomotricidade',
                        },
                        {
                          id: 'pre_3',
                          title: 'Aula 03: Primeiras Palavras em Inglês: Sons dos Animais & Família',
                          desc: 'Cantigas interativas bilingues e associação de cartões ilustrativos coloridos.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '24/02/2026 - Ter • 10:00',
                          duration: '40 min',
                          tag: 'Bilinguismo',
                        },
                        {
                          id: 'pre_4',
                          title: 'Aula 02: Roda de Leitura: O Jardim Secreto e Nossos Sentidos',
                          desc: 'Exploração de texturas, cheiros de ervas aromáticas e expressão oral infantil.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '19/02/2026 - Qui • 10:00',
                          duration: '45 min',
                          tag: 'Leitura',
                        },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div
                                onClick={() => {
                                  if (!preschoolAccess.allowed) {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${preschoolAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson({
                                    id: item.id,
                                    classId: 'class_preschool_a',
                                    className: 'Turma Girassol (4 a 5 anos)',
                                    title: item.title,
                                    description: item.desc,
                                    date: item.date.split(' - ')[0],
                                    teacherId: 'user_teacher_1',
                                    teacherName: item.teacher,
                                    materials: [
                                      {
                                        id: 'mat_pre',
                                        title: `Material Pedagógico - ${item.title}.pdf`,
                                        type: 'PDF',
                                        url: '#',
                                        size: '3.2 MB',
                                      },
                                    ],
                                  });
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 shadow-xs ${
                                  !preschoolAccess.allowed
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'bg-orange-50 hover:bg-[#c2410c] text-orange-700 hover:text-white'
                                }`}
                              >
                                {!preschoolAccess.allowed ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg text-orange-900 font-semibold border border-orange-100">
                              <User className="w-3 h-3 text-[#c2410c]" />
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
                              {!preschoolAccess.allowed ? (
                                <button
                                  onClick={() => {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${preschoolAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
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
                                      classId: 'class_preschool_a',
                                      className: 'Turma Girassol (4 a 5 anos)',
                                      title: item.title,
                                      description: item.desc,
                                      date: item.date.split(' - ')[0],
                                      teacherId: 'user_teacher_1',
                                      teacherName: item.teacher,
                                      materials: [
                                        {
                                          id: 'mat_pre',
                                          title: `Material Pedagógico - ${item.title}.pdf`,
                                          type: 'PDF',
                                          url: '#',
                                          size: '3.2 MB',
                                        },
                                      ],
                                    })
                                  }
                                  className="px-4 py-1.5 bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Acessar documento</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. ACADEMIA & FITNESS FEMININO SECTION */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'WOMENS_FITNESS') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#db2777] via-[#be185d] to-[#9d174d] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#f472b6]/20">
                    <FitnessWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <WomenFitBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Turma Ativa • Saúde & Condicionamento Feminino
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ACADEMIA & FITNESS FEMININO
                      </h2>
                      <p className="text-xs sm:text-sm text-pink-100/90 mt-0.5">
                        Veja todas as sessões de circuito funcional, mobilidade e treinos orientados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Block Alert Banner */}
                {!womenFitAccess.allowed && (
                  <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-rose-950 flex items-center gap-1.5">
                          Acesso à Sala de Treino Feminino Bloqueado
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{womenFitAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Conforme o regimento, o acesso ao ginásio exige quitação no balcão da tesouraria.
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

                {/* Table of Women Fitness Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">SESSÃO</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUTORA</th>
                        <th className="py-3.5 px-4">DATA / HORÁRIO</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURAÇÃO</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          id: 'fit_1',
                          title: 'Sessão 12: Fortalecimento Postural e Treino de Alta Intensidade',
                          desc: 'Sequência de exercícios corporais, alongamento dinâmico e respiração guiada.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '02/03/2026 - Seg • 08:30',
                          duration: '60 min',
                          tag: 'Circuito Funcional',
                        },
                        {
                          id: 'fit_2',
                          title: 'Sessão 11: Core, Glúteos & Estabilidade Lombar',
                          desc: 'Trabalho focado na musculatura profunda do abdômen e prevenção de dores articulares.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '27/02/2026 - Sex • 08:30',
                          duration: '55 min',
                          tag: 'Fortalecimento Core',
                        },
                        {
                          id: 'fit_3',
                          title: 'Sessão 10: Treino Aeróbico com Cordas Navais & Steps',
                          desc: 'Queima calórica, ritmo cardiovascular e coordenação motora com acompanhamento musical.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '25/02/2026 - Qua • 08:30',
                          duration: '60 min',
                          tag: 'Cardio & Resistência',
                        },
                        {
                          id: 'fit_4',
                          title: 'Sessão 09: Mobilidade Articular, Yoga Flow & Relaxamento',
                          desc: 'Alívio do estresse do dia a dia, postura alinhada e recuperação neuromuscular.',
                          teacher: 'Profª. Sarah Johnson',
                          date: '23/02/2026 - Seg • 08:30',
                          duration: '50 min',
                          tag: 'Mobilidade & Yoga',
                        },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div
                                onClick={() => {
                                  if (!womenFitAccess.allowed) {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${womenFitAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson({
                                    id: item.id,
                                    classId: 'class_women_circuit',
                                    className: 'Circuito Funcional Feminino - Manhã',
                                    title: item.title,
                                    description: item.desc,
                                    date: item.date.split(' - ')[0],
                                    teacherId: 'user_teacher_1',
                                    teacherName: item.teacher,
                                    materials: [
                                      {
                                        id: 'mat_fit',
                                        title: `Ficha de Treino - ${item.title}.pdf`,
                                        type: 'PDF',
                                        url: '#',
                                        size: '1.8 MB',
                                      },
                                    ],
                                  });
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 shadow-xs ${
                                  !womenFitAccess.allowed
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'bg-pink-50 hover:bg-[#be185d] text-pink-700 hover:text-white'
                                }`}
                              >
                                {!womenFitAccess.allowed ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5 bg-pink-50 px-2.5 py-1 rounded-lg text-pink-900 font-semibold border border-pink-100">
                              <User className="w-3 h-3 text-[#be185d]" />
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
                              {!womenFitAccess.allowed ? (
                                <button
                                  onClick={() => {
                                    alert(
                                      `🚫 ENTRADA BLOQUEADA:\n\n${womenFitAccess.reason}\n\nDirija-se à Tesouraria para regularizar a parcela no balcão.`
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
                                      classId: 'class_women_circuit',
                                      className: 'Circuito Funcional Feminino - Manhã',
                                      title: item.title,
                                      description: item.desc,
                                      date: item.date.split(' - ')[0],
                                      teacherId: 'user_teacher_1',
                                      teacherName: item.teacher,
                                      materials: [
                                        {
                                          id: 'mat_fit',
                                          title: `Ficha de Treino - ${item.title}.pdf`,
                                          type: 'PDF',
                                          url: '#',
                                          size: '1.8 MB',
                                        },
                                      ],
                                    })
                                  }
                                  className="px-4 py-1.5 bg-[#be185d] hover:bg-[#9d174d] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Acessar documento</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
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
            {/* ========================================================================= */}
            {/* 3. QUIZZES INTERATIVOS COM ÁUDIO (FORMS & D2L/BRIGHTSPACE STYLE)         */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#533499] flex items-center justify-center border border-purple-200 flex-shrink-0 shadow-2xs">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#533499] px-2.5 py-0.5 rounded-full border border-purple-200">
                        Atividades Interativas • Quiz
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        Google Forms & D2L Reference
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      Quizzes com Áudio & Compreensão Auditiva de Inglês
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-500 max-w-sm">
                  Responda perguntas de múltipla escolha, verdadeiro ou falso, preenchimento de lacunas e dissertativas diretamente na plataforma com áudio embutido.
                </div>
              </div>

              {/* Quiz Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes
                  .filter((q) => {
                    if (selectedCourseFilter === 'ALL') return true;
                    if (selectedCourseFilter === 'ENGLISH') return q.classId === 'class_eng_a';
                    if (selectedCourseFilter === 'SOCCER') return q.classId === 'class_soccer';
                    return true;
                  })
                  .map((quiz) => {
                    const studentSub = quizSubmissions.find(
                      (s) => s.quizId === quiz.id && s.studentId === student.studentId
                    );

                    return (
                      <div
                        key={quiz.id}
                        className="p-5 sm:p-6 rounded-2xl border-2 border-purple-100 bg-purple-50/30 hover:border-purple-300 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase bg-purple-100 text-[#533499] px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                              <USAFlagBadge className="w-3.5 h-3.5 inline-block" />
                              {quiz.className}
                            </span>

                            {quiz.audioUrl && (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                                <Headphones className="w-3 h-3 text-emerald-700" /> Áudio Incluso
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                              {quiz.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {quiz.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 pt-1">
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                              {quiz.questions.length} Questões
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-[#075e38]">
                              Valor: {quiz.totalPoints} pts
                            </span>
                            {quiz.timeLimitMinutes && (
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 font-mono">
                                ⏱ {quiz.timeLimitMinutes} min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Submission status & button */}
                        <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                          {studentSub ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                                Nota: {studentSub.score} / {studentSub.maxScore} pts
                              </span>
                              <button
                                onClick={() => handleOpenQuiz(quiz)}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#533499] text-xs font-bold transition-colors cursor-pointer"
                              >
                                Refazer Quiz
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenQuiz(quiz)}
                              className="w-full py-3 px-4 rounded-xl bg-[#533499] hover:bg-[#432681] text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                            >
                              <Play className="w-3.5 h-3.5 text-purple-200" />
                              <span>INICIAR QUIZ INTERATIVO COM ÁUDIO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

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

            {/* 3. PRESCHOOL ATIVIDADES */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'PRESCHOOL') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#ea580c] via-[#c2410c] to-[#9a3412] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#fb923c]/20">
                    <SunWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <PreschoolBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Atividades & Projetos Lúdicos • Turma Girassol
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        PRESCHOOL
                      </h2>
                      <p className="text-xs sm:text-sm text-orange-100/90 mt-0.5">
                        Desenhos, colagens, cantigas e projetos de estímulo pedagógico da criança.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Preschool Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ATIVIDADE</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">EDUCADOR(A)</th>
                        <th className="py-3.5 px-4">PRAZO DE ENTREGA</th>
                        <th className="py-3.5 px-4">STATUS / NOTA</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preschoolAssignments.map((asg) => {
                        const sub = getStudentSubmission(asg.id, asg.title);
                        const hasVisto = sub && (sub.status === 'VISTO' || sub.status === 'AVALIADO');
                        const isSubmittedPending = sub && sub.status === 'PENDENTE_CORRECAO';
                        const displayScore = sub?.score !== undefined ? sub.score : (sub ? asg.maxScore : undefined);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#c2410c] flex items-center justify-center flex-shrink-0 border border-orange-200">
                                  <ListChecks className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm leading-snug">{asg.title}</p>
                                    {asg.category && (
                                      <span className="text-[9px] font-bold uppercase bg-orange-50 text-[#c2410c] px-2 py-0.5 rounded-full border border-orange-200/60">
                                        {asg.category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{asg.instructions}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg text-orange-900 font-semibold border border-orange-100">
                                <User className="w-3 h-3 text-[#c2410c]" />
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
                                <span className="font-bold text-orange-900 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 text-xs inline-flex items-center gap-1 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-[#c2410c]" />
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
                                      feedback: sub?.feedback || 'Parabéns pela dedicação e criatividade no trabalho infantil!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Visto Realizado',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#c2410c] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-orange-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#c2410c]" />
                                  <span>Ver Feedback & Visto</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Sua atividade "${asg.title}" já foi enviada!\n\nResposta enviada: "${sub?.content || 'Trabalho em anexo'}"\n\nA educadora irá avaliar e registrar o visto em breve.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Ver Entrega</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
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

            {/* 4. ACADEMIA & FITNESS FEMININO ATIVIDADES */}
            {(selectedCourseFilter === 'ALL' || selectedCourseFilter === 'WOMENS_FITNESS') && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#db2777] via-[#be185d] to-[#9d174d] p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center justify-end pr-4 text-[#f472b6]/20">
                    <FitnessWatermark className="w-64 h-64 sm:w-72 sm:h-72" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 sm:gap-6">
                    <WomenFitBadge className="w-16 h-16 sm:w-20 sm:h-20" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Acompanhamento & Metas • Circuito Feminino
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ACADEMIA & FITNESS FEMININO
                      </h2>
                      <p className="text-xs sm:text-sm text-pink-100/90 mt-0.5">
                        Diários de hábitos saudáveis, rotinas de alongamento e metas semanais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Women Fitness Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ATIVIDADE</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUTORA</th>
                        <th className="py-3.5 px-4">PRAZO DE ENTREGA</th>
                        <th className="py-3.5 px-4">STATUS / NOTA</th>
                        <th className="py-3.5 px-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {womenFitAssignments.map((asg) => {
                        const sub = getStudentSubmission(asg.id, asg.title);
                        const hasVisto = sub && (sub.status === 'VISTO' || sub.status === 'AVALIADO');
                        const isSubmittedPending = sub && sub.status === 'PENDENTE_CORRECAO';
                        const displayScore = sub?.score !== undefined ? sub.score : (sub ? asg.maxScore : undefined);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#be185d] flex items-center justify-center flex-shrink-0 border border-pink-200">
                                  <ListChecks className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm leading-snug">{asg.title}</p>
                                    {asg.category && (
                                      <span className="text-[9px] font-bold uppercase bg-pink-50 text-[#be185d] px-2 py-0.5 rounded-full border border-pink-200/60">
                                        {asg.category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{asg.instructions}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 hidden md:table-cell font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5 bg-pink-50 px-2.5 py-1 rounded-lg text-pink-900 font-semibold border border-pink-100">
                                <User className="w-3 h-3 text-[#be185d]" />
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
                                <span className="font-bold text-pink-900 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 text-xs inline-flex items-center gap-1 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-[#be185d]" />
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
                                      feedback: sub?.feedback || 'Excelente engajamento e cumprimento das rotinas saudáveis!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Visto Realizado',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#be185d] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-pink-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#be185d]" />
                                  <span>Ver Feedback & Visto</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Sua atividade "${asg.title}" já foi enviada!\n\nResposta enviada: "${sub?.content || 'Trabalho em anexo'}"\n\nA instrutora irá avaliar em breve e validar o visto.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Ver Entrega</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#be185d] hover:bg-[#9d174d] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
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
              <div className="flex items-center gap-3.5">
                {selectedCourseFilter === 'SOCCER' && <SoccerBallBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'ENGLISH' && <USAFlagBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'PRESCHOOL' && <PreschoolBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'WOMENS_FITNESS' && <WomenFitBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'ALL' && (
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Boletim Acadêmico & Provas
                    {selectedCourseFilter !== 'ALL' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {getCourseFilterLabel(selectedCourseFilter)}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Confira suas notas, pesos e a liberação de exames conforme a situação financeira.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isFinalGradeAllowedToView ? (
                  <div className="text-right bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-800">
                      {selectedCourseFilter === 'ALL'
                        ? 'Média Final Homologada'
                        : `Média Final • ${getCourseFilterLabel(selectedCourseFilter)}`}
                    </p>
                    <p className="text-xl font-black text-[#075e38]">{filteredAverageGrade} pts</p>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ✓ Liberada pelo Professor
                    </span>
                  </div>
                ) : (
                  <div className="text-right bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-300">
                    <p className="text-[10px] uppercase font-black text-amber-800">
                      Média Final
                    </p>
                    <p className="text-base sm:text-lg font-black text-amber-900">Em Andamento</p>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Aguardando Final Exam
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informational banner when final grade is pending release / final exam */}
            {!isFinalGradeAllowedToView && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-sm mt-0.5">
                    !
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                      <span>Média Final em Andamento • Fechamento Pendente</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                        Controle do Professor
                      </span>
                    </h4>
                    <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                      Por diretriz pedagógica, a média final não é exibida como definitiva antes da aplicação e lançamento do <strong>Final Exam</strong> e da liberação formal pelo professor. Acompanhe abaixo o andamento de cada avaliação parcial já realizada.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-200 self-start sm:self-auto shrink-0">
                  Status: Parcial em Curso
                </div>
              </div>
            )}

            {/* List of Assessments with Access Gates */}
            <div className="space-y-4">
              {studentAssessments
                .filter((asm) => {
                  const cName = (asm.courseName || '').toLowerCase();
                  const clName = (asm.className || '').toLowerCase();
                  if (selectedCourseFilter === 'SOCCER') {
                    return cName.includes('futebol') || cName.includes('soccer') || clName.includes('futebol') || clName.includes('soccer');
                  }
                  if (selectedCourseFilter === 'ENGLISH') {
                    return cName.includes('inglês') || cName.includes('english') || cName.includes('ingles') || clName.includes('inglês') || clName.includes('english') || clName.includes('ingles');
                  }
                  if (selectedCourseFilter === 'PRESCHOOL') {
                    return (
                      cName.includes('preschool') ||
                      cName.includes('pré-escola') ||
                      cName.includes('pre-escola') ||
                      clName.includes('girassol')
                    );
                  }
                  if (selectedCourseFilter === 'WOMENS_FITNESS') {
                    return (
                      cName.includes('mulher') ||
                      cName.includes('fitness') ||
                      clName.includes('circuito')
                    );
                  }
                  return true;
                })
                .map((asm) => {
                  const access = checkExamAccess(student.studentId, asm);
                  const grade = studentGrades.find((g) => g.assessmentId === asm.id);

                  const cName = (asm.courseName || '').toLowerCase();
                  const clName = (asm.className || '').toLowerCase();
                  let AsmBadge = null;
                  if (cName.includes('futebol') || clName.includes('soccer') || cName.includes('soccer')) {
                    AsmBadge = <SoccerBallBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (cName.includes('inglês') || clName.includes('english') || cName.includes('english') || cName.includes('ingles')) {
                    AsmBadge = <USAFlagBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (cName.includes('preschool') || clName.includes('girassol') || cName.includes('pré-escola')) {
                    AsmBadge = <PreschoolBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (cName.includes('mulher') || clName.includes('circuito') || cName.includes('fitness')) {
                    AsmBadge = <WomenFitBadge className="w-8 h-8 flex-shrink-0" />;
                  }

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
                        <div className="flex items-start gap-3">
                          {AsmBadge}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-base">
                                {asm.title}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">Data: {asm.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {asm.courseName} • Peso: {asm.weight}% • Pontuação Máxima: {asm.maxScore} pts
                            </p>
                          </div>
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
              <div className="flex items-center gap-3.5">
                {selectedCourseFilter === 'SOCCER' && <SoccerBallBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'ENGLISH' && <USAFlagBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'PRESCHOOL' && <PreschoolBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'WOMENS_FITNESS' && <WomenFitBadge className="w-12 h-12 flex-shrink-0" />}
                {selectedCourseFilter === 'ALL' && (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Frequência & Registro de Presenças
                    {selectedCourseFilter !== 'ALL' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {getCourseFilterLabel(selectedCourseFilter)}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Acompanhamento de presenças e faltas registradas pelo professor nas aulas e treinos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] uppercase font-bold text-emerald-800">
                    {selectedCourseFilter === 'ALL' ? 'Presença Registrada' : `Presença • ${getCourseFilterLabel(selectedCourseFilter)}`}
                  </p>
                  <p className="text-xl font-black text-[#075e38]">{filteredAttendanceRate}%</p>
                </div>
              </div>
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs divide-y divide-slate-100">
              {state.attendance
                .filter((att) => {
                  const clName = (att.className || '').toLowerCase();
                  if (selectedCourseFilter === 'SOCCER') {
                    return clName.includes('futebol') || clName.includes('soccer');
                  }
                  if (selectedCourseFilter === 'ENGLISH') {
                    return clName.includes('inglês') || clName.includes('english') || clName.includes('ingles');
                  }
                  if (selectedCourseFilter === 'PRESCHOOL') {
                    return (
                      clName.includes('preschool') ||
                      clName.includes('pré-escola') ||
                      clName.includes('pre-escola') ||
                      clName.includes('girassol')
                    );
                  }
                  if (selectedCourseFilter === 'WOMENS_FITNESS') {
                    return (
                      clName.includes('mulher') ||
                      clName.includes('fitness') ||
                      clName.includes('circuito')
                    );
                  }
                  return true;
                })
                .map((att) => {
                  const rec = att.students.find((s) => s.studentId === student.studentId);
                  const isPresent = rec ? rec.present : true;

                  const clName = (att.className || '').toLowerCase();
                  let AttBadge = null;
                  if (clName.includes('futebol') || clName.includes('soccer')) {
                    AttBadge = <SoccerBallBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (clName.includes('inglês') || clName.includes('english') || clName.includes('ingles')) {
                    AttBadge = <USAFlagBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (clName.includes('preschool') || clName.includes('girassol') || clName.includes('pré-escola')) {
                    AttBadge = <PreschoolBadge className="w-8 h-8 flex-shrink-0" />;
                  } else if (clName.includes('mulher') || clName.includes('circuito') || clName.includes('fitness')) {
                    AttBadge = <WomenFitBadge className="w-8 h-8 flex-shrink-0" />;
                  }

                  return (
                    <div key={att.id} className="py-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {AttBadge}
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{att.className}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Data: {att.date} • Prof(a). {att.teacherName} {att.notes ? `• ${att.notes}` : ''}
                          </p>
                        </div>
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

        {/* TAB 6: FINANCEIRO & MENSALIDADES (MODO VISUALIZAÇÃO / EXTRATO DO ALUNO) */}
        {activeNav === 'financeiro' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-[#075e38]" />
                  Extrato Financeiro & Mensalidades
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Consulte a relação das suas mensalidades, vencimentos e recibos autenticados pelo setor financeiro.
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

            {/* Financial Policy Notice - View Only */}
            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-purple-950 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs text-purple-950">Apenas Visualização e Consulta do Aluno</p>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900">
                    Controle de Acesso
                  </span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Os pagamentos e a respectiva liberação de acesso pedagógico (aulas, avaliações e frequência) são processados <strong>exclusivamente pelo Setor Financeiro / Tesouraria</strong> após o recebimento em <strong>dinheiro físico</strong> ou <strong>transferência bancária</strong>.
                </p>
                <p className="text-[11px] text-purple-800">
                  Apresente seu <strong>ID de Aluno ({student.studentId})</strong> na recepção para efetuar o pagamento. Assim que o operador der baixa no caixa, sua liberação é imediata e o recibo oficial autenticado ficará disponível abaixo para consulta e impressão.
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
                    <th className="pb-3 font-semibold text-right">Comprovante / Situação</th>
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
                        {chg.status === 'PAGO' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rec = studentReceipts.find((r) => r.chargeId === chg.id);
                              if (rec) setSelectedReceipt(rec);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ver Recibo Oficial</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 text-slate-600 rounded-xl text-[11px] font-medium border border-slate-200/60">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Quitação no Balcão (Financeiro)</span>
                          </div>
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

      {/* MODAL 1: MURAL COMPLETO DE AVISOS GERAIS DA DIREÇÃO & COORDENAÇÃO */}
      {isAvisosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative overflow-hidden my-8 max-h-[85vh] flex flex-col justify-between">
            {/* Background Watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none text-emerald-800/5">
              <LeavesWatermark className="w-64 h-64" />
            </div>

            <div className="flex items-start justify-between border-b border-slate-100 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center font-bold shadow-2xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-wider text-[10px] uppercase bg-emerald-100 text-[#075e38] px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Mural Oficial
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Todas as Turmas Simultaneamente
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    Avisos da Direção & Coordenação Pedagógica
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsAvisosModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 my-2 relative z-10 flex-1">
              {generalAnnouncements.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600 text-sm">Nenhum comunicado ativo no momento.</p>
                </div>
              ) : (
                generalAnnouncements.map((ann) => {
                  const isUrgent = ann.priority === 'URGENT';
                  const isImportant = ann.priority === 'IMPORTANT';

                  return (
                    <div
                      key={ann.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        ann.pinned
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                          : isUrgent
                          ? 'bg-rose-50/50 border-rose-300'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                              <Pin className="w-2.5 h-2.5" /> Fixado
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isImportant
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {isUrgent ? 'Urgente' : isImportant ? 'Comunicado Importante' : 'Informativo'}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {ann.authorRole}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">
                          {ann.createdAt}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-2.5">
                        {ann.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line font-medium">
                        {ann.content}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Assinado por: <strong>{ann.authorName}</strong></span>
                        <span className="font-semibold text-emerald-800">Transmitido a todas as turmas</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 relative z-10">
              <button
                onClick={() => setIsAvisosModalOpen(false)}
                className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Fechar Mural de Avisos
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
                ) : selectedClassForModal.theme === 'orange' ? (
                  <PreschoolBadge className="w-12 h-12" />
                ) : selectedClassForModal.theme === 'pink' ? (
                  <WomenFitBadge className="w-12 h-12" />
                ) : (
                  <USAFlagBadge className="w-12 h-12" />
                )}
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedClassForModal.theme === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedClassForModal.theme === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : selectedClassForModal.theme === 'pink'
                        ? 'bg-pink-100 text-pink-800'
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
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
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
                  {selectedClassForModal.classRoom?.teacherName || 'Corpo Docente Think Green'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Local:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.theme === 'green'
                    ? 'Campo de Futebol 1 (Cairo)'
                    : selectedClassForModal.theme === 'orange'
                    ? 'Sala Infantil Girassol - Bloco C'
                    : selectedClassForModal.theme === 'pink'
                    ? 'Estúdio de Treinamento Feminino'
                    : 'Sala 102 - Bloco A'}
                </span>
              </div>
              {(() => {
                const classAccess = selectedClassForModal.classRoom
                  ? checkClassroomAccess(student.studentId, selectedClassForModal.classRoom.id)
                  : { allowed: true };

                return (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Acesso à Sala / Atividade:</span>
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
                    : selectedClassForModal.theme === 'orange'
                    ? 'bg-[#ea580c] hover:bg-[#c2410c]'
                    : selectedClassForModal.theme === 'pink'
                    ? 'bg-[#db2777] hover:bg-[#be185d]'
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
                    Trabalho_Submetido_ThinkGreen.pdf (1.4 MB)
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

      {/* ========================================================================= */}
      {/* MODAL 5: INTERACTIVE QUIZ MODAL WITH AUDIO (REQUIREMENT 3)               */}
      {/* ========================================================================= */}
      {activeQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#533499] flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#533499] px-2.5 py-0.5 rounded-full border border-purple-200">
                      Quiz Interativo
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {activeQuizModal.className}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl mt-0.5">
                    {activeQuizModal.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveQuizModal(null);
                  setQuizSubmissionResult(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Result View */}
            {quizSubmissionResult ? (
              <div className="space-y-6 py-4 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-black text-emerald-950">
                    Quiz Enviado com Sucesso!
                  </h4>
                  <p className="text-sm text-emerald-800 max-w-md mx-auto">
                    Suas respostas foram gravadas no sistema acadêmico do Think Green Platform.
                  </p>
                  <div className="inline-block px-5 py-2.5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Pontuação Registrada</span>
                    <span className="text-2xl font-black text-[#075e38]">
                      {quizSubmissionResult.score} / {quizSubmissionResult.maxScore} pts
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Feedback do Sistema / Professor:
                  </p>
                  <p className="italic text-slate-600">"{quizSubmissionResult.teacherFeedback}"</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Enviado em: {quizSubmissionResult.submittedAt}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setActiveQuizModal(null);
                      setQuizSubmissionResult(null);
                    }}
                    className="px-6 py-3 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Concluir e Voltar ao Portal
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Taking Questions Form */
              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
                {/* 1. AUDIO PLAYER SECTION (REQUIREMENT 3: Áudio de Listening) */}
                {activeQuizModal.audioUrl && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border-2 border-purple-200/90 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-[#533499] animate-pulse" />
                        <span className="font-black text-xs sm:text-sm text-purple-950 uppercase tracking-wide">
                          Faixa de Áudio • Compreensão Auditiva (Listening)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                        English Audio Track
                      </span>
                    </div>

                    <p className="text-xs text-purple-900 font-medium">
                      Ouça o áudio com atenção no reprodutor abaixo para responder as perguntas relacionadas:
                    </p>

                    <div className="bg-white p-2.5 rounded-xl border border-purple-200/70 shadow-2xs">
                      <audio
                        controls
                        className="w-full h-10 accent-[#533499]"
                        src={activeQuizModal.audioUrl}
                      >
                        Seu navegador não suporta a tag de áudio HTML5.
                      </audio>
                    </div>
                  </div>
                )}

                {/* 2. QUESTIONS BUILDER */}
                <div className="space-y-6">
                  {activeQuizModal.questions.map((q, idx) => {
                    const currentAns = quizAnswers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            Questão {idx + 1} de {activeQuizModal.questions.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200/60 px-2 py-0.5 rounded">
                              {q.type === 'MULTIPLE_CHOICE'
                                ? 'Múltipla Escolha'
                                : q.type === 'TRUE_FALSE'
                                ? 'Verdadeiro / Falso'
                                : q.type === 'FILL_BLANK'
                                ? 'Preenchimento de Lacuna'
                                : 'Dissertativa'}
                            </span>
                            <span className="text-xs font-black text-[#075e38] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {q.points} pts
                            </span>
                          </div>
                        </div>

                        <p className="font-bold text-sm text-slate-900 leading-snug">
                          {q.question || q.prompt}
                        </p>

                        {/* Format: Multiple Choice */}
                        {q.type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2 pt-1">
                            {(q.options || []).map((opt) => {
                              const isSelected = currentAns === opt.id;
                              return (
                                <label
                                  key={opt.id}
                                  onClick={() => handleSelectQuizOption(q.id, opt.id)}
                                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-100/70 border-[#533499] text-purple-950 font-bold shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz_q_${q.id}`}
                                    checked={isSelected}
                                    onChange={() => handleSelectQuizOption(q.id, opt.id)}
                                    className="accent-[#533499] w-4 h-4 cursor-pointer"
                                  />
                                  <span className="text-xs leading-normal">{opt.text}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Format: True / False */}
                        {q.type === 'TRUE_FALSE' && (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {((q.options && q.options.length > 0)
                              ? q.options
                              : [
                                  { id: 'true', text: 'True (Verdadeiro)' },
                                  { id: 'false', text: 'False (Falso)' },
                                ]
                            ).map((opt) => {
                              const isSelected =
                                currentAns === opt.id ||
                                (opt.id === 'true' && (currentAns === 'true' || currentAns === true)) ||
                                (opt.id === 'false' && (currentAns === 'false' || currentAns === false));
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleSelectQuizOption(q.id, opt.id)}
                                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#533499] text-white border-[#533499] shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {opt.text}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Format: Fill in the Blank */}
                        {q.type === 'FILL_BLANK' && (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={typeof currentAns === 'string' ? currentAns : ''}
                              onChange={(e) => handleEssayQuizAnswer(q.id, e.target.value)}
                              placeholder="Digite a palavra ou expressão em inglês..."
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:border-[#533499] focus:ring-1 focus:ring-[#533499] focus:outline-hidden"
                            />
                          </div>
                        )}

                        {/* Format: Essay / Dissertativa */}
                        {q.type === 'ESSAY' && (
                          <div className="pt-1 space-y-1.5">
                            <textarea
                              rows={3}
                              value={typeof currentAns === 'string' ? currentAns : ''}
                              onChange={(e) => handleEssayQuizAnswer(q.id, e.target.value)}
                              placeholder="Escreva sua resposta dissertativa em inglês aqui..."
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed focus:border-[#533499] focus:ring-1 focus:ring-[#533499] focus:outline-hidden resize-none"
                            />
                            <div className="text-right text-[10px] text-slate-400">
                              {typeof currentAns === 'string' ? currentAns.length : 0} caracteres
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveQuizModal(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Salvar e Continuar Depois
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitQuiz(student)}
                    className="px-8 py-3 bg-[#533499] hover:bg-[#432681] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>FINALIZAR E ENVIAR RESPOSTAS</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DIDACTIC MATERIAL VIEWER MODAL (REQUIREMENT 1)                   */}
      {/* ========================================================================= */}
      {activeMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-2xs ${
                    activeMaterialModal.type === 'PDF'
                      ? 'bg-rose-100 text-rose-700'
                      : activeMaterialModal.type === 'GOOGLE_DRIVE'
                      ? 'bg-emerald-100 text-[#075e38]'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {activeMaterialModal.type === 'PDF' && <FileText className="w-6 h-6" />}
                  {activeMaterialModal.type === 'GOOGLE_DRIVE' && <FolderOpen className="w-6 h-6" />}
                  {activeMaterialModal.type === 'VIDEO_LINK' && <Video className="w-6 h-6" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {activeMaterialModal.type === 'PDF'
                      ? 'Apostila em PDF'
                      : activeMaterialModal.type === 'GOOGLE_DRIVE'
                      ? 'Pasta do Google Drive'
                      : 'Vídeo Complementar'}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-0.5">
                    {activeMaterialModal.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveMaterialModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-semibold text-slate-800">
                  {activeMaterialModal.description || 'Material oficial para acompanhamento das aulas.'}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap gap-3">
                  <span>Turma: <strong>{activeMaterialModal.className}</strong></span>
                  <span>Professor: <strong>{activeMaterialModal.teacherName}</strong></span>
                  <span>Tamanho: <strong>{activeMaterialModal.fileSize || 'Online'}</strong></span>
                </div>
              </div>

              {activeMaterialModal.type === 'PDF' && (
                <div className="p-8 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-rose-500" />
                  <p className="font-bold text-slate-800 text-sm">
                    {activeMaterialModal.title}.pdf
                  </p>
                  <p className="text-xs text-slate-500">
                    Documento digital formatado e otimizado para visualização e impressão.
                  </p>
                  <button
                    onClick={() => {
                      alert(`Iniciando download da apostila: ${activeMaterialModal.title}.pdf`);
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo PDF Completo</span>
                  </button>
                </div>
              )}

              {activeMaterialModal.type === 'VIDEO_LINK' && (
                <div className="p-6 rounded-2xl bg-slate-900 text-white text-center space-y-3">
                  <Play className="w-12 h-12 mx-auto text-emerald-400" />
                  <p className="font-bold text-sm text-white">
                    {activeMaterialModal.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    Link de vídeo externo para consulta e revisão do conteúdo.
                  </p>
                  <a
                    href={activeMaterialModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Vídeo na Plataforma Externa</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveMaterialModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
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
