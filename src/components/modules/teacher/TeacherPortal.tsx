import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Star,
  PlaySquare,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  Calendar,
  MinusCircle,
  ChevronLeft,
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
  BookOpen,
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
  LogOut,
  Percent,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  ThinkGardenLogo,
  SoccerBallBadge,
  USAFlagBadge,
  ReadingBookBadge,
  PreschoolBadge,
  WomenFitBadge,
} from '../../common/ThinkGardenLogos';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { AssignedModulesMenu } from '../../common/AssignedModulesMenu';
import { Assessment, AssessmentType, Assignment, Submission, Lesson, ClassAssessmentItem, ClassLessonPlan, ClassRoom } from '../../../types';
import { getDefaultAssessmentConfig } from '../../../lib/assessmentTemplates';
import { ClassHeader, ClassSubTab } from './ClassHeader';
import { ClassOverviewTab } from './ClassOverviewTab';
import { ClassContentsTab } from './ClassContentsTab';
import { ClassPeopleTab } from './ClassPeopleTab';
import { ClassGradesTab } from './ClassGradesTab';
import { ClassLessonPlanTab } from './ClassLessonPlanTab';
import { getStoredLessonPlans, saveStoredLessonPlans } from './teacherData';

export type TeacherNavTab = 'turmas' | 'chamadas' | 'provas' | 'notas' | 'aulas' | 'atividades';

export interface TeacherPortalProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  counselorMode?: boolean;
  initialClassId?: string;
  initialNavTab?: TeacherNavTab;
  onBackToCounselor?: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentTab,
  setCurrentTab,
  counselorMode = false,
  initialClassId,
  initialNavTab,
  onBackToCounselor,
}) => {
  const {
    currentUser,
    state,
    logout,
    checkClassroomAccess,
    checkExamAccess,
    saveAttendance,
    saveGrade,
    saveBatchGrades,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    createClass,
    toggleFinalGradeRelease,
    createLesson,
    deleteLesson,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    markSubmissionSeen,
    markManualStudentSubmission,
  } = useApp();

  // Active top navigation tab
  const [activeNavTab, setActiveNavTab] = useState<TeacherNavTab>(initialNavTab || 'turmas');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Sync activeNavTab and workspace with external currentTab prop (from Sidebar or router) only when not in counselorMode
  React.useEffect(() => {
    if (counselorMode) return;
    if (currentTab === 'teacher_attendance') {
      setIsInsideClassWorkspace(true);
      setClassWorkspaceSubTab('chamada');
      setActiveNavTab('turmas');
    } else if (currentTab === 'teacher_grades') {
      setIsInsideClassWorkspace(true);
      setClassWorkspaceSubTab('notas');
      setActiveNavTab('turmas');
    } else if (currentTab === 'teacher_lessons' || currentTab === 'teacher_assignments') {
      setIsInsideClassWorkspace(true);
      setClassWorkspaceSubTab('conteudos');
      setActiveNavTab('turmas');
    } else if (currentTab === 'teacher_classes' || currentTab === 'teacher_home') {
      setIsInsideClassWorkspace(false);
      setActiveNavTab('turmas');
    }
  }, [currentTab, counselorMode]);

  // Sync initialNavTab if passed externally in counselorMode
  React.useEffect(() => {
    if (initialNavTab) {
      setActiveNavTab(initialNavTab);
    }
  }, [initialNavTab]);

  const EXAM_TYPE_LABELS: Record<string, string> = {
    PROVA_1: 'Exam 1',
    PROVA_FINAL: 'Final Exam',
    TRABALHO: 'Assignment',
    QUIZ: 'Quiz',
    EXERCICIO: 'Exercise',
    'EXERCÍCIO': 'Exercise',
  };

  const CATEGORY_LABELS: Record<string, string> = {
    REDACAO: 'Essay',
    'REDAÇÃO': 'Essay',
    EXERCICIO: 'Exercise',
    'EXERCÍCIO': 'Exercise',
    PROJETO: 'Project',
    DIARIO: 'Journal',
    'DIÁRIO': 'Journal',
    PRATICA: 'Practice',
    'PRÁTICA': 'Practice',
    TRABALHO: 'Assignment',
    DESAFIO: 'Challenge',
  };

  const handleSelectNavTab = (tab: TeacherNavTab) => {
    setActiveNavTab(tab);
    if (!counselorMode) {
      if (tab === 'chamadas') setCurrentTab('teacher_attendance');
      else if (tab === 'turmas') setCurrentTab('teacher_classes');
      else if (tab === 'notas') setCurrentTab('teacher_grades');
      else if (tab === 'aulas') setCurrentTab('teacher_lessons');
      else if (tab === 'atividades') setCurrentTab('teacher_assignments');
      else if (tab === 'provas') setCurrentTab('teacher_classes');
    }
  };

  // Carousel page state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Only classes linked to the signed-in teacher (counselors keep full read access)
  const teacherClasses = React.useMemo(() => {
    if (counselorMode) return state.classes;
    const teacherId = currentUser?.id;
    if (!teacherId) return [];
    return state.classes.filter((cls) => cls.teacherId === teacherId);
  }, [state.classes, counselorMode, currentUser?.id]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || teacherClasses[0]?.id || ''
  );

  // Class-centric workspace state (Google Classroom architecture)
  const [isInsideClassWorkspace, setIsInsideClassWorkspace] = useState<boolean>(
    Boolean(initialClassId)
  );
  const [classWorkspaceSubTab, setClassWorkspaceSubTab] = useState<ClassSubTab>('visao_geral');

  React.useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
      setIsInsideClassWorkspace(true);
      if (initialNavTab === 'chamadas') {
        setClassWorkspaceSubTab('chamada');
      } else if (initialNavTab === 'notas' || initialNavTab === 'provas') {
        setClassWorkspaceSubTab('notas');
      } else if (initialNavTab === 'aulas' || initialNavTab === 'atividades') {
        setClassWorkspaceSubTab('conteudos');
      } else {
        setClassWorkspaceSubTab('visao_geral');
      }
    }
  }, [initialClassId, initialNavTab]);

  const handleEnterClass = (classId: string, subTab: ClassSubTab = 'visao_geral') => {
    setSelectedClassId(classId);
    setIsInsideClassWorkspace(true);
    setClassWorkspaceSubTab(subTab);
    setActiveNavTab('turmas');
  };

  const selectedClass: ClassRoom =
    state.classes.find((c) => c.id === selectedClassId) ||
    teacherClasses[0] || {
      id: '',
      courseId: '',
      name: 'No class selected',
      code: '',
      teacherId: '',
      teacherName: '',
      schedule: '',
      room: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
    };

  // Students enrolled in the selected class
  const classEnrollments = state.enrollments.filter(
    (e) => e.classId === selectedClass?.id && e.status === 'ATIVA'
  );

  // =========================================================================
  // 0. LESSON PLANS STATE (EXCEL REFERENCE)
  // =========================================================================
  const [lessonPlans, setLessonPlans] = useState<ClassLessonPlan[]>(() => getStoredLessonPlans());

  const handleSaveLessonPlan = (plan: ClassLessonPlan) => {
    setLessonPlans((prev) => {
      const exists = prev.some((p) => p.id === plan.id);
      const updated = exists ? prev.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...prev];
      saveStoredLessonPlans(updated);
      return updated;
    });
  };

  const handleDeleteLessonPlan = (planId: string) => {
    setLessonPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      saveStoredLessonPlans(updated);
      return updated;
    });
  };

  // =========================================================================
  // 1. ATTENDANCE STATE
  // =========================================================================
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceViewMode, setAttendanceViewMode] = useState<'diaria' | 'semanal'>('diaria');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [attendanceList, setAttendanceList] = useState<{
    [studentId: string]: {
      present: boolean;
      homeworkStatus: 'completed' | 'not_completed' | 'no_homework';
      note?: string;
    };
  }>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Helper to get 7 days of the active week based on weekOffset (Monday to Sunday)
  const currentWeekDays = React.useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeek = baseDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);

    const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDayShorts = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = new Date().toISOString().split('T')[0];

    const days: {
      dateStr: string;
      dayNumber: string;
      monthName: string;
      weekDayName: string;
      weekDayShort: string;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        dateStr,
        dayNumber: dd,
        monthName: months[d.getMonth()] || '',
        weekDayName: weekDayNames[i],
        weekDayShort: weekDayShorts[i],
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [weekOffset]);

  React.useEffect(() => {
    // Check if attendance exists for this date and class
    const existingAtt = state.attendance.find(
      (a) => a.classId === selectedClass?.id && a.date === attendanceDate
    );

    const initial: {
      [studentId: string]: {
        present: boolean;
        homeworkStatus: 'completed' | 'not_completed' | 'no_homework';
        note?: string;
      };
    } = {};
    classEnrollments.forEach((e) => {
      if (existingAtt) {
        const studentRec = existingAtt.students.find((s) => s.studentId === e.studentId);
        initial[e.studentId] = {
          present: studentRec ? studentRec.present : true,
          homeworkStatus: studentRec?.homeworkStatus || 'completed',
          note: studentRec?.note || '',
        };
      } else {
        initial[e.studentId] = { present: true, homeworkStatus: 'no_homework', note: '' };
      }
    });
    setAttendanceList(initial);
  }, [selectedClassId, attendanceDate, classEnrollments.length, state.attendance]);

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceList((prev) => ({
      ...prev,
      [studentId]: {
        present: !prev[studentId]?.present,
        homeworkStatus: prev[studentId]?.homeworkStatus || 'no_homework',
        note: prev[studentId]?.note || '',
      },
    }));
  };

  const handleSetHomeworkStatus = (
    studentId: string,
    status: 'completed' | 'not_completed' | 'no_homework'
  ) => {
    setAttendanceList((prev) => ({
      ...prev,
      [studentId]: {
        present: prev[studentId]?.present ?? true,
        homeworkStatus: status,
        note: prev[studentId]?.note || '',
      },
    }));
  };

  const handleMarkAllPresent = (present: boolean) => {
    const updated: {
      [studentId: string]: {
        present: boolean;
        homeworkStatus: 'completed' | 'not_completed' | 'no_homework';
        note?: string;
      };
    } = {};
    classEnrollments.forEach((e) => {
      updated[e.studentId] = {
        present,
        homeworkStatus: attendanceList[e.studentId]?.homeworkStatus || 'no_homework',
        note: attendanceList[e.studentId]?.note || '',
      };
    });
    setAttendanceList(updated);
  };

  const handleMarkAllHomework = (status: 'completed' | 'not_completed' | 'no_homework') => {
    const updated: {
      [studentId: string]: {
        present: boolean;
        homeworkStatus: 'completed' | 'not_completed' | 'no_homework';
        note?: string;
      };
    } = {};
    classEnrollments.forEach((e) => {
      updated[e.studentId] = {
        present: attendanceList[e.studentId]?.present ?? true,
        homeworkStatus: status,
        note: attendanceList[e.studentId]?.note || '',
      };
    });
    setAttendanceList(updated);
  };

  const handleSaveAttendance = () => {
    const records = classEnrollments.map((enr) => ({
      studentId: enr.studentId,
      studentName: enr.studentName,
      present: attendanceList[enr.studentId]?.present ?? true,
      homeworkStatus: attendanceList[enr.studentId]?.homeworkStatus || 'no_homework',
      note: attendanceList[enr.studentId]?.note || '',
    }));

    saveAttendance(selectedClass.id, attendanceDate, records, 'Attendance and homework control completed via the Electronic Attendance Register');
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 3000);
  };

  // Existing attendance record for the selected class and date
  const currentAttendance = state.attendance.find(
    (a) => a.classId === selectedClass?.id && a.date === attendanceDate
  );

  const isClassAttendanceSavedOnDate = (classId: string, dateStr: string) => {
    return state.attendance.some((a) => a.classId === classId && a.date === dateStr);
  };

  const getClassAttendanceOnDate = (classId: string, dateStr: string) => {
    return state.attendance.find((a) => a.classId === classId && a.date === dateStr);
  };

  const shiftAttendanceDate = (offsetDays: number) => {
    const parts = attendanceDate.split('-');
    if (parts.length !== 3) return;
    const cur = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    cur.setDate(cur.getDate() + offsetDays);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    setAttendanceDate(`${yyyy}-${mm}-${dd}`);
  };

  const setAttendanceToToday = () => {
    setAttendanceDate(new Date().toISOString().split('T')[0]);
  };

  const setAttendanceToYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setAttendanceDate(d.toISOString().split('T')[0]);
  };

  // Generate calendar dates list for the dates timeline strip
  const calendarDates = React.useMemo(() => {
    const datesSet = new Set<string>();

    // All dates with attendance for this class
    state.attendance
      .filter((a) => a.classId === selectedClass?.id)
      .forEach((a) => datesSet.add(a.date));

    // A rich window of days around today (-14 days to +5 days)
    const base = new Date();
    for (let i = -14; i <= 5; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      datesSet.add(d.toISOString().split('T')[0]);
    }

    if (attendanceDate) {
      datesSet.add(attendanceDate);
    }

    return Array.from(datesSet).sort();
  }, [selectedClass?.id, state.attendance, attendanceDate]);

  const formatPortugueseDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const weekDays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday'
    ];
    const weekDay = weekDays[d.getDay()] || '';
    const monthName = months[Number(month) - 1] || '';
    return `${weekDay}, ${monthName} ${day}, ${year}`;
  };

  const getDayDetails = (dateStr: string) => {
    if (!dateStr) return { day: '', month: '', weekDay: '' };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { day: '', month: '', weekDay: '' };
    const [year, month, day] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day,
      month: months[Number(month) - 1] || '',
      weekDay: weekDays[d.getDay()] || '',
    };
  };

  const renderClassBadge = (classNameStr: string, courseNameStr: string = '') => {
    const combined = `${classNameStr} ${courseNameStr}`.toLowerCase();
    if (combined.includes('futebol') || combined.includes('soccer')) {
      return <SoccerBallBadge className="w-10 h-10 sm:w-11 sm:h-11" />;
    }
    if (combined.includes('inglês') || combined.includes('english')) {
      return <USAFlagBadge className="w-10 h-10 sm:w-11 sm:h-11" />;
    }
    if (combined.includes('preschool') || combined.includes('pré-escola') || combined.includes('girassol')) {
      return <PreschoolBadge className="w-10 h-10 sm:w-11 sm:h-11" />;
    }
    if (combined.includes('mulher') || combined.includes('fitness') || combined.includes('circuito')) {
      return <WomenFitBadge className="w-10 h-10 sm:w-11 sm:h-11" />;
    }
    return <ReadingBookBadge className="w-10 h-10 sm:w-11 sm:h-11" />;
  };

  const getClassCardStyle = (cls: { name: string; courseName?: string }) => {
    const combined = `${cls.name} ${cls.courseName || ''}`.toLowerCase();
    if (combined.includes('futebol') || combined.includes('soccer')) {
      return {
        borderColor: 'border-[#075e38]',
        textColor: 'text-[#075e38]',
        hoverText: 'group-hover:text-emerald-700',
        btnBg: 'bg-[#075e38] hover:bg-[#064e2e]',
        btnBorder: 'border-slate-200 hover:border-[#075e38]',
        btnText: 'hover:text-[#075e38] hover:border-[#075e38]',
        accentColor: 'text-[#075e38]',
        badge: <SoccerBallBadge className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />,
      };
    }
    if (combined.includes('inglês') || combined.includes('ingles') || combined.includes('english')) {
      return {
        borderColor: 'border-[#533499]',
        textColor: 'text-[#533499]',
        hoverText: 'group-hover:text-purple-700',
        btnBg: 'bg-[#533499] hover:bg-[#43297a]',
        btnBorder: 'border-slate-200 hover:border-[#533499]',
        btnText: 'hover:text-[#533499] hover:border-[#533499]',
        accentColor: 'text-[#533499]',
        badge: <USAFlagBadge className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />,
      };
    }
    if (combined.includes('preschool') || combined.includes('pré-escola') || combined.includes('girassol')) {
      return {
        borderColor: 'border-[#d97706]',
        textColor: 'text-[#d97706]',
        hoverText: 'group-hover:text-amber-700',
        btnBg: 'bg-[#d97706] hover:bg-[#b45309]',
        btnBorder: 'border-slate-200 hover:border-[#d97706]',
        btnText: 'hover:text-[#d97706] hover:border-[#d97706]',
        accentColor: 'text-[#d97706]',
        badge: <PreschoolBadge className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />,
      };
    }
    if (combined.includes('mulher') || combined.includes('fitness') || combined.includes('circuito')) {
      return {
        borderColor: 'border-[#e11d48]',
        textColor: 'text-[#e11d48]',
        hoverText: 'group-hover:text-rose-700',
        btnBg: 'bg-[#e11d48] hover:bg-[#be123c]',
        btnBorder: 'border-slate-200 hover:border-[#e11d48]',
        btnText: 'hover:text-[#e11d48] hover:border-[#e11d48]',
        accentColor: 'text-[#e11d48]',
        badge: <WomenFitBadge className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />,
      };
    }
    return {
      borderColor: 'border-[#2563eb]',
      textColor: 'text-[#2563eb]',
      hoverText: 'group-hover:text-blue-700',
      btnBg: 'bg-[#2563eb] hover:bg-[#1d4ed8]',
      btnBorder: 'border-slate-200 hover:border-[#2563eb]',
      btnText: 'hover:text-[#2563eb] hover:border-[#2563eb]',
      accentColor: 'text-[#2563eb]',
      badge: <ReadingBookBadge className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />,
    };
  };

  const presentCount = classEnrollments.filter(
    (e) => attendanceList[e.studentId]?.present ?? true
  ).length;
  const absentCount = classEnrollments.length - presentCount;

  const homeworkDoneCount = classEnrollments.filter(
    (e) => (attendanceList[e.studentId]?.homeworkStatus || 'no_homework') === 'completed'
  ).length;
  const homeworkNotDoneCount = classEnrollments.filter(
    (e) => (attendanceList[e.studentId]?.homeworkStatus || 'no_homework') === 'not_completed'
  ).length;
  const homeworkNoneCount = classEnrollments.filter(
    (e) => (attendanceList[e.studentId]?.homeworkStatus || 'no_homework') === 'no_homework'
  ).length;

  // =========================================================================
  // 2. EXAMS / ASSESSMENTS STATE & MODALS
  // =========================================================================
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<Assessment | null>(null);
  const [examSearch, setExamSearch] = useState('');
  const [examFilterClass, setExamFilterClass] = useState('ALL');

  // Form state for creating Exam - linked strictly to pre-selected assessment items of the class
  const [examClassId, setExamClassId] = useState(selectedClass?.id || teacherClasses[0]?.id || '');
  const currentExamClass = React.useMemo(() => {
    return state.classes.find((c) => c.id === examClassId) || selectedClass || teacherClasses[0];
  }, [state.classes, examClassId, selectedClass, teacherClasses]);

  const availableClassAssessmentItems: ClassAssessmentItem[] = React.useMemo(() => {
    if (currentExamClass?.assessmentConfig && currentExamClass.assessmentConfig.length > 0) {
      return currentExamClass.assessmentConfig;
    }
    const tmpl = currentExamClass?.assessmentTemplate || 'ADULT_A1';
    return getDefaultAssessmentConfig(tmpl);
  }, [currentExamClass]);

  const [selectedAssessmentItemId, setSelectedAssessmentItemId] = useState<string>('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<AssessmentType>('PROVA_1');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examTime, setExamTime] = useState('19:00');
  const [examMaxScore, setExamMaxScore] = useState(100);
  const [examWeight, setExamWeight] = useState(30);
  const [examRequiredStage, setExamRequiredStage] = useState<'NONE' | 'STAGE_1_PAID' | 'STAGE_2_PAID' | 'STAGE_FINAL_PAID'>('STAGE_2_PAID');
  const [examContent, setExamContent] = useState('');
  const [examInstructions, setExamInstructions] = useState('');
  const [examSuccessToast, setExamSuccessToast] = useState(false);

  // Sync selected assessment item whenever target class or available items change
  React.useEffect(() => {
    if (availableClassAssessmentItems.length > 0) {
      // Find matching item or default to first
      const currentMatched = availableClassAssessmentItems.find((it) => it.id === selectedAssessmentItemId) || availableClassAssessmentItems[0];
      setSelectedAssessmentItemId(currentMatched.id);
      setExamTitle(currentMatched.name);
      setExamWeight(currentMatched.weight);
      if (currentMatched.type === 'MIDTERM') setExamType('PROVA_1');
      else if (currentMatched.type === 'FINAL') setExamType('PROVA_FINAL');
      else if (currentMatched.type === 'HOMEWORK') setExamType('TRABALHO');
      else if (currentMatched.type === 'UNIT_TESTS') setExamType('QUIZ');
      else setExamType('PROVA_1');
    }
  }, [examClassId, availableClassAssessmentItems]);

  const handleSelectAssessmentItem = (itemId: string) => {
    setSelectedAssessmentItemId(itemId);
    const item = availableClassAssessmentItems.find((it) => it.id === itemId);
    if (item) {
      setExamTitle(item.name);
      setExamWeight(item.weight);
      if (item.type === 'MIDTERM') setExamType('PROVA_1');
      else if (item.type === 'FINAL') setExamType('PROVA_FINAL');
      else if (item.type === 'HOMEWORK') setExamType('TRABALHO');
      else if (item.type === 'UNIT_TESTS') setExamType('QUIZ');
      else setExamType('PROVA_1');
    }
  };

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
      description: examContent ? examContent.substring(0, 120) : `Official assessment linked to the class criteria: ${examTitle} (${examWeight}%)`,
      content: examContent || `Official Think Green curriculum assessment: ${examTitle}. Configured weight: ${examWeight}%.`,
      instructions: examInstructions || 'In-person/curriculum assessment linked to the criteria approved by the Educational Guidance team.',
      status: 'AGENDADA',
    });

    setIsExamModalOpen(false);
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
  // 3. GRADES STATE & ACTIONS
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
    const feedback = feedbackInputs[studentId] || 'Participation successfully assessed.';
    saveGrade(currentAssessment.id, studentId, score, feedback);
    setGradeSaved(true);
    setTimeout(() => setGradeSaved(false), 2500);
  };

  const handleSaveAllGrades = () => {
    if (!currentAssessment) return;
    const batch = classEnrollments.map((enr) => ({
      studentId: enr.studentId,
      score: gradeInputs[enr.studentId] ?? 0,
      feedback: feedbackInputs[enr.studentId] || 'Performance assessed by the teacher.',
    }));

    saveBatchGrades(currentAssessment.id, batch);
    setGradeSaved(true);
    setTimeout(() => setGradeSaved(false), 3000);
  };

  // =========================================================================
  // 4. LESSONS & ASSIGNMENTS STATE
  // =========================================================================
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonPdf, setNewLessonPdf] = useState('ThinkGreen_Official_Workbook.pdf');
  const [newLessonLink, setNewLessonLink] = useState('');
  const [newLessonLinkTitle, setNewLessonLinkTitle] = useState('');

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const materialsList: Lesson['materials'] = [];
    if (newLessonPdf.trim()) {
      const isDoc = newLessonPdf.toLowerCase().endsWith('.doc') || newLessonPdf.toLowerCase().endsWith('.docx');
      materialsList.push({
        id: `mat_${Date.now()}_doc`,
        title: newLessonPdf.trim(),
        type: isDoc ? 'DOC' : 'PDF',
        url: '#',
        size: '2.4 MB',
      });
    }
    if (newLessonLink.trim()) {
      materialsList.push({
        id: `mat_${Date.now()}_link`,
        title: newLessonLinkTitle.trim() || 'Supplementary Study Link',
        type: 'LINK',
        url: newLessonLink.trim(),
      });
    }

    createLesson({
      classId: selectedClass.id,
      className: selectedClass.name,
      title: newLessonTitle,
      description: newLessonDesc,
      date: new Date().toISOString().split('T')[0],
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      materials: materialsList.length > 0 ? materialsList : [
        {
          id: `mat_${Date.now()}`,
          title: 'Pedagogical_Document.pdf',
          type: 'PDF',
          url: '#',
          size: '1.2 MB',
        },
      ],
    });
    setIsLessonModalOpen(false);
    setNewLessonTitle('');
    setNewLessonDesc('');
    setNewLessonPdf('ThinkGreen_Official_Workbook.pdf');
    setNewLessonLink('');
    setNewLessonLinkTitle('');
  };

  // =========================================================================
  // 4. ASSIGNMENTS & TASKS STATE & ACTIONS
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
    showActivityToast(`Assignment "${created.title}" created successfully! You can now track who submitted, give feedback and mark it as reviewed.`);
  };

  // Manual Submission / In-Person Review Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTarget, setManualTarget] = useState<{ studentId: string; studentName: string; assignmentId: string; assignmentTitle: string } | null>(null);
  const [manualFeedback, setManualFeedback] = useState('Assignment validated in class by the teacher.');
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
    showActivityToast(`In-person review successfully recorded for ${manualTarget.studentName}!`);
  };

  // Quick Action: Mark an existing submission as reviewed
  const handleQuickMarkAsSeen = (submission: Submission) => {
    const feedback = quickFeedbacks[submission.id] || submission.feedback || 'Assignment reviewed and validated by the teacher.';
    const score = quickScores[submission.id] !== undefined ? quickScores[submission.id] : (submission.score !== undefined ? submission.score : 100);
    
    markSubmissionSeen(submission.id, feedback, score);
    showActivityToast(`Review successfully assigned to ${submission.studentName}!`);
  };

  // Modal Correction
  const [correctingSub, setCorrectingSub] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(90);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const classSubmissions = state.submissions.filter((s) =>
    classEnrollments.some((e) => e.studentId === s.studentId) || s.assignmentTitle.includes(selectedClass.name)
  );

  // Dynamic Dashboard Stats (only the teacher's own classes)
  const teacherClassIds = new Set(teacherClasses.map((c) => c.id));
  const totalClassesCount = teacherClasses.length;
  const totalStudentsCount = state.enrollments.filter(
    (e) => e.status === 'ATIVA' && teacherClassIds.has(e.classId)
  ).length;
  const teacherAssignmentIds = new Set(
    state.assignments.filter((a) => teacherClassIds.has(a.classId)).map((a) => a.id)
  );
  const pendingSubmissionsCount = state.submissions.filter(
    (s) => s.status === 'PENDENTE_CORRECAO' && teacherAssignmentIds.has(s.assignmentId)
  ).length;
  const upcomingLessons = state.lessons
    .filter((lesson) => teacherClassIds.has(lesson.classId))
    .slice(0, 3);

  return (
    <div className={counselorMode ? "text-slate-800 font-sans pb-16" : "min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16"}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER - TEACHER HEADER OR COUNSELOR SUPERVISION BANNER            */}
      {/* ========================================================================= */}
      {counselorMode ? (
        <div className="bg-gradient-to-r from-emerald-950 via-[#075e38] to-teal-900 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-md border border-emerald-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              {onBackToCounselor && (
                <button
                  onClick={onBackToCounselor}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-white/20 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Classes</span>
                </button>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                    Pedagogical Supervision
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-emerald-100 font-mono">
                    {selectedClass.code}
                  </span>
                  <span className="text-[11px] text-emerald-200">
                    Same View as the Teacher Panel
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  {selectedClass.name}
                </h1>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Course: <span className="font-semibold text-white">{selectedClass.courseName}</span> • Teacher:{' '}
                  <span className="font-semibold text-white">{selectedClass.teacherName || 'Teacher in Charge'}</span> • {selectedClass.schedule} • {selectedClass.room}
                </p>
              </div>
            </div>

            {/* Quick Switcher dropdown & Class count */}
            <div className="flex items-center gap-3 bg-black/25 p-2.5 rounded-2xl border border-white/10 self-start lg:self-auto">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">
                  Switch Class
                </p>
                <p className="text-[11px] text-emerald-100">
                  {teacherClasses.length} classes available
                </p>
              </div>

              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl border border-slate-200 shadow-xs cursor-pointer focus:ring-2 focus:ring-amber-400 outline-hidden max-w-[220px]"
              >
                {teacherClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>

              {onBackToCounselor && (
                <button
                  onClick={onBackToCounselor}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Class Grid
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <header className="w-full bg-white border-b border-slate-200/80 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
            {/* Left: Think Green Platform Logo */}
            <div className="flex items-center">
              <ThinkGardenLogo />
            </div>

            {/* Center: TEACHER PANEL Title */}
            <div className="text-center hidden md:block">
              <h1 className="text-base sm:text-xl font-bold tracking-[0.22em] text-slate-900 uppercase">
                TEACHER PANEL
              </h1>
            </div>

            {/* Right: User Profile Pill & Actions */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <AssignedModulesMenu />
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
                      {currentUser.name || 'Teacher'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium leading-none mt-0.5">
                      Teacher
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
                        Authorized Teacher
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className={counselorMode ? "w-full space-y-6" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8"}>
        {/* Global Action Toasts */}
        {examSuccessToast && (
          <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>A new exam has been registered successfully! The content and maximum grade are already linked to the class and the student portal.</span>
            </div>
            <button
              onClick={() => handleEnterClass(examClassId || selectedClass.id, 'conteudos')}
              className="px-3 py-1 bg-[#075e38] text-white rounded-lg text-[11px] font-bold hover:bg-[#064e2e] cursor-pointer"
            >
              View in Class
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: CLASSES (CLASS-CENTRIC WORKSPACE - GOOGLE CLASSROOM ARCHITECTURE)    */}
        {/* ========================================================================= */}
        {activeNavTab === 'turmas' && isInsideClassWorkspace && selectedClass && (
          <div className="space-y-6">
            <ClassHeader
              selectedClass={selectedClass}
              allClasses={teacherClasses}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              onBackToClasses={() => {
                setIsInsideClassWorkspace(false);
                if (counselorMode && onBackToCounselor) {
                  onBackToCounselor();
                }
              }}
              activeSubTab={classWorkspaceSubTab}
              onChangeSubTab={(tab) => setClassWorkspaceSubTab(tab)}
              studentsCount={
                state.enrollments.filter((e) => e.classId === selectedClass.id && e.status === 'ATIVA').length ||
                state.students.length
              }
              onOpenNewExam={() => {
                setExamClassId(selectedClass.id);
                setIsExamModalOpen(true);
              }}
              onOpenNewLesson={() => setIsLessonModalOpen(true)}
              onOpenNewAssignment={() => {
                setNewAsgClassId(selectedClass.id);
                setIsAssignmentModalOpen(true);
              }}
              counselorMode={counselorMode}
            />

            {/* SUB-TAB 1: OVERVIEW (Wall, Notices, Shortcuts, Indicators) */}
            {classWorkspaceSubTab === 'visao_geral' && (
              <ClassOverviewTab
                selectedClass={selectedClass}
                studentsCount={
                  state.enrollments.filter((e) => e.classId === selectedClass.id && e.status === 'ATIVA').length ||
                  state.students.length
                }
                classAssessments={state.assessments.filter((a) => a.classId === selectedClass.id)}
                classAssignments={state.assignments.filter((a) => a.classId === selectedClass.id)}
                classLessons={state.lessons.filter((l) => l.classId === selectedClass.id)}
                pendingSubmissionsCount={
                  state.submissions.filter(
                    (s) =>
                      s.status === 'PENDENTE_CORRECAO' &&
                      state.assignments.some((asg) => asg.id === s.assignmentId && asg.classId === selectedClass.id)
                  ).length
                }
                attendanceRatePercent={93}
                onNavigateToTab={(tab) => setClassWorkspaceSubTab(tab)}
                onOpenExamDetails={(exam) => setSelectedExamForDetails(exam)}
                onOpenNewLesson={() => setIsLessonModalOpen(true)}
                onOpenNewAssignment={() => {
                  setNewAsgClassId(selectedClass.id);
                  setIsAssignmentModalOpen(true);
                }}
                onOpenNewExam={() => {
                  setExamClassId(selectedClass.id);
                  setIsExamModalOpen(true);
                }}
              />
            )}

            {/* SUB-TAB 2: CONTENT (Classwork with Topics, Materials, Assignments and Exams) */}
            {classWorkspaceSubTab === 'conteudos' && (
              <ClassContentsTab
                selectedClass={selectedClass}
                classLessons={state.lessons.filter((l) => l.classId === selectedClass.id)}
                classAssignments={state.assignments.filter((a) => a.classId === selectedClass.id)}
                classAssessments={state.assessments.filter((a) => a.classId === selectedClass.id)}
                submissions={state.submissions}
                onOpenNewLesson={() => setIsLessonModalOpen(true)}
                onOpenNewAssignment={() => {
                  setNewAsgClassId(selectedClass.id);
                  setIsAssignmentModalOpen(true);
                }}
                onOpenNewExam={() => {
                  setExamClassId(selectedClass.id);
                  setIsExamModalOpen(true);
                }}
                onDeleteLesson={(id) => deleteLesson(id)}
                onDeleteAssignment={(id) => deleteAssignment(id)}
                onDeleteAssessment={(id) => deleteAssessment(id)}
                onOpenExamDetails={(exam) => setSelectedExamForDetails(exam)}
                onReviewAssignmentSubmissions={(asg) => {
                  setSelectedAssignmentForReview(asg);
                }}
                onLaunchExamGrades={(exam) => {
                  setSelectedAssessmentId(exam.id);
                  setClassWorkspaceSubTab('notas');
                }}
              />
            )}

            {/* SUB-TAB: LESSON PLAN (BASED ON THE EXCEL TEMPLATE) */}
            {classWorkspaceSubTab === 'plano_aula' && (
              <ClassLessonPlanTab
                selectedClass={selectedClass}
                lessonPlans={lessonPlans}
                onSaveLessonPlan={handleSaveLessonPlan}
                onDeleteLessonPlan={handleDeleteLessonPlan}
              />
            )}

            {/* SUB-TAB 3: STUDENTS (Teachers and Students with Performance and History) */}
            {classWorkspaceSubTab === 'pessoas' && (
              <ClassPeopleTab
                selectedClass={selectedClass}
                students={state.students}
                enrollments={state.enrollments}
                assessments={state.assessments.filter((a) => a.classId === selectedClass.id)}
                grades={state.grades}
                assignments={state.assignments.filter((a) => a.classId === selectedClass.id)}
                submissions={state.submissions}
                attendanceRecords={state.attendance}
              />
            )}

            {/* SUB-TAB 4: GRADES (Gradebook and Entry by Assessment) */}
            {classWorkspaceSubTab === 'notas' && (
              <ClassGradesTab
                selectedClass={selectedClass}
                students={
                  state.students.filter((st) =>
                    state.enrollments.some((e) => e.studentId === st.id && e.classId === selectedClass.id && e.status === 'ATIVA')
                  ).length > 0
                    ? state.students.filter((st) =>
                        state.enrollments.some((e) => e.studentId === st.id && e.classId === selectedClass.id && e.status === 'ATIVA')
                      )
                    : state.students
                }
                assessments={state.assessments.filter((a) => a.classId === selectedClass.id)}
                grades={state.grades}
                assignments={state.assignments.filter((a) => a.classId === selectedClass.id)}
                submissions={state.submissions}
                onSaveGrade={(g) => {
                  saveGrade(g.assessmentId, g.studentId, g.score, g.feedback);
                }}
                onSaveBatchGrades={(batch) => {
                  if (batch.length > 0) {
                    saveBatchGrades(
                      batch[0].assessmentId,
                      batch.map((b) => ({ studentId: b.studentId, score: b.score, feedback: b.feedback }))
                    );
                  }
                }}
                onOpenExamDetails={(exam) => setSelectedExamForDetails(exam)}
                onToggleFinalGradeRelease={(rel) => toggleFinalGradeRelease(selectedClass.id, rel)}
              />
            )}

            {/* SUB-TAB 5: ATTENDANCE (With Homework Recording - Req. 2) */}
            {classWorkspaceSubTab === 'chamada' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#075e38] flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Electronic Attendance & Homework Log — {selectedClass.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Record attendance and homework independently for each student
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAllPresent(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075e38] text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllHomework('completed')}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                    >
                      Mark All Completed HW
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllHomework('no_homework')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                      title="First lesson of a level or a post-exam lesson (does not penalize or count toward the calculation)"
                    >
                      No Homework Today
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="px-4 py-2 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Attendance</span>
                    </button>
                  </div>
                </div>

                {attendanceSaved && (
                  <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Class attendance and homework records saved successfully!</span>
                  </div>
                )}

                {/* Date bar & Summary Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Attendance Date:</span>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  {/* Presence and Homework counters */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                    <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                      {presentCount} Present
                    </span>
                    <span className="text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                      {absentCount} Absent
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200" title="Students who completed the homework">
                      ✓ {homeworkDoneCount} Completed HW
                    </span>
                    <span className="text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200" title="Students who did not complete the homework (counts toward the calculation)">
                      ✗ {homeworkNotDoneCount} Missed HW
                    </span>
                    <span className="text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300" title="Lessons without an assignment (does not penalize or count toward the average)">
                      — {homeworkNoneCount} No HW
                    </span>
                  </div>
                </div>

                {/* Students attendance list with Homework 3-Option Selector */}
                <div className="divide-y divide-slate-100">
                  {classEnrollments.map((enr) => {
                    const isPresent = attendanceList[enr.studentId]?.present ?? true;
                    const hwStatus = attendanceList[enr.studentId]?.homeworkStatus || 'no_homework';

                    return (
                      <div
                        key={enr.studentId}
                        className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {enr.studentName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                              {enr.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Enrollment: {enr.studentId}
                            </span>
                          </div>
                        </div>

                        {/* Controls: Homework 3-options + Presence Button */}
                        <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                          {/* Requirement 2: Homework Status 3-way toggle */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">
                              HW:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetHomeworkStatus(enr.studentId, 'completed')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                hwStatus === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                              title="Completed the homework"
                            >
                              ✓ Done
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetHomeworkStatus(enr.studentId, 'not_completed')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                hwStatus === 'not_completed'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                              title="Did not complete the homework (counted in the grade)"
                            >
                              ✗ Missed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetHomeworkStatus(enr.studentId, 'no_homework')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                hwStatus === 'no_homework'
                                  ? 'bg-slate-700 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                              title="There was no homework for this lesson (does not penalize or count toward the calculation)"
                            >
                              — None Assigned
                            </button>
                          </div>

                          {/* Presence Button (Independent of homework) */}
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(enr.studentId)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-[#075e38] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {isPresent ? '✓ Present' : 'Absent'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: CLASSES (MAIN DASHBOARD VIEW - LIST OF ALL CLASSES)              */}
        {/* ========================================================================= */}
        {activeNavTab === 'turmas' && !isInsideClassWorkspace && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: GREETING + STATS + MY CLASSES */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-8 space-y-6 sm:space-y-7">
              {/* Top Greeting Block */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f5e9] text-[#075e38] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Hello, {currentUser.name || 'Teacher'}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Here is a summary of your classes, exams, and activities.
                  </p>
                </div>
              </div>

              {/* 4 Stat Pills Row */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Stat 1: Classes */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {totalClassesCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Classes
                    </span>
                  </div>
                </div>

                {/* Stat 2: Students */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {totalStudentsCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Students
                    </span>
                  </div>
                </div>

                {/* Stat 3: Pending activities */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center flex-shrink-0">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {pendingSubmissionsCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block leading-tight">
                      Pending activities
                    </span>
                  </div>
                </div>

                {/* Stat 4: Exams / Assessments */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight block">
                      {state.assessments.length}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium block">
                      Registered exams
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Header: MY CLASSES */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                  MY CLASSES
                </h3>
              </div>

              {/* Class Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {teacherClasses.map((c) => {
                  const style = getClassCardStyle(c);
                  const enrolled = state.enrollments.filter(
                    (e) => e.classId === c.id && e.status === 'ATIVA'
                  ).length;
                  const examsCount = state.assessments.filter((a) => a.classId === c.id).length;
                  const lessonsCount = state.lessons.filter((l) => l.classId === c.id).length;

                  return (
                    <div 
                      key={c.id}
                      onClick={() => handleEnterClass(c.id, 'visao_geral')}
                      className={`rounded-2xl border-2 ${style.borderColor} bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative group cursor-pointer overflow-hidden`}
                    >
                      <div>
                        {/* Header: Badge & Class Name with strict containment inside the card */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 pt-0.5">
                            {style.badge}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <h4 
                              className={`text-sm sm:text-base font-black ${style.textColor} tracking-tight leading-snug uppercase ${style.hoverText} transition-colors break-words line-clamp-2`}
                              title={c.name}
                            >
                              {c.name}
                            </h4>
                            <span 
                              className="text-xs text-slate-500 font-medium truncate block mt-0.5"
                              title={`${c.code ? `${c.code} • ` : ''}${c.courseName || 'Course'}`}
                            >
                              {c.code ? `${c.code} • ` : ''}{c.courseName || 'Course'}
                            </span>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5 text-xs text-slate-600 my-3.5">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{enrolled} enrolled students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className={`w-3.5 h-3.5 ${style.accentColor} flex-shrink-0`} />
                            <span className="truncate">{examsCount} {examsCount === 1 ? 'assessment' : 'assessments'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PlaySquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{lessonsCount} {lessonsCount === 1 ? 'lesson created' : 'lessons created'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-3 border-t border-slate-100 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterClass(c.id, 'visao_geral');
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl ${style.btnBg} text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer`}
                        >
                          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">Enter Class Environment</span>
                          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnterClass(c.id, 'chamada');
                            }}
                            className={`py-1.5 px-2 rounded-lg border ${style.btnBorder} ${style.btnText} text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                          >
                            <CalendarCheck className={`w-3 h-3 ${style.accentColor} flex-shrink-0`} />
                            <span className="truncate">Attendance</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnterClass(c.id, 'conteudos');
                            }}
                            className={`py-1.5 px-2 rounded-lg border ${style.btnBorder} ${style.btnText} text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                          >
                            <BookMarked className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">Content</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: UPCOMING LESSONS & PENDING ACTIVITIES */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: UPCOMING LESSONS */}
              <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                      UPCOMING LESSONS
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedClassId) handleEnterClass(selectedClassId, 'conteudos');
                    }}
                    className="text-[11px] text-[#075e38] font-bold hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-4">
                  {upcomingLessons.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400 font-medium">
                      No lessons published for your classes.
                    </p>
                  ) : (
                    upcomingLessons.map((lesson) => {
                      const lessonClass = state.classes.find((c) => c.id === lesson.classId);
                      const style = getClassCardStyle(lessonClass || { name: lesson.className });
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleEnterClass(lesson.classId, 'conteudos')}
                          className="flex items-center justify-between pb-3.5 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.borderColor.replace('border-', 'bg-')}`}
                            />
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-xs font-bold ${style.textColor} leading-tight truncate`}
                              >
                                {lesson.className || lessonClass?.name}
                              </h4>
                              <p className="text-xs text-slate-700 font-medium leading-tight truncate">
                                {lesson.title}
                              </p>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {lesson.date}
                                  {lesson.teacherName ? ` • ${lesson.teacherName}` : ''}
                                </span>
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 2: PENDING ACTIVITIES */}
              <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                      PENDING ACTIVITIES
                    </h3>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {pendingSubmissionsCount} to grade
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
                          setFeedbackText('Good job!');
                        }}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-300 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{sub.submittedAt.split(' ')[0]}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{sub.assignmentTitle}</p>
                        <span className="inline-block text-[10px] text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
                          Click to grade
                        </span>
                      </div>
                    ))}

                  {pendingSubmissionsCount === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                      <p className="font-bold text-slate-600">All caught up!</p>
                      <p className="text-[11px]">No activities pending grading.</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (selectedClassId) handleEnterClass(selectedClassId, 'conteudos');
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center block mt-2 cursor-pointer"
                  >
                    View Activities in Classes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ATTENDANCE (ELECTRONIC ATTENDANCE LOG - WITH WEEKLY VIEW)         */}
        {/* ========================================================================= */}
        {activeNavTab === 'chamadas' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Top Main Banner & Summary */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-100/80 text-[#075e38]">
                      <CalendarCheck className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Official Attendance & Frequency Log
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Select a class, switch between daily entry or the weekly grid, and confirm student attendance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle Switcher (Daily vs Weekly) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setAttendanceViewMode('diaria')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      attendanceViewMode === 'diaria'
                        ? 'bg-[#075e38] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Daily Entry</span>
                  </button>
                  <button
                    onClick={() => setAttendanceViewMode('semanal')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      attendanceViewMode === 'semanal'
                        ? 'bg-[#075e38] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Weekly View</span>
                  </button>
                </div>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. Selected Class */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex-shrink-0">
                    {renderClassBadge(selectedClass.name, selectedClass.courseName)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Selected Class
                    </span>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {selectedClass.name}
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {classEnrollments.length} enrolled students
                    </span>
                  </div>
                </div>

                {/* 2. Attendance Date */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Attendance Date
                    </span>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {formatPortugueseDate(attendanceDate)}
                    </p>
                    {currentAttendance ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <Check className="w-3 h-3 text-emerald-600" /> Recorded in the system
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <MinusCircle className="w-3 h-3 text-slate-400" /> Not recorded
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Attendance Count */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 border border-purple-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Attendance Marked
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {presentCount} Present
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                        {absentCount} Absent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 1. CLASS SELECTION (CARD STYLE AS BEFORE)                        */}
            {/* ===================================================================== */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#075e38] text-white text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>CLASS SELECTION (CLICK TO SWITCH)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose below which class you want to view and take attendance for:
                  </p>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Total: <strong className="text-slate-800">{teacherClasses.length} classes</strong> under your responsibility
                </div>
              </div>

              {/* Responsive Cards Grid for All Classes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
                {teacherClasses.map((c) => {
                  const isSelected = c.id === selectedClassId;
                  const enrolledCount = state.enrollments.filter(
                    (e) => e.classId === c.id && e.status === 'ATIVA'
                  ).length;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const hasAttendanceToday = isClassAttendanceSavedOnDate(c.id, todayStr);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 overflow-hidden ${
                        isSelected
                          ? 'border-[#075e38] bg-emerald-50/50 shadow-md ring-2 ring-[#075e38]/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/70 hover:shadow-xs'
                      }`}
                    >
                      {/* Selected Badge */}
                      {isSelected && (
                        <span className="absolute -top-2.5 right-4 bg-[#075e38] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> CLASS SELECTED
                        </span>
                      )}

                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex-shrink-0">
                          {renderClassBadge(c.name, c.courseName)}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <h4
                            className={`text-sm font-black tracking-tight leading-tight break-words line-clamp-2 ${
                              isSelected ? 'text-[#075e38]' : 'text-slate-900'
                            }`}
                            title={c.name}
                          >
                            {c.name}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                            {c.courseName || 'Course'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {c.room || 'Room'} • {c.schedule || 'Schedule'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {enrolledCount} students
                        </span>

                        {/* Status indicators */}
                        {hasAttendanceToday ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done Today
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                            <MinusCircle className="w-3 h-3 text-slate-400" /> Pending Today
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===================================================================== */}
            {/* VIEW 1: DAILY MODE (SINGLE ENTRY WITH A SINGLE SAVE AT THE END)   */}
            {/* ===================================================================== */}
            {attendanceViewMode === 'diaria' && (
              <>
                {/* 2. ATTENDANCE DATE & CALENDAR WITH CHECK AND GRAY */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#075e38] text-white text-xs flex items-center justify-center font-bold">
                          2
                        </span>
                        <span>ATTENDANCE DATE & RECORDED DAYS</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select a date on the calendar. Days with attendance already taken show a <strong>green check (✓)</strong>, and unfilled days show a <strong>gray indicator (•)</strong>.
                      </p>
                    </div>

                    {/* Legend for Checkmark & Gray */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✓ Recorded</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                        <MinusCircle className="w-4 h-4 text-slate-400" />
                        <span>• Not recorded (gray)</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/60 border border-[#075e38] text-[#075e38] font-bold">
                        <span>🎯 Active Date</span>
                      </span>
                    </div>
                  </div>

                  {/* Direct Date Controls Bar */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                          Choose Specific Date:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:border-[#075e38] focus:ring-2 focus:ring-emerald-200 focus:outline-hidden shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end">
                        <button
                          onClick={setAttendanceToToday}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          onClick={setAttendanceToYesterday}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => shiftAttendanceDate(-1)}
                          className="px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Previous Day"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>
                        <button
                          onClick={() => shiftAttendanceDate(1)}
                          className="px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Next Day"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Active Date Badge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">
                          Currently Selected Date:
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {formatPortugueseDate(attendanceDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Calendar Days Strip */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600">
                        Select a day below to view or fill in attendance:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ← Swipe to see more days →
                      </span>
                    </div>

                    <div className="flex items-stretch gap-2.5 overflow-x-auto pb-3 pt-1.5 no-scrollbar">
                      {calendarDates.map((d) => {
                        const dDetails = getDayDetails(d);
                        const attRecord = getClassAttendanceOnDate(selectedClass.id, d);
                        const isFilled = Boolean(attRecord);
                        const isSelected = d === attendanceDate;
                        const isToday = d === new Date().toISOString().split('T')[0];

                        return (
                          <button
                            key={d}
                            onClick={() => setAttendanceDate(d)}
                            className={`min-w-[95px] sm:min-w-[105px] p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all relative border-2 cursor-pointer ${
                              isSelected
                                ? 'ring-3 ring-[#075e38] border-[#075e38] shadow-md -translate-y-1 z-10'
                                : isFilled
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/80'
                                : 'bg-slate-100/90 border-slate-200 text-slate-500 hover:bg-slate-200/70'
                            } ${
                              isSelected && isFilled
                                ? 'bg-emerald-100/90 text-emerald-950'
                                : isSelected && !isFilled
                                ? 'bg-slate-200/90 text-slate-700'
                                : ''
                            }`}
                          >
                            {/* Selected Tag */}
                            {isSelected && (
                              <span className="absolute -top-2.5 bg-[#075e38] text-white text-[9px] font-black uppercase px-2 py-0.2 rounded-full shadow-xs">
                                Active
                              </span>
                            )}

                            {/* Weekday & Today Tag */}
                            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                              <span
                                className={
                                  isSelected
                                    ? 'text-[#075e38]'
                                    : isFilled
                                    ? 'text-emerald-700'
                                    : 'text-slate-400'
                                }
                              >
                                {dDetails.weekDay}
                              </span>
                              {isToday && (
                                <span className="bg-amber-100 text-amber-900 text-[8px] font-extrabold px-1 rounded">
                                  Today
                                </span>
                              )}
                            </div>

                            {/* Day Number and Month */}
                            <div className="my-1">
                              <span
                                className={`text-xl font-black block leading-none ${
                                  isSelected
                                    ? 'text-slate-900'
                                    : isFilled
                                    ? 'text-emerald-900'
                                    : 'text-slate-600'
                                }`}
                              >
                                {dDetails.day}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">
                                {dDetails.month}
                              </span>
                            </div>

                            {/* Visual Indicator: GREEN CHECK (CORRETO) vs GRAY INDICATOR (CINZA) */}
                            <div className="w-full pt-2 border-t border-slate-200/60 mt-1 flex flex-col items-center">
                              {isFilled ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  {/* THE CORRECT ONE (Green with Check) */}
                                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                  <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5 leading-tight">
                                    Recorded
                                  </span>
                                  <span className="text-[9px] text-emerald-800 font-semibold leading-tight">
                                    {attRecord.students.filter((s) => s.present).length} present
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  {/* THE GRAY ONE (Gray indicator for not recorded) */}
                                  <div className="w-6 h-6 rounded-full bg-slate-300 border border-slate-400/50 text-slate-600 flex items-center justify-center shadow-xs">
                                    <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 mt-0.5 leading-tight">
                                    Not recorded
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium leading-tight">
                                    Pending
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Date Status Banner (No save button in the middle) */}
                  {currentAttendance ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
                            <span>Attendance RECORDED for {formatPortugueseDate(attendanceDate)}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">
                              Saved in the System
                            </span>
                          </h4>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            Saved by <strong>{currentAttendance.teacherName || 'Teacher'}</strong> •{' '}
                            <strong>{currentAttendance.students.filter((s) => s.present).length}</strong> present out of{' '}
                            <strong>{currentAttendance.students.length}</strong> students.
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                        Edit Mode: change the attendance below and click the save button at the end of the list.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-300 text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-300 border border-slate-400 text-slate-600 flex items-center justify-center flex-shrink-0">
                          <MinusCircle className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <span>Attendance NOT RECORDED for {formatPortugueseDate(attendanceDate)}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase">
                              Pending
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            No attendance record has been saved for this day yet. Mark the students in the list below and click <strong>Save Attendance</strong> at the end.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. STUDENT LIST & SINGLE SAVE BUTTON AT THE END */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200/80 shadow-xs space-y-6">
                  {/* Header and Bulk Actions (NO SAVE BUTTON HERE) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#075e38] text-white text-xs flex items-center justify-center font-bold">
                          3
                        </span>
                        <span>CLASS STUDENT LIST ({selectedClass.name})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Attendance Date: <strong>{formatPortugueseDate(attendanceDate)}</strong>
                      </p>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Attendance:</span>
                        <button
                          onClick={() => handleMarkAllPresent(true)}
                          className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer border border-emerald-200"
                        >
                          Mark All Present
                        </button>
                        <button
                          onClick={() => handleMarkAllPresent(false)}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer border border-slate-300"
                        >
                          Mark All Absent
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-800 uppercase px-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-amber-700" /> HW:
                        </span>
                        <button
                          onClick={() => handleMarkAllHomework('completed')}
                          className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          Mark All Done
                        </button>
                        <button
                          onClick={() => handleMarkAllHomework('no_homework')}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer border border-slate-300"
                          title="Lesson without homework (e.g., first lesson or post-exam - does not deduct or penalize)"
                        >
                          No Homework
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Saved Success Toast */}
                  {attendanceSaved && (
                    <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-3 border-2 border-emerald-300 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-950">
                          ✓ Attendance saved successfully for {selectedClass.name}!
                        </p>
                        <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                          Date recorded: {formatPortugueseDate(attendanceDate)} • {presentCount} present out of{' '}
                          {classEnrollments.length} students synced in the portal.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Students Attendance Grid */}
                  {classEnrollments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No students enrolled in this class</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select another class in step 1 above to take attendance.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {classEnrollments.map((enr) => {
                        const isPresent = attendanceList[enr.studentId]?.present ?? true;
                        const studentNote = attendanceList[enr.studentId]?.note || '';
                        const classroomAccess = checkClassroomAccess(enr.studentId, selectedClass.id);

                        return (
                          <div
                            key={enr.id}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              !classroomAccess.allowed
                                ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                                : isPresent
                                ? 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
                                : 'bg-slate-50/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs ${
                                  !classroomAccess.allowed
                                    ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                                    : isPresent
                                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                    : 'bg-slate-400 text-white'
                                }`}
                              >
                                {enr.studentName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                    {enr.studentName}
                                  </p>
                                  {!classroomAccess.allowed && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-200 text-rose-900 inline-flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" /> FINANCIAL HOLD
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-[10px] text-slate-400">
                                  Enrollment: {enr.studentId}
                                </p>
                                {!classroomAccess.allowed && (
                                  <p className="text-[10px] text-rose-700 font-semibold mt-0.5 leading-tight">
                                    {classroomAccess.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {/* Homework Record (Adjustment 2: Done / Missed / None Assigned) */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-[#075e38]" /> Homework:
                                </span>
                                <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleSetHomeworkStatus(enr.studentId, 'completed')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                      (attendanceList[enr.studentId]?.homeworkStatus || 'completed') === 'completed'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Completed the homework (counts toward the average)"
                                  >
                                    ✓ Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetHomeworkStatus(enr.studentId, 'not_completed')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                      attendanceList[enr.studentId]?.homeworkStatus === 'not_completed'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Did not complete the homework"
                                  >
                                    ✗ Missed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetHomeworkStatus(enr.studentId, 'no_homework')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                      attendanceList[enr.studentId]?.homeworkStatus === 'no_homework'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="No homework for this lesson (e.g., first lesson or post-exam — does not penalize or count toward the calculation)"
                                  >
                                    — None Assigned
                                  </button>
                                </div>
                              </div>

                              {/* Quick note */}
                              <input
                                type="text"
                                placeholder="Note..."
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
                                className="w-24 sm:w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-[#075e38] focus:ring-1 focus:ring-[#075e38] focus:outline-hidden"
                              />

                              {/* Toggle Present / Absent */}
                              <button
                                onClick={() => {
                                  if (!classroomAccess.allowed && !isPresent) {
                                    if (
                                      !confirm(
                                        `⚠️ FINANCIAL HOLD ALERT:\n\nStudent ${enr.studentName} (${enr.studentId}) has an outstanding school-stage installment payment.\n\nReason: ${classroomAccess.reason}\n\nDo you want to record attendance anyway?`
                                      )
                                    ) {
                                      return;
                                    }
                                  }
                                  handleToggleAttendance(enr.studentId);
                                }}
                                className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                                  !classroomAccess.allowed
                                    ? isPresent
                                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                                      : 'bg-rose-700 text-white hover:bg-rose-800'
                                    : isPresent
                                    ? 'bg-[#075e38] text-white hover:bg-[#064e2e]'
                                    : 'bg-slate-500 text-white hover:bg-slate-600'
                                }`}
                              >
                                {isPresent ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Present</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Absent</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ===================================================================== */}
                  {/* SINGLE SAVE ATTENDANCE BUTTON: AT THE END OF THE NAME LIST      */}
                  {/* ===================================================================== */}
                  <div className="pt-6 border-t-2 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90 p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center flex-shrink-0 border border-emerald-200 shadow-2xs">
                        <CalendarCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                          Save Class Attendance
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Class: <strong className="text-slate-800">{selectedClass.name}</strong> • Date:{' '}
                          <strong className="text-slate-800">{formatPortugueseDate(attendanceDate)}</strong>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {presentCount} Present
                          </span>
                          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                            {absentCount} Absent
                          </span>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">
                            HW: {homeworkDoneCount} done • {homeworkNotDoneCount} missed • {homeworkNoneCount} no HW
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            Total: {classEnrollments.length} students
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* THE SINGLE SAVE BUTTON */}
                    <button
                      onClick={handleSaveAttendance}
                      className="w-full sm:w-auto px-8 py-4 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer border border-[#064e2e]"
                    >
                      <Save className="w-5 h-5 text-emerald-200" />
                      <span>{currentAttendance ? 'UPDATE ATTENDANCE' : 'SAVE ATTENDANCE'}</span>
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-white">
                        {attendanceDate.split('-').reverse().join('/')}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===================================================================== */}
            {/* VIEW 2: WEEKLY MODE (WEEKLY ATTENDANCE GRID)                      */}
            {/* ===================================================================== */}
            {attendanceViewMode === 'semanal' && (
              <div className="space-y-6">
                {/* Weekly Header & Week Navigation Controls */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-[#075e38] text-xs font-extrabold">
                          Weekly View
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          Weekly Attendance Grid — {selectedClass.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Track attendance and absences for the entire week, from Monday to Sunday.
                      </p>
                    </div>

                    {/* Week Navigation Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWeekOffset((prev) => prev - 1)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous Week</span>
                      </button>
                      <button
                        onClick={() => setWeekOffset(0)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          weekOffset === 0
                            ? 'bg-[#075e38] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Current Week
                      </button>
                      <button
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Next Week</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Range and Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#075e38]" />
                      <span className="font-bold text-slate-700">Week Period:</span>
                      <strong className="text-[#075e38]">
                        {currentWeekDays[0]?.monthName} {currentWeekDays[0]?.dayNumber} to{' '}
                        {currentWeekDays[6]?.monthName} {currentWeekDays[6]?.dayNumber},{' '}
                        {currentWeekDays[0]?.dateStr.split('-')[0]}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-slate-600">
                        {
                          currentWeekDays.filter((d) =>
                            isClassAttendanceSavedOnDate(selectedClass.id, d.dateStr)
                          ).length
                        }{' '}
                        of 7 days recorded
                      </span>
                    </div>
                  </div>

                  {/* 7 Days of the Week Cards Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 pt-2">
                    {currentWeekDays.map((d) => {
                      const att = getClassAttendanceOnDate(selectedClass.id, d.dateStr);
                      const isFilled = Boolean(att);
                      const isToday = d.isToday;

                      return (
                        <div
                          key={d.dateStr}
                          className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between text-center gap-2 ${
                            isToday
                              ? 'border-[#075e38] bg-emerald-50/60 ring-2 ring-[#075e38]/20 shadow-xs'
                              : isFilled
                              ? 'border-emerald-200 bg-white shadow-2xs'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={isFilled ? 'text-emerald-800' : 'text-slate-400'}>
                                {d.weekDayShort}
                              </span>
                              {isToday && (
                                <span className="px-1 rounded bg-amber-200 text-amber-900 text-[8px] font-black">
                                  Today
                                </span>
                              )}
                            </div>
                            <p className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-none">
                              {d.dayNumber}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                              {d.monthName}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1">
                            {isFilled ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3 stroke-[3]" /> Done
                                </span>
                                <span className="text-[10px] font-bold text-slate-600">
                                  {att.students.filter((s) => s.present).length} present
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                  <MinusCircle className="w-3 h-3" /> Pending
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">No record</span>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setAttendanceDate(d.dateStr);
                                setAttendanceViewMode('diaria');
                              }}
                              className="w-full mt-1 py-1 rounded-lg bg-slate-100 hover:bg-[#075e38] hover:text-white text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              {isFilled ? 'Edit' : 'Enter'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly Student Attendance Grid / Matrix */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#075e38] text-white text-xs flex items-center justify-center font-bold">
                          ✓
                        </span>
                        <span>WEEKLY ATTENDANCE MATRIX BY STUDENT</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click any column or day to open the daily list and save attendance.
                      </p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </span>
                        Present
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-rose-800">
                        <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-black">
                          ✗
                        </span>
                        Absent
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                          —
                        </span>
                        Not recorded
                      </span>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  {classEnrollments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No students enrolled in this class</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="p-3.5 sm:p-4 min-w-[180px]">Student</th>
                            {currentWeekDays.map((d) => (
                              <th
                                key={d.dateStr}
                                onClick={() => {
                                  setAttendanceDate(d.dateStr);
                                  setAttendanceViewMode('diaria');
                                }}
                                className="p-2 sm:p-3 text-center min-w-[65px] hover:bg-emerald-50 transition-colors cursor-pointer group"
                                title={`Click to open day ${d.dateStr}`}
                              >
                                <div className="text-[10px] text-slate-400 group-hover:text-[#075e38]">
                                  {d.weekDayShort}
                                </div>
                                <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#075e38]">
                                  {d.dayNumber}
                                </div>
                              </th>
                            ))}
                            <th className="p-3.5 sm:p-4 text-center min-w-[80px]">Present Days</th>
                            <th className="p-3.5 sm:p-4 text-center min-w-[80px]">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {classEnrollments.map((enr) => {
                            let studentPresents = 0;
                            let daysWithAttendance = 0;

                            return (
                              <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 sm:p-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {enr.studentName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-slate-900 truncate">
                                        {enr.studentName}
                                      </p>
                                      <p className="font-mono text-[10px] text-slate-400 truncate">
                                        {enr.studentId}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Day Cells */}
                                {currentWeekDays.map((d) => {
                                  const dayAtt = state.attendance.find(
                                    (a) => a.classId === selectedClass?.id && a.date === d.dateStr
                                  );

                                  let cellStatus: 'present' | 'absent' | 'empty' = 'empty';
                                  if (dayAtt) {
                                    daysWithAttendance++;
                                    const stRec = dayAtt.students.find(
                                      (s) => s.studentId === enr.studentId
                                    );
                                    if (stRec && stRec.present) {
                                      studentPresents++;
                                      cellStatus = 'present';
                                    } else {
                                      cellStatus = 'absent';
                                    }
                                  }

                                  return (
                                    <td
                                      key={d.dateStr}
                                      onClick={() => {
                                        setAttendanceDate(d.dateStr);
                                        setAttendanceViewMode('diaria');
                                      }}
                                      className="p-2 text-center cursor-pointer hover:bg-emerald-50/60 transition-colors"
                                      title={`Open attendance for ${d.dateStr}`}
                                    >
                                      {cellStatus === 'present' && (
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                                          ✓
                                        </span>
                                      )}
                                      {cellStatus === 'absent' && (
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-black text-xs">
                                          ✗
                                        </span>
                                      )}
                                      {cellStatus === 'empty' && (
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 font-bold text-xs">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Total Presents */}
                                <td className="p-3 text-center">
                                  <span className="font-extrabold text-slate-800">
                                    {studentPresents}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    /{daysWithAttendance}
                                  </span>
                                </td>

                                {/* Attendance Percentage */}
                                <td className="p-3 text-center">
                                  {daysWithAttendance > 0 ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                                        studentPresents / daysWithAttendance >= 0.75
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                                      }`}
                                    >
                                      {Math.round((studentPresents / daysWithAttendance) * 100)}%
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      No data
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Action Link to Go to Daily Sheet */}
                  <div className="pt-3 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-500">
                      💡 To fill in or edit any day above, simply click the desired day to open the list with the save button.
                    </p>
                    <button
                      onClick={() => setAttendanceViewMode('diaria')}
                      className="px-5 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Go to Daily Entry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: EXAMS (EXAM MANAGEMENT - EXPLICITLY REQUESTED AREA)              */}
        {/* ========================================================================= */}
        {activeNavTab === 'provas' && (
          <div className="space-y-6">
            {/* Top Control Bar */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#075e38]" />
                    Exam & Academic Assessment Management
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register exams, define the syllabus covered, maximum grade, and weights, and manage grade entry.
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
                    <span>+ New Exam / Assessment</span>
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
                    placeholder="Search by title, subject, or content..."
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
                    <option value="ALL">All Classes ({teacherClasses.length})</option>
                    {teacherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stats summary */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-4 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Total Exams:</span>
                  <span className="font-black text-[#075e38] text-sm">{displayedAssessments.length} registered</span>
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
                            {EXAM_TYPE_LABELS[exam.type] || exam.type.replace(/_/g, ' ')}
                          </span>

                          {exam.requiredPaymentStage !== 'NONE' && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded border border-amber-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              {exam.requiredPaymentStage === 'STAGE_2_PAID'
                                ? 'Requires 2nd Installment'
                                : exam.requiredPaymentStage === 'STAGE_FINAL_PAID'
                                ? 'Fully Paid'
                                : 'Requires 1st Installment'}
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
                          <span>{exam.date} {exam.time ? `at ${exam.time}` : ''}</span>
                        </div>

                        <div className="px-2.5 py-1 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-[#075e38] font-black">
                          Max Grade: {exam.maxScore} pts
                        </div>

                        <div className="px-2.5 py-1 bg-purple-50 border border-purple-200/60 rounded-xl text-purple-800 font-bold">
                          Weight: {exam.weight}%
                        </div>
                      </div>

                      {/* Syllabus Box */}
                      {exam.content ? (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <BookMarked className="w-3.5 h-3.5 text-[#075e38]" />
                              Syllabus Covered
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 whitespace-pre-line">
                            {exam.content}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100 text-[11px] text-slate-400 italic">
                          No detailed topics have been registered.
                        </div>
                      )}

                      {/* Graded Progress & Average */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 font-medium block text-[11px]">
                            Grade Entry:
                          </span>
                          <span className="font-bold text-slate-800">
                            {gradedCount} of {totalStudents} students graded
                          </span>
                        </div>

                        {averageScore !== null && (
                          <div className="text-right">
                            <span className="text-slate-500 font-medium block text-[11px]">Class Average:</span>
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
                        <span>Enter Grades</span>
                      </button>

                      <button
                        onClick={() => setSelectedExamForDetails(exam)}
                        className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                        title="View Content and Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the assessment "${exam.title}"?`)) {
                            deleteAssessment(exam.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete Exam"
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
                    <h3 className="text-base font-bold text-slate-900">No Exams Found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Register exams and assessments with a syllabus and maximum grade to manage student grades.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExamModalOpen(true)}
                    className="px-5 py-2.5 bg-[#075e38] text-white rounded-xl text-xs font-bold hover:bg-[#064e2e] inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register First Exam</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GRADES (GRADE ENTRY AND ASSESSMENTS)                              */}
        {/* ========================================================================= */}
        {activeNavTab === 'notas' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Grade Entry & Assessments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Entered grades are immediately reflected in the student's official report card.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Select Class */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Class</label>
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
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Exam / Assessment</label>
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {classAssessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} (Max: {a.maxScore} pts | Weight: {a.weight}%)
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
                      <span>Save All Grades</span>
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
                      Maximum Grade: {currentAssessment.maxScore} pts
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                      Weight: {currentAssessment.weight}%
                    </span>
                  </div>
                  {currentAssessment.content && (
                    <p className="text-slate-600 text-[11px] line-clamp-1">
                      <strong className="text-slate-700">Content:</strong> {currentAssessment.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedExamForDetails(currentAssessment)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-[11px] hover:bg-slate-50"
                  >
                    View Exam Content
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
                <p className="font-bold text-amber-900 text-sm">This class does not have any exams registered yet.</p>
                <p className="text-xs text-amber-700">Register an exam to enable grade entry.</p>
                <button
                  onClick={() => {
                    setExamClassId(selectedClassId);
                    setIsExamModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold text-xs hover:bg-[#064e2e] inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Exam for {selectedClass.name}</span>
                </button>
              </div>
            )}

            {gradeSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                Grades saved and synced with the student's report card successfully!
              </div>
            )}

            {/* Grades Table */}
            {currentAssessment && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Current Grade</th>
                      <th className="px-4 py-3">Enter Grade (0 to {currentAssessment.maxScore})</th>
                      <th className="px-4 py-3">Feedback / Notes</th>
                      <th className="px-4 py-3 text-right">Action</th>
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
                                  <Lock className="w-2.5 h-2.5" /> EXAM LOCKED
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
                              <span className="text-slate-400 italic">Pending</span>
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
                              placeholder="E.g., Excellent grasp of the topics"
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
                                      `⚠️ EXAM LOCKED ALERT:\n\nStudent ${enr.studentName} (${enr.studentId}) has an outstanding financial issue for this exam: ${examAccess.reason}\n\nDo you want to enter the grade anyway?`
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
                              Save
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
        {/* TAB 5: LESSONS (LMS / MATERIAL REGISTRATION)                            */}
        {/* ========================================================================= */}
        {activeNavTab === 'aulas' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#075e38]" />
                  Registered Lessons & Document Publishing
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide PDF/DOC documents, written texts, and educational links for the class students.
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
                  <Plus className="w-4 h-4" /> Publish New Lesson
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
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600">{lesson.description}</p>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {lesson.materials.length} attachments / workbook
                      </span>
                      <span className="text-[#075e38] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-[#075e38]" />
                        Available in the VLE
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ACTIVITIES & ASSIGNMENTS (WITH VISIBILITY OF WHO DID/DIDN'T DO IT, SEEN AND FEEDBACK) */}
        {/* ========================================================================= */}
        {activeNavTab === 'atividades' && (
          <div className="space-y-6">
            {/* Toast Notification */}
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
            {/* SCENARIO A: INSIDE THE ADDED ASSIGNMENT (DETAILS AND SEEN STATUS)  */}
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

                // Filter students according to the tabs and search
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
                    {/* Assignment Navigation Header */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <button
                          onClick={() => setSelectedAssignmentForReview(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors w-fit shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                          <span>Back to Assignment List</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Class: <strong className="text-slate-800">{targetAssignment.className}</strong>
                          </span>
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            Due: {targetAssignment.dueDate}
                          </span>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                              {CATEGORY_LABELS[targetAssignment.category] || targetAssignment.category || 'Exercise'}
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Maximum Score</span>
                            <span className="text-base font-black font-mono text-[#075e38]">
                              {targetAssignment.maxScore} pts
                            </span>
                          </div>
                          <Award className="w-6 h-6 text-amber-500" />
                        </div>
                      </div>

                      {/* Statement and Registered Instructions */}
                      <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-200/80 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-orange-950">
                          <FileText className="w-4 h-4 text-[#ea580c]" />
                          <span>Guidelines & Assignment Statement:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                          {targetAssignment.instructions}
                        </p>
                      </div>

                      {/* ========================================================= */}
                      {/* ASSIGNMENT METRICS PANEL (WHO DID / WHO DID NOT) */}
                      {/* ========================================================= */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {/* Total Students */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Students in Class</span>
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-black text-slate-900 mt-2">{totalStudents}</p>
                          <span className="text-[10px] text-slate-400 font-medium">Active enrollments</span>
                        </div>

                        {/* Who Did It */}
                        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase">Completed</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-black text-emerald-950">{fezStudents.length}</p>
                            <span className="text-xs font-bold text-emerald-700">({percentCompleted}%)</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Submissions recorded</span>
                        </div>

                        {/* Who Did Not Do It */}
                        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-800 uppercase">Not Completed</span>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-black text-rose-950">{naoFezStudents.length}</p>
                            <span className="text-xs font-bold text-rose-700">
                              ({totalStudents > 0 ? 100 - percentCompleted : 0}%)
                            </span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-medium">Pending submissions</span>
                        </div>

                        {/* Completed Reviews */}
                        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-800 uppercase">Reviews & Feedback</span>
                            <FileCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-black text-blue-950 mt-2">{vistosConcluidos.length}</p>
                          <span className="text-[10px] text-blue-600 font-medium">
                            {pendentesVisto.length > 0 ? `${pendentesVisto.length} awaiting review` : 'All reviewed'}
                          </span>
                        </div>
                      </div>

                      {/* Completion Progress Bar */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Class Completion Rate ({fezStudents.length} of {totalStudents} submitted)
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
                    {/* STUDENT CONTROL, SUBMISSION STATUS, REVIEW AND FEEDBACK   */}
                    {/* ========================================================= */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                      {/* Student Tabs and Filter */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        {/* View tabs */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => setAssignmentStudentFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                              assignmentStudentFilter === 'ALL'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>All Students</span>
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
                            <span>Completed</span>
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
                            <span>Not Completed</span>
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
                            <span>Awaiting Review</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                              {pendentesVisto.length}
                            </span>
                          </button>
                        </div>

                        {/* Student Search Field */}
                        <div className="relative min-w-[240px]">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search student by name or code..."
                            value={studentSearchInsideAsg}
                            onChange={(e) => setStudentSearchInsideAsg(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Student List and Review Tracking */}
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
                                {/* Student Information */}
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

                                    {/* Status Badges */}
                                    {hasSubmitted ? (
                                      isVistoDone ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          Review Completed
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                                          Submitted • Awaiting Review
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                        Not Submitted / Pending
                                      </span>
                                    )}

                                    {sub?.deliveryMethod === 'PRESENCIAL' && (
                                      <span className="text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                                        Notebook / In Person
                                      </span>
                                    )}
                                  </div>

                                  {/* Student Submission Content (if submitted) */}
                                  {hasSubmitted ? (
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-2 mt-2">
                                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Submitted on: <strong>{sub.submittedAt}</strong></span>
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
                                          <Eye className="w-3.5 h-3.5" /> View Full Submission
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic text-[11px] bg-slate-100/60 p-2.5 rounded-xl border border-slate-200">
                                      The student has not yet submitted this activity through the VLE. If they presented it in a physical class in their notebook, click "Give In-Person Review".
                                    </div>
                                  )}
                                </div>

                                {/* Right Column: Feedback & Review Actions */}
                                <div className="w-full lg:w-[420px] bg-white p-4 rounded-2xl border border-slate-200 space-y-3 flex-shrink-0 shadow-2xs">
                                  {hasSubmitted ? (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                          <MessageSquare className="w-3.5 h-3.5 text-[#075e38]" />
                                          Teacher Feedback & Review
                                        </span>
                                        {sub.score !== undefined && (
                                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Grade: {sub.score} / {targetAssignment.maxScore}
                                          </span>
                                        )}
                                      </div>

                                      {/* If a review has already been given */}
                                      {isVistoDone && !quickFeedbacks[sub.id] ? (
                                        <div className="space-y-2">
                                          <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-emerald-950">
                                            <p className="font-medium text-xs">
                                              {sub.feedback || 'Activity reviewed and validated by the teacher.'}
                                            </p>
                                            {sub.gradedBy && (
                                              <p className="text-[10px] text-emerald-700 mt-1 font-bold">
                                                ✓ Reviewed by {sub.gradedBy} on {sub.gradedAt || 'today'}
                                              </p>
                                            )}
                                          </div>

                                          <div className="flex justify-end gap-2 pt-1">
                                            <button
                                              onClick={() => {
                                                setQuickFeedbacks((prev) => ({
                                                  ...prev,
                                                  [sub.id]: sub.feedback || 'Excellent work!',
                                                }));
                                                setQuickScores((prev) => ({
                                                  ...prev,
                                                  [sub.id]: sub.score || targetAssignment.maxScore,
                                                }));
                                              }}
                                              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                              Edit Feedback / Review
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Active Form to Give Review */
                                        <div className="space-y-2.5">
                                          {/* Quick Feedback Suggestions */}
                                          <div className="flex flex-wrap gap-1">
                                            {[
                                              'Excellent work! 👏',
                                              'Great care and effort!',
                                              'Review attention to the instructions.',
                                              'Reviewed in class. Very good!',
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
                                            placeholder="Write pedagogical feedback for the student..."
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
                                              <span className="text-[11px] font-bold text-slate-600">Grade:</span>
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
                                              <span>Mark as Reviewed</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    /* Options for a student who did NOT submit */
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                          <ClipboardList className="w-3.5 h-3.5 text-rose-500" />
                                          Pending Activity
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-slate-500">
                                        You can record in-person validation if the student showed the printed work or their notebook.
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
                                            setManualFeedback('In-person review of notebook verified by the teacher.');
                                            setManualScore(targetAssignment.maxScore);
                                            setIsManualModalOpen(true);
                                          }}
                                          className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Give In-Person Review</span>
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
                            No students found for the selected filters.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* =================================================================== */
              /* SCENARIO B: LIST OF ALL REGISTERED ASSIGNMENTS                */
              /* =================================================================== */
              <div className="space-y-6">
                {/* Main Tab Header */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-[#ea580c]" />
                        Activity & Assignment Management
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Create activities for your classes, track in real time who submitted and who did not, give feedback, and assign reviews.
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
                        <Plus className="w-4 h-4" /> Add Activity
                      </button>
                    </div>
                  </div>

                  {/* Class Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1 pl-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        Filter Class:
                      </span>
                      <select
                        value={assignmentClassFilter}
                        onChange={(e) => setAssignmentClassFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="ALL">All My Classes ({teacherClasses.length})</option>
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
                        placeholder="Search activity by title..."
                        value={assignmentSearchQuery}
                        onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                      />
                    </div>
                  </div>

                  {/* Registered Activities Grid */}
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
                          <h3 className="font-bold text-slate-800 text-sm">No activities registered</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Register the first activity for your classes and start tracking student submissions.
                          </p>
                          <button
                            onClick={() => {
                              setNewAsgClassId(selectedClass?.id || teacherClasses[0]?.id || '');
                              setIsAssignmentModalOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Create First Activity
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
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200 uppercase">
                                        {CATEGORY_LABELS[assignment.category] || assignment.category || 'Exercise'}
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
                                      if (confirm(`Do you want to delete the activity "${assignment.title}"?`)) {
                                        deleteAssignment(assignment.id);
                                        showActivityToast(`Activity deleted successfully.`);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    title="Delete Activity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Statement / Instructions */}
                                <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                                  {assignment.instructions}
                                </p>

                                {/* Due Date and Grade Information */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Due: <strong className="text-slate-800">{assignment.dueDate}</strong>
                                  </span>
                                  <span className="font-mono font-bold text-[#075e38] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {assignment.maxScore} pts max
                                  </span>
                                </div>

                                {/* Progress Bar and Metrics: Completed vs Not Completed */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Completed: {fezCount}
                                      </span>
                                      <span className="font-bold text-rose-700 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                        Not completed: {naoFezCount}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                                      {percentFez}% complete
                                    </span>
                                  </div>

                                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#075e38] h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percentFez}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                    <span>{totalStudents} enrolled students</span>
                                    <span>
                                      {pendentesVistoCount > 0 ? (
                                        <strong className="text-amber-700 font-bold">
                                          {pendentesVistoCount} awaiting review
                                        </strong>
                                      ) : (
                                        <span className="text-emerald-700 font-bold">✓ All reviews up to date</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Button: Enter Activity */}
                              <div className="pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    setSelectedAssignmentForReview(assignment);
                                    setAssignmentStudentFilter('ALL');
                                    setStudentSearchInsideAsg('');
                                  }}
                                  className="w-full py-2.5 px-4 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2"
                                >
                                  <span>Open Activity & Manage Submissions</span>
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
          <span>Think Green Platform</span>
        </div>
        <p>© 2026 All rights reserved.</p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER NEW EXAM (EXAMS AREA)                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Register New Exam / Assessment"
        subtitle="Define the syllabus, maximum grade, and application criteria"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
          {/* Target Class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
            <select
              value={examClassId}
              onChange={(e) => setExamClassId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Link to Pre-Selected Assessment */}
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-purple-950 text-xs">
                Link to the Class Pre-Selected Assessment *
              </label>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                Official Class Criteria
              </span>
            </div>

            <p className="text-[11px] text-purple-900/80">
              Assessments are standardized by the Educational Guidance team. Select the assessment you are registering:
            </p>

            <select
              value={selectedAssessmentItemId}
              onChange={(e) => handleSelectAssessmentItem(e.target.value)}
              className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-hidden cursor-pointer"
            >
              {availableClassAssessmentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Weight: {item.weight}% {item.description ? `(${item.description})` : ''}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-600">
                Linked Title: <strong className="text-slate-900 font-bold">{examTitle}</strong>
              </span>
              <span className="text-purple-800 font-black">
                Defined Weight: {examWeight}% of the Average
              </span>
            </div>
          </div>

          {/* Maximum Grade & Weight in the Average */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Maximum Exam Grade *
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
              <span className="text-[10px] text-slate-400">Default: 100 points</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Weight in the Semester Average (%)
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                <Percent className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="font-mono font-black text-slate-900 text-xs">
                  {examWeight}%
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-medium">Defined by Guidance</span>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Application Date *</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Syllabus / Covered Topics */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Syllabus & Covered Topics *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe in detail the units, subjects, grammar rules, vocabulary, or sports fundamentals that will be required on the exam..."
              value={examContent}
              onChange={(e) => setExamContent(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
            />
          </div>

          {/* General Instructions & Criteria */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Instructions for Students & Grading Criteria
            </label>
            <textarea
              rows={2}
              placeholder="E.g., 50-minute time limit. Bring a blue or black pen. Electronic devices are not allowed."
              value={examInstructions}
              onChange={(e) => setExamInstructions(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#075e38] focus:outline-hidden"
            />
          </div>

          {/* Financial Release Rule (Financial Gate) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Financial Release Rule (Access Gate)
            </label>
            <select
              value={examRequiredStage}
              onChange={(e) => setExamRequiredStage(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
            >
              <option value="NONE">Free Access (No payment restriction)</option>
              <option value="STAGE_1_PAID">Requires 1st Installment Paid (Enrollment)</option>
              <option value="STAGE_2_PAID">Requires 2nd Installment Paid (Default for Exam 1)</option>
              <option value="STAGE_FINAL_PAID">Requires Full Payment (Default for Final Exam)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save and Schedule Exam</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EXAM CONTENT DETAILS                                     */}
      {/* ========================================================================= */}
      {selectedExamForDetails && (
        <Modal
          isOpen={!!selectedExamForDetails}
          onClose={() => setSelectedExamForDetails(null)}
          title={selectedExamForDetails.title}
          subtitle={`Class: ${selectedExamForDetails.className} • ${selectedExamForDetails.courseName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Metadata Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Maximum Grade</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {selectedExamForDetails.maxScore} pts
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Weight in Average</span>
                <span className="font-mono font-black text-purple-800 text-sm">
                  {selectedExamForDetails.weight}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date / Time</span>
                <span className="font-bold text-slate-800">
                  {selectedExamForDetails.date}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="font-bold text-slate-800">
                  {EXAM_TYPE_LABELS[selectedExamForDetails.type] || selectedExamForDetails.type}
                </span>
              </div>
            </div>

            {/* Formatted Syllabus */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[#075e38]" />
                Syllabus & Required Topics
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedExamForDetails.content || 'No detailed content registered.'}
              </p>
            </div>

            {/* Instructions for Students */}
            {selectedExamForDetails.instructions && (
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
                <h5 className="font-bold text-amber-900">Guidelines & Criteria:</h5>
                <p className="text-amber-800">{selectedExamForDetails.instructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedExamForDetails(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                Close
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
                <span>Go to Grade Entry</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Lesson Modal (Documents, Written Text, or Links Only) */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Publish New Lesson in the VLE (Document / Text / Links)"
        subtitle={`Class: ${selectedClass?.name}`}
      >
        <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#075e38]" />
              Official Lesson Format in the VLE:
            </p>
            <p className="text-emerald-800">
              Lessons consist exclusively of <strong>documents (PDF/DOC)</strong>, <strong>written text</strong>, and <strong>study links</strong>, giving students access to structured teaching materials.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lesson Title</label>
            <input
              type="text"
              required
              placeholder="E.g., Lesson 09: Time Expressions and Prepositions"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Written Text & Lesson Teaching Outline</label>
            <textarea
              rows={4}
              required
              placeholder="Enter conceptual explanations, reading outline, theoretical guidelines, and summaries for the students..."
              value={newLessonDesc}
              onChange={(e) => setNewLessonDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Document / Teaching Workbook (PDF or DOC)
            </label>
            <input
              type="text"
              placeholder="E.g., Lesson_09_Grammar_Workbook.pdf or Exercises_Document.docx"
              value={newLessonPdf}
              onChange={(e) => setNewLessonPdf(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Enter the file name that will be available for the student to download or read.
            </p>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
            <label className="block font-bold text-purple-900">
              Reference Link / Supplementary Reading (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                placeholder="https://example.org/study-article"
                value={newLessonLink}
                onChange={(e) => setNewLessonLink(e.target.value)}
                className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white font-mono"
              />
              <input
                type="text"
                placeholder="Label (E.g., BBC Learning Article)"
                value={newLessonLinkTitle}
                onChange={(e) => setNewLessonLinkTitle(e.target.value)}
                className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-[#064e2e] shadow-2xs"
            >
              Publish Lesson in the VLE
            </button>
          </div>
        </form>
      </Modal>

      {/* Create New Activity / Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Register New Activity / Assignment"
        subtitle="Define the guidelines, scoring, and deadlines for the class"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Class</label>
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
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newAsgCategory}
                onChange={(e) => setNewAsgCategory(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 bg-white"
              >
                <option value="EXERCÍCIO">Exercise / Practice</option>
                <option value="TRABALHO">Group / Individual Assignment</option>
                <option value="REDAÇÃO">Essay / Text Production</option>
                <option value="PROJETO">Project / Research</option>
                <option value="DESAFIO">Challenge / Extra</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected Submission Method</label>
              <select
                value={newAsgDeliveryMethod}
                onChange={(e) => setNewAsgDeliveryMethod(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 bg-white"
              >
                <option value="ONLINE">Online Submission via Portal (VLE)</option>
                <option value="PRESENCIAL">In Person (Notebook / Classroom)</option>
                <option value="HIBRIDO">Hybrid (Online or Notebook)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Activity Title</label>
            <input
              type="text"
              required
              placeholder="E.g., Activity 04: Critical summary of Thermodynamics"
              value={newAsgTitle}
              onChange={(e) => setNewAsgTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Instructions and Statement for Students</label>
            <textarea
              rows={4}
              required
              placeholder="Describe in detail what students should do, assessment criteria, and submission guidelines..."
              value={newAsgInstructions}
              onChange={(e) => setNewAsgInstructions(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Submission Deadline</label>
              <input
                type="date"
                required
                value={newAsgDueDate}
                onChange={(e) => setNewAsgDueDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Maximum Score (Points)</label>
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ea580c] text-white rounded-xl font-bold hover:bg-[#c2410c] shadow-2xs"
            >
              Publish Activity
            </button>
          </div>
        </form>
      </Modal>

      {/* Register In-Person Notebook Review Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualTarget(null);
        }}
        title={`Give In-Person Review: ${manualTarget?.studentName || ''}`}
        subtitle={`Activity: ${manualTarget?.assignmentTitle || ''}`}
      >
        <form onSubmit={handleSaveManualVisto} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              In-Person Notebook / Classroom Validation
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              This action will immediately record that the student completed the activity in person, applying the pedagogical review and the configured score.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Grade</label>
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
            <label className="block font-bold text-slate-700 mb-1">Review Feedback / Note</label>
            <textarea
              rows={3}
              value={manualFeedback}
              onChange={(e) => setManualFeedback(e.target.value)}
              placeholder="Write comments or notes about the notebook review..."
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold shadow-2xs"
            >
              Confirm In-Person Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Assignment Submissions Modal */}
      {selectedAssignmentForReview && (
        <Modal
          isOpen={!!selectedAssignmentForReview}
          onClose={() => setSelectedAssignmentForReview(null)}
          title={`Submissions: ${selectedAssignmentForReview.title}`}
          subtitle={`Due: ${selectedAssignmentForReview.dueDate} • Maximum Score: ${selectedAssignmentForReview.maxScore} points`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Activity Instructions:</p>
              <p className="text-slate-600 leading-relaxed">{selectedAssignmentForReview.instructions}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Student List & Submissions</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {state.submissions.filter((s) => s.assignmentId === selectedAssignmentForReview.id).length} submissions recorded
                </span>
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                {(state.enrollments.filter((e) => e.classId === selectedAssignmentForReview.classId && e.status === 'ATIVA').length > 0
                  ? state.enrollments.filter((e) => e.classId === selectedAssignmentForReview.classId && e.status === 'ATIVA')
                  : state.students
                ).map((enrollment) => {
                  const studentName = 'studentName' in enrollment ? enrollment.studentName : enrollment.name;
                  const studentId = 'studentId' in enrollment ? enrollment.studentId : enrollment.id;
                  const sub = state.submissions.find(
                    (s) => (s.assignmentId === selectedAssignmentForReview.id || s.assignmentTitle === selectedAssignmentForReview.title) &&
                           s.studentId === studentId
                  );

                  return (
                    <div key={studentId} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{studentName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sub ? (
                            <>
                              <Badge status={sub.status} size="sm" />
                              <span className="text-[10px] text-slate-400 font-mono">On: {sub.submittedAt}</span>
                              {sub.grade !== undefined && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Grade: {sub.grade}/{selectedAssignmentForReview.maxScore}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Not Submitted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {sub && (
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionForViewModal(sub)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            View Answer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (sub) {
                              setCorrectingSub(sub);
                              setScoreInput(sub.grade || 90);
                              setFeedbackText(sub.feedback || '');
                            } else {
                              setManualTarget({
                                studentId,
                                studentName,
                                assignmentId: selectedAssignmentForReview.id,
                                assignmentTitle: selectedAssignmentForReview.title,
                              });
                              setManualScore(selectedAssignmentForReview.maxScore);
                              setManualFeedback('In-person review in the classroom.');
                              setIsManualModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          {sub ? 'Grade' : 'Give Review'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAssignmentForReview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Full Student Submission Modal */}
      {selectedSubmissionForViewModal && (
        <Modal
          isOpen={!!selectedSubmissionForViewModal}
          onClose={() => setSelectedSubmissionForViewModal(null)}
          title={`Student Submission: ${selectedSubmissionForViewModal.studentName}`}
          subtitle={`Activity: ${selectedSubmissionForViewModal.assignmentTitle}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Submission Date</span>
                <span className="font-bold text-slate-800">{selectedSubmissionForViewModal.submittedAt}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Status</span>
                <Badge status={selectedSubmissionForViewModal.status} size="sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Activity Text / Answer:</label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {selectedSubmissionForViewModal.submissionText}
              </div>
            </div>

            {selectedSubmissionForViewModal.attachmentName && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Attached file: {selectedSubmissionForViewModal.attachmentName}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  PDF / Document
                </span>
              </div>
            )}

            {selectedSubmissionForViewModal.feedback && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <span className="font-bold text-blue-950 block">Recorded Pedagogical Feedback:</span>
                <p className="text-blue-900">{selectedSubmissionForViewModal.feedback}</p>
                {selectedSubmissionForViewModal.gradedBy && (
                  <p className="text-[10px] text-blue-700 mt-1 font-semibold">
                    Graded by {selectedSubmissionForViewModal.gradedBy} on {selectedSubmissionForViewModal.gradedAt}
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
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Grade Assignment Modal */}
      {correctingSub && (
        <Modal
          isOpen={!!correctingSub}
          onClose={() => setCorrectingSub(null)}
          title={`Grade: ${correctingSub.studentName}`}
          subtitle={`Activity: ${correctingSub.assignmentTitle}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800">Answer Submitted by the Student:</p>
              <p className="text-slate-600 italic">"{correctingSub.submissionText}"</p>
              {correctingSub.attachmentName && (
                <div className="pt-2 text-[11px] text-[#075e38] font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Attachment: {correctingSub.attachmentName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Grade (0 to 100)</label>
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
              <label className="block font-bold text-slate-700 mb-1">Teacher Pedagogical Feedback</label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write comments to guide the student..."
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectingSub(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  gradeSubmission(correctingSub.id, scoreInput, feedbackText);
                  setCorrectingSub(null);
                }}
                className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold"
              >
                Save Grade & Feedback
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
