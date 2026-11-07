import { fetchCollectionStrict, subscribeCollection } from '../../../lib/firebase';
import { isLocalWritePending, syncCollectionDiff } from '../../../lib/cloud';
import {
  DidacticMaterial,
  Quiz,
  QuizSubmission,
  GeneralAnnouncement,
  ClassLessonPlan,
} from '../../../types';

export interface ClassTopic {
  id: string;
  classId: string;
  title: string;
  description?: string;
  order: number;
}

export interface ClassAnnouncement {
  id: string;
  classId: string;
  authorName: string;
  authorRole: string;
  title?: string;
  content: string;
  createdAt: string;
  type: 'AVISO' | 'COMUNICADO' | 'MATERIAL' | 'GERAL';
  pinned?: boolean;
}

// Firestore collections (single source of truth)
const TOPICS_COLLECTION = 'class_topics';
const ANNOUNCEMENTS_COLLECTION = 'class_announcements';
const MATERIALS_COLLECTION = 'didactic_materials';
const QUIZZES_COLLECTION = 'quizzes';
const QUIZ_SUBMISSIONS_COLLECTION = 'quiz_submissions';
const GENERAL_ANNOUNCEMENTS_COLLECTION = 'general_announcements';
const LESSON_PLANS_COLLECTION = 'lesson_plans';

// In-memory caches hydrated from Firestore before the app renders.
let topicsCache: ClassTopic[] = [];
let announcementsCache: ClassAnnouncement[] = [];
let materialsCache: DidacticMaterial[] = [];
let quizzesCache: Quiz[] = [];
let quizSubmissionsCache: QuizSubmission[] = [];
let generalAnnouncementsCache: GeneralAnnouncement[] = [];
let lessonPlansCache: ClassLessonPlan[] = [];

const teacherListeners = new Set<() => void>();

export function subscribeTeacherStore(listener: () => void): () => void {
  teacherListeners.add(listener);
  return () => {
    teacherListeners.delete(listener);
  };
}

function notifyTeacherStore(): void {
  queueMicrotask(() => {
    teacherListeners.forEach((listener) => listener());
  });
}

function sameSnapshot(previous: unknown, next: unknown): boolean {
  return JSON.stringify(previous) === JSON.stringify(next);
}

export interface TeacherCollections {
  topics: ClassTopic[];
  announcements: ClassAnnouncement[];
  materials: DidacticMaterial[];
  quizzes: Quiz[];
  quizSubmissions: QuizSubmission[];
  generalAnnouncements: GeneralAnnouncement[];
  lessonPlans: ClassLessonPlan[];
}

export async function loadTeacherCollections(): Promise<TeacherCollections> {
  const [topics, announcements, materials, quizzes, quizSubmissions, generalAnnouncements, lessonPlans] =
    await Promise.all([
      fetchCollectionStrict<ClassTopic>(TOPICS_COLLECTION).catch(() => []),
      fetchCollectionStrict<ClassAnnouncement>(ANNOUNCEMENTS_COLLECTION).catch(() => []),
      fetchCollectionStrict<DidacticMaterial>(MATERIALS_COLLECTION).catch(() => []),
      fetchCollectionStrict<Quiz>(QUIZZES_COLLECTION).catch(() => []),
      fetchCollectionStrict<QuizSubmission>(QUIZ_SUBMISSIONS_COLLECTION).catch(() => []),
      fetchCollectionStrict<GeneralAnnouncement>(GENERAL_ANNOUNCEMENTS_COLLECTION).catch(() => []),
      fetchCollectionStrict<ClassLessonPlan>(LESSON_PLANS_COLLECTION).catch(() => []),
    ]);

  return { topics, announcements, materials, quizzes, quizSubmissions, generalAnnouncements, lessonPlans };
}

export function hydrateTeacherData(data: Partial<TeacherCollections>): void {
  topicsCache = data.topics ?? [];
  announcementsCache = data.announcements ?? [];
  materialsCache = data.materials ?? [];
  quizzesCache = data.quizzes ?? [];
  quizSubmissionsCache = data.quizSubmissions ?? [];
  generalAnnouncementsCache = data.generalAnnouncements ?? [];
  lessonPlansCache = data.lessonPlans ?? [];
}

export function getStoredTopics(): ClassTopic[] {
  return topicsCache;
}

export function saveStoredTopics(topics: ClassTopic[]) {
  const previous = topicsCache;
  topicsCache = topics;
  syncCollectionDiff(TOPICS_COLLECTION, previous, topics).catch((e) =>
    console.warn('[teacher] Falha ao salvar tópicos no Firestore.', e)
  );
}

export function getStoredAnnouncements(): ClassAnnouncement[] {
  return announcementsCache;
}

export function saveStoredAnnouncements(announcements: ClassAnnouncement[]) {
  const previous = announcementsCache;
  announcementsCache = announcements;
  syncCollectionDiff(ANNOUNCEMENTS_COLLECTION, previous, announcements).catch((e) =>
    console.warn('[teacher] Falha ao salvar avisos no Firestore.', e)
  );
}

export function getStoredDidacticMaterials(): DidacticMaterial[] {
  return materialsCache;
}

export function saveStoredDidacticMaterials(materials: DidacticMaterial[]) {
  const previous = materialsCache;
  materialsCache = materials;
  syncCollectionDiff(MATERIALS_COLLECTION, previous, materials).catch((e) =>
    console.warn('[teacher] Falha ao salvar materiais no Firestore.', e)
  );
}

export function getStoredQuizzes(): Quiz[] {
  return quizzesCache;
}

export function saveStoredQuizzes(quizzes: Quiz[]) {
  const previous = quizzesCache;
  quizzesCache = quizzes;
  syncCollectionDiff(QUIZZES_COLLECTION, previous, quizzes).catch((e) =>
    console.warn('[teacher] Falha ao salvar quizzes no Firestore.', e)
  );
}

export function getStoredQuizSubmissions(): QuizSubmission[] {
  return quizSubmissionsCache;
}

export function saveStoredQuizSubmissions(submissions: QuizSubmission[]) {
  const previous = quizSubmissionsCache;
  quizSubmissionsCache = submissions;
  syncCollectionDiff(QUIZ_SUBMISSIONS_COLLECTION, previous, submissions).catch((e) =>
    console.warn('[teacher] Falha ao salvar respostas de quiz no Firestore.', e)
  );
}

export function getStoredGeneralAnnouncements(): GeneralAnnouncement[] {
  return generalAnnouncementsCache;
}

export function saveStoredGeneralAnnouncements(announcements: GeneralAnnouncement[]) {
  const previous = generalAnnouncementsCache;
  generalAnnouncementsCache = announcements;
  syncCollectionDiff(GENERAL_ANNOUNCEMENTS_COLLECTION, previous, announcements).catch((e) =>
    console.warn('[teacher] Falha ao salvar comunicados gerais no Firestore.', e)
  );
}

export function getStoredLessonPlans(): ClassLessonPlan[] {
  return lessonPlansCache;
}

export function saveStoredLessonPlans(plans: ClassLessonPlan[]) {
  const previous = lessonPlansCache;
  lessonPlansCache = plans;
  syncCollectionDiff(LESSON_PLANS_COLLECTION, previous, plans).catch((e) =>
    console.warn('[teacher] Falha ao salvar planos de aula no Firestore.', e)
  );
}


