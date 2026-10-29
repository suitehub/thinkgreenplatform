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
  | 'SUPER_ADMIN'
  | 'RECEPTION';

export type StudentStatus = 'ATIVO' | 'INATIVO';
export type EnrollmentStatus = 'ATIVA' | 'PENDENTE' | 'BLOQUEADA' | 'CANCELADA';
export type FinancialStatus = 'REGULAR' | 'PENDENTE' | 'EM ATRASO' | 'PAGO' | 'CANCELADO';
export type AssessmentStatus = 'LIBERADA' | 'BLOQUEADA' | 'CONCLUÍDA';
export type PaymentMethod = 'DINHEIRO' | 'TRANSFERENCIA';
export type CashRegisterStatus = 'ABERTO' | 'FECHADO';
export type AssessmentType = 'PROVA_1' | 'PROVA_FINAL' | 'TRABALHO' | 'QUIZ' | 'PARTICIPACAO';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string; // STU00000 for students
  role: UserRole; // Current active/primary role
  roles?: UserRole[]; // All linked roles for this user (e.g. ['SUPER_ADMIN', 'TEACHER'])
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
  email?: string;
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
  city?: string; // e.g. Cairo, Giza, Alexandria
  status: StudentStatus;
  systemAccess?: 'LIBERADO' | 'BLOQUEADO'; // Acesso ao sistema (Liberado / Bloqueado)
  notes?: string;
  createdAt: string;
  avatarUrl?: string;
  documentPhotoUrl?: string; // Foto anexada do RG/ID
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

export type EnglishAudienceLevel = 'CRIANCAS' | 'ADOLESCENTES' | 'ADULTO';

export interface CourseLevelPricing {
  level: EnglishAudienceLevel;
  label: string;
  targetAudience: string;
  defaultInstallments: number;
  defaultInstallmentsCount?: number;
  totalAmount: number;
  totalCourseAmount?: number;
  installmentAmount: number;
  description?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  category: 'ENGLISH' | 'PRESCHOOL' | 'FOOTBALL' | 'WOMENS_FITNESS' | 'OTHER';
  description: string;
  color: string;
  totalCourseAmount?: number; // Valor Inteiro do Curso
  defaultInstallmentsCount?: number; // Quantidade de parcelas sugerida
  monthlyFee: number; // in EGP (mensalidade base/parcela de referência)
  totalHours: number;
  isActive: boolean;
  levels?: CourseLevelPricing[]; // 3 Níveis exclusivos para o Curso Livre de Inglês (Crianças, Adolescentes, Adulto)
}

export type AssessmentTemplateLevel =
  | 'ADULT_A1'
  | 'ADULT_A2'
  | 'ADULT_B1'
  | 'ADULT_B2_C1'
  | 'TEENAGERS'
  | 'KIDS_LB_LG'
  | 'CUSTOM';

export interface ClassAssessmentItem {
  id: string;
  name: string;
  weight: number; // Porcentagem do peso (ex: 10, 30, 50)
  type: string; // 'ATTENDANCE' | 'WORKBOOK' | 'HOMEWORK' | 'ORAL_EXAM' | 'UNIT_TESTS' | 'MIDTERM' | 'FINAL' | 'CUSTOM'
  description?: string;
  unitTestsCount?: number;
  unitTestWeightEach?: number;
}

export interface ClassRoom {
  id: string;
  courseId: string;
  courseName?: string;
  name: string; // e.g. "Inglês Básico - Turma A"
  code: string; // e.g. "ENG-101-A"
  teacherId: string;
  teacherName: string;
  schedule: string; // e.g. "Segunda e Quarta, 18:00 - 19:30"
  room: string; // e.g. "Sala 02 - Bloco A"
  maxCapacity?: number;
  capacity?: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | string;
  assessmentTemplate?: AssessmentTemplateLevel;
  assessmentConfig?: ClassAssessmentItem[];
  isFinalGradeReleased?: boolean; // Controle de liberação da média final pelo professor
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
    totalAmount: number; // in EGP (valor total final após negociação/desconto)
    installmentAmount: number; // in EGP (valor de cada parcela)
    originalTotalAmount?: number; // in EGP (valor inteiro antes do desconto)
    englishLevel?: EnglishAudienceLevel; // 'CRIANCAS' | 'ADOLESCENTES' | 'ADULTO'
    discountType?: 'NONE' | 'PERCENT' | 'FIXED';
    discountValue?: number;
    discountReason?: string;
    discountPercent?: number;
    isNegotiated?: boolean;
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
    homeworkStatus?: 'completed' | 'not_completed' | 'no_homework';
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

export interface PendingRegistration {
  id: string; // e.g. 'pre_1741384000_abc'
  protocolNumber: string; // e.g. 'PRE-2026-0001'
  name: string;
  birthDate?: string;
  gender?: 'MASCULINO' | 'FEMININO' | 'OUTRO' | string;
  rg?: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
  documentPhotoUrl?: string; // Foto anexada do RG/ID pela Recepção/Secretaria

  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  monthlyFee: number;

  installmentsCount: number;
  englishLevel?: EnglishAudienceLevel;
  originalTotal?: number;
  discountType?: 'PERCENT' | 'FIXED' | 'NONE';
  discountValue?: number; // e.g. 15 (%) or 100 (EGP)
  discountReason?: string; // Observation explaining why discount was given
  finalTotal: number;

  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  createdByRole: 'RECEPTION' | 'SECRETARIAT';
  createdByName: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  generatedStudentId?: string; // Filled once approved by Secretariat
}

export interface PendingPayment {
  id: string; // e.g. 'pre_pay_1741384000_abc'
  protocolNumber: string; // e.g. 'PAG-2026-0001'
  provisionalReceiptNumber: string; // e.g. 'REC-PROV-2026-0001'
  chargeId: string;
  studentId: string; // STU00000
  studentName: string;
  courseName: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number; // in EGP
  paymentMethod: PaymentMethod;
  receptionNotes?: string;
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  registeredBy: string; // Name and role of reception clerk
  registeredAt: string; // YYYY-MM-DD HH:MM
  
  // Treasury review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  officialReceiptNumber?: string;
  officialReceiptId?: string;
}

export type DidacticMaterialType = 'PDF' | 'DRIVE' | 'VIDEO' | 'GOOGLE_DRIVE' | 'VIDEO_LINK';

export interface DidacticMaterial {
  id: string;
  classId: string;
  className?: string;
  topicId?: string;
  title: string;
  description?: string;
  type: DidacticMaterialType;
  url: string; // File URL, Google Drive link, or YouTube/video embed link
  fileName?: string;
  fileSize?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
}

export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE' | 'FILL_BLANK';

export interface QuizQuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  prompt?: string;
  type: QuizQuestionType;
  options?: QuizQuestionOption[]; // Para MULTIPLE_CHOICE
  correctOptionId?: string; // Para auto-correção de MULTIPLE_CHOICE
  correctBooleanAnswer?: boolean; // Para TRUE_FALSE
  correctBlankAnswer?: string; // Para FILL_BLANK
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  classId: string;
  className?: string;
  topicId?: string;
  title: string;
  description?: string;
  instructions?: string;
  audioUrl?: string; // Áudio anexado/link para listening comprehension
  audioTitle?: string;
  questions: QuizQuestion[];
  totalPoints: number;
  timeLimitMinutes?: number;
  dueDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle?: string;
  classId?: string;
  studentId: string;
  studentName: string;
  answers:
    | {
        [questionId: string]: {
          selectedOptionId?: string;
          booleanAnswer?: boolean;
          textAnswer?: string;
          isCorrect?: boolean;
          scoreEarned?: number;
        };
      }
    | Array<{
        questionId: string;
        answer: string | string[];
        isCorrect?: boolean;
      }>;
  totalScoreEarned?: number;
  score?: number;
  maxScore: number;
  percentage?: number;
  submittedAt: string;
  status?: 'AVALIADO' | 'PENDENTE_CORRECAO';
  feedback?: string;
  teacherFeedback?: string;
}

export interface GeneralAnnouncement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  targetRole?: 'ALL' | 'STUDENT' | 'TEACHER';
  targetAudience?: string;
  pinned?: boolean;
  priority?: 'HIGH' | 'NORMAL' | 'URGENT' | 'IMPORTANT';
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

// =========================================================================
// PLANO DE AULA (LESSON PLAN) BASEADO NA PLANILHA EXCEL DE REFERÊNCIA
// =========================================================================
export interface ClassLessonPlan {
  id: string;
  classId: string;
  className?: string;
  teacherId?: string;
  teacherName?: string;
  date: string; // e.g. "2026-08-18" ou "ago 18 (ter)"
  dateDisplay?: string; // e.g. "ago 18 (ter)"
  dateFormatted?: string; // e.g. "18 de Agosto de 2026 (Terça-feira)"
  
  // 8 colunas/dimensões da planilha Excel oficial:
  unitContent: string; // Unit Content: Describe the unit content from the book (ex: Let's Go Student Book, p. 4-6, etc.)
  handwriting: string; // Handwriting: Worksheet used in class, Handwriting Book pages (ex: Handwriting Book p.10-11.pdf)
  reading: string; // Reading: Reading text, dialogue, textbook text used in class
  writing: string; // Writing: Spelling exercises, grammar worksheet used in class
  speakingTime: string; // Speaking Time: Interactive activities with details
  homework: string; // Homework: Workbook pages (ex: Workbook p.11)
  materials: string; // Materials: Necessary materials (slides, worksheets, papers, colored pencils, crayons, books)
  observations: string; // Observations: Other activities, incidents, special needs, tests
  
  status: 'PLANEJADA' | 'MINISTRADA' | 'EM_ANDAMENTO';
  createdAt?: string;
  updatedAt?: string;
}

// =========================================================================
// MÓDULO DE CONTABILIDADE & GASTOS — THINK GREEN COMMUNITY CENTER
// =========================================================================

// As 3 Grandes Macroáreas do Rony
export type AccountingMacroArea = 'LIXO' | 'PRE_ESCOLA' | 'CENTRO_COMUNITARIO';

// Subáreas / Categorias Detalhadas de Recebimento
export type RevenueSubArea =
  | 'CURSO_INGLES' // Crianças 4 meses, Adolescentes 3 meses (2.000 EGP editável)
  | 'PRE_ESCOLA' // Máx 2 vezes ou anual/semestral 9.000 EGP
  | 'ACADEMIA_GINASTICA' // Academia e Aula de Ginástica (mesma categoria)
  | 'AULAS_FUTEBOL' // Aulas de Futebol Sub-15
  | 'CANTINA' // Vendas da cantina
  | 'VENDA_LIXO' // Reciclagem / Venda de lixo
  | 'ALUGUEL_CAMPO_PINGPONG' // Aluguel de campo de futebol e mesa de ping pong
  | 'SUMMER_CAMPING' // Acampamento de verão / colônia
  | 'OUTROS'; // Outras receitas comunitárias

export interface AccountingRevenue {
  id: string;
  receiptNumber?: string;
  date: string; // YYYY-MM-DD
  month: string; // e.g. "01", "02", ..., "12"
  year: number; // e.g. 2025, 2026
  macroArea: AccountingMacroArea; // 'LIXO' | 'PRE_ESCOLA' | 'CENTRO_COMUNITARIO'
  subArea: RevenueSubArea;
  title: string;
  description?: string;
  amount: number; // in EGP (editável)
  payerName?: string;
  installmentsInfo?: string; // ex: "Parcela 2 de 3 (Adolescente)" ou "Semestre 1 (9.000 EGP)"
  paymentMethod: PaymentMethod;
  registeredBy: string;
  status: 'CONFIRMADO' | 'PENDENTE' | 'ESTORNADO';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Orçamentos / Budget Menu da planilha de gastos do Rony (image_813704e7.png)
export type ExpenseBudget = 'General' | 'Preschool' | 'Community' | 'Recycle' | 'Outreach';

// 28 Categorias de Orçamento da Planilha Oficial (image_813704e7.png)
export type ExpenseCategory =
  | "Translator's transportation"
  | 'ESF - AM Training'
  | 'Internet'
  | 'Mobile phone'
  | 'Arabic classes'
  | 'Computer'
  | 'Toner'
  | 'Ink for printer'
  | 'Electricity area TG / Volunteers houses'
  | 'Cleaning Supplies'
  | 'Maintenance Area TG / Volunteers houses'
  | 'Expenses and additional costs (General)'
  | 'Flowers and Trees'
  | 'Tools and equipment'
  | 'Gasoline (Motorcycle)'
  | 'Diesel (Loader)'
  | 'Maintenance (Loader and Motorcycle)'
  | 'Painting Supplies'
  | 'Expenses and additional costs (Recycle)'
  | 'Preschool Materials (books and educatio'
  | 'School supplements / cleaning'
  | 'Staff training'
  | 'Expenses and additional costs (Preschoo'
  | 'Books and materials - English'
  | 'Supplies for Soccer class / GYM'
  | 'Worker'
  | 'Expenses and additional costs (Communi'
  | 'Events, Outreach, and church planting act'
  | 'Volunteers Outreach'
  | string;

// Item individual da Planilha de Gastos Oficial do Rony (image_813704e7.png)
export interface AccountingExpenseItem {
  id: string;
  receiptNumber: number; // Receipt # (1, 2, 3...)
  date: string; // DD/MM/YYYY ou YYYY-MM-DD
  product: string; // Descrição do produto ou serviço
  price: number; // Price (EGP)
  budget: ExpenseBudget; // General, Preschool, Community, Recycle, Outreach
  category: ExpenseCategory; // Categoria da lista
  paidTo?: string; // Beneficiário / Fornecedor / Reembolsado
  sourceReportId?: string; // Vinculado a um Expense Report se originado de reembolso
  notes?: string;
  receiptPhotoUrl?: string; // Comprovante / Foto anexada
  createdAt?: string;
}

// Item de linha do Expense Report Template (Expense_Report_Template_6710de3e.pdf)
export interface ExpenseReportLineItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  date: string; // DD/MM/YYYY ou YYYY-MM-DD
  amount: number; // in EGP
}

// Relatório de Reembolso do Funcionário / Voluntário (Expense_Report_Template_6710de3e.pdf)
export interface StaffExpenseReport {
  id: string;
  reportCode: string; // e.g. "EXP-2026-001"
  userId: string;
  fullName: string; // Full name do funcionário/voluntário
  userEmail?: string;
  event: string; // Event / Finalidade do gasto
  date: string; // Data do relatório
  items: ExpenseReportLineItem[];
  totalAmount: number; // Soma automática dos itens em EGP
  receiptPhotoUrl?: string; // Foto do comprovante anexada (opção de tirar foto / upload)
  signatureName?: string; // Payment received / Signature
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  reviewedBy?: string; // Rony ou responsável contábil
  reviewedAt?: string;
  reviewNotes?: string;
  assignedExpenseReceipts?: number[]; // IDs dos recibos gerados na planilha de gastos ao aprovar
  createdAt: string;
  updatedAt?: string;
}




