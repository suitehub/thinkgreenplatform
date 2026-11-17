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
  Clock,
  BadgePercent,
  Tag,
  Calculator,
  Copy,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { Student, Course, ClassRoom, Enrollment, EnglishAudienceLevel } from '../../../types';
import { formatCurrency } from '../../../lib/storage';
import { SecretariatSidebar } from './SecretariatSidebar';
import { SecretariatTopbar } from './SecretariatTopbar';
import { SecretariatHomeTab } from './tabs/SecretariatHomeTab';
import { SecretariatEnrollmentsTab } from './tabs/SecretariatEnrollmentsTab';
import { SecretariatClassesTab } from './tabs/SecretariatClassesTab';
import { SecretariatDocumentsTab } from './tabs/SecretariatDocumentsTab';
import { SecretariatCounselorTab } from './tabs/SecretariatCounselorTab';
import { SecretariatImportTab } from './tabs/SecretariatImportTab';
import { StudentDossierModal } from './StudentDossierModal';
import { SecretariatSupportModal } from './SecretariatSupportModal';
import { PendingRegistrationsQueue } from './PendingRegistrationsQueue';
import { DocumentPhotoCapture } from '../../common/DocumentPhotoCapture';

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

  // Toggle for showing Pending Registrations Queue directly in the New Student tab
  const [showPendingQueueInWizard, setShowPendingQueueInWizard] = useState(false);

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

  // 3-Step "New Student" Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newStudentForm, setNewStudentForm] = useState<{
    name: string;
    birthDate: string;
    gender: string;
    rg: string;
    nationalId: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    guardianName: string;
    notes: string;
    documentPhotoUrl?: string;
    courseId: string;
    classId: string;
    englishLevel: EnglishAudienceLevel;
    installmentsCount: number;
    customInstallmentsInput: string;
    enableNegotiation: boolean;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    discountReason: string;
  }>({
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
    notes: '',
    documentPhotoUrl: undefined,
    courseId: state.courses[0]?.id || 'course_eng',
    classId: state.classes[0]?.id || 'class_eng_a',
    englishLevel: 'CRIANCAS' as EnglishAudienceLevel,
    installmentsCount: 4,
    customInstallmentsInput: '4',
    enableNegotiation: false,
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: 10,
    discountReason: "Registrar's Office Agreement / Family Scholarship",
  });

  const [createdStudentResult, setCreatedStudentResult] = useState<{
    student: Student;
    enrollment: Enrollment;
  } | null>(null);

  const [wizardError, setWizardError] = useState<string | null>(null);
  const [accessCopied, setAccessCopied] = useState(false);

  const personalDataReady = Boolean(
    newStudentForm.name.trim() && newStudentForm.birthDate && newStudentForm.phone.trim()
  );

  const formatBirthDate = (iso: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return match ? `${match[3]}/${match[2]}/${match[1]}` : iso || 'not provided';
  };

  // Add Extra Course Modal state
  const [extraEnrollmentModalStudent, setExtraEnrollmentModalStudent] = useState<Student | null>(null);
  const [extraCourseId, setExtraCourseId] = useState(state.courses[1]?.id || state.courses[0]?.id);
  const [extraClassId, setExtraClassId] = useState(state.classes[1]?.id || state.classes[0]?.id);
  const [extraEnglishLevel, setExtraEnglishLevel] = useState<EnglishAudienceLevel>('CRIANCAS');
  const [extraInstallmentsCount, setExtraInstallmentsCount] = useState<number>(4);

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

  const isEnglishCourseObj = (course: Course | undefined | null) => {
    if (!course) return false;
    return (
      course.id === 'crs_eng' ||
      course.category === 'ENGLISH' ||
      course.name.toLowerCase().includes('inglês') ||
      course.name.toLowerCase().includes('ingles') ||
      course.name.toLowerCase().includes('english')
    );
  };

  const getCourseBaseTotal = (course: Course, level?: EnglishAudienceLevel): number => {
    if (isEnglishCourseObj(course) && course.levels && course.levels.length > 0) {
      const matched = course.levels.find((l) => l.level === (level || 'CRIANCAS'));
      if (matched) return matched.totalAmount || matched.totalCourseAmount || 2000;
    }
    if (isEnglishCourseObj(course)) {
      if (level === 'CRIANCAS') return 2000;
      if (level === 'ADOLESCENTES') return 1500;
      if (level === 'ADULTO') return 1800;
    }
    return course.totalCourseAmount || course.monthlyFee * (course.defaultInstallmentsCount || 4);
  };

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalDataReady) {
      setWizardError(
        'Enter the student\'s full name, birth date and phone number. The birth date is the password for the Student Portal.'
      );
      setWizardStep(1);
      return;
    }

    setWizardError(null);

    const course = state.courses.find((c) => c.id === newStudentForm.courseId);
    if (!course) return;

    const isEng = isEnglishCourseObj(course);
    const baseTotal = getCourseBaseTotal(course, isEng ? newStudentForm.englishLevel : undefined);

    let discountAmount = 0;
    if (newStudentForm.enableNegotiation) {
      if (newStudentForm.discountType === 'PERCENT') {
        discountAmount = Math.round((baseTotal * (newStudentForm.discountValue || 0)) / 100);
      } else {
        discountAmount = Math.min(baseTotal, newStudentForm.discountValue || 0);
      }
    }

    const finalTotal = Math.max(1, baseTotal - discountAmount);
    const effInstallments = Math.max(1, newStudentForm.installmentsCount);

    const result = createStudentWithEnrollment(
      {
        name: newStudentForm.name,
        birthDate: newStudentForm.birthDate,
        gender: newStudentForm.gender,
        rg: newStudentForm.rg,
        nationalId: newStudentForm.rg || newStudentForm.nationalId,
        email: newStudentForm.email,
        phone: newStudentForm.phone,
        city: newStudentForm.city || 'Cairo',
        address: newStudentForm.address,
        guardianName: newStudentForm.guardianName,
        notes: newStudentForm.notes,
        documentPhotoUrl: newStudentForm.documentPhotoUrl,
      },
      newStudentForm.courseId,
      newStudentForm.classId,
      effInstallments,
      {
        totalAmount: finalTotal,
        originalTotalAmount: baseTotal,
        installmentAmount: Math.round(finalTotal / effInstallments),
        englishLevel: isEng ? newStudentForm.englishLevel : undefined,
        discountType: newStudentForm.enableNegotiation ? newStudentForm.discountType : 'NONE',
        discountValue: newStudentForm.enableNegotiation ? discountAmount : 0,
        discountReason: newStudentForm.enableNegotiation ? newStudentForm.discountReason : undefined,
      }
    );

    setCreatedStudentResult(result);
    setWizardStep(5); // Success step
  };

  const handleAddExtraEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraEnrollmentModalStudent) return;
    const course = state.courses.find((c) => c.id === extraCourseId);
    if (!course) return;

    const isEng = isEnglishCourseObj(course);
    const baseTotal = getCourseBaseTotal(course, isEng ? extraEnglishLevel : undefined);
    const effInstallments = Math.max(1, extraInstallmentsCount);

    addEnrollmentToStudent(
      extraEnrollmentModalStudent.studentId,
      extraCourseId,
      extraClassId,
      effInstallments,
      {
        totalAmount: baseTotal,
        originalTotalAmount: baseTotal,
        installmentAmount: Math.round(baseTotal / effInstallments),
        englishLevel: isEng ? extraEnglishLevel : undefined,
      }
    );
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

      case 'sec_new_student': {
        const pendingCount = (state.pendingRegistrations || []).filter((p) => p.status === 'PENDENTE').length;

        return (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#075e38]" />
                  New Student Registration & Automatic Enrollment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant STU ID generation, installment plan creation and class assignment.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('sec_students')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Back to Student List
              </button>
            </div>

            {/* Block for accessing the Front Desk Pending Queue */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900">
                      Front Desk Pending Registrations Queue
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900 border border-amber-300">
                      {pendingCount} pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Students pre-registered at the front desk awaiting approval from the Registrar's Office to approve, edit or reject.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPendingQueueInWizard(!showPendingQueueInWizard)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                    showPendingQueueInWizard
                      ? 'bg-slate-800 text-white hover:bg-slate-900'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {showPendingQueueInWizard
                      ? 'Back to Direct Form'
                      : `Open Pending Queue (${pendingCount})`}
                  </span>
                </button>
              </div>
            </div>

            {showPendingQueueInWizard ? (
              <PendingRegistrationsQueue
                onBackToWizard={() => setShowPendingQueueInWizard(false)}
              />
            ) : (
              <>
                {wizardError && (
                  <div className="max-w-2xl mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed">{wizardError}</span>
                  </div>
                )}

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
                <span>Personal Data</span>
              </div>
              <div className="w-12 h-0.5 bg-slate-200" />
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 2 ? 'text-[#075e38]' : ''
                }`}
                onClick={() => personalDataReady && wizardStep < 5 && setWizardStep(2)}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    wizardStep >= 2 ? 'bg-[#075e38] text-white' : 'bg-slate-100'
                  }`}
                >
                  2
                </span>
                <span>Course & Class</span>
              </div>
              <div className="w-12 h-0.5 bg-slate-200" />
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 3 ? 'text-[#075e38]' : ''
                }`}
                onClick={() => personalDataReady && wizardStep < 5 && setWizardStep(3)}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    wizardStep >= 3 ? 'bg-[#075e38] text-white' : 'bg-slate-100'
                  }`}
                >
                  3
                </span>
                <span>Payment Plan</span>
              </div>
            </div>

            {/* Wizard Forms */}
            {wizardStep === 1 && (
              <div className="space-y-4 max-w-2xl mx-auto text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950 text-[11px]">
                  <strong>Official Registration Data:</strong> Carefully complete the student's information for the dossier issue and compliance with school records.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Student full name"
                      value={newStudentForm.name || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Date of Birth *
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
                    <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={newStudentForm.gender || 'MASCULINO'}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    >
                      <option value="MASCULINO">Male</option>
                      <option value="FEMININO">Female</option>
                      <option value="OUTRO">Other / Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ID Number (National ID / Passport)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12.345.678-9 or National ID"
                      value={newStudentForm.rg || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, rg: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  {/* Document Photo (ID) Directly Below the ID Number */}
                  <div className="sm:col-span-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <DocumentPhotoCapture
                      value={newStudentForm.documentPhotoUrl}
                      onChange={(photo) => setNewStudentForm({ ...newStudentForm, documentPhotoUrl: photo })}
                      label="Document Photo (ID)"
                      helperText="Optional. Attach an image or take a photo with the camera. It will be filed directly in the student's dossier documents."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone / WhatsApp *
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
                    <label className="block font-bold text-slate-700 mb-1">
                      Contact Email <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="student@email.com (optional)"
                      value={newStudentForm.email || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Guardian Name <span className="text-slate-400 font-normal">(if underage - optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mahmoud Ibrahim (parent/guardian)"
                      value={newStudentForm.guardianName || ''}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Medical Notes / Restrictions
                    </label>
                    <input
                      type="text"
                      placeholder="Allergies, physical restrictions or relevant notes..."
                      value={newStudentForm.notes || ''}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={!personalDataReady}
                    onClick={() => {
                      if (!personalDataReady) {
                        setWizardError(
                          'Enter the student\'s full name, birth date and phone number. The birth date will be the password for the Student Portal.'
                        );
                        return;
                      }
                      setWizardError(null);
                      setWizardStep(2);
                    }}
                    className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    Next: Choose Course <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 max-w-2xl mx-auto text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-slate-700 text-xs">
                      Select the Course / Teaching Track *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Amounts shown as the full course value
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.courses.map((course) => {
                      const isEng = isEnglishCourseObj(course);
                      const totalVal = getCourseBaseTotal(course, isEng ? newStudentForm.englishLevel : undefined);
                      const defInst = isEng
                        ? newStudentForm.englishLevel === 'CRIANCAS'
                          ? 4
                          : 3
                        : course.defaultInstallmentsCount || 4;

                      return (
                        <div
                          key={course.id}
                          onClick={() => {
                            const matchingClass = state.classes.find((c) => c.courseId === course.id);
                            const newIsEng = isEnglishCourseObj(course);
                            const newDefInst = newIsEng ? (newStudentForm.englishLevel === 'CRIANCAS' ? 4 : 3) : course.defaultInstallmentsCount || 4;
                            setNewStudentForm({
                              ...newStudentForm,
                              courseId: course.id,
                              classId: matchingClass ? matchingClass.id : newStudentForm.classId,
                              installmentsCount: newDefInst,
                              customInstallmentsInput: String(newDefInst),
                            });
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            newStudentForm.courseId === course.id
                              ? 'border-[#075e38] bg-emerald-50/50 font-bold ring-2 ring-[#075e38]'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className="text-sm font-black text-slate-900">{course.name}</p>
                              {isEng && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                                  3 Levels
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{course.description}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100">
                            {isEng ? (
                              <div className="space-y-0.5 text-[10px] text-purple-900 font-semibold">
                                <p>🧒 Kids: 2.000 EGP (4x 500)</p>
                                <p>🎒 Teens: 1.500 EGP (3x 500)</p>
                                <p>🧑 Adult: 1.800 EGP (3x 600)</p>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] text-slate-400 block">Full Total Amount</span>
                                <p className="text-xs font-mono font-bold text-emerald-800">
                                  {formatCurrency(totalVal, 'EGP')}{' '}
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({defInst}x de {formatCurrency(Math.round(totalVal / defInst), 'EGP')})
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Class & Schedule *</label>
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
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Next: Payment Plan & Negotiation <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (() => {
              const activeCourse = state.courses.find((c) => c.id === newStudentForm.courseId);
              const isEng = isEnglishCourseObj(activeCourse);
              const baseTotal = activeCourse ? getCourseBaseTotal(activeCourse, isEng ? newStudentForm.englishLevel : undefined) : 2000;

              let discountAmt = 0;
              if (newStudentForm.enableNegotiation) {
                if (newStudentForm.discountType === 'PERCENT') {
                  discountAmt = Math.round((baseTotal * (newStudentForm.discountValue || 0)) / 100);
                } else {
                  discountAmt = Math.min(baseTotal, newStudentForm.discountValue || 0);
                }
              }

              const finalTotal = Math.max(1, baseTotal - discountAmt);
              const effInstallments = Math.max(1, newStudentForm.installmentsCount);
              const installmentAmount = Math.round(finalTotal / effInstallments);

              return (
                <form onSubmit={handleFinishWizard} className="space-y-4 max-w-2xl mx-auto text-xs">
                  {/* Student & Course Academic Summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <p className="font-bold text-slate-800 text-sm">New Enrollment Summary:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <p>
                        Student: <strong className="text-slate-900">{newStudentForm.name}</strong>
                      </p>
                      <p>
                        ID / Doc:{' '}
                        <strong className="text-slate-900 font-mono">
                          {newStudentForm.rg || 'Not provided'}
                        </strong>
                      </p>
                      <p>
                        Phone:{' '}
                        <strong className="text-slate-900">{newStudentForm.phone}</strong>
                      </p>
                      <p>
                        Course:{' '}
                        <strong className="text-slate-900">{activeCourse?.name}</strong>
                      </p>
                      <p>
                        Class:{' '}
                        <strong className="text-slate-900">
                          {state.classes.find((c) => c.id === newStudentForm.classId)?.name}
                        </strong>
                      </p>
                      <p>
                        Base Full Amount:{' '}
                        <strong className="text-emerald-800 font-mono">
                          {formatCurrency(baseTotal, 'EGP')}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* English Course 3 Levels Selection */}
                  {isEng && (
                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <label className="block font-bold text-purple-950 text-xs">
                        English Course Level / Age Group *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudentForm({
                              ...newStudentForm,
                              englishLevel: 'CRIANCAS',
                              installmentsCount: 4,
                              customInstallmentsInput: '4',
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            newStudentForm.englishLevel === 'CRIANCAS'
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                              : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                          }`}
                        >
                          <p className="font-bold text-xs">🧒 Kids</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Default: 4 Installments</p>
                          <p className="font-mono font-bold text-xs mt-1">2.000 EGP (4x 500)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStudentForm({
                              ...newStudentForm,
                              englishLevel: 'ADOLESCENTES',
                              installmentsCount: 3,
                              customInstallmentsInput: '3',
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            newStudentForm.englishLevel === 'ADOLESCENTES'
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                              : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                          }`}
                        >
                          <p className="font-bold text-xs">🎒 Teens</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Default: 3 Installments</p>
                          <p className="font-mono font-bold text-xs mt-1">1.500 EGP (3x 500)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStudentForm({
                              ...newStudentForm,
                              englishLevel: 'ADULTO',
                              installmentsCount: 3,
                              customInstallmentsInput: '3',
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            newStudentForm.englishLevel === 'ADULTO'
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                              : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                          }`}
                        >
                          <p className="font-bold text-xs">🧑 Adults</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Default: 3 Installments</p>
                          <p className="font-mono font-bold text-xs mt-1">1.800 EGP (3x 600)</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flexible Installments: Choose any number of installments */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 text-xs">
                        Number of Student Installments (Free Choice)
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {newStudentForm.installmentsCount === 1
                          ? 'Pay in Full'
                          : `Split into ${newStudentForm.installmentsCount} installments`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setNewStudentForm({
                              ...newStudentForm,
                              installmentsCount: num,
                              customInstallmentsInput: String(num),
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            newStudentForm.installmentsCount === num
                              ? 'bg-[#075e38] text-white shadow-2xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num === 1 ? '1x (Pay in Full)' : `${num}x`}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-500 text-[11px]">Or type the desired quantity:</span>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={newStudentForm.customInstallmentsInput}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const valNum = Number(valStr);
                          setNewStudentForm({
                            ...newStudentForm,
                            customInstallmentsInput: valStr,
                            installmentsCount: valNum > 0 ? valNum : newStudentForm.installmentsCount,
                          });
                        }}
                        className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">installments</span>
                    </div>
                  </div>

                  {/* Negotiation / Discount Panel */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newStudentForm.enableNegotiation}
                          onChange={(e) =>
                            setNewStudentForm({ ...newStudentForm, enableNegotiation: e.target.checked })
                          }
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5 text-amber-600" />
                          Apply Negotiation / Grant Discount to Student
                        </span>
                      </label>
                      {newStudentForm.enableNegotiation && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Negotiation Enabled
                        </span>
                      )}
                    </div>

                    {newStudentForm.enableNegotiation && (
                      <div className="space-y-2.5 pt-1 border-t border-amber-200/70">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-1">
                              Discount Format
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setNewStudentForm({ ...newStudentForm, discountType: 'PERCENT' })
                                }
                                className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                                  newStudentForm.discountType === 'PERCENT'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white border border-amber-200 text-amber-900'
                                }`}
                              >
                                Percentage (%)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewStudentForm({ ...newStudentForm, discountType: 'FIXED' })
                                }
                                className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                                  newStudentForm.discountType === 'FIXED'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white border border-amber-200 text-amber-900'
                                }`}
                              >
                                Fixed Amount (EGP)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-1">
                              {newStudentForm.discountType === 'PERCENT'
                                ? 'Discount Percentage (%)'
                                : 'Amount to Deduct (EGP)'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={newStudentForm.discountType === 'PERCENT' ? 95 : baseTotal - 1}
                              value={newStudentForm.discountValue}
                              onChange={(e) =>
                                setNewStudentForm({
                                  ...newStudentForm,
                                  discountValue: Number(e.target.value),
                                })
                              }
                              className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-1">
                            Reason / Justification for Negotiation
                          </label>
                          <input
                            type="text"
                            value={newStudentForm.discountReason}
                            onChange={(e) =>
                              setNewStudentForm({ ...newStudentForm, discountReason: e.target.value })
                            }
                            placeholder="Ex: Social Scholarship, Sibling Discount, Front Desk Agreement"
                            className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {[
                              'Sibling Discount',
                              'Community Family Scholarship',
                              'Early Payment',
                              'Social Partnership',
                              "Registrar's Office Front Desk Agreement",
                            ].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() =>
                                  setNewStudentForm({ ...newStudentForm, discountReason: chip })
                                }
                                className="px-2 py-0.5 bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 text-[10px] font-semibold rounded-md cursor-pointer"
                              >
                                + {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Total Box */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Original Full Amount:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(baseTotal, 'EGP')}
                      </span>
                    </div>

                    {newStudentForm.enableNegotiation && discountAmt > 0 && (
                      <div className="flex items-center justify-between text-amber-700">
                        <span>Discount Granted:</span>
                        <span className="font-mono font-bold">
                          -{formatCurrency(discountAmt, 'EGP')} (
                          {newStudentForm.discountType === 'PERCENT'
                            ? `${newStudentForm.discountValue}%`
                            : 'Fixed'}
                          )
                        </span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between font-bold text-emerald-950 text-sm">
                      <span>Final Plan Total ({effInstallments} installments):</span>
                      <span className="font-mono font-black text-emerald-900 text-base">
                        {formatCurrency(finalTotal, 'EGP')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                      <span>Amount per Installment:</span>
                      <span className="font-mono font-black bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-sm text-emerald-950">
                        {formatCurrency(installmentAmount, 'EGP')} / month
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/80 text-emerald-950 rounded-xl border border-emerald-200 text-[11px] leading-relaxed">
                    <strong>Immediate Automation:</strong> On confirmation, the system generates a random STU##### Student ID, automatically creates the student's access (Student Portal with ID + birth date) and links the class and payment plan.
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Generate STU ID & Complete Enrollment
                    </button>
                  </div>
                </form>
              );
            })()}

            {wizardStep === 5 && createdStudentResult && (
              <div className="p-8 text-center max-w-lg mx-auto bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Enrollment Completed Successfully!
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {createdStudentResult.student.name}
                  </h3>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-xs space-y-2">
                  <p className="text-slate-500 font-medium">Student ID generated automatically:</p>
                  <p className="font-mono text-2xl font-black text-[#075e38]">
                    {createdStudentResult.student.studentId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {createdStudentResult.enrollment.courseName} • {createdStudentResult.enrollment.className}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-left text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#075e38] font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>Student access created automatically</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The student signs in to the <strong>Student Portal</strong> using only these two items:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="block text-slate-400 font-semibold">Student ID</span>
                      <strong className="font-mono text-slate-900">
                        {createdStudentResult.student.studentId}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="block text-slate-400 font-semibold">Birth date</span>
                      <strong className="font-mono text-slate-900">
                        {formatBirthDate(createdStudentResult.student.birthDate)}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    No password. The student can already access the content of the class they are enrolled in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const s = createdStudentResult.student;
                      navigator.clipboard
                        .writeText(
                          `Think Green Student Portal\nStudent ID: ${s.studentId}\nBirth date: ${formatBirthDate(s.birthDate)}`
                        )
                        .catch(() => {});
                      setAccessCopied(true);
                      setTimeout(() => setAccessCopied(false), 2000);
                    }}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {accessCopied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Data copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy access data
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentTab('sec_students')}
                    className="px-6 py-2.5 bg-[#075e38] text-white rounded-xl font-bold text-xs hover:bg-[#064e2e] shadow-sm cursor-pointer"
                  >
                    Go to Student List
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      );
    }

      case 'sec_students':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
            {/* Top Metric Filter Cards: Total History vs Active */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-emerald-50/80 border-[#075e38] ring-2 ring-[#075e38]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Total Ever Enrolled in the Program
                  </span>
                  <span className="text-[10px] font-bold text-[#075e38] bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                    Full History
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{state.students.length}</span>
                  <span className="text-xs text-slate-500">registered students</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Click to see all students in the history</p>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('ATIVO')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filterStatus === 'ATIVO'
                    ? 'bg-emerald-50/80 border-[#075e38] ring-2 ring-[#075e38]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Currently Active Students
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Enrolled
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-900">
                    {state.students.filter((s) => s.status === 'ATIVO').length}
                  </span>
                  <span className="text-xs text-slate-500">active enrollments</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Click to filter active only</p>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('INATIVO')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filterStatus === 'INATIVO'
                    ? 'bg-slate-200/80 border-slate-700 ring-2 ring-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Completed / Inactive
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                    Past History
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-700">
                    {state.students.filter((s) => s.status === 'INATIVO').length}
                  </span>
                  <span className="text-xs text-slate-500">inactive / closed</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Click to filter completed/inactive</p>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#075e38]" />
                  Students & Enrollments ({filteredStudents.length} {filterStatus === 'ALL' ? 'in the full history' : filterStatus === 'ATIVO' ? 'active' : 'inactive'})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent identifier STU00000 — 1 Student for Multiple Enrollments
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search STU, name or ID..."
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
                  <option value="ALL">All Courses</option>
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
                  <option value="ALL">All in History ({state.students.length})</option>
                  <option value="ATIVO">Active Students ({state.students.filter(s => s.status === 'ATIVO').length})</option>
                  <option value="INATIVO">Completed / Inactive ({state.students.filter(s => s.status === 'INATIVO').length})</option>
                </select>

                <button
                  onClick={() => {
                    setWizardStep(1);
                    setCreatedStudentResult(null);
                    setCurrentTab('sec_new_student');
                  }}
                  className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> New Student
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">ID / Birth</th>
                    <th className="px-4 py-3">Enrolled Courses</th>
                    <th className="px-4 py-3">Classes</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Financial</th>
                    <th className="px-4 py-3 text-right">Actions</th>
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
                            {stu.rg || 'Not provided'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {stu.birthDate || 'No date'}
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
                          {enrollments.map((e) => e.className).join(', ') || 'No class'}
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
                              title="View Full Student Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" /> Dossier
                            </button>
                            <button
                              onClick={() => setExtraEnrollmentModalStudent(stu)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Add a New Course to this Student"
                            >
                              <Plus className="w-3.5 h-3.5" /> +Course
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

      case 'sec_pending_queue':
        return (
          <PendingRegistrationsQueue
            onBackToWizard={() => setCurrentTab('sec_new_student')}
          />
        );

      case 'sec_enrollments':
      // Enrollments are unified in the Students tab as requested
        setCurrentTab('sec_students');
        return null;

      case 'sec_classes':
        return <SecretariatClassesTab />;

      case 'sec_documents':
        return <SecretariatDocumentsTab />;

      case 'sec_counselor':
        return <SecretariatCounselorTab />;

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

      {/* 3. MODALS (Dossier 360, Extra Course, Support) */}
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
          title={`Add New Course for ${extraEnrollmentModalStudent.name}`}
          subtitle={`Keeping the same Student ID: ${extraEnrollmentModalStudent.studentId}`}
        >
          <form onSubmit={handleAddExtraEnrollment} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select the New Course</label>
              <select
                value={extraCourseId}
                onChange={(e) => {
                  setExtraCourseId(e.target.value);
                  const matchingClass = state.classes.find((c) => c.courseId === e.target.value);
                  if (matchingClass) setExtraClassId(matchingClass.id);
                  const selCourse = state.courses.find((c) => c.id === e.target.value);
                  if (isEnglishCourseObj(selCourse)) {
                    setExtraInstallmentsCount(extraEnglishLevel === 'CRIANCAS' ? 4 : 3);
                  }
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
              >
                {state.courses.map((c) => {
                  const isEng = isEnglishCourseObj(c);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {isEng ? '(3 Age Levels)' : `(${formatCurrency(c.totalCourseAmount || c.monthlyFee * 4, 'EGP')} total)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {(() => {
              const selCourse = state.courses.find((c) => c.id === extraCourseId);
              const isEng = isEnglishCourseObj(selCourse);
              return (
                <>
                  {isEng && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <label className="block font-bold text-purple-950 text-xs">
                        English Course Level *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExtraEnglishLevel('CRIANCAS');
                            setExtraInstallmentsCount(4);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            extraEnglishLevel === 'CRIANCAS'
                              ? 'border-purple-600 bg-purple-600 text-white font-bold'
                              : 'border-purple-200 bg-white text-slate-700'
                          }`}
                        >
                          <p className="text-xs">🧒 Kids</p>
                          <p className="text-[10px] font-mono mt-0.5">2.000 EGP (4x)</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExtraEnglishLevel('ADOLESCENTES');
                            setExtraInstallmentsCount(3);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            extraEnglishLevel === 'ADOLESCENTES'
                              ? 'border-purple-600 bg-purple-600 text-white font-bold'
                              : 'border-purple-200 bg-white text-slate-700'
                          }`}
                        >
                          <p className="text-xs">🎒 Teens</p>
                          <p className="text-[10px] font-mono mt-0.5">1.500 EGP (3x)</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExtraEnglishLevel('ADULTO');
                            setExtraInstallmentsCount(3);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            extraEnglishLevel === 'ADULTO'
                              ? 'border-purple-600 bg-purple-600 text-white font-bold'
                              : 'border-purple-200 bg-white text-slate-700'
                          }`}
                        >
                          <p className="text-xs">🧑 Adults</p>
                          <p className="text-[10px] font-mono mt-0.5">1.800 EGP (3x)</p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Class</label>
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

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Number of Installments (Free Choice)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 6].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setExtraInstallmentsCount(n)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              extraInstallmentsCount === n
                                ? 'bg-[#075e38] text-white'
                                : 'bg-slate-100 border border-slate-300 text-slate-700'
                            }`}
                          >
                            {n === 1 ? '1x in full' : `${n}x`}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={extraInstallmentsCount}
                        onChange={(e) => setExtraInstallmentsCount(Math.max(1, Number(e.target.value)))}
                        className="w-16 p-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-900 font-bold block">Full Total Amount:</span>
                      <span className="text-[10px] text-slate-500">
                        {extraInstallmentsCount} installments of{' '}
                        {formatCurrency(
                          Math.round(
                            getCourseBaseTotal(selCourse!, isEng ? extraEnglishLevel : undefined) /
                              Math.max(1, extraInstallmentsCount)
                          ),
                          'EGP'
                        )}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-950 text-sm">
                      {formatCurrency(
                        getCourseBaseTotal(selCourse!, isEng ? extraEnglishLevel : undefined),
                        'EGP'
                      )}
                    </span>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setExtraEnrollmentModalStudent(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Confirm Enrollment
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
