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

export const INITIAL_TOPICS: ClassTopic[] = [
  // English Class
  {
    id: 'topic_eng_1',
    classId: 'class_eng_a',
    title: 'Unidade 01 — Introdução & Daily Routine',
    description: 'Vocabulário essencial, rotina diária e construções gramaticais básicas.',
    order: 1,
  },
  {
    id: 'topic_eng_2',
    classId: 'class_eng_a',
    title: 'Unidade 02 — Present Continuous & Dialogues',
    description: 'Estruturas de conversação ativa, diálogos do cotidiano e audição.',
    order: 2,
  },
  {
    id: 'topic_eng_3',
    classId: 'class_eng_a',
    title: 'Avaliações & Provas Bimestrais',
    description: 'Provas teóricas, apresentações orais e exames finais da turma.',
    order: 3,
  },
  {
    id: 'topic_eng_4',
    classId: 'class_eng_a',
    title: 'Materiais Complementares & Leituras',
    description: 'Textos de apoio, guias de pronúncia e exercícios extras.',
    order: 4,
  },

  // Soccer Class
  {
    id: 'topic_soc_1',
    classId: 'class_soccer',
    title: 'Módulo 1 — Fundamentos Técnicos & Passe',
    description: 'Domínio de bola, passes curtos e médios, condução e controle espacial.',
    order: 1,
  },
  {
    id: 'topic_soc_2',
    classId: 'class_soccer',
    title: 'Módulo 2 — Posicionamento Tático & Coletivo',
    description: 'Linhas defensivas, transições ofensivas e movimentação sem bola.',
    order: 2,
  },
  {
    id: 'topic_soc_3',
    classId: 'class_soccer',
    title: 'Avaliações Práticas & Torneios',
    description: 'Testes de aptidão física, fundamentos individuais e torneio integrador.',
    order: 3,
  },

  // Reading Class
  {
    id: 'topic_read_1',
    classId: 'class_reading',
    title: 'Módulo 1 — Interpretação Textual & Vocabulário',
    description: 'Compreensão de contos, identificação de personagens e ideias centrais.',
    order: 1,
  },
  {
    id: 'topic_read_2',
    classId: 'class_reading',
    title: 'Módulo 2 — Leitura Crítica & Short Stories',
    description: 'Análise literária de pequenas narrativas e crônicas em língua inglesa.',
    order: 2,
  },
  {
    id: 'topic_read_3',
    classId: 'class_reading',
    title: 'Avaliações & Produção Textual',
    description: 'Fichamentos, redações avaliativas e prova bimestral de leitura.',
    order: 3,
  },
];

export const INITIAL_ANNOUNCEMENTS: ClassAnnouncement[] = [
  {
    id: 'ann_eng_1',
    classId: 'class_eng_a',
    authorName: 'Professor Lucas',
    authorRole: 'Docente Titular',
    title: 'Aviso sobre a Próxima Avaliação Oral',
    content:
      'Olá turma! A avaliação de conversação em duplas acontecerá na próxima quinta-feira. Releiam os diálogos da Unidade 02 disponíveis na aba de Conteúdos.',
    createdAt: 'Hoje, 09:30',
    type: 'AVISO',
    pinned: true,
  },
  {
    id: 'ann_eng_2',
    classId: 'class_eng_a',
    authorName: 'Professor Lucas',
    authorRole: 'Docente Titular',
    title: 'Material Extra Adicionado',
    content:
      'Adicionei um guia em PDF com lista de verbos irregulares e exercícios práticos no tópico de Materiais Complementares. Bom estudo a todos!',
    createdAt: 'Ontem, 16:45',
    type: 'MATERIAL',
    pinned: false,
  },
  {
    id: 'ann_soc_1',
    classId: 'class_soccer',
    authorName: 'Professor Lucas',
    authorRole: 'Docente Titular',
    title: 'Treino Tático e Uso de Chuteira Society',
    content:
      'Lembramos a todos os atletas que o treino de quinta-feira será focado em transições rápidas no Campo Sintético 01. Tragam garrafa de hidratação e colete individual.',
    createdAt: 'Hoje, 08:15',
    type: 'COMUNICADO',
    pinned: true,
  },
  {
    id: 'ann_read_1',
    classId: 'class_reading',
    authorName: 'Professor Lucas',
    authorRole: 'Docente Titular',
    title: 'Fichamento do Livro "Think Green Stories"',
    content:
      'A entrega do fichamento dos capítulos 1 a 3 deve ser feita até sexta-feira às 23:59 através da aba de Conteúdos (Atividades). Não deixem para a última hora!',
    createdAt: 'Ontem, 14:20',
    type: 'AVISO',
    pinned: true,
  },
];

const TOPICS_STORAGE_KEY = 'think_green_class_topics_v1';
const ANNOUNCEMENTS_STORAGE_KEY = 'think_green_class_announcements_v1';
const MATERIALS_STORAGE_KEY = 'think_green_didactic_materials_v1';
const QUIZZES_STORAGE_KEY = 'think_green_quizzes_v1';
const QUIZ_SUBMISSIONS_STORAGE_KEY = 'think_green_quiz_submissions_v1';
const GENERAL_ANNOUNCEMENTS_STORAGE_KEY = 'think_green_general_announcements_v1';

import { DidacticMaterial, Quiz, QuizSubmission, GeneralAnnouncement } from '../../../types';

export const INITIAL_DIDACTIC_MATERIALS: DidacticMaterial[] = [
  {
    id: 'mat_eng_pdf_1',
    classId: 'class_eng_a',
    className: 'Inglês Básico A',
    topicId: 'topic_eng_4',
    title: 'Apostila Oficial de Inglês Básico — Unidades 01 a 04',
    description: 'Guia gramatical completo, vocabulário essencial de rotina diária e exercícios de fixação com gabarito.',
    type: 'PDF',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Apostila_Ingles_Basico_ThinkGreen_2026.pdf',
    fileSize: '3.8 MB',
    teacherId: 'user_teacher_1',
    teacherName: 'Professor Lucas',
    createdAt: '2026-03-01',
  },
  {
    id: 'mat_eng_drive_1',
    classId: 'class_eng_a',
    className: 'Inglês Básico A',
    topicId: 'topic_eng_4',
    title: 'Pasta Compartilhada no Google Drive — Áudios & Worksheets Extras',
    description: 'Acesso direto ao repositório institucional com faixas de áudio em MP3 dos diálogos e apostilas para download.',
    type: 'DRIVE',
    url: 'https://drive.google.com/drive/folders/thinkgreen-english-materials-sample',
    fileName: 'Google Drive Repository',
    teacherId: 'user_teacher_1',
    teacherName: 'Professor Lucas',
    createdAt: '2026-03-02',
  },
  {
    id: 'mat_eng_video_1',
    classId: 'class_eng_a',
    className: 'Inglês Básico A',
    topicId: 'topic_eng_1',
    title: 'Vídeo Didático: Daily Routines & Present Continuous in Real Life',
    description: 'Vídeo aula prática de pronúncia e conversação natural com nativos para auxílio das atividades da Unidade 01.',
    type: 'VIDEO',
    url: 'https://www.youtube.com/watch?v=juKd26qkNAw',
    teacherId: 'user_teacher_1',
    teacherName: 'Professor Lucas',
    createdAt: '2026-03-03',
  },
  {
    id: 'mat_soc_pdf_1',
    classId: 'class_soccer',
    className: 'Futebol Juvenil Sub-15',
    topicId: 'topic_soc_1',
    title: 'Manual Técnico de Fundamentos & Exercícios de Posicionamento',
    description: 'Diagramas táticos de transição ofensiva, condução de bola em pequenos espaços e preparação motora.',
    type: 'PDF',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Manual_Tatico_Futebol_Sub15.pdf',
    fileSize: '2.1 MB',
    teacherId: 'user_teacher_1',
    teacherName: 'Professor Lucas',
    createdAt: '2026-03-01',
  },
  {
    id: 'mat_soc_video_1',
    classId: 'class_soccer',
    className: 'Futebol Juvenil Sub-15',
    topicId: 'topic_soc_1',
    title: 'Vídeo de Análise: Passe Rápido e Desarme Limpo no Campo Sintético',
    description: 'Clipe de referência com lances comentados pelo corpo técnico do Centro Comunitário.',
    type: 'VIDEO',
    url: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
    teacherId: 'user_teacher_1',
    teacherName: 'Professor Lucas',
    createdAt: '2026-03-04',
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz_eng_listening_1',
    classId: 'class_eng_a',
    className: 'Inglês Básico A',
    topicId: 'topic_eng_2',
    title: 'Listening & Comprehension Quiz: Dialogues at Think Green',
    description: 'Quiz interativo no formato D2L/Forms com áudio integrado para compreensão auditiva e perguntas variadas.',
    instructions: 'Ouça com atenção a gravação de áudio da conversa na recepção do Centro Comunitário e responda a todas as questões a seguir. As questões de múltipla escolha e verdadeiro/falso serão corrigidas automaticamente.',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    audioTitle: 'Listening Track 01 — Conversation between Student and Receptionist at Think Green',
    totalPoints: 100,
    timeLimitMinutes: 20,
    dueDate: '2026-03-25',
    createdAt: '2026-03-02',
    createdBy: 'Professor Lucas',
    questions: [
      {
        id: 'q_1',
        question: 'According to the dialogue, what is the main reason the student came to the reception desk?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt_1a', text: 'To ask about the schedule of the intermediate English classes and the conversation club' },
          { id: 'opt_1b', text: 'To complain about the cafeteria food' },
          { id: 'opt_1c', text: 'To return a borrowed book to the library' },
          { id: 'opt_1d', text: 'To cancel their course enrollment' },
        ],
        correctOptionId: 'opt_1a',
        points: 25,
        explanation: 'The student explicitly inquires about the evening conversation schedule.',
      },
      {
        id: 'q_2',
        question: 'True or False: The receptionist told the student that the classes start strictly at 18:00 on Tuesdays and Thursdays.',
        type: 'TRUE_FALSE',
        correctBooleanAnswer: true,
        points: 25,
        explanation: 'The schedule announced in the recording is Tuesdays and Thursdays at 18:00.',
      },
      {
        id: 'q_3',
        question: 'Fill in the blank: Complete the sentence heard in the audio — "Students must bring their student _____ to enter the classroom."',
        type: 'FILL_BLANK',
        correctBlankAnswer: 'ID',
        points: 25,
        explanation: 'The student ID (carteirinha) is required at the classroom entrance.',
      },
      {
        id: 'q_4',
        question: 'Dissertative (Short Essay): In 2 to 3 sentences in English, describe what advice the teacher gave to improve oral fluency.',
        type: 'ESSAY',
        points: 25,
        explanation: 'Subjective question graded by the teacher based on grammar, clarity and context.',
      },
    ],
  },
];

export const INITIAL_QUIZ_SUBMISSIONS: QuizSubmission[] = [
  {
    id: 'qsub_1',
    quizId: 'quiz_eng_listening_1',
    quizTitle: 'Listening & Comprehension Quiz: Dialogues at Think Green',
    classId: 'class_eng_a',
    studentId: 'STU00001',
    studentName: 'Youssef Mansour',
    answers: {
      q_1: { selectedOptionId: 'opt_1a', isCorrect: true, scoreEarned: 25 },
      q_2: { booleanAnswer: true, isCorrect: true, scoreEarned: 25 },
      q_3: { textAnswer: 'ID', isCorrect: true, scoreEarned: 25 },
      q_4: {
        textAnswer: 'The teacher advised the students to practice speaking everyday with partners and listen to podcasts.',
        scoreEarned: 20,
      },
    },
    totalScoreEarned: 95,
    maxScore: 100,
    percentage: 95,
    submittedAt: '2026-03-03 14:30',
    status: 'AVALIADO',
    feedback: 'Excelente compreensão auditiva e coerência textual!',
  },
];

export const INITIAL_GENERAL_ANNOUNCEMENTS: GeneralAnnouncement[] = [
  {
    id: 'gen_ann_1',
    title: 'Comunicado Oficial da Direção Geral: Acesso e Funcionamento das Atividades 2026',
    content: 'Prezados alunos, pais e responsáveis do Think Green Community Center: Informamos que todas as turmas dos cursos livres (Inglês, Academia de Futebol, Pré-Escola Girassol e Fitness Feminino) estão em pleno funcionamento. Solicitamos a gentileza de manter seus dados cadastrais e pagamentos em dia junto à recepção e tesouraria para livre acesso às avaliações finais e eventos. Sejam todos muito bem-vindos!',
    authorName: 'Rony & Direção Executiva Think Green',
    authorRole: 'DIRECAO',
    targetRole: 'ALL',
    pinned: true,
    priority: 'HIGH',
    createdAt: '2026-03-01 08:00',
    tags: ['Direção', 'Geral', 'Comunicado'],
  },
  {
    id: 'gen_ann_2',
    title: 'Coordenação Pedagógica: Liberação de Materiais Didáticos e Quizzes Interativos',
    content: 'A Coordenação Pedagógica disponibilizou novos materiais complementares em PDF, links do Google Drive e vídeos no ambiente virtual. Além disso, os professores já podem publicar atividades interativas em formato de Quiz com áudio para treinamento auditivo. Acompanhem seus murais de turma!',
    authorName: 'Coordenação Pedagógica Geral',
    authorRole: 'COORDENACAO',
    targetRole: 'ALL',
    pinned: true,
    priority: 'NORMAL',
    createdAt: '2026-03-02 10:15',
    tags: ['Pedagógico', 'Materiais', 'Quizzes'],
  },
];

export function getStoredTopics(): ClassTopic[] {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(INITIAL_TOPICS));
      return INITIAL_TOPICS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TOPICS;
  }
}

export function saveStoredTopics(topics: ClassTopic[]) {
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error('Error saving topics:', e);
  }
}

export function getStoredAnnouncements(): ClassAnnouncement[] {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveStoredAnnouncements(announcements: ClassAnnouncement[]) {
  try {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
  } catch (e) {
    console.error('Error saving announcements:', e);
  }
}

export function getStoredDidacticMaterials(): DidacticMaterial[] {
  try {
    const raw = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(INITIAL_DIDACTIC_MATERIALS));
      return INITIAL_DIDACTIC_MATERIALS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DIDACTIC_MATERIALS;
  }
}

export function saveStoredDidacticMaterials(materials: DidacticMaterial[]) {
  try {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
  } catch (e) {
    console.error('Error saving didactic materials:', e);
  }
}

export function getStoredQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(QUIZZES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(INITIAL_QUIZZES));
      return INITIAL_QUIZZES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_QUIZZES;
  }
}

export function saveStoredQuizzes(quizzes: Quiz[]) {
  try {
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
  } catch (e) {
    console.error('Error saving quizzes:', e);
  }
}

export function getStoredQuizSubmissions(): QuizSubmission[] {
  try {
    const raw = localStorage.getItem(QUIZ_SUBMISSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(QUIZ_SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_QUIZ_SUBMISSIONS));
      return INITIAL_QUIZ_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_QUIZ_SUBMISSIONS;
  }
}

export function saveStoredQuizSubmissions(submissions: QuizSubmission[]) {
  try {
    localStorage.setItem(QUIZ_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch (e) {
    console.error('Error saving quiz submissions:', e);
  }
}

export function getStoredGeneralAnnouncements(): GeneralAnnouncement[] {
  try {
    const raw = localStorage.getItem(GENERAL_ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GENERAL_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_GENERAL_ANNOUNCEMENTS));
      return INITIAL_GENERAL_ANNOUNCEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GENERAL_ANNOUNCEMENTS;
  }
}

export function saveStoredGeneralAnnouncements(announcements: GeneralAnnouncement[]) {
  try {
    localStorage.setItem(GENERAL_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
  } catch (e) {
    console.error('Error saving general announcements:', e);
  }
}

