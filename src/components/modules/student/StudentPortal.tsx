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
import { AssignedModulesMenu } from '../../common/AssignedModulesMenu';
import { formatCurrency } from '../../../lib/storage';
import { usePwaInstall } from '../../../lib/pwa';
import { MediaAudioPlayer } from '../../common/MediaAudioPlayer';
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
    state,
    logout,
    checkExamAccess,
    checkClassroomAccess,
    submitAssignment,
  } = useApp();

  const { isStandalone, isIos, install } = usePwaInstall();
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const handleInstallApp = async () => {
    if (isIos) {
      setShowInstallHelp(true);
      return;
    }
    const result = await install();
    if (result === 'unavailable') setShowInstallHelp(true);
  };

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
  // ADJUSTMENTS 1, 3, 4, 6 STATE
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
        new Date().toLocaleDateString('en-US') +
        ' ' +
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      answers: studentAnsList,
      teacherFeedback:
        'Congratulations on completing the interactive activity! Your listening comprehension and answers were processed by the system.',
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

  // Get student profile. Never fall back to another student's record: until the
  // signed-in student is found we render a neutral placeholder.
  const student = state.students.find(
    (s) => s.studentId === currentUser.studentId
  ) || {
    id: 'student-placeholder',
    studentId: '',
    name: currentUser.name || 'Student',
    phone: '',
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
      : 0;

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
      : 0;

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

  const matchesCourseFilter = (
    filter: 'ALL' | 'SOCCER' | 'ENGLISH' | 'PRESCHOOL' | 'WOMENS_FITNESS',
    source: { classId?: string; className?: string; courseName?: string }
  ) => {
    if (filter === 'ALL') return true;
    const classRecord = source.classId
      ? state.classes.find((c) => c.id === source.classId)
      : undefined;
    const text = [
      source.className,
      source.courseName,
      classRecord?.name,
      classRecord?.courseName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (filter === 'SOCCER') return text.includes('futebol') || text.includes('soccer');
    if (filter === 'ENGLISH') {
      return (
        text.includes('inglês') || text.includes('ingles') || text.includes('english')
      );
    }
    if (filter === 'PRESCHOOL') {
      return (
        text.includes('preschool') ||
        text.includes('pré-escola') ||
        text.includes('pre-escola') ||
        text.includes('girassol')
      );
    }
    if (filter === 'WOMENS_FITNESS') {
      return (
        text.includes('mulher') ||
        text.includes('fitness') ||
        text.includes('circuito')
      );
    }
    return true;
  };

  const getCourseFilterLabel = (filter: 'ALL' | 'SOCCER' | 'ENGLISH' | 'PRESCHOOL' | 'WOMENS_FITNESS') => {
    switch (filter) {
      case 'SOCCER':
        return 'Soccer Class';
      case 'ENGLISH':
        return 'English Class';
      case 'PRESCHOOL':
        return 'Preschool';
      case 'WOMENS_FITNESS':
        return "Women's Fitness";
      default:
        return 'All Subjects';
    }
  };

  const getEnrollmentStatusLabel = (status?: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Active';
      case 'INATIVO':
        return 'Inactive';
      case 'BLOQUEADO':
        return 'Blocked';
      case 'PENDENTE':
        return 'Pending';
      default:
        return status || 'Active';
    }
  };

  // Real counters for the subject cards (no fictional numbers).
  const getCategoryStats = (
    filter: 'ALL' | 'SOCCER' | 'ENGLISH' | 'PRESCHOOL' | 'WOMENS_FITNESS'
  ) => {
    const lessonCount = studentLessons.filter((lesson) =>
      matchesCourseFilter(filter, { classId: lesson.classId, className: lesson.className })
    ).length;

    const assignmentCount = studentAssignments.filter((assignment) =>
      matchesCourseFilter(filter, { classId: assignment.classId, className: assignment.className })
    ).length;

    const assessmentIds = studentAssessments
      .filter((assessment) =>
        matchesCourseFilter(filter, {
          classId: assessment.classId,
          className: assessment.className,
          courseName: assessment.courseName,
        })
      )
      .map((assessment) => assessment.id);

    const grades = studentGrades.filter((grade) => assessmentIds.includes(grade.assessmentId));
    const average = grades.length
      ? Math.round(grades.reduce((acc, grade) => acc + grade.percentage, 0) / grades.length)
      : 0;

    let attended = 0;
    let total = 0;
    state.attendance.forEach((att) => {
      if (!matchesCourseFilter(filter, { classId: att.classId, className: att.className })) return;
      const record = att.students.find((item) => item.studentId === student.studentId);
      if (record) {
        total += 1;
        if (record.present) attended += 1;
      }
    });
    const attendance = total ? Math.round((attended / total) * 100) : 0;

    return { lessonCount, assignmentCount, average, attendance };
  };

  const allStats = getCategoryStats('ALL');
  const soccerStats = getCategoryStats('SOCCER');
  const englishStats = getCategoryStats('ENGLISH');
  const preschoolStats = getCategoryStats('PRESCHOOL');
  const womenFitStats = getCategoryStats('WOMENS_FITNESS');

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
    if (matchingGrades.length === 0) return 0;
    return Math.round(matchingGrades.reduce((acc, curr) => acc + curr.percentage, 0) / matchingGrades.length);
  }, [selectedCourseFilter, studentAssessments, studentGrades, averageGrade]);

  // Requirement 4: Verification of Final Grade Release by Teacher & Final Exam completion
  const isFinalGradeAllowedToView = React.useMemo(() => {
    const targetClasses = state.classes.filter((c) => {
      if (selectedCourseFilter === 'ALL') return studentClassIds.includes(c.id);
      return (
        studentClassIds.includes(c.id) &&
        matchesCourseFilter(selectedCourseFilter, {
          classId: c.id,
          className: c.name,
          courseName: c.courseName,
        })
      );
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
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  }, [selectedCourseFilter, state.attendance, student.studentId, attendanceRate]);

  // Classes linked to the student: only the classes they are enrolled in
  const myClasses = state.classes.filter((c) => studentClassIds.includes(c.id));

  const soccerEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('futebol') ||
      e.courseName.toLowerCase().includes('soccer')
  );

  const soccerClass = myClasses.find(
    (c) =>
      c.id === soccerEnrollment?.classId ||
      c.name.toLowerCase().includes('futebol') ||
      c.name.toLowerCase().includes('soccer')
  );

  const englishEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('inglês') ||
      e.courseName.toLowerCase().includes('ingles') ||
      e.courseName.toLowerCase().includes('english')
  );

  const englishClass = myClasses.find(
    (c) =>
      c.id === englishEnrollment?.classId ||
      c.name.toLowerCase().includes('inglês') ||
      c.name.toLowerCase().includes('ingles') ||
      c.name.toLowerCase().includes('english')
  );

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

  const preschoolClass = myClasses.find(
    (c) =>
      c.id === preschoolEnrollment?.classId ||
      c.courseId === 'course_preschool' ||
      c.name.toLowerCase().includes('girassol')
  );

  const preschoolAccess = preschoolClass
    ? checkClassroomAccess(student.studentId, preschoolClass.id)
    : { allowed: true };

  const womenFitEnrollment = studentEnrollments.find(
    (e) =>
      e.courseName.toLowerCase().includes('mulher') ||
      e.courseName.toLowerCase().includes('fitness') ||
      e.courseName.toLowerCase().includes('circuito')
  ) || studentEnrollments.find((e) => e.courseId === 'course_women_fit');

  const womenFitClass = myClasses.find(
    (c) =>
      c.id === womenFitEnrollment?.classId ||
      c.courseId === 'course_women_fit' ||
      c.name.toLowerCase().includes('circuito')
  );

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

  const soccerAssignments = state.assignments.filter(
    (a) =>
      a.classId === 'class_football_sub15' ||
      a.className?.toLowerCase().includes('futebol') ||
      a.className?.toLowerCase().includes('soccer')
  );

  const englishAssignments = state.assignments.filter(
    (a) =>
      a.classId === 'class_eng_a' ||
      a.className?.toLowerCase().includes('inglês') ||
      a.className?.toLowerCase().includes('ingles') ||
      a.className?.toLowerCase().includes('english')
  );

  const preschoolAssignments = state.assignments.filter(
    (a) =>
      a.classId === 'class_preschool_a' ||
      a.className?.toLowerCase().includes('preschool') ||
      a.className?.toLowerCase().includes('pré-escola') ||
      a.className?.toLowerCase().includes('pre-escola') ||
      a.className?.toLowerCase().includes('girassol')
  );

  const womenFitAssignments = state.assignments.filter(
    (a) =>
      a.classId === 'class_women_circuit' ||
      a.className?.toLowerCase().includes('mulher') ||
      a.className?.toLowerCase().includes('fitness') ||
      a.className?.toLowerCase().includes('circuito')
  );


  // Real lessons/tasks registered by teachers (no demo content).
  const normalizeLessonText = (value?: string) => (value || '').toLowerCase();
  const buildLessonRows = (classId: string, keywords: string[]) =>
    state.lessons
      .filter(
        (lesson) =>
          lesson.classId === classId ||
          keywords.some((keyword) => normalizeLessonText(lesson.className).includes(keyword))
      )
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        desc: lesson.description,
        teacher: lesson.teacherName || 'Teacher not assigned',
        date: lesson.date,
        duration: '',
        raw: lesson,
      }));

  const soccerLessons = buildLessonRows('class_football_sub15', ['futebol', 'soccer']);
  const englishLessons = buildLessonRows('class_eng_a', ['inglês', 'ingles', 'english']);
  const preschoolLessons = buildLessonRows('class_preschool_a', [
    'preschool',
    'pré-escola',
    'pre-escola',
    'girassol',
  ]);
  const womenFitLessons = buildLessonRows('class_women_circuit', [
    'mulher',
    'fitness',
    'circuito',
  ]);

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

          {/* Center: STUDENT PORTAL Title */}
          <div className="text-center hidden md:block">
            <h1 className="text-base sm:text-xl font-bold tracking-[0.25em] text-slate-900 uppercase">
              STUDENT PORTAL
            </h1>
          </div>

          {/* Right: User Profile Pill & Notification Bell */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            <AssignedModulesMenu />
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
                    Student
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
                    <p className="text-xs text-slate-500">{student.city || 'Cairo, Egypt'}</p>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-1 font-mono"
                    title="Copy Student ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {student.studentId}
                  </button>
                </div>

                <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center py-1">
                    <span>Enrollment Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {getEnrollmentStatusLabel(student.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Financial Status:</span>
                    <span
                      className={`font-bold ${
                        hasPendingCharges ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                      } px-2 py-0.5 rounded-full`}
                    >
                      {hasPendingCharges ? 'Pending' : '100% Up to Date'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {!isStandalone && (
                    <>
                      <button
                        onClick={handleInstallApp}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download the app</span>
                      </button>
                      {showInstallHelp && (
                        <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg p-2">
                          {isIos
                            ? 'On iPhone/iPad (Safari): tap Share and choose "Add to Home Screen".'
                            : 'Open the browser menu (⋮) and choose "Install app".'}
                        </p>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
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
              aria-label="Notices and Notifications"
            >
              <Bell className="w-6 h-6" />
              {generalAnnouncements.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#075e38] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {generalAnnouncements.length}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#075e38]" />
                    <span className="font-bold text-slate-900 text-sm">
                      Student Notices ({generalAnnouncements.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {generalAnnouncements.length === 0 ? (
                    <p className="py-6 text-center text-slate-400 text-xs font-medium">
                      No notices published at the moment.
                    </p>
                  ) : (
                    generalAnnouncements.slice(0, 6).map((announcement) => (
                      <div
                        key={announcement.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          setIsAvisosModalOpen(true);
                        }}
                        className="py-3 cursor-pointer hover:bg-emerald-50/50 px-2 rounded-xl transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-[#075e38] uppercase truncate">
                            {announcement.title}
                          </span>
                          <span className="text-slate-400 flex-shrink-0">
                            {announcement.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                    ))
                  )}
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
          {/* 1. Subjects Tab */}
          <button
            onClick={() => handleNavChange('materias')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'materias'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Subjects</span>
          </button>

          {/* 2. Lessons Tab */}
          <button
            onClick={() => handleNavChange('aulas')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'aulas'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Lessons</span>
          </button>

          {/* 3. Assignments Tab */}
          <button
            onClick={() => handleNavChange('atividades')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'atividades'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Assignments</span>
          </button>

          {/* 4. Grades Tab */}
          <button
            onClick={() => handleNavChange('notas')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'notas'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Grades</span>
          </button>

          {/* 5. Attendance Tab */}
          <button
            onClick={() => handleNavChange('frequencia')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'frequencia'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Attendance</span>
          </button>

          {/* 6. Financial Tab */}
          <button
            onClick={() => handleNavChange('financeiro')}
            className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs flex-shrink-0 ${
              activeNav === 'financeiro'
                ? 'bg-[#075e38] text-white shadow-emerald-900/10'
                : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Financial</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2.5 INTERACTIVE SUBJECT SELECTOR (Lessons, Assignments, Grades, Attendance)    */}
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
                      Enrolled Subjects
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activeNav === 'aulas' && 'Click the subject icon to view the lessons'}
                      {activeNav === 'atividades' && 'Click the subject icon to view the assignments'}
                      {activeNav === 'notas' && 'Click the subject icon to view the report card'}
                      {activeNav === 'frequencia' && 'Click the subject icon to view attendance'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {activeNav === 'aulas' && 'Access lessons, videos, and study guides by subject'}
                    {activeNav === 'atividades' && 'Track deadlines and submit your work by subject'}
                    {activeNav === 'notas' && 'View assessments, grades, and weights by subject'}
                    {activeNav === 'frequencia' && 'Track your attendance and training records by subject'}
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
                  <span>View All Subjects</span>
                </button>
              )}
            </div>

            {/* Grid of Subject Cards with Distinctive Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. ALL SUBJECTS */}
              {myClasses.length > 0 && (
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
                      General
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      All Subjects
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {activeNav === 'aulas' && `${allStats.lessonCount} Lessons`}
                    {activeNav === 'atividades' && `${allStats.assignmentCount} Assignments`}
                    {activeNav === 'notas' && 'Overall Average'}
                    {activeNav === 'frequencia' && 'Attendance'}
                  </span>
                  <span className="font-black text-slate-900">
                    {activeNav === 'aulas' && 'Total'}
                    {activeNav === 'atividades' && 'Active'}
                    {activeNav === 'notas' && `${averageGrade} pts`}
                    {activeNav === 'frequencia' && `${attendanceRate}%`}
                  </span>
                </div>
              </button>
              )}

              {/* 2. SOCCER CLASS */}
              {soccerClass && (
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
                      Soccer
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Soccer Class
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {soccerClass?.name?.split(' - ')[0] || 'U-15'}
                  </span>
                  <span className="font-black text-[#075e38]">
                    {activeNav === 'aulas' && `${soccerStats.lessonCount} Lessons`}
                    {activeNav === 'atividades' && `${soccerStats.assignmentCount} Tasks`}
                    {activeNav === 'notas' && `${soccerStats.average} pts`}
                    {activeNav === 'frequencia' && `${soccerStats.attendance}%`}
                  </span>
                </div>
              </button>
              )}

              {/* 3. ENGLISH CLASS */}
              {englishClass && (
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
                      Bilingual
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      English Class
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {englishClass?.name?.split(' (')[0] || 'Basic A'}
                  </span>
                  <span className="font-black text-[#533499]">
                    {activeNav === 'aulas' && `${englishStats.lessonCount} Lessons`}
                    {activeNav === 'atividades' && `${englishStats.assignmentCount} Tasks`}
                    {activeNav === 'notas' && `${englishStats.average} pts`}
                    {activeNav === 'frequencia' && `${englishStats.attendance}%`}
                  </span>
                </div>
              </button>
              )}

              {/* 4. PRESCHOOL */}
              {preschoolClass && (
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
                      Early Childhood
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
                    {activeNav === 'aulas' && `${preschoolStats.lessonCount} Lessons`}
                    {activeNav === 'atividades' && `${preschoolStats.assignmentCount} Tasks`}
                    {activeNav === 'notas' && `${preschoolStats.average} pts`}
                    {activeNav === 'frequencia' && `${preschoolStats.attendance}%`}
                  </span>
                </div>
              </button>
              )}

              {/* 5. WOMEN'S FITNESS */}
              {womenFitClass && (
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
                      Health & Training
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Women's Fitness
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                    {womenFitClass?.name?.split(' - ')[0] || 'Circuit'}
                  </span>
                  <span className="font-black text-[#be185d]">
                    {activeNav === 'aulas' && `${womenFitStats.lessonCount} Lessons`}
                    {activeNav === 'atividades' && `${womenFitStats.assignmentCount} Goals`}
                    {activeNav === 'notas' && `${womenFitStats.average} pts`}
                    {activeNav === 'frequencia' && `${womenFitStats.attendance}%`}
                  </span>
                </div>
              </button>
              )}
            </div>

            {/* Active filter notification banner */}
            {selectedCourseFilter !== 'ALL' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[#075e38] animate-pulse"></span>
                  <span>
                    Showing only{' '}
                    {activeNav === 'aulas' && 'lessons'}
                    {activeNav === 'atividades' && 'assignments'}
                    {activeNav === 'notas' && 'assessments and exams'}
                    {activeNav === 'frequencia' && 'attendance records'} for:{' '}
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
                  Go back and view all subjects
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ACTIVE TAB CONTENT                                                     */}
        {/* ========================================================================= */}

        {/* TAB 1: SUBJECTS */}
        {activeNav === 'materias' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Stack of Course Cards (7 cols or ~68%) */}
            <div className="lg:col-span-8 space-y-6">
              {/* CARD 1: SOCCER CLASS (GREEN GRADIENT) */}
              {soccerClass && (
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
                      Access your class content, assignments, and resources.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('SOCCER');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#075e38] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Access class</span>
                        <ArrowRight className="w-4 h-4 text-[#075e38] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* CARD 2: ENGLISH CLASS (PURPLE GRADIENT) */}
              {englishClass && (
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
                      Access your class content, assignments, and resources.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('ENGLISH');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#533499] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Access class</span>
                        <ArrowRight className="w-4 h-4 text-[#533499] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* CARD 3: PRESCHOOL (ORANGE GRADIENT) */}
              {preschoolClass && (
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
                      Access the educational content, playful activities, and progress tracking for the Girassol Class.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('PRESCHOOL');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#c2410c] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Access class</span>
                        <ArrowRight className="w-4 h-4 text-[#c2410c] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* CARD 4: WOMEN'S FITNESS & WELLNESS (PINK GRADIENT) */}
              {womenFitClass && (
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
                      GYM & WOMEN'S FITNESS
                    </h2>
                    <p className="text-xs sm:text-sm text-pink-100/90 max-w-md font-normal leading-relaxed">
                      Access functional circuit routines, health plans, and training schedules.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('WOMENS_FITNESS');
                          handleNavChange('aulas');
                        }}
                        className="bg-white hover:bg-slate-50 text-[#be185d] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>Access class</span>
                        <ArrowRight className="w-4 h-4 text-[#be185d] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Right Column: NOTICES CARD (4 cols or ~32%) */}
            <div className="lg:col-span-4">
              <div
                onClick={() => setIsAvisosModalOpen(true)}
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between min-h-[460px] cursor-pointer group"
              >
                {/* Background Leaf Outline in Bottom Right */}
                <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none text-emerald-800/5">
                  <LeavesWatermark className="w-48 h-48" />
                </div>

                {/* Top: Green Bell + NOTICES + Count */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[#075e38]">
                      <Bell className="w-6 h-6 stroke-[2.5]" />
                      <span className="font-extrabold tracking-wider text-base sm:text-lg">
                        NOTICES
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#075e38] border border-emerald-200">
                      {generalAnnouncements.length} Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-1">
                    School Administration & Think Green Coordination
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
                                  <Pin className="w-2.5 h-2.5" /> Pinned
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
                                {isUrgent ? 'Urgent' : isImportant ? 'Important' : 'Informational'}
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
                            <span className="text-[#075e38]">All Classes</span>
                          </div>
                        </div>
                      );
                    })}

                    {generalAnnouncements.length > 2 && (
                      <div className="text-center py-1">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          + {generalAnnouncements.length - 2} more active notice(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: CLICK TO LEARN MORE */}
                <div className="pt-4 border-t border-slate-100 relative z-10 flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest text-slate-900 group-hover:text-[#075e38] transition-colors uppercase flex items-center gap-2">
                    CLICK TO LEARN MORE
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Open notice board
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LESSONS (EXACT REPLICA DESIGN LANGUAGE) */}
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
                          COURSE MATERIAL • AVA
                        </span>
                        <span className="text-slate-500 text-xs font-semibold">
                          {activeLesson.className || 'Active Class'}
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
                      title="Print Material"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                      title="Close View"
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
                          Virtual Learning Environment • Official Course Material
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                        <p><strong className="text-slate-900">Teacher:</strong> {activeLesson.teacherName}</p>
                        <p><strong className="text-slate-900">Lesson Date:</strong> {activeLesson.date}</p>
                      </div>
                    </div>

                    {/* Lesson Document Title */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Syllabus & Guided Study
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        {activeLesson.title}
                      </h2>
                    </div>

                    {/* Written Text & Lesson Content */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#075e38]" />
                        Written Text & Teaching Guide
                      </h4>
                      <div className="p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200/90 text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
                        <p className="whitespace-pre-line text-slate-800">{activeLesson.description}</p>
                        <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span>Instruction: Read the material carefully before completing the assignments.</span>
                          <span className="font-bold text-emerald-800">Recommended Reading</span>
                        </div>
                      </div>
                    </div>

                    {/* Attached Documents & Booklets */}
                    {activeLesson.materials && activeLesson.materials.filter((m) => m.type !== 'LINK').length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#075e38]" />
                          Documents & Study Booklets
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
                                      Format {mat.type} {mat.size ? `• ${mat.size}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                                  View only
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Supplementary Links */}
                    {activeLesson.materials && activeLesson.materials.filter((m) => m.type === 'LINK').length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-4 h-4 text-[#533499]" />
                          Links & Further Reading
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
                                  <span>Open Link</span>
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
                    Digital course document loaded and ready for study.
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-bold text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Download disabled — view only
                    </span>
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors border border-slate-200 cursor-pointer"
                    >
                      Close View
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. COURSE MATERIALS (PDF, GOOGLE DRIVE, AND SUPPORT VIDEOS)            */}
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
                        Support Materials
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {didacticMaterials.length} files available
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      PDF Booklets, Google Drive & Supplementary Videos
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 max-w-sm">
                  Course materials provided by teachers for study, cloud reference, and following the lessons.
                </p>
              </div>

              {/* Grid of Didactic Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {didacticMaterials
                  .filter((mat) => matchesCourseFilter(selectedCourseFilter, mat))
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
                              {isPdf ? 'PDF Booklet' : isDrive ? 'Google Drive' : 'Supplementary Video'}
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
                              <span>View PDF Booklet</span>
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
                              <span>Open in Google Drive</span>
                            </a>
                          )}

                          {isVideo && (
                            <button
                              onClick={() => setActiveMaterialModal(mat)}
                              className="w-full py-2.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Watch Support Video</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 1. SOCCER CLASS SECTION */}
            {soccerClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'SOCCER') && (
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
                        Active Class • Youth Soccer
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        SOCCER CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                        See all scheduled lessons for your class.
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
                          Access to Classroom & Soccer Training Blocked
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{soccerAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Under institutional policy, entry to the field and access to lessons require settling the outstanding installment at the treasury counter.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Go to Financial</span>
                    </button>
                  </div>
                )}

                {/* Table of Soccer Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">LESSON</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">TEACHER</th>
                        <th className="py-3.5 px-4">DATE / TIME</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURATION</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {soccerLessons.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => {
                                  if (!soccerAccess.allowed) {
                                    alert(
                                      `🚫 ENTRY BLOCKED:\n\n${soccerAccess.reason}\n\nPlease go to the Treasury to settle the payment in cash at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson(item.raw);
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
                                      `🚫 ENTRY BLOCKED:\n\n${soccerAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Blocked</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson(item.raw)
                                  }
                                  className="px-4 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Open document</span>
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
                                  title="Options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeActionDropdown === item.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-left animate-in fade-in">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Lesson link copied!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-[#075e38]" /> Copy lesson link
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Lesson link copied!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Link
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
            {englishClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'ENGLISH') && (
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
                        Active Class • English Language Course
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ENGLISH CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                        See all scheduled lessons for your class.
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
                          Access to English Classroom Blocked
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{englishAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Under institutional policy, entry to the classroom and access to lessons require settling the outstanding installment at the treasury counter.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Go to Financial</span>
                    </button>
                  </div>
                )}

                {/* Table of English Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">LESSON</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">TEACHER</th>
                        <th className="py-3.5 px-4">DATE / TIME</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURATION</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {englishLessons.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => {
                                  if (!englishAccess.allowed) {
                                    alert(
                                      `🚫 ENTRY BLOCKED:\n\n${englishAccess.reason}\n\nPlease go to the Treasury to settle the payment in cash at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson(item.raw);
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
                                      `🚫 ENTRY BLOCKED:\n\n${englishAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Blocked</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson(item.raw)
                                  }
                                  className="px-4 py-1.5 bg-[#533499] hover:bg-[#432681] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Open document</span>
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
                                  title="Options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeActionDropdown === item.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-left animate-in fade-in">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Lesson link copied!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-[#533499]" /> Copy lesson link
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Lesson link copied!');
                                        setActiveActionDropdown(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Link
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
            {preschoolClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'PRESCHOOL') && (
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
                        Active Class • Early Childhood Education & Bilingualism
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        PRESCHOOL
                      </h2>
                      <p className="text-xs sm:text-sm text-orange-100/90 mt-0.5">
                        Follow the playful lessons, storytelling, and activities of the Girassol Class.
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
                          Access to Preschool Classroom Blocked
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{preschoolAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Under school policy, entering the classroom requires payment at the treasury counter.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Go to Financial</span>
                    </button>
                  </div>
                )}

                {/* Table of Preschool Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">LESSON</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">EDUCATOR</th>
                        <th className="py-3.5 px-4">DATE / TIME</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURATION</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preschoolLessons.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div
                                onClick={() => {
                                  if (!preschoolAccess.allowed) {
                                    alert(
                                      `🚫 ENTRY BLOCKED:\n\n${preschoolAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson(item.raw);
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
                                      `🚫 ENTRY BLOCKED:\n\n${preschoolAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Blocked</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson(item.raw)
                                  }
                                  className="px-4 py-1.5 bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Open document</span>
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

            {/* 4. GYM & WOMEN'S FITNESS SECTION */}
            {womenFitClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'WOMENS_FITNESS') && (
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
                        Active Class • Women's Health & Fitness
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        GYM & WOMEN'S FITNESS
                      </h2>
                      <p className="text-xs sm:text-sm text-pink-100/90 mt-0.5">
                        See all functional circuit sessions, mobility, and guided training.
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
                          Access to Women's Training Room Blocked
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">{womenFitAccess.reason}</p>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          Under school policy, access to the gym requires payment at the treasury counter.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavChange('financeiro')}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Go to Financial</span>
                    </button>
                  </div>
                )}

                {/* Table of Women Fitness Lessons */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">SESSION</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUCTOR</th>
                        <th className="py-3.5 px-4">DATE / TIME</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">DURATION</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {womenFitLessons.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div
                                onClick={() => {
                                  if (!womenFitAccess.allowed) {
                                    alert(
                                      `🚫 ENTRY BLOCKED:\n\n${womenFitAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                    return;
                                  }
                                  setActiveLesson(item.raw);
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
                                      `🚫 ENTRY BLOCKED:\n\n${womenFitAccess.reason}\n\nPlease go to the Treasury to settle the installment at the counter.`
                                    );
                                    handleNavChange('financeiro');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-300"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Blocked</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActiveLesson(item.raw)
                                  }
                                  className="px-4 py-1.5 bg-[#be185d] hover:bg-[#9d174d] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Open document</span>
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

        {/* TAB 3: ASSIGNMENTS & COURSEWORK (EXACT REPLICA DESIGN LANGUAGE) */}
        {activeNav === 'atividades' && (
          <div className="space-y-8">
            {/* ========================================================================= */}
            {/* 3. INTERACTIVE QUIZZES WITH AUDIO (FORMS & D2L/BRIGHTSPACE STYLE)    */}
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
                        Interactive Assignments • Quiz
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        Google Forms & D2L Reference
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      Quizzes with Audio & English Listening Comprehension
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-500 max-w-sm">
                  Answer multiple-choice, true or false, fill-in-the-blank, and essay questions directly on the platform with embedded audio.
                </div>
              </div>

              {/* Quiz Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes
                  .filter((q) => matchesCourseFilter(selectedCourseFilter, q))
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
                                <Headphones className="w-3 h-3 text-emerald-700" /> Audio Included
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
                              {quiz.questions.length} Questions
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-[#075e38]">
                              Value: {quiz.totalPoints} pts
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
                                Grade: {studentSub.score} / {studentSub.maxScore} pts
                              </span>
                              <button
                                onClick={() => handleOpenQuiz(quiz)}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#533499] text-xs font-bold transition-colors cursor-pointer"
                              >
                                Retake Quiz
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenQuiz(quiz)}
                              className="w-full py-3 px-4 rounded-xl bg-[#533499] hover:bg-[#432681] text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                            >
                              <Play className="w-3.5 h-3.5 text-purple-200" />
                              <span>START INTERACTIVE QUIZ WITH AUDIO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 1. SOCCER CLASS ASSIGNMENTS */}
            {soccerClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'SOCCER') && (
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
                        Assignments & Training • Soccer
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        SOCCER CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                        Graded assignments, training logs, and practical reports for the class.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Soccer Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ASSIGNMENT</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUCTOR</th>
                        <th className="py-3.5 px-4">DUE DATE</th>
                        <th className="py-3.5 px-4">STATUS / GRADE</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
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
                                {asg.teacherName || 'Teacher not assigned'}
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
                                  Reviewed • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Submitted • Awaiting Review
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pending Submission
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Teacher not assigned',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Assignment viewed and approved by the teacher.',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Reviewed',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075e38] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View Feedback & Review</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Your assignment "${asg.title}" has already been submitted!\n\nSubmitted response: "${sub?.content || 'Attached work'}"\n\nThe teacher will review it shortly and mark it as reviewed.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>View Submission</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Submit assignment</span>
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

            {/* 2. ENGLISH CLASS ASSIGNMENTS */}
            {englishClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'ENGLISH') && (
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
                        Assignments & Tasks • English
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        ENGLISH CLASS
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                        Essays, grammar exercises, and graded quizzes for the class.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of English Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ASSIGNMENT</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">TEACHER</th>
                        <th className="py-3.5 px-4">DUE DATE</th>
                        <th className="py-3.5 px-4">STATUS / GRADE</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
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
                                {asg.teacherName || 'Teacher not assigned'}
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
                                  Reviewed • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Submitted • Awaiting Review
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pending Submission
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Teacher not assigned',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Excellent performance on the assignment!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Reviewed',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#533499] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-purple-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#533499]" />
                                  <span>View Feedback & Review</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Your assignment "${asg.title}" has already been submitted!\n\nSubmitted response: "${sub?.content || 'Attached work'}"\n\nThe teacher will review it shortly and mark it as reviewed.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>View Submission</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#533499] hover:bg-[#432681] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Submit assignment</span>
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

            {/* 3. PRESCHOOL ASSIGNMENTS */}
            {preschoolClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'PRESCHOOL') && (
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
                        Playful Activities & Projects • Girassol Class
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        PRESCHOOL
                      </h2>
                      <p className="text-xs sm:text-sm text-orange-100/90 mt-0.5">
                        Drawings, collages, songs, and educational enrichment projects for the child.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Preschool Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ASSIGNMENT</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">EDUCATOR</th>
                        <th className="py-3.5 px-4">DUE DATE</th>
                        <th className="py-3.5 px-4">STATUS / GRADE</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
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
                                {asg.teacherName || 'Teacher not assigned'}
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
                                  Reviewed • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Submitted • Awaiting Review
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pending Submission
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Teacher not assigned',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Congratulations on the dedication and creativity in the children\'s work!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Reviewed',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#c2410c] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-orange-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#c2410c]" />
                                  <span>View Feedback & Review</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Your assignment "${asg.title}" has already been submitted!\n\nSubmitted response: "${sub?.content || 'Attached work'}"\n\nThe educator will review it and record the review shortly.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>View Submission</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Submit assignment</span>
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

            {/* 4. GYM & WOMEN'S FITNESS ASSIGNMENTS */}
            {womenFitClass && (selectedCourseFilter === 'ALL' || selectedCourseFilter === 'WOMENS_FITNESS') && (
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
                        Tracking & Goals • Women's Circuit
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mt-1">
                        GYM & WOMEN'S FITNESS
                      </h2>
                      <p className="text-xs sm:text-sm text-pink-100/90 mt-0.5">
                        Healthy habit logs, stretching routines, and weekly goals.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table of Women Fitness Activities */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                        <th className="py-3.5 px-6">ASSIGNMENT</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">INSTRUCTOR</th>
                        <th className="py-3.5 px-4">DUE DATE</th>
                        <th className="py-3.5 px-4">STATUS / GRADE</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
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
                                {asg.teacherName || 'Teacher not assigned'}
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
                                  Reviewed • {displayScore}/{asg.maxScore} pts
                                </span>
                              ) : isSubmittedPending ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Submitted • Awaiting Review
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                                  Pending Submission
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {hasVisto ? (
                                <button
                                  onClick={() =>
                                    setViewFeedbackModal({
                                      asgTitle: asg.title,
                                      teacherName: asg.teacherName || 'Teacher not assigned',
                                      score: displayScore || asg.maxScore,
                                      maxScore: asg.maxScore,
                                      feedback: sub?.feedback || 'Excellent engagement and consistency with the healthy routines!',
                                      submittedAt: sub?.submittedAt,
                                      status: 'Reviewed',
                                    })
                                  }
                                  className="px-4 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#be185d] text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 border border-pink-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#be185d]" />
                                  <span>View Feedback & Review</span>
                                </button>
                              ) : isSubmittedPending ? (
                                <button
                                  onClick={() =>
                                    alert(
                                      `Your assignment "${asg.title}" has already been submitted!\n\nSubmitted response: "${sub?.content || 'Attached work'}"\n\nThe instructor will review it shortly and confirm the review.`
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>View Submission</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignmentModal(asg)}
                                  className="px-4 py-1.5 bg-[#be185d] hover:bg-[#9d174d] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>Submit assignment</span>
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

        {/* TAB 4: GRADES & ASSESSMENTS */}
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
                    Academic Report Card & Exams
                    {selectedCourseFilter !== 'ALL' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {getCourseFilterLabel(selectedCourseFilter)}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Check your grades, weights, and exam release status according to your financial standing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isFinalGradeAllowedToView ? (
                  <div className="text-right bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-800">
                      {selectedCourseFilter === 'ALL'
                        ? 'Approved Final Grade'
                        : `Final Grade • ${getCourseFilterLabel(selectedCourseFilter)}`}
                    </p>
                    <p className="text-xl font-black text-[#075e38]">{filteredAverageGrade} pts</p>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ✓ Released by Teacher
                    </span>
                  </div>
                ) : (
                  <div className="text-right bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-300">
                    <p className="text-[10px] uppercase font-black text-amber-800">
                      Final Grade
                    </p>
                    <p className="text-base sm:text-lg font-black text-amber-900">In Progress</p>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Awaiting Final Exam
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
                      <span>Final Grade In Progress • Closing Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                        Teacher Control
                      </span>
                    </h4>
                    <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                      Per academic policy, the final grade is not shown as final before the <strong>Final Exam</strong> is administered and recorded and the teacher formally releases it. Follow the progress of each partial assessment below.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-200 self-start sm:self-auto shrink-0">
                  Status: Partial In Progress
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
                              <span className="text-xs text-slate-400 font-mono">Date: {asm.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {asm.courseName} • Weight: {asm.weight}% • Max Score: {asm.maxScore} pts
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
                              <Unlock className="w-4 h-4" /> Exam Released
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                              <Lock className="w-4 h-4" /> Exam Locked
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
                              Go to Financial & Settle →
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

        {/* TAB 5: ATTENDANCE & PRESENCE */}
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
                    Attendance & Presence Records
                    {selectedCourseFilter !== 'ALL' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {getCourseFilterLabel(selectedCourseFilter)}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track attendance and absences recorded by the teacher in lessons and training sessions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] uppercase font-bold text-emerald-800">
                    {selectedCourseFilter === 'ALL' ? 'Recorded Attendance' : `Attendance • ${getCourseFilterLabel(selectedCourseFilter)}`}
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
                            Date: {att.date} • Teacher: {att.teacherName} {att.notes ? `• ${att.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isPresent ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Present
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200 text-xs">
                            {rec?.justified ? 'Justified Absence' : 'Absent'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 6: FINANCIAL & TUITION (VIEW MODE / STUDENT STATEMENT) */}
        {activeNav === 'financeiro' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-[#075e38]" />
                  Financial Statement & Tuition
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  View your tuition installments, due dates, and receipts authenticated by the financial department.
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
                  {hasPendingCharges ? 'Outstanding Balance' : 'Tuition Up to Date'}
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
                  <p className="font-bold text-xs text-purple-950">Student View and Inquiry Only</p>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900">
                    Access Control
                  </span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Payments and the corresponding release of academic access (lessons, assessments, and attendance) are processed <strong>exclusively by the Financial Department / Treasury</strong> after receipt in <strong>physical cash</strong> or by <strong>bank transfer</strong>.
                </p>
                <p className="text-[11px] text-purple-800">
                  Present your <strong>Student ID ({student.studentId})</strong> at the reception desk to make a payment. Once the operator records it in the cash register, your access is released immediately and the official authenticated receipt will be available below for review and printing.
                </p>
              </div>
            </div>

            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-semibold">Installment</th>
                    <th className="pb-3 font-semibold">Course / Description</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Receipt / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentCharges.map((chg) => (
                    <tr key={chg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        {chg.installmentNumber} of {chg.totalInstallments}
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
                            <span>View Official Receipt</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 text-slate-600 rounded-xl text-[11px] font-medium border border-slate-200/60">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pay at the Counter (Financial)</span>
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

      {/* MODAL 1: FULL NOTICE BOARD FOR GENERAL ANNOUNCEMENTS FROM ADMINISTRATION & COORDINATION */}
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
                      Official Notice Board
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      All Classes Simultaneously
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    Notices from Administration & Academic Coordination
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
                  <p className="font-bold text-slate-600 text-sm">No active notices at the moment.</p>
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
                              <Pin className="w-2.5 h-2.5" /> Pinned
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
                            {isUrgent ? 'Urgent' : isImportant ? 'Important Notice' : 'Informational'}
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
                        <span>Signed by: <strong>{ann.authorName}</strong></span>
                        <span className="font-semibold text-emerald-800">Sent to all classes</span>
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
                Close Notice Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASS HUB MODAL (WHEN CLICKING ACCESS CLASS) */}
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
                    Active Class
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
                <span className="text-slate-500">Class Schedule:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.classRoom?.schedule || 'Tuesdays and Thursdays - 3:00 PM to 5:00 PM'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Teacher / Instructor:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.classRoom?.teacherName || 'Think Green Faculty'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800">
                  {selectedClassForModal.theme === 'green'
                    ? 'Soccer Field 1 (Cairo)'
                    : selectedClassForModal.theme === 'orange'
                    ? 'Girassol Preschool Room - Block C'
                    : selectedClassForModal.theme === 'pink'
                    ? "Women's Training Studio"
                    : 'Room 102 - Block A'}
                </span>
              </div>
              {(() => {
                const classAccess = selectedClassForModal.classRoom
                  ? checkClassroomAccess(student.studentId, selectedClassForModal.classRoom.id)
                  : { allowed: true };

                return (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Class / Activity Access:</span>
                      {classAccess.allowed ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" /> Released via Enrollment
                        </span>
                      ) : (
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> ENTRY BLOCKED (Financial)
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
                View Assignments
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
                Open Lessons in AVA
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
              <h3 className="font-bold text-slate-900 text-base">Submit Assignment</h3>
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
                Assignment submitted successfully to the teacher!
              </div>
            ) : (
              <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Student Comments or Response
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Write your response or explanatory notes about the work..."
                    className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#075e38] outline-none text-xs"
                  />
                </div>

                <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <p className="font-semibold text-slate-700">Selected File:</p>
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold rounded-full transition-colors"
                  >
                    Confirm Submission
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
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Teacher / Reviewer</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{viewFeedbackModal.teacherName}</span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Score Obtained</span>
                <span className="font-extrabold text-emerald-800 text-base mt-0.5 block">
                  {viewFeedbackModal.score} <span className="text-xs font-normal text-emerald-600">/ {viewFeedbackModal.maxScore} pts</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Feedback & Teacher's Pedagogical Assessment:
              </label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                "{viewFeedbackModal.feedback}"
              </div>
            </div>

            {viewFeedbackModal.submittedAt && (
              <p className="text-[11px] text-slate-400 text-right">
                Submission date: {viewFeedbackModal.submittedAt}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewFeedbackModal(null)}
                className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Close
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
                      Interactive Quiz
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
                    Quiz Submitted Successfully!
                  </h4>
                  <p className="text-sm text-emerald-800 max-w-md mx-auto">
                    Your answers were recorded in the Think Green Platform academic system.
                  </p>
                  <div className="inline-block px-5 py-2.5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Recorded Score</span>
                    <span className="text-2xl font-black text-[#075e38]">
                      {quizSubmissionResult.score} / {quizSubmissionResult.maxScore} pts
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    System / Teacher Feedback:
                  </p>
                  <p className="italic text-slate-600">"{quizSubmissionResult.teacherFeedback}"</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Submitted on: {quizSubmissionResult.submittedAt}
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
                    Finish and Return to Portal
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Taking Questions Form */
              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
                {/* 1. AUDIO PLAYER SECTION (REQUIREMENT 3: Listening Audio) */}
                {activeQuizModal.audioUrl && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border-2 border-purple-200/90 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-[#533499] animate-pulse" />
                        <span className="font-black text-xs sm:text-sm text-purple-950 uppercase tracking-wide">
                          Audio Track • Listening Comprehension
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                        English Audio Track
                      </span>
                    </div>

                    <p className="text-xs text-purple-900 font-medium">
                      Listen carefully to the audio in the player below to answer the related questions:
                    </p>

                    <div className="bg-white p-2.5 rounded-xl border border-purple-200/70 shadow-2xs">
                      <MediaAudioPlayer src={activeQuizModal.audioUrl} className="w-full h-10" />
                      <p className="text-[10px] text-slate-400 mt-1 text-center">
                        Playback enabled for listening during the quiz only — download disabled.
                      </p>
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
                            Question {idx + 1} of {activeQuizModal.questions.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200/60 px-2 py-0.5 rounded">
                              {q.type === 'MULTIPLE_CHOICE'
                                ? 'Multiple Choice'
                                : q.type === 'TRUE_FALSE'
                                ? 'True / False'
                                : q.type === 'FILL_BLANK'
                                ? 'Fill in the Blank'
                                : 'Essay'}
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
                                  { id: 'true', text: 'True' },
                                  { id: 'false', text: 'False' },
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
                              placeholder="Type the word or phrase in English..."
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
                              placeholder="Write your essay response in English here..."
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed focus:border-[#533499] focus:ring-1 focus:ring-[#533499] focus:outline-hidden resize-none"
                            />
                            <div className="text-right text-[10px] text-slate-400">
                              {typeof currentAns === 'string' ? currentAns.length : 0} characters
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
                    Save and Continue Later
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitQuiz(student)}
                    className="px-8 py-3 bg-[#533499] hover:bg-[#432681] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>FINISH AND SEND ANSWERS</span>
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
                      ? 'PDF Booklet'
                      : activeMaterialModal.type === 'GOOGLE_DRIVE'
                      ? 'Google Drive Folder'
                      : 'Supplementary Video'}
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
                  {activeMaterialModal.description || 'Official material to follow the lessons.'}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap gap-3">
                  <span>Class: <strong>{activeMaterialModal.className}</strong></span>
                  <span>Teacher: <strong>{activeMaterialModal.teacherName}</strong></span>
                  <span>Size: <strong>{activeMaterialModal.fileSize || 'Online'}</strong></span>
                </div>
              </div>

              {activeMaterialModal.type === 'PDF' && (
                <div className="p-8 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-rose-500" />
                  <p className="font-bold text-slate-800 text-sm">
                    {activeMaterialModal.title}.pdf
                  </p>
                  <p className="text-xs text-slate-500">
                    Digital document formatted and optimized for viewing and printing.
                  </p>
                  {activeMaterialModal.allowDownload ? (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = activeMaterialModal.url;
                        link.download = activeMaterialModal.fileName || `${activeMaterialModal.title}.pdf`;
                        link.target = '_blank';
                        link.rel = 'noreferrer';
                        link.click();
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Full PDF File</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-300">
                      <Lock className="w-4 h-4" />
                      <span>Download blocked by the teacher — available for viewing only</span>
                    </div>
                  )}
                </div>
              )}

              {activeMaterialModal.type === 'VIDEO_LINK' && (
                <div className="p-6 rounded-2xl bg-slate-900 text-white text-center space-y-3">
                  <Play className="w-12 h-12 mx-auto text-emerald-400" />
                  <p className="font-bold text-sm text-white">
                    {activeMaterialModal.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    External video link for reference and content review.
                  </p>
                  <a
                    href={activeMaterialModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Video on External Platform</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveMaterialModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close View
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
