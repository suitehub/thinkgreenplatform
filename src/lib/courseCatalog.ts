import type { Course, CourseLevelPricing } from '../types';

/**
 * Real programs offered by Think Green. These are NOT demo data: they are the
 * base catalog used to open classes and enrollments. Records are only written
 * to Firestore when the Secretariat actually creates a class/enrollment that
 * uses one of them.
 */
export const STANDARD_ENGLISH_LEVELS: CourseLevelPricing[] = [
  {
    level: 'CRIANCAS',
    label: 'Crianças (Kids)',
    targetAudience: 'Educação Infantil e Fundamental I (6 a 11 anos)',
    defaultInstallments: 4,
    totalAmount: 2000,
    installmentAmount: 500,
    description:
      'Abordagem lúdica, vocabulário cotidiano, contação de histórias e fonética infantil.',
  },
  {
    level: 'ADOLESCENTES',
    label: 'Adolescentes (Teens)',
    targetAudience: 'Ensino Fundamental II e Médio (12 a 17 anos)',
    defaultInstallments: 3,
    totalAmount: 1500,
    installmentAmount: 500,
    description:
      'Conversação ativa, cultura jovem, produção textual, apresentações e debates.',
  },
  {
    level: 'ADULTO',
    label: 'Adulto (Adults)',
    targetAudience: 'Universitários e Profissionais (18+ anos)',
    defaultInstallments: 3,
    totalAmount: 1800,
    installmentAmount: 600,
    description:
      'Fluência comunicativa, inglês profissional, viagens, entrevistas e negócios.',
  },
];

export const STANDARD_COURSES: Course[] = [
  {
    id: 'course_eng',
    code: 'ENG-100',
    name: 'Curso Livre de Inglês',
    category: 'ENGLISH',
    description:
      'Programa intensivo e conversacional de língua inglesa com metodologia comunicativa dividida em 3 níveis (Crianças, Adolescentes e Adulto).',
    color: '#7C3AED',
    totalCourseAmount: 1800,
    defaultInstallmentsCount: 3,
    monthlyFee: 500,
    totalHours: 60,
    isActive: true,
    levels: STANDARD_ENGLISH_LEVELS,
  },
  {
    id: 'course_preschool',
    code: 'PRE-200',
    name: 'Preschool',
    category: 'PRESCHOOL',
    description:
      'Educação infantil, desenvolvimento socioemocional, bilinguismo precoce e artes.',
    color: '#F97316',
    totalCourseAmount: 3000,
    defaultInstallmentsCount: 4,
    monthlyFee: 750,
    totalHours: 120,
    isActive: true,
  },
  {
    id: 'course_football',
    code: 'SPO-300',
    name: 'Academia de Futebol Think Green',
    category: 'FOOTBALL',
    description:
      'Treinamento de futebol de alto rendimento, disciplina tática, saúde física e trabalho em equipe.',
    color: '#16A34A',
    totalCourseAmount: 1600,
    defaultInstallmentsCount: 4,
    monthlyFee: 400,
    totalHours: 48,
    isActive: true,
  },
  {
    id: 'course_women_fit',
    code: 'FIT-400',
    name: 'Academia & Treinos para Mulheres',
    category: 'WOMENS_FITNESS',
    description:
      'Programa exclusivo de fortalecimento funcional, condicionamento aeróbico e bem-estar comunitário feminino.',
    color: '#DB2777',
    totalCourseAmount: 1800,
    defaultInstallmentsCount: 4,
    monthlyFee: 450,
    totalHours: 40,
    isActive: true,
  },
];

/**
 * Courses shown in the class form: records already saved plus the standard
 * programs that have no record yet (deduplicated by category).
 */
export function buildCourseOptions(courses: Course[]): Course[] {
  const existingCategories = new Set(courses.map((course) => course.category));
  const missingStandard = STANDARD_COURSES.filter(
    (course) => !existingCategories.has(course.category)
  );
  return [...courses, ...missingStandard];
}

/** A user is a teacher when the TEACHER role is assigned, primary or extra. */
export function isTeacherUser(user: {
  role?: string;
  roles?: string[];
  department?: string;
}): boolean {
  if (user.role === 'TEACHER') return true;
  if (Array.isArray(user.roles) && user.roles.includes('TEACHER')) return true;
  const department = (user.department || '').toLowerCase();
  return department.includes('docente') || department.includes('professor');
}
