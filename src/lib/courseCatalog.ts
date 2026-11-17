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
    label: 'Children (Kids)',
    targetAudience: 'Preschool and Elementary School (ages 6 to 11)',
    defaultInstallments: 4,
    totalAmount: 2000,
    installmentAmount: 500,
    description:
      'Play-based approach, everyday vocabulary, storytelling and phonics for children.',
  },
  {
    level: 'ADOLESCENTES',
    label: 'Teenagers (Teens)',
    targetAudience: 'Middle and High School (ages 12 to 17)',
    defaultInstallments: 3,
    totalAmount: 1500,
    installmentAmount: 500,
    description:
      'Active conversation, youth culture, writing, presentations and debates.',
  },
  {
    level: 'ADULTO',
    label: 'Adult (Adults)',
    targetAudience: 'University Students and Professionals (18+)',
    defaultInstallments: 3,
    totalAmount: 1800,
    installmentAmount: 600,
    description:
      'Communicative fluency, professional English, travel, interviews and business.',
  },
];

export const STANDARD_COURSES: Course[] = [
  {
    id: 'course_eng',
    code: 'ENG-100',
    name: 'General English Course',
    category: 'ENGLISH',
    description:
      'Intensive, conversation-based English program with a communicative methodology divided into 3 levels (Children, Teenagers and Adults).',
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
      'Early childhood education, social-emotional development, early bilingualism and arts.',
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
    name: 'Think Green Football Academy',
    category: 'FOOTBALL',
    description:
      'High-performance football training, tactical discipline, physical health and teamwork.',
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
    name: "Women's Gym & Training",
    category: 'WOMENS_FITNESS',
    description:
      "Exclusive program for functional strengthening, aerobic conditioning and women's community well-being.",
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
  return [...courses, ...missingStandard].filter((course) => course.id !== 'course_none');
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
