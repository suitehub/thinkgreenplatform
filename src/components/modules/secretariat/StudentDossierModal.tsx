import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Receipt,
  FileText,
  Upload,
  Trash2,
  Printer,
  Download,
  ExternalLink,
  Eye,
  Lock,
  Unlock,
  BookOpen,
  Award,
  Check,
  Activity,
  Building,
  HeartHandshake,
  UserCheck,
  History,
  Sparkles,
  Plus,
  MessageCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  ChevronRight,
  KeyRound,
  Copy,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Student, StudentDocument, Enrollment, Charge, Assessment, Grade, AttendanceRecord, PaymentReceipt } from '../../../types';
import { Badge } from '../../common/Badge';
import { ReceiptModal } from '../../common/ReceiptModal';

interface StudentDossierModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExtraEnrollment?: (student: Student) => void;
}

type DossierTab = 'personal' | 'academic' | 'financial' | 'documents' | 'plural_timeline';

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenExtraEnrollment,
}) => {
  const {
    state,
    currentUser,
    updateStudent,
    updateEnrollmentStatus,
    addStudentDocument,
    deleteStudentDocument,
    checkClassroomAccess,
    checkExamAccess,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DossierTab>('personal');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Upload Document State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<StudentDocument['type']>('REGISTRATION_FORM');

  // Selected Receipt to View
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // Document Photo Preview Modal
  const [previewDocPhoto, setPreviewDocPhoto] = useState<{ title: string; url: string } | null>(null);

  // Print Mode
  const [isPrinting, setIsPrinting] = useState(false);

  // Sync internal notes when student changes
  React.useEffect(() => {
    if (student) {
      setInternalNotes(student.notes || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Retrieve current active student record from state to reflect live changes
  const activeStudent = state.students.find((s) => s.id === student.id || s.studentId === student.studentId) || student;

  // Retrieve all student related records
  const studentEnrollments = state.enrollments.filter((e) => e.studentId === activeStudent.studentId);
  const studentCharges = state.charges.filter((c) => c.studentId === activeStudent.studentId);
  const studentReceipts = state.receipts.filter((r) => r.studentId === activeStudent.studentId);
  const studentGrades = state.grades.filter((g) => g.studentId === activeStudent.studentId);

  // Financial calculations
  const totalAmountContracted = studentCharges.reduce((acc, c) => acc + c.amount, 0);
  const totalAmountPaid = studentCharges
    .filter((c) => c.status === 'PAGO')
    .reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);
  const totalAmountPending = studentCharges
    .filter((c) => c.status === 'PENDENTE' || c.status === 'REGULAR')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalAmountOverdue = studentCharges
    .filter((c) => c.status === 'EM ATRASO')
    .reduce((acc, c) => acc + c.amount, 0);

  const hasOverdueCharges = studentCharges.some((c) => c.status === 'EM ATRASO');
  const hasPendingCharges = studentCharges.some((c) => c.status === 'PENDENTE');

  const financialStatus = hasOverdueCharges
    ? 'EM ATRASO'
    : hasPendingCharges
    ? 'PENDENTE'
    : 'REGULAR';

  // Attendance calculations
  const studentClassIds = studentEnrollments.map((e) => e.classId);
  let totalClassesRecorded = 0;
  let totalPresentCount = 0;
  const studentAttendanceHistory: {
    classId: string;
    className: string;
    date: string;
    present: boolean;
    note?: string;
  }[] = [];

  state.attendance.forEach((att) => {
    if (studentClassIds.includes(att.classId)) {
      const rec = att.students[student.studentId];
      if (rec) {
        totalClassesRecorded++;
        if (rec.present) totalPresentCount++;
        const cl = state.classes.find((c) => c.id === att.classId);
        studentAttendanceHistory.push({
          classId: att.classId,
          className: cl?.name || att.classId,
          date: att.date,
          present: rec.present,
          note: rec.note,
        });
      }
    }
  });

  const attendancePercent =
    totalClassesRecorded > 0 ? Math.round((totalPresentCount / totalClassesRecorded) * 100) : 100;

  // Grade averages
  const overallAvg =
    studentGrades.length > 0
      ? (
          studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 10, 0) /
          studentGrades.length
        ).toFixed(1)
      : 'N/A';

  // Real-time Classroom Access Evaluation (per enrolled class)
  const classroomAccessResults = studentEnrollments.map((enr) => ({
    enrollment: enr,
    access: checkClassroomAccess(student.studentId, enr.classId),
  }));

  const hasAnyClassroomBlock = classroomAccessResults.some((res) => !res.access.allowed);

  // Plural: Classmates & Teachers
  const classmates = state.enrollments
    .filter((e) => studentClassIds.includes(e.classId) && e.studentId !== student.studentId)
    .reduce<{ studentId: string; studentName: string; className: string }[]>((acc, curr) => {
      if (!acc.some((item) => item.studentId === curr.studentId)) {
        acc.push({
          studentId: curr.studentId,
          studentName: curr.studentName,
          className: curr.className,
        });
      }
      return acc;
    }, []);

  const teachers = studentEnrollments
    .map((enr) => {
      const cl = state.classes.find((c) => c.id === enr.classId);
      return cl
        ? { teacherId: cl.teacherId, teacherName: cl.teacherName, className: cl.name, schedule: cl.schedule }
        : null;
    })
    .filter(Boolean) as { teacherId: string; teacherName: string; className: string; schedule: string }[];

  // Plural Timeline / Audit Logs
  const studentLogs = (state.auditLogs || [])
    .filter((log) => {
      if (!log) return false;
      const sId = student.studentId;
      if (!sId) return false;

      const entityMatch = typeof log.entityId === 'string' && (log.entityId === sId || log.entityId.includes(sId));
      const detailsMatch = typeof log.details === 'string' && log.details.includes(sId);
      const newMatch = typeof log.newValue === 'string' && log.newValue.includes(sId);
      const prevMatch = typeof log.previousValue === 'string' && log.previousValue.includes(sId);

      return entityMatch || detailsMatch || newMatch || prevMatch;
    })
    .slice(0, 30);

  // Calculate age if birthDate exists
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  const studentAge = calculateAge(student.birthDate);

  // Handle Save Internal Notes
  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    updateStudent(student.studentId, { notes: internalNotes });
    setTimeout(() => {
      setIsSavingNotes(false);
      setIsEditingNotes(false);
    }, 400);
  };

  // Handle Status Change (Only ATIVO and INATIVO)
  const handleChangeStatus = (newStatus: Student['status']) => {
    updateStudent(activeStudent.studentId, { status: newStatus });
  };

  // Handle Selectable System Access (LIBERADO or BLOQUEADO)
  const handleToggleSystemAccess = (newAccess: 'LIBERADO' | 'BLOQUEADO') => {
    updateStudent(activeStudent.studentId, { systemAccess: newAccess });
  };

  // Handle Add Document
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    addStudentDocument(activeStudent.studentId, {
      title: newDocTitle.trim(),
      type: newDocType,
      url: `https://thinkgreen.org/docs/${activeStudent.studentId}_${Date.now()}.pdf`,
      size: '1.8 MB',
    });

    setNewDocTitle('');
    setShowUploadForm(false);
  };

  // Trigger Print
  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        id={`student-dossier-${activeStudent.studentId}`}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col transition-all"
      >
        {/* TOP CLEAN HEADER */}
        <div className="bg-white border-b border-slate-200 p-5 sm:p-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Student ID & Name */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {activeStudent.avatarUrl ? (
                  <img
                    src={activeStudent.avatarUrl}
                    alt={activeStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xl text-slate-600">
                    {activeStudent.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {activeStudent.studentId}
                  </span>
                  <span className="text-xs text-slate-500">
                    Registered on {activeStudent.createdAt}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {activeStudent.name}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Registration Status Selector: ATIVO and INATIVO only */}
                  <select
                    value={activeStudent.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'}
                    onChange={(e) => handleChangeStatus(e.target.value as Student['status'])}
                    className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs focus:outline-hidden cursor-pointer"
                    title="Student Registration Status"
                  >
                    <option value="ATIVO">🟢 Active Registration</option>
                    <option value="INATIVO">🟡 Inactive Registration</option>
                  </select>

                  {/* Financial Status Pill */}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                      hasOverdueCharges
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : hasPendingCharges
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Finances: {financialStatus}
                  </span>

                  {/* Selectable System Access (Liberado / Bloqueado) */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={activeStudent.systemAccess || 'LIBERADO'}
                      onChange={(e) => handleToggleSystemAccess(e.target.value as 'LIBERADO' | 'BLOQUEADO')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-2xs focus:outline-hidden cursor-pointer transition-colors ${
                        (activeStudent.systemAccess || 'LIBERADO') === 'BLOQUEADO'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      }`}
                      title="Set whether the student has system access allowed or blocked"
                    >
                      <option value="LIBERADO">🔓 Access: Allowed</option>
                      <option value="BLOQUEADO">🔒 Access: Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={handlePrintDossier}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
                title="Print Full 360° Dossier"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Print Dossier</span>
              </button>

              {onOpenExtraEnrollment && (
                <button
                  onClick={() => onOpenExtraEnrollment(student)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Enroll this student in a new course"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Course</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Active Enrollments</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {studentEnrollments.length} {studentEnrollments.length === 1 ? 'Course' : 'Courses'}
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Paid Investment</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                EGP {totalAmountPaid.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {totalAmountContracted.toLocaleString()}</span>
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Academic Average</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {overallAvg} <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">School Attendance</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {attendancePercent}% <span className="text-xs text-slate-400 font-normal">({totalPresentCount}/{totalClassesRecorded})</span>
              </p>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'personal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Personal Data & Dossier</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`py-3.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'academic'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>2. Academic Life ({studentEnrollments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`py-3.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'financial'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Financial & Installment Book ({studentCharges.length})</span>
            {hasOverdueCharges && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>4. Documents & Files ({student.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('plural_timeline')}
            className={`py-3.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'plural_timeline'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>5. Community & Timeline</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6 text-xs">
          {/* ========================================================= */}
          {/* TAB 1: PERSONAL, FAMILY DATA & DOSSIER */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Section 1: Civil Identification Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-700" />
                  Civil Identification & Personal Record
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Full Name</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Unique Student ID</span>
                    <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{student.studentId}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Academic Level</span>
                    <p className="font-bold text-purple-700 text-sm mt-0.5">{student.level || 'General / Standard'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Start Date</span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{student.startDate || '01/08/2026'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">ID Number (National ID / Passport)</span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{student.rg || student.nationalId || 'Not provided'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Birth Date & Age</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.birthDate || 'Not provided'}
                      {(student.age || studentAge !== null) && (
                        <span className="text-slate-500 font-normal ml-1">({student.age || studentAge} years old)</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Gender</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 capitalize">
                      {student.gender ? student.gender.toLowerCase() : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student portal access */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Student Access (Student Portal)</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      No password. The student signs in with the ID{' '}
                      <strong className="font-mono text-slate-900">{student.studentId}</strong> and the
                      birth date{' '}
                      <strong className="text-slate-900">
                        {student.birthDate || 'not registered'}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(
                        `Think Green Student Portal\nStudent ID: ${student.studentId}\nBirth date: ${student.birthDate || 'not registered'}`
                      )
                      .catch(() => {});
                  }}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy data
                </button>
              </div>

              {/* Section 2: Contacts & Location */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-700" />
                  Contact Channels & Geographic Location
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Primary Phone</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{student.phone}</p>
                    </div>
                    {student.phone && (
                      <a
                        href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                        title="Chat via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Email Address</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 truncate max-w-[170px]">{student.email}</p>
                    </div>
                    {student.email && (
                      <a
                        href={`mailto:${student.email}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">City / Province</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {student.city} (Egypt)
                    </p>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Full Residential Address</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {student.address || `${student.city}, Arab Republic of Egypt`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Legal Guardians & Emergency Contacts */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-slate-700" />
                  Parentage, Legal Guardians & Emergency Contacts
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Legal Guardian Name</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.guardianName || 'Student Themself / Adult'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Emergency Phone</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {student.guardianPhone || student.phone || 'Not provided'}
                      </p>
                    </div>
                    {student.guardianPhone && (
                      <a
                        href={`tel:${student.guardianPhone}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        title="Call Guardian"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Relationship</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.guardianName ? 'Parent / Legal Guardian' : 'Independent'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Internal Record & Registrar's Office Notes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Medical Record, Restrictions & Registrar's Office Notes
                  </h3>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-700 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        {isSavingNotes ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea
                    rows={4}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add medical notes, physical restrictions for sports, pedagogical needs or service notes..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {student.notes || (
                        <span className="text-slate-400 italic">
                          No special notes or medical restrictions recorded in this student's dossier.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ACADEMIC & PEDAGOGICAL LIFE */}
          {/* ========================================================= */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              {/* Front Desk & Room Access Diagnostic */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  Front Desk & Room / Field Access Diagnostic
                </h3>

                <div className="space-y-2">
                  {classroomAccessResults.map(({ enrollment, access }) => (
                    <div
                      key={enrollment.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        access.allowed
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            access.allowed ? 'bg-slate-200/80 text-slate-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {access.allowed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{enrollment.courseName} — {enrollment.className}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {access.allowed
                              ? 'Authorized access to the classroom, practices and materials in the LMS.'
                              : access.reason}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg self-start sm:self-center flex-shrink-0 border ${
                          access.allowed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-300'
                        }`}
                      >
                        {access.allowed ? 'ALLOWED' : 'BLOCKED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrollments & Classes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-700" />
                    Enrolled Courses & Classes ({studentEnrollments.length})
                  </h3>
                  {onOpenExtraEnrollment && (
                    <button
                      onClick={() => onOpenExtraEnrollment(student)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Enrollment
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentEnrollments.map((enr) => {
                    const cl = state.classes.find((c) => c.id === enr.classId);

                    return (
                      <div
                        key={enr.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300/60">
                                {cl?.code || enr.courseId}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{enr.courseName}</h4>
                              <p className="text-slate-600 text-xs font-semibold">{enr.className}</p>
                            </div>
                            <Badge status={enr.status} />
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                            <p className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              Teacher: <strong className="text-slate-800">{cl?.teacherName || 'Think Green Instructor'}</strong>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Schedule: <span className="text-slate-800">{cl?.schedule || 'Mon and Wed 6 PM'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              Location: <span className="text-slate-800">{cl?.room || 'Room 102 - Block A'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Enrolled on: <span className="text-slate-800">{enr.enrollmentDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Plan: {enr.paymentPlan.installmentsCount}x of EGP {enr.paymentPlan.installmentAmount}
                          </span>
                          <button
                            onClick={() =>
                              updateEnrollmentStatus(
                                enr.id,
                                enr.status === 'ATIVA' ? 'BLOQUEADA' : 'ATIVA'
                              )
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${
                              enr.status === 'ATIVA'
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            {enr.status === 'ATIVA' ? 'Suspend Enrollment' : 'Reactivate Enrollment'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment & Grade Report */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-700" />
                    Assessment Report, Exams & Performance
                  </h3>
                  <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold text-xs border border-slate-200">
                    Average: {overallAvg} / 10.0
                  </div>
                </div>

                {state.assessments.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No assessments registered in the pedagogical calendar.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Assessment</th>
                          <th className="px-4 py-2.5">Class</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5">Exam Status</th>
                          <th className="px-4 py-2.5">Score</th>
                          <th className="px-4 py-2.5">Teacher Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {state.assessments
                          .filter((ass) => studentClassIds.includes(ass.classId))
                          .map((ass) => {
                            const grade = studentGrades.find((g) => g.assessmentId === ass.id);
                            const examGate = checkExamAccess(student.studentId, ass);
                            const percent = grade ? Math.round((grade.score / grade.maxScore) * 100) : null;

                            return (
                              <tr key={ass.id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-3 font-bold text-slate-900">{ass.title}</td>
                                <td className="px-4 py-3 text-slate-600">{ass.className}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    {ass.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {examGate.allowed ? (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Released
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1" title={examGate.reason}>
                                      <Lock className="w-3 h-3" /> Blocked
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-bold font-mono">
                                  {grade ? (
                                    <span
                                      className={
                                        grade.score >= 7
                                          ? 'text-emerald-700'
                                          : grade.score >= 5
                                          ? 'text-amber-700'
                                          : 'text-rose-700'
                                      }
                                    >
                                      {grade.score} / {grade.maxScore} ({percent}%)
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">Awaiting administration</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-600 italic">
                                  {grade?.feedback || '—'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Attendance Log */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-700" />
                    Attendance Log & Presence History
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {totalPresentCount} Attendances
                    </span>
                    <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> {totalClassesRecorded - totalPresentCount} Absences
                    </span>
                  </div>
                </div>

                {studentAttendanceHistory.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No attendance log recorded for this student's classes so far.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
                    {studentAttendanceHistory.map((att, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          att.present
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{att.date}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{att.className}</p>
                          {att.note && <p className="text-[10px] text-slate-600 italic mt-0.5">{att.note}</p>}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            att.present ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {att.present ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FINANCIAL & TREASURY (PHYSICAL FRONT DESK) */}
          {/* ========================================================= */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial Status Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[11px] block">Total Contracted</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">EGP {totalAmountContracted.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{studentCharges.length} installments</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-emerald-700 text-[11px] block font-semibold">Total Paid</span>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">EGP {totalAmountPaid.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Confirmed payments</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-amber-700 text-[11px] block font-semibold">Balance Due</span>
                  <p className="text-lg font-bold text-amber-700 mt-0.5">EGP {totalAmountPending.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Open in the plan</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-rose-700 text-[11px] block font-semibold">Total Overdue</span>
                  <p className="text-lg font-bold text-rose-700 mt-0.5">EGP {totalAmountOverdue.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Past due and unpaid</span>
                </div>
              </div>

              {/* Full Installment Book */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-700" />
                    Charge & Installment Book (Processed by the Treasury)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Rule: payments and receipt issuance are processed exclusively by the Finance Department / Treasury
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Installment</th>
                        <th className="px-4 py-2.5">Course</th>
                        <th className="px-4 py-2.5">Due Date</th>
                        <th className="px-4 py-2.5">Amount (EGP)</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Payment Date</th>
                        <th className="px-4 py-2.5 text-right">Financial Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentCharges.map((chg) => (
                        <tr key={chg.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-bold font-mono text-slate-900">
                            Installment {chg.installmentNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{chg.courseName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{chg.dueDate}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            EGP {chg.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={chg.status} />
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {chg.paymentDate ? (
                              <span className="text-emerald-700 font-semibold">{chg.paymentDate}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {chg.status === 'PAGO' ? (
                              <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1">
                                Awaiting Treasury
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Physical Receipts Issued */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  Physical Receipts Issued by the Treasury ({studentReceipts.length})
                </h3>

                {studentReceipts.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No physical receipt issued for this student yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {studentReceipts.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300/60">
                              {rec.receiptNumber}
                            </span>
                            <span className="text-slate-900 font-bold text-xs">
                              EGP {rec.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs mt-2">{rec.installmentDescription}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Issued on: {rec.date}</p>
                          <p className="text-[10px] text-slate-400">Operator: {rec.issuedBy}</p>
                        </div>

                        <button
                          onClick={() => setSelectedReceipt(rec)}
                          className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> View Thermal/A4 Receipt
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: DOCUMENTS & ATTACHED FILES */}
          {/* ========================================================= */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Document List Header & Upload Trigger */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      File Record & Digitized Physical Documents
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Required files: Identity Document, Enrollment Form, Medical Fitness Certificate.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{showUploadForm ? 'Close Upload' : 'Attach Document'}</span>
                  </button>
                </div>

                {/* Upload Form (Inline) */}
                {showUploadForm && (
                  <form
                    onSubmit={handleAddDocSubmit}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 space-y-3"
                  >
                    <h4 className="font-bold text-slate-900 text-xs">New Document for the Dossier</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">File Title</label>
                        <input
                          type="text"
                          required
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="Ex: Physical Fitness Medical Certificate.pdf"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Type</label>
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as StudentDocument['type'])}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="ID_CARD">Identity Document (ID/Passport)</option>
                          <option value="REGISTRATION_FORM">Registration Form & Signed Agreement</option>
                          <option value="MEDICAL">Medical Certificate / Sports Fitness</option>
                          <option value="PAYMENT_PROOF">Bank Payment Receipt</option>
                          <option value="OTHER">Other Supplementary Documents</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        className="px-3 py-1 text-slate-500 font-semibold text-xs hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Save to Dossier
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents Grid */}
                {!student.documents || student.documents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No documents attached to the dossier.</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Click the "Attach Document" button above to upload digitized copies.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.documents.map((doc) => {
                      const isImage = doc.url && (doc.url.startsWith('data:image') || doc.type === 'ID_CARD');
                      return (
                        <div
                          key={doc.id}
                          className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDocPhoto({ title: doc.title, url: doc.url })}
                                className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity bg-slate-100 flex items-center justify-center shadow-2xs"
                                title="Click to enlarge the document image"
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.title}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs line-clamp-1">{doc.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-700">{doc.type}</span>
                                <span>•</span>
                                <span>{doc.size || '1.5 MB'}</span>
                                <span>•</span>
                                <span>{doc.uploadedAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isImage ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDocPhoto({ title: doc.title, url: doc.url })}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 cursor-pointer"
                                title="View Enlarged Image"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Download / View Document"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Remove the document "${doc.title}" from the dossier?`)) {
                                  deleteStudentDocument(student.studentId, doc.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: COMMUNITY & TIMELINE (THE PLURAL) */}
          {/* ========================================================= */}
          {activeTab === 'plural_timeline' && (
            <div className="space-y-6">
              {/* Teachers & Classmates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teachers */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    Responsible Teaching Staff
                  </h3>

                  <div className="space-y-2.5">
                    {teachers.map((t, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{t.teacherName}</p>
                          <p className="text-[11px] text-slate-500">{t.className}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{t.schedule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classmates */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    Community & Classmates ({classmates.length})
                  </h3>

                  {classmates.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No classmates found in the same class.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {classmates.map((cm, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {cm.studentName.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 text-[11px] truncate">{cm.studentName}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{cm.studentId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Timeline & Incidents */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-700" />
                  Timeline & Institutional Incident Log
                </h3>

                {studentLogs.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    No log records filed for this student so far.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {studentLogs.map((log) => (
                      <div key={log.id} className="relative group">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white"></div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{log.action}</span>
                            <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            {typeof log.details === 'string'
                              ? log.details
                              : typeof log.newValue === 'string'
                              ? log.newValue
                              : typeof log.details === 'object' && log.details !== null
                              ? JSON.stringify(log.details)
                              : 'Action recorded in the system.'}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            Module: {log.module} • Operator: {log.userName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white p-4 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-slate-500 text-[11px]">
            Unified 360° Dossier • Think Green Community Center (Cairo, Egypt)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: DETAILED RECEIPT MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* SUB-MODAL: DOCUMENT PHOTO FULL PREVIEW */}
      {previewDocPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewDocPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-black text-slate-900 text-sm">{previewDocPhoto.title}</h4>
                <p className="text-[11px] text-slate-500">Dossier of {student.name} ({student.studentId})</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewDocPhoto.url}
                alt={previewDocPhoto.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewDocPhoto(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper EyeIcon
const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
