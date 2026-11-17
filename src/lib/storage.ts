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
  PendingRegistration,
  PendingPayment,
} from '../types';

import { INITIAL_SETTINGS, INITIAL_USERS } from './mockData';

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
  pendingRegistrations: PendingRegistration[];
  pendingPayments: PendingPayment[];
}

export const deduplicateById = <T extends { id?: string | number }>(items: T[]): T[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string | number>();
  const result: T[] = [];
  for (const item of items) {
    if (!item) continue;
    const key = item.id !== undefined ? item.id : JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

// Master Admin account only (all other logins and mock teachers removed)
const cleanInitialUsers = INITIAL_USERS;

/**
 * Canonical empty state. Only the platform owner account and the system
 * settings are defaults; no demo/sample business data is loaded or restored.
 */
export const getDefaultState = (): AppState => ({
  currentUser: cleanInitialUsers[0], // Super Admin by default
  users: deduplicateById(cleanInitialUsers),
  students: [],
  courses: [],
  classes: [],
  enrollments: [],
  charges: [],
  receipts: [],
  cashRegisters: [],
  cashMovements: [],
  assessments: [],
  grades: [],
  lessons: [],
  assignments: [],
  submissions: [],
  attendance: [],
  accountingTransactions: [],
  auditLogs: [],
  notifications: [],
  pendingRegistrations: [],
  pendingPayments: [],
  settings: INITIAL_SETTINGS,
});

/**
 * Guarantees every user has a roles array and a valid active role.
 */
export const normalizeUsers = (users: User[]): User[] =>
  deduplicateById(users).map((u) => {
    // Pending employees intentionally have no roles until a Super Admin assigns them.
    const isPending = u.role === 'PENDING' && (!u.roles || u.roles.length === 0);
    const userRoles: UserRole[] = isPending
      ? []
      : Array.isArray(u.roles) && u.roles.length > 0
      ? [...u.roles]
      : u.role
      ? [u.role]
      : [];
    return {
      ...u,
      roles: userRoles,
      role: isPending ? 'PENDING' : u.role && userRoles.includes(u.role) ? u.role : userRoles[0] || 'PENDING',
    };
  });

/**
 * Builds the application state from data loaded from Firestore.
 * When a collection is missing (read failure) its default value is used.
 */
export const loadInitialState = (remote?: Partial<AppState> | null): AppState => {
  const defaults = getDefaultState();
  if (!remote) return defaults;

  const remoteUsers = deduplicateById(
    remote.users && remote.users.length > 0 ? remote.users : defaults.users
  );
  const normalizedUsers = normalizeUsers(remoteUsers);

  const rawCurrentUser: User =
    remote.currentUser || normalizedUsers[0] || defaults.currentUser;
  const matchedStoredUser = normalizedUsers.find((u) => u.id === rawCurrentUser.id);
  const normalizedCurrentUser: User = matchedStoredUser
    ? { ...matchedStoredUser, role: rawCurrentUser.role || matchedStoredUser.role }
    : {
        ...rawCurrentUser,
        roles:
          Array.isArray(rawCurrentUser.roles) && rawCurrentUser.roles.length > 0
            ? rawCurrentUser.roles
            : [rawCurrentUser.role],
      };

  const rawStudents = deduplicateById(remote.students ?? defaults.students);
  const normalizedStudents: Student[] = rawStudents.map((s) => ({
    ...s,
    status: ((s.status as string) === 'ENCERRADO' ? 'INATIVO' : s.status) || 'ATIVO',
    systemAccess: s.systemAccess || 'LIBERADO',
  }));

  return {
    currentUser: normalizedCurrentUser,
    users: normalizedUsers,
    students: normalizedStudents,
    courses: deduplicateById(remote.courses ?? defaults.courses),
    classes: deduplicateById(remote.classes ?? defaults.classes),
    enrollments: deduplicateById(remote.enrollments ?? defaults.enrollments),
    charges: deduplicateById(remote.charges ?? defaults.charges),
    receipts: deduplicateById(remote.receipts ?? defaults.receipts),
    cashRegisters: deduplicateById(remote.cashRegisters ?? defaults.cashRegisters),
    cashMovements: deduplicateById(remote.cashMovements ?? defaults.cashMovements),
    assessments: deduplicateById(remote.assessments ?? defaults.assessments),
    grades: deduplicateById(remote.grades ?? defaults.grades),
    lessons: deduplicateById(remote.lessons ?? defaults.lessons),
    assignments: deduplicateById(remote.assignments ?? defaults.assignments),
    submissions: deduplicateById(remote.submissions ?? defaults.submissions),
    attendance: deduplicateById(remote.attendance ?? defaults.attendance),
    accountingTransactions: deduplicateById(
      remote.accountingTransactions ?? defaults.accountingTransactions
    ),
    auditLogs: deduplicateById(remote.auditLogs ?? defaults.auditLogs),
    notifications: deduplicateById(remote.notifications ?? defaults.notifications),
    pendingRegistrations: deduplicateById(
      remote.pendingRegistrations ?? defaults.pendingRegistrations
    ),
    pendingPayments: deduplicateById(remote.pendingPayments ?? defaults.pendingPayments),
    settings: {
      ...defaults.settings,
      ...(remote.settings || {}),
      rulesConfig: {
        ...defaults.settings.rulesConfig,
        ...(remote.settings?.rulesConfig || {}),
      },
    },
  };
};

/**
 * Generates a random, unique Student ID in the permanent STU00000 pattern.
 * The 5-digit number is random (10000-99999) and checked against every
 * student already registered, so two enrollments never share an ID.
 */
export const generateRandomStudentId = (existingStudents: Student[]): string => {
  const usedNumbers = new Set<number>();

  (existingStudents || []).forEach((student) => {
    const match = String(student?.studentId || '').match(/^STU(\d{5})$/i);
    if (match) usedNumbers.add(parseInt(match[1], 10));
  });

  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const candidate = Math.floor(10000 + Math.random() * 90000);
    if (!usedNumbers.has(candidate)) return `STU${candidate}`;
  }

  // Extremely unlikely fallback: scan the whole range for a free number.
  for (let candidate = 10000; candidate <= 99999; candidate += 1) {
    if (!usedNumbers.has(candidate)) return `STU${candidate}`;
  }

  return `STU${Date.now().toString().slice(-5)}`;
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
 * Real-time Business Rules Engine: Extended Deadline Evaluation for Exams & Classroom Entry
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

  // General strict check: if the student has ANY overdue charge, all exams are blocked
  if (overdueCharges.length > 0) {
    const overdueInst = overdueCharges[0];
    return {
      allowed: false,
      reason: `Exam Blocked: Installment ${overdueInst.installmentNumber} (${overdueInst.amount} EGP) is overdue. Settle it at the Treasury to unlock the assessment.`,
      requiredStage: `Payment of overdue Installment ${overdueInst.installmentNumber} at the counter`,
      isFinancialBlock: true,
    };
  }

  // Rule 1: Stage 1 check
  if (assessment.requiredPaymentStage === 'STAGE_1_PAID') {
    if (rules?.rule1_classroomRequiresFirstPayment && firstInstallment && firstInstallment.status !== 'PAGO') {
      return {
        allowed: false,
        reason: 'Exam Blocked: Installment 1 (Enrollment) is pending payment at the Treasury.',
        requiredStage: 'Payment of Installment 1 in cash at the reception / finance desk',
        isFinancialBlock: true,
      };
    }
  }

  // Rule 2: Stage 2 check for Midterm / 1st Exam
  if (assessment.requiredPaymentStage === 'STAGE_2_PAID') {
    if (rules?.rule2_exam1RequiresSecondPayment && secondInstallment && secondInstallment.status !== 'PAGO') {
      return {
        allowed: false,
        reason: 'This assessment is blocked: Installment 2 for the corresponding stage has not been paid.',
        requiredStage: 'Payment of Installment 2 at the Treasury (Counter)',
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
        reason: `Final Exam Blocked: There are open installments (installment ${firstUnpaid.installmentNumber}). Full payment of the course is required.`,
        requiredStage: 'Full payment of all course tuition installments',
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
      reason: 'Student has no active enrollment or link to this class.',
      isFinancialBlock: false,
    };
  }

  if (enrollment && enrollment.status === 'BLOQUEADA') {
    return {
      allowed: false,
      reason: 'Enrollment blocked by the administration. Please go to the Secretariat.',
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

  // Check 1: Installment 1 (Enrollment) - Rule 1
  if (rules?.rule1_classroomRequiresFirstPayment && firstInstallment && firstInstallment.status !== 'PAGO') {
    return {
      allowed: false,
      reason: 'Classroom Entry Blocked: Installment 1 (Enrollment) is pending payment at the Treasury.',
      isFinancialBlock: true,
      overdueCount: overdueCharges.length,
      unpaidInstallments: unpaidCharges.map((c) => c.installmentNumber),
    };
  }

  // Check 2: Any Overdue Installment blocks classroom entry
  if (overdueCharges.length > 0) {
    const overdueInst = overdueCharges[0];
    return {
      allowed: false,
      reason: `Classroom Entry Blocked: Installment ${overdueInst.installmentNumber} for this stage is overdue (${overdueInst.amount} EGP). Please go to the Treasury to settle it in cash immediately.`,
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('EGP', `${currencyCode} `);
};
