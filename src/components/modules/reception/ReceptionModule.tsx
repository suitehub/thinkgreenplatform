import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  UserPlus,
  FileText,
  Search,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Sparkles,
  ArrowRight,
  Eye,
  LogOut,
  AlertCircle,
  Shield,
  GraduationCap,
  BookOpen,
  Building2,
  BadgePercent,
  HelpCircle,
  User,
  Phone,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';
import { ReceiptModal } from '../../common/ReceiptModal';
import { ProvisionalReceiptModal } from '../../common/ProvisionalReceiptModal';
import { DocumentPhotoCapture } from '../../common/DocumentPhotoCapture';
import { PaymentReceipt, PaymentMethod, EnglishAudienceLevel, Course, PendingPayment } from '../../../types';

interface ReceptionModuleProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  standalone?: boolean;
}

export const ReceptionModule: React.FC<ReceptionModuleProps> = ({
  currentTab: parentCurrentTab,
  setCurrentTab: parentSetCurrentTab,
}) => {
  const {
    state,
    currentUser,
    switchRole,
    logout,
    registerPayment,
    createPendingPayment,
    createPendingRegistration,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'payment' | 'new_student' | 'receipts' | 'daily_report'>(
    parentCurrentTab === 'rec_new_student'
      ? 'new_student'
      : parentCurrentTab === 'rec_receipts'
      ? 'receipts'
      : parentCurrentTab === 'rec_daily_report'
      ? 'daily_report'
      : 'payment'
  );

  // Sync with parent tab if provided
  const handleTabChange = (tab: 'payment' | 'new_student' | 'receipts' | 'daily_report') => {
    setActiveTab(tab);
    if (parentSetCurrentTab) {
      parentSetCurrentTab(`rec_${tab}`);
    }
  };

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Provisional Receipt Modal State (Pré-Registro de Pagamento)
  const [selectedProvisionalPayment, setSelectedProvisionalPayment] = useState<PendingPayment | null>(null);
  const [isProvisionalModalOpen, setIsProvisionalModalOpen] = useState<boolean>(false);

  // =========================================================================
  // 1. PAYMENT LAUNCH STATE
  // =========================================================================
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Find selected student and their charges
  const selectedStudent = useMemo(() => {
    return state.students.find((s) => s.studentId === selectedStudentId || s.id === selectedStudentId);
  }, [state.students, selectedStudentId]);

  const studentCharges = useMemo(() => {
    if (!selectedStudent) return [];
    return state.charges.filter(
      (c) => c.studentId === selectedStudent.studentId || c.studentName.toLowerCase() === selectedStudent.name.toLowerCase()
    );
  }, [state.charges, selectedStudent]);

  const pendingStudentCharges = useMemo(() => {
    return studentCharges.filter((c) => c.status !== 'PAGO' && c.status !== 'CANCELADO');
  }, [studentCharges]);

  // Matching students for search dropdown
  const filteredStudents = useMemo(() => {
    if (!searchStudentQuery.trim()) return [];
    const q = searchStudentQuery.toLowerCase();
    return state.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [state.students, searchStudentQuery]);

  // Handle student selection in payment tab
  const handleSelectStudentForPayment = (stu: typeof state.students[0]) => {
    setSelectedStudentId(stu.studentId);
    setSearchStudentQuery('');
    setPaymentSuccessMsg(null);

    // Auto-select first pending charge if exists
    const charges = state.charges.filter(
      (c) => c.studentId === stu.studentId && c.status !== 'PAGO' && c.status !== 'CANCELADO'
    );
    if (charges.length > 0) {
      setSelectedChargeId(charges[0].id);
      setPaymentAmount(charges[0].amount);
    } else {
      setSelectedChargeId('');
      setPaymentAmount(0);
    }
  };

  const handleChargeSelect = (chargeId: string) => {
    setSelectedChargeId(chargeId);
    const chg = studentCharges.find((c) => c.id === chargeId);
    if (chg) {
      setPaymentAmount(chg.amount);
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChargeId || paymentAmount <= 0 || !selectedStudent) return;

    const charge = studentCharges.find((c) => c.id === selectedChargeId);
    if (!charge) return;

    try {
      const pendingPayment = createPendingPayment({
        chargeId: selectedChargeId,
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.name,
        courseName: charge.courseName,
        installmentNumber: charge.installmentNumber,
        totalInstallments: charge.totalInstallments,
        amount: paymentAmount,
        paymentMethod,
        receptionNotes: paymentNotes || 'Recebido no balcão da Recepção (dinheiro físico guardado na gaveta).',
      });

      setSelectedProvisionalPayment(pendingPayment);
      setIsProvisionalModalOpen(true);
      setPaymentSuccessMsg(
        `Pré-Registro ${pendingPayment.protocolNumber} enviado com sucesso! Comprovante Provisório emitido. Aguardando conferência e aprovação da Tesouraria.`
      );

      // Reset form
      setSelectedChargeId('');
      setPaymentAmount(0);
      setPaymentNotes('');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar pré-registro de pagamento.');
    }
  };

  // =========================================================================
  // 2. NEW STUDENT REGISTRATION (PRÉ-CADASTRO SEM GERAR ID)
  // =========================================================================
  const [newStudentForm, setNewStudentForm] = useState<{
    name: string;
    birthDate: string;
    gender: string;
    rg: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    guardianName: string;
    notes: string;
    documentPhotoUrl?: string;
    courseId: string;
    classId: string;
    englishLevel: EnglishAudienceLevel;
    installmentsCount: number;
    hasDiscount: boolean;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    discountReason: string;
  }>({
    name: '',
    birthDate: '',
    gender: 'MASCULINO',
    rg: '',
    phone: '',
    email: '',
    city: 'Cairo',
    address: '',
    guardianName: '',
    notes: '',
    documentPhotoUrl: undefined,
    courseId: state.courses[0]?.id || 'course_soccer',
    classId: state.classes[0]?.id || 'class_soccer_u15',
    englishLevel: 'CRIANCAS',
    installmentsCount: 4,
    hasDiscount: false,
    discountType: 'PERCENT',
    discountValue: 10,
    discountReason: '',
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

  const [preRegistrationSuccess, setPreRegistrationSuccess] = useState<{
    protocol: string;
    name: string;
    courseName: string;
    total: number;
    discountNote?: string;
  } | null>(null);

  // Selected course and class for calculation
  const selectedCourseForForm = useMemo(() => {
    return state.courses.find((c) => c.id === newStudentForm.courseId) || state.courses[0];
  }, [state.courses, newStudentForm.courseId]);

  const isEngSelected = useMemo(() => {
    return isEnglishCourseObj(selectedCourseForForm);
  }, [selectedCourseForForm]);

  const availableClassesForCourse = useMemo(() => {
    return state.classes.filter((c) => c.courseId === newStudentForm.courseId);
  }, [state.classes, newStudentForm.courseId]);

  // Financial preview calculation (Whole course amount)
  const calculatedBaseTotal = useMemo(() => {
    if (!selectedCourseForForm) return 2000;
    return getCourseBaseTotal(
      selectedCourseForForm,
      isEngSelected ? newStudentForm.englishLevel : undefined
    );
  }, [selectedCourseForForm, isEngSelected, newStudentForm.englishLevel]);

  const calculatedDiscountAmount = useMemo(() => {
    if (!newStudentForm.hasDiscount) return 0;
    if (newStudentForm.discountType === 'PERCENT') {
      return Math.round((calculatedBaseTotal * (newStudentForm.discountValue || 0)) / 100);
    }
    return Math.min(calculatedBaseTotal, newStudentForm.discountValue || 0);
  }, [newStudentForm.hasDiscount, newStudentForm.discountType, newStudentForm.discountValue, calculatedBaseTotal]);

  const calculatedFinalTotal = Math.max(0, calculatedBaseTotal - calculatedDiscountAmount);
  const calculatedInstallmentValue = Math.max(1, Math.round(calculatedFinalTotal / Math.max(1, newStudentForm.installmentsCount)));

  const handleSavePendingStudent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudentForm.name.trim() || !newStudentForm.phone.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Telefone).');
      return;
    }

    if (newStudentForm.hasDiscount && !newStudentForm.discountReason.trim()) {
      alert('Por favor, preencha a Observação / Motivo do Desconto. Ela é obrigatória para a Secretaria analisar.');
      return;
    }

    const selectedClass = state.classes.find((c) => c.id === newStudentForm.classId) || availableClassesForCourse[0];

    const result = createPendingRegistration({
      name: newStudentForm.name.trim(),
      birthDate: newStudentForm.birthDate,
      gender: newStudentForm.gender,
      rg: newStudentForm.rg,
      phone: newStudentForm.phone,
      email: newStudentForm.email,
      city: newStudentForm.city || 'Cairo',
      address: newStudentForm.address,
      guardianName: newStudentForm.guardianName,
      notes: newStudentForm.notes,
      documentPhotoUrl: newStudentForm.documentPhotoUrl,
      courseId: newStudentForm.courseId,
      courseName: selectedCourseForForm ? selectedCourseForForm.name : 'Curso',
      classId: selectedClass ? selectedClass.id : '',
      className: selectedClass ? selectedClass.name : 'Turma Geral',
      englishLevel: isEngSelected ? newStudentForm.englishLevel : undefined,
      totalCourseAmount: calculatedBaseTotal,
      monthlyFee: calculatedInstallmentValue,
      installmentsCount: newStudentForm.installmentsCount,
      discountType: newStudentForm.hasDiscount ? newStudentForm.discountType : 'NONE',
      discountValue: newStudentForm.hasDiscount ? newStudentForm.discountValue : 0,
      discountReason: newStudentForm.hasDiscount ? newStudentForm.discountReason.trim() : '',
      finalTotal: calculatedFinalTotal,
    });

    setPreRegistrationSuccess({
      protocol: result.protocolNumber,
      name: result.name,
      courseName: result.courseName,
      total: calculatedFinalTotal,
      discountNote: newStudentForm.hasDiscount
        ? `${newStudentForm.discountValue}${newStudentForm.discountType === 'PERCENT' ? '%' : ' EGP'} (${newStudentForm.discountReason})`
        : undefined,
    });

    // Reset form for next
    setNewStudentForm({
      name: '',
      birthDate: '',
      gender: 'MASCULINO',
      rg: '',
      phone: '',
      email: '',
      city: 'Cairo',
      address: '',
      guardianName: '',
      guardianPhone: '',
      notes: '',
      courseId: state.courses[0]?.id || 'course_soccer',
      classId: state.classes[0]?.id || 'class_soccer_u15',
      englishLevel: 'CRIANCAS',
      installmentsCount: 4,
      hasDiscount: false,
      discountType: 'PERCENT',
      discountValue: 10,
      discountReason: '',
    });
  };

  // =========================================================================
  // 3. RECEIPTS TAB
  // =========================================================================
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptViewMode, setReceiptViewMode] = useState<'provisional' | 'official'>('provisional');

  const filteredProvisionalReceipts = useMemo(() => {
    const list = state.pendingPayments || [];
    if (!receiptSearch.trim()) return list;
    const q = receiptSearch.toLowerCase();
    return list.filter(
      (r) =>
        r.protocolNumber.toLowerCase().includes(q) ||
        r.provisionalReceiptNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q)
    );
  }, [state.pendingPayments, receiptSearch]);

  const filteredReceipts = useMemo(() => {
    if (!receiptSearch.trim()) return state.receipts;
    const q = receiptSearch.toLowerCase();
    return state.receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q)
    );
  }, [state.receipts, receiptSearch]);

  // =========================================================================
  // 4. DAILY REPORT TAB (Conferência Física Balcão vs Caixa Rony)
  // =========================================================================
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(todayStr);

  // All payments pre-registered today at Reception
  const dailyPendingPayments = useMemo(() => {
    return (state.pendingPayments || []).filter((p) => p.registeredAt.startsWith(reportDate));
  }, [state.pendingPayments, reportDate]);

  // Physical cash received in reception drawer today (Precisa bater com o dinheiro que o Rony recebe)
  const dailyReceptionPhysicalCash = useMemo(() => {
    return dailyPendingPayments
      .filter((p) => p.paymentMethod === 'DINHEIRO')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [dailyPendingPayments]);

  const dailyReceptionTotal = useMemo(() => {
    return dailyPendingPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [dailyPendingPayments]);

  const dailyApprovedByTreasury = useMemo(() => {
    return dailyPendingPayments.filter((p) => p.status === 'APROVADO');
  }, [dailyPendingPayments]);

  const dailyPendingApproval = useMemo(() => {
    return dailyPendingPayments.filter((p) => p.status === 'PENDENTE');
  }, [dailyPendingPayments]);

  // Official receipts confirmed today
  const dailyOfficialReceipts = useMemo(() => {
    return state.receipts.filter((r) => r.date.startsWith(reportDate));
  }, [state.receipts, reportDate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      {/* Top Header - Designed to be clean, fast, and distraction-free */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Reception Tag */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#075e38] text-white flex items-center justify-center font-black text-lg shadow-sm">
                TG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-slate-900 tracking-tight">
                    PAINEL DA RECEPÇÃO
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Balcão & Caixa
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Atendimento presencial, recebimentos, pré-cadastros e relatórios diários
                </p>
              </div>
            </div>

            {/* User & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-emerald-200 text-[#075e38] flex items-center justify-center font-black text-[11px]">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline font-bold">{currentUser.name}</span>
              </div>

              {/* Role Switch Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title="Trocar de Módulo / Visão"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Mudar Visão</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
                  <p className="px-3 py-1 text-[10px] font-black uppercase text-slate-400">
                    Acessar outros módulos:
                  </p>
                  <button
                    onClick={() => switchRole('SECRETARIAT')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secretaria Geral</span>
                  </button>
                  <button
                    onClick={() => switchRole('FINANCE')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Financeiro</span>
                  </button>
                  <button
                    onClick={() => switchRole('TEACHER')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Professor</span>
                  </button>
                  <button
                    onClick={() => switchRole('STUDENT')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Portal do Aluno</span>
                  </button>
                  <button
                    onClick={() => switchRole('SUPER_ADMIN')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>Admin 360°</span>
                  </button>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Bar - 4 core simplified tools */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-100">
            <button
              onClick={() => handleTabChange('payment')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-[#075e38] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Lançar Pagamento (Pré-Registro)</span>
            </button>

            <button
              onClick={() => handleTabChange('new_student')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'new_student'
                  ? 'bg-[#075e38] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Aluno (Pré-Cadastro)</span>
            </button>

            <button
              onClick={() => handleTabChange('receipts')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'receipts'
                  ? 'bg-[#075e38] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Recibos & Comprovantes</span>
            </button>

            <button
              onClick={() => handleTabChange('daily_report')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'daily_report'
                  ? 'bg-[#075e38] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Relatório Diário</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area - ultra simple, high-contrast, distraction-free */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* =================================================================== */}
        {/* =================================================================== */}
        {/* TAB 1: LANÇAR PAGAMENTO (PRÉ-REGISTRO PENDENTE)                     */}
        {/* =================================================================== */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* Banner Explicativo - Pré-registro de pagamento */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-black text-sm text-emerald-900">
                  Pré-Registro de Pagamento (Balcão de Atendimento)
                </p>
                <p>
                  Assim como no cadastro de novos alunos, todo pagamento recebido aqui é lançado como{' '}
                  <strong>PRÉ-REGISTRO PENDENTE</strong>. O sistema emite um{' '}
                  <strong>Comprovante Provisório de Pré-Registro</strong> para o aluno e o valor é
                  enviado para a fila da <strong>Tesouraria</strong> para conferência física do dinheiro na
                  gaveta e aprovação final pelo <strong>Rony</strong>.
                </p>
              </div>
            </div>

            {/* Context Feedback */}
            {paymentSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
                {selectedProvisionalPayment && (
                  <button
                    onClick={() => setIsProvisionalModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#075e38] text-white font-bold rounded-xl hover:bg-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Comprovante Provisório
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Student Selector & Info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#075e38]" />
                      1. Localizar Estudante
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Busque por nome, ID ou telefone para carregar os débitos
                    </p>
                  </div>

                  {/* Student Search Input */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Ex: Tarek, STU00001, ou telefone..."
                        value={searchStudentQuery}
                        onChange={(e) => setSearchStudentQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#075e38] focus:border-transparent outline-hidden transition-all"
                      />
                    </div>

                    {/* Auto-suggest dropdown */}
                    {filteredStudents.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredStudents.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectStudentForPayment(s)}
                            className="p-3 hover:bg-emerald-50/70 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900">{s.name}</p>
                              <p className="text-[10px] text-slate-500">
                                <span className="font-mono font-bold text-emerald-700">{s.studentId}</span> • {s.phone}
                              </p>
                            </div>
                            <span className="text-[11px] text-[#075e38] font-bold">Selecionar →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Student Card */}
                  {selectedStudent ? (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">{selectedStudent.name}</p>
                          <p className="text-[11px] font-mono font-bold text-emerald-800">
                            {selectedStudent.studentId}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {selectedStudent.status}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Contato:</span>
                          <strong>{selectedStudent.phone || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Cidade:</span>
                          <strong>{selectedStudent.city || 'Cairo'}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium">
                        Nenhum aluno selecionado. Use o campo acima para buscar ou selecione na lista rápida abaixo.
                      </p>
                    </div>
                  )}

                  {/* Quick student picker list */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase">
                      Alunos com débitos em aberto:
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {state.students.slice(0, 6).map((s) => {
                        const openCount = state.charges.filter(
                          (c) => c.studentId === s.studentId && c.status !== 'PAGO' && c.status !== 'CANCELADO'
                        ).length;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectStudentForPayment(s)}
                            className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              selectedStudent?.id === s.id
                                ? 'bg-emerald-50 border-emerald-500 font-bold'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {openCount} parcela(s)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Pending Charges & Payment Execution */}
              <div className="lg:col-span-7 space-y-4">
                <form
                  onSubmit={handleConfirmPayment}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#075e38]" />
                      2. Selecionar Parcela & Forma de Pagamento
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Lance o valor recebido no balcão e emita o comprovante provisório para aprovação da Tesouraria
                    </p>
                  </div>

                  {/* Charges List for this student */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Parcelas em Aberto do Aluno:
                    </label>

                    {!selectedStudent ? (
                      <p className="text-xs text-slate-400 italic">
                        Localize o aluno à esquerda para visualizar suas parcelas.
                      </p>
                    ) : pendingStudentCharges.length === 0 ? (
                      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                        ✨ Este aluno não possui parcelas pendentes no momento!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingStudentCharges.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleChargeSelect(c.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedChargeId === c.id
                                ? 'border-[#075e38] bg-emerald-50/70 ring-2 ring-[#075e38]'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900">
                                {c.courseName} • Parcela {c.installmentNumber}/{c.totalInstallments}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Vencimento: <span className="font-semibold">{c.dueDate}</span>
                                {c.notes && ` • ${c.notes}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-emerald-800 text-sm">
                                {formatCurrency(c.amount, 'EGP')}
                              </span>
                              <span className="block text-[10px] font-bold text-amber-600 uppercase">
                                {c.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Valor Recebido no Balcão (EGP) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Forma de Pagamento *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                      >
                        <option value="DINHEIRO">💵 Dinheiro Físico (Balcão)</option>
                        <option value="INSTAPAY_EG">⚡ Instapay (Egito / PIX)</option>
                        <option value="CARTAO">💳 Cartão de Débito / Crédito</option>
                        <option value="TRANSFERENCIA">🏦 Transferência Bancária</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observações no Comprovante Provisório (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pago pelo pai em dinheiro no balcão; cédulas guardadas na gaveta da recepção..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!selectedChargeId || paymentAmount <= 0}
                      className="w-full py-3.5 bg-[#075e38] hover:bg-[#064e2e] disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Receipt className="w-5 h-5" />
                      <span>Salvar Pré-Registro de Pagamento & Emitir Comprovante</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Ao registrar, o pagamento ficará com status <strong>PENDENTE</strong> para a <strong>Tesouraria (Rony)</strong> aprovar após conferência do dinheiro físico.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Sub-section: Fila Recente de Pré-Registros de Pagamento */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#075e38]" />
                    Fila de Pré-Registros de Pagamento (Recepção ⇄ Tesouraria)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Acompanhe os pagamentos lançados no balcão e a aprovação pela Tesouraria
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Total na Fila: {(state.pendingPayments || []).length}
                </span>
              </div>

              {(state.pendingPayments || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">Nenhum pré-registro de pagamento lançado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Protocolo</th>
                        <th className="py-2.5 px-3">Data/Hora</th>
                        <th className="py-2.5 px-3">Aluno</th>
                        <th className="py-2.5 px-3">Curso / Parcela</th>
                        <th className="py-2.5 px-3">Meio</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(state.pendingPayments || []).map((p) => {
                        const isPending = p.status === 'PENDENTE';
                        const isApproved = p.status === 'APROVADO';
                        const isRejected = p.status === 'REPROVADO';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#075e38]">
                              {p.protocolNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                              {p.registeredAt}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900">{p.studentName}</span>
                              <span className="block font-mono text-[10px] text-slate-400">
                                {p.studentId}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {p.courseName} (Parc. {p.installmentNumber}/{p.totalInstallments})
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {p.paymentMethod === 'DINHEIRO' ? 'Dinheiro' : p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                              {formatCurrency(p.amount, 'EGP')}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isRejected
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {isApproved
                                  ? '✓ APROVADO'
                                  : isRejected
                                  ? '✕ RECUSADO'
                                  : '⏳ PENDENTE'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProvisionalPayment(p);
                                  setIsProvisionalModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-[#075e38] hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Comprovante
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
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: NOVO ALUNO (PRÉ-CADASTRO SEM GERAR ID)                      */}
        {/* =================================================================== */}
        {activeTab === 'new_student' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Banner explicativo simples */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-black text-sm text-emerald-900">
                  Pré-Cadastro de Novo Aluno (Recepção)
                </p>
                <p>
                  Preencha os dados do estudante e o curso desejado. Conforme a regra do centro,{' '}
                  <strong>o ID permanente (STU00000) NÃO é gerado agora</strong>. O cadastro será
                  enviado como <strong>PENDENTE</strong> para a fila de homologação e aprovação da{' '}
                  <strong>Secretaria</strong>.
                </p>
                <p className="font-semibold text-emerald-800">
                  Caso seja aplicado desconto, informe a porcentagem/valor e a justificativa clara no campo abaixo.
                </p>
              </div>
            </div>

            {/* Sucesso pré-cadastro */}
            {preRegistrationSuccess && (
              <div className="p-6 bg-white border border-emerald-300 rounded-2xl shadow-sm text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#075e38] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                    Pré-Cadastro Enviado com Sucesso!
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {preRegistrationSuccess.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#075e38] mt-1">
                    Protocolo: {preRegistrationSuccess.protocol}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {preRegistrationSuccess.courseName} • Total do Plano: {formatCurrency(preRegistrationSuccess.total, 'EGP')}
                    {preRegistrationSuccess.discountNote && ` (Desconto: ${preRegistrationSuccess.discountNote})`}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setPreRegistrationSuccess(null)}
                    className="px-4 py-2 bg-[#075e38] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    Cadastrar Mais um Aluno
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form
              onSubmit={handleSavePendingStudent}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6"
            >
              {/* Bloco 1: Dados Pessoais */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#075e38]" />
                    1. Dados Pessoais do Estudante
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome Completo do Aluno *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mahmoud Ibrahim Khalil"
                      value={newStudentForm.name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={newStudentForm.birthDate}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, birthDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gênero *</label>
                    <select
                      value={newStudentForm.gender}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="OUTRO">Outro / Prefiro não informar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      RG / Documento de Identidade
                    </label>
                    <input
                      type="text"
                      placeholder="12.345.678-9 ou ID Nacional"
                      value={newStudentForm.rg}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, rg: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    />
                  </div>

                  {/* Foto do Documento (ID) Logo Abaixo do RG */}
                  <div className="sm:col-span-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <DocumentPhotoCapture
                      value={newStudentForm.documentPhotoUrl}
                      onChange={(photo) => setNewStudentForm({ ...newStudentForm, documentPhotoUrl: photo })}
                      label="Foto do Documento (RG / ID)"
                      helperText="Não obrigatório. Anexe uma foto ou tire foto com a câmera. Ficará salva no pré-cadastro para a Secretaria validar e arquivar na ficha do aluno."
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
                      value={newStudentForm.phone}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email de Contato <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="aluno@email.com (opcional)"
                      value={newStudentForm.email}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome do Responsável <span className="text-slate-400 font-normal">(se menor de idade - opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do pai, mãe ou tutor legal"
                      value={newStudentForm.guardianName}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Observações Médicas / Restrições
                    </label>
                    <input
                      type="text"
                      placeholder="Alergias, restrições para esportes ou observações gerais..."
                      value={newStudentForm.notes}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Curso e Turma */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#075e38]" />
                    2. Curso Desejado & Turma
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Curso / Modalidade *</label>
                    <select
                      value={newStudentForm.courseId}
                      onChange={(e) => {
                        const newCId = e.target.value;
                        const matchingCl = state.classes.find((cl) => cl.courseId === newCId);
                        const selCourse = state.courses.find((c) => c.id === newCId);
                        const isEng = isEnglishCourseObj(selCourse);
                        setNewStudentForm({
                          ...newStudentForm,
                          courseId: newCId,
                          classId: matchingCl ? matchingCl.id : '',
                          installmentsCount: isEng ? (newStudentForm.englishLevel === 'CRIANCAS' ? 4 : 3) : 4,
                        });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {state.courses.map((c) => {
                        const isEng = isEnglishCourseObj(c);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} {isEng ? '(3 Níveis Etários)' : `• ${formatCurrency(c.totalCourseAmount || c.monthlyFee * 4, 'EGP')} total`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Turma & Horário *</label>
                    <select
                      value={newStudentForm.classId}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, classId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {availableClassesForCourse.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name} ({cl.schedule})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bloco 3 Níveis Etários Exclusivo para Inglês */}
                {isEngSelected && (
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-black text-purple-950 text-xs">
                        Nível do Curso Livre de Inglês (Faixa Etária) *
                      </label>
                      <span className="text-[11px] text-purple-700 font-bold">
                        Crianças: 4 parc. | Teens & Adultos: 3 parc.
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewStudentForm({
                            ...newStudentForm,
                            englishLevel: 'CRIANCAS',
                            installmentsCount: 4,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          newStudentForm.englishLevel === 'CRIANCAS'
                            ? 'border-purple-600 bg-purple-600 text-white font-black shadow-sm'
                            : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                        }`}
                      >
                        <p className="text-xs font-bold">🧒 Crianças</p>
                        <p className="text-[11px] font-mono mt-0.5">2.000 EGP (4x)</p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewStudentForm({
                            ...newStudentForm,
                            englishLevel: 'ADOLESCENTES',
                            installmentsCount: 3,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          newStudentForm.englishLevel === 'ADOLESCENTES'
                            ? 'border-purple-600 bg-purple-600 text-white font-black shadow-sm'
                            : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                        }`}
                      >
                        <p className="text-xs font-bold">🎒 Adolescentes</p>
                        <p className="text-[11px] font-mono mt-0.5">1.500 EGP (3x)</p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewStudentForm({
                            ...newStudentForm,
                            englishLevel: 'ADULTO',
                            installmentsCount: 3,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          newStudentForm.englishLevel === 'ADULTO'
                            ? 'border-purple-600 bg-purple-600 text-white font-black shadow-sm'
                            : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                        }`}
                      >
                        <p className="text-xs font-bold">🧑 Adultos</p>
                        <p className="text-[11px] font-mono mt-0.5">1.800 EGP (3x)</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bloco 3: Plano Financeiro & Opção de Relatar Desconto */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <BadgePercent className="w-3.5 h-3.5 text-[#075e38]" />
                    3. Plano Financeiro & Desconto Especial
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">
                        Número de Parcelas (Escolha Livre)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {newStudentForm.installmentsCount === 1
                          ? 'À vista'
                          : `${newStudentForm.installmentsCount} parcelas`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() =>
                              setNewStudentForm({ ...newStudentForm, installmentsCount: num })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              newStudentForm.installmentsCount === num
                                ? 'bg-[#075e38] text-white'
                                : 'bg-slate-100 border border-slate-300 text-slate-700'
                            }`}
                          >
                            {num === 1 ? '1x à vista' : `${num}x`}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={newStudentForm.installmentsCount}
                        onChange={(e) =>
                          setNewStudentForm({
                            ...newStudentForm,
                            installmentsCount: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-16 p-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="relative flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newStudentForm.hasDiscount}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, hasDiscount: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#075e38] focus:ring-[#075e38] cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        Conceder / Propor Desconto nesta matrícula
                      </span>
                    </label>
                  </div>
                </div>

                {/* Sub-bloco Desconto quando ativado */}
                {newStudentForm.hasDiscount && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <BadgePercent className="w-4 h-4 text-amber-600" />
                      <span>Configuração do Desconto Proposto:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipo de Desconto</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewStudentForm({ ...newStudentForm, discountType: 'PERCENT' })}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              newStudentForm.discountType === 'PERCENT'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Porcentagem (%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewStudentForm({ ...newStudentForm, discountType: 'FIXED' })}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              newStudentForm.discountType === 'FIXED'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Valor Fixo (EGP)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Valor do Desconto ({newStudentForm.discountType === 'PERCENT' ? '%' : 'EGP'}) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={newStudentForm.discountType === 'PERCENT' ? 100 : calculatedBaseTotal}
                          value={newStudentForm.discountValue || ''}
                          onChange={(e) =>
                            setNewStudentForm({
                              ...newStudentForm,
                              discountValue: Number(e.target.value),
                            })
                          }
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-black font-mono text-amber-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-black text-amber-950 mb-1">
                          Observação / Motivo do Desconto (OBRIGATÓRIO para a Secretaria) *
                        </label>
                        <textarea
                          rows={2}
                          required={newStudentForm.hasDiscount}
                          placeholder="Ex: Irmão gêmeo já estuda no English Class (desconto familiar de 15%); Convênio com clube local; Autorizado pelo Coordenador..."
                          value={newStudentForm.discountReason}
                          onChange={(e) =>
                            setNewStudentForm({ ...newStudentForm, discountReason: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                        <p className="text-[11px] text-amber-800 mt-1">
                          Esta observação será exibida em destaque no painel da Secretaria para justificar a aprovação do valor com desconto.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumo dos Valores Calculados */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Valor Base do Curso:</span>
                    <strong className="text-slate-700">
                      {formatCurrency(calculatedBaseTotal, 'EGP')} ({newStudentForm.installmentsCount}x de{' '}
                      {formatCurrency(calculatedBaseTotal / newStudentForm.installmentsCount, 'EGP')})
                    </strong>
                    {newStudentForm.hasDiscount && calculatedDiscountAmount > 0 && (
                      <span className="block text-amber-700 font-bold mt-0.5">
                        Desconto Proposto: -{formatCurrency(calculatedDiscountAmount, 'EGP')}
                      </span>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-slate-500 block text-[11px]">Total Final do Plano:</span>
                    <span className="font-mono font-black text-lg text-emerald-800">
                      {formatCurrency(calculatedFinalTotal, 'EGP')}
                    </span>
                    <span className="block text-[11px] font-bold text-slate-600">
                      ({newStudentForm.installmentsCount}x de {formatCurrency(calculatedInstallmentValue, 'EGP')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Salvar Pré-Cadastro e Enviar para Aprovação da Secretaria</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: RECIBOS & COMPROVANTES                                       */}
        {/* =================================================================== */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#075e38]" />
                  Recibos & Comprovantes Emitidos
                </h2>
                <p className="text-[11px] text-slate-500">
                  Consulte comprovantes provisórios de pré-registro e recibos oficiais homologados
                </p>
              </div>

              {/* Sub-view switcher & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setReceiptViewMode('provisional')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      receiptViewMode === 'provisional'
                        ? 'bg-[#075e38] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Comprovantes Provisórios ({(state.pendingPayments || []).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptViewMode('official')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      receiptViewMode === 'official'
                        ? 'bg-[#075e38] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Recibos Oficiais ({state.receipts.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por número, aluno..."
                    value={receiptSearch}
                    onChange={(e) => setReceiptSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* VIEW 1: COMPROVANTES PROVISÓRIOS */}
            {receiptViewMode === 'provisional' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950 font-bold">
                  <span>Comprovantes Provisórios Emitidos pela Recepção (Aguardando ou Aprovados pela Tesouraria)</span>
                  <span className="font-mono text-amber-800">{filteredProvisionalReceipts.length} comprovante(s)</span>
                </div>

                {filteredProvisionalReceipts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Nenhum comprovante provisório encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Comprovante / Protocolo</th>
                          <th className="py-3 px-4">Data / Hora</th>
                          <th className="py-3 px-4">Aluno</th>
                          <th className="py-3 px-4">Curso / Parcela</th>
                          <th className="py-3 px-4">Forma</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-center">Status Tesouraria</th>
                          <th className="py-3 px-4 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProvisionalReceipts.map((p) => {
                          const isPending = p.status === 'PENDENTE';
                          const isApproved = p.status === 'APROVADO';
                          const isRejected = p.status === 'REPROVADO';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-mono font-black text-[#075e38] block">
                                  {p.provisionalReceiptNumber}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  Prot: {p.protocolNumber}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                                {p.registeredAt}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 block">{p.studentName}</span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {p.studentId}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-[11px]">
                                {p.courseName} (Parc. {p.installmentNumber}/{p.totalInstallments})
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {p.paymentMethod === 'DINHEIRO' ? 'Dinheiro' : p.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                                {formatCurrency(p.amount, 'EGP')}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    isApproved
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isRejected
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {isApproved
                                    ? '✓ APROVADO'
                                    : isRejected
                                    ? '✕ RECUSADO'
                                    : '⏳ PENDENTE'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProvisionalPayment(p);
                                    setIsProvisionalModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-[#075e38] hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Ver Comprovante
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

            {/* VIEW 2: RECIBOS OFICIAIS */}
            {receiptViewMode === 'official' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-bold">
                  <span>Recibos Fiscais Oficiais Emitidos e Homologados</span>
                  <span className="font-mono text-emerald-800">{filteredReceipts.length} recibo(s)</span>
                </div>

                {filteredReceipts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Nenhum recibo oficial encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Recibo Nº</th>
                          <th className="py-3 px-4">Data / Hora</th>
                          <th className="py-3 px-4">Aluno</th>
                          <th className="py-3 px-4">Curso / Parcela</th>
                          <th className="py-3 px-4">Forma</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReceipts.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-black text-emerald-800">
                              {r.receiptNumber}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                              {r.date}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{r.studentName}</span>
                              <span className="block font-mono text-[10px] text-slate-400">
                                {r.studentId}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              {r.courseName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {r.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                              {formatCurrency(r.amount, 'EGP')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt(r);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-[#075e38] hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Visualizar Recibo
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: RELATÓRIO DIÁRIO (CONFERÊNCIA FÍSICA COM O RONY)            */}
        {/* =================================================================== */}
        {activeTab === 'daily_report' && (
          <div className="space-y-6">
            {/* Header & Date Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#075e38]" />
                  Relatório Diário de Pagamentos Recebidos
                </h2>
                <p className="text-[11px] text-slate-500">
                  Fechamento financeiro do balcão para bater o dinheiro físico com o Rony (Tesouraria)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-slate-500 font-bold">Data:</span>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir Relatório
                </button>
              </div>
            </div>

            {/* Reconciliation Highlight Box */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-start gap-3">
              <Banknote className="w-5 h-5 text-[#075e38] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-black text-sm text-emerald-900">
                  Conferência Física Diária do Balcão (Recepção ⇄ Rony)
                </p>
                <p>
                  O dinheiro em espécie arrecadado no atendimento presencial deve bater exatamente com os valores
                  entregues ao <strong>Rony</strong> no encerramento do turno. A Tesouraria valida cada pré-registro
                  para quitação final.
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Dinheiro Físico no Balcão
                </span>
                <p className="text-2xl font-mono font-black text-emerald-800 mt-1">
                  {formatCurrency(dailyReceptionPhysicalCash, 'EGP')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gaveteiro da Recepção (a entregar ao Rony)
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Pré-Registros Pendentes
                </span>
                <p className="text-2xl font-mono font-black text-amber-600 mt-1">
                  {dailyPendingApproval.length}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  {formatCurrency(dailyPendingApproval.reduce((s, p) => s + p.amount, 0), 'EGP')} aguardando validação
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Aprovados pela Tesouraria
                </span>
                <p className="text-2xl font-mono font-black text-[#075e38] mt-1">
                  {dailyApprovedByTreasury.length}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {formatCurrency(dailyApprovedByTreasury.reduce((s, p) => s + p.amount, 0), 'EGP')} homologados
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Total Geral do Dia
                </span>
                <p className="text-2xl font-mono font-black text-slate-900 mt-1">
                  {formatCurrency(dailyReceptionTotal, 'EGP')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {dailyPendingPayments.length} lançamento(s) na recepção
                </p>
              </div>
            </div>

            {/* Daily Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Detalhamento de Pagamentos do Dia ({reportDate})
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  Total Lançado: {formatCurrency(dailyReceptionTotal, 'EGP')}
                </span>
              </div>

              {dailyPendingPayments.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Nenhum pagamento pré-registrado nesta data ({reportDate}).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Hora</th>
                        <th className="py-3 px-4">Protocolo / Comprovante</th>
                        <th className="py-3 px-4">Estudante</th>
                        <th className="py-3 px-4">Descrição</th>
                        <th className="py-3 px-4">Forma</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                        <th className="py-3 px-4 text-center">Status Tesouraria</th>
                        <th className="py-3 px-4 text-center">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyPendingPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {p.registeredAt.split(' ')[1] || p.registeredAt}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-emerald-800 block">
                              {p.protocolNumber}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {p.provisionalReceiptNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{p.studentName}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {p.studentId}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            {p.courseName} (Parc. {p.installmentNumber}/{p.totalInstallments})
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.paymentMethod === 'DINHEIRO' ? 'Dinheiro' : p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                            {formatCurrency(p.amount, 'EGP')}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === 'APROVADO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'REPROVADO'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {p.status === 'APROVADO'
                                ? '✓ APROVADO'
                                : p.status === 'REPROVADO'
                                ? '✕ RECUSADO'
                                : '⏳ PENDENTE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProvisionalPayment(p);
                                setIsProvisionalModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-[#075e38] hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Shared Official Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
      />

      {/* Shared Provisional Receipt Modal */}
      <ProvisionalReceiptModal
        payment={selectedProvisionalPayment}
        isOpen={isProvisionalModalOpen}
        onClose={() => {
          setIsProvisionalModalOpen(false);
          setSelectedProvisionalPayment(null);
        }}
      />
    </div>
  );
};
