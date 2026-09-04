/**
 * Think Green Platform - Type Definitions
 * Sistema Integrado de Gestão do Think Green Community Center (Egypt)
 */

export type UserRole =
  | 'STUDENT'
  | 'TEACHER'
  | 'FINANCE'
  | 'SECRETARIAT'
  | 'ACCOUNTING'
  | 'SUPER_ADMIN';

export type StudentStatus = 'ATIVO' | 'INATIVO' | 'ENCERRADO';
export type EnrollmentStatus = 'ATIVA' | 'PENDENTE' | 'BLOQUEADA' | 'CANCELADA';
export type FinancialStatus = 'REGULAR' | 'PENDENTE' | 'EM ATRASO' | 'PAGO' | 'CANCELADO';
export type AssessmentStatus = 'LIBERADA' | 'BLOQUEADA' | 'CONCLUÍDA';
export type PaymentMethod = 'DINHEIRO' | 'INSTAPAY_EG' | 'CARTAO' | 'TRANSFERENCIA' | 'VOUCHER';
export type CashRegisterStatus = 'ABERTO' | 'FECHADO';
export type AssessmentType = 'PROVA_1' | 'PROVA_FINAL' | 'TRABALHO' | 'QUIZ' | 'PARTICIPACAO';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string; // STU00000 for students
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: string[];
  createdAt: string;
}

export interface Student {
  id: string; // Internal unique ID
  studentId: string; // STU00000 unique permanent identifier
  name: string;
  email: string;
  phone: string;
  level?: string; // Nível acadêmico (ex: Beginner, Intermediate, Kids, Level 1)
  age?: number; // Idade do aluno
  startDate?: string; // Data de início / matrícula
  rg?: string; // Registro Geral (RG) / Documento de Identidade
  nationalId?: string; // Documento de Identidade Nacional / Passaporte
  birthDate?: string; // Data de nascimento (YYYY-MM-DD)
  gender?: 'MASCULINO' | 'FEMININO' | 'OUTRO' | string; // Gênero
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  city: string; // e.g. Cairo, Giza, Alexandria
  status: StudentStatus;
  notes?: string;
  createdAt: string;
  avatarUrl?: string;
  documents: StudentDocument[];
}

export interface StudentDocument {
  id: string;
  title: string;
  type: 'ID_CARD' | 'REGISTRATION_FORM' | 'PAYMENT_PROOF' | 'MEDICAL' | 'OTHER';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  category: 'ENGLISH' | 'PRESCHOOL' | 'FOOTBALL' | 'WOMENS_FITNESS' | 'OTHER';
  description: string;
  color: string;
  monthlyFee: number; // in EGP
  totalHours: number;
  isActive: boolean;
}

export interface ClassRoom {
  id: string;
  courseId: string;
  name: string; // e.g. "Inglês Básico - Turma A"
  code: string; // e.g. "ENG-101-A"
  teacherId: string;
  teacherName: string;
  schedule: string; // e.g. "Segunda e Quarta, 18:00 - 19:30"
  room: string; // e.g. "Sala 02 - Bloco A"
  maxCapacity: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
}

export interface Enrollment {
  id: string;
  studentId: string; // STU00000
  studentInternalId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  paymentPlan: {
    installmentsCount: number;
    totalAmount: number; // in EGP
    installmentAmount: number; // in EGP
    discountPercent?: number;
  };
}

export interface Charge {
  id: string;
  enrollmentId: string;
  studentId: string; // STU00000
  studentName: string;
  courseName: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number; // in EGP
  dueDate: string;
  status: FinancialStatus;
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  registeredBy?: string;
  notes?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // e.g. REC-2026-00124
  chargeId: string;
  studentId: string; // STU00000
  studentName: string;
  courseName: string;
  amount: number; // in EGP
  paymentMethod: PaymentMethod;
  installmentDescription: string;
  date: string;
  issuedBy: string;
  notes?: string;
}

export interface CashRegister {
  id: string;
  operatorId: string;
  operatorName: string;
  openingDate: string;
  closingDate?: string;
  initialBalance: number; // in EGP
  totalIn: number;
  totalOut: number;
  expectedBalance: number;
  countedBalance?: number;
  difference?: number;
  status: CashRegisterStatus;
  notes?: string;
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: 'ENTRADA' | 'SAIDA';
  category: string;
  amount: number; // in EGP
  description: string;
  relatedPaymentReceipt?: string;
  timestamp: string;
  operatorName: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  lessonId?: string;
  date: string;
  teacherId: string;
  teacherName: string;
  students: {
    studentId: string; // STU00000
    studentName: string;
    present: boolean;
    justified?: boolean;
    note?: string;
  }[];
  notes?: string;
  savedAt: string;
}

export interface Lesson {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  date: string;
  teacherId: string;
  teacherName: string;
  videoUrl?: string;
  materials: {
    id: string;
    title: string;
    type: 'PDF' | 'LINK' | 'DOC' | 'AUDIO';
    url: string;
    size?: string;
  }[];
  assignmentId?: string;
}

export interface Assessment {
  id: string;
  classId: string;
  className: string;
  courseName: string;
  title: string;
  type: AssessmentType;
  date: string;
  time?: string;
  maxScore: number;
  weight: number;
  requiredPaymentStage: 'STAGE_1_PAID' | 'STAGE_2_PAID' | 'STAGE_FINAL_PAID' | 'NONE';
  description?: string;
  content?: string; // Conteúdo programático e tópicos cobrados
  instructions?: string; // Instruções e critérios de avaliação
  status?: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA';
}

export interface Grade {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  classId: string;
  studentId: string; // STU00000
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  gradedAt: string;
  gradedBy: string;
}

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  teacherName: string;
  attachmentUrl?: string;
  category?: 'REDACAO' | 'EXERCICIO' | 'PROJETO' | 'DIARIO' | 'PRATICA';
  deliveryMethod?: 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';
  createdAt?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string; // STU00000
  studentName: string;
  submissionText: string;
  attachmentName?: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: 'PENDENTE_CORRECAO' | 'AVALIADO' | 'VISTO';
  score?: number;
  maxScore?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  deliveryMethod?: 'ONLINE' | 'PRESENCIAL';
}

export interface AccountingTransaction {
  id: string;
  type: 'RECEITA' | 'DESPESA';
  amount: number; // in EGP
  date: string;
  category: string;
  costCenter: string;
  description: string;
  relatedReceiptId?: string;
  status: 'CONCILIADO' | 'PENDENTE';
  registeredBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  module: 'SECRETARIAT' | 'FINANCE' | 'ACADEMIC' | 'ACCOUNTING' | 'LMS' | 'ADMIN' | 'AUTH';
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
}

export interface SystemNotification {
  id: string;
  userId?: string; // Specific user or target role
  targetRole?: UserRole | 'ALL';
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
  timestamp: string;
  read: boolean;
}

export interface SystemSettings {
  centerName: string;
  location: string;
  currencySymbol: string; // "EGP" or "E£" or "L.E."
  currencyCode: string; // "EGP"
  enableAutomaticExamGates: boolean;
  enableAutomaticClassroomGates: boolean;
  minimumPassingGrade: number; // e.g. 60
  attendanceRequirementPercent: number; // e.g. 75
  rulesConfig: {
    rule1_classroomRequiresFirstPayment: boolean;
    rule2_exam1RequiresSecondPayment: boolean;
    rule3_finalExamRequiresFullPayment: boolean;
  };
}
