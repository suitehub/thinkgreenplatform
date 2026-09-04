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
    registerPayment,
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

  // Quick Pay State
  const [quickPayCharge, setQuickPayCharge] = useState<Charge | null>(null);
  const [quickPayNotes, setQuickPayNotes] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // Print Mode
  const [isPrinting, setIsPrinting] = useState(false);

  // Sync internal notes when student changes
  React.useEffect(() => {
    if (student) {
      setInternalNotes(student.notes || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Retrieve all student related records
  const studentEnrollments = state.enrollments.filter((e) => e.studentId === student.studentId);
  const studentCharges = state.charges.filter((c) => c.studentId === student.studentId);
  const studentReceipts = state.receipts.filter((r) => r.studentId === student.studentId);
  const studentGrades = state.grades.filter((g) => g.studentId === student.studentId);

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
  const studentLogs = state.auditLogs
    .filter(
      (log) =>
        log.entityId === student.studentId ||
        log.details?.includes(student.studentId) ||
        log.newValue?.includes(student.studentId) ||
        log.oldValue?.includes(student.studentId)
    )
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

  // Handle Status Change
  const handleChangeStatus = (newStatus: Student['status']) => {
    updateStudent(student.studentId, { status: newStatus });
  };

  // Handle Add Document
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    addStudentDocument(student.studentId, {
      title: newDocTitle.trim(),
      type: newDocType,
      url: `https://thinkgreen.org/docs/${student.studentId}_${Date.now()}.pdf`,
      size: '1.8 MB',
    });

    setNewDocTitle('');
    setShowUploadForm(false);
  };

  // Handle Quick Pay
  const handleExecuteQuickPay = () => {
    if (!quickPayCharge) return;
    const receipt = registerPayment(
      quickPayCharge.id,
      quickPayCharge.amount,
      'DINHEIRO',
      quickPayNotes || 'Pagamento físico efetuado no balcão da tesouraria do Centro.'
    );
    setQuickPayCharge(null);
    setQuickPayNotes('');
    setSelectedReceipt(receipt);
  };

  // Trigger Print
  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        id={`student-dossier-${student.studentId}`}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col transition-all"
      >
        {/* TOP CLEAN HEADER */}
        <div className="bg-white border-b border-slate-200 p-5 sm:p-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Student ID & Name */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xl text-slate-600">
                    {student.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {student.studentId}
                  </span>
                  <span className="text-xs text-slate-500">
                    Cadastrado em {student.createdAt}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {student.name}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Status Cadastral Selector */}
                  <select
                    value={student.status}
                    onChange={(e) => handleChangeStatus(e.target.value as Student['status'])}
                    className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="ATIVO">🟢 Cadastro Ativo</option>
                    <option value="INATIVO">🟡 Cadastro Inativo</option>
                    <option value="ENCERRADO">🔴 Cadastro Encerrado</option>
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
                    Finanças: {financialStatus}
                  </span>

                  {/* Classroom Gate Status Pill */}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                      hasAnyClassroomBlock
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {hasAnyClassroomBlock ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-600" /> Acesso: Bloqueado
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Acesso: Liberado
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={handlePrintDossier}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
                title="Imprimir Ficha Completa 360°"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Imprimir Ficha</span>
              </button>

              {onOpenExtraEnrollment && (
                <button
                  onClick={() => onOpenExtraEnrollment(student)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Matricular este aluno em um novo curso"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Curso</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar Ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Matrículas Ativas</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {studentEnrollments.length} {studentEnrollments.length === 1 ? 'Curso' : 'Cursos'}
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Investimento Liquidado</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                EGP {totalAmountPaid.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {totalAmountContracted.toLocaleString()}</span>
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Média Acadêmica</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {overallAvg} <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
              <span className="text-slate-500 text-[11px] font-medium block">Frequência Escolar</span>
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
            <span>1. Dados Pessoais & Prontuário</span>
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
            <span>2. Vida Acadêmica ({studentEnrollments.length})</span>
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
            <span>3. Financeiro & Carnê ({studentCharges.length})</span>
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
            <span>4. Documentos & Arquivos ({student.documents?.length || 0})</span>
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
            <span>5. Comunidade & Linha do Tempo</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6 text-xs">
          {/* ========================================================= */}
          {/* TAB 1: DADOS PESSOAIS, FAMILIARES & PRONTUÁRIO */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Section 1: Informações de Identificação Civil */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-700" />
                  Identificação Civil & Registro Pessoal
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Nome Completo</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">ID Único do Aluno</span>
                    <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{student.studentId}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Documento Nacional / Passaporte</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{student.nationalId || 'Não informado'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Data de Nascimento & Idade</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.birthDate || 'Não informada'}
                      {studentAge !== null && (
                        <span className="text-slate-500 font-normal ml-1">({studentAge} anos)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Contatos & Localização */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-700" />
                  Canais de Contato & Localização Geográfica
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Telefone Principal</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{student.phone}</p>
                    </div>
                    {student.phone && (
                      <a
                        href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                        title="Conversar via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Endereço de E-mail</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 truncate max-w-[170px]">{student.email}</p>
                    </div>
                    {student.email && (
                      <a
                        href={`mailto:${student.email}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        title="Enviar E-mail"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Cidade / Província</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {student.city} (Egito)
                    </p>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Endereço Residencial Completo</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {student.address || `${student.city}, República Árabe do Egito`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Responsáveis Legais & Contatos de Emergência */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-slate-700" />
                  Filiação, Responsáveis Legais & Contatos de Emergência
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Nome do Responsável Legal</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.guardianName || 'Próprio Aluno / Maior de Idade'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Telefone de Emergência</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {student.guardianPhone || student.phone || 'Não informado'}
                      </p>
                    </div>
                    {student.guardianPhone && (
                      <a
                        href={`tel:${student.guardianPhone}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        title="Ligar para Responsável"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Grau de Parentesco</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {student.guardianName ? 'Pai / Mãe / Tutor Legal' : 'Titular Independente'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Prontuário Interno & Observações da Secretaria */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Prontuário Médico, Restrições & Observações da Secretaria
                  </h3>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Editar Anotações
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-700 font-semibold text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        {isSavingNotes ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea
                    rows={4}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Adicione observações médicas, restrições físicas para futebol, necessidades pedagógicas ou notas de atendimento..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {student.notes || (
                        <span className="text-slate-400 italic">
                          Nenhuma observação especial ou restrição médica registrada no prontuário deste aluno.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VIDA ACADÊMICA & PEDAGÓGICA */}
          {/* ========================================================= */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              {/* Gate Access Diagnostic Alert */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  Diagnóstico de Portaria & Acesso às Salas / Campos
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
                              ? 'Acesso autorizado à sala de aula, treinos e materiais no AVA.'
                              : access.reason}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg self-start sm:self-center flex-shrink-0 border ${
                          access.allowed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-300'
                        }`}
                      >
                        {access.allowed ? 'LIBERADO' : 'BLOQUEADO'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matrículas & Turmas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-700" />
                    Cursos & Turmas Matriculadas ({studentEnrollments.length})
                  </h3>
                  {onOpenExtraEnrollment && (
                    <button
                      onClick={() => onOpenExtraEnrollment(student)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Matrícula
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
                              Professor: <strong className="text-slate-800">{cl?.teacherName || 'Docente Think Green'}</strong>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Horário: <span className="text-slate-800">{cl?.schedule || 'Seg e Qua 18h'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              Local: <span className="text-slate-800">{cl?.room || 'Sala 102 - Bloco A'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Matrícula realizada em: <span className="text-slate-800">{enr.enrollmentDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Plano: {enr.paymentPlan.installmentsCount}x de EGP {enr.paymentPlan.installmentAmount}
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
                            {enr.status === 'ATIVA' ? 'Suspender Vínculo' : 'Reativar Matrícula'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Boletim de Avaliações & Notas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-700" />
                    Boletim de Avaliações, Provas & Rendimento
                  </h3>
                  <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold text-xs border border-slate-200">
                    Média: {overallAvg} / 10.0
                  </div>
                </div>

                {state.assessments.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Nenhuma avaliação cadastrada no calendário pedagógico.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Avaliação</th>
                          <th className="px-4 py-2.5">Turma</th>
                          <th className="px-4 py-2.5">Tipo</th>
                          <th className="px-4 py-2.5">Status Prova</th>
                          <th className="px-4 py-2.5">Nota Obtida</th>
                          <th className="px-4 py-2.5">Feedback Docente</th>
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
                                      <Check className="w-3 h-3" /> Liberada
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1" title={examGate.reason}>
                                      <Lock className="w-3 h-3" /> Bloqueada
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
                                    <span className="text-slate-400 font-normal italic">Aguardando aplicação</span>
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

              {/* Diário de Frequência */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-700" />
                    Diário de Chamada & Histórico de Presenças
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {totalPresentCount} Presenças
                    </span>
                    <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> {totalClassesRecorded - totalPresentCount} Faltas
                    </span>
                  </div>
                </div>

                {studentAttendanceHistory.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Nenhum diário de frequência registrado para as turmas deste aluno até o momento.
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
                          {att.present ? 'PRESENTE' : 'FALTA'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FINANCEIRO & TESOURARIA (BALCÃO FÍSICO) */}
          {/* ========================================================= */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial Status Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[11px] block">Total Contratado</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">EGP {totalAmountContracted.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">{studentCharges.length} parcelas</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-emerald-700 text-[11px] block font-semibold">Total Já Liquidado</span>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">EGP {totalAmountPaid.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Quitações confirmadas</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-amber-700 text-[11px] block font-semibold">Saldo a Vencer</span>
                  <p className="text-lg font-bold text-amber-700 mt-0.5">EGP {totalAmountPending.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Em aberto no plano</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-rose-700 text-[11px] block font-semibold">Total em Atraso</span>
                  <p className="text-lg font-bold text-rose-700 mt-0.5">EGP {totalAmountOverdue.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Vencidas sem quitação</span>
                </div>
              </div>

              {/* Carnê de Parcelas Completo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-700" />
                    Carnê de Cobranças & Parcelas (Tesouraria em Espécie)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Regra: Pagamento físico em balcão libera portões e provas automaticamente
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Parcela</th>
                        <th className="px-4 py-2.5">Curso</th>
                        <th className="px-4 py-2.5">Vencimento</th>
                        <th className="px-4 py-2.5">Valor (EGP)</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Data Baixa</th>
                        <th className="px-4 py-2.5 text-right">Ação Tesouraria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentCharges.map((chg) => (
                        <tr key={chg.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-bold font-mono text-slate-900">
                            {chg.installmentNumber}ª Parcela
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
                            {chg.status !== 'PAGO' ? (
                              <button
                                onClick={() => setQuickPayCharge(chg)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <DollarSign className="w-3 h-3" /> Receber no Balcão
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recibos Físicos Emitidos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  Recibos Físicos Emitidos pela Tesouraria ({studentReceipts.length})
                </h3>

                {studentReceipts.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Nenhum recibo físico emitido ainda para este aluno.
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
                          <p className="text-[11px] text-slate-500 mt-0.5">Emitido em: {rec.date}</p>
                          <p className="text-[10px] text-slate-400">Operador: {rec.issuedBy}</p>
                        </div>

                        <button
                          onClick={() => setSelectedReceipt(rec)}
                          className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Ver Recibo Térmico/A4
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: DOCUMENTOS & ARQUIVOS ANEXADOS */}
          {/* ========================================================= */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Document List Header & Upload Trigger */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      Prontuário de Arquivos & Documentos Físicos Digitalizados
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Arquivos obrigatórios: Documento de Identidade, Ficha de Matrícula, Atestado Médico de Aptidão.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{showUploadForm ? 'Fechar Envio' : 'Anexar Documento'}</span>
                  </button>
                </div>

                {/* Upload Form (Inline) */}
                {showUploadForm && (
                  <form
                    onSubmit={handleAddDocSubmit}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 space-y-3"
                  >
                    <h4 className="font-bold text-slate-900 text-xs">Novo Documento para o Prontuário</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Arquivo</label>
                        <input
                          type="text"
                          required
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="Ex: Atestado Médico de Aptidão Física.pdf"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Documento</label>
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as StudentDocument['type'])}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="ID_CARD">Documento de Identidade (RG/Passaporte)</option>
                          <option value="REGISTRATION_FORM">Ficha de Inscrição & Termo Assinado</option>
                          <option value="MEDICAL">Atestado Médico / Aptidão Esportiva</option>
                          <option value="PAYMENT_PROOF">Comprovante de Pagamento Bancário</option>
                          <option value="OTHER">Outros Documentos Complementares</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        className="px-3 py-1 text-slate-500 font-semibold text-xs hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Salvar no Prontuário
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents Grid */}
                {!student.documents || student.documents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Nenhum documento anexado ao prontuário.</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Clique no botão "Anexar Documento" acima para fazer o upload de cópias digitalizadas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
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
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Baixar / Visualizar Documento"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o documento "${doc.title}" do prontuário?`)) {
                                deleteStudentDocument(student.studentId, doc.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: COMUNIDADE & LINHA DO TEMPO (O PLURAL) */}
          {/* ========================================================= */}
          {activeTab === 'plural_timeline' && (
            <div className="space-y-6">
              {/* Professores & Colegas de Turma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Professores */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    Corpo Docente Responsável
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

                {/* Colegas de Turma */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    Comunidade & Colegas de Turma ({classmates.length})
                  </h3>

                  {classmates.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Nenhum colega encontrado na mesma turma.</p>
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

              {/* Linha do Tempo de Auditoria e Ocorrências */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-700" />
                  Linha do Tempo & Registro de Ocorrências Institucionais
                </h3>

                {studentLogs.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Nenhum registro de log arquivado para este aluno até o momento.
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
                            {log.details || log.newValue || 'Ação registrada no sistema.'}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            Módulo: {log.module} • Operador: {log.userName}
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
            Ficha Unificada 360° • Think Green Community Center (Cairo, Egito)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: QUICK RECEIPT / BAiXA NO BALCÃO */}
      {quickPayCharge && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Recebimento no Balcão (Dinheiro Físico)
              </h3>
              <button
                onClick={() => setQuickPayCharge(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Aluno:</span>
                <strong className="text-slate-900">{student.name} ({student.studentId})</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Curso:</span>
                <strong className="text-slate-900">{quickPayCharge.courseName}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Parcela:</span>
                <strong className="text-slate-900">{quickPayCharge.installmentNumber}ª Parcela</strong>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-emerald-200">
                <span className="font-bold text-emerald-950">Valor a Quitar:</span>
                <strong className="font-extrabold text-emerald-800 text-base">
                  EGP {quickPayCharge.amount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                Observação do Recebimento (Opcional)
              </label>
              <input
                type="text"
                value={quickPayNotes}
                onChange={(e) => setQuickPayNotes(e.target.value)}
                placeholder="Ex: Recebido em notas de EGP 200 no balcão da secretaria"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickPayCharge(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteQuickPay}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Confirmar & Gerar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: DETAILED RECEIPT MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
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
