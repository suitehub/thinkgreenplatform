import { SystemSettings, User } from '../types';

/**
 * Platform configuration and the owner account.
 *
 * No demo/sample business data lives here anymore. Students, courses, classes,
 * enrollments and financial records come exclusively from Firestore.
 */

export const INITIAL_SETTINGS: SystemSettings = {
  centerName: 'Think Green Community Center',
  location: 'Cairo, Egypt (مصر)',
  currencySymbol: 'EGP',
  currencyCode: 'EGP',
  enableAutomaticExamGates: true,
  enableAutomaticClassroomGates: true,
  minimumPassingGrade: 60,
  attendanceRequirementPercent: 75,
  rulesConfig: {
    rule1_classroomRequiresFirstPayment: true,
    rule2_exam1RequiresSecondPayment: true,
    rule3_finalExamRequiresFullPayment: true,
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_master_admin',
    name: 'Eng. Ricky Jorge Castro',
    email: 'rickyjorgecastro@gmail.com',
    role: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN'],
    department: 'Diretoria Executiva & Gestão Geral',
    status: 'ACTIVE',
    permissions: ['*'],
    createdAt: '2026-01-01',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];
