import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Star,
  PlaySquare,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  FileEdit,
  Clock,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowRight,
  User,
  ChevronDown,
  Bell,
  Check,
  X,
  Save,
  Award,
  BookMarked,
  FileText,
  Video,
  Sprout,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  Send,
  CheckSquare,
  FileCheck,
  CheckCheck,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ThinkGardenLogo, SoccerBallBadge, USAFlagBadge, ReadingBookBadge } from '../../common/ThinkGardenLogos';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { Assessment, AssessmentType, Assignment, Submission } from '../../../types';

interface TeacherPortalProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

type TeacherNavTab = 'turmas' | 'chamadas' | 'provas' | 'notas' | 'aulas' | 'atividades';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentTab, setCurrentTab }) => {
  const {
    currentUser,
    switchRole,
    state,
    checkClassroomAccess,
    checkExamAccess,
    saveAttendance,
    saveGrade,
    saveBatchGrades,
    createAssessment,
    deleteAssessment,
    createClass,
    createLesson,
    deleteLesson,
    createAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    markSubmissionSeen,
    markManualStudentSubmission,
  } = useApp();

  // Active top navigation tab
  const [activeNavTab, setActiveNavTab] = useState<TeacherNavTab>('turmas');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Carousel page state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Classes list
  const teacherClasses = state.classes;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    teacherClasses[0]?.id || 'class_soccer'
  );

  const selectedClass = state.classes.find((c) => c.id === selectedClassId) || teacherClasses[0] || {
    id: 'class_soccer',
    name: 'Soccer Class - 8º Ano A',
    code: 'SOC-8A',
    courseName: 'Academia de Futebol Think Green',
    schedule: 'Terças e Quintas, 19:00 - 19:50',
    room: 'Campo Sintético 01',
  };

  // Students enrolled in the selected class
  const classEnrollments = state.enrollments.filter(
    (e) => e.classId === selectedClass?.id && e.status === 'ATIVA'
  );

  // =========================================================================
  // 1. ATTENDANCE STATE (CHAMADAS)
  // =========================================================================
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceList, setAttendanceList] = useState<{
    [studentId: string]: { present: boolean; note?: string };
  }>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  React.useEffect(() => {
    // Check if attendance exists for this date and class
    const existingAtt = state.attendance.find(
      (a) => a.classId === selectedClass?.id && a.date === attendanceDate
    );

    const initial: { [studentId: string]: { present: boolean; note?: string } } = {};
    classEnrollments.forEach((e) => {
      if (existingAtt) {
        const studentRec = existingAtt.students.find((s) => s.studentId === e.studentId);
        initial[e.studentId] = {
          present: studentRec ? studentRec.present : true,
          note: studentRec?.note || '',
        };
      } else {
        initial[e.studentId] = { present: true, note: '' };
      }
    });
    setAttendanceList(initial);
  }, [selectedClassId, attendanceDate, classEnrollments.length, state.attendance]);

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceList((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        present: !prev[studentId]?.present,
      },
    }));
  };

  const handleMarkAllPresent = (present: boolean) => {
    const updated: { [studentId: string]: { present: boolean; note?: string } } = {};
    classEnrollments.forEach((e) => {
      updated[e.studentId] = { present, note: attendanceList[e.studentId]?.note || '' };
    });
    setAttendanceList(updated);
  };

  const handleSaveAttendance = () => {
    const records = classEnrollments.map((enr) => ({
      studentId: enr.studentId,
      studentName: enr.studentName,
      present: attendanceList[enr.studentId]?.present ?? true,
      note: attendanceList[enr.studentId]?.note || '',
    }));

    saveAttendance(selectedClass.id, attendanceDate, records, 'Chamada realizada via Diário Eletrônico');
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 2500);
  };

  // =========================================================================
  // 2. PROVAS / ASSESSMENTS STATE & MODALS
  // =========================================================================
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<Assessment | null>(null);
  const [examSearch, setExamSearch] = useState('');
  const [examFilterClass, setExamFilterClass] = useState('ALL');

  // Form state for creating Exam
  const [examTitle, setExamTitle] = useState('');
  const [examClassId, setExamClassId] = useState(selectedClass?.id || teacherClasses[0]?.id || '');
  const [examType, setExamType] = useState<AssessmentType>('PROVA_1');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examTime, setExamTime] = useState('19:00');
  const [examMaxScore, setExamMaxScore] = useState(100);
  const [examWeight, setExamWeight] = useState(40);
  const [examRequiredStage, setExamRequiredStage] = useState<'NONE' | 'STAGE_1_PAID' | 'STAGE_2_PAID' | 'STAGE_FINAL_PAID'>('STAGE_2_PAID');
  const [examContent, setExamContent] = useState('');
  const [examInstructions, setExamInstructions] = useState('');
  const [examSuccessToast, setExamSuccessToast] = useState(false);

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = state.classes.find((c) => c.id === examClassId) || selectedClass;

    createAssessment({
      classId: targetClass.id,
      className: targetClass.name,
      courseName: targetClass.courseName,
      title: examTitle,
      type: examType,
      date: examDate,
      time: examTime,
      maxScore: Number(examMaxScore) || 100,
      weight: Number(examWeight) || 30,
      requiredPaymentStage: examRequiredStage,
      description: examContent.substring(0, 120),
      content: examContent,
      instructions: examInstructions,
      status: 'AGENDADA',
    });

    setIsExamModalOpen(false);
    setExamTitle('');
    setExamContent('');
    setExamInstructions('');
    setExamSuccessToast(true);
    setTimeout(() => setExamSuccessToast(false), 3000);
  };

  // Filtered exams
  const displayedAssessments = state.assessments.filter((asm) => {
    const matchClass = examFilterClass === 'ALL' || asm.classId === examFilterClass;
    const matchSearch =
      asm.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      asm.className.toLowerCase().includes(examSearch.toLowerCase()) ||
      (asm.content && asm.content.toLowerCase().includes(examSearch.toLowerCase()));
    return matchClass && matchSearch;
  });

  // =========================================================================
  // 3. NOTAS (GRADES) STATE & ACTIONS
  // =========================================================================
  const classAssessments = state.assessments.filter((a) => a.classId === selectedClass?.id);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    classAssessments[0]?.id || ''
  );

  React.useEffect(() => {
    if (classAssessments.length > 0 && (!selectedAssessmentId || !classAssessments.some((a) => a.id === selectedAssessmentId))) {
      setSelectedAssessmentId(classAssessments[0].id);
    }
  }, [selectedClassId, classAssessments.length]);

  const currentAssessment = state.assessments.find((a) => a.id === selectedAssessmentId) || classAssessments[0];

  const [gradeInputs, setGradeInputs] = useState<{ [studentId: string]: number }>({});
  const [feedbackInputs, setFeedbackInputs] = useState<{ [studentId: string]: string }>({});
  const [gradeSaved, setGradeSaved] = useState(false);

  // Initialize grade inputs from existing grades
  React.useEffect(() => {
    if (!currentAssessment) return;
    const newGrades: { [studentId: string]: number } = {};
    const newFeedbacks: { [studentId: string]: string } = {};

    classEnrollments.forEach((enr) => {
      const existing = state.grades.find(
        (g) => g.assessmentId === currentAssessment.id && g.studentId === enr.studentId
      );
      if (existing) {
        newGrades[enr.studentId] = existing.score;
        newFeedbacks[enr.studentId] = existing.feedback || '';
      }
    });

    setGradeInputs(newGrades);
    setFeedbackInputs(newFeedbacks);
  }, [selectedAssessmentId, selectedClassId, classEnrollments.length, state.grades]);

  const handleSaveSingleGrade = (studentId: string) => {
    if (!currentAssessment) return;
    const score = gradeInputs[studentId] ?? 0;
    const feedback = feedbackInputs[studentId] || 'Participação avaliada com sucesso.';
    saveGrade(currentAssessment.id, studentId, score, feedback);
    setGradeSaved(true);
    setTimeout(() => setGradeSaved(false), 2500);
  };

  const handleSaveAllGrades = () => {
    if (!currentAssessment) return;
    const batch = classEnrollments.map((enr) => ({
      studentId: enr.studentId,
      score: gradeInputs[enr.studentId] ?? 0,
      feedback: feedbackInputs[enr.studentId] || 'Desempenho avaliado pelo docente.',
    }));

    saveBatchGrades(currentAssessment.id, batch);
    setGradeSaved(true);
    setTimeout(() => setGradeSaved(false), 3000);
  };

  // =========================================================================
  // 4. AULAS & ATIVIDADES STATE
  // =========================================================================
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonPdf, setNewLessonPdf] = useState('Apostila_Oficial_ThinkGreen.pdf');
  const [newLessonVideo, setNewLessonVideo] = useState('');

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    createLesson({
      classId: selectedClass.id,
      className: selectedClass.name,
      title: newLessonTitle,
      description: newLessonDesc,
      date: new Date().toISOString().split('T')[0],
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      videoUrl: newLessonVideo || undefined,
      materials: [
        {
          id: `mat_${Date.now()}`,
          title: newLessonPdf || 'Material_Complementar.pdf',
          type: 'PDF',
          url: '#',
          size: '2.4 MB',
        },
      ],
    });
    setIsLessonModalOpen(false);
    setNewLessonTitle('');
    setNewLessonDesc('');
    setNewLessonVideo('');
  };

  // =========================================================================
  // 4. ATIVIDADES & TAREFAS STATE & ACTIONS
  // =========================================================================
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<Assignment | null>(null);
  const [assignmentClassFilter, setAssignmentClassFilter] = useState('ALL');
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [assignmentStudentFilter, setAssignmentStudentFilter] = useState<'ALL' | 'FEZ' | 'NAO_FEZ' | 'PENDENTE_VISTO'>('ALL');
  const [studentSearchInsideAsg, setStudentSearchInsideAsg] = useState('');
  const [selectedSubmissionForViewModal, setSelectedSubmissionForViewModal] = useState<Submission | null>(null);
  
  // Quick Inline Feedbacks & Scores
  const [quickFeedbacks, setQuickFeedbacks] = useState<{ [subIdOrStudentId: string]: string }>({});
  const [quickScores, setQuickScores] = useState<{ [subIdOrStudentId: string]: number }>({});
  const [activityToast, setActivityToast] = useState<string | null>(null);

  const showActivityToast = (msg: string) => {
    setActivityToast(msg);
    setTimeout(() => setActivityToast(null), 3000);
  };

  // New Assignment Modal
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [newAsgTitle, setNewAsgTitle] = useState('');
  const [newAsgClassId, setNewAsgClassId] = useState(selectedClass?.id || teacherClasses[0]?.id || '');
  const [newAsgCategory, setNewAsgCategory] = useState<'REDACAO' | 'EXERCICIO' | 'PROJETO' | 'DIARIO' | 'PRATICA'>('EXERCICIO');
  const [newAsgDeliveryMethod, setNewAsgDeliveryMethod] = useState<'ONLINE' | 'PRESENCIAL' | 'HIBRIDO'>('ONLINE');
  const [newAsgInstructions, setNewAsgInstructions] = useState('');
  const [newAsgDueDate, setNewAsgDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAsgMaxScore, setNewAsgMaxScore] = useState(100);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = state.classes.find((c) => c.id === newAsgClassId) || selectedClass;
    const created = createAssignment({
      classId: targetClass.id,
      className: targetClass.name,
      title: newAsgTitle,
      instructions: newAsgInstructions,
      dueDate: newAsgDueDate,
      maxScore: Number(newAsgMaxScore) || 100,
      teacherName: currentUser.name,
      category: newAsgCategory,
      deliveryMethod: newAsgDeliveryMethod,
    });
    setIsAssignmentModalOpen(false);
    setNewAsgTitle('');
    setNewAsgInstructions('');
    setSelectedAssignmentForReview(created);
    showActivityToast(`Atividade "${created.title}" criada com sucesso! Você já pode acompanhar quem fez, dar feedback e visto.`);
  };

  // Manual Submission / Visto Presencial Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTarget, setManualTarget] = useState<{ studentId: string; studentName: string; assignmentId: string; assignmentTitle: string } | null>(null);
  const [manualFeedback, setManualFeedback] = useState('Atividade validada em sala de aula pelo professor.');
  const [manualScore, setManualScore] = useState(100);

  const handleSaveManualVisto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTarget) return;

    markManualStudentSubmission(
      manualTarget.assignmentId,
      manualTarget.studentId,
      manualFeedback,
      manualScore,
      true
    );

    setIsManualModalOpen(false);
    setManualTarget(null);
    showActivityToast(`Visto presencial registrado com sucesso para ${manualTarget.studentName}!`);
  };

  // Quick Action: Dar como Visto para submissão existente
  const handleQuickMarkAsSeen = (submission: Submission) => {
    const feedback = quickFeedbacks[submission.id] || submission.feedback || 'Atividade visualizada e validada pelo professor.';
    const score = quickScores[submission.id] !== undefined ? quickScores[submission.id] : (submission.score !== undefined ? submission.score : 100);
    
    markSubmissionSeen(submission.id, feedback, score);
    showActivityToast(`Visto atribuído com sucesso para ${submission.studentName}!`);
  };

  // Modal Correction
  const [correctingSub, setCorrectingSub] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(90);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // New Class Modal
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCourse, setNewClassCourse] = useState('Curso Livre de Inglês');
  const [newClassSchedule, setNewClassSchedule] = useState('Segundas e Quartas, 19:00 - 20:30');
  const [newClassRoom, setNewClassRoom] = useState('Sala 03 - Centro');
  const [newClassCode, setNewClassCode] = useState('ENG-8C');

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createClass({
      name: newClassName || `${newClassCourse} - Nova Turma`,
      code: newClassCode || `CLS-${Math.floor(100 + Math.random() * 900)}`,
      courseId: newClassCourse.includes('Inglês') ? 'course_eng' : 'course_football',
      courseName: newClassCourse,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      schedule: newClassSchedule,
      room: newClassRoom,
      maxCapacity: 30,
    });
    setSelectedClassId(created.id);
    setIsNewClassModalOpen(false);
    setNewClassName('');
  };

  const classSubmissions = state.submissions.filter((s) =>
    classEnrollments.some((e) => e.studentId === s.studentId) || s.assignmentTitle.includes(selectedClass.name)
  );

  // Dynamic Dashboard Stats
  const totalClassesCount = state.classes.length;
  const totalStudentsCount = state.enrollments.filter((e) => e.status === 'ATIVA').length;
  const pendingSubmissionsCount = state.submissions.filter((s) => s.status === 'PENDENTE_CORRECAO').length;
  const todayLessonsCount = state.lessons.length > 0 ? 3 : 1;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER - EXACT REPLICA OF REFERENCE IMAGE                           */}
      {/* ========================================================================= */}
      <header className="w-full bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
          {/* Left: Think Garden Platform Logo */}
          <div className="flex items-center">
            <ThinkGardenLogo />
          </div>

          {/* Center: PAINEL DO PROFESSOR Title */}
          <div className="text-center hidden md:block">
            <h1 className="text-base sm:text-xl font-bold tracking-[0.22em] text-slate-900 uppercase">
              PAINEL DO PROFESSOR
            </h1>
          </div>

          {/* Right: User Profile Pill & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all text-left border border-slate-200/80 shadow-2xs"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#075e38] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>

                <div className="flex flex-col pr-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                    {currentUser.name || 'Professor Lucas'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium leading-none mt-0.5">
                    Professor
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-600 ml-0.5" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                  <div className="p-2 border-b border-slate-100 mb-2">
                    <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                    <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded text-[10px] border border-emerald-200">
                      Docente Autorizado
                    </span>
                  </div>

                  <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Alternar Módulo / Visão:
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        switchRole('STUDENT');
                        setCurrentTab('dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <span>Portal do Aluno</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        switchRole('FINANCE');
                        setCurrentTab('finance');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <span>Tesouraria & Caixa</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        switchRole('SUPER_ADMIN');
                        setCurrentTab('students');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <span>Administração Geral</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* 2. HORIZONTAL NAVIGATION TABS (Turmas, Chamadas, Provas, Notas, Aulas, Atividades) */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
          {/* 1. Turmas */}
          <button
            onClick={() => setActiveNavTab('turmas')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'turmas'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Turmas</span>
          </button>

          {/* 2. Chamadas */}
          <button
            onClick={() => setActiveNavTab('chamadas')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'chamadas'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Chamadas</span>
          </button>

          {/* 3. Provas (EXPLICITLY REQUESTED AREA) */}
          <button
            onClick={() => setActiveNavTab('provas')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'provas'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Provas</span>
            {state.assessments.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeNavTab === 'provas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {state.assessments.length}
              </span>
            )}
          </button>

          {/* 4. Notas */}
          <button
            onClick={() => setActiveNavTab('notas')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'notas'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Notas</span>
          </button>

          {/* 5. Aulas */}
          <button
            onClick={() => setActiveNavTab('aulas')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'aulas'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Aulas</span>
          </button>

          {/* 6. Atividades */}
          <button
            onClick={() => setActiveNavTab('atividades')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap ${
              activeNavTab === 'atividades'
                ? 'bg-[#075e38] text-white shadow-sm ring-2 ring-[#075e38]/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Atividades</span>
            {pendingSubmissionsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Action Toasts */}
        {examSuccessToast && (
          <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Nova Prova cadastrada com sucesso! O conteúdo e nota máxima já estão vinculados à turma e ao portal do aluno.</span>
            </div>
            <button
              onClick={() => setActiveNavTab('provas')}
              className="px-3 py-1 bg-[#075e38] text-white rounded-lg text-[11px] font-bold hover:bg-[#064e2e]"
            >
              Ver Provas
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: TURMAS (MAIN DASHBOARD VIEW)                                       */}
        {/* ========================================================================= */}
        {activeNavTab === 'turmas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: GREETING + STATS + MINHAS TURMAS */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-8 space-y-6 sm:space-y-7">
              {/* Top Greeting Block */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f5e9] text-[#075e38] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Olá, {currentUser.name || 'Professor Lucas'}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Aqui está um resumo das suas turmas, provas e atividades.
                  </p>
                </div>
              </div>

              {/* 4 Stat Pills Row */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Stat 1: Turmas */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {totalClassesCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Turmas
                    </span>
                  </div>
                </div>

                {/* Stat 2: Alunos */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {totalStudentsCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Alunos
                    </span>
                  </div>
                </div>

                {/* Stat 3: Atividades pendentes */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center flex-shrink-0">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {pendingSubmissionsCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block leading-tight">
                      Atividades pendentes
                    </span>
                  </div>
                </div>

                {/* Stat 4: Provas / Avaliações */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {state.assessments.length}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Provas cadastradas
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Header: MINHAS TURMAS + '+ Nova turma' button */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                  MINHAS TURMAS
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExamClassId(selectedClassId);
                      setIsExamModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#075e38] text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 border border-emerald-200"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>+ Nova Prova</span>
                  </button>

                  <button
                    onClick={() => setIsNewClassModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-[#075e38] text-[#075e38] text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova turma</span>
                  </button>
                </div>
              </div>

              {/* Class Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: SOCCER CLASS */}
                <div className="rounded-2xl border-2 border-[#075e38] bg-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <SoccerBallBadge className="w-11 h-11" />
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#075e38] tracking-tight leading-tight uppercase">
                          SOCCER CLASS
                        </h4>
                        <span className="text-xs text-slate-600 font-medium">
                          8º Ano A
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 my-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {state.enrollments.filter((e) => e.classId === 'class_soccer' || e.className.includes('Futebol')).length || 32} alunos matriculados
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#075e38]" />
                        <span>
                          {state.assessments.filter((a) => a.classId === 'class_soccer').length || 2} provas cadastradas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlaySquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>4 aulas cadastradas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedClassId('class_soccer');
                        setActiveNavTab('provas');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#ecfdf5] text-[#075e38] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#d1fae5] transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Gerenciar Provas</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId('class_soccer');
                        setActiveNavTab('chamadas');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <span>Acessar Diário & Notas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 2: ENGLISH CLASS */}
                <div className="rounded-2xl border-2 border-[#533499] bg-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <USAFlagBadge className="w-11 h-11" />
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#533499] tracking-tight leading-tight uppercase">
                          ENGLISH CLASS
                        </h4>
                        <span className="text-xs text-slate-600 font-medium">
                          7º Ano B
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 my-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {state.enrollments.filter((e) => e.classId === 'class_eng_a' || e.className.includes('Inglês')).length || 28} alunos matriculados
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#533499]" />
                        <span>
                          {state.assessments.filter((a) => a.classId === 'class_eng_a').length || 3} provas cadastradas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlaySquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>6 aulas cadastradas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedClassId('class_eng_a');
                        setActiveNavTab('provas');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#f5f3ff] text-[#533499] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ede9fe] transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Gerenciar Provas</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId('class_eng_a');
                        setActiveNavTab('chamadas');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <span>Acessar Diário & Notas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 3: READING CLASS */}
                <div className="rounded-2xl border-2 border-[#2563eb] bg-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <ReadingBookBadge className="w-11 h-11" />
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#2563eb] tracking-tight leading-tight uppercase">
                          READING CLASS
                        </h4>
                        <span className="text-xs text-slate-600 font-medium">
                          6º Ano C
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 my-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {state.enrollments.filter((e) => e.classId === 'class_reading' || e.className.includes('Reading')).length || 26} alunos matriculados
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>
                          {state.assessments.filter((a) => a.classId === 'class_reading').length || 1} prova cadastrada
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlaySquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>3 aulas cadastradas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedClassId('class_reading');
                        setActiveNavTab('provas');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#dbeafe] transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Gerenciar Provas</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId('class_reading');
                        setActiveNavTab('chamadas');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <span>Acessar Diário & Notas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRÓXIMAS AULAS & ATIVIDADES PENDENTES */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: PRÓXIMAS AULAS */}
              <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                      PRÓXIMAS AULAS
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveNavTab('aulas')}
                    className="text-[11px] text-[#075e38] font-bold hover:underline"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Item 1: Soccer Class */}
                  <div
                    onClick={() => {
                      setSelectedClassId('class_soccer');
                      setActiveNavTab('aulas');
                    }}
                    className="flex items-center justify-between pb-3.5 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#075e38] flex-shrink-0" />
                      <div className="text-center w-8 flex-shrink-0">
                        <span className="text-lg font-black text-slate-900 leading-none block">
                          19
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mt-0.5">
                          MAI
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#075e38] leading-tight">
                          Soccer Class
                        </h4>
                        <p className="text-xs text-slate-700 font-medium leading-tight">
                          Fundamentos & Triangulações
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          19:00 - 19:50
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Item 2: English Class */}
                  <div
                    onClick={() => {
                      setSelectedClassId('class_eng_a');
                      setActiveNavTab('aulas');
                    }}
                    className="flex items-center justify-between pb-3.5 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#533499] flex-shrink-0" />
                      <div className="text-center w-8 flex-shrink-0">
                        <span className="text-lg font-black text-slate-900 leading-none block">
                          19
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mt-0.5">
                          MAI
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#533499] leading-tight">
                          English Class
                        </h4>
                        <p className="text-xs text-slate-700 font-medium leading-tight">
                          Past Continuous & Dialogues
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          20:00 - 20:50
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Item 3: Reading Class */}
                  <div
                    onClick={() => {
                      setSelectedClassId('class_reading');
                      setActiveNavTab('aulas');
                    }}
                    className="flex items-center justify-between pb-1 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] flex-shrink-0" />
                      <div className="text-center w-8 flex-shrink-0">
                        <span className="text-lg font-black text-slate-900 leading-none block">
                          20
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mt-0.5">
                          MAI
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2563eb] leading-tight">
                          Reading Class
                        </h4>
                        <p className="text-xs text-slate-700 font-medium leading-tight">
                          Short Story: Think Garden
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          18:00 - 18:50
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Card 2: ATIVIDADES PENDENTES */}
              <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                      ATIVIDADES PENDENTES
                    </h3>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {pendingSubmissionsCount} para corrigir
                  </span>
                </div>

                <div className="space-y-3">
                  {state.submissions
                    .filter((s) => s.status === 'PENDENTE_CORRECAO')
                    .slice(0, 3)
                    .map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setCorrectingSub(sub);
                          setScoreInput(95);
                          setFeedbackText('Bom trabalho!');
                        }}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-300 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{sub.submittedAt.split(' ')[0]}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{sub.assignmentTitle}</p>
                        <span className="inline-block text-[10px] text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
                          Clique para avaliar
                        </span>
                      </div>
                    ))}

                  {pendingSubmissionsCount === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                      <p className="font-bold text-slate-600">Tudo em dia!</p>
                      <p className="text-[11px]">Nenhuma atividade pendente de correção.</p>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveNavTab('atividades')}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center block mt-2"
                  >
                    Ver Central de Atividades
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CHAMADAS (DIÁRIO ELETRÔNICO DE FREQUÊNCIA)                         */}
        {/* ========================================================================= */}
        {activeNavTab === 'chamadas' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#075e38]" />
                  Diário Eletrônico de Frequência
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lance a presença dos alunos. A frequência é sincronizada instantaneamente com o portal do aluno.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Class Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Turma</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data da Chamada</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                  </input>
                </div>

                {/* Save Attendance Button */}
                <div className="self-end">
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Chamada</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Ações Rápidas:</span>
                <button
                  onClick={() => handleMarkAllPresent(true)}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold hover:bg-emerald-200 transition-colors"
                >
                  Marcar Todos Presentes
                </button>
                <button
                  onClick={() => handleMarkAllPresent(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                >
                  Limpar / Todos Ausentes
                </button>
              </div>

              <span className="text-slate-500 font-medium">
                {classEnrollments.length} alunos na lista
              </span>
            </div>

            {/* Saved Toast */}
            {attendanceSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                Chamada salva com sucesso para {selectedClass.name} no dia {attendanceDate}!
              </div>
            )}

            {/* Students Attendance List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classEnrollments.map((enr) => {
                const isPresent = attendanceList[enr.studentId]?.present ?? true;
                const studentNote = attendanceList[enr.studentId]?.note || '';
                const classroomAccess = checkClassroomAccess(enr.studentId, selectedClass.id);

                return (
                  <div
                    key={enr.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !classroomAccess.allowed
                        ? 'bg-rose-50/70 border-rose-300'
                        : isPresent
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          !classroomAccess.allowed
                            ? 'bg-rose-600 text-white'
                            : isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-500 text-white'
                        }`}
                      >
                        {enr.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 text-xs">{enr.studentName}</p>
                          {!classroomAccess.allowed && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-200 text-rose-900 inline-flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> ENTRADA BLOQUEADA
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-slate-400">{enr.studentId}</p>
                        {!classroomAccess.allowed && (
                          <p className="text-[10px] text-rose-700 font-semibold mt-0.5 line-clamp-1">
                            {classroomAccess.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Obs (opcional)..."
                        value={studentNote}
                        onChange={(e) =>
                          setAttendanceList((prev) => ({
                            ...prev,
                            [enr.studentId]: {
                              ...prev[enr.studentId],
                              note: e.target.value,
                            },
                          }))
                        }
                        className="w-24 sm:w-32 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                      />
                      <button
                        onClick={() => {
                          if (!classroomAccess.allowed && !isPresent) {
                            if (
                              !confirm(
                                `⚠️ ALERTA DE BLOQUEIO FINANCEIRO:\n\nO aluno ${enr.studentName} (${enr.studentId}) possui bloqueio de entrada na sala de aula devido à pendência de parcela da etapa.\n\nMotivo: ${classroomAccess.reason}\n\nDeseja registrar presença mesmo assim?`
                              )
                            ) {
                              return;
                            }
                          }
                          handleToggleAttendance(enr.studentId);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          !classroomAccess.allowed
                            ? isPresent
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-rose-700 text-white hover:bg-rose-800'
                            : isPresent
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-600 text-white hover:bg-slate-700'
                        }`}
                      >
                        {isPresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {isPresent ? 'Presente' : 'Ausente'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROVAS (EXAM MANAGEMENT - EXPLICITLY REQUESTED AREA)               */}
        {/* ========================================================================= */}
        {activeNavTab === 'provas' && (
          <div className="space-y-6">
            {/* Top Control Bar */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#075e38]" />
                    Gestão de Provas & Avaliações Acadêmicas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre provas, defina o conteúdo programático cobrado, nota máxima, pesos e controle o lançamento de notas.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setExamClassId(selectedClassId);
                      setIsExamModalOpen(true);
                    }}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-2xl transition-all shadow-sm flex items-center gap-2 ring-2 ring-[#075e38]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nova Prova / Avaliação</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, matéria ou conteúdo..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#075e38] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Filter Class */}
                <div>
                  <select
                    value={examFilterClass}
                    onChange={(e) => setExamFilterClass(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#075e38] focus:bg-white focus:outline-hidden"
                  >
                    <option value="ALL">Todas as Turmas ({state.classes.length})</option>
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stats summary */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-4 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Total de Provas:</span>
                  <span className="font-black text-[#075e38] text-sm">{displayedAssessments.length} cadastradas</span>
                </div>
              </div>
            </div>

            {/* List of Exams / Assessments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedAssessments.map((exam) => {
                // Calculation of graded students
                const examGrades = state.grades.filter((g) => g.assessmentId === exam.id);
                const classStudents = state.enrollments.filter((e) => e.classId === exam.classId && e.status === 'ATIVA');
                const totalStudents = classStudents.length || 1;
                const gradedCount = examGrades.length;
                const isFullyGraded = gradedCount >= totalStudents && totalStudents > 0;
                const averageScore =
                  gradedCount > 0
                    ? (examGrades.reduce((acc, curr) => acc + curr.score, 0) / gradedCount).toFixed(1)
                    : null;

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between hover:border-[#075e38]/50 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-[#075e38] font-bold text-[11px] rounded-lg border border-emerald-200/70 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {exam.className}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded uppercase tracking-wider">
                            {exam.type.replace('_', ' ')}
                          </span>

                          {exam.requiredPaymentStage !== 'NONE' && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded border border-amber-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              {exam.requiredPaymentStage === 'STAGE_2_PAID'
                                ? 'Exige 2ª Parcela'
                                : exam.requiredPaymentStage === 'STAGE_FINAL_PAID'
                                ? 'Quitação Total'
                                : 'Exige 1ª Parcela'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Exam Title */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h3>

                      {/* Meta information tags */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.date} {exam.time ? `às ${exam.time}` : ''}</span>
                        </div>

                        <div className="px-2.5 py-1 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-[#075e38] font-black">
                          Nota Máx: {exam.maxScore} pts
                        </div>

                        <div className="px-2.5 py-1 bg-purple-50 border border-purple-200/60 rounded-xl text-purple-800 font-bold">
                          Peso: {exam.weight}%
                        </div>
                      </div>

                      {/* Conteúdo Programático Box */}
                      {exam.content ? (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <BookMarked className="w-3.5 h-3.5 text-[#075e38]" />
                              Conteúdo Programático Cobrado
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 whitespace-pre-line">
                            {exam.content}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100 text-[11px] text-slate-400 italic">
                          Nenhum tópico detalhado foi cadastrado.
                        </div>
                      )}

                      {/* Graded Progress & Average */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 font-medium block text-[11px]">
                            Lançamento de Notas:
                          </span>
                          <span className="font-bold text-slate-800">
                            {gradedCount} de {totalStudents} alunos avaliados
                          </span>
                        </div>

                        {averageScore !== null && (
                          <div className="text-right">
                            <span className="text-slate-500 font-medium block text-[11px]">Média da Turma:</span>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                              {averageScore} / {exam.maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedClassId(exam.classId);
                          setSelectedAssessmentId(exam.id);
                          setActiveNavTab('notas');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#075e38] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#064e2e] transition-colors shadow-2xs"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-300" />
                        <span>Lançar Notas</span>
                      </button>

                      <button
                        onClick={() => setSelectedExamForDetails(exam)}
                        className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                        title="Ver Conteúdo e Detalhes"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a avaliação "${exam.title}"?`)) {
                            deleteAssessment(exam.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Excluir Prova"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {displayedAssessments.length === 0 && (
                <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-[#075e38] rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Nenhuma Prova Encontrada</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Cadastre provas e avaliações com conteúdo programático e nota máxima para gerenciar as notas dos alunos.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExamModalOpen(true)}
                    className="px-5 py-2.5 bg-[#075e38] text-white rounded-xl text-xs font-bold hover:bg-[#064e2e] inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Primeira Prova</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NOTAS (LANÇAMENTO DE NOTAS E AVALIAÇÕES)                           */}
        {/* ========================================================================= */}
        {activeNavTab === 'notas' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Lançamento de Notas & Avaliações
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  As notas lançadas são refletidas imediatamente no boletim oficial do aluno.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Select Class */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Turma</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Assessment */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Prova / Avaliação</label>
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {classAssessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} (Máx: {a.maxScore} pts | Peso: {a.weight}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save All Button */}
                {classAssessments.length > 0 && (
                  <div className="self-end">
                    <button
                      onClick={handleSaveAllGrades}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Todas as Notas</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Assessment Meta Banner */}
            {currentAssessment ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{currentAssessment.title}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[10px]">
                      Nota Máxima: {currentAssessment.maxScore} pts
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                      Peso: {currentAssessment.weight}%
                    </span>
                  </div>
                  {currentAssessment.content && (
                    <p className="text-slate-600 text-[11px] line-clamp-1">
                      <strong className="text-slate-700">Conteúdo:</strong> {currentAssessment.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedExamForDetails(currentAssessment)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-[11px] hover:bg-slate-50"
                  >
                    Ver Conteúdo da Prova
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
                <p className="font-bold text-amber-900 text-sm">Esta turma ainda não possui provas cadastradas.</p>
                <p className="text-xs text-amber-700">Cadastre uma prova para liberar o lançamento de notas.</p>
                <button
                  onClick={() => {
                    setExamClassId(selectedClassId);
                    setIsExamModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold text-xs hover:bg-[#064e2e] inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Prova para {selectedClass.name}</span>
                </button>
              </div>
            )}

            {gradeSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                Notas salvas e sincronizadas com o boletim do aluno com sucesso!
              </div>
            )}

            {/* Grades Table */}
            {currentAssessment && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">ID Aluno</th>
                      <th className="px-4 py-3">Nome do Aluno</th>
                      <th className="px-4 py-3">Nota Atual</th>
                      <th className="px-4 py-3">Lançar Nota (0 a {currentAssessment.maxScore})</th>
                      <th className="px-4 py-3">Feedback / Observações</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classEnrollments.map((enr) => {
                      const existingGrade = state.grades.find(
                        (g) => g.assessmentId === currentAssessment.id && g.studentId === enr.studentId
                      );
                      const examAccess = checkExamAccess(enr.studentId, currentAssessment);

                      return (
                        <tr
                          key={enr.id}
                          className={`transition-colors ${
                            !examAccess.allowed ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-[#075e38]">{enr.studentId}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 block">{enr.studentName}</span>
                              {!examAccess.allowed && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 inline-flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> PROVA BLOQUEADA
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block">{enr.courseName}</span>
                            {!examAccess.allowed && (
                              <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                                {examAccess.reason}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {existingGrade ? (
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                {existingGrade.score} / {currentAssessment.maxScore} ({existingGrade.percentage}%)
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Pendente</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max={currentAssessment.maxScore}
                              placeholder={existingGrade ? String(existingGrade.score) : '0'}
                              value={gradeInputs[enr.studentId] ?? ''}
                              onChange={(e) =>
                                setGradeInputs({ ...gradeInputs, [enr.studentId]: Number(e.target.value) })
                              }
                              className={`w-24 px-3 py-1.5 border rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#075e38] focus:outline-hidden ${
                                !examAccess.allowed ? 'border-amber-300 bg-white' : 'border-slate-300'
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Ex: Excelente aproveitamento nos tópicos"
                              value={feedbackInputs[enr.studentId] ?? ''}
                              onChange={(e) =>
                                setFeedbackInputs({ ...feedbackInputs, [enr.studentId]: e.target.value })
                              }
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (!examAccess.allowed) {
                                  if (
                                    !confirm(
                                      `⚠️ ALERTA DE PROVA BLOQUEADA:\n\nO aluno ${enr.studentName} (${enr.studentId}) possui pendência financeira para esta prova: ${examAccess.reason}\n\nDeseja lançar a nota mesmo assim?`
                                    )
                                  ) {
                                    return;
                                  }
                                }
                                handleSaveSingleGrade(enr.studentId);
                              }}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs ${
                                !examAccess.allowed
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'text-white bg-[#075e38] hover:bg-[#064e2e]'
                              }`}
                            >
                              Salvar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AULAS (LMS / CADASTRO DE MATERIAIS)                                */}
        {/* ========================================================================= */}
        {activeNavTab === 'aulas' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlaySquare className="w-5 h-5 text-[#075e38]" />
                  Aulas Cadastradas & Publicação de Materiais
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disponibilize apostilas em PDF, vídeos e resumos para os alunos da turma.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {teacherClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsLessonModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Publicar Nova Aula
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.lessons
                .filter((l) => l.classId === selectedClass?.id || l.className.includes(selectedClass.name))
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-sm">{lesson.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {lesson.date}
                        </span>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Excluir Aula"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600">{lesson.description}</p>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {lesson.materials.length} anexos / apostila
                      </span>
                      <span className="text-[#075e38] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-[#075e38]" />
                        Disponível no AVA
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ATIVIDADES & TAREFAS (COM VISIBILIDADE DE QUEM FEZ/NÃO FEZ, VISTO E FEEDBACK) */}
        {/* ========================================================================= */}
        {activeNavTab === 'atividades' && (
          <div className="space-y-6">
            {/* Notificação Toast */}
            {activityToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold shadow-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{activityToast}</span>
                </div>
                <button onClick={() => setActivityToast(null)} className="text-emerald-700 hover:text-emerald-950">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* =================================================================== */}
            {/* CENÁRIO A: DENTRO DA ATIVIDADE ADICIONADA (DETALHES E VISTOS)        */}
            {/* =================================================================== */}
            {selectedAssignmentForReview ? (
              (() => {
                const targetAssignment = selectedAssignmentForReview;
                const asgClass = state.classes.find((c) => c.id === targetAssignment.classId) || selectedClass;
                const enrollmentsInClass = state.enrollments.filter(
                  (e) => e.classId === targetAssignment.classId && e.status === 'ATIVA'
                );
                const totalStudents = enrollmentsInClass.length;

                const submissionsForAsg = state.submissions.filter(
                  (s) => s.assignmentId === targetAssignment.id || s.assignmentTitle === targetAssignment.title
                );

                const studentSubMap = new Map<string, Submission>();
                submissionsForAsg.forEach((sub) => {
                  studentSubMap.set(sub.studentId, sub);
                });

                const fezStudents = enrollmentsInClass.filter((e) => studentSubMap.has(e.studentId));
                const naoFezStudents = enrollmentsInClass.filter((e) => !studentSubMap.has(e.studentId));
                const pendentesVisto = submissionsForAsg.filter((s) => s.status === 'PENDENTE_CORRECAO');
                const vistosConcluidos = submissionsForAsg.filter((s) => s.status === 'VISTO' || s.status === 'AVALIADO');

                const percentCompleted = totalStudents > 0 ? Math.round((fezStudents.length / totalStudents) * 100) : 0;

                // Filtragem dos alunos de acordo com as abas e busca
                let displayedStudents = enrollmentsInClass;
                if (assignmentStudentFilter === 'FEZ') {
                  displayedStudents = fezStudents;
                } else if (assignmentStudentFilter === 'NAO_FEZ') {
                  displayedStudents = naoFezStudents;
                } else if (assignmentStudentFilter === 'PENDENTE_VISTO') {
                  displayedStudents = enrollmentsInClass.filter((e) => {
                    const sub = studentSubMap.get(e.studentId);
                    return sub && sub.status === 'PENDENTE_CORRECAO';
                  });
                }

                if (studentSearchInsideAsg.trim()) {
                  const query = studentSearchInsideAsg.toLowerCase();
                  displayedStudents = displayedStudents.filter(
                    (e) =>
                      e.studentName.toLowerCase().includes(query) ||
                      e.studentId.toLowerCase().includes(query)
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Header de Navegação da Atividade */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <button
                          onClick={() => setSelectedAssignmentForReview(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors w-fit shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                          <span>Voltar para Lista de Atividades</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Turma: <strong className="text-slate-800">{targetAssignment.className}</strong>
                          </span>
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            Prazo: {targetAssignment.dueDate}
                          </span>
                        </div>
                      </div>

                      {/* Título & Categoria */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                              {targetAssignment.category || 'EXERCÍCIO'}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              ID: {targetAssignment.id}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                            {targetAssignment.title}
                          </h2>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 self-start">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pontuação Máxima</span>
                            <span className="text-base font-black font-mono text-[#075e38]">
                              {targetAssignment.maxScore} pts
                            </span>
                          </div>
                          <Award className="w-6 h-6 text-amber-500" />
                        </div>
                      </div>

                      {/* Enunciado e Instruções Cadastradas */}
                      <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-200/80 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-orange-950">
                          <FileText className="w-4 h-4 text-[#ea580c]" />
                          <span>Orientações & Enunciado da Atividade:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                          {targetAssignment.instructions}
                        </p>
                      </div>

                      {/* ========================================================= */}
                      {/* PAINEL DE MÉTRICAS DA ATIVIDADE (QUEM FEZ / QUEM NÃO FEZ) */}
                      {/* ========================================================= */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {/* Total de Alunos */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Alunos na Turma</span>
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-black text-slate-900 mt-2">{totalStudents}</p>
                          <span className="text-[10px] text-slate-400 font-medium">Matrículas ativas</span>
                        </div>

                        {/* Quem Fez */}
                        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase">Quem Fez</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-black text-emerald-950">{fezStudents.length}</p>
                            <span className="text-xs font-bold text-emerald-700">({percentCompleted}%)</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Entregas registradas</span>
                        </div>

                        {/* Quem Não Fez */}
                        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-800 uppercase">Quem Não Fez</span>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-black text-rose-950">{naoFezStudents.length}</p>
                            <span className="text-xs font-bold text-rose-700">
                              ({totalStudents > 0 ? 100 - percentCompleted : 0}%)
                            </span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-medium">Envios pendentes</span>
                        </div>

                        {/* Vistos Concluídos */}
                        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-800 uppercase">Vistos & Feedbacks</span>
                            <FileCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-black text-blue-950 mt-2">{vistosConcluidos.length}</p>
                          <span className="text-[10px] text-blue-600 font-medium">
                            {pendentesVisto.length > 0 ? `${pendentesVisto.length} aguardando visto` : 'Tudo visto'}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso de Adesão */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Taxa de Adesão da Turma ({fezStudents.length} de {totalStudents} entregaram)
                          </span>
                          <span className="text-emerald-700 font-mono">{percentCompleted}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#075e38] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentCompleted}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* CONTROLE DE ALUNOS, STATUS DE ENTREGA, VISTO E FEEDBACK    */}
                    {/* ========================================================= */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                      {/* Abas e Filtro de Alunos */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        {/* Abas de visualização */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => setAssignmentStudentFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                              assignmentStudentFilter === 'ALL'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Todos os Alunos</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                              {totalStudents}
                            </span>
                          </button>

                          <button
                            onClick={() => setAssignmentStudentFilter('FEZ')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                              assignmentStudentFilter === 'FEZ'
                                ? 'bg-[#075e38] text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Quem Fez</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                              {fezStudents.length}
                            </span>
                          </button>

                          <button
                            onClick={() => setAssignmentStudentFilter('NAO_FEZ')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                              assignmentStudentFilter === 'NAO_FEZ'
                                ? 'bg-rose-700 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Quem Não Fez</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                              {naoFezStudents.length}
                            </span>
                          </button>

                          <button
                            onClick={() => setAssignmentStudentFilter('PENDENTE_VISTO')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                              assignmentStudentFilter === 'PENDENTE_VISTO'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Aguardando Visto</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                              {pendentesVisto.length}
                            </span>
                          </button>
                        </div>

                        {/* Campo de Busca de Aluno */}
                        <div className="relative min-w-[240px]">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar aluno por nome ou código..."
                            value={studentSearchInsideAsg}
                            onChange={(e) => setStudentSearchInsideAsg(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Lista de Alunos e Acompanhamento de Visto */}
                      <div className="space-y-4">
                        {displayedStudents.map((enrollment) => {
                          const sub = studentSubMap.get(enrollment.studentId);
                          const hasSubmitted = !!sub;
                          const isVistoDone = sub && (sub.status === 'VISTO' || sub.status === 'AVALIADO');

                          const currentFeedback =
                            quickFeedbacks[sub ? sub.id : enrollment.studentId] !== undefined
                              ? quickFeedbacks[sub ? sub.id : enrollment.studentId]
                              : sub?.feedback || '';

                          const currentScore =
                            quickScores[sub ? sub.id : enrollment.studentId] !== undefined
                              ? quickScores[sub ? sub.id : enrollment.studentId]
                              : sub?.score !== undefined
                              ? sub.score
                              : targetAssignment.maxScore;

                          return (
                            <div
                              key={enrollment.studentId}
                              className={`p-5 rounded-2xl border transition-all text-xs ${
                                isVistoDone
                                  ? 'border-emerald-200/80 bg-emerald-50/20'
                                  : hasSubmitted
                                  ? 'border-amber-200 bg-amber-50/30 shadow-2xs'
                                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                {/* Informações do Aluno */}
                                <div className="space-y-2 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#075e38] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                      {enrollment.studentName.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 text-sm">
                                        {enrollment.studentName}
                                      </span>
                                      <span className="font-mono text-slate-500 text-[11px] ml-2">
                                        {enrollment.studentId}
                                      </span>
                                    </div>

                                    {/* Badges de Status */}
                                    {hasSubmitted ? (
                                      isVistoDone ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          Visto Realizado
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                                          Fez • Aguardando Visto
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                        Não Fez / Pendente
                                      </span>
                                    )}

                                    {sub?.deliveryMethod === 'PRESENCIAL' && (
                                      <span className="text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                                        Caderno / Presencial
                                      </span>
                                    )}
                                  </div>

                                  {/* Conteúdo da Entrega do Aluno (se fez) */}
                                  {hasSubmitted ? (
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-2 mt-2">
                                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Entregue em: <strong>{sub.submittedAt}</strong></span>
                                        {sub.attachmentName && (
                                          <span className="text-[#075e38] font-bold flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5" />
                                            {sub.attachmentName}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-slate-800 italic leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                        "{sub.submissionText}"
                                      </p>

                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          onClick={() => setSelectedSubmissionForViewModal(sub)}
                                          className="text-xs font-bold text-[#075e38] hover:underline flex items-center gap-1"
                                        >
                                          <Eye className="w-3.5 h-3.5" /> Ver Envio Completo
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic text-[11px] bg-slate-100/60 p-2.5 rounded-xl border border-slate-200">
                                      O aluno ainda não enviou esta atividade pelo AVA. Caso ele tenha apresentado em aula física no caderno, clique em "Dar Visto Presencial".
                                    </div>
                                  )}
                                </div>

                                {/* Coluna Direita: Ações de Feedback & Visto */}
                                <div className="w-full lg:w-[420px] bg-white p-4 rounded-2xl border border-slate-200 space-y-3 flex-shrink-0 shadow-2xs">
                                  {hasSubmitted ? (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                          <MessageSquare className="w-3.5 h-3.5 text-[#075e38]" />
                                          Feedback & Visto do Professor
                                        </span>
                                        {sub.score !== undefined && (
                                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Nota: {sub.score} / {targetAssignment.maxScore}
                                          </span>
                                        )}
                                      </div>

                                      {/* Se já foi dado visto */}
                                      {isVistoDone && !quickFeedbacks[sub.id] ? (
                                        <div className="space-y-2">
                                          <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-emerald-950">
                                            <p className="font-medium text-xs">
                                              {sub.feedback || 'Atividade visualizada e validada pelo professor.'}
                                            </p>
                                            {sub.gradedBy && (
                                              <p className="text-[10px] text-emerald-700 mt-1 font-bold">
                                                ✓ Visto por {sub.gradedBy} em {sub.gradedAt || 'hoje'}
                                              </p>
                                            )}
                                          </div>

                                          <div className="flex justify-end gap-2 pt-1">
                                            <button
                                              onClick={() => {
                                                setQuickFeedbacks((prev) => ({
                                                  ...prev,
                                                  [sub.id]: sub.feedback || 'Excelente trabalho!',
                                                }));
                                                setQuickScores((prev) => ({
                                                  ...prev,
                                                  [sub.id]: sub.score || targetAssignment.maxScore,
                                                }));
                                              }}
                                              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                              Editar Feedback / Visto
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Formulário Ativo para Dar Visto */
                                        <div className="space-y-2.5">
                                          {/* Sugestões Rápidas de Feedback */}
                                          <div className="flex flex-wrap gap-1">
                                            {[
                                              'Excelente trabalho! 👏',
                                              'Parabéns pelo capricho!',
                                              'Revisar atenção nas instruções.',
                                              'Visto em aula. Muito bom!',
                                            ].map((quickText) => (
                                              <button
                                                key={quickText}
                                                type="button"
                                                onClick={() =>
                                                  setQuickFeedbacks((prev) => ({
                                                    ...prev,
                                                    [sub.id]: quickText,
                                                  }))
                                                }
                                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition-colors"
                                              >
                                                {quickText}
                                              </button>
                                            ))}
                                          </div>

                                          <textarea
                                            rows={2}
                                            placeholder="Escreva um feedback pedagógico para o aluno..."
                                            value={currentFeedback}
                                            onChange={(e) =>
                                              setQuickFeedbacks((prev) => ({
                                                ...prev,
                                                [sub.id]: e.target.value,
                                              }))
                                            }
                                            className="w-full p-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                                          />

                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px] font-bold text-slate-600">Nota:</span>
                                              <input
                                                type="number"
                                                min="0"
                                                max={targetAssignment.maxScore}
                                                value={currentScore}
                                                onChange={(e) =>
                                                  setQuickScores((prev) => ({
                                                    ...prev,
                                                    [sub.id]: Number(e.target.value),
                                                  }))
                                                }
                                                className="w-16 p-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                                              />
                                              <span className="text-[11px] text-slate-400">/{targetAssignment.maxScore}</span>
                                            </div>

                                            <button
                                              onClick={() => handleQuickMarkAsSeen(sub)}
                                              className="px-4 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                              <span>Dar como Visto</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    /* Opções para aluno que NÃO FEZ */
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                          <ClipboardList className="w-3.5 h-3.5 text-rose-500" />
                                          Atividade Pendente
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-slate-500">
                                        Você pode registrar a validação presencial caso o aluno tenha mostrado o trabalho impresso ou no caderno.
                                      </p>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setManualTarget({
                                              studentId: enrollment.studentId,
                                              studentName: enrollment.studentName,
                                              assignmentId: targetAssignment.id,
                                              assignmentTitle: targetAssignment.title,
                                            });
                                            setManualFeedback('Visto presencial em caderno verificado pelo professor.');
                                            setManualScore(targetAssignment.maxScore);
                                            setIsManualModalOpen(true);
                                          }}
                                          className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Dar Visto Presencial</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {displayedStudents.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            Nenhum aluno encontrado para os filtros selecionados.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* =================================================================== */
              /* CENÁRIO B: LISTAGEM DE TODAS AS ATIVIDADES CADASTRADAS              */
              /* =================================================================== */
              <div className="space-y-6">
                {/* Header Principal da Aba */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-[#ea580c]" />
                        Gestão de Atividades & Tarefas
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Crie atividades para suas turmas, acompanhe em tempo real quem fez e quem não fez, dê feedbacks e atribua visto.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewAsgClassId(selectedClass?.id || teacherClasses[0]?.id || '');
                          setIsAssignmentModalOpen(true);
                        }}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Atividade
                      </button>
                    </div>
                  </div>

                  {/* Barra de Filtros por Turma e Pesquisa */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1 pl-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        Filtrar Turma:
                      </span>
                      <select
                        value={assignmentClassFilter}
                        onChange={(e) => setAssignmentClassFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="ALL">Todas as Minhas Turmas ({teacherClasses.length})</option>
                        {teacherClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative min-w-[260px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar atividade por título..."
                        value={assignmentSearchQuery}
                        onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                      />
                    </div>
                  </div>

                  {/* Grid das Atividades Cadastradas */}
                  {(() => {
                    let filteredAssignments = state.assignments;
                    if (assignmentClassFilter !== 'ALL') {
                      filteredAssignments = filteredAssignments.filter((a) => a.classId === assignmentClassFilter);
                    }
                    if (assignmentSearchQuery.trim()) {
                      const q = assignmentSearchQuery.toLowerCase();
                      filteredAssignments = filteredAssignments.filter(
                        (a) =>
                          a.title.toLowerCase().includes(q) ||
                          a.instructions.toLowerCase().includes(q) ||
                          a.className.toLowerCase().includes(q)
                      );
                    }

                    if (filteredAssignments.length === 0) {
                      return (
                        <div className="p-12 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#ea580c] mx-auto flex items-center justify-center">
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">Nenhuma atividade cadastrada</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Cadastre a primeira atividade para suas turmas e comece a acompanhar as entregas dos alunos.
                          </p>
                          <button
                            onClick={() => {
                              setNewAsgClassId(selectedClass?.id || teacherClasses[0]?.id || '');
                              setIsAssignmentModalOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Criar Primeira Atividade
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredAssignments.map((assignment) => {
                          const asgClass = state.classes.find((c) => c.id === assignment.classId);
                          const enrollmentsInClass = state.enrollments.filter(
                            (e) => e.classId === assignment.classId && e.status === 'ATIVA'
                          );
                          const totalStudents = enrollmentsInClass.length;

                          const submissionsForAsg = state.submissions.filter(
                            (s) => s.assignmentId === assignment.id || s.assignmentTitle === assignment.title
                          );

                          const studentIdsWhoSubmitted = new Set(submissionsForAsg.map((s) => s.studentId));
                          const fezCount = studentIdsWhoSubmitted.size;
                          const naoFezCount = Math.max(0, totalStudents - fezCount);
                          const vistosCount = submissionsForAsg.filter(
                            (s) => s.status === 'VISTO' || s.status === 'AVALIADO'
                          ).length;
                          const pendentesVistoCount = submissionsForAsg.filter(
                            (s) => s.status === 'PENDENTE_CORRECAO'
                          ).length;

                          const percentFez = totalStudents > 0 ? Math.round((fezCount / totalStudents) * 100) : 0;

                          return (
                            <div
                              key={assignment.id}
                              className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                {/* Header do Card */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200 uppercase">
                                        {assignment.category || 'EXERCÍCIO'}
                                      </span>
                                      <span className="text-[11px] font-bold text-slate-500">
                                        {assignment.className}
                                      </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                                      {assignment.title}
                                    </h3>
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja excluir a atividade "${assignment.title}"?`)) {
                                        deleteAssignment(assignment.id);
                                        showActivityToast(`Atividade excluída com sucesso.`);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    title="Excluir Atividade"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Enunciado / Instruções */}
                                <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                                  {assignment.instructions}
                                </p>

                                {/* Informações de Prazo e Nota */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Prazo: <strong className="text-slate-800">{assignment.dueDate}</strong>
                                  </span>
                                  <span className="font-mono font-bold text-[#075e38] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {assignment.maxScore} pts máx
                                  </span>
                                </div>

                                {/* Barra de Progresso e Métricas: Quem Fez vs Quem Não Fez */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Fizeram: {fezCount}
                                      </span>
                                      <span className="font-bold text-rose-700 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                        Não fizeram: {naoFezCount}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                                      {percentFez}% concluído
                                    </span>
                                  </div>

                                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#075e38] h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percentFez}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                    <span>{totalStudents} alunos matriculados</span>
                                    <span>
                                      {pendentesVistoCount > 0 ? (
                                        <strong className="text-amber-700 font-bold">
                                          {pendentesVistoCount} aguardando visto
                                        </strong>
                                      ) : (
                                        <span className="text-emerald-700 font-bold">✓ Todos os vistos em dia</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Botão de Ação: Entrar na Atividade */}
                              <div className="pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    setSelectedAssignmentForReview(assignment);
                                    setAssignmentStudentFilter('ALL');
                                    setStudentSearchInsideAsg('');
                                  }}
                                  className="w-full py-2.5 px-4 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2"
                                >
                                  <span>Abrir Atividade & Gerenciar Entregas</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="mt-12 text-center text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-500">
          <Sprout className="w-4 h-4 text-[#075e38]" />
          <span>Think Garden Platform</span>
        </div>
        <p>© 2026 Todos os direitos reservados.</p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: CADASTRAR NOVA PROVA (AREA DE PROVAS)                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Cadastrar Nova Prova / Avaliação"
        subtitle="Defina o conteúdo programático, nota máxima e critérios de aplicação"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
          {/* Título da Prova */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Título da Avaliação / Prova *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prova 1 - Simple Present, Vocabulário & Diálogos"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
            />
          </div>

          {/* Turma de Destino & Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Turma de Destino *</label>
              <select
                value={examClassId}
                onChange={(e) => setExamClassId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Avaliação *</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as AssessmentType)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
              >
                <option value="PROVA_1">Prova 1 (Midterm)</option>
                <option value="PROVA_FINAL">Prova Final (Exam)</option>
                <option value="QUIZ">Quiz / Simulado</option>
                <option value="TRABALHO">Trabalho / Projeto</option>
                <option value="RECUPERACAO">Recuperação</option>
              </select>
            </div>
          </div>

          {/* Nota Máxima & Peso na Média */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nota Máxima da Prova *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={examMaxScore}
                onChange={(e) => setExamMaxScore(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">Padrão: 100 pontos</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Peso na Média Semestral (%) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={examWeight}
                onChange={(e) => setExamWeight(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">Ex: 40%</span>
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data de Aplicação *</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário de Início</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Conteúdo Programático / Tópicos Cobrados */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Conteúdo Programático & Tópicos Cobrados *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Descreva detalhadamente as unidades, matérias, regras gramaticais, vocabulário ou fundamentos esportivos que serão exigidos na prova..."
              value={examContent}
              onChange={(e) => setExamContent(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
            />
          </div>

          {/* Instruções Gerais & Critérios */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Instruções aos Alunos & Critérios de Correção
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tempo limite de 50 minutos. Trazer caneta azul ou preta. Proibido consulta a eletrônicos."
              value={examInstructions}
              onChange={(e) => setExamInstructions(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
            />
          </div>

          {/* Regra de Liberação Financeira (Financial Gate) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Regra de Liberação Financeira (Gate de Acesso)
            </label>
            <select
              value={examRequiredStage}
              onChange={(e) => setExamRequiredStage(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
            >
              <option value="NONE">Acesso Livre (Sem restrição de pagamento)</option>
              <option value="STAGE_1_PAID">Exige 1ª Parcela Paga (Matrícula)</option>
              <option value="STAGE_2_PAID">Exige 2ª Parcela Paga (Padrão para Prova 1)</option>
              <option value="STAGE_FINAL_PAID">Exige Quitação Total (Padrão para Prova Final)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar e Agendar Prova</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DETALHES DO CONTEÚDO DA PROVA                                    */}
      {/* ========================================================================= */}
      {selectedExamForDetails && (
        <Modal
          isOpen={!!selectedExamForDetails}
          onClose={() => setSelectedExamForDetails(null)}
          title={selectedExamForDetails.title}
          subtitle={`Turma: ${selectedExamForDetails.className} • ${selectedExamForDetails.courseName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Metadata Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Nota Máxima</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {selectedExamForDetails.maxScore} pts
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Peso na Média</span>
                <span className="font-mono font-black text-purple-800 text-sm">
                  {selectedExamForDetails.weight}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Data / Hora</span>
                <span className="font-bold text-slate-800">
                  {selectedExamForDetails.date}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tipo</span>
                <span className="font-bold text-slate-800">
                  {selectedExamForDetails.type}
                </span>
              </div>
            </div>

            {/* Conteúdo Programático Formatado */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[#075e38]" />
                Conteúdo Programático & Tópicos Exigidos
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedExamForDetails.content || 'Nenhum conteúdo detalhado cadastrado.'}
              </p>
            </div>

            {/* Instruções aos Alunos */}
            {selectedExamForDetails.instructions && (
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
                <h5 className="font-bold text-amber-900">Orientações & Critérios:</h5>
                <p className="text-amber-800">{selectedExamForDetails.instructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedExamForDetails(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedClassId(selectedExamForDetails.classId);
                  setSelectedAssessmentId(selectedExamForDetails.id);
                  setSelectedExamForDetails(null);
                  setActiveNavTab('notas');
                }}
                className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e] flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 text-amber-300" />
                <span>Ir para Lançamento de Notas</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Criar Nova Turma */}
      <Modal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
        title="Cadastrar Nova Turma"
        subtitle="Think Garden Academic Core"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome da Turma</label>
            <input
              type="text"
              required
              placeholder="Ex: Soccer Class - 9º Ano B ou English Class - Beginners"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Código da Turma</label>
            <input
              type="text"
              required
              placeholder="Ex: SOC-9B ou ENG-7B"
              value={newClassCode}
              onChange={(e) => setNewClassCode(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Modalidade / Curso</label>
            <select
              value={newClassCourse}
              onChange={(e) => setNewClassCourse(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
            >
              <option value="Academia de Futebol Think Green">Academia de Futebol Think Green</option>
              <option value="Curso Livre de Inglês">Curso Livre de Inglês</option>
              <option value="Academia & Treinos para Mulheres">Academia & Treinos para Mulheres</option>
              <option value="Pré-Escola Comunitária">Pré-Escola Comunitária</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Horário das Aulas</label>
            <input
              type="text"
              required
              value={newClassSchedule}
              onChange={(e) => setNewClassSchedule(e.target.value)}
              placeholder="Ex: Terças e Quintas, 19:00 - 19:50"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Espaço / Sala</label>
            <input
              type="text"
              required
              value={newClassRoom}
              onChange={(e) => setNewClassRoom(e.target.value)}
              placeholder="Ex: Campo Sintético 01 / Sala 02"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsNewClassModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e]"
            >
              Salvar Turma
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Criar Nova Aula */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Publicar Nova Aula no AVA"
        subtitle={`Turma: ${selectedClass?.name}`}
      >
        <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Título da Aula</label>
            <input
              type="text"
              required
              placeholder="Ex: Aula 09: Expressões de Tempo e Preposições"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descrição e Roteiro de Estudo</label>
            <textarea
              rows={3}
              required
              placeholder="Descreva o conteúdo abordado na aula..."
              value={newLessonDesc}
              onChange={(e) => setNewLessonDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome do Anexo / Apostila</label>
            <input
              type="text"
              value={newLessonPdf}
              onChange={(e) => setNewLessonPdf(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e]"
            >
              Publicar no AVA
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Criar Nova Atividade / Tarefa */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Cadastrar Nova Atividade / Tarefa"
        subtitle="Defina as orientações, pontuação e prazos para a turma"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Turma Destino</label>
            <select
              value={newAsgClassId}
              onChange={(e) => setNewAsgClassId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
            >
              {teacherClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade} - {cls.period})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoria</label>
              <select
                value={newAsgCategory}
                onChange={(e) => setNewAsgCategory(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 bg-white"
              >
                <option value="EXERCÍCIO">Exercício / Fixação</option>
                <option value="TRABALHO">Trabalho em Grupo / Individual</option>
                <option value="REDAÇÃO">Redação / Produção de Texto</option>
                <option value="PROJETO">Projeto / Pesquisa</option>
                <option value="DESAFIO">Desafio / Extra</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Método de Entrega Esperado</label>
              <select
                value={newAsgDeliveryMethod}
                onChange={(e) => setNewAsgDeliveryMethod(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 bg-white"
              >
                <option value="ONLINE">Envio Online pelo Portal (AVA)</option>
                <option value="PRESENCIAL">Presencial (Caderno / Sala)</option>
                <option value="HIBRIDO">Híbrido (Online ou Caderno)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Título da Atividade</label>
            <input
              type="text"
              required
              placeholder="Ex: Atividade 04: Resumo crítico sobre Termodinâmica"
              value={newAsgTitle}
              onChange={(e) => setNewAsgTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Instruções e Enunciado para os Alunos</label>
            <textarea
              rows={4}
              required
              placeholder="Descreva detalhadamente o que os alunos devem fazer, critérios avaliativos e diretrizes de entrega..."
              value={newAsgInstructions}
              onChange={(e) => setNewAsgInstructions(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data Limite de Entrega</label>
              <input
                type="date"
                required
                value={newAsgDueDate}
                onChange={(e) => setNewAsgDueDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pontuação Máxima (Pontos)</label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={newAsgMaxScore}
                onChange={(e) => setNewAsgMaxScore(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ea580c] text-white rounded-xl font-bold hover:bg-[#c2410c] shadow-2xs"
            >
              Publicar Atividade
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar Visto Presencial no Caderno */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualTarget(null);
        }}
        title={`Dar Visto Presencial: ${manualTarget?.studentName || ''}`}
        subtitle={`Atividade: ${manualTarget?.assignmentTitle || ''}`}
      >
        <form onSubmit={handleSaveManualVisto} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Validação Presencial de Caderno / Sala
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              Esta ação registrará imediatamente que o aluno realizou a atividade presencialmente, aplicando o visto pedagógico e a pontuação configurada.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nota Atribuída</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={manualScore}
              onChange={(e) => setManualScore(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Feedback / Observação do Visto</label>
            <textarea
              rows={3}
              value={manualFeedback}
              onChange={(e) => setManualFeedback(e.target.value)}
              placeholder="Escreva comentários ou observações sobre o visto do caderno..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsManualModalOpen(false);
                setManualTarget(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold shadow-2xs"
            >
              Confirmar Visto Presencial
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar Envio Completo do Aluno */}
      {selectedSubmissionForViewModal && (
        <Modal
          isOpen={!!selectedSubmissionForViewModal}
          onClose={() => setSelectedSubmissionForViewModal(null)}
          title={`Envio do Aluno: ${selectedSubmissionForViewModal.studentName}`}
          subtitle={`Atividade: ${selectedSubmissionForViewModal.assignmentTitle}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Data da Entrega</span>
                <span className="font-bold text-slate-800">{selectedSubmissionForViewModal.submittedAt}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Atual</span>
                <Badge status={selectedSubmissionForViewModal.status} size="sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Texto / Resposta da Atividade:</label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {selectedSubmissionForViewModal.submissionText}
              </div>
            </div>

            {selectedSubmissionForViewModal.attachmentName && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Arquivo anexado: {selectedSubmissionForViewModal.attachmentName}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  PDF / Documento
                </span>
              </div>
            )}

            {selectedSubmissionForViewModal.feedback && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <span className="font-bold text-blue-950 block">Feedback Pedagógico Registrado:</span>
                <p className="text-blue-900">{selectedSubmissionForViewModal.feedback}</p>
                {selectedSubmissionForViewModal.gradedBy && (
                  <p className="text-[10px] text-blue-700 mt-1 font-semibold">
                    Avaliado por {selectedSubmissionForViewModal.gradedBy} em {selectedSubmissionForViewModal.gradedAt}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSubmissionForViewModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Avaliar Trabalho */}
      {correctingSub && (
        <Modal
          isOpen={!!correctingSub}
          onClose={() => setCorrectingSub(null)}
          title={`Avaliar: ${correctingSub.studentName}`}
          subtitle={`Atividade: ${correctingSub.assignmentTitle}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800">Resposta Enviada pelo Aluno:</p>
              <p className="text-slate-600 italic">"{correctingSub.submissionText}"</p>
              {correctingSub.attachmentName && (
                <div className="pt-2 text-[11px] text-[#075e38] font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Anexo: {correctingSub.attachmentName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nota Atribuída (0 a 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={scoreInput}
                onChange={(e) => setScoreInput(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Feedback Pedagógico do Professor</label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Escreva comentários para orientar o aluno..."
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectingSub(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  gradeSubmission(correctingSub.id, scoreInput, feedbackText);
                  setCorrectingSub(null);
                }}
                className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold"
              >
                Salvar Nota & Feedback
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
