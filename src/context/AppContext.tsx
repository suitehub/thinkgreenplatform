import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
} from '../types';

import {
  AppState,
  loadInitialState,
  saveStateToLocalStorage,
  generateNextStudentId,
  generateNextReceiptNumber,
  evaluateExamAccess,
  evaluateClassroomAccess,
  deduplicateById,
  STORAGE_KEY,
} from '../lib/storage';

interface AppContextType {
  state: AppState;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: (identifier?: string, password?: string) => { success: boolean; user?: User; message?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchUserById: (userId: string) => void;

  // Domain Actions
  createStudentWithEnrollment: (
    studentData: Partial<Student>,
    courseId: string,
    classId: string,
    installmentsCount: number
  ) => { student: Student; enrollment: Enrollment };

  updateStudent: (studentId: string, data: Partial<Student>) => void;
  addEnrollmentToStudent: (studentId: string, courseId: string, classId: string, installmentsCount: number) => Enrollment;
  updateEnrollmentStatus: (enrollmentId: string, status: Enrollment['status']) => void;
  addStudentDocument: (studentId: string, doc: Omit<StudentDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => StudentDocument;
  deleteStudentDocument: (studentId: string, docId: string) => void;

  registerPayment: (
    chargeId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => PaymentReceipt;

  openCashRegister: (initialBalance: number, notes?: string) => CashRegister;
  closeCashRegister: (countedBalance: number, notes?: string) => CashRegister;
  addCashMovement: (type: 'ENTRADA' | 'SAIDA', category: string, amount: number, description: string) => void;

  saveAttendance: (classId: string, date: string, records: AttendanceRecord['students'], notes?: string) => void;
  saveGrade: (assessmentId: string, studentId: string, score: number, feedback?: string) => Grade;
  saveBatchGrades: (assessmentId: string, grades: { studentId: string; score: number; feedback?: string }[]) => void;
  createAssessment: (data: Omit<Assessment, 'id'>) => Assessment;
  deleteAssessment: (assessmentId: string) => void;

  createClass: (data: Omit<ClassRoom, 'id'>) => ClassRoom;
  updateClass: (classId: string, data: Partial<ClassRoom>) => void;
  deleteClass: (classId: string) => void;
  assignTeacherToClass: (classId: string, teacherId: string, teacherName: string) => void;
  unassignTeacherFromClass: (classId: string) => void;
  updateCourse: (courseId: string, data: Partial<Course>) => void;
  updateCourseFee: (courseId: string, newMonthlyFee: number, updateUnpaidCharges?: boolean) => void;
  createLesson: (data: Omit<Lesson, 'id'>) => Lesson;
  deleteLesson: (lessonId: string) => void;
  createAssignment: (data: Omit<Assignment, 'id'>) => Assignment;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadInitialState());

  // Save to localStorage on state changes
  useEffect(() => {
    saveStateToLocalStorage(state);
  }, [state]);

  const currentUser = state.currentUser;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('think_green_auth_session');
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const setCurrentUser = (user: User) => {
    setState((prev) => ({ ...prev, currentUser: user }));
  };

  const login = (identifier?: string, password?: string) => {
    const query = (identifier || '').trim().toLowerCase();

    // 1. If empty query, log in with current user / Super Admin
    if (!query) {
      const user = state.currentUser || state.users[0];
      setCurrentUser(user);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('think_green_auth_session', 'true');
      } catch {}
      return { success: true, user, message: `Bem-vindo(a), ${user.name}!` };
    }

    // 2. Direct match by email, id, studentId, or partial name
    let matchedUser = state.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        u.id.toLowerCase() === query ||
        (u.studentId && u.studentId.toLowerCase() === query) ||
        u.name.toLowerCase() === query
    );

    // Partial name match in users
    if (!matchedUser) {
      matchedUser = state.users.find((u) => u.name.toLowerCase().includes(query));
    }

    // 3. Match from student registry if student logging in with STU ID / email / name
    if (!matchedUser) {
      const student = state.students.find(
        (s) =>
          s.studentId.toLowerCase() === query ||
          s.email.toLowerCase() === query ||
          s.name.toLowerCase().includes(query)
      );
      if (student) {
        matchedUser = {
          id: `user_student_${student.id}`,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          role: 'STUDENT',
          department: 'Aluno Think Green',
          status: student.status === 'ATIVO' ? 'ACTIVE' : 'INACTIVE',
          permissions: ['access_lms_student', 'submit_assignment', 'view_own_financials'],
          createdAt: student.createdAt,
          avatarUrl: student.avatarUrl,
        };
      }
    }

    // 4. Role keyword shortcuts
    if (!matchedUser) {
      if (query.includes('admin') || query.includes('ricky') || query.includes('diretor') || query.includes('super')) {
        matchedUser = state.users.find((u) => u.role === 'SUPER_ADMIN');
      } else if (query.includes('sec') || query.includes('mona') || query.includes('atend')) {
        matchedUser = state.users.find((u) => u.role === 'SECRETARIAT');
      } else if (query.includes('fin') || query.includes('karim') || query.includes('tesour')) {
        matchedUser = state.users.find((u) => u.role === 'FINANCE');
      } else if (query.includes('cont') || query.includes('hisham')) {
        matchedUser = state.users.find((u) => u.role === 'ACCOUNTING');
      } else if (query.includes('prof') || query.includes('lucas') || query.includes('docen') || query.includes('tarek')) {
        matchedUser = state.users.find((u) => u.role === 'TEACHER');
      } else if (query.includes('alun') || query.includes('stu') || query.includes('ahmed') || query.includes('estud')) {
        matchedUser = state.users.find((u) => u.role === 'STUDENT');
      }
    }

    // Fallback: Default to first active super admin user
    if (!matchedUser) {
      matchedUser = state.currentUser || state.users[0];
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('think_green_auth_session', 'true');
    } catch {}

    return { success: true, user: matchedUser, message: `Bem-vindo(a), ${matchedUser.name}!` };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('think_green_auth_session');
    } catch {}
  };

  const switchRole = (role: UserRole) => {
    const targetUser = state.users.find((u) => u.role === role) || {
      id: `temp_${role.toLowerCase()}`,
      name: `Usuário ${role}`,
      email: `${role.toLowerCase()}@thinkgreen.org`,
      role,
      status: 'ACTIVE',
      permissions: ['*'],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCurrentUser(targetUser);
  };

  const switchUserById = (userId: string) => {
    const found = state.users.find((u) => u.id === userId);
    if (found) setCurrentUser(found);
  };

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
    installmentsCount: number = 4
  ) => {
    const generatedStuId = generateNextStudentId(state.students);
    const uniqueRand = Math.random().toString(36).substring(2, 8);
    const internalId = `stu_${Date.now()}_${uniqueRand}`;
    const course = state.courses.find((c) => c.id === courseId);
    const classRoom = state.classes.find((cl) => cl.id === classId);

    const nowStr = new Date().toISOString().split('T')[0];

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
      documents: [],
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

    // Create Enrollment
    const totalAmount = course ? course.monthlyFee * installmentsCount : 500 * installmentsCount;
    const installmentAmount = totalAmount / installmentsCount;

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
        totalAmount,
        installmentAmount,
      },
    };

    // Auto-generate Charges for all installments
    const newCharges: Charge[] = [];
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
        notes: `Parcela ${i}/${installmentsCount} gerada na matrícula inicial.`,
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
   * 2. UPDATE STUDENT
   */
  const updateStudent = (studentId: string, data: Partial<Student>) => {
    setState((prev) => {
      const updatedStudents = prev.students.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, ...data } : s));
      return { ...prev, students: updatedStudents };
    });
    logAudit('SECRETARIAT', 'ATUALIZAR_ALUNO', 'Student', studentId, 'Dados Anteriores', JSON.stringify(data));
  };

  /**
   * 3. ADD EXTRA ENROLLMENT TO EXISTING STUDENT (1 Aluno -> N Matrículas)
   */
  const addEnrollmentToStudent = (studentId: string, courseId: string, classId: string, installmentsCount: number = 4) => {
    const student = state.students.find((s) => s.studentId === studentId || s.id === studentId);
    if (!student) throw new Error('Aluno não encontrado');

    const course = state.courses.find((c) => c.id === courseId);
    const classRoom = state.classes.find((cl) => cl.id === classId);
    const nowStr = new Date().toISOString().split('T')[0];
    const uniqueRand = Math.random().toString(36).substring(2, 8);

    const totalAmount = course ? course.monthlyFee * installmentsCount : 500 * installmentsCount;
    const installmentAmount = totalAmount / installmentsCount;

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
        totalAmount,
        installmentAmount,
      },
    };

    const newCharges: Charge[] = [];
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
      `Nova matrícula vinculada ao mesmo ID Student.`
    );

    return newEnrollment;
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

  const updateCourseFee = (courseId: string, newMonthlyFee: number, updateUnpaidCharges: boolean = false) => {
    const existing = state.courses.find((c) => c.id === courseId);
    if (!existing) return;

    const oldFee = existing.monthlyFee;

    setState((prev) => {
      const updatedCourses = prev.courses.map((c) =>
        c.id === courseId ? { ...c, monthlyFee: newMonthlyFee } : c
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
      `Mensalidade do curso ${existing.name} alterada de ${oldFee} EGP para ${newMonthlyFee} EGP pela Secretaria.${
        updateUnpaidCharges ? ' (Aplicado a cobranças pendentes futuras)' : ' (Aplicado a novas matrículas)'
      }`
    );

    addNotification(
      'Mensalidade Atualizada!',
      `A mensalidade do curso "${existing.name}" foi alterada para ${newMonthlyFee} EGP.`,
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
    const newUser: User = {
      ...data,
      id: `usr_${Date.now()}_${uniqueRand}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: data.status || 'ACTIVE',
      permissions: data.permissions || ['*'],
    };
    setState((prev) => ({
      ...prev,
      users: deduplicateById([...prev.users, newUser]),
    }));
    logAudit('ADMIN', 'CRIAR_USUARIO', 'User', newUser.id, undefined, `${newUser.name} (${newUser.role}) - ${newUser.email}`);
    return newUser;
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((u) => (u.id === userId ? { ...u, ...data } : u));
      return {
        ...prev,
        users: updatedUsers,
        currentUser: prev.currentUser.id === userId ? { ...prev.currentUser, ...data } : prev.currentUser,
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
    localStorage.removeItem(STORAGE_KEY);
    setState(loadInitialState());
  };

  /**
   * 10. REAL-TIME BUSINESS RULES CHECKS
   */
  const checkExamAccess = (studentId: string, assessment: Assessment) => {
    return evaluateExamAccess(studentId, assessment, state.charges, state.settings);
  };

  const checkClassroomAccess = (studentId: string, classId: string) => {
    return evaluateClassroomAccess(studentId, classId, state.charges, state.enrollments, state.settings);
  };

  const contextValue = useMemo(
    () => ({
      state,
      currentUser,
      setCurrentUser,
      isAuthenticated,
      setIsAuthenticated,
      login,
      logout,
      switchRole,
      switchUserById,
      createStudentWithEnrollment,
      updateStudent,
      addEnrollmentToStudent,
      updateEnrollmentStatus,
      addStudentDocument,
      deleteStudentDocument,
      registerPayment,
      openCashRegister,
      closeCashRegister,
      addCashMovement,
      saveAttendance,
      saveGrade,
      saveBatchGrades,
      createAssessment,
      deleteAssessment,
      createClass,
      updateClass,
      deleteClass,
      assignTeacherToClass,
      unassignTeacherFromClass,
      updateCourse,
      updateCourseFee,
      createLesson,
      deleteLesson,
      createAssignment,
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
    [state, currentUser, isAuthenticated]
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
