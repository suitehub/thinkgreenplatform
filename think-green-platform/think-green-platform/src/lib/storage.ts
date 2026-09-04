import {
  User,
  Student,
  Course,
  ClassRoom,
  Enrollment,
  Charge,
  PaymentReceipt,
  CashRegister,
  CashMovement,
  AttendanceRecord,
  Lesson,
  Assessment,
  Grade,
  Assignment,
  Submission,
  AccountingTransaction,
  AuditLog,
  SystemSettings,
  SystemNotification,
  UserRole,
  PaymentMethod,
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_CLASSES,
  INITIAL_ENROLLMENTS,
  INITIAL_CHARGES,
  INITIAL_RECEIPTS,
  INITIAL_CASH_REGISTERS,
  INITIAL_CASH_MOVEMENTS,
  INITIAL_ASSESSMENTS,
  INITIAL_GRADES,
  INITIAL_LESSONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_ACCOUNTING_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from './mockData';

export const STORAGE_KEY = 'think_green_platform_v2_data';

export interface AppState {
  currentUser: User;
  users: User[];
  students: Student[];
  courses: Course[];
  classes: ClassRoom[];
  enrollments: Enrollment[];
  charges: Charge[];
  receipts: PaymentReceipt[];
  cashRegisters: CashRegister[];
  cashMovements: CashMovement[];
  assessments: Assessment[];
  grades: Grade[];
  lessons: Lesson[];
  assignments: Assignment[];
  submissions: Submission[];
  attendance: AttendanceRecord[];
  accountingTransactions: AccountingTransaction[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  settings: SystemSettings;
}

export const loadInitialState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all arrays and nested objects exist in case of schema updates or legacy storage
      return {
        currentUser: parsed.currentUser || INITIAL_USERS[0],
        users: parsed.users || INITIAL_USERS,
        students: parsed.students || INITIAL_STUDENTS,
        courses: parsed.courses || INITIAL_COURSES,
        classes: parsed.classes || INITIAL_CLASSES,
        enrollments: parsed.enrollments || INITIAL_ENROLLMENTS,
        charges: parsed.charges || INITIAL_CHARGES,
        receipts: parsed.receipts || INITIAL_RECEIPTS,
        cashRegisters: parsed.cashRegisters || INITIAL_CASH_REGISTERS,
        cashMovements: parsed.cashMovements || INITIAL_CASH_MOVEMENTS,
        assessments: parsed.assessments || INITIAL_ASSESSMENTS,
        grades: parsed.grades || INITIAL_GRADES,
        lessons: parsed.lessons || INITIAL_LESSONS,
        assignments: parsed.assignments || INITIAL_ASSIGNMENTS,
        submissions: parsed.submissions || INITIAL_SUBMISSIONS,
        attendance: parsed.attendance || INITIAL_ATTENDANCE,
        accountingTransactions: parsed.accountingTransactions || INITIAL_ACCOUNTING_TRANSACTIONS,
        auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
        notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
        settings: {
          ...INITIAL_SETTINGS,
          ...(parsed.settings || {}),
          rulesConfig: {
            ...INITIAL_SETTINGS.rulesConfig,
            ...(parsed.settings?.rulesConfig || {}),
          },
        },
      };
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
  }

  return {
    currentUser: INITIAL_USERS[0], // Super Admin by default
    users: INITIAL_USERS,
    students: INITIAL_STUDENTS,
    courses: INITIAL_COURSES,
    classes: INITIAL_CLASSES,
    enrollments: INITIAL_ENROLLMENTS,
    charges: INITIAL_CHARGES,
    receipts: INITIAL_RECEIPTS,
    cashRegisters: INITIAL_CASH_REGISTERS,
    cashMovements: INITIAL_CASH_MOVEMENTS,
    assessments: INITIAL_ASSESSMENTS,
    grades: INITIAL_GRADES,
    lessons: INITIAL_LESSONS,
    assignments: INITIAL_ASSIGNMENTS,
    submissions: INITIAL_SUBMISSIONS,
    attendance: INITIAL_ATTENDANCE,
    accountingTransactions: INITIAL_ACCOUNTING_TRANSACTIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
    settings: INITIAL_SETTINGS,
  };
};

export const saveStateToLocalStorage = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
};

/**
 * Generate next unique STU00000 format identifier
 */
export const generateNextStudentId = (existingStudents: Student[]): string => {
  const numericIds = existingStudents
    .map((s) => {
      const match = s.studentId?.match(/STU(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const nextNumber = maxId + 1;
  return `STU${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Generate next Receipt Number e.g. REC-2026-00150
 */
export const generateNextReceiptNumber = (existingReceipts: PaymentReceipt[]): string => {
  const year = new Date().getFullYear();
  const numericNumbers = existingReceipts
    .map((r) => {
      const match = r.receiptNumber?.match(/REC-\d+-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxNum = numericNumbers.length > 0 ? Math.max(...numericNumbers) : 100;
  const nextNum = maxNum + 1;
  return `REC-${year}-${String(nextNum).padStart(5, '0')}`;
};

/**
 * Real-time Business Rules Engine: Automatic Gates Evaluation for Exams & Classroom Entry
 */
export const evaluateExamAccess = (
  studentId: string,
  assessment: Assessment,
  charges: Charge[],
  settings?: SystemSettings
): { allowed: boolean; reason?: string; requiredStage?: string; isFinancialBlock?: boolean } => {
  const currentSettings = settings || INITIAL_SETTINGS;
  const rules = currentSettings.rulesConfig || INITIAL_SETTINGS.rulesConfig;

  if (!currentSettings.enableAutomaticExamGates || assessment.requiredPaymentStage === 'NONE') {
    return { allowed: true };
  }

  // Find all charges for this student
  const studentCharges = (charges || [])
    .filter((c) => c.studentId === studentId)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  if (studentCharges.length === 0) {
    return { allowed: true };
  }

  const firstInstallment = studentCharges.find((c) => c.installmentNumber === 1);
  const secondInstallment = studentCharges.find((c) => c.installmentNumber === 2);
  const overdueCharges = studentCharges.filter((c) => c.status === 'EM ATRASO');
  const unpaidCharges = studentCharges.filter((c) => c.status !== 'PAGO');

  // General strict check: If student has ANY overdue charge (em atraso), all exams are blocked
  if (overdueCharges.length > 0) {
    const overdueInst = overdueCharges[0];
    return {
      allowed: false,
      reason: `Prova Bloqueada: A ${overdueInst.installmentNumber}ª parcela (${overdueInst.amount} EGP) está em atraso. Regularize na Tesouraria para liberar a avaliação.`,
      requiredStage: `Quitação da ${overdueInst.installmentNumber}ª Parcela em atraso no balcão`,
      isFinancialBlock: true,
    };
  }

  // Rule 1: Stage 1 check
  if (assessment.requiredPaymentStage === 'STAGE_1_PAID') {
    if (rules?.rule1_classroomRequiresFirstPayment && firstInstallment && firstInstallment.status !== 'PAGO') {
      return {
        allowed: false,
        reason: 'Prova Bloqueada: 1ª Parcela (Matrícula) está pendente de pagamento na Tesouraria.',
        requiredStage: 'Quitação da 1ª Parcela na recepção / financeiro em dinheiro',
        isFinancialBlock: true,
      };
    }
  }

  // Rule 2: Stage 2 check for Midterm / 1st Exam
  if (assessment.requiredPaymentStage === 'STAGE_2_PAID') {
    if (rules?.rule2_exam1RequiresSecondPayment && secondInstallment && secondInstallment.status !== 'PAGO') {
      return {
        allowed: false,
        reason: 'Esta avaliação está bloqueada: A 2ª Parcela da etapa correspondente não foi quitada.',
        requiredStage: 'Regularização da 2ª Parcela junto à Tesouraria (Balcão)',
        isFinancialBlock: true,
      };
    }
  }

  // Rule 3: Final Exam requires all required course payments
  if (assessment.requiredPaymentStage === 'STAGE_FINAL_PAID') {
    if (rules?.rule3_finalExamRequiresFullPayment && unpaidCharges.length > 0) {
      const firstUnpaid = unpaidCharges[0];
      return {
        allowed: false,
        reason: `Prova Final Bloqueada: Existem parcelas em aberto (${firstUnpaid.installmentNumber}ª parcela). É necessária a quitação integral do curso.`,
        requiredStage: 'Quitação integral de todas as mensalidades do curso',
        isFinancialBlock: true,
      };
    }
  }

  return { allowed: true };
};

/**
 * Real-time Business Rules Engine: Classroom Entrance & Class Access Evaluation
 * If a student has not paid the installment corresponding to the stage or is in arrears,
 * they are strictly blocked from entering the classroom (presencial) and accessing class lessons/materials (digital).
 */
export const evaluateClassroomAccess = (
  studentId: string,
  classId: string,
  charges: Charge[],
  enrollments: Enrollment[],
  settings?: SystemSettings
): {
  allowed: boolean;
  reason?: string;
  isFinancialBlock?: boolean;
  overdueCount?: number;
  unpaidInstallments?: number[];
} => {
  const currentSettings = settings || INITIAL_SETTINGS;
  const rules = currentSettings.rulesConfig || INITIAL_SETTINGS.rulesConfig;

  if (!currentSettings.enableAutomaticClassroomGates) {
    return { allowed: true };
  }

  const enrollment = (enrollments || []).find(
    (e) => e.studentId === studentId && (classId === 'ALL' || e.classId === classId)
  );

  if (!enrollment && classId !== 'ALL') {
    return {
      allowed: false,
      reason: 'Aluno não possui vínculo ou matrícula ativa para esta turma.',
      isFinancialBlock: false,
    };
  }

  if (enrollment && enrollment.status === 'BLOQUEADA') {
    return {
      allowed: false,
      reason: 'Matrícula bloqueada administrativamente. Dirija-se à Secretaria.',
      isFinancialBlock: true,
    };
  }

  // Get charges for this enrollment or student
  const studentCharges = (charges || [])
    .filter((c) => {
      if (enrollment) {
        return c.enrollmentId === enrollment.id || (c.studentId === studentId && c.courseName === enrollment.courseName);
      }
      return c.studentId === studentId;
    })
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  if (studentCharges.length === 0) {
    return { allowed: true };
  }

  const firstInstallment = studentCharges.find((c) => c.installmentNumber === 1);
  const overdueCharges = studentCharges.filter((c) => c.status === 'EM ATRASO');
  const unpaidCharges = studentCharges.filter((c) => c.status !== 'PAGO');

  // Check 1: 1ª Parcela (Matrícula) - Rule 1
  if (rules?.rule1_classroomRequiresFirstPayment && firstInstallment && firstInstallment.status !== 'PAGO') {
    return {
      allowed: false,
      reason: 'Entrada na Sala de Aula Bloqueada: A 1ª Parcela (Matrícula) está pendente de quitação na Tesouraria.',
      isFinancialBlock: true,
      overdueCount: overdueCharges.length,
      unpaidInstallments: unpaidCharges.map((c) => c.installmentNumber),
    };
  }

  // Check 2: Any Overdue Installment (Em Atraso) blocks classroom entry
  if (overdueCharges.length > 0) {
    const overdueInst = overdueCharges[0];
    return {
      allowed: false,
      reason: `Entrada na Sala de Aula Bloqueada: A ${overdueInst.installmentNumber}ª Parcela da etapa está em atraso (${overdueInst.amount} EGP). Dirija-se à Tesouraria para regularização imediata em dinheiro.`,
      isFinancialBlock: true,
      overdueCount: overdueCharges.length,
      unpaidInstallments: unpaidCharges.map((c) => c.installmentNumber),
    };
  }

  return { allowed: true };
};

/**
 * Format currency in Egyptian Pounds (EGP) with configurable options
 */
export const formatCurrency = (amount: number, currencyCode: string = 'EGP'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('EGP', `${currencyCode} `);
};
