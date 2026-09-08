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
