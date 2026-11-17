import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Eye,
  TrendingUp,
  Sparkles,
  Info,
  Check,
  BadgePercent,
  Calculator,
  Sliders,
  Tag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { Badge } from '../../../common/Badge';
import { Modal } from '../../../common/Modal';
import { formatCurrency } from '../../../../lib/storage';
import { Enrollment, Course, Student, EnglishAudienceLevel, CourseLevelPricing } from '../../../../types';
import { StudentDossierModal } from '../StudentDossierModal';

export const SecretariatEnrollmentsTab: React.FC = () => {
  const {
    state,
    updateEnrollmentStatus,
    addEnrollmentToStudent,
    renegotiateEnrollmentPlan,
    updateCourseFee,
    updateCourse,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Inspect student dossier
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  // Modal for new enrollment to existing student
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(state.students[0]?.studentId || '');
  const [selectedCourseId, setSelectedCourseId] = useState(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  
  // English Level & Flexible Installments State for New Enrollment
  const [selectedEnglishLevel, setSelectedEnglishLevel] = useState<EnglishAudienceLevel>('CRIANCAS');
  const [installmentsCount, setInstallmentsCount] = useState<number>(4);
  const [customInstallmentsInput, setCustomInstallmentsInput] = useState<string>('4');
  
  // Negotiation / Discount State for New Enrollment
  const [enableNegotiation, setEnableNegotiation] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState<string>('Over-the-counter agreement / Family scholarship');

  // Selected Enrollment for details
  const [selectedEnrollmentForDetail, setSelectedEnrollmentForDetail] = useState<Enrollment | null>(null);

  // Selected Enrollment for renegotiation
  const [renegotiateEnrollment, setRenegotiateEnrollment] = useState<Enrollment | null>(null);
  const [renegDiscountType, setRenegDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [renegDiscountValue, setRenegDiscountValue] = useState<number>(15);
  const [renegDiscountReason, setRenegDiscountReason] = useState<string>('Special discount agreed at the registrar\'s office');
  const [renegInstallmentsCount, setRenegInstallmentsCount] = useState<number>(4);
  const [renegCustomInstallments, setRenegCustomInstallments] = useState<string>('4');

  // Course Fee / Total Value Editing Modal
  const [editingCourseForFee, setEditingCourseForFee] = useState<Course | null>(null);
  const [editingTotalAmount, setEditingTotalAmount] = useState<number>(2000);
  const [editingDefaultInstallments, setEditingDefaultInstallments] = useState<number>(4);
  const [editingLevels, setEditingLevels] = useState<CourseLevelPricing[]>([]);
  const [applyToPendingCharges, setApplyToPendingCharges] = useState<boolean>(true);
  const [feeChangeReason, setFeeChangeReason] = useState<string>('Update to full-price table');
  const [showFeeSuccessAlert, setShowFeeSuccessAlert] = useState<string | null>(null);

  // Course Price Table View Modal
  const [isPriceTableModalOpen, setIsPriceTableModalOpen] = useState(false);
  // Interactive Simulator state in price table
  const [simSelectedCourseId, setSimSelectedCourseId] = useState<string>(state.courses[0]?.id || '');
  const [simSelectedLevel, setSimSelectedLevel] = useState<EnglishAudienceLevel>('CRIANCAS');
  const [simInstallments, setSimInstallments] = useState<number>(4);
  const [simDiscountPercent, setSimDiscountPercent] = useState<number>(0);

  const filteredEnrollments = state.enrollments.filter((enr) => {
    const matchesSearch =
      enr.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = filterCourse === 'ALL' || enr.courseId === filterCourse;
    const matchesStatus = filterStatus === 'ALL' || enr.status === filterStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const isEnglishCourse = (course: Course | undefined | null) => {
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
    if (isEnglishCourse(course) && course.levels && course.levels.length > 0) {
      const matched = course.levels.find((l) => l.level === (level || 'CRIANCAS'));
      if (matched) return matched.totalAmount || matched.totalCourseAmount || 2000;
    }
    return course.totalCourseAmount || course.monthlyFee * (course.defaultInstallmentsCount || 4);
  };

  const getCourseDefaultInstallments = (course: Course, level?: EnglishAudienceLevel): number => {
    if (isEnglishCourse(course) && course.levels && course.levels.length > 0) {
      const matched = course.levels.find((l) => l.level === (level || 'CRIANCAS'));
      if (matched) return matched.defaultInstallments || matched.defaultInstallmentsCount || 3;
    }
    if (isEnglishCourse(course)) {
      return level === 'CRIANCAS' ? 4 : 3;
    }
    return course.defaultInstallmentsCount || 4;
  };

  // When opening edit modal for a course
  const handleOpenEditFee = (course: Course) => {
    setEditingCourseForFee(course);
    const total = course.totalCourseAmount || course.monthlyFee * (course.defaultInstallmentsCount || 4);
    setEditingTotalAmount(total);
    setEditingDefaultInstallments(course.defaultInstallmentsCount || 4);
    setApplyToPendingCharges(true);
    setFeeChangeReason('Full course price adjustment approved by management');

    if (isEnglishCourse(course) && course.levels && course.levels.length > 0) {
      setEditingLevels([...course.levels]);
    } else if (isEnglishCourse(course)) {
      setEditingLevels([
        {
          level: 'CRIANCAS',
          label: 'Children (Kids: 6-11 years)',
          defaultInstallmentsCount: 4,
          totalCourseAmount: 2000,
          monthlyFee: 500,
          notes: '4 monthly installments of 500 EGP',
        },
        {
          level: 'ADOLESCENTES',
          label: 'Teens (12-17 years)',
          defaultInstallmentsCount: 3,
          totalCourseAmount: 1500,
          monthlyFee: 500,
          notes: '3 monthly installments of 500 EGP',
        },
        {
          level: 'ADULTO',
          label: 'Adults (18+ years)',
          defaultInstallmentsCount: 3,
          totalCourseAmount: 1800,
          monthlyFee: 600,
          notes: '3 monthly installments of 600 EGP',
        },
      ]);
    } else {
      setEditingLevels([]);
    }
  };

  const handleSaveCourseFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseForFee || editingTotalAmount <= 0) return;

    const calculatedMonthlyFee = Math.round(editingTotalAmount / (editingDefaultInstallments || 4));

    updateCourseFee(
      editingCourseForFee.id,
      calculatedMonthlyFee,
      applyToPendingCharges,
      {
        totalCourseAmount: editingTotalAmount,
        defaultInstallmentsCount: editingDefaultInstallments,
        levels: isEnglishCourse(editingCourseForFee) ? editingLevels : undefined,
      }
    );

    setShowFeeSuccessAlert(
      `Total course price "${editingCourseForFee.name}" updated to ${formatCurrency(
        editingTotalAmount,
        'EGP'
      )} (${editingDefaultInstallments} installments) successfully!`
    );
    setEditingCourseForFee(null);

    setTimeout(() => {
      setShowFeeSuccessAlert(null);
    }, 4500);
  };

  // Open New Enrollment Modal
  const handleOpenNewEnrollmentModal = () => {
    const defaultCourse = state.courses[0];
    const defaultCourseId = defaultCourse?.id || '';
    setSelectedCourseId(defaultCourseId);

    const matchingClass = state.classes.find((c) => c.courseId === defaultCourseId);
    if (matchingClass) setSelectedClassId(matchingClass.id);

    const isEng = isEnglishCourse(defaultCourse);
    const initialLevel: EnglishAudienceLevel = 'CRIANCAS';
    setSelectedEnglishLevel(initialLevel);

    const defInstallments = isEng ? 4 : defaultCourse?.defaultInstallmentsCount || 4;
    setInstallmentsCount(defInstallments);
    setCustomInstallmentsInput(defInstallments.toString());
    setEnableNegotiation(false);
    setDiscountType('PERCENT');
    setDiscountValue(10);
    setDiscountReason('Over-the-counter agreement / Family scholarship');
    setIsAddModalOpen(true);
  };

  // Handle course change in new enrollment modal
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = state.courses.find((c) => c.id === courseId);
    const matchingClass = state.classes.find((c) => c.courseId === courseId);
    if (matchingClass) setSelectedClassId(matchingClass.id);

    const isEng = isEnglishCourse(course);
    const defInstallments = isEng ? (selectedEnglishLevel === 'CRIANCAS' ? 4 : 3) : course?.defaultInstallmentsCount || 4;
    setInstallmentsCount(defInstallments);
    setCustomInstallmentsInput(defInstallments.toString());
  };

  // Handle english level change in new enrollment modal
  const handleSelectEnglishLevel = (level: EnglishAudienceLevel) => {
    setSelectedEnglishLevel(level);
    const defInstallments = level === 'CRIANCAS' ? 4 : 3;
    setInstallmentsCount(defInstallments);
    setCustomInstallmentsInput(defInstallments.toString());
  };

  // Submit New Enrollment
  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !selectedClassId) return;

    const course = state.courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const baseTotal = getCourseBaseTotal(course, isEnglishCourse(course) ? selectedEnglishLevel : undefined);
    let finalTotal = baseTotal;
    let finalDiscountValue = 0;

    if (enableNegotiation) {
      if (discountType === 'PERCENT') {
        finalDiscountValue = Math.round((baseTotal * (discountValue || 0)) / 100);
      } else {
        finalDiscountValue = Math.min(baseTotal, discountValue || 0);
      }
      finalTotal = Math.max(1, baseTotal - finalDiscountValue);
    }

    const effectiveInstallments = Math.max(1, installmentsCount);

    addEnrollmentToStudent(
      selectedStudentId,
      selectedCourseId,
      selectedClassId,
      effectiveInstallments,
      {
        totalAmount: finalTotal,
        originalTotalAmount: baseTotal,
        installmentAmount: Math.round(finalTotal / effectiveInstallments),
        englishLevel: isEnglishCourse(course) ? selectedEnglishLevel : undefined,
        discountType: enableNegotiation ? discountType : 'NONE',
        discountValue: enableNegotiation ? finalDiscountValue : 0,
        discountReason: enableNegotiation ? discountReason : undefined,
      }
    );

    setIsAddModalOpen(false);
  };

  // Open Renegotiation Modal for existing enrollment
  const handleOpenRenegotiate = (enr: Enrollment) => {
    setRenegotiateEnrollment(enr);
    setRenegDiscountType(enr.paymentPlan.discountType === 'FIXED' ? 'FIXED' : 'PERCENT');
    setRenegDiscountValue(enr.paymentPlan.discountValue || 15);
    setRenegDiscountReason(enr.paymentPlan.discountReason || 'Special discount agreed at the registrar\'s office');
    setRenegInstallmentsCount(enr.paymentPlan.installmentsCount || 4);
    setRenegCustomInstallments(String(enr.paymentPlan.installmentsCount || 4));
  };

  // Submit Renegotiation
  const handleSaveRenegotiation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renegotiateEnrollment) return;

    const baseTotal =
      renegotiateEnrollment.paymentPlan.originalTotalAmount ||
      renegotiateEnrollment.paymentPlan.totalAmount;

    let calculatedDiscount = 0;
    if (renegDiscountType === 'PERCENT') {
      calculatedDiscount = Math.round((baseTotal * (renegDiscountValue || 0)) / 100);
    } else {
      calculatedDiscount = Math.min(baseTotal, renegDiscountValue || 0);
    }

    const newTotal = Math.max(1, baseTotal - calculatedDiscount);
    const effInstallments = Math.max(1, renegInstallmentsCount);

    renegotiateEnrollmentPlan(renegotiateEnrollment.id, {
      newTotalAmount: newTotal,
      installmentsCount: effInstallments,
      originalTotalAmount: baseTotal,
      discountType: renegDiscountType,
      discountValue: calculatedDiscount,
      discountReason: renegDiscountReason,
      recalculateUnpaidCharges: true,
    });

    setRenegotiateEnrollment(null);
  };

  // Active course in new enrollment modal for calculations
  const activeModalCourse = state.courses.find((c) => c.id === selectedCourseId);
  const activeModalBaseTotal = activeModalCourse
    ? getCourseBaseTotal(activeModalCourse, isEnglishCourse(activeModalCourse) ? selectedEnglishLevel : undefined)
    : 2000;
  const activeModalDiscountAmount = enableNegotiation
    ? discountType === 'PERCENT'
      ? Math.round((activeModalBaseTotal * (discountValue || 0)) / 100)
      : Math.min(activeModalBaseTotal, discountValue || 0)
    : 0;
  const activeModalFinalTotal = Math.max(1, activeModalBaseTotal - activeModalDiscountAmount);
  const activeModalInstallmentAmount = Math.round(activeModalFinalTotal / Math.max(1, installmentsCount));

  return (
    <div className="space-y-6">
      {/* Success Alert Banner */}
      {showFeeSuccessAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-semibold animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{showFeeSuccessAlert}</span>
          </div>
          <button
            onClick={() => setShowFeeSuccessAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Stats & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Registrar's Office • Enrollments, Pricing & Negotiations
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              English: 3 Age Levels
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Enrollment Management, Full Prices & Discounts
          </h2>
          <p className="text-xs text-slate-500">
            Pricing structured by total course price with flexible installments, 3 specific levels for English (Children 4x, Teens 3x, Adults 3x), and a discount negotiation module.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPriceTableModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-700" /> Tuition Table
          </button>

          <button
            onClick={handleOpenNewEnrollmentModal}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Course Enrollment
          </button>
        </div>
      </div>

      {/* Courses Overview Cards with Total Value Highlight & English 3-tier Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Courses Offered & Total Prices ({state.courses.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Based on full total price with configurable installments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.courses.map((course) => {
            const courseEnrollments = state.enrollments.filter((e) => e.courseId === course.id);
            const activeEnrollments = courseEnrollments.filter((e) => e.status === 'ATIVA');
            const isEng = isEnglishCourse(course);
            const totalValue = course.totalCourseAmount || course.monthlyFee * (course.defaultInstallmentsCount || 4);
            const defInstallments = course.defaultInstallmentsCount || 4;

            return (
              <div
                key={course.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <div className="flex items-center gap-1">
                      {isEng && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          3 Levels
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {course.code}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{course.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                </div>

                {/* English 3-tier visual preview or Standard Total */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {isEng ? (
                    <div className="space-y-1.5 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">🧒 Children (Kids):</span>
                        <span className="font-mono font-bold text-purple-900">
                          2.000 EGP <span className="text-[10px] font-normal text-slate-500">(4x 500)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">🎒 Teens:</span>
                        <span className="font-mono font-bold text-purple-900">
                          1.500 EGP <span className="text-[10px] font-normal text-slate-500">(3x 500)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">🧑 Adults:</span>
                        <span className="font-mono font-bold text-purple-900">
                          1.800 EGP <span className="text-[10px] font-normal text-slate-500">(3x 600)</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Full Total Price</span>
                        <span className="font-mono font-bold text-emerald-800 text-base">
                          {formatCurrency(totalValue, 'EGP')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Standard Plan</span>
                        <span className="font-mono font-bold text-slate-700 text-xs">
                          {defInstallments}x de {formatCurrency(Math.round(totalValue / defInstallments), 'EGP')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{activeEnrollments.length} active students</span>
                    <span>{courseEnrollments.length} total enrollments</span>
                  </div>

                  {/* Change Price Button */}
                  <button
                    onClick={() => handleOpenEditFee(course)}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3" /> Change Full Price / Levels
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrollments Table Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Active Enrollment Ledger ({filteredEnrollments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Active links, payment plans, English levels, and applied discount negotiations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, ID, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-48 sm:w-60 focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              />
            </div>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
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
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ATIVA">Active</option>
              <option value="BLOQUEADA">Blocked</option>
              <option value="CONCLUIDA">Completed</option>
              <option value="CANCELADA">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course & Level</th>
                <th className="px-4 py-3">Assigned Class</th>
                <th className="px-4 py-3">Enrollment Date</th>
                <th className="px-4 py-3">Payment Plan & Negotiation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No enrollments found with the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const student = state.students.find((s) => s.studentId === enr.studentId);
                  const course = state.courses.find((c) => c.id === enr.courseId);
                  const isEng = isEnglishCourse(course);

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {enr.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{enr.studentName}</p>
                        <p className="text-[11px] text-slate-400">{student?.phone || 'No phone'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{enr.courseName}</p>
                        {isEng && enr.paymentPlan.englishLevel && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {enr.paymentPlan.englishLevel === 'CRIANCAS' && '🧒 Children (4x)'}
                            {enr.paymentPlan.englishLevel === 'ADOLESCENTES' && '🎒 Teens (3x)'}
                            {enr.paymentPlan.englishLevel === 'ADULTO' && '🧑 Adults (3x)'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {enr.className}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {enr.enrollmentDate}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 font-mono">
                            {formatCurrency(enr.paymentPlan.installmentAmount, 'EGP')}
                            <span className="text-[10px] text-slate-400 font-normal"> /month</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {enr.paymentPlan.installmentsCount} installments • Total:{' '}
                            <strong className="text-slate-800 font-mono">
                              {formatCurrency(enr.paymentPlan.totalAmount, 'EGP')}
                            </strong>
                          </p>

                          {/* Discount Tag */}
                          {enr.paymentPlan.isNegotiated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                              <Tag className="w-2.5 h-2.5" /> Negotiated
                              {enr.paymentPlan.originalTotalAmount && enr.paymentPlan.originalTotalAmount > enr.paymentPlan.totalAmount && (
                                <span>(-{formatCurrency(enr.paymentPlan.originalTotalAmount - enr.paymentPlan.totalAmount, 'EGP')})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={enr.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEnrollmentForDetail(enr)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="View enrollment and payment plan details"
                          >
                            Details
                          </button>

                          {/* Negotiate / Grant Discount */}
                          <button
                            onClick={() => handleOpenRenegotiate(enr)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Negotiate installments or grant a discount"
                          >
                            <BadgePercent className="w-3.5 h-3.5 text-amber-600" /> Negotiate
                          </button>

                          {course && (
                            <button
                              onClick={() => handleOpenEditFee(course)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 cursor-pointer"
                              title={`Change course price ${course.name}`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {enr.status === 'ATIVA' ? (
                            <button
                              onClick={() => updateEnrollmentStatus(enr.id, 'BLOQUEADA')}
                              className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title="Block enrollment"
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() => updateEnrollmentStatus(enr.id, 'ATIVA')}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Unblock enrollment"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TUITION TABLE WITH 3 ENGLISH AGE LEVELS & FREE SIMULATOR      */}
      {/* ========================================================================= */}
      {isPriceTableModalOpen && (
        <Modal
          isOpen={isPriceTableModalOpen}
          onClose={() => setIsPriceTableModalOpen(false)}
          size="lg"
          title="Tuition & Course Price Table"
          subtitle="Full course prices, 3 specific levels for English, and a flexible installment simulator"
        >
          <div className="space-y-5 text-xs">
            {/* Informational Banner on English Course Specifics */}
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Official Rule: English General Course in 3 Age Levels</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                The <strong>English General Course</strong> has 3 service levels:{' '}
                <strong>Children (Kids)</strong> with a standard plan of <strong>4 installments</strong>; and{' '}
                <strong>Teens</strong> and <strong>Adults</strong> with a standard plan of{' '}
                <strong>3 installments</strong>. For any course, the registrar's office is free to customize the number of installments as needed!
              </p>
            </div>

            {/* Complete Pricing Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Code</th>
                    <th className="px-3 py-2.5">Course</th>
                    <th className="px-3 py-2.5">Level / Age Range</th>
                    <th className="px-3 py-2.5">Full Price (Total)</th>
                    <th className="px-3 py-2.5">Standard Installments</th>
                    <th className="px-3 py-2.5">Installment Amount</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.courses.map((c) => {
                    const isEng = isEnglishCourse(c);

                    if (isEng) {
                      // Render 3 levels for English
                      const levels: CourseLevelPricing[] =
                        c.levels && c.levels.length > 0
                          ? c.levels
                          : [
                              {
                                level: 'CRIANCAS',
                                label: 'Children (Kids: 6-11 years)',
                                defaultInstallmentsCount: 4,
                                totalCourseAmount: 2000,
                                monthlyFee: 500,
                              },
                              {
                                level: 'ADOLESCENTES',
                                label: 'Teens (12-17 years)',
                                defaultInstallmentsCount: 3,
                                totalCourseAmount: 1500,
                                monthlyFee: 500,
                              },
                              {
                                level: 'ADULTO',
                                label: 'Adults (18+ years)',
                                defaultInstallmentsCount: 3,
                                totalCourseAmount: 1800,
                                monthlyFee: 600,
                              },
                            ];

                      return levels.map((lvl, idx) => (
                        <tr key={`${c.id}_${lvl.level}`} className={idx % 2 === 0 ? 'bg-purple-50/20' : 'bg-white'}>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-700">
                            {idx === 0 ? c.code : ''}
                          </td>
                          <td className="px-3 py-2.5">
                            {idx === 0 && (
                              <div>
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                                  Special English Course
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-purple-950 block">{lvl.label}</span>
                            <span className="text-[10px] text-slate-400">
                              {lvl.level === 'CRIANCAS' ? '4 monthly installments' : '3 monthly installments'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-black text-emerald-800 text-sm">
                            {formatCurrency(lvl.totalAmount || lvl.totalCourseAmount || 0, 'EGP')}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {lvl.defaultInstallments || lvl.defaultInstallmentsCount || 3}x
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                            {formatCurrency(
                              lvl.installmentAmount ||
                                Math.round(
                                  (lvl.totalAmount || lvl.totalCourseAmount || 0) /
                                    (lvl.defaultInstallments || lvl.defaultInstallmentsCount || 1)
                                ),
                              'EGP'
                            )}
                            <span className="text-[10px] text-slate-400 font-normal"> /month</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {idx === 0 && (
                              <button
                                onClick={() => {
                                  setIsPriceTableModalOpen(false);
                                  handleOpenEditFee(c);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto text-xs"
                              >
                                <Edit2 className="w-3 h-3" /> Change
                              </button>
                            )}
                          </td>
                        </tr>
                      ));
                    }

                    // For non-English courses
                    const totalVal = c.totalCourseAmount || c.monthlyFee * (c.defaultInstallmentsCount || 4);
                    const defInst = c.defaultInstallmentsCount || 4;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{c.code}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.category}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium">General / All Ages</td>
                        <td className="px-3 py-2.5 font-mono font-black text-emerald-800 text-sm">
                          {formatCurrency(totalVal, 'EGP')}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {defInst}x
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                          {formatCurrency(Math.round(totalVal / defInst), 'EGP')}
                          <span className="text-[10px] text-slate-400 font-normal"> /month</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => {
                              setIsPriceTableModalOpen(false);
                              handleOpenEditFee(c);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto text-xs"
                          >
                            <Edit2 className="w-3 h-3" /> Change
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Interactive Installment Simulator */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Flexible Installment & Instant Negotiation Simulator
                </span>
                <span className="text-[11px] text-slate-500">Choose any number of installments and test discounts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {/* Select Course */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course</label>
                  <select
                    value={simSelectedCourseId}
                    onChange={(e) => setSimSelectedCourseId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-xs"
                  >
                    {state.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level (if English) */}
                {isEnglishCourse(state.courses.find((c) => c.id === simSelectedCourseId)) ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">English Level</label>
                    <select
                      value={simSelectedLevel}
                      onChange={(e) => setSimSelectedLevel(e.target.value as EnglishAudienceLevel)}
                      className="w-full p-2 bg-purple-50 border border-purple-300 text-purple-900 rounded-xl font-bold text-xs"
                    >
                      <option value="CRIANCAS">Children (Kids - Standard 4x)</option>
                      <option value="ADOLESCENTES">Teens (Standard 3x)</option>
                      <option value="ADULTO">Adults (Standard 3x)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Level</label>
                    <input
                      disabled
                      value="General / All Ages"
                      className="w-full p-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs"
                    />
                  </div>
                )}

                {/* Number of installments */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Number of Installments?
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={simInstallments}
                      onChange={(e) => setSimInstallments(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-center"
                    />
                    <div className="flex gap-1">
                      {[1, 3, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSimInstallments(num)}
                          className={`px-1.5 py-1 text-[10px] font-bold rounded ${
                            simInstallments === num
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated Discount % */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Simulated Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    step={5}
                    value={simDiscountPercent}
                    onChange={(e) => setSimDiscountPercent(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-center"
                    placeholder="0%"
                  />
                </div>
              </div>

              {/* Simulation Calculation Result */}
              {(() => {
                const course = state.courses.find((c) => c.id === simSelectedCourseId);
                if (!course) return null;
                const baseTotal = getCourseBaseTotal(course, isEnglishCourse(course) ? simSelectedLevel : undefined);
                const discountAmt = Math.round((baseTotal * simDiscountPercent) / 100);
                const finalSimTotal = Math.max(1, baseTotal - discountAmt);
                const simInstallmentVal = Math.round(finalSimTotal / Math.max(1, simInstallments));

                return (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Original Full Price</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {formatCurrency(baseTotal, 'EGP')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Simulated Discount</span>
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        {simDiscountPercent > 0 ? `-${formatCurrency(discountAmt, 'EGP')} (${simDiscountPercent}%)` : 'No discount'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Calculated Total</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        {formatCurrency(finalSimTotal, 'EGP')}
                      </span>
                    </div>
                    <div className="bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-900 block font-bold">
                        {simInstallments}x Installments of:
                      </span>
                      <span className="font-mono font-black text-emerald-900 text-sm">
                        {formatCurrency(simInstallmentVal, 'EGP')}
                        <span className="text-[10px] font-normal"> /month</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPriceTableModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHANGE COURSE FULL PRICE / LEVELS                              */}
      {/* ========================================================================= */}
      {editingCourseForFee && (
        <Modal
          isOpen={!!editingCourseForFee}
          onClose={() => setEditingCourseForFee(null)}
          title={`Change Full Price: ${editingCourseForFee.name}`}
          subtitle="Configure the total course price, default installments, and levels for the English course"
        >
          <form onSubmit={handleSaveCourseFee} className="space-y-4 text-xs">
            {/* If English Course: 3-level customizer */}
            {isEnglishCourse(editingCourseForFee) ? (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="font-bold text-purple-900 block text-xs">
                    3-Level Structure of the English General Course:
                  </span>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    Set the full total price for each age range. Children have 4 standard installments, while Teens and Adults have 3.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {editingLevels.map((lvl, index) => {
                    const monthly = Math.round(lvl.totalCourseAmount / (lvl.defaultInstallmentsCount || 1));

                    return (
                      <div
                        key={lvl.level}
                        className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-purple-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{lvl.label}</span>
                          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {lvl.defaultInstallmentsCount} standard installments
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Full Total Price (EGP) *
                            </label>
                            <input
                              type="number"
                              min={100}
                              max={50000}
                              step={50}
                              value={lvl.totalCourseAmount}
                              onChange={(e) => {
                                const newAmount = Number(e.target.value);
                                const updated = [...editingLevels];
                                updated[index] = {
                                  ...updated[index],
                                  totalCourseAmount: newAmount,
                                  monthlyFee: Math.round(newAmount / updated[index].defaultInstallmentsCount),
                                };
                                setEditingLevels(updated);
                              }}
                              className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Standard Installments
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={lvl.defaultInstallmentsCount}
                              onChange={(e) => {
                                const newInst = Math.max(1, Number(e.target.value));
                                const updated = [...editingLevels];
                                updated[index] = {
                                  ...updated[index],
                                  defaultInstallmentsCount: newInst,
                                  monthlyFee: Math.round(updated[index].totalCourseAmount / newInst),
                                };
                                setEditingLevels(updated);
                              }}
                              className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Resulting monthly amount:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {formatCurrency(monthly, 'EGP')} / installment
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Non-English Course: Single Total & Default Installments */
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Total Course Price (EGP) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={50000}
                      step={50}
                      required
                      value={editingTotalAmount}
                      onChange={(e) => setEditingTotalAmount(Number(e.target.value))}
                      className="w-full pl-3 pr-16 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-base text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                      EGP Total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ex: 1,600 EGP (Soccer), 3,000 EGP (Preschool), 1,800 EGP (Sewing).
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Number of Standard Installments
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={editingDefaultInstallments}
                      onChange={(e) => setEditingDefaultInstallments(Math.max(1, Number(e.target.value)))}
                      className="w-28 p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                    <span className="text-slate-500 font-medium">
                      Will result in{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatCurrency(
                          Math.round(editingTotalAmount / Math.max(1, editingDefaultInstallments)),
                          'EGP'
                        )}
                      </strong>{' '}
                      / installment
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox: update pending unpaid charges */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToPendingCharges}
                  onChange={(e) => setApplyToPendingCharges(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Also adjust pending charges for already-enrolled students
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Proportionally updates installments with REGULAR or PENDING status. Charges already paid remain unchanged.
                  </span>
                </div>
              </label>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason / Justification for Change
              </label>
              <input
                type="text"
                value={feeChangeReason}
                onChange={(e) => setFeeChangeReason(e.target.value)}
                placeholder="Ex: Price adjustment approved by management for the current cycle"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCourseForFee(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save New Prices
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW ENROLLMENT WITH LEVEL SELECTION, FLEXIBLE INSTALLMENTS & DISCOUNT  */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="New Course Enrollment"
          subtitle="Link an existing student to a course with flexible installments and negotiation options"
        >
          <form onSubmit={handleCreateEnrollment} className="space-y-4 text-xs">
            {/* Student selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                required
              >
                {state.students.map((stu) => (
                  <option key={stu.studentId} value={stu.studentId}>
                    {stu.studentId} — {stu.name} ({stu.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Course selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Course *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                required
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Full Total Price:{' '}
                    {formatCurrency(
                      c.totalCourseAmount || c.monthlyFee * (c.defaultInstallmentsCount || 4),
                      'EGP'
                    )}
                  </option>
                ))}
              </select>
            </div>

            {/* English 3-tier Level Selection (Only for English) */}
            {isEnglishCourse(activeModalCourse) && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <label className="block font-bold text-purple-950 text-xs">
                  Age Range / English Level * (Exclusive Selector for English Course)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectEnglishLevel('CRIANCAS')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedEnglishLevel === 'CRIANCAS'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                    }`}
                  >
                    <p className="font-bold text-xs">🧒 Children (Kids)</p>
                    <p className="text-[10px] opacity-90 mt-0.5">Standard: 4 Installments</p>
                    <p className="font-mono font-bold text-xs mt-1">2.000 EGP (4x 500)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectEnglishLevel('ADOLESCENTES')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedEnglishLevel === 'ADOLESCENTES'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                    }`}
                  >
                    <p className="font-bold text-xs">🎒 Teens</p>
                    <p className="text-[10px] opacity-90 mt-0.5">Standard: 3 Installments</p>
                    <p className="font-mono font-bold text-xs mt-1">1.500 EGP (3x 500)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectEnglishLevel('ADULTO')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedEnglishLevel === 'ADULTO'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-purple-200 bg-white text-slate-700 hover:bg-purple-100/50'
                    }`}
                  >
                    <p className="font-bold text-xs">🧑 Adults</p>
                    <p className="text-[10px] opacity-90 mt-0.5">Standard: 3 Installments</p>
                    <p className="font-mono font-bold text-xs mt-1">1.800 EGP (3x 600)</p>
                  </button>
                </div>
              </div>
            )}

            {/* Class selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Class & Schedule *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                required
              >
                {state.classes
                  .filter((c) => c.courseId === selectedCourseId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.schedule} ({c.room})
                    </option>
                  ))}
              </select>
            </div>

            {/* Flexible Installments: Choose any number of installments! */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 text-xs">
                  Student's Number of Installments (Flexible)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {installmentsCount === 1 ? 'Full payment upfront' : `Split into ${installmentsCount} payments`}
                </span>
              </div>

              {/* Quick preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setInstallmentsCount(num);
                      setCustomInstallmentsInput(String(num));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      installmentsCount === num
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num === 1 ? '1x (Full Payment)' : `${num}x`}
                  </button>
                ))}
              </div>

              {/* Custom number input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-500 text-[11px]">Or enter the exact number:</span>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={customInstallmentsInput}
                  onChange={(e) => {
                    setCustomInstallmentsInput(e.target.value);
                    const val = Number(e.target.value);
                    if (val > 0) setInstallmentsCount(val);
                  }}
                  className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                />
                <span className="text-slate-500 text-[11px]">installments</span>
              </div>
            </div>

            {/* Negotiation & Discount Panel */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableNegotiation}
                    onChange={(e) => setEnableNegotiation(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5 text-amber-600" />
                    Apply Negotiation / Grant Discount to Student
                  </span>
                </label>
                {enableNegotiation && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              {enableNegotiation && (
                <div className="space-y-2.5 pt-1 border-t border-amber-200/70">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Discount Type</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setDiscountType('PERCENT')}
                          className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                            discountType === 'PERCENT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-amber-200 text-amber-900'
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('FIXED')}
                          className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                            discountType === 'FIXED'
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
                        {discountType === 'PERCENT' ? 'Discount Percentage (%)' : 'Amount to Deduct (EGP)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={discountType === 'PERCENT' ? 95 : activeModalBaseTotal - 1}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950 text-xs"
                      />
                    </div>
                  </div>

                  {/* Justification & Quick Chips */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Reason for Negotiation / Agreement
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Ex: Social scholarship, Sibling discount, Over-the-counter agreement"
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'Sibling Discount',
                        'Community Family Scholarship',
                        'Early Payment',
                        'Social Partnership',
                        'Registrar\'s Office Agreement',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setDiscountReason(chip)}
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

            {/* Financial Summary Box */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Original Full Price:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(activeModalBaseTotal, 'EGP')}
                </span>
              </div>

              {enableNegotiation && activeModalDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-amber-700">
                  <span>Discount Granted:</span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(activeModalDiscountAmount, 'EGP')} (
                    {discountType === 'PERCENT' ? `${discountValue}%` : 'Fixed'})
                  </span>
                </div>
              )}

              <div className="pt-1 border-t border-emerald-200 flex items-center justify-between font-bold text-emerald-950 text-sm">
                <span>Total to Pay ({installmentsCount} installments):</span>
                <span className="font-mono font-black text-emerald-800 text-base">
                  {formatCurrency(activeModalFinalTotal, 'EGP')}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                <span>Amount of Each Installment:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {formatCurrency(activeModalInstallmentAmount, 'EGP')} / month
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm Enrollment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RENEGOTIATION / DISCOUNT ON EXISTING ENROLLMENT                */}
      {/* ========================================================================= */}
      {renegotiateEnrollment && (
        <Modal
          isOpen={!!renegotiateEnrollment}
          onClose={() => setRenegotiateEnrollment(null)}
          title={`Tuition Negotiation: ${renegotiateEnrollment.studentName}`}
          subtitle={`Enrollment: ${renegotiateEnrollment.id} • Course: ${renegotiateEnrollment.courseName}`}
        >
          {(() => {
            const currentCharges = state.charges.filter((c) => c.enrollmentId === renegotiateEnrollment.id);
            const paidCharges = currentCharges.filter((c) => c.status === 'PAGO');
            const unpaidCharges = currentCharges.filter((c) => c.status === 'PENDENTE' || c.status === 'REGULAR');
            const totalPaid = paidCharges.reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);

            const baseTotal =
              renegotiateEnrollment.paymentPlan.originalTotalAmount ||
              renegotiateEnrollment.paymentPlan.totalAmount;

            let discountAmt = 0;
            if (renegDiscountType === 'PERCENT') {
              discountAmt = Math.round((baseTotal * (renegDiscountValue || 0)) / 100);
            } else {
              discountAmt = Math.min(baseTotal, renegDiscountValue || 0);
            }

            const newTotal = Math.max(1, baseTotal - discountAmt);
            const effInstallments = Math.max(1, renegInstallmentsCount);
            const remainingToPay = Math.max(0, newTotal - totalPaid);
            const perUnpaidAmount = unpaidCharges.length > 0 ? Math.round(remainingToPay / unpaidCharges.length) : 0;

            return (
              <form onSubmit={handleSaveRenegotiation} className="space-y-4 text-xs">
                {/* Historical summary */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Current Plan</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(renegotiateEnrollment.paymentPlan.totalAmount, 'EGP')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ({renegotiateEnrollment.paymentPlan.installmentsCount} installments)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Already Paid</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(totalPaid, 'EGP')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">({paidCharges.length} installments)</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Outstanding</span>
                    <span className="font-mono font-bold text-amber-700">
                      {unpaidCharges.length} installments
                    </span>
                  </div>
                </div>

                {/* Discount options */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
                  <span className="font-bold text-amber-950 block text-xs">
                    Grant Discount / Renegotiate Full Price
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Discount Type</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setRenegDiscountType('PERCENT')}
                          className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                            renegDiscountType === 'PERCENT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-amber-200 text-amber-900'
                          }`}
                        >
                          % Percentage
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenegDiscountType('FIXED')}
                          className={`p-1.5 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                            renegDiscountType === 'FIXED'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-amber-200 text-amber-900'
                          }`}
                        >
                          EGP Fixed Amount
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">
                        {renegDiscountType === 'PERCENT' ? 'Discount (%)' : 'Discount (EGP)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={renegDiscountType === 'PERCENT' ? 95 : baseTotal - 1}
                        value={renegDiscountValue}
                        onChange={(e) => setRenegDiscountValue(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Reason / Negotiation Agreement
                    </label>
                    <input
                      type="text"
                      value={renegDiscountReason}
                      onChange={(e) => setRenegDiscountReason(e.target.value)}
                      placeholder="Ex: Renegotiation for financial reasons / Authorized agreement"
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Adjust number of installments */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Adjust Plan Installment Count</span>
                    <span className="text-slate-500 font-medium text-[11px]">{effInstallments} installments total</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setRenegInstallmentsCount(num);
                          setRenegCustomInstallments(String(num));
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          renegInstallmentsCount === num
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Outcome Preview */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>New Full Total Price:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(newTotal, 'EGP')}{' '}
                      <span className="text-amber-700 font-normal">(-{formatCurrency(discountAmt, 'EGP')})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Remaining Balance to Pay:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatCurrency(remainingToPay, 'EGP')}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-emerald-200 flex items-center justify-between font-bold text-emerald-950">
                    <span>New Amount of Pending Installments ({unpaidCharges.length}x):</span>
                    <span className="font-mono font-black text-emerald-900 text-sm">
                      {formatCurrency(perUnpaidAmount, 'EGP')} / month
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenegotiateEnrollment(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Apply Renegotiation
                  </button>
                </div>
              </form>
            );
          })()}
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ENROLLMENT DETAILS & FINANCIAL LEDGER                           */}
      {/* ========================================================================= */}
      {selectedEnrollmentForDetail && (
        <Modal
          isOpen={!!selectedEnrollmentForDetail}
          onClose={() => setSelectedEnrollmentForDetail(null)}
          title={`Enrollment for ${selectedEnrollmentForDetail.studentName}`}
          subtitle={`ID: ${selectedEnrollmentForDetail.studentId} • Course: ${selectedEnrollmentForDetail.courseName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Class</span>
                <p className="font-bold text-slate-800">{selectedEnrollmentForDetail.className}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Enrollment Date</span>
                <p className="font-bold text-slate-800 font-mono">{selectedEnrollmentForDetail.enrollmentDate}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Installment / Monthly Amount</span>
                <p className="font-bold text-emerald-700 font-mono">
                  {formatCurrency(selectedEnrollmentForDetail.paymentPlan.installmentAmount, 'EGP')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Total Plan ({selectedEnrollmentForDetail.paymentPlan.installmentsCount}x)
                </span>
                <p className="font-bold text-slate-900 font-mono">
                  {formatCurrency(selectedEnrollmentForDetail.paymentPlan.totalAmount, 'EGP')}
                </p>
              </div>

              {/* English Level */}
              {selectedEnrollmentForDetail.paymentPlan.englishLevel && (
                <div className="col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Age Level (English Course)</span>
                  <span className="inline-block mt-0.5 text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    {selectedEnrollmentForDetail.paymentPlan.englishLevel === 'CRIANCAS' && '🧒 Children (Kids: 4 installments)'}
                    {selectedEnrollmentForDetail.paymentPlan.englishLevel === 'ADOLESCENTES' && '🎒 Teens (3 installments)'}
                    {selectedEnrollmentForDetail.paymentPlan.englishLevel === 'ADULTO' && '🧑 Adults (3 installments)'}
                  </span>
                </div>
              )}

              {/* Negotiation Details */}
              {selectedEnrollmentForDetail.paymentPlan.isNegotiated && (
                <div className="col-span-2 pt-2 border-t border-slate-200/80 bg-amber-50/60 p-2 rounded-lg">
                  <span className="text-amber-800 block font-bold text-[11px] flex items-center gap-1">
                    <BadgePercent className="w-3 h-3" /> Discount / Negotiation Applied:
                  </span>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Original Price: {formatCurrency(selectedEnrollmentForDetail.paymentPlan.originalTotalAmount || selectedEnrollmentForDetail.paymentPlan.totalAmount, 'EGP')} •{' '}
                    Reason: {selectedEnrollmentForDetail.paymentPlan.discountReason || 'Registrar\'s Office agreement'}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Ledger */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800">Generated Tuition Ledger</h4>
                <button
                  onClick={() => {
                    const enr = selectedEnrollmentForDetail;
                    setSelectedEnrollmentForDetail(null);
                    handleOpenRenegotiate(enr);
                  }}
                  className="text-amber-800 hover:text-amber-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <BadgePercent className="w-3.5 h-3.5" /> Renegotiate Ledger
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state.charges
                  .filter((c) => c.enrollmentId === selectedEnrollmentForDetail.id)
                  .map((chg) => (
                    <div
                      key={chg.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Installment {chg.installmentNumber}/{chg.totalInstallments}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">Due: {chg.dueDate}</p>
                        {chg.notes && <p className="text-[10px] text-slate-500 line-clamp-1">{chg.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          {formatCurrency(chg.amount, 'EGP')}
                        </span>
                        <Badge status={chg.status} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEnrollmentForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Dossier Modal */}
      {inspectStudent && (
        <StudentDossierModal
          student={inspectStudent}
          isOpen={!!inspectStudent}
          onClose={() => setInspectStudent(null)}
        />
      )}
    </div>
  );
};
