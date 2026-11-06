import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Student,
  StudentDocument,
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
  EnglishAudienceLevel,
  CourseLevelPricing,
} from '../types';

export interface PlanNegotiationInput {
  totalAmount?: number;
  originalTotalAmount?: number;
  installmentAmount?: number;
  discountType?: 'NONE' | 'PERCENT' | 'FIXED';
  discountValue?: number;
  discountReason?: string;
  englishLevel?: EnglishAudienceLevel;
}

import {
  AppState,
  loadInitialState,
  generateNextStudentId,
  generateNextReceiptNumber,
  evaluateExamAccess,
  evaluateClassroomAccess,
  deduplicateById,
  normalizeUsers,
} from '../lib/storage';

import { fetchCollectionStrict } from '../lib/firebase';
import {
  currentFirebaseUser,
  describeAuthError,
  onAuthUserChanged,
  registerWithEmailPassword,
  requestPasswordReset,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutFromGoogle,
} from '../lib/auth';
import { getHydratedState, syncStateDiff } from '../lib/cloud';
import {
  clearStudentSession,
  normalizeStudentId,
  readStudentSession,
  saveStudentSession,
  validateStudentLogin,
} from '../lib/studentAuth';
import { resetStoredAccountingData } from '../components/modules/accounting/accountingData';
import { resetStoredTeacherData } from '../components/modules/teacher/teacherData';

export interface AuthLoginResult {
  success: boolean;
  pending?: boolean;
  user?: User;
  message?: string;
}

interface AppContextType {
  state: AppState;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  setIsAuthenticated: (val: boolean) => void;
  loginWithGoogle: (options?: { register?: boolean }) => Promise<AuthLoginResult>;
  loginWithEmail: (credentials: {
    email: string;
    password: string;
    name?: string;
    register?: boolean;
  }) => Promise<AuthLoginResult>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  loginAsStudent: (credentials: {
    studentId: string;
    birthDate: string;
  }) => { success: boolean; message?: string; user?: User };
  refreshCurrentUser: () => Promise<{ success: boolean; pending: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;

  // Domain Actions
  createStudentWithEnrollment: (
    studentData: Partial<Student>,
    courseId: string,
    classId: string,
    installmentsCount: number,
    negotiationData?: PlanNegotiationInput
  ) => { student: Student; enrollment: Enrollment };

  updateStudent: (studentId: string, data: Partial<Student>) => void;
  addEnrollmentToStudent: (
    studentId: string,
    courseId: string,
    classId: string,
    installmentsCount: number,
    negotiationData?: PlanNegotiationInput
  ) => Enrollment;
  renegotiateEnrollmentPlan: (
    enrollmentId: string,
    negotiationData: {
      newTotalAmount: number;
      installmentsCount: number;
      installmentAmount?: number;
      originalTotalAmount?: number;
      discountType?: 'NONE' | 'PERCENT' | 'FIXED';
      discountValue?: number;
      discountReason?: string;
      recalculateUnpaidCharges?: boolean;
    }
  ) => void;
  updateEnrollmentStatus: (enrollmentId: string, status: Enrollment['status']) => void;
  addStudentDocument: (studentId: string, doc: Omit<StudentDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => StudentDocument;
  deleteStudentDocument: (studentId: string, docId: string) => void;

  registerPayment: (
    chargeId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => PaymentReceipt;

  // Pending Payments (Recepção -> Aprovação da Tesouraria / Rony)
  createPendingPayment: (
    data: Omit<PendingPayment, 'id' | 'protocolNumber' | 'provisionalReceiptNumber' | 'status' | 'registeredAt' | 'registeredBy'>
  ) => PendingPayment;
  approvePendingPayment: (
    pendingPaymentId: string,
    reviewNotes?: string
  ) => { paymentReceipt: PaymentReceipt; pendingPayment: PendingPayment };
  rejectPendingPayment: (pendingPaymentId: string, reason: string) => void;
  deletePendingPayment: (pendingPaymentId: string) => void;

  createPendingRegistration: (
    data: Omit<PendingRegistration, 'id' | 'protocolNumber' | 'status' | 'createdAt' | 'createdByName' | 'createdByRole'>
  ) => PendingRegistration;
  approvePendingRegistration: (
    pendingId: string,
    adjustedData?: Partial<PendingRegistration>
  ) => { student: Student; enrollment: Enrollment };
  rejectPendingRegistration: (pendingId: string, reason: string) => void;
  updatePendingRegistration: (pendingId: string, data: Partial<PendingRegistration>) => void;
  deletePendingRegistration: (pendingId: string) => void;

  openCashRegister: (initialBalance: number, notes?: string) => CashRegister;
  closeCashRegister: (countedBalance: number, notes?: string) => CashRegister;
  addCashMovement: (type: 'ENTRADA' | 'SAIDA', category: string, amount: number, description: string) => void;

  saveAttendance: (classId: string, date: string, records: AttendanceRecord['students'], notes?: string) => void;
  saveGrade: (assessmentId: string, studentId: string, score: number, feedback?: string) => Grade;
  saveBatchGrades: (assessmentId: string, grades: { studentId: string; score: number; feedback?: string }[]) => void;
  createAssessment: (data: Omit<Assessment, 'id'>) => Assessment;
  updateAssessment: (assessmentId: string, data: Partial<Assessment>) => void;
  deleteAssessment: (assessmentId: string) => void;

  createClass: (data: Omit<ClassRoom, 'id'>) => ClassRoom;
  updateClass: (classId: string, data: Partial<ClassRoom>) => void;
  deleteClass: (classId: string) => void;
  toggleFinalGradeRelease: (classId: string, isReleased?: boolean) => void;
  assignTeacherToClass: (classId: string, teacherId: string, teacherName: string) => void;
  unassignTeacherFromClass: (classId: string) => void;
  updateCourse: (courseId: string, data: Partial<Course>) => void;
  updateCourseFee: (
    courseId: string,
    newMonthlyFee: number,
    updateUnpaidCharges?: boolean,
    extraPricing?: {
      totalCourseAmount?: number;
      defaultInstallmentsCount?: number;
      levels?: CourseLevelPricing[];
    }
  ) => void;
  createLesson: (data: Omit<Lesson, 'id'>) => Lesson;
  deleteLesson: (lessonId: string) => void;
  createAssignment: (data: Omit<Assignment, 'id'>) => Assignment;
  updateAssignment: (assignmentId: string, data: Partial<Assignment>) => void;
  deleteAssignment: (assignmentId: string) => void;
  submitAssignment: (assignmentId: string, studentId: string, submissionText: string, attachmentName?: string) => Submission;
  gradeSubmission: (submissionId: string, score: number, feedback?: string) => void;
  markSubmissionSeen: (submissionId: string, feedback?: string, score?: number) => void;
  markManualStudentSubmission: (assignmentId: string, studentId: string, feedback: string, score?: number, isSeen?: boolean) => Submission;

  createAccountingTransaction: (data: Omit<AccountingTransaction, 'id' | 'registeredBy' | 'status'>) => void;
  createUser: (data: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  importStudentsBatch: (rows: any[]) => number;
  resetToDefaultData: () => void;

  // Business Rules Checks
  checkExamAccess: (studentId: string, assessment: Assessment) => { allowed: boolean; reason?: string; requiredStage?: string; isFinancialBlock?: boolean };
  checkClassroomAccess: (studentId: string, classId: string) => {
    allowed: boolean;
    reason?: string;
    isFinancialBlock?: boolean;
    overdueCount?: number;
    unpaidInstallments?: number[];
  };
}

/** Google accounts that are always recognized as the platform owner. */
const OWNER_EMAILS = ['rickyjorgecastro@gmail.com'];

const isPendingUser = (user?: User | null): boolean =>
  !user || user.role === 'PENDING' || !user.roles || user.roles.length === 0;

const isSuperAdminUser = (user: User): boolean =>
  user.role === 'SUPER_ADMIN' || (user.roles || []).includes('SUPER_ADMIN');

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State is hydrated from Firestore before the React tree mounts (see lib/bootstrap.ts).
  const [state, setState] = useState<AppState>(() => loadInitialState(getHydratedState()));

  const previousStateRef = useRef<AppState>(state);
  const didMountRef = useRef(false);

  // Persist every state difference to Firestore (single source of truth).
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      previousStateRef.current = state;
      return;
    }

    const previous = previousStateRef.current;
    previousStateRef.current = state;
    syncStateDiff(previous, state).catch((err) => {
      console.warn('[AppContext] Falha ao persistir alterações no Firestore.', err);
    });
  }, [state]);

  const currentUser = state.currentUser;

  // Authentication state is driven by Firebase (employees) or ID + birth date (students).
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);
  /** Student ID of the active non-Firebase session, when there is one. */
  const studentSessionRef = useRef<string | null>(null);

  // Always gives async callbacks access to the latest hydrated state.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setCurrentUser = (user: User) => {
    setState((prev) => ({ ...prev, currentUser: user }));
  };

  const buildSessionUser = (user: User): User => {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const effectiveRole =
      user.role && roles.includes(user.role) ? user.role : roles[0] || 'PENDING';
    return { ...user, roles, role: effectiveRole };
  };

  const startSession = (user: User) => {
    const sessionUser = buildSessionUser(user);
    setState((prev) => ({
      ...prev,
      currentUser: sessionUser,
      users: prev.users.map((u) => (u.id === sessionUser.id ? sessionUser : u)),
    }));
    setIsAuthenticated(true);
  };

  /**
   * Builds the session user for a student. Student records created by the
   * Secretariat have a matching User entry; older imports may not, so a
   * session user is assembled in memory to keep the StudentPortal contract.
   */
  const buildStudentSessionUser = (student: Student): User => {
    const studentId = normalizeStudentId(student.studentId);
    const existing = stateRef.current.users.find(
      (u) => normalizeStudentId(u.studentId) === studentId
    );

    const base: User =
      existing ||
      ({
        id: `user_${student.id}`,
        name: student.name,
        email: student.email || `${studentId.toLowerCase()}@student.thinkgreen.org`,
        department: 'Aluno Think Green',
        status: 'ACTIVE',
        permissions: ['access_lms_student', 'submit_assignment', 'view_own_financials'],
        createdAt: student.createdAt,
        avatarUrl: student.avatarUrl,
      } as User);

    const roles = Array.from(
      new Set<UserRole>([...(base.roles || []), 'STUDENT'])
    );

    return {
      ...base,
      studentId,
      role: 'STUDENT',
      roles,
      status: 'ACTIVE',
    };
  };

  /**
   * Student login: permanent Student ID + registered date of birth.
   * This does not touch Firebase Authentication, so it works with the
   * student records already stored in Firestore.
   */
  const loginAsStudent = (credentials: {
    studentId: string;
    birthDate: string;
  }): { success: boolean; message?: string; user?: User } => {
    const result = validateStudentLogin(
      stateRef.current.students,
      credentials.studentId,
      credentials.birthDate
    );

    if (!result.student) {
      return { success: false, message: result.error };
    }

    const sessionUser = buildStudentSessionUser(result.student);
    studentSessionRef.current = normalizeStudentId(result.student.studentId);
    saveStudentSession(result.student.studentId);

    // A student session replaces any employee Firebase session on this device.
    void signOutFromGoogle().catch((error) => {
      console.warn('[auth] Falha ao encerrar a sessão do Firebase.', error);
    });

    startSession(sessionUser);

    return {
      success: true,
      user: sessionUser,
      message: `Bem-vindo(a), ${result.student.name}!`,
    };
  };

  /**
   * Finds (or creates) the employee record linked to a Firebase Authentication
   * account (Google or e-mail/password). Unknown accounts only become "PENDING"
   * when they arrive through the registration link; otherwise they must already
   * exist in Firestore.
   */
  const resolveFirebaseUser = (
    firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null },
    options?: { register?: boolean; displayName?: string }
  ): { user?: User; message?: string } => {
    const email = (firebaseUser.email || '').trim().toLowerCase();
    if (!email) {
      return { message: 'A conta autenticada não retornou um e-mail válido.' };
    }

    const isOwner = OWNER_EMAILS.includes(email);
    const users = stateRef.current.users;
    let existing = users.find((u) => u.email.toLowerCase() === email);

    // Legacy owner records used a different e-mail; bind them to the owner Google account.
    if (!existing && isOwner) {
      existing = users.find(isSuperAdminUser);
    }

    if (!existing) {
      if (!options?.register && !isOwner) {
        return {
          message:
            'Este e-mail ainda não está cadastrado. Solicite o link de registro geral à administração.',
        };
      }

      const newUser: User = {
        id: firebaseUser.uid,
        googleUid: firebaseUser.uid,
        name: options?.displayName?.trim() || firebaseUser.displayName || email.split('@')[0],
        email,
        role: isOwner ? 'SUPER_ADMIN' : 'PENDING',
        roles: isOwner ? ['SUPER_ADMIN'] : [],
        status: 'ACTIVE',
        permissions: isOwner ? ['*'] : [],
        createdAt: new Date().toISOString().split('T')[0],
        avatarUrl: firebaseUser.photoURL || undefined,
        department: isOwner ? 'Diretoria Executiva & Gestão Geral' : 'Aguardando definição',
      };

      setState((prev) => ({
        ...prev,
        users: deduplicateById([...prev.users, newUser]),
      }));
      stateRef.current = {
        ...stateRef.current,
        users: deduplicateById([...stateRef.current.users, newUser]),
      };
      return { user: newUser };
    }

    const updates: Partial<User> = { googleUid: firebaseUser.uid };
    let changed = !existing.googleUid;

    if (!existing.avatarUrl && firebaseUser.photoURL) {
      updates.avatarUrl = firebaseUser.photoURL;
      changed = true;
    }

    if (isOwner) {
      if (existing.email !== email) {
        updates.email = email;
        changed = true;
      }
      if (!isSuperAdminUser(existing) || existing.role !== 'SUPER_ADMIN') {
        updates.roles = Array.from(
          new Set([...(existing.roles || []), 'SUPER_ADMIN'])
        ) as UserRole[];
        updates.role = 'SUPER_ADMIN';
        updates.permissions = ['*'];
        changed = true;
      }
    }

    if (!changed) return { user: existing };

    const updatedUser: User = { ...existing, ...updates };
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      currentUser:
        prev.currentUser.id === updatedUser.id ? updatedUser : prev.currentUser,
    }));
    stateRef.current = {
      ...stateRef.current,
      users: stateRef.current.users.map((u) =>
        u.id === updatedUser.id ? updatedUser : u
      ),
    };
    return { user: updatedUser };
  };

  /** Shared post-authentication step for Google and e-mail/password accounts. */
  const finishFirebaseLogin = async (
    firebaseUser: {
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
    },
    options?: { register?: boolean; displayName?: string }
  ): Promise<AuthLoginResult> => {
    const resolved = resolveFirebaseUser(firebaseUser, options);

    if (!resolved.user) {
      await signOutFromGoogle().catch(() => undefined);
      return { success: false, message: resolved.message };
    }

    if (resolved.user.status === 'INACTIVE') {
      await signOutFromGoogle().catch(() => undefined);
      return {
        success: false,
        message:
          'Sua conta está inativa. Procure a administração para reativar o acesso.',
      };
    }

    // An employee signing in replaces any student session stored on this device.
    studentSessionRef.current = null;
    clearStudentSession();

    startSession(resolved.user);
    const pending = isPendingUser(resolved.user);

    return {
      success: true,
      pending,
      user: buildSessionUser(resolved.user),
      message: pending
        ? 'Cadastro recebido. Aguarde a definição da sua função pela administração.'
        : `Bem-vindo(a), ${resolved.user.name}!`,
    };
  };

  const loginWithGoogle = async (
    options?: { register?: boolean }
  ): Promise<AuthLoginResult> => {
    try {
      const firebaseUser = await signInWithGoogle();
      return await finishFirebaseLogin(firebaseUser, options);
    } catch (error) {
      return { success: false, message: describeAuthError(error) };
    }
  };

  const loginWithEmail = async (credentials: {
    email: string;
    password: string;
    name?: string;
    register?: boolean;
  }): Promise<AuthLoginResult> => {
    try {
      const firebaseUser = credentials.register
        ? await registerWithEmailPassword(
            credentials.name || '',
            credentials.email,
            credentials.password
          )
        : await signInWithEmailPassword(credentials.email, credentials.password);

      return await finishFirebaseLogin(firebaseUser, {
        register: credentials.register,
        displayName: credentials.name,
      });
    } catch (error) {
      return { success: false, message: describeAuthError(error) };
    }
  };

  const sendPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!email.trim()) {
      return { success: false, message: 'Informe seu e-mail para recuperar a senha.' };
    }

    try {
      await requestPasswordReset(email);
      return {
        success: true,
        message: 'Enviamos um link de redefinição para o seu e-mail. Confira a caixa de entrada.',
      };
    } catch (error) {
      return { success: false, message: describeAuthError(error) };
    }
  };

  /** Re-reads the users collection so a pending employee can see a newly assigned role. */
  const refreshCurrentUser = async (): Promise<{
    success: boolean;
    pending: boolean;
    message?: string;
  }> => {
    const firebaseUser = currentFirebaseUser();
    if (!firebaseUser) {
      return {
        success: false,
        pending: true,
        message: 'Sessão expirada. Entre novamente.',
      };
    }

    try {
      const remoteUsers = await fetchCollectionStrict<User>('users');
      const users = normalizeUsers(remoteUsers);
      stateRef.current = { ...stateRef.current, users };
      setState((prev) => ({ ...prev, users }));

      const email = (firebaseUser.email || '').trim().toLowerCase();
      let found = users.find(
        (u) => u.email.toLowerCase() === email || u.googleUid === firebaseUser.uid
      );
      if (!found && OWNER_EMAILS.includes(email)) {
        found = users.find(isSuperAdminUser);
      }

      if (!found) {
        return {
          success: false,
          pending: true,
          message: 'Seu cadastro ainda não foi localizado no banco de dados.',
        };
      }

      if (found.status === 'INACTIVE') {
        return {
          success: false,
          pending: false,
          message: 'Sua conta está inativa. Procure a administração.',
        };
      }

      startSession(found);
      return { success: true, pending: isPendingUser(found) };
    } catch (error) {
      console.warn('[auth] Falha ao atualizar o usuário atual.', error);
      return {
        success: false,
        pending: true,
        message: 'Não foi possível consultar o banco de dados agora. Tente novamente.',
      };
    }
  };

  const logout = () => {
    studentSessionRef.current = null;
    clearStudentSession();
    setIsAuthenticated(false);
    void signOutFromGoogle().catch((error) => {
      console.warn('[auth] Falha ao encerrar a sessão do Firebase.', error);
    });
  };

  /**
   * Switches between the roles the employee actually owns (multi-role access).
   * Stable identity and functional update so URL listeners never act on stale
   * user data or force extra effect cycles.
   */
  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => {
      const user = prev.currentUser;
      const assignedRoles = user.roles || [];
      if (!assignedRoles.includes(role) || user.role === role) return prev;

      const updatedUser: User = { ...user, role };
      return {
        ...prev,
        currentUser: updatedUser,
        users: prev.users.map((u) => (u.id === user.id ? updatedUser : u)),
      };
    });
  }, []);

  // Restores a session after a reload: Firebase keeps employee credentials and
  // students keep their ID in sessionStorage for the current browser tab.
  useEffect(() => {
    const storedStudentSession = readStudentSession();

    if (storedStudentSession) {
      const student = stateRef.current.students.find(
        (item) =>
          normalizeStudentId(item.studentId) === storedStudentSession.studentId
      );

      if (
        student &&
        student.status === 'ATIVO' &&
        student.systemAccess !== 'BLOQUEADO'
      ) {
        studentSessionRef.current = storedStudentSession.studentId;
        startSession(buildStudentSessionUser(student));
      } else {
        clearStudentSession();
      }
    }

    const unsubscribe = onAuthUserChanged((firebaseUser) => {
      if (!firebaseUser) {
        // Do not clear a valid student session just because Firebase has no user.
        if (!studentSessionRef.current) {
          setIsAuthenticated(false);
        }
        setIsAuthResolved(true);
        return;
      }

      // A Firebase employee session on this device takes precedence.
      if (studentSessionRef.current) {
        studentSessionRef.current = null;
        clearStudentSession();
      }

      const resolved = resolveFirebaseUser(firebaseUser);
      if (resolved.user && resolved.user.status !== 'INACTIVE') {
        startSession(resolved.user);
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthResolved(true);
    });

    return () => unsubscribe();
    // resolveFirebaseUser/startSession only use refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Helper to append AuditLog
   */
  const logAudit = (
    module: AuditLog['module'],
    action: string,
    entityType: string,
    entityId: string,
    previousValue: string | undefined,
    newValue: string | undefined,
    details?: string
  ) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      module,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      details,
    };

    setState((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  /**
   * Helper to dispatch in-app notification
   */
  const addNotification = (
    title: string,
    message: string,
    type: SystemNotification['type'],
    targetRole: SystemNotification['targetRole'] = 'ALL',
    userId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      targetRole,
      title,
      message,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
    };
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  /**
   * 1. CREATE STUDENT WITH FULL INTEGRATED FLOW (Secretariat -> ID -> User -> Enrollment -> Charges)
   */
  const createStudentWithEnrollment = (
    studentData: Partial<Student>,
    courseId: string,
    classId: string,
    installmentsCount: number = 4,
    negotiationData?: PlanNegotiationInput
  ) => {
    const generatedStuId = generateNextStudentId(state.students);
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const internalId = `stu_${Date.now()}_${uniqueRand}`;
    const course = state.courses.find((c) => c.id === courseId);
    const classRoom = state.classes.find((cl) => cl.id === classId);

    const nowStr = new Date().toISOString().split('T')[0];

    const initialDocs: StudentDocument[] = studentData.documents ? [...studentData.documents] : [];
    if (studentData.documentPhotoUrl) {
      initialDocs.push({
        id: `doc_rg_${Date.now()}`,
        title: 'Foto do Documento de Identidade (RG/ID)',
        type: 'ID_CARD',
        url: studentData.documentPhotoUrl,
        uploadedAt: nowStr,
        uploadedBy: currentUser.name,
        size: '1.2 MB',
      });
    }

    const newStudent: Student = {
      id: internalId,
      studentId: generatedStuId,
      name: studentData.name || 'Novo Aluno',
      email: studentData.email || `${generatedStuId.toLowerCase()}@student.thinkgreen.org`,
      phone: studentData.phone || '',
      rg: studentData.rg || studentData.nationalId || '',
      nationalId: studentData.nationalId || studentData.rg || '',
      birthDate: studentData.birthDate || '',
      gender: studentData.gender || 'MASCULINO',
      guardianName: studentData.guardianName || '',
      guardianPhone: studentData.guardianPhone || '',
      address: studentData.address || '',
      city: studentData.city || 'Cairo',
      status: 'ATIVO',
      notes: studentData.notes || '',
      createdAt: nowStr,
      avatarUrl: studentData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      documentPhotoUrl: studentData.documentPhotoUrl,
      documents: initialDocs,
    };

    // Create User account for student
    const newStudentUser: User = {
      id: `user_${internalId}`,
      name: newStudent.name,
      email: newStudent.email,
      studentId: generatedStuId,
      role: 'STUDENT',
      department: 'Aluno Think Green',
      status: 'ACTIVE',
      permissions: ['access_lms_student', 'submit_assignment', 'view_own_financials'],
      createdAt: nowStr,
      avatarUrl: newStudent.avatarUrl,
    };

    // Calculate Total and Installment with Negotiation/Discount
    let originalTotalAmount = course
      ? (course.totalCourseAmount || course.monthlyFee * installmentsCount)
      : 500 * installmentsCount;
    let finalTotal = originalTotalAmount;

    if (negotiationData?.originalTotalAmount) {
      originalTotalAmount = negotiationData.originalTotalAmount;
      finalTotal = negotiationData.totalAmount ?? originalTotalAmount;
    } else if (negotiationData?.totalAmount !== undefined && negotiationData.totalAmount > 0) {
      finalTotal = negotiationData.totalAmount;
    }

    const installmentAmount = Math.max(1, Math.round(finalTotal / installmentsCount));

    const newEnrollment: Enrollment = {
      id: `enr_${Date.now()}_${uniqueRand}`,
      studentId: generatedStuId,
      studentInternalId: internalId,
      studentName: newStudent.name,
      courseId: courseId,
      courseName: course ? course.name : 'Curso Livre',
      classId: classId,
      className: classRoom ? classRoom.name : 'Turma Principal',
      enrollmentDate: nowStr,
      status: 'ATIVA',
      paymentPlan: {
        installmentsCount,
        totalAmount: finalTotal,
        installmentAmount,
        originalTotalAmount,
        englishLevel: negotiationData?.englishLevel,
        discountType: negotiationData?.discountType,
        discountValue: negotiationData?.discountValue,
        discountReason: negotiationData?.discountReason,
        isNegotiated: !!(negotiationData?.discountValue && negotiationData.discountValue > 0),
      },
    };

    // Auto-generate Charges for all installments with discount note
    const newCharges: Charge[] = [];
    const discountNote = negotiationData?.discountReason
      ? ` [Negociação: ${negotiationData.discountReason}]`
      : '';

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(5); // Due on 5th of each month

      newCharges.push({
        id: `chg_${newEnrollment.id}_${i}`,
        enrollmentId: newEnrollment.id,
        studentId: generatedStuId,
        studentName: newStudent.name,
        courseName: newEnrollment.courseName,
        installmentNumber: i,
        totalInstallments: installmentsCount,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: i === 1 ? 'PENDENTE' : 'REGULAR',
        notes: `Parcela ${i}/${installmentsCount} gerada na matrícula inicial.${discountNote}`,
      });
    }

    setState((prev) => ({
      ...prev,
      students: deduplicateById([newStudent, ...prev.students]),
      users: deduplicateById([newStudentUser, ...prev.users]),
      enrollments: deduplicateById([newEnrollment, ...prev.enrollments]),
      charges: deduplicateById([...newCharges, ...prev.charges]),
    }));

    logAudit(
      'SECRETARIAT',
      'NOVO_ALUNO_MATRICULA',
      'Student',
      generatedStuId,
      undefined,
      `${newStudent.name} (${generatedStuId}) matriculado em ${newEnrollment.courseName}`,
      `ID ${generatedStuId} gerado. Usuário criado e ${installmentsCount} parcelas financeiras registradas automaticamente.`
    );

    addNotification(
      'Novo Aluno Cadastrado!',
      `${newStudent.name} (${generatedStuId}) foi matriculado com sucesso na turma ${newEnrollment.className}.`,
      'SUCCESS',
      'ALL'
    );

    return { student: newStudent, enrollment: newEnrollment };
  };

  /**
   * 1.1 CREATE PENDING REGISTRATION (Recepção / Pré-cadastro sem gerar ID)
   */
  const createPendingRegistration = (
    data: Omit<PendingRegistration, 'id' | 'protocolNumber' | 'status' | 'createdAt' | 'createdByName' | 'createdByRole'>
  ): PendingRegistration => {
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const existingCount = (state.pendingRegistrations || []).length + 1;
    const protocolNumber = `PRE-2026-${String(existingCount).padStart(4, '0')}`;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newPending: PendingRegistration = {
      ...data,
      id: `pre_${Date.now()}_${uniqueRand}`,
      protocolNumber,
      status: 'PENDENTE',
      createdByRole: currentUser.role === 'RECEPTION' ? 'RECEPTION' : 'SECRETARIAT',
      createdByName: `${currentUser.name} (${currentUser.role === 'RECEPTION' ? 'Recepção' : 'Secretaria'})`,
      createdAt: nowTimestamp,
    };

    setState((prev) => ({
      ...prev,
      pendingRegistrations: deduplicateById([newPending, ...(prev.pendingRegistrations || [])]),
    }));

    // Audit Log
    logAudit(
      'SECRETARIAT',
      'PRE_CADASTRO_RECEPÇÃO',
      'PendingRegistration',
      protocolNumber,
      undefined,
      `Pré-cadastro ${protocolNumber} registrado por ${currentUser.name} para ${data.name} (${data.courseName})`,
      data.discountReason ? `Desconto relatado: ${data.discountValue}${data.discountType === 'PERCENT' ? '%' : ' EGP'}. Motivo: ${data.discountReason}` : 'Sem desconto.'
    );

    // Notify Secretariat
    addNotification(
      'Novo Cadastro Pendente da Recepção!',
      `${data.name} (${data.courseName}) foi registrado pela recepção (Protocolo ${protocolNumber}) e aguarda homologação da secretaria.`,
      'INFO',
      'SECRETARIAT'
    );

    return newPending;
  };

  /**
   * 1.2 APPROVE PENDING REGISTRATION (Secretaria aprova e gera STU ID oficial)
   */
  const approvePendingRegistration = (
    pendingId: string,
    adjustedData?: Partial<PendingRegistration>
  ): { student: Student; enrollment: Enrollment } => {
    const pending = (state.pendingRegistrations || []).find((p) => p.id === pendingId);
    if (!pending) throw new Error('Cadastro pendente não encontrado');

    const merged = { ...pending, ...(adjustedData || {}) };
    const course = state.courses.find((c) => c.id === merged.courseId);
    const classRoom = state.classes.find((cl) => cl.id === merged.classId);

    const generatedStuId = generateNextStudentId(state.students);
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const internalId = `stu_${Date.now()}_${uniqueRand}`;
    const nowStr = new Date().toISOString().split('T')[0];
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const initialDocs: StudentDocument[] = [];
    if (merged.documentPhotoUrl) {
      initialDocs.push({
        id: `doc_rg_${Date.now()}`,
        title: 'Foto do Documento de Identidade (RG/ID)',
        type: 'ID_CARD',
        url: merged.documentPhotoUrl,
        uploadedAt: nowStr,
        uploadedBy: `${currentUser.name} (Secretaria)`,
        size: '1.2 MB',
      });
    }

    const newStudent: Student = {
      id: internalId,
      studentId: generatedStuId,
      name: merged.name,
      email: merged.email || `${generatedStuId.toLowerCase()}@student.thinkgreen.org`,
      phone: merged.phone || '',
      rg: merged.rg || '',
      nationalId: merged.rg || '',
      birthDate: merged.birthDate || '',
      gender: merged.gender || 'MASCULINO',
      guardianName: merged.guardianName || '',
      guardianPhone: merged.guardianPhone || '',
      address: merged.address || '',
      city: merged.city || 'Cairo',
      status: 'ATIVO',
      notes: merged.notes ? `${merged.notes} | Aprovado pela Secretaria: ${currentUser.name}` : `Aprovado pela Secretaria: ${currentUser.name}`,
      createdAt: nowStr,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      documentPhotoUrl: merged.documentPhotoUrl,
      documents: initialDocs,
    };

    const newStudentUser: User = {
      id: `user_${internalId}`,
      name: newStudent.name,
      email: newStudent.email,
      studentId: generatedStuId,
      role: 'STUDENT',
      department: 'Aluno Think Green',
      status: 'ACTIVE',
      permissions: ['access_lms_student', 'submit_assignment', 'view_own_financials'],
      createdAt: nowStr,
      avatarUrl: newStudent.avatarUrl,
    };

    // Calculate total with discount
    const baseMonthlyFee = course ? course.monthlyFee : 500;
    const baseTotal = baseMonthlyFee * merged.installmentsCount;
    let discountAmount = 0;
    if (merged.discountType === 'PERCENT' && merged.discountValue) {
      discountAmount = Math.round((baseTotal * merged.discountValue) / 100);
    } else if (merged.discountType === 'FIXED' && merged.discountValue) {
      discountAmount = merged.discountValue;
    }
    const finalTotal = Math.max(0, baseTotal - discountAmount);
    const installmentAmount = Math.max(1, Math.round(finalTotal / merged.installmentsCount));

    const newEnrollment: Enrollment = {
      id: `enr_${Date.now()}_${uniqueRand}`,
      studentId: generatedStuId,
      studentInternalId: internalId,
      studentName: newStudent.name,
      courseId: merged.courseId,
      courseName: course ? course.name : merged.courseName,
      classId: merged.classId,
      className: classRoom ? classRoom.name : merged.className,
      enrollmentDate: nowStr,
      status: 'ATIVA',
      paymentPlan: {
        installmentsCount: merged.installmentsCount,
        totalAmount: finalTotal,
        installmentAmount,
        originalTotalAmount: baseTotal,
        englishLevel: merged.englishLevel,
        discountType: merged.discountType,
        discountValue: merged.discountValue,
        discountReason: merged.discountReason,
        isNegotiated: discountAmount > 0,
      },
    };

    // Auto-generate Charges with discount notes
    const newCharges: Charge[] = [];
    for (let i = 1; i <= merged.installmentsCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(5);

      const discountNote = merged.discountReason
        ? ` [Desconto: ${discountAmount > 0 ? `${discountAmount} EGP abatidos` : ''} - Motivo: ${merged.discountReason}]`
        : '';

      newCharges.push({
        id: `chg_${newEnrollment.id}_${i}`,
        enrollmentId: newEnrollment.id,
        studentId: generatedStuId,
        studentName: newStudent.name,
        courseName: newEnrollment.courseName,
        installmentNumber: i,
        totalInstallments: merged.installmentsCount,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: i === 1 ? 'PENDENTE' : 'REGULAR',
        notes: `Parcela ${i}/${merged.installmentsCount} gerada a partir do pré-cadastro ${merged.protocolNumber}.${discountNote}`,
      });
    }

    const updatedPendingList = (state.pendingRegistrations || []).map((p) =>
      p.id === pendingId
        ? {
            ...p,
            ...adjustedData,
            status: 'APROVADO' as const,
            reviewedBy: `${currentUser.name} (${currentUser.role})`,
            reviewedAt: nowTimestamp,
            generatedStudentId: generatedStuId,
          }
        : p
    );

    setState((prev) => ({
      ...prev,
      students: deduplicateById([newStudent, ...prev.students]),
      users: deduplicateById([newStudentUser, ...prev.users]),
      enrollments: deduplicateById([newEnrollment, ...prev.enrollments]),
      charges: deduplicateById([...newCharges, ...prev.charges]),
      pendingRegistrations: deduplicateById(updatedPendingList),
    }));

    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#075e38', '#10B981', '#F59E0B'],
      });
    } catch {}

    logAudit(
      'SECRETARIAT',
      'APROVAÇÃO_MATRICULA_PENDENTE',
      'Student',
      generatedStuId,
      `Protocolo: ${merged.protocolNumber}`,
      `STU ID ${generatedStuId} gerado oficialmente para ${newStudent.name}`,
      `Cadastro aprovado pela secretaria (${currentUser.name}). Plano de ${merged.installmentsCount}x de ${installmentAmount} EGP ativado.`
    );

    addNotification(
      'Pré-Matrícula Aprovada!',
      `${newStudent.name} foi homologado com sucesso. ID gerado: ${generatedStuId}.`,
      'SUCCESS',
      'ALL'
    );

    return { student: newStudent, enrollment: newEnrollment };
  };

  /**
   * 1.3 REJECT PENDING REGISTRATION
   */
  const rejectPendingRegistration = (pendingId: string, reason: string) => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const pending = (state.pendingRegistrations || []).find((p) => p.id === pendingId);

    setState((prev) => ({
      ...prev,
      pendingRegistrations: (prev.pendingRegistrations || []).map((p) =>
        p.id === pendingId
          ? {
              ...p,
              status: 'REPROVADO' as const,
              reviewedBy: `${currentUser.name} (${currentUser.role})`,
              reviewedAt: nowTimestamp,
              reviewNotes: reason,
            }
          : p
      ),
    }));

    logAudit(
      'SECRETARIAT',
      'REPROVAÇÃO_MATRICULA_PENDENTE',
      'PendingRegistration',
      pending?.protocolNumber || pendingId,
      'PENDENTE',
      'REPROVADO',
      `Pré-cadastro de ${pending?.name} reprovado por ${currentUser.name}. Motivo: ${reason}`
    );

    addNotification(
      'Pré-Cadastro Reprovado',
      `O pré-cadastro de ${pending?.name} (${pending?.protocolNumber}) foi reprovado pela secretaria: ${reason}`,
      'WARNING',
      'SECRETARIAT'
    );
  };

  /**
   * 1.4 UPDATE PENDING REGISTRATION
   */
  const updatePendingRegistration = (pendingId: string, data: Partial<PendingRegistration>) => {
    setState((prev) => ({
      ...prev,
      pendingRegistrations: (prev.pendingRegistrations || []).map((p) =>
        p.id === pendingId ? { ...p, ...data } : p
      ),
    }));
  };

  /**
   * 1.5 DELETE PENDING REGISTRATION
   */
  const deletePendingRegistration = (pendingId: string) => {
    setState((prev) => ({
      ...prev,
      pendingRegistrations: (prev.pendingRegistrations || []).filter((p) => p.id !== pendingId),
    }));
  };

  /**
   * 1.6 CREATE PENDING PAYMENT (Recepção / Pré-registro de pagamento)
   */
  const createPendingPayment = (
    data: Omit<PendingPayment, 'id' | 'protocolNumber' | 'provisionalReceiptNumber' | 'status' | 'registeredAt' | 'registeredBy'>
  ): PendingPayment => {
    const existingCount = (state.pendingPayments || []).length + 1;
    const protocolNumber = `PAG-2026-${String(existingCount).padStart(4, '0')}`;
    const provisionalReceiptNumber = `REC-PROV-2026-${String(existingCount).padStart(4, '0')}`;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const uniqueRand = Math.random().toString(36).substring(2, 8);

    const newPending: PendingPayment = {
      ...data,
      id: `pre_pay_${Date.now()}_${uniqueRand}`,
      protocolNumber,
      provisionalReceiptNumber,
      status: 'PENDENTE',
      registeredBy: `${currentUser.name} (${currentUser.role === 'RECEPTION' ? 'Recepção' : currentUser.role})`,
      registeredAt: nowTimestamp,
    };

    setState((prev) => ({
      ...prev,
      pendingPayments: deduplicateById([newPending, ...(prev.pendingPayments || [])]),
    }));

    logAudit(
      'FINANCE',
      'PRE_REGISTRO_PAGAMENTO_RECEPÇÃO',
      'PendingPayment',
      protocolNumber,
      undefined,
      `Pré-registro de pagamento ${protocolNumber} recebido no balcão da Recepção por ${currentUser.name}: ${data.amount} EGP (${data.studentName} - ${data.courseName})`,
      `Forma: ${data.paymentMethod}. Aguarda validação física e conciliação do caixa pelo Rony / Tesouraria.`
    );

    addNotification(
      'Novo Pagamento Pendente da Recepção!',
      `${data.studentName} realizou pré-registro de pagamento de ${data.amount} EGP no balcão (${protocolNumber}). Aguarda conferência do dinheiro físico pela Tesouraria.`,
      'INFO',
      'FINANCE'
    );

    return newPending;
  };

  /**
   * 1.7 APPROVE PENDING PAYMENT (Tesouraria / Rony confere dinheiro físico e homologa)
   */
  const approvePendingPayment = (
    pendingPaymentId: string,
    reviewNotes?: string
  ): { paymentReceipt: PaymentReceipt; pendingPayment: PendingPayment } => {
    const pending = (state.pendingPayments || []).find((p) => p.id === pendingPaymentId);
    if (!pending) throw new Error('Pré-registro de pagamento não encontrado');

    const officialReceipt = registerPayment(
      pending.chargeId,
      pending.amount,
      pending.paymentMethod,
      reviewNotes || `Pagamento aprovado e dinheiro físico conferido na Tesouraria (Rony). Ref. Pré-Registro ${pending.protocolNumber}. ${pending.receptionNotes || ''}`.trim()
    );

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedPending: PendingPayment = {
      ...pending,
      status: 'APROVADO',
      reviewedBy: `${currentUser.name} (Tesouraria)`,
      reviewedAt: nowTimestamp,
      reviewNotes: reviewNotes || 'Conferido com o dinheiro físico recebido no caixa.',
      officialReceiptNumber: officialReceipt.receiptNumber,
      officialReceiptId: officialReceipt.id,
    };

    setState((prev) => ({
      ...prev,
      pendingPayments: (prev.pendingPayments || []).map((p) =>
        p.id === pendingPaymentId ? updatedPending : p
      ),
    }));

    logAudit(
      'FINANCE',
      'APROVACAO_PAGAMENTO_RECEPCAO',
      'PendingPayment',
      pending.protocolNumber,
      'PENDENTE',
      `APROVADO -> Recibo Oficial ${officialReceipt.receiptNumber}`,
      `Pagamento de ${pending.amount} EGP homologado pela tesouraria (${currentUser.name}). Dinheiro físico conciliado.`
    );

    addNotification(
      'Pagamento Homologado pela Tesouraria!',
      `O pré-registro ${pending.protocolNumber} de ${pending.studentName} (${pending.amount} EGP) foi aprovado e o recibo oficial ${officialReceipt.receiptNumber} foi emitido.`,
      'SUCCESS',
      'ALL'
    );

    return { paymentReceipt: officialReceipt, pendingPayment: updatedPending };
  };

  /**
   * 1.8 REJECT PENDING PAYMENT (Tesouraria rejeita com motivo)
   */
  const rejectPendingPayment = (pendingPaymentId: string, reason: string) => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const pending = (state.pendingPayments || []).find((p) => p.id === pendingPaymentId);

    setState((prev) => ({
      ...prev,
      pendingPayments: (prev.pendingPayments || []).map((p) =>
        p.id === pendingPaymentId
          ? {
              ...p,
              status: 'REPROVADO',
              reviewedBy: `${currentUser.name} (Tesouraria)`,
              reviewedAt: nowTimestamp,
              reviewNotes: reason,
            }
          : p
      ),
    }));

    logAudit(
      'FINANCE',
      'REPROVACAO_PAGAMENTO_RECEPCAO',
      'PendingPayment',
      pending?.protocolNumber || pendingPaymentId,
      'PENDENTE',
      'REPROVADO',
      `Pré-registro de pagamento ${pending?.protocolNumber} de ${pending?.studentName} reprovado pela tesouraria. Motivo: ${reason}`
    );

    addNotification(
      'Pré-Registro de Pagamento Reprovado',
      `O pagamento de ${pending?.studentName} (${pending?.protocolNumber}) foi recusado pela tesouraria: ${reason}`,
      'WARNING',
      'RECEPTION'
    );
  };

  /**
   * 1.9 DELETE PENDING PAYMENT
   */
  const deletePendingPayment = (pendingPaymentId: string) => {
    setState((prev) => ({
      ...prev,
      pendingPayments: (prev.pendingPayments || []).filter((p) => p.id !== pendingPaymentId),
    }));
  };

  /**
   * 2. UPDATE STUDENT
   */
  const updateStudent = (studentId: string, data: Partial<Student>) => {
    setState((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id === studentId || s.studentId === studentId) {
          return { ...s, ...data };
        }
        return s;
      });
      return { ...prev, students: updatedStudents };
    });
    logAudit('SECRETARIAT', 'ATUALIZAR_ALUNO', 'Student', studentId, 'Dados Anteriores', JSON.stringify(data));
  };

  /**
   * 3. ADD EXTRA ENROLLMENT TO EXISTING STUDENT (1 Aluno -> N Matrículas)
   */
  const addEnrollmentToStudent = (
    studentId: string,
    courseId: string,
    classId: string,
    installmentsCount: number = 4,
    negotiationData?: PlanNegotiationInput
  ) => {
    const student = state.students.find((s) => s.studentId === studentId || s.id === studentId);
    if (!student) throw new Error('Aluno não encontrado');

    const course = state.courses.find((c) => c.id === courseId);
    const classRoom = state.classes.find((cl) => cl.id === classId);
    const nowStr = new Date().toISOString().split('T')[0];
    const uniqueRand = Math.random().toString(36).substring(2, 8);

    let originalTotalAmount = course
      ? (course.totalCourseAmount || course.monthlyFee * installmentsCount)
      : 500 * installmentsCount;
    let finalTotal = originalTotalAmount;

    if (negotiationData?.originalTotalAmount) {
      originalTotalAmount = negotiationData.originalTotalAmount;
      finalTotal = negotiationData.totalAmount ?? originalTotalAmount;
    } else if (negotiationData?.totalAmount !== undefined && negotiationData.totalAmount > 0) {
      finalTotal = negotiationData.totalAmount;
    }

    const installmentAmount = Math.max(1, Math.round(finalTotal / installmentsCount));

    const newEnrollment: Enrollment = {
      id: `enr_${Date.now()}_${uniqueRand}`,
      studentId: student.studentId,
      studentInternalId: student.id,
      studentName: student.name,
      courseId,
      courseName: course ? course.name : 'Curso',
      classId,
      className: classRoom ? classRoom.name : 'Turma',
      enrollmentDate: nowStr,
      status: 'ATIVA',
      paymentPlan: {
        installmentsCount,
        totalAmount: finalTotal,
        installmentAmount,
        originalTotalAmount,
        englishLevel: negotiationData?.englishLevel,
        discountType: negotiationData?.discountType,
        discountValue: negotiationData?.discountValue,
        discountReason: negotiationData?.discountReason,
        isNegotiated: !!(negotiationData?.discountValue && negotiationData.discountValue > 0),
      },
    };

    const newCharges: Charge[] = [];
    const discountNote = negotiationData?.discountReason
      ? ` [Negociação: ${negotiationData.discountReason}]`
      : '';

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      dueDate.setDate(5);

      newCharges.push({
        id: `chg_${newEnrollment.id}_${i}`,
        enrollmentId: newEnrollment.id,
        studentId: student.studentId,
        studentName: student.name,
        courseName: newEnrollment.courseName,
        installmentNumber: i,
        totalInstallments: installmentsCount,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: i === 1 ? 'PENDENTE' : 'REGULAR',
        notes: `Parcela ${i}/${installmentsCount} gerada para ${newEnrollment.courseName}.${discountNote}`,
      });
    }

    setState((prev) => ({
      ...prev,
      enrollments: deduplicateById([newEnrollment, ...prev.enrollments]),
      charges: deduplicateById([...newCharges, ...prev.charges]),
    }));

    logAudit(
      'SECRETARIAT',
      'ADICIONAR_MATRICULA',
      'Enrollment',
      newEnrollment.id,
      undefined,
      `${student.name} (${student.studentId}) adicionou ${newEnrollment.courseName}`,
      `Nova matrícula vinculada com plano de ${installmentsCount} parcelas (Total: ${finalTotal} EGP).`
    );

    return newEnrollment;
  };

  /**
   * 3.1 RENEGOTIATE ENROLLMENT PLAN / APPLY DISCOUNT TO ACTIVE STUDENT
   */
  const renegotiateEnrollmentPlan = (
    enrollmentId: string,
    negotiationData: {
      newTotalAmount: number;
      installmentsCount: number;
      installmentAmount?: number;
      originalTotalAmount?: number;
      discountType?: 'NONE' | 'PERCENT' | 'FIXED';
      discountValue?: number;
      discountReason?: string;
      recalculateUnpaidCharges?: boolean;
    }
  ) => {
    const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    const currentCharges = state.charges.filter((c) => c.enrollmentId === enrollmentId);
    const paidCharges = currentCharges.filter((c) => c.status === 'PAGO');
    const unpaidCharges = currentCharges.filter((c) => c.status === 'PENDENTE' || c.status === 'REGULAR');
    const totalPaidAmount = paidCharges.reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);

    const calculatedInstallment =
      negotiationData.installmentAmount ||
      Math.max(1, Math.round(negotiationData.newTotalAmount / negotiationData.installmentsCount));

    setState((prev) => {
      const updatedEnrollments = prev.enrollments.map((e) => {
        if (e.id === enrollmentId) {
          return {
            ...e,
            paymentPlan: {
              ...e.paymentPlan,
              installmentsCount: negotiationData.installmentsCount,
              totalAmount: negotiationData.newTotalAmount,
              installmentAmount: calculatedInstallment,
              originalTotalAmount:
                negotiationData.originalTotalAmount ||
                e.paymentPlan.originalTotalAmount ||
                e.paymentPlan.totalAmount,
              discountType: negotiationData.discountType,
              discountValue: negotiationData.discountValue,
              discountReason: negotiationData.discountReason,
              isNegotiated: true,
            },
          };
        }
        return e;
      });

      let updatedCharges = prev.charges;
      if (negotiationData.recalculateUnpaidCharges !== false && unpaidCharges.length > 0) {
        const remainingToPay = Math.max(0, negotiationData.newTotalAmount - totalPaidAmount);
        const perUnpaidAmount = Math.max(1, Math.round(remainingToPay / unpaidCharges.length));

        updatedCharges = prev.charges.map((chg) => {
          if (chg.enrollmentId === enrollmentId && (chg.status === 'PENDENTE' || chg.status === 'REGULAR')) {
            const discountNote = negotiationData.discountReason
              ? ` [Negociação: ${negotiationData.discountReason}]`
              : ' [Plano Renegociado]';
            return {
              ...chg,
              amount: perUnpaidAmount,
              notes: `${chg.notes || ''}${discountNote}`.trim(),
            };
          }
          return chg;
        });
      }

      return {
        ...prev,
        enrollments: updatedEnrollments,
        charges: updatedCharges,
      };
    });

    logAudit(
      'SECRETARIAT',
      'RENEGOCIAR_PLANO_MATRICULA',
      'Enrollment',
      enrollmentId,
      `${enrollment.paymentPlan.totalAmount} EGP`,
      `${negotiationData.newTotalAmount} EGP`,
      `Plano da matrícula de ${enrollment.studentName} renegociado. Novo total: ${negotiationData.newTotalAmount} EGP em ${negotiationData.installmentsCount}x de ${calculatedInstallment} EGP. Motivo: ${negotiationData.discountReason || 'Acordo de balcão'}`
    );

    addNotification(
      'Plano Renegociado!',
      `O plano de ${enrollment.studentName} foi ajustado para ${negotiationData.newTotalAmount} EGP (${negotiationData.installmentsCount}x de ${calculatedInstallment} EGP).`,
      'SUCCESS',
      'ALL'
    );
  };

  const updateEnrollmentStatus = (enrollmentId: string, status: Enrollment['status']) => {
    setState((prev) => ({
      ...prev,
      enrollments: prev.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status } : e)),
    }));
    logAudit('SECRETARIAT', 'STATUS_MATRICULA', 'Enrollment', enrollmentId, undefined, status);
  };

  const addStudentDocument = (
    studentId: string,
    doc: Omit<StudentDocument, 'id' | 'uploadedAt' | 'uploadedBy'>
  ): StudentDocument => {
    const newDoc: StudentDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      uploadedBy: currentUser.name,
    };

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.studentId === studentId || s.id === studentId
          ? { ...s, documents: [newDoc, ...(s.documents || [])] }
          : s
      ),
    }));

    logAudit(
      'SECRETARIAT',
      'ANEXAR_DOCUMENTO',
      'StudentDocument',
      newDoc.id,
      undefined,
      `${newDoc.title} (${newDoc.type})`,
      `Documento anexado ao prontuário do aluno ID ${studentId}`
    );

    return newDoc;
  };

  const deleteStudentDocument = (studentId: string, docId: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.studentId === studentId || s.id === studentId
          ? { ...s, documents: (s.documents || []).filter((d) => d.id !== docId) }
          : s
      ),
    }));

    logAudit(
      'SECRETARIAT',
      'EXCLUIR_DOCUMENTO',
      'StudentDocument',
      docId,
      undefined,
      undefined,
      `Documento ${docId} removido do prontuário do aluno ID ${studentId}`
    );
  };

  /**
   * 4. REGISTER PAYMENT & AUTO-TRIGGER INTEGRATED REACTION
   */
  const registerPayment = (
    chargeId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ): PaymentReceipt => {
    const charge = state.charges.find((c) => c.id === chargeId);
    if (!charge) throw new Error('Cobrança não encontrada');

    const receiptNumber = generateNextReceiptNumber(state.receipts);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const uniqueRand = Math.random().toString(36).substring(2, 8);

    const newReceipt: PaymentReceipt = {
      id: `rec_${Date.now()}_${uniqueRand}`,
      receiptNumber,
      chargeId,
      studentId: charge.studentId,
      studentName: charge.studentName,
      courseName: charge.courseName,
      amount: paidAmount,
      paymentMethod,
      installmentDescription: `Parcela ${charge.installmentNumber}/${charge.totalInstallments} - ${charge.courseName}`,
      date: nowTimestamp,
      issuedBy: `${currentUser.name} (${currentUser.role})`,
      notes: notes || 'Pagamento confirmado e processado pela tesouraria do Centro.',
    };

    // Update active Cash Register if open and cash/instapay
    let updatedCashRegisters = [...state.cashRegisters];
    let newCashMovements = [...state.cashMovements];

    const activeRegister = state.cashRegisters.find((cr) => cr.status === 'ABERTO');
    if (activeRegister && paymentMethod === 'DINHEIRO') {
      const movement: CashMovement = {
        id: `mov_${Date.now()}_${uniqueRand}`,
        cashRegisterId: activeRegister.id,
        type: 'ENTRADA',
        category: 'Recebimento de Mensalidade (Balcão Físico)',
        amount: paidAmount,
        description: `Recebimento em dinheiro físico de ${charge.studentName} (${charge.studentId}) - ${charge.courseName}`,
        relatedPaymentReceipt: receiptNumber,
        timestamp: nowTimestamp,
        operatorName: currentUser.name,
      };
      newCashMovements = [movement, ...newCashMovements];

      updatedCashRegisters = updatedCashRegisters.map((cr) =>
        cr.id === activeRegister.id
          ? {
              ...cr,
              totalIn: cr.totalIn + paidAmount,
              expectedBalance: cr.expectedBalance + paidAmount,
            }
          : cr
      );
    }

    // Auto create Accounting Revenue transaction
    const newAccountingTx: AccountingTransaction = {
      id: `acc_tx_${Date.now()}_${uniqueRand}`,
      type: 'RECEITA',
      amount: paidAmount,
      date: nowTimestamp.split(' ')[0],
      category: `Mensalidades - ${charge.courseName}`,
      costCenter: 'Receitas Operacionais do Centro',
      description: `Pagamento da Parcela ${charge.installmentNumber}/${charge.totalInstallments} de ${charge.studentName} (${charge.studentId})`,
      relatedReceiptId: receiptNumber,
      status: 'CONCILIADO',
      registeredBy: currentUser.name,
    };

    // Update state
    setState((prev) => ({
      ...prev,
      charges: prev.charges.map((c) =>
        c.id === chargeId
          ? {
              ...c,
              status: 'PAGO',
              paidAmount,
              paidAt: nowTimestamp,
              paymentMethod,
              receiptNumber,
              registeredBy: currentUser.name,
              notes: notes || c.notes,
            }
          : c
      ),
      receipts: deduplicateById([newReceipt, ...prev.receipts]),
      cashRegisters: deduplicateById(updatedCashRegisters),
      cashMovements: deduplicateById(newCashMovements),
      accountingTransactions: deduplicateById([newAccountingTx, ...prev.accountingTransactions]),
    }));

    // Trigger visual celebratory confetti for instant feedback
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#7C3AED', '#10B981', '#F97316'],
      });
    } catch (e) {}

    // Audit Log
    logAudit(
      'FINANCE',
      'REGISTRO_PAGAMENTO',
      'PaymentReceipt',
      receiptNumber,
      `Pendente: ${charge.amount} EGP`,
      `Pago: ${paidAmount} EGP em Dinheiro Físico (Balcão)`,
      `Recibo ${receiptNumber} emitido para ${charge.studentName} (${charge.studentId}). Provas e aulas reavaliadas.`
    );

    // Notify Student
    const studentUser = state.users.find((u) => u.studentId === charge.studentId);
    addNotification(
      'Pagamento Confirmado & Recibo Emitido!',
      `Seu pagamento de ${paidAmount} EGP (${charge.courseName} - Parcela ${charge.installmentNumber}) foi confirmado. Recibo ${receiptNumber} disponível!`,
      'SUCCESS',
      'STUDENT',
      studentUser?.id
    );

    return newReceipt;
  };

  /**
   * 5. CASH REGISTER OPERATIONS (Abertura / Fechamento de Caixa com conferência de diferenças)
   */
  const openCashRegister = (initialBalance: number, notes?: string): CashRegister => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newReg: CashRegister = {
      id: `cash_reg_${Date.now()}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      openingDate: nowTimestamp,
      initialBalance,
      totalIn: 0,
      totalOut: 0,
      expectedBalance: initialBalance,
      status: 'ABERTO',
      notes: notes || 'Caixa aberto para a jornada de atendimento.',
    };

    setState((prev) => ({
      ...prev,
      cashRegisters: [newReg, ...prev.cashRegisters],
    }));

    logAudit('FINANCE', 'ABERTURA_CAIXA', 'CashRegister', newReg.id, undefined, `Saldo Inicial: ${initialBalance} EGP`);
    return newReg;
  };

  const closeCashRegister = (countedBalance: number, notes?: string): CashRegister => {
    const active = state.cashRegisters.find((cr) => cr.status === 'ABERTO');
    if (!active) throw new Error('Não há caixa aberto para fechamento.');

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const difference = countedBalance - active.expectedBalance;

    const closedReg: CashRegister = {
      ...active,
      closingDate: nowTimestamp,
      countedBalance,
      difference,
      status: 'FECHADO',
      notes: notes || (difference === 0 ? 'Fechamento perfeito sem divergência.' : `Divergência apurada: ${difference} EGP`),
    };

    setState((prev) => ({
      ...prev,
      cashRegisters: prev.cashRegisters.map((cr) => (cr.id === active.id ? closedReg : cr)),
    }));

    logAudit(
      'FINANCE',
      'FECHAMENTO_CAIXA',
      'CashRegister',
      active.id,
      `Esperado: ${active.expectedBalance} EGP`,
      `Contado: ${countedBalance} EGP | Diferença: ${difference} EGP`,
      closedReg.notes
    );

    return closedReg;
  };

  const addCashMovement = (type: 'ENTRADA' | 'SAIDA', category: string, amount: number, description: string) => {
    const active = state.cashRegisters.find((cr) => cr.status === 'ABERTO');
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const movement: CashMovement = {
      id: `mov_${Date.now()}`,
      cashRegisterId: active ? active.id : 'reg_external',
      type,
      category,
      amount,
      description,
      timestamp: nowTimestamp,
      operatorName: currentUser.name,
    };

    setState((prev) => {
      let updatedRegs = prev.cashRegisters;
      if (active) {
        updatedRegs = updatedRegs.map((cr) =>
          cr.id === active.id
            ? {
                ...cr,
                totalIn: type === 'ENTRADA' ? cr.totalIn + amount : cr.totalIn,
                totalOut: type === 'SAIDA' ? cr.totalOut + amount : cr.totalOut,
                expectedBalance: type === 'ENTRADA' ? cr.expectedBalance + amount : cr.expectedBalance - amount,
              }
            : cr
        );
      }
      return {
        ...prev,
        cashMovements: [movement, ...prev.cashMovements],
        cashRegisters: updatedRegs,
      };
    });

    logAudit('FINANCE', `MOVIMENTACAO_CAIXA_${type}`, 'CashMovement', movement.id, undefined, `${amount} EGP - ${category}`);
  };

  /**
   * 6. ACADEMIC & TEACHER FUNCTIONS
   */
  const saveAttendance = (classId: string, date: string, records: AttendanceRecord['students'], notes?: string) => {
    const classRoom = state.classes.find((cl) => cl.id === classId);
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      classId,
      className: classRoom ? classRoom.name : 'Turma',
      date,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      students: records,
      notes,
      savedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setState((prev) => ({
      ...prev,
      attendance: [newRecord, ...prev.attendance.filter((a) => !(a.classId === classId && a.date === date))],
    }));

    logAudit(
      'ACADEMIC',
      'CHAMADA_SALVA',
      'AttendanceRecord',
      newRecord.id,
      undefined,
      `${records.filter((r) => r.present).length}/${records.length} Presentes na turma ${newRecord.className}`
    );
  };

  const saveGrade = (assessmentId: string, studentId: string, score: number, feedback?: string): Grade => {
    const assessment = state.assessments.find((a) => a.id === assessmentId);
    const student = state.students.find((s) => s.studentId === studentId);
    const maxScore = assessment ? assessment.maxScore : 100;
    const percentage = Math.round((score / maxScore) * 100);

    const newGrade: Grade = {
      id: `grd_${Date.now()}`,
      assessmentId,
      assessmentTitle: assessment ? assessment.title : 'Avaliação',
      classId: assessment ? assessment.classId : '',
      studentId,
      studentName: student ? student.name : 'Aluno',
      score,
      maxScore,
      percentage,
      feedback,
      gradedAt: new Date().toISOString().split('T')[0],
      gradedBy: currentUser.name,
    };

    setState((prev) => ({
      ...prev,
      grades: [newGrade, ...prev.grades.filter((g) => !(g.assessmentId === assessmentId && g.studentId === studentId))],
    }));

    logAudit(
      'ACADEMIC',
      'LANCAMENTO_NOTA',
      'Grade',
      newGrade.id,
      undefined,
      `${newGrade.studentName} (${studentId}) -> ${score}/${maxScore} (${percentage}%) em ${newGrade.assessmentTitle}`,
      feedback
    );

    const studentUser = state.users.find((u) => u.studentId === studentId);
    addNotification(
      'Nova Nota Lançada!',
      `Sua nota na avaliação "${newGrade.assessmentTitle}" foi publicada: ${score}/${maxScore} pontos.`,
      'INFO',
      'STUDENT',
      studentUser?.id
    );

    return newGrade;
  };

  const saveBatchGrades = (assessmentId: string, batchGrades: { studentId: string; score: number; feedback?: string }[]) => {
    const assessment = state.assessments.find((a) => a.id === assessmentId);
    const maxScore = assessment ? assessment.maxScore : 100;
    const now = new Date().toISOString().split('T')[0];

    setState((prev) => {
      const newGradesList = [...prev.grades];

      batchGrades.forEach(({ studentId, score, feedback }) => {
        const student = prev.students.find((s) => s.studentId === studentId);
        const percentage = Math.round((score / maxScore) * 100);
        const existingIdx = newGradesList.findIndex((g) => g.assessmentId === assessmentId && g.studentId === studentId);

        const gradeObj: Grade = {
          id: existingIdx >= 0 ? newGradesList[existingIdx].id : `grd_${Date.now()}_${studentId}`,
          assessmentId,
          assessmentTitle: assessment ? assessment.title : 'Avaliação',
          classId: assessment ? assessment.classId : '',
          studentId,
          studentName: student ? student.name : 'Aluno',
          score,
          maxScore,
          percentage,
          feedback,
          gradedAt: now,
          gradedBy: currentUser.name,
        };

        if (existingIdx >= 0) {
          newGradesList[existingIdx] = gradeObj;
        } else {
          newGradesList.push(gradeObj);
        }
      });

      return {
        ...prev,
        grades: newGradesList,
      };
    });

    logAudit('ACADEMIC', 'LANCAMENTO_NOTAS_LOTE', 'Assessment', assessmentId, undefined, `${batchGrades.length} notas lançadas para "${assessment?.title}"`);
  };

  const createAssessment = (data: Omit<Assessment, 'id'>): Assessment => {
    const newAsm: Assessment = {
      ...data,
      id: `asm_${Date.now()}`,
    };
    setState((prev) => ({ ...prev, assessments: [newAsm, ...prev.assessments] }));
    logAudit('ACADEMIC', 'CRIAR_AVALIACAO', 'Assessment', newAsm.id, undefined, `${newAsm.title} (Máx: ${newAsm.maxScore})`);

    addNotification(
      'Nova Prova / Avaliação Agendada!',
      `A avaliação "${newAsm.title}" foi cadastrada para a turma ${newAsm.className}.`,
      'INFO',
      'STUDENT'
    );
    return newAsm;
  };

  const deleteAssessment = (assessmentId: string) => {
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== assessmentId),
      grades: prev.grades.filter((g) => g.assessmentId !== assessmentId),
    }));
    logAudit('ACADEMIC', 'EXCLUIR_AVALIACAO', 'Assessment', assessmentId, undefined, undefined, `Avaliação ${assessmentId} excluída`);
  };

  const updateAssessment = (assessmentId: string, data: Partial<Assessment>) => {
    setState((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) => (a.id === assessmentId ? { ...a, ...data } : a)),
    }));
    logAudit('ACADEMIC', 'EDITAR_AVALIACAO', 'Assessment', assessmentId, undefined, undefined, `Avaliação ${assessmentId} atualizada.`);
  };

  const createClass = (data: Omit<ClassRoom, 'id'>): ClassRoom => {
    const newCls: ClassRoom = {
      ...data,
      id: `class_${Date.now()}`,
    };
    setState((prev) => ({ ...prev, classes: [newCls, ...prev.classes] }));
    logAudit('SECRETARIAT', 'CRIAR_TURMA', 'ClassRoom', newCls.id, undefined, `${newCls.name} (${newCls.code})`, `Docente: ${newCls.teacherName || 'Sem professor'}`);

    if (newCls.teacherId) {
      addNotification(
        'Nova Turma Aberta & Atribuída!',
        `Você foi vinculado à turma "${newCls.name}" (${newCls.code}).`,
        'INFO',
        'TEACHER',
        newCls.teacherId
      );
    }
    return newCls;
  };

  const updateClass = (classId: string, data: Partial<ClassRoom>) => {
    const existing = state.classes.find((c) => c.id === classId);
    if (!existing) return;

    setState((prev) => {
      const updatedClasses = prev.classes.map((cls) =>
        cls.id === classId ? { ...cls, ...data } : cls
      );

      // If class name changed, cascade update to enrollments, lessons, assignments, assessments
      let updatedEnrollments = prev.enrollments;
      let updatedLessons = prev.lessons;
      let updatedAssignments = prev.assignments;
      let updatedAssessments = prev.assessments;

      if (data.name && data.name !== existing.name) {
        updatedEnrollments = updatedEnrollments.map((enr) =>
          enr.classId === classId ? { ...enr, className: data.name! } : enr
        );
        updatedLessons = updatedLessons.map((les) =>
          les.classId === classId ? { ...les, className: data.name! } : les
        );
        updatedAssignments = updatedAssignments.map((asg) =>
          asg.classId === classId ? { ...asg, className: data.name! } : asg
        );
        updatedAssessments = updatedAssessments.map((asm) =>
          asm.classId === classId ? { ...asm, className: data.name! } : asm
        );
      }

      return {
        ...prev,
        classes: updatedClasses,
        enrollments: updatedEnrollments,
        lessons: updatedLessons,
        assignments: updatedAssignments,
        assessments: updatedAssessments,
      };
    });

    logAudit(
      'SECRETARIAT',
      'EDITAR_TURMA',
      'ClassRoom',
      classId,
      `${existing.name} (${existing.code}) - ${existing.teacherName}`,
      `${data.name || existing.name} (${data.code || existing.code}) - ${data.teacherName || existing.teacherName}`,
      `Turma ${existing.code} atualizada pela Secretaria.`
    );

    if (data.teacherId && data.teacherId !== existing.teacherId) {
      addNotification(
        'Turma Vinculada!',
        `Você foi vinculado como professor responsável da turma "${data.name || existing.name}".`,
        'INFO',
        'TEACHER',
        data.teacherId
      );
    }
  };

  const deleteClass = (classId: string) => {
    const existing = state.classes.find((c) => c.id === classId);
    if (!existing) return;

    const enrolledCount = state.enrollments.filter((e) => e.classId === classId).length;

    setState((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
      enrollments: prev.enrollments.filter((e) => e.classId !== classId),
      attendance: prev.attendance.filter((a) => a.classId !== classId),
      lessons: prev.lessons.filter((l) => l.classId !== classId),
      assignments: prev.assignments.filter((a) => a.classId !== classId),
      assessments: prev.assessments.filter((a) => a.classId !== classId),
    }));

    logAudit(
      'SECRETARIAT',
      'EXCLUIR_TURMA',
      'ClassRoom',
      classId,
      `${existing.name} (${existing.code}) - Docente: ${existing.teacherName}`,
      undefined,
      `Turma excluída com ${enrolledCount} matrículas vinculadas canceladas.`
    );

    addNotification(
      'Turma Removida',
      `A turma "${existing.name}" foi excluída do sistema acadêmico.`,
      'WARNING',
      'ALL'
    );
  };

  const toggleFinalGradeRelease = (classId: string, isReleased?: boolean) => {
    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        const current = cls.isFinalGradeReleased ?? false;
        const nextVal = isReleased !== undefined ? isReleased : !current;
        return { ...cls, isFinalGradeReleased: nextVal };
      }),
    }));
    logAudit('ACADEMIC', 'LIBERACAO_MEDIA_FINAL', 'ClassRoom', classId, undefined, undefined, `Controle de liberação da média final atualizado.`);
  };

  const assignTeacherToClass = (classId: string, teacherId: string, teacherName: string) => {
    const existing = state.classes.find((c) => c.id === classId);
    if (!existing) return;

    const prevTeacher = existing.teacherName || 'Sem professor vinculado';

    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === classId ? { ...c, teacherId, teacherName } : c
      ),
    }));

    logAudit(
      'SECRETARIAT',
      'VINCULAR_PROFESSOR',
      'ClassRoom',
      classId,
      prevTeacher,
      teacherName,
      `Docente ${teacherName} vinculado à turma ${existing.name} (${existing.code}).`
    );

    if (teacherId) {
      addNotification(
        'Turma Vinculada!',
        `Você foi vinculado à turma "${existing.name}" (${existing.code}) pela Secretaria.`,
        'SUCCESS',
        'TEACHER',
        teacherId
      );
    }
  };

  const unassignTeacherFromClass = (classId: string) => {
    const existing = state.classes.find((c) => c.id === classId);
    if (!existing) return;

    const prevTeacher = existing.teacherName;
    const prevTeacherId = existing.teacherId;

    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === classId ? { ...c, teacherId: '', teacherName: 'Sem professor vinculado' } : c
      ),
    }));

    logAudit(
      'SECRETARIAT',
      'DESVINCULAR_PROFESSOR',
      'ClassRoom',
      classId,
      prevTeacher,
      'Sem professor vinculado',
      `Professor ${prevTeacher} desvinculado da turma ${existing.name}.`
    );

    if (prevTeacherId) {
      addNotification(
        'Turma Desvinculada',
        `Você foi desvinculado da turma "${existing.name}".`,
        'INFO',
        'TEACHER',
        prevTeacherId
      );
    }
  };

  const updateCourse = (courseId: string, data: Partial<Course>) => {
    const existing = state.courses.find((c) => c.id === courseId);
    if (!existing) return;

    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === courseId ? { ...c, ...data } : c)),
    }));

    logAudit(
      'SECRETARIAT',
      'ATUALIZAR_CURSO',
      'Course',
      courseId,
      `${existing.name} (${existing.monthlyFee} EGP)`,
      `${data.name || existing.name} (${data.monthlyFee ?? existing.monthlyFee} EGP)`,
      `Dados do curso ${existing.code} atualizados pela Secretaria.`
    );
  };

  const updateCourseFee = (
    courseId: string,
    newMonthlyFee: number,
    updateUnpaidCharges: boolean = false,
    extraPricing?: {
      totalCourseAmount?: number;
      defaultInstallmentsCount?: number;
      levels?: CourseLevelPricing[];
    }
  ) => {
    const existing = state.courses.find((c) => c.id === courseId);
    if (!existing) return;

    const oldFee = existing.monthlyFee;
    const newTotalAmount = extraPricing?.totalCourseAmount ?? (newMonthlyFee * (existing.defaultInstallmentsCount || 4));
    const newDefaultInstallments = extraPricing?.defaultInstallmentsCount ?? (existing.defaultInstallmentsCount || 4);

    setState((prev) => {
      const updatedCourses = prev.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              monthlyFee: newMonthlyFee,
              totalCourseAmount: newTotalAmount,
              defaultInstallmentsCount: newDefaultInstallments,
              levels: extraPricing?.levels ?? c.levels,
            }
          : c
      );

      let updatedCharges = prev.charges;
      let updatedEnrollments = prev.enrollments;

      if (updateUnpaidCharges) {
        const courseEnrollmentIds = new Set(
          prev.enrollments.filter((e) => e.courseId === courseId).map((e) => e.id)
        );

        updatedCharges = updatedCharges.map((chg) => {
          if (courseEnrollmentIds.has(chg.enrollmentId) && (chg.status === 'PENDENTE' || chg.status === 'REGULAR')) {
            return {
              ...chg,
              amount: newMonthlyFee,
              notes: `${chg.notes || ''} [Reajuste: ${oldFee} -> ${newMonthlyFee} EGP]`.trim(),
            };
          }
          return chg;
        });

        updatedEnrollments = updatedEnrollments.map((enr) => {
          if (enr.courseId === courseId) {
            const count = enr.paymentPlan.installmentsCount || 4;
            return {
              ...enr,
              paymentPlan: {
                ...enr.paymentPlan,
                installmentAmount: newMonthlyFee,
                totalAmount: newMonthlyFee * count,
              },
            };
          }
          return enr;
        });
      }

      return {
        ...prev,
        courses: updatedCourses,
        charges: updatedCharges,
        enrollments: updatedEnrollments,
      };
    });

    logAudit(
      'SECRETARIAT',
      'ALTERAR_VALOR_MENSALIDADE',
      'Course',
      courseId,
      `${oldFee} EGP`,
      `${newMonthlyFee} EGP`,
      `Mensalidade do curso ${existing.name} alterada de ${oldFee} EGP para ${newMonthlyFee} EGP (Total: ${newTotalAmount} EGP) pela Secretaria.${
        updateUnpaidCharges ? ' (Aplicado a cobranças pendentes futuras)' : ' (Aplicado a novas matrículas)'
      }`
    );

    addNotification(
      'Mensalidade Atualizada!',
      `O valor do curso "${existing.name}" foi atualizado (Total: ${newTotalAmount} EGP, ${newMonthlyFee} EGP/parcela).`,
      'SUCCESS',
      'ALL'
    );
  };

  /**
   * 7. LMS / AVA FUNCTIONS
   */
  const createLesson = (data: Omit<Lesson, 'id'>): Lesson => {
    const newLesson: Lesson = {
      ...data,
      id: `les_${Date.now()}`,
    };
    setState((prev) => ({ ...prev, lessons: [newLesson, ...prev.lessons] }));
    logAudit('LMS', 'PUBLICAR_AULA', 'Lesson', newLesson.id, undefined, newLesson.title);

    addNotification(
      'Nova Aula Publicada!',
      `A aula "${newLesson.title}" foi disponibilizada para a turma ${newLesson.className}.`,
      'INFO',
      'STUDENT'
    );
    return newLesson;
  };

  const deleteLesson = (lessonId: string) => {
    setState((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== lessonId),
    }));
    logAudit('LMS', 'EXCLUIR_AULA', 'Lesson', lessonId, undefined, undefined, `Aula ${lessonId} excluída`);
  };

  const createAssignment = (data: Omit<Assignment, 'id'>): Assignment => {
    const newAsg: Assignment = {
      ...data,
      id: `asg_${Date.now()}`,
    };
    setState((prev) => ({ ...prev, assignments: [newAsg, ...prev.assignments] }));
    logAudit('LMS', 'CRIAR_ATIVIDADE', 'Assignment', newAsg.id, undefined, newAsg.title);

    addNotification(
      'Nova Atividade Publicada!',
      `A atividade "${newAsg.title}" foi publicada para a turma ${newAsg.className}. Prazo: ${newAsg.dueDate}`,
      'INFO',
      'STUDENT'
    );
    return newAsg;
  };

  const deleteAssignment = (assignmentId: string) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== assignmentId),
      submissions: prev.submissions.filter((s) => s.assignmentId !== assignmentId),
    }));
    logAudit('LMS', 'EXCLUIR_ATIVIDADE', 'Assignment', assignmentId, undefined, undefined, `Atividade ${assignmentId} excluída`);
  };

  const updateAssignment = (assignmentId: string, data: Partial<Assignment>) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((asg) => (asg.id === assignmentId ? { ...asg, ...data } : asg)),
    }));
    logAudit('LMS', 'EDITAR_ATIVIDADE', 'Assignment', assignmentId, undefined, undefined, `Atividade ${assignmentId} atualizada.`);
  };

  const submitAssignment = (
    assignmentId: string,
    studentId: string,
    submissionText: string,
    attachmentName?: string
  ): Submission => {
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    const student = state.students.find((s) => s.studentId === studentId);

    const newSub: Submission = {
      id: `sub_${Date.now()}`,
      assignmentId,
      assignmentTitle: assignment ? assignment.title : 'Tarefa',
      studentId,
      studentName: student ? student.name : 'Aluno',
      submissionText,
      attachmentName,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'PENDENTE_CORRECAO',
    };

    setState((prev) => ({
      ...prev,
      submissions: [newSub, ...prev.submissions.filter((s) => !(s.assignmentId === assignmentId && s.studentId === studentId))],
    }));

    logAudit('LMS', 'SUBMISSAO_TRABALHO', 'Submission', newSub.id, undefined, `${newSub.studentName} enviou "${newSub.assignmentTitle}"`);
    return newSub;
  };

  const gradeSubmission = (submissionId: string, score: number, feedback?: string) => {
    setState((prev) => {
      const updatedSubs = prev.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'AVALIADO' as const,
              score,
              feedback,
              gradedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              gradedBy: currentUser.name,
            }
          : s
      );
      return { ...prev, submissions: updatedSubs };
    });
    logAudit('LMS', 'CORRECAO_TRABALHO', 'Submission', submissionId, undefined, `Nota: ${score} | ${feedback}`);
  };

  const markSubmissionSeen = (submissionId: string, feedback?: string, score?: number) => {
    setState((prev) => {
      const updatedSubs = prev.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'VISTO' as const,
              score: score !== undefined ? score : s.score,
              feedback: feedback !== undefined ? feedback : s.feedback || 'Atividade visualizada e validada pelo professor.',
              gradedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              gradedBy: currentUser.name,
            }
          : s
      );
      return { ...prev, submissions: updatedSubs };
    });
    logAudit('LMS', 'VISTO_ATIVIDADE', 'Submission', submissionId, undefined, `Visto atribuído por ${currentUser.name} | Feedback: ${feedback || 'Visto'}`);
  };

  const markManualStudentSubmission = (
    assignmentId: string,
    studentId: string,
    feedback: string,
    score?: number,
    isSeen: boolean = true
  ): Submission => {
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    const student = state.students.find((s) => s.studentId === studentId);

    const newSub: Submission = {
      id: `sub_manual_${Date.now()}_${studentId}`,
      assignmentId,
      assignmentTitle: assignment ? assignment.title : 'Atividade',
      studentId,
      studentName: student ? student.name : 'Aluno',
      submissionText: 'Entrega presencial/em sala validada pelo docente.',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: isSeen ? 'VISTO' : 'AVALIADO',
      score: score !== undefined ? score : (assignment?.maxScore || 100),
      maxScore: assignment?.maxScore || 100,
      feedback: feedback || 'Visto atribuído em aula pelo professor.',
      gradedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      gradedBy: currentUser.name,
      deliveryMethod: 'PRESENCIAL',
    };

    setState((prev) => ({
      ...prev,
      submissions: [newSub, ...prev.submissions.filter((s) => !(s.assignmentId === assignmentId && s.studentId === studentId))],
    }));

    logAudit('LMS', 'VISTO_PRESENCIAL', 'Submission', newSub.id, undefined, `Visto presencial para ${newSub.studentName} em "${newSub.assignmentTitle}"`);
    return newSub;
  };

  /**
   * 8. ACCOUNTING & SETTINGS
   */
  const createAccountingTransaction = (data: Omit<AccountingTransaction, 'id' | 'registeredBy' | 'status'>) => {
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const newTx: AccountingTransaction = {
      ...data,
      id: `acc_tx_${Date.now()}_${uniqueRand}`,
      registeredBy: currentUser.name,
      status: 'CONCILIADO',
    };
    setState((prev) => ({
      ...prev,
      accountingTransactions: deduplicateById([newTx, ...prev.accountingTransactions]),
    }));
    logAudit('ACCOUNTING', 'NOVO_LANCAMENTO_CONTABIL', 'AccountingTransaction', newTx.id, undefined, `${newTx.type} de ${newTx.amount} EGP - ${newTx.category}`);
  };

  const createUser = (data: Omit<User, 'id' | 'createdAt'>): User => {
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const userRoles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : [data.role];
    const newUser: User = {
      ...data,
      id: `usr_${Date.now()}_${uniqueRand}`,
      roles: userRoles,
      role: data.role || userRoles[0],
      createdAt: new Date().toISOString().split('T')[0],
      status: data.status || 'ACTIVE',
      permissions: data.permissions || ['*'],
    };
    setState((prev) => ({
      ...prev,
      users: deduplicateById([...prev.users, newUser]),
    }));
    logAudit('ADMIN', 'CRIAR_USUARIO', 'User', newUser.id, undefined, `${newUser.name} (${newUser.roles?.join(', ') || newUser.role}) - ${newUser.email}`);
    return newUser;
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.id === userId) {
          const newRoles = Array.isArray(data.roles)
            ? data.roles.filter((role) => role !== 'PENDING')
            : (u.roles || [u.role]).filter((role) => role !== 'PENDING');
          const newActiveRole = newRoles.length === 0
            ? 'PENDING'
            : data.role && newRoles.includes(data.role)
            ? data.role
            : newRoles.includes(u.role)
            ? u.role
            : newRoles[0];
          return {
            ...u,
            ...data,
            roles: newRoles,
            role: newActiveRole,
          };
        }
        return u;
      });

      const isCurrent = prev.currentUser.id === userId;
      let updatedCurrent = prev.currentUser;
      if (isCurrent) {
        const newRoles = Array.isArray(data.roles)
          ? data.roles.filter((role) => role !== 'PENDING')
          : (prev.currentUser.roles || [prev.currentUser.role]).filter(
              (role) => role !== 'PENDING'
            );
        const newActiveRole = newRoles.length === 0
          ? 'PENDING'
          : data.role && newRoles.includes(data.role)
          ? data.role
          : newRoles.includes(prev.currentUser.role)
          ? prev.currentUser.role
          : newRoles[0];
        updatedCurrent = {
          ...prev.currentUser,
          ...data,
          roles: newRoles,
          role: newActiveRole,
        };
      }

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrent,
      };
    });
    logAudit('ADMIN', 'ATUALIZAR_USUARIO', 'User', userId, undefined, JSON.stringify(data));
  };

  const deleteUser = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
    logAudit('ADMIN', 'EXCLUIR_USUARIO', 'User', userId, undefined, `Usuário ${userId} removido`);
  };

  const toggleUserStatus = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          logAudit('ADMIN', 'ALTERAR_STATUS_USUARIO', 'User', userId, u.status, nextStatus);
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    }));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    logAudit('ADMIN', 'ATUALIZAR_CONFIGURACOES', 'SystemSettings', 'global', undefined, JSON.stringify(newSettings));
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  /**
   * 9. SPREADSHEET MIGRATION TOOL (Google Sheets / Excel Import)
   * Suporta a Ordem Oficial de Colunas:
   * STUDENT ID | NAME | LEVEL | TELEPHONE | START DATE | AGE | Agu | Set | Oct | Nov | D/J | Feb | Mar | Apr | May | Jun | July | Total
   */
  const importStudentsBatch = (rows: any[]): number => {
    let count = 0;
    const currentStudents = [...state.students];
    const newStudentUsers: User[] = [];
    const newEnrollments: Enrollment[] = [...state.enrollments];
    const newCharges: Charge[] = [...state.charges];
    const newReceipts: PaymentReceipt[] = [...state.receipts];
    const newAccountingTxs: AccountingTransaction[] = [...state.accountingTransactions];

    rows.forEach((row) => {
      if (!row.name && !row.studentId) return;

      // Determine STU ID: use provided if available and not existing, else generate next
      let assignedStuId = '';
      if (row.studentId && row.studentId.trim()) {
        const cleanId = row.studentId.trim().toUpperCase();
        const alreadyExists = currentStudents.some((s) => s.studentId === cleanId);
        if (!alreadyExists) {
          assignedStuId = cleanId;
        } else {
          assignedStuId = generateNextStudentId(currentStudents);
        }
      } else {
        assignedStuId = generateNextStudentId(currentStudents);
      }

      const uniqueRand = Math.random().toString(36).substring(2, 7);
      const internalId = `stu_imp_${Date.now()}_${count}_${uniqueRand}`;
      const nowStr = new Date().toISOString().split('T')[0];

      const student: Student = {
        id: internalId,
        studentId: assignedStuId,
        name: row.name || `Aluno ${assignedStuId}`,
        email: row.email || `${assignedStuId.toLowerCase()}@student.thinkgreen.org`,
        phone: row.phone || '+20 10 0000 0000',
        level: row.level || 'Beginner',
        age: row.age ? Number(row.age) : undefined,
        startDate: row.startDate || '2026-08-01',
        rg: row.rg || row.rgDocument || row.documento || '',
        nationalId: row.nationalId || row.rg || '',
        birthDate: row.birthDate || (row.age ? `${2026 - Number(row.age)}-01-01` : ''),
        gender: row.gender || 'MASCULINO',
        city: row.city || 'Cairo',
        status: 'ATIVO',
        notes: `Importado de planilha em ${nowStr}. Nível: ${row.level || 'Padrão'}. Telefone: ${row.phone || 'N/A'}. Início: ${row.startDate || '01/08/2026'}.`,
        createdAt: nowStr,
        documents: [],
      };

      currentStudents.push(student);

      // Create student user account
      const studentUser: User = {
        id: `user_${internalId}`,
        name: student.name,
        email: student.email,
        studentId: assignedStuId,
        role: 'STUDENT',
        department: `Aluno - ${student.level || 'Geral'}`,
        status: 'ACTIVE',
        permissions: ['access_lms_student', 'submit_assignment', 'view_own_financials'],
        createdAt: nowStr,
      };
      newStudentUsers.push(studentUser);

      // Match course by level or default
      const matchedCourse =
        (row.courseId && state.courses.find((c) => c.id === row.courseId)) ||
        state.courses.find((c) =>
          row.level && c.name.toLowerCase().includes(row.level.toLowerCase())
        ) ||
        state.courses[0];

      const matchedClass =
        (row.classId && state.classes.find((cl) => cl.id === row.classId)) ||
        state.classes.find((cl) => cl.courseId === matchedCourse.id) ||
        state.classes[0];

      const installmentsCount = row.months && Array.isArray(row.months) ? row.months.length : 4;
      const totalPlanAmount = matchedCourse.monthlyFee * installmentsCount;

      const enrollment: Enrollment = {
        id: `enr_imp_${Date.now()}_${count}_${uniqueRand}`,
        studentId: assignedStuId,
        studentInternalId: internalId,
        studentName: student.name,
        courseId: matchedCourse.id,
        courseName: matchedCourse.name,
        classId: matchedClass.id,
        className: matchedClass.name,
        enrollmentDate: row.startDate || nowStr,
        status: 'ATIVA',
        paymentPlan: {
          installmentsCount,
          totalAmount: totalPlanAmount,
          installmentAmount: matchedCourse.monthlyFee,
        },
      };

      newEnrollments.push(enrollment);

      // Handle monthly charges & payments
      if (row.months && Array.isArray(row.months) && row.months.length > 0) {
        // Official 11-month columns (Agu, Set, Oct, Nov, D/J, Feb, Mar, Apr, May, Jun, July)
        row.months.forEach((m: any) => {
          const chargeId = `chg_${enrollment.id}_${m.installmentNumber}`;
          const isPaid = Boolean(m.isPaid);
          const amount = m.amount || matchedCourse.monthlyFee;
          const dueDate = m.dueDate || nowStr;

          let receiptNum: string | undefined = undefined;
          if (isPaid) {
            receiptNum = generateNextReceiptNumber(newReceipts);
            const receipt: PaymentReceipt = {
              id: `rec_imp_${chargeId}_${uniqueRand}`,
              receiptNumber: receiptNum,
              chargeId,
              studentId: assignedStuId,
              studentName: student.name,
              courseName: matchedCourse.name,
              amount,
              paymentMethod: 'DINHEIRO',
              installmentDescription: `Mensalidade ${m.label} (${m.fullName || m.label})`,
              date: dueDate,
              issuedBy: currentUser?.name || 'Sistema (Carga Inicial)',
              notes: `Recibo migrado de planilha para o mês de ${m.label}`,
            };
            newReceipts.push(receipt);

            // Create accounting revenue transaction
            const accountingTx: AccountingTransaction = {
              id: `acc_imp_${chargeId}_${uniqueRand}`,
              type: 'RECEITA',
              amount,
              date: dueDate,
              category: `Mensalidades (${m.label})`,
              costCenter: matchedCourse.name,
              description: `Recebimento Mensalidade ${m.label} - ${student.name} (${assignedStuId})`,
              relatedReceiptId: receipt.id,
              status: 'CONCILIADO',
              registeredBy: currentUser?.name || 'Sistema Migração',
            };
            newAccountingTxs.push(accountingTx);
          }

          const chargeStatus = isPaid ? 'PAGO' : (dueDate < nowStr ? 'EM ATRASO' : 'PENDENTE');

          newCharges.push({
            id: chargeId,
            enrollmentId: enrollment.id,
            studentId: assignedStuId,
            studentName: student.name,
            courseName: enrollment.courseName,
            installmentNumber: m.installmentNumber,
            totalInstallments: installmentsCount,
            amount,
            dueDate,
            status: chargeStatus,
            paidAmount: isPaid ? amount : undefined,
            paidAt: isPaid ? `${dueDate} 12:00` : undefined,
            paymentMethod: isPaid ? 'DINHEIRO' : undefined,
            receiptNumber: receiptNum,
            notes: `Mensalidade ${m.label}`,
          });
        });
      } else {
        // Fallback for simple rows with single paid flag or standard 4 installments
        for (let i = 1; i <= 4; i++) {
          const chargeId = `chg_${enrollment.id}_${i}`;
          const isFirstPaid = i === 1 && Boolean(row.paid);
          const d = new Date();
          d.setMonth(d.getMonth() + (i - 1));
          const due = d.toISOString().split('T')[0];

          newCharges.push({
            id: chargeId,
            enrollmentId: enrollment.id,
            studentId: assignedStuId,
            studentName: student.name,
            courseName: enrollment.courseName,
            installmentNumber: i,
            totalInstallments: 4,
            amount: matchedCourse.monthlyFee,
            dueDate: due,
            status: isFirstPaid ? 'PAGO' : 'PENDENTE',
            paidAmount: isFirstPaid ? matchedCourse.monthlyFee : undefined,
            paidAt: isFirstPaid ? `${nowStr} 12:00` : undefined,
          });
        }
      }

      count++;
    });

    setState((prev) => ({
      ...prev,
      students: deduplicateById(currentStudents),
      users: deduplicateById([...newStudentUsers, ...prev.users]),
      enrollments: deduplicateById(newEnrollments),
      charges: deduplicateById(newCharges),
      receipts: deduplicateById(newReceipts),
      accountingTransactions: deduplicateById(newAccountingTxs),
    }));

    logAudit(
      'ADMIN',
      'IMPORTACAO_PLANILHA',
      'BatchImport',
      `${count}_alunos`,
      undefined,
      `${count} alunos importados com ordem oficial de colunas e carnês de mensalidades gerados.`
    );
    return count;
  };

  const resetToDefaultData = () => {
    resetStoredAccountingData();
    resetStoredTeacherData();
    setState(loadInitialState());
  };

  /**
   * 10. REAL-TIME BUSINESS RULES CHECKS
   */
  const checkExamAccess = (studentId: string, assessment: Assessment) => {
    const stu = state.students.find((s) => s.studentId === studentId || s.id === studentId);
    if (stu && stu.systemAccess === 'BLOQUEADO') {
      return {
        allowed: false,
        reason: 'Acesso ao sistema e avaliações bloqueado pela secretaria acadêmica.',
        isFinancialBlock: false,
      };
    }
    return evaluateExamAccess(studentId, assessment, state.charges, state.settings);
  };

  const checkClassroomAccess = (studentId: string, classId: string) => {
    const stu = state.students.find((s) => s.studentId === studentId || s.id === studentId);
    if (stu && stu.systemAccess === 'BLOQUEADO') {
      return {
        allowed: false,
        reason: 'Acesso ao sistema e salas de aula bloqueado pela secretaria acadêmica.',
        isFinancialBlock: false,
      };
    }
    return evaluateClassroomAccess(studentId, classId, state.charges, state.enrollments, state.settings);
  };

  const contextValue = useMemo(
    () => ({
      state,
      currentUser,
      setCurrentUser,
      isAuthenticated,
      isAuthResolved,
      setIsAuthenticated,
      loginWithGoogle,
      loginWithEmail,
      sendPasswordReset,
      loginAsStudent,
      refreshCurrentUser,
      logout,
      switchRole,
      createStudentWithEnrollment,
      updateStudent,
      addEnrollmentToStudent,
      renegotiateEnrollmentPlan,
      updateEnrollmentStatus,
      addStudentDocument,
      deleteStudentDocument,
      registerPayment,
      createPendingPayment,
      approvePendingPayment,
      rejectPendingPayment,
      deletePendingPayment,
      createPendingRegistration,
      approvePendingRegistration,
      rejectPendingRegistration,
      updatePendingRegistration,
      deletePendingRegistration,
      openCashRegister,
      closeCashRegister,
      addCashMovement,
      saveAttendance,
      saveGrade,
      saveBatchGrades,
      createAssessment,
      updateAssessment,
      deleteAssessment,
      createClass,
      updateClass,
      deleteClass,
      toggleFinalGradeRelease,
      assignTeacherToClass,
      unassignTeacherFromClass,
      updateCourse,
      updateCourseFee,
      createLesson,
      deleteLesson,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submitAssignment,
      gradeSubmission,
      markSubmissionSeen,
      markManualStudentSubmission,
      createAccountingTransaction,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      updateSettings,
      markNotificationRead,
      markAllNotificationsRead,
      importStudentsBatch,
      resetToDefaultData,
      checkExamAccess,
      checkClassroomAccess,
    }),
    [state, currentUser, isAuthenticated, isAuthResolved]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
