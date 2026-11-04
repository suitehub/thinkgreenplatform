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
  phone: string;
  startDate: string; // Ex: 01/08/2026
  age?: number; // Idade
  email?: string;
  city?: string;
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

/**
 * Exemplo padrão oficial para teste de 1 clique
 */
export const OFFICIAL_SPREADSHEET_SAMPLE = [
  'STUDENT ID\tNAME\tLEVEL\tTELEPHONE\tSTART DATE\tAGE\t\tAgu\tSet\tOct\tNov\tD/J\tFeb\tMar\tApr\tMay\tJun\tJuly\tTotal',
  'STU00001\tAmira Hassan\tLevel 1\t+20 10 9876 5432\t01/08/2026\t16\t\t500\t500\t500\t500\t500\t500\t500\t500\t0\t0\t0\t4000',
  'STU00002\tKarim Mansour\tBeginner\t+20 11 8765 4321\t15/08/2026\t19\t\t500\t500\t500\t0\t0\t0\t0\t0\t0\t0\t0\t1500',
  'STU00003\tNour El-Din\tIntermediate\t+20 12 7654 3210\t01/08/2026\t22\t\t500\t500\t500\t500\t500\t0\t0\t0\t0\t0\t0\t2500',
  'STU00004\tMona Abdel\tPreschool\t+20 10 6543 2109\t01/09/2026\t6\t\t500\t500\t0\t0\t0\t0\t0\t0\t0\t0\t0\t1000',
  'STU00005\tYoussef Ibrahim\tLevel 2\t+20 11 2233 4455\t01/08/2026\t17\t\t500\t500\t500\t500\t500\t500\t500\t500\t500\t500\t500\t5500',
  'STU00006\tFatima Al-Sayed\tKids\t+20 12 9988 7766\t10/08/2026\t11\t\t500\t500\t500\t0\t0\t0\t0\t0\t0\t0\t0\t1500',
].join('\n');
