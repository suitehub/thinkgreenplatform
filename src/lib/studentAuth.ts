import type { Student } from '../types';

/**
 * Student access is based on the permanent Student ID plus the date of birth
 * registered by the Secretariat. It does not use Firebase Authentication.
 */

const STUDENT_SESSION_KEY = 'thinkgreen.studentSession';

export interface StudentSession {
  studentId: string;
  savedAt: string;
}

/** Normalizes typed IDs: trims spaces and uppercases (stu00186 -> STU00186). */
export function normalizeStudentId(value: string | undefined | null): string {
  return (value || '').trim().toUpperCase().replace(/\s+/g, '');
}

/** Normalizes YYYY-MM-DD, DD/MM/YYYY and ISO date-time strings for comparison. */
export function normalizeBirthDate(value: string | undefined | null): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  const local = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(trimmed);
  if (local) {
    return `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`;
  }

  return '';
}

export interface StudentLoginCheck {
  student?: Student;
  error?: string;
}

/**
 * Validates the Student ID + birth date pair against the students loaded from
 * Firestore. Returns a friendly Portuguese message when access is denied.
 */
export function validateStudentLogin(
  students: Student[],
  studentIdInput: string,
  birthDateInput: string
): StudentLoginCheck {
  const studentId = normalizeStudentId(studentIdInput);
  if (!studentId) {
    return { error: 'Informe seu ID Student.' };
  }

  const birthDate = normalizeBirthDate(birthDateInput);
  if (!birthDate) {
    return { error: 'Informe sua data de nascimento.' };
  }

  const student = students.find(
    (item) => normalizeStudentId(item.studentId) === studentId
  );

  if (!student) {
    return {
      error: 'ID Student não encontrado. Confira o número informado ou procure a secretaria.',
    };
  }

  if (student.systemAccess === 'BLOQUEADO') {
    return {
      error: 'O acesso deste aluno está bloqueado. Procure a secretaria para regularizar.',
    };
  }

  if (student.status !== 'ATIVO') {
    return {
      error: 'A matrícula deste aluno não está ativa. Procure a secretaria.',
    };
  }

  const registeredBirthDate = normalizeBirthDate(student.birthDate);
  if (!registeredBirthDate) {
    return {
      error:
        'Sua data de nascimento ainda não está cadastrada. Procure a secretaria para atualizar seu cadastro.',
    };
  }

  if (registeredBirthDate !== birthDate) {
    return {
      error: 'Data de nascimento não confere. Confira a data informada e tente novamente.',
    };
  }

  return { student };
}

/** Keeps the student signed in across page reloads in the same browser tab. */
export function readStudentSession(): StudentSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STUDENT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StudentSession>;
    const studentId = normalizeStudentId(parsed?.studentId);
    if (!studentId) return null;

    return { studentId, savedAt: parsed?.savedAt || new Date().toISOString() };
  } catch {
    return null;
  }
}

export function saveStudentSession(studentId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: StudentSession = {
      studentId: normalizeStudentId(studentId),
      savedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Private browsing or blocked storage: the session just won't survive reloads.
  }
}

export function clearStudentSession(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(STUDENT_SESSION_KEY);
  } catch {
    // Nothing to clean up.
  }
}
