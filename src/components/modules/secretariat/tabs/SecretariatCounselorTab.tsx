import React, { useState, useMemo } from 'react';
import {
  Compass,
  Users,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  BookOpen,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  Award,
  ArrowRight,
  FolderOpen,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowLeft,
  Percent,
  Sliders,
  Edit3,
  Save,
  Check,
  Info,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { TeacherPortal, TeacherNavTab } from '../../teacher/TeacherPortal';
import { ClassRoom, User as UserType, AssessmentTemplateLevel, ClassAssessmentItem } from '../../../../types';
import {
  ASSESSMENT_TEMPLATES,
  getDefaultAssessmentConfig,
  calculateTotalWeight,
  AssessmentLevelTemplate,
} from '../../../../lib/assessmentTemplates';
import { Modal } from '../../../common/Modal';

export type CounselorSubTab = 'professores' | 'turmas' | 'avaliacoes';

export const SecretariatCounselorTab: React.FC = () => {
  const { state, updateClass } = useApp();

  // Sub-tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<CounselorSubTab>('professores');

  // Teacher Drilldown state (Teacher View)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  // Class Selection state (Opens TeacherPortal in counselorMode)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedNavTab, setSelectedNavTab] = useState<TeacherNavTab>('turmas');

  // Search & Filter for All Classes tab
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Weight editing modal state for Counselor
  const [editingClassWeight, setEditingClassWeight] = useState<ClassRoom | null>(null);
  const [editTemplateLevel, setEditTemplateLevel] = useState<AssessmentTemplateLevel>('ADULT_A1');
  const [editAssessmentItems, setEditAssessmentItems] = useState<ClassAssessmentItem[]>([]);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // Filter teachers list from users
  const availableTeachers = useMemo(() => {
    return state.users.filter(
      (u) =>
        u.role === 'TEACHER' ||
        u.roles?.includes('TEACHER') ||
        u.department?.toLowerCase().includes('docente') ||
        u.department?.toLowerCase().includes('professor')
    );
  }, [state.users]);

  // Selected teacher object
  const activeTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return availableTeachers.find((t) => t.id === selectedTeacherId) || null;
  }, [selectedTeacherId, availableTeachers]);

  // Classes of the selected teacher
  const activeTeacherClasses = useMemo(() => {
    if (!activeTeacher) return [];
    return state.classes.filter(
      (cls) =>
        cls.teacherId === activeTeacher.id ||
        (cls.teacherName && cls.teacherName.toLowerCase() === activeTeacher.name.toLowerCase())
    );
  }, [state.classes, activeTeacher]);

  // Filtered teachers list for teacher tab
  const filteredTeachers = useMemo(() => {
    return availableTeachers.filter((t) => {
      const q = teacherSearchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchEmail = t.email.toLowerCase().includes(q);
      const matchDept = t.department?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchDept;
    });
  }, [availableTeachers, teacherSearchQuery]);

  // Filtered classes list for "All Classes" tab
  const filteredClasses = useMemo(() => {
    return state.classes.filter((cls) => {
      const q = classSearchQuery.toLowerCase();
      const matchesSearch =
        cls.name.toLowerCase().includes(q) ||
        cls.code.toLowerCase().includes(q) ||
        (cls.teacherName && cls.teacherName.toLowerCase().includes(q)) ||
        (cls.courseName && cls.courseName.toLowerCase().includes(q)) ||
        (cls.room && cls.room.toLowerCase().includes(q));

      const matchesCourse =
        selectedCourseFilter === 'ALL' || cls.courseId === selectedCourseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [state.classes, classSearchQuery, selectedCourseFilter]);

  // Open weights editor for a class
  const handleOpenWeightEditor = (cls: ClassRoom) => {
    setEditingClassWeight(cls);
    const tmpl = cls.assessmentTemplate || 'ADULT_A1';
    setEditTemplateLevel(tmpl);
    setEditAssessmentItems(
      cls.assessmentConfig && cls.assessmentConfig.length > 0
        ? JSON.parse(JSON.stringify(cls.assessmentConfig))
        : getDefaultAssessmentConfig(tmpl)
    );
  };

  // Save weights adjusted by the Counselor
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassWeight) return;

    updateClass(editingClassWeight.id, {
      assessmentTemplate: editTemplateLevel,
      assessmentConfig: editAssessmentItems,
    });

    setEditingClassWeight(null);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3500);
  };

  // If a class is selected, render TeacherPortal with counselorMode
  if (selectedClassId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <TeacherPortal
          currentTab="sec_counselor"
          setCurrentTab={() => {}}
          counselorMode={true}
          initialClassId={selectedClassId}
          initialNavTab={selectedNavTab}
          onBackToCounselor={() => {
            setSelectedClassId(null);
            setSelectedNavTab('turmas');
          }}
        />
      </div>
    );
  }

  // Summary Metrics
  const totalClasses = state.classes.length;
  const activeEnrollmentsCount = state.enrollments.filter((e) => e.status === 'ATIVA').length;
  const totalAssessmentsCount = state.assessments.length;
  const totalTeachersCount = availableTeachers.length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#075e38] to-teal-900 text-white p-6 sm:p-8 shadow-md border border-emerald-800/40">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              Educational Counselor
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-emerald-100 backdrop-blur-xs">
              Academic Supervision, Teachers & Grade Weights
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Educational Counselor Hub
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-3xl">
            Track each teacher's performance, open all of their classes with the full teacher view and manage the official assessment weights and criteria (A1, A2, B1, B2, Teenagers and Kids).
          </p>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Success Notification Toast */}
      {savedSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Assessment criteria and weights successfully updated by the Educational Counselor!</span>
          </div>
          <button
            onClick={() => setSavedSuccessToast(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5">
            <User className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalTeachersCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Registered Teachers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center mb-2.5">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalClasses}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Active Classes</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{activeEnrollmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Enrolled Students</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalAssessmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Registered Tests & Exams</p>
        </div>
      </div>

      {/* 3. Sub-Tabs Navigation for Educational Counselor */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setActiveSubTab('professores');
            setSelectedTeacherId(null);
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'professores'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Teacher View ({availableTeachers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('turmas')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'turmas'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Classes ({state.classes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('avaliacoes')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'avaliacoes'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Assessment Weights & Criteria</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TEACHER VIEW (BREAKDOWN BY TEACHER AND THEIR CLASSES)         */}
      {/* ========================================================================= */}
      {activeSubTab === 'professores' && (
        <div className="space-y-6">
          {/* If no teacher is selected, show list of teachers */}
          {!activeTeacher ? (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Search teacher by name, department or email..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38] focus:bg-white transition-all"
                  />
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  Click a teacher to see <strong className="text-slate-900">all their classes</strong> and open the teacher panel.
                </div>
              </div>

              {/* Teachers Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTeachers.map((teacher) => {
                  const teacherClassesList = state.classes.filter(
                    (cls) =>
                      cls.teacherId === teacher.id ||
                      (cls.teacherName && cls.teacherName.toLowerCase() === teacher.name.toLowerCase())
                  );
                  const classIds = teacherClassesList.map((c) => c.id);
                  const enrolledCount = state.enrollments.filter(
                    (e) => classIds.includes(e.classId) && e.status === 'ATIVA'
                  ).length;
                  const examsCount = state.assessments.filter((a) => classIds.includes(a.classId)).length;
                  const lessonsCount = state.lessons.filter((l) => classIds.includes(l.classId)).length;

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#075e38] p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        {/* Teacher Avatar & Header */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center font-black text-base shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                            {teacher.avatarUrl ? (
                              <img
                                src={teacher.avatarUrl}
                                alt={teacher.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              teacher.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-base text-slate-900 group-hover:text-[#075e38] transition-colors leading-tight truncate">
                              {teacher.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                              {teacher.department || 'Think Green Teaching Staff'}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {teacher.email}
                            </span>
                          </div>
                        </div>

                        {/* Metrics Badges */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-black text-slate-900">{teacherClassesList.length}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Classes</p>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-black text-slate-900">{enrolledCount}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Students</p>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-black text-slate-900">{examsCount}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Tests</p>
                          </div>
                        </div>

                        {/* List of Classes Mini Preview */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Classes under their responsibility:
                          </span>
                          {teacherClassesList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No classes assigned to this teacher at the moment.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {teacherClassesList.map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-[#075e38] border border-emerald-200 text-[11px] font-bold"
                                >
                                  {c.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#075e38] group-hover:translate-x-1 transition-transform">
                        <span>View all the teacher's classes</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Teacher Selected: Detailed Class Drilldown */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Back Breadcrumb Bar */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Teacher List</span>
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  Viewing classes assigned to:{' '}
                  <strong className="text-slate-900 font-black">{activeTeacher.name}</strong>
                </div>
              </div>

              {/* Teacher Profile Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#075e38] text-white flex items-center justify-center font-black text-xl shadow-xs">
                    {activeTeacher.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                      Lead Teacher
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{activeTeacher.name}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {activeTeacher.email} • {activeTeacher.department || 'Think Green Teaching Staff'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xs border border-white/15">
                  <div className="text-center px-3 border-r border-white/20">
                    <p className="text-xl font-black text-amber-400">{activeTeacherClasses.length}</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Classes</p>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-xl font-black text-emerald-400">
                      {state.enrollments.filter(
                        (e) =>
                          activeTeacherClasses.some((c) => c.id === e.classId) && e.status === 'ATIVA'
                      ).length}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Active Students</p>
                  </div>
                </div>
              </div>

              {/* Grid of classes for this teacher */}
              {activeTeacherClasses.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No classes assigned to this teacher</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Assign this teacher to a class in the Registrar's Office "Classes" tab to track their records and tests.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeTeacherClasses.map((cls) => {
                    const enrollments = state.enrollments.filter(
                      (e) => e.classId === cls.id && e.status === 'ATIVA'
                    );
                    const classAssessments = state.assessments.filter((a) => a.classId === cls.id);
                    const classLessons = state.lessons.filter((l) => l.classId === cls.id);
                    const classAttendance = state.attendance.filter((att) => att.classId === cls.id);
                    const tmpl = cls.assessmentTemplate || 'ADULT_A1';
                    const templateInfo = ASSESSMENT_TEMPLATES.find((t) => t.id === tmpl);

                    return (
                      <div
                        key={cls.id}
                        className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#075e38] transition-all hover:shadow-md flex flex-col justify-between overflow-hidden"
                      >
                        <div className="p-5 sm:p-6 space-y-4">
                          {/* Code & Level Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#075e38] text-[11px] font-black uppercase tracking-wider font-mono">
                              {cls.code}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                              Level: {templateInfo?.name || 'A1'}
                            </span>
                          </div>

                          {/* Title */}
                          <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">
                              {cls.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-[#075e38]" />
                              <span>{cls.courseName || 'Think Green Course'}</span>
                            </p>
                          </div>

                          {/* Class Meta */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-500 font-medium">Schedule:</span>
                              <strong className="text-slate-800 font-semibold">{cls.schedule}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-500 font-medium">Location:</span>
                              <strong className="text-slate-800 font-semibold">{cls.room}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-500 font-medium">Enrolled:</span>
                              <strong className="text-slate-900 font-black">{enrollments.length} students</strong>
                            </div>
                          </div>

                          {/* Assessment Criteria breakdown preview */}
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span className="flex items-center gap-1 text-slate-800">
                                <Percent className="w-3 h-3 text-purple-600" /> Criteria & Weights:
                              </span>
                              <button
                                onClick={() => handleOpenWeightEditor(cls)}
                                className="text-[10px] text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <Edit3 className="w-2.5 h-2.5" /> Edit Weights
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(cls.assessmentConfig || getDefaultAssessmentConfig(tmpl)).map((item) => (
                                <span
                                  key={item.id}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                                >
                                  {item.name}: <strong className="text-purple-700">{item.weight}%</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Mini Stats */}
                          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-xs font-black text-slate-800">{classAttendance.length}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Attendance</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-xs font-black text-slate-800">{classAssessments.length}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Tests</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-xs font-black text-slate-800">{classLessons.length}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Lessons</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                          <button
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              setSelectedNavTab('turmas');
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                          >
                            <span>Open Class (Teacher View)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setSelectedNavTab('chamadas');
                              }}
                              className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Attendance
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setSelectedNavTab('notas');
                              }}
                              className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Grades
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setSelectedNavTab('provas');
                              }}
                              className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Tests
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setSelectedNavTab('aulas');
                              }}
                              className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Lessons
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ALL CLASSES (GENERAL CATALOG OF INSTITUTION CLASSES)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'turmas' && (
        <div className="space-y-6">
          {/* Search & Course Filter */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  placeholder="Search classes by name, code, teacher, or room..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38] focus:bg-white transition-all"
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold self-start sm:self-auto">
                Showing <span className="text-[#075e38] font-bold">{filteredClasses.length}</span> of{' '}
                <span className="font-bold">{state.classes.length}</span> classes
              </div>
            </div>

            {/* Course Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Courses:
              </span>
              <button
                onClick={() => setSelectedCourseFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCourseFilter === 'ALL'
                    ? 'bg-[#075e38] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Courses
              </button>
              {state.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseFilter(course.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCourseFilter === course.id
                      ? 'bg-[#075e38] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {course.name}
                </button>
              ))}
            </div>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => {
              const enrollments = state.enrollments.filter(
                (e) => e.classId === cls.id && e.status === 'ATIVA'
              );
              const classAssessments = state.assessments.filter((a) => a.classId === cls.id);
              const classLessons = state.lessons.filter((l) => l.classId === cls.id);
              const classAttendance = state.attendance.filter((att) => att.classId === cls.id);
              const tmpl = cls.assessmentTemplate || 'ADULT_A1';
              const templateInfo = ASSESSMENT_TEMPLATES.find((t) => t.id === tmpl);

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl border-2 border-slate-200/80 hover:border-[#075e38] transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#075e38] text-[11px] font-black uppercase tracking-wider font-mono">
                        {cls.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                        Level: {templateInfo?.name || 'A1'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#075e38] transition-colors leading-tight">
                        {cls.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#075e38]" />
                        <span>{cls.courseName || 'Think Green Course'}</span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500 font-medium">Teacher:</span>
                        <strong className="text-slate-900 font-semibold">{cls.teacherName || 'Lead Teacher'}</strong>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500 font-medium">Schedule:</span>
                        <strong className="text-slate-800 font-semibold">{cls.schedule}</strong>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500 font-medium">Location:</span>
                        <strong className="text-slate-800 font-semibold">{cls.room}</strong>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500 font-medium">Enrolled:</span>
                        <strong className="text-slate-900 font-bold">{enrollments.length} students</strong>
                      </div>
                    </div>

                    {/* Criteria Badge */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1 text-slate-800">
                          <Percent className="w-3 h-3 text-purple-600" /> Criteria & Weights:
                        </span>
                        <button
                          onClick={() => handleOpenWeightEditor(cls)}
                          className="text-[10px] text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
                        >
                          Edit Weights
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(cls.assessmentConfig || getDefaultAssessmentConfig(tmpl)).map((item) => (
                          <span
                            key={item.id}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                          >
                            {item.name}: <strong className="text-purple-700">{item.weight}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-black text-slate-800">{classAttendance.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Attendance</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-black text-slate-800">{classAssessments.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Tests</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-black text-slate-800">{classLessons.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Lessons</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedNavTab('turmas');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      <span>Open Class (Teacher View)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedNavTab('chamadas');
                        }}
                        className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedNavTab('notas');
                        }}
                        className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Grades
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedNavTab('provas');
                        }}
                        className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Tests
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedNavTab('aulas');
                        }}
                        className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Lessons
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ASSESSMENT WEIGHTS & CRITERIA (OFFICIAL THINK GREEN MATRIX)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'avaliacoes' && (
        <div className="space-y-6">
          {/* Reference Info Card from Attachment */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Official Assessment Matrix
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Assessment Models & Weight Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Official table of grade composition by academic level. The Educational Counselor defines and adjusts the percentage of each assessment for every class.
                </p>
              </div>
            </div>

            {/* Standard Levels Reference Grid (From user image) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {ASSESSMENT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-purple-300 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{tmpl.label}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Total: {calculateTotalWeight(tmpl.items)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {tmpl.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/70 space-y-1">
                    {tmpl.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium text-slate-600 truncate">{it.name}:</span>
                        <strong className="font-mono text-purple-800 font-bold ml-2">{it.weight}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Weight Configuration Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Active Classes & Linked Weights
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click "Edit Weights" to adjust the grade percentages assigned to any class.
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {state.classes.length} classes configured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code & Class</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Applied Model</th>
                    <th className="px-4 py-3">Weight Composition (%)</th>
                    <th className="px-4 py-3 text-center">Total Sum</th>
                    <th className="px-4 py-3 text-right">Counselor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.classes.map((cls) => {
                    const tmpl = cls.assessmentTemplate || 'ADULT_A1';
                    const tmplInfo = ASSESSMENT_TEMPLATES.find((t) => t.id === tmpl);
                    const items = cls.assessmentConfig && cls.assessmentConfig.length > 0
                      ? cls.assessmentConfig
                      : getDefaultAssessmentConfig(tmpl);
                    const totalWeight = calculateTotalWeight(items);

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {cls.code}
                          </span>
                          <p className="font-bold text-slate-900 mt-1">{cls.name}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800">{cls.teacherName || 'Lead Teacher'}</span>
                          <p className="text-[11px] text-slate-400">{cls.courseName || 'Think Green Course'}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-[11px]">
                            {tmplInfo?.label || tmpl}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {items.map((it) => (
                              <span
                                key={it.id}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200"
                              >
                                {it.name}: <strong className="text-purple-700">{it.weight}%</strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-black font-mono text-xs px-2 py-0.5 rounded-full ${
                              totalWeight === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {totalWeight}%
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenWeightEditor(cls)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ml-auto shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Edit Weights
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COUNSELOR EDITS CLASS ASSESSMENT WEIGHTS                           */}
      {/* ========================================================================= */}
      {editingClassWeight && (
        <Modal
          isOpen={!!editingClassWeight}
          onClose={() => setEditingClassWeight(null)}
          title={`Edit Assessment Weights • ${editingClassWeight.name}`}
          subtitle={`Code: ${editingClassWeight.code} • Teacher: ${editingClassWeight.teacherName}`}
        >
          <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Academic Level Model (Official Think Green Matrix) *
              </label>
              <select
                value={editTemplateLevel}
                onChange={(e) => {
                  const tmpl = e.target.value as AssessmentTemplateLevel;
                  setEditTemplateLevel(tmpl);
                  setEditAssessmentItems(getDefaultAssessmentConfig(tmpl));
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-slate-400 focus:outline-hidden cursor-pointer"
              >
                {ASSESSMENT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} • {t.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  Adjust the Percentages of Each Assessment:
                </span>
                <span
                  className={`font-black font-mono text-xs ${
                    calculateTotalWeight(editAssessmentItems) === 100
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  Total Sum: {calculateTotalWeight(editAssessmentItems)}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                The teacher of this class can only link new assessments to these criteria, with the weights defined here.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {editAssessmentItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 block truncate text-[11px]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {item.description || item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.weight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...editAssessmentItems];
                          updated[idx] = { ...updated[idx], weight: val };
                          setEditAssessmentItems(updated);
                        }}
                        className="w-14 p-1 text-center font-black font-mono border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#075e38] focus:outline-hidden bg-slate-50"
                      />
                      <span className="text-slate-600 font-bold text-xs">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingClassWeight(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Assessment Weights
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
