/**
 * Think Green Platform - Spreadsheet Migration & Parser
 * Ordem Oficial das Colunas do Centro Comunitário Think Green (Cairo):
 * STUDENT ID | NAME | LEVEL | TELEPHONE | START DATE | AGE | [BLANK] | Agu | Set | Oct | Nov | D/J | Feb | Mar | Apr | May | Jun | July | Total
 */

export interface MonthPaymentDef {
  key: string;
  label: string; // Ex: Agu, Set, Oct, Nov, D/J, Feb, Mar, Apr, May, Jun, July
  fullName: string;
  installmentNumber: number;
  dueDate: string;
  defaultFee: number;
}

export const ACADEMIC_MONTHS_MAP: MonthPaymentDef[] = [
  { key: 'agu', label: 'Agu', fullName: 'Agosto (1ª Mensalidade)', installmentNumber: 1, dueDate: '2026-08-10', defaultFee: 500 },
  { key: 'set', label: 'Set', fullName: 'Setembro (2ª Mensalidade)', installmentNumber: 2, dueDate: '2026-09-10', defaultFee: 500 },
  { key: 'oct', label: 'Oct', fullName: 'Outubro (3ª Mensalidade)', installmentNumber: 3, dueDate: '2026-10-10', defaultFee: 500 },
  { key: 'nov', label: 'Nov', fullName: 'Novembro (4ª Mensalidade)', installmentNumber: 4, dueDate: '2026-11-10', defaultFee: 500 },
  { key: 'dj', label: 'D/J', fullName: 'Dezembro / Janeiro (5ª Mensalidade)', installmentNumber: 5, dueDate: '2026-12-10', defaultFee: 500 },
  { key: 'feb', label: 'Feb', fullName: 'Fevereiro (6ª Mensalidade)', installmentNumber: 6, dueDate: '2027-02-10', defaultFee: 500 },
  { key: 'mar', label: 'Mar', fullName: 'Março (7ª Mensalidade)', installmentNumber: 7, dueDate: '2027-03-10', defaultFee: 500 },
  { key: 'apr', label: 'Apr', fullName: 'Abril (8ª Mensalidade)', installmentNumber: 8, dueDate: '2027-04-10', defaultFee: 500 },
  { key: 'may', label: 'May', fullName: 'Maio (9ª Mensalidade)', installmentNumber: 9, dueDate: '2027-05-10', defaultFee: 500 },
  { key: 'jun', label: 'Jun', fullName: 'Junho (10ª Mensalidade)', installmentNumber: 10, dueDate: '2027-06-10', defaultFee: 500 },
  { key: 'july', label: 'July', fullName: 'Julho (11ª Mensalidade)', installmentNumber: 11, dueDate: '2027-07-10', defaultFee: 500 },
];

export interface MonthPaymentStatus {
  key: string;
  label: string;
  fullName: string;
  installmentNumber: number;
  dueDate: string;
  rawValue: string;
  isPaid: boolean;
  amount: number;
}

export interface ParsedSpreadsheetStudent {
  studentId?: string; // STU00000 informado na planilha
  name: string;
  level: string; // Ex: Beginner, Level 1, Intermediate
  className?: string; // Turma resolvida automaticamente pelo nível
  phone: string;
  startDate: string; // Ex: 01/08/2026
  age?: number; // Idade
  email?: string;
  city?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: string;
  nationalId?: string;
  guardianName?: string;
  guardianPhone?: string;
  skipCharges?: boolean; // Layout de cadastro (sem colunas de mensalidades)
  months: MonthPaymentStatus[];
  declaredTotal?: number;
  computedTotalPaid: number;
  totalPendingAmount: number;
  courseId?: string;
  classId?: string;
}

/**
 * Detecta se o valor de uma célula de mês representa pagamento efetuado
 */
export const evaluateCellPayment = (val: string, defaultAmount: number = 500): { isPaid: boolean; amount: number } => {
  if (!val) return { isPaid: false, amount: defaultAmount };
  const clean = val.trim().toLowerCase();

  if (
    clean === '' ||
    clean === '0' ||
    clean === '-' ||
    clean === '--' ||
    clean === 'pendente' ||
    clean === 'devendo' ||
    clean === 'não' ||
    clean === 'nao' ||
    clean === 'no' ||
    clean === 'false'
  ) {
    return { isPaid: false, amount: defaultAmount };
  }

  // Se for texto afirmativo (pago, paid, ok, sim, v, check, x)
  if (
    clean === 'pago' ||
    clean === 'paid' ||
    clean === 'ok' ||
    clean === 'sim' ||
    clean === 'yes' ||
    clean === 'v' ||
    clean === '✓' ||
    clean === 'x' ||
    clean === 'p'
  ) {
    return { isPaid: true, amount: defaultAmount };
  }

  // Se for número
  const num = parseFloat(clean.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (!isNaN(num) && num > 0) {
    return { isPaid: true, amount: num };
  }

  return { isPaid: false, amount: defaultAmount };
};

/**
 * Extrai o nível de um nome de turma: "A2+ (B) | Nov. to Feb. 2027" -> "A2+"
 */
export const extractClassLevel = (className: string): string =>
  className
    .split('|')[0]
    .replace(/\(.*?\)/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

/**
 * Encontra a turma cujo nível bate com o nível do aluno.
 * Quando há mais de uma turma do mesmo nível (ex.: A2 (A) e A2 (B)),
 * escolhe a que tem menos alunos matriculados, equilibrando as turmas.
 */
export const resolveClassByLevel = <T extends { id: string; name: string; courseId?: string }>(
  level: string,
  classList: T[],
  usage: Record<string, number> = {}
): T | undefined => {
  const target = (level || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!target) return undefined;

  const matches = classList.filter((cls) => extractClassLevel(cls.name) === target);
  if (matches.length === 0) return undefined;

  return matches.reduce((best, current) =>
    (usage[current.id] || 0) < (usage[best.id] || 0) ? current : best
  );
};

/**
 * Layout "Data" (Student Management): Timestamp | STU_ID | Name | Date of birth |
 * Gender | Email | Country Code | Phone number | Student ID | IsParent |
 * Responsible Email | Responsible ID | Father Name | Mother Name | Level
 */
const REGISTRY_HEADER_TOKENS = [
  'timestamp',
  'stu_id',
  'name',
  'date of birth',
  'gender',
  'email',
  'country code',
  'phone number',
  'student id',
  'isparent',
  'responsible email',
  'responsible id',
  'father name',
  'mother name',
  'level',
];

const isRegistryLayout = (text: string): boolean => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (lines.length === 0) return false;

  if (lines.some((l) => /date of birth|stu_id|responsible email|mother name|father name/i.test(l))) {
    return true;
  }

  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const parts = lines[0].split(sep).map((p) => p.trim());
  return parts.length >= 15 && /^(male|female|masculino|feminino)$/i.test(parts[4] || '');
};

const toIsoDate = (value: string): string => {
  const raw = (value || '').trim().split(' ')[0];
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return raw;
};

const parseStudentRegistrySpreadsheet = (
  text: string,
  defaultCourseId?: string,
  defaultClassId?: string
): ParsedSpreadsheetStudent[] => {
  const students: ParsedSpreadsheetStudent[] = [];

  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const p = line.split(sep).map((cell) => cell.trim());

      // Ignora cabeçalho
      if (
        REGISTRY_HEADER_TOKENS.includes((p[0] || '').toLowerCase()) ||
        REGISTRY_HEADER_TOKENS.includes((p[1] || '').toLowerCase())
      ) {
        return;
      }

      const studentId = (p[1] || '').toUpperCase();
      const name = p[2] || '';
      if (!studentId && !name) return;

      const birthDate = toIsoDate(p[3] || '');
      const birthYear = birthDate ? parseInt(birthDate.slice(0, 4), 10) : NaN;
      const age = !isNaN(birthYear) ? new Date().getFullYear() - birthYear : undefined;

      const genderRaw = (p[4] || '').toLowerCase();
      const gender =
        genderRaw.startsWith('f') || genderRaw === 'feminino'
          ? 'FEMININO'
          : genderRaw.startsWith('m') || genderRaw === 'masculino'
          ? 'MASCULINO'
          : 'OUTRO';

      const countryCode = (p[6] || '').replace(/\D/g, '');
      const phoneNumber = (p[7] || '').replace(/\s+/g, '');
      const phone = phoneNumber ? (countryCode ? `+${countryCode} ${phoneNumber}` : phoneNumber) : '';

      const cleanEmail =
        (p[5] || '').trim() ||
        `${name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '.')}@thinkgreen.org`;

      const fatherName = p[12] || '';
      const motherName = p[13] || '';

      students.push({
        studentId,
        name: name || `Aluno ${studentId}`,
        level: p[14] || '',
        phone,
        startDate: (p[0] || '').split(' ')[0],
        age,
        email: cleanEmail,
        city: 'Cairo',
        birthDate,
        gender,
        nationalId: p[8] || '',
        guardianName: fatherName || motherName,
        months: [],
        skipCharges: true,
        declaredTotal: 0,
        computedTotalPaid: 0,
        totalPendingAmount: 0,
        courseId: defaultCourseId,
        classId: defaultClassId,
      });
    });

  return students;
};

/**
 * Processa texto colado do Google Sheets / Excel / CSV na ordem oficial solicitada:
 * STUDENT ID | NAME | LEVEL | TELEPHONE | START DATE | AGE | [BLANK] | Agu | Set | Oct | Nov | D/J | Feb | Mar | Apr | May | Jun | July | Total
 */
export const parseOfficialSpreadsheet = (
  text: string,
  defaultCourseId?: string,
  defaultClassId?: string,
  fallbackFee: number = 500
): ParsedSpreadsheetStudent[] => {
  if (!text || !text.trim()) return [];

  // Novo layout (Student Management): cadastro com Level na última coluna
  if (isRegistryLayout(text)) {
    return parseStudentRegistrySpreadsheet(text, defaultCourseId, defaultClassId);
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const parsedStudents: ParsedSpreadsheetStudent[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect separator: Tab (\t) is standard when copying from Google Sheets / Excel, fallback to ; or ,
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map((p) => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map((p) => p.trim());
    } else {
      parts = [line];
    }

    // Skip if it is the header line
    const firstCell = (parts[0] || '').toLowerCase();
    const secondCell = (parts[1] || '').toLowerCase();
    if (
      firstCell.includes('student id') ||
      firstCell.includes('id') ||
      secondCell.includes('name') ||
      secondCell.includes('nome') ||
      firstCell === 'name' ||
      firstCell === 'nome'
    ) {
      continue;
    }

    // Identify if first column is STUDENT ID or NAME
    let studentId = '';
    let name = '';
    let level = 'Beginner';
    let phone = '+20 10 0000 0000';
    let startDate = '2026-08-01';
    let age: number | undefined = undefined;

    // Detect if column 0 is a student code or name
    const looksLikeStudentId = /^STU\d+/i.test(parts[0]) || (parts[0].length >= 3 && /^\d+$/.test(parts[0]));

    let colOffset = 0;
    if (looksLikeStudentId || parts.length >= 15) {
      // Standard order: STUDENT ID [0], NAME [1], LEVEL [2], TELEPHONE [3], START DATE [4], AGE [5]
      studentId = parts[0]?.trim() || '';
      name = parts[1]?.trim() || '';
      level = parts[2]?.trim() || 'Beginner';
      phone = parts[3]?.trim() || '+20 10 0000 0000';
      startDate = parts[4]?.trim() || '2026-08-01';
      const parsedAge = parseInt(parts[5]?.replace(/\D/g, '') || '', 10);
      if (!isNaN(parsedAge) && parsedAge > 0) age = parsedAge;

      colOffset = 6;
    } else {
      // Shorter format where NAME might be col 0
      name = parts[0]?.trim() || '';
      level = parts[1]?.trim() || 'Beginner';
      phone = parts[2]?.trim() || '+20 10 0000 0000';
      startDate = parts[3]?.trim() || '2026-08-01';
      const parsedAge = parseInt(parts[4]?.replace(/\D/g, '') || '', 10);
      if (!isNaN(parsedAge) && parsedAge > 0) age = parsedAge;

      colOffset = 5;
    }

    if (!name && !studentId) continue;
    if (!name && studentId) name = `Aluno ${studentId}`;

    // Look for monthly payment columns
    // Check if there is an empty column gap between AGE and Agu
    let monthStartIndex = colOffset;
    if (parts[monthStartIndex] === '' || parts[monthStartIndex] === undefined) {
      // Skip empty column (the blank tab after AGE)
      monthStartIndex++;
    }

    const monthStatuses: MonthPaymentStatus[] = [];
    let computedTotalPaid = 0;
    let totalPendingAmount = 0;

    ACADEMIC_MONTHS_MAP.forEach((mDef, mIdx) => {
      const cellVal = parts[monthStartIndex + mIdx] || '';
      const { isPaid, amount } = evaluateCellPayment(cellVal, fallbackFee);

      if (isPaid) {
        computedTotalPaid += amount;
      } else {
        totalPendingAmount += amount;
      }

      monthStatuses.push({
        key: mDef.key,
        label: mDef.label,
        fullName: mDef.fullName,
        installmentNumber: mDef.installmentNumber,
        dueDate: mDef.dueDate,
        rawValue: cellVal,
        isPaid,
        amount,
      });
    });

    // Total column (last column)
    const totalCell = parts[monthStartIndex + ACADEMIC_MONTHS_MAP.length] || '';
    const declaredTotalNum = parseFloat(totalCell.replace(/[^\d.,]/g, '').replace(',', '.'));
    const declaredTotal = !isNaN(declaredTotalNum) ? declaredTotalNum : computedTotalPaid;

    // Generate clean email
    const cleanNameEmail = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '.');

    parsedStudents.push({
      studentId: studentId.toUpperCase(),
      name,
      level,
      phone,
      startDate,
      age,
      email: `${cleanNameEmail}@thinkgreen.org`,
      city: 'Cairo',
      months: monthStatuses,
      declaredTotal,
      computedTotalPaid,
      totalPendingAmount,
      courseId: defaultCourseId,
      classId: defaultClassId,
    });
  }

  return parsedStudents;
};

