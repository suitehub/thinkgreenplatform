import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Award,
  Plus,
  Filter,
  FileText,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  FolderPlus,
  PlaySquare,
  Sparkles,
  Search,
  Upload,
  HardDrive,
  Headphones,
  Play,
  Pause,
  Check,
  X,
  Layers,
  HelpCircle,
  Radio,
  FileQuestion,
  AlignLeft,
  ToggleLeft,
  Volume2,
} from 'lucide-react';
import {
  ClassRoom,
  Assessment,
  Assignment,
  Lesson,
  Submission,
  DidacticMaterial,
  DidacticMaterialType,
  Quiz,
  QuizQuestion,
  QuizQuestionType,
  QuizSubmission,
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import {
  ClassTopic,
  getStoredTopics,
  saveStoredTopics,
  getStoredDidacticMaterials,
  saveStoredDidacticMaterials,
  getStoredQuizzes,
  saveStoredQuizzes,
} from './teacherData';

interface ClassContentsTabProps {
  selectedClass: ClassRoom;
  classLessons: Lesson[];
  classAssignments: Assignment[];
  classAssessments: Assessment[];
  submissions: Submission[];
  onOpenNewLesson: () => void;
  onOpenNewAssignment: () => void;
  onOpenNewExam: () => void;
  onDeleteLesson: (id: string) => void;
  onDeleteAssignment: (id: string) => void;
  onDeleteAssessment: (id: string) => void;
  onOpenExamDetails: (exam: Assessment) => void;
  onReviewAssignmentSubmissions: (assignment: Assignment) => void;
  onLaunchExamGrades: (exam: Assessment) => void;
  onEditAssignment?: (assignment: Assignment) => void;
  onEditAssessment?: (assessment: Assessment) => void;
}

export const ClassContentsTab: React.FC<ClassContentsTabProps> = ({
  selectedClass,
  classLessons,
  classAssignments,
  classAssessments,
  submissions,
  onOpenNewLesson,
  onOpenNewAssignment,
  onOpenNewExam,
  onDeleteLesson,
  onDeleteAssignment,
  onDeleteAssessment,
  onOpenExamDetails,
  onReviewAssignmentSubmissions,
  onLaunchExamGrades,
}) => {
  const { updateAssignment, updateAssessment, currentUser } = useApp();

  // State
  const [topics, setTopics] = useState<ClassTopic[]>(() => getStoredTopics());
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Didactic Materials State
  const [didacticMaterials, setDidacticMaterials] = useState<DidacticMaterial[]>(() =>
    getStoredDidacticMaterials()
  );
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<DidacticMaterial | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialType, setMaterialType] = useState<DidacticMaterialType>('PDF');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialFileSize, setMaterialFileSize] = useState('2.5 MB');
  const [materialTopicId, setMaterialTopicId] = useState('');

  // Quizzes State
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => getStoredQuizzes());
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizInstructions, setQuizInstructions] = useState('');
  const [quizHasAudio, setQuizHasAudio] = useState(true);
  const [quizAudioUrl, setQuizAudioUrl] = useState(
    'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'
  );
  const [quizAudioTitle, setQuizAudioTitle] = useState('Listening Dialogue — Unit Conversation');
  const [quizTopicId, setQuizTopicId] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(20);
  const [quizDueDate, setQuizDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q_default_1',
      question: 'According to the audio recording, what was the speaker discussing?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'opt_1', text: 'Daily routines and vocabulary at the community center' },
        { id: 'opt_2', text: 'A trip to another city' },
        { id: 'opt_3', text: 'A cooking recipe' },
      ],
      correctOptionId: 'opt_1',
      points: 25,
      explanation: 'The conversation directly addressed daily routines.',
    },
    {
      id: 'q_default_2',
      question: 'True or False: The activities start promptly at the scheduled time.',
      type: 'TRUE_FALSE',
      correctBooleanAnswer: true,
      points: 25,
    },
  ]);

  // Preview / Take Quiz Modal
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<{ [qId: string]: string | boolean }>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [previewScore, setPreviewScore] = useState<number>(0);

  // Edit Assignment Modal
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editAsgTitle, setEditAsgTitle] = useState('');
  const [editAsgInstructions, setEditAsgInstructions] = useState('');
  const [editAsgDueDate, setEditAsgDueDate] = useState('');
  const [editAsgMaxScore, setEditAsgMaxScore] = useState(100);
  const [editAsgCategory, setEditAsgCategory] = useState<'REDACAO' | 'EXERCICIO' | 'PROJETO' | 'DIARIO' | 'PRATICA'>('EXERCICIO');
  const [editAsgDeliveryMethod, setEditAsgDeliveryMethod] = useState<'ONLINE' | 'PRESENCIAL' | 'HIBRIDO'>('ONLINE');

  // Edit Assessment (Exam) Modal
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamDate, setEditExamDate] = useState('');
  const [editExamTime, setEditExamTime] = useState('');
  const [editExamWeight, setEditExamWeight] = useState(30);
  const [editExamMaxScore, setEditExamMaxScore] = useState(100);
  const [editExamContent, setEditExamContent] = useState('');
  const [editExamInstructions, setEditExamInstructions] = useState('');

  // Audio Playback Preview State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Filter topics for this class
  const classTopics = topics.filter((t) => t.classId === selectedClass.id);

  // Filter materials and quizzes for this class
  const classMaterials = didacticMaterials.filter((m) => m.classId === selectedClass.id);
  const classQuizzes = quizzes.filter((q) => q.classId === selectedClass.id);

  // Create Topic
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTopic: ClassTopic = {
      id: `topic_${selectedClass.id}_${Date.now()}`,
      classId: selectedClass.id,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim() || undefined,
      order: classTopics.length + 1,
    };

    const updated = [...topics, newTopic];
    setTopics(updated);
    saveStoredTopics(updated);
    setNewTopicTitle('');
    setNewTopicDesc('');
    setIsCreatingTopic(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    if (confirm('Deseja realmente excluir este tópico? Os conteúdos serão mantidos no tópico geral.')) {
      const updated = topics.filter((t) => t.id !== topicId);
      setTopics(updated);
      saveStoredTopics(updated);
      if (selectedTopicId === topicId) setSelectedTopicId('all');
    }
  };

  // =========================================================================
  // DIDACTIC MATERIALS HANDLERS
  // =========================================================================
  const handleOpenNewMaterialModal = () => {
    setEditingMaterial(null);
    setMaterialTitle('');
    setMaterialDesc('');
    setMaterialType('PDF');
    setMaterialUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    setMaterialFileName('Apostila_Apoio_ThinkGreen.pdf');
    setMaterialFileSize('2.4 MB');
    setMaterialTopicId(classTopics[0]?.id || '');
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterialModal = (material: DidacticMaterial) => {
    setEditingMaterial(material);
    setMaterialTitle(material.title);
    setMaterialDesc(material.description || '');
    setMaterialType(material.type);
    setMaterialUrl(material.url);
    setMaterialFileName(material.fileName || '');
    setMaterialFileSize(material.fileSize || '2.0 MB');
    setMaterialTopicId(material.topicId || classTopics[0]?.id || '');
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) return;

    let updated: DidacticMaterial[];
    if (editingMaterial) {
      updated = didacticMaterials.map((m) =>
        m.id === editingMaterial.id
          ? {
              ...m,
              title: materialTitle.trim(),
              description: materialDesc.trim() || undefined,
              type: materialType,
              url: materialUrl.trim(),
              fileName: materialFileName.trim() || undefined,
              fileSize: materialFileSize.trim() || undefined,
              topicId: materialTopicId || undefined,
            }
          : m
      );
    } else {
      const newMat: DidacticMaterial = {
        id: `mat_${Date.now()}`,
        classId: selectedClass.id,
        className: selectedClass.name,
        topicId: materialTopicId || undefined,
        title: materialTitle.trim(),
        description: materialDesc.trim() || undefined,
        type: materialType,
        url: materialUrl.trim() || '#',
        fileName: materialFileName.trim() || (materialType === 'PDF' ? 'Documento_Didatico.pdf' : undefined),
        fileSize: materialFileSize.trim() || '2.1 MB',
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updated = [newMat, ...didacticMaterials];
    }

    setDidacticMaterials(updated);
    saveStoredDidacticMaterials(updated);
    setIsMaterialModalOpen(false);
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Deseja realmente excluir este material didático?')) {
      const updated = didacticMaterials.filter((m) => m.id !== id);
      setDidacticMaterials(updated);
      saveStoredDidacticMaterials(updated);
    }
  };

  // =========================================================================
  // QUIZZES HANDLERS (D2L / Google Forms Style with Audio)
  // =========================================================================
  const handleOpenNewQuizModal = () => {
    setEditingQuiz(null);
    setQuizTitle('');
    setQuizDesc('');
    setQuizInstructions('');
    setQuizHasAudio(true);
    setQuizAudioUrl('https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg');
    setQuizAudioTitle('Listening Track 01 — Conversation Dialogue');
    setQuizTopicId(classTopics[0]?.id || '');
    setQuizTimeLimit(20);
    setQuizDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setQuizQuestions([
      {
        id: `q_${Date.now()}_1`,
        question: 'According to the dialogue in the audio, what was the primary topic discussed?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'opt_1', text: 'Daily routines and conversation club hours' },
          { id: 'opt_2', text: 'Signing up for football practice' },
          { id: 'opt_3', text: 'Holiday schedule changes' },
        ],
        correctOptionId: 'opt_1',
        points: 25,
        explanation: 'The speaker introduces daily routines at the center.',
      },
      {
        id: `q_${Date.now()}_2`,
        question: 'True or False: Students are required to present their student card upon entering the classroom.',
        type: 'TRUE_FALSE',
        correctBooleanAnswer: true,
        points: 25,
      },
      {
        id: `q_${Date.now()}_3`,
        question: 'Fill in the blank: The receptionist noted that classes start at _____ o\'clock sharp.',
        type: 'FILL_BLANK',
        correctBlankAnswer: 'six',
        points: 25,
      },
      {
        id: `q_${Date.now()}_4`,
        question: 'Short Essay: In your own words, summarize what the student requested from the teacher.',
        type: 'ESSAY',
        points: 25,
      },
    ]);
    setIsQuizModalOpen(true);
  };

  const handleOpenEditQuizModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizTitle(quiz.title);
    setQuizDesc(quiz.description || '');
    setQuizInstructions(quiz.instructions || '');
    setQuizHasAudio(Boolean(quiz.audioUrl));
    setQuizAudioUrl(quiz.audioUrl || '');
    setQuizAudioTitle(quiz.audioTitle || 'Listening Track');
    setQuizTopicId(quiz.topicId || classTopics[0]?.id || '');
    setQuizTimeLimit(quiz.timeLimitMinutes || 20);
    setQuizDueDate(quiz.dueDate || '');
    setQuizQuestions(quiz.questions || []);
    setIsQuizModalOpen(true);
  };

  const handleAddQuestionToQuiz = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}_${quizQuestions.length + 1}`,
      question: 'Nova pergunta do Quiz...',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: `opt_${Date.now()}_a`, text: 'Opção A' },
        { id: `opt_${Date.now()}_b`, text: 'Opção B' },
      ],
      correctOptionId: `opt_${Date.now()}_a`,
      points: 25,
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    const updated = [...quizQuestions];
    updated[idx] = { ...updated[idx], ...patch };
    setQuizQuestions(updated);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  const handleAddOptionToQuestion = (qIdx: number) => {
    const q = quizQuestions[qIdx];
    const opts = q.options || [];
    const newOpt = { id: `opt_${Date.now()}_${opts.length + 1}`, text: `Nova Opção ${opts.length + 1}` };
    handleUpdateQuestion(qIdx, { options: [...opts, newOpt] });
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    const totalPoints = quizQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

    let updated: Quiz[];
    if (editingQuiz) {
      updated = quizzes.map((q) =>
        q.id === editingQuiz.id
          ? {
              ...q,
              title: quizTitle.trim(),
              description: quizDesc.trim() || undefined,
              instructions: quizInstructions.trim() || undefined,
              audioUrl: quizHasAudio && quizAudioUrl.trim() ? quizAudioUrl.trim() : undefined,
              audioTitle: quizHasAudio && quizAudioTitle.trim() ? quizAudioTitle.trim() : undefined,
              topicId: quizTopicId || undefined,
              timeLimitMinutes: Number(quizTimeLimit) || 20,
              dueDate: quizDueDate || undefined,
              questions: quizQuestions,
              totalPoints,
            }
          : q
      );
    } else {
      const newQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        classId: selectedClass.id,
        className: selectedClass.name,
        topicId: quizTopicId || undefined,
        title: quizTitle.trim(),
        description: quizDesc.trim() || undefined,
        instructions: quizInstructions.trim() || undefined,
        audioUrl: quizHasAudio && quizAudioUrl.trim() ? quizAudioUrl.trim() : undefined,
        audioTitle: quizHasAudio && quizAudioTitle.trim() ? quizAudioTitle.trim() : undefined,
        questions: quizQuestions,
        totalPoints,
        timeLimitMinutes: Number(quizTimeLimit) || 20,
        dueDate: quizDueDate || undefined,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser.name,
      };
      updated = [newQuiz, ...quizzes];
    }

    setQuizzes(updated);
    saveStoredQuizzes(updated);
    setIsQuizModalOpen(false);
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Deseja realmente excluir este Quiz?')) {
      const updated = quizzes.filter((q) => q.id !== id);
      setQuizzes(updated);
      saveStoredQuizzes(updated);
    }
  };

  // =========================================================================
  // EDIT ASSIGNMENT & ASSESSMENT HANDLERS (Requirement 5)
  // =========================================================================
  const handleOpenEditAssignment = (asg: Assignment) => {
    setEditingAssignment(asg);
    setEditAsgTitle(asg.title);
    setEditAsgInstructions(asg.instructions);
    setEditAsgDueDate(asg.dueDate);
    setEditAsgMaxScore(asg.maxScore);
    setEditAsgCategory(asg.category || 'EXERCICIO');
    setEditAsgDeliveryMethod(asg.deliveryMethod || 'ONLINE');
  };

  const handleSaveEditAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    updateAssignment(editingAssignment.id, {
      title: editAsgTitle,
      instructions: editAsgInstructions,
      dueDate: editAsgDueDate,
      maxScore: Number(editAsgMaxScore) || 100,
      category: editAsgCategory,
      deliveryMethod: editAsgDeliveryMethod,
    });

    setEditingAssignment(null);
  };

  const handleOpenEditAssessment = (exam: Assessment) => {
    setEditingAssessment(exam);
    setEditExamTitle(exam.title);
    setEditExamDate(exam.date);
    setEditExamTime(exam.time || '19:00');
    setEditExamWeight(exam.weight);
    setEditExamMaxScore(exam.maxScore);
    setEditExamContent(exam.content || exam.description || '');
    setEditExamInstructions(exam.instructions || '');
  };

  const handleSaveEditAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment) return;

    updateAssessment(editingAssessment.id, {
      title: editExamTitle,
      date: editExamDate,
      time: editExamTime,
      weight: Number(editExamWeight) || 30,
      maxScore: Number(editExamMaxScore) || 100,
      content: editExamContent,
      description: editExamContent.substring(0, 140),
      instructions: editExamInstructions,
    });

    setEditingAssessment(null);
  };

  // Helper to map content items into topics or default groupings
  const getItemsForTopic = (topic: ClassTopic) => {
    const isEvaluationTopic =
      topic.title.toLowerCase().includes('avalia') ||
      topic.title.toLowerCase().includes('prova');

    // Filter assessments
    const matchedExams = isEvaluationTopic
      ? classAssessments
      : classAssessments.filter((e, idx) => topic.order === 3 || idx === 0);

    // Filter lessons
    const matchedLessons = classLessons.filter((l, idx) => {
      if (isEvaluationTopic) return false;
      if (topic.order === 1) return idx % 2 === 0;
      return idx % 2 === 1;
    });

    // Filter assignments
    const matchedAssignments = classAssignments.filter((a, idx) => {
      if (isEvaluationTopic) return false;
      if (topic.order === 1) return idx % 2 === 0;
      return idx % 2 === 1;
    });

    // Filter didactic materials
    const matchedMaterials = classMaterials.filter((m) => {
      if (m.topicId) return m.topicId === topic.id;
      if (topic.title.toLowerCase().includes('material') || topic.title.toLowerCase().includes('leitura')) return true;
      return topic.order === 1;
    });

    // Filter quizzes
    const matchedQuizzes = classQuizzes.filter((q) => {
      if (q.topicId) return q.topicId === topic.id;
      if (isEvaluationTopic) return true;
      return topic.order === 2;
    });

    return { matchedLessons, matchedAssignments, matchedExams, matchedMaterials, matchedQuizzes };
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Create Menu + Topic Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/70 shadow-xs">
        {/* Left: Create dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Conteúdo</span>
            <ChevronDown className="w-4 h-4 text-emerald-200 ml-1" />
          </button>

          {showCreateMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-30 animate-in fade-in zoom-in-95"
              onClick={() => setShowCreateMenu(false)}
            >
              <button
                onClick={() => setIsCreatingTopic(true)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-[#075e38]" />
                <span>Novo Tópico / Unidade</span>
              </button>
              <div className="border-t border-slate-100 my-1" />

              {/* Requirement 1: Inserção de materiais didáticos */}
              <button
                onClick={handleOpenNewMaterialModal}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/70 text-xs font-bold text-emerald-900 flex items-center gap-2.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="block">Material Didático / Apoio</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF, Google Drive ou Vídeo</span>
                </div>
              </button>

              {/* Requirement 3: Quizzes com áudio */}
              <button
                onClick={handleOpenNewQuizModal}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/70 text-xs font-bold text-indigo-900 flex items-center gap-2.5 cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="block">Quiz Interativo com Áudio</span>
                  <span className="text-[10px] text-slate-400 font-normal">Formato D2L / Forms (Listening)</span>
                </div>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={onOpenNewAssignment}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span>Nova Atividade / Tarefa</span>
              </button>
              <button
                onClick={onOpenNewExam}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <Award className="w-4 h-4 text-purple-600" />
                <span>Nova Avaliação / Prova</span>
              </button>
              <button
                onClick={onOpenNewLesson}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <PlaySquare className="w-4 h-4 text-blue-600" />
                <span>Nova Aula (AVA)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar materiais, quizzes, aulas ou provas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 focus:bg-white"
          />
        </div>
      </div>

      {/* Topic Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedTopicId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedTopicId === 'all'
              ? 'bg-[#075e38] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          Todos os Tópicos ({classTopics.length})
        </button>

        {classTopics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTopicId === topic.id
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            {topic.title}
          </button>
        ))}

        <button
          onClick={() => setIsCreatingTopic(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#075e38] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Tópico</span>
        </button>
      </div>

      {/* Inline Create Topic Form */}
      {isCreatingTopic && (
        <form
          onSubmit={handleCreateTopic}
          className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#075e38]" />
            <h4 className="text-xs sm:text-sm font-bold text-[#075e38]">Novo Tópico da Turma</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ex: Unidade 03 — Past Continuous & Reading"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/30"
              required
            />
            <input
              type="text"
              placeholder="Descrição ou objetivos do tópico (opcional)"
              value={newTopicDesc}
              onChange={(e) => setNewTopicDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsCreatingTopic(false);
                setNewTopicTitle('');
                setNewTopicDesc('');
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl shadow-2xs cursor-pointer"
            >
              Salvar Tópico
            </button>
          </div>
        </form>
      )}

      {/* Topics Content Structure */}
      <div className="space-y-6">
        {classTopics
          .filter((t) => selectedTopicId === 'all' || selectedTopicId === t.id)
          .map((topic) => {
            const {
              matchedLessons,
              matchedAssignments,
              matchedExams,
              matchedMaterials,
              matchedQuizzes,
            } = getItemsForTopic(topic);
            const totalCount =
              matchedLessons.length +
              matchedAssignments.length +
              matchedExams.length +
              matchedMaterials.length +
              matchedQuizzes.length;

            return (
              <div
                key={topic.id}
                className="bg-white rounded-3xl border border-slate-200/70 shadow-xs overflow-hidden"
              >
                {/* Topic Header Bar */}
                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#075e38]" />
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {topic.title}
                      </h3>
                      <span className="text-[11px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {totalCount} {totalCount === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-slate-500 pl-5">{topic.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Excluir tópico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items inside this Topic */}
                <div className="divide-y divide-slate-100">
                  {/* 1. DIDACTIC MATERIALS (PDF, Google Drive, Video) */}
                  {matchedMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/15"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            mat.type === 'PDF'
                              ? 'bg-rose-100 text-rose-700'
                              : mat.type === 'DRIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {mat.type === 'PDF' && <FileText className="w-5 h-5" />}
                          {mat.type === 'DRIVE' && <HardDrive className="w-5 h-5" />}
                          {mat.type === 'VIDEO' && <Video className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                mat.type === 'PDF'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : mat.type === 'DRIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {mat.type === 'PDF' && 'Material PDF'}
                              {mat.type === 'DRIVE' && 'Google Drive'}
                              {mat.type === 'VIDEO' && 'Vídeo de Apoio'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{mat.title}</h4>
                          </div>

                          {mat.description && (
                            <p className="text-xs text-slate-600 line-clamp-1">{mat.description}</p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                            {mat.fileName && <span>Arquivo: <strong>{mat.fileName}</strong></span>}
                            {mat.fileSize && <span>• {mat.fileSize}</span>}
                            <span>• Postado em: {mat.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#075e38] text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <span>{mat.type === 'DRIVE' ? 'Abrir no Drive' : mat.type === 'VIDEO' ? 'Assistir Vídeo' : 'Visualizar PDF'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit Material (Requirement 5) */}
                        <button
                          onClick={() => handleOpenEditMaterialModal(mat)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar material didático"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 2. QUIZZES WITH AUDIO (Google Forms / D2L Style) */}
                  {matchedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/20"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <Headphones className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Quiz Interativo (Forms/D2L)
                            </span>
                            {quiz.audioUrl && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-purple-700" />
                                Áudio Listening Integrado
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-slate-900">{quiz.title}</h4>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1">
                            {quiz.description || quiz.instructions || 'Atividade interativa de compreensão e perguntas variadas.'}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span>Perguntas: <strong>{quiz.questions?.length || 0} questões</strong></span>
                            <span>•</span>
                            <span>Pontuação: <strong>{quiz.totalPoints} pontos</strong></span>
                            {quiz.timeLimitMinutes && (
                              <>
                                <span>•</span>
                                <span>Tempo: <strong>{quiz.timeLimitMinutes} min</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setPreviewQuiz(quiz);
                            setPreviewAnswers({});
                            setPreviewSubmitted(false);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlaySquare className="w-3.5 h-3.5" />
                          <span>Testar / Responder</span>
                        </button>

                        {/* Edit Quiz (Requirement 5) */}
                        <button
                          onClick={() => handleOpenEditQuizModal(quiz)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar Quiz e perguntas"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 3. ASSIGNMENTS (Tarefas) with Edit */}
                  {matchedAssignments.map((assign) => {
                    const assignSubmissions = submissions.filter((s) => s.assignmentId === assign.id);
                    const completedCount = assignSubmissions.filter(
                      (s) => s.status === 'AVALIADO' || s.status === 'VISTO'
                    ).length;
                    const pendingReviewCount = assignSubmissions.filter(
                      (s) => s.status === 'PENDENTE_CORRECAO'
                    ).length;

                    return (
                      <div
                        key={assign.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                                {assign.category || 'Atividade'}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">{assign.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{assign.instructions}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                              <span>Prazo: <strong>{assign.dueDate}</strong></span>
                              <span>•</span>
                              <span>Pontuação: <strong>{assign.maxScore} pontos</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => onReviewAssignmentSubmissions(assign)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                          >
                            Entregas ({assignSubmissions.length})
                          </button>

                          {/* Requirement 5: Edit Assignment */}
                          <button
                            onClick={() => handleOpenEditAssignment(assign)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar Atividade"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteAssignment(assign.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Excluir atividade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* 4. ASSESSMENTS (Exames) with Edit */}
                  {matchedExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50/20"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              Prova Oficial
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{exam.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {exam.content || exam.description || 'Conteúdo programático cadastrado.'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span>Data: <strong>{exam.date}</strong></span>
                            <span>•</span>
                            <span>Peso: <strong>{exam.weight}%</strong></span>
                            <span>•</span>
                            <span>Máx: <strong>{exam.maxScore} pts</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => onOpenExamDetails(exam)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => onLaunchExamGrades(exam)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Lançar Notas
                        </button>

                        {/* Requirement 5: Edit Assessment */}
                        <button
                          onClick={() => handleOpenEditAssessment(exam)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar Avaliação"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteAssessment(exam.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir prova"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 5. LESSONS (Aulas AVA) */}
                  {matchedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <PlaySquare className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                              Aula AVA
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{lesson.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">{lesson.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                            <span>Publicada em: {lesson.date}</span>
                            {lesson.materials && lesson.materials.length > 0 && (
                              <span className="font-semibold text-slate-600">
                                📎 {lesson.materials.length} anexo(s) disponível(is)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                          ✓ Disponível no AVA
                        </span>
                        <button
                          onClick={() => onDeleteLesson(lesson.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir aula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {totalCount === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium">Nenhum conteúdo publicado neste tópico ainda.</p>
                      <p className="text-[11px]">
                        Use o botão "Criar Conteúdo" acima para adicionar materiais didáticos, quizzes, tarefas ou provas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADICIONAR / EDITAR MATERIAL DIDÁTICO (Requirement 1)             */}
      {/* ========================================================================= */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#075e38] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMaterial ? 'Editar Material Didático' : 'Disponibilizar Material Didático'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    PDF, Google Drive ou Vídeos para consulta dos alunos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMaterialModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              {/* Type Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Material
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('PDF');
                      if (!materialFileName) setMaterialFileName('Apostila_Apoio.pdf');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      materialType === 'PDF'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Arquivo PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('DRIVE');
                      if (!materialFileName) setMaterialFileName('Pasta Google Drive');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      materialType === 'DRIVE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('VIDEO');
                      if (!materialFileName) setMaterialFileName('Vídeo de Apoio');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      materialType === 'VIDEO'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4 text-indigo-600" />
                    <span>Link de Vídeo</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apostila Oficial de Exercícios ou Pasta de Diálogos"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#075e38]/20 focus:outline-hidden"
                />
              </div>

              {/* URL Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {materialType === 'PDF'
                    ? 'Link direto do PDF / Documento'
                    : materialType === 'DRIVE'
                    ? 'Link compartilhado do Google Drive'
                    : 'Link do Vídeo (YouTube, Vimeo ou MP4)'} *
                </label>
                <input
                  type="url"
                  required
                  placeholder={
                    materialType === 'PDF'
                      ? 'https://.../arquivo.pdf'
                      : materialType === 'DRIVE'
                      ? 'https://drive.google.com/drive/folders/...'
                      : 'https://www.youtube.com/watch?v=...'
                  }
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-[#075e38]/20 focus:outline-hidden"
                />
              </div>

              {/* File details for PDF / Drive */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome de exibição do arquivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Apostila_Gramatica.pdf"
                    value={materialFileName}
                    onChange={(e) => setMaterialFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular ao Tópico
                  </label>
                  <select
                    value={materialTopicId}
                    onChange={(e) => setMaterialTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-hidden"
                  >
                    {classTopics.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Orientações para o Aluno (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Orientações pedagógicas sobre como utilizar o material para estudar ou fazer tarefas..."
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingMaterial ? 'Salvar Alterações' : 'Publicar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CRIAR / EDITAR QUIZ COM ÁUDIO (Requirement 3)                    */}
      {/* ========================================================================= */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingQuiz ? 'Editar Quiz Interativo' : 'Criador de Quiz Interativo (Forms / D2L)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atividades com áudio integrado para compreensão auditiva e diferentes tipos de pergunta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Quiz *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Listening Quiz 01 — Everyday Dialogues"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular ao Tópico
                  </label>
                  <select
                    value={quizTopicId}
                    onChange={(e) => setQuizTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-hidden"
                  >
                    {classTopics.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruções para o Estudante
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Ouça o áudio gravado e responda às perguntas a seguir diretamente na plataforma..."
                  value={quizInstructions}
                  onChange={(e) => setQuizInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              {/* Audio Track Attachment Box (Requirement 3) */}
              <div className="bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950">
                      Áudio de Compreensão Auditiva (Listening Comprehension)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-900">
                    <input
                      type="checkbox"
                      checked={quizHasAudio}
                      onChange={(e) => setQuizHasAudio(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ativar faixa de áudio</span>
                  </label>
                </div>

                {quizHasAudio && (
                  <div className="space-y-3 pt-2 border-t border-indigo-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Título / Nome da Faixa de Áudio
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Track 01 — Conversation at the Reception"
                          value={quizAudioTitle}
                          onChange={(e) => setQuizAudioTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-900 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          URL do Arquivo de Áudio (MP3 / OGG)
                        </label>
                        <input
                          type="url"
                          placeholder="https://.../audio.mp3"
                          value={quizAudioUrl}
                          onChange={(e) => setQuizAudioUrl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-mono text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Audio Preview Player */}
                    {quizAudioUrl && (
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Headphones className="w-4 h-4 text-indigo-600" />
                          <span>Player de Teste:</span>
                        </div>
                        <audio controls src={quizAudioUrl} className="h-8 max-w-xs flex-1">
                          Seu navegador não suporta reprodução de áudio.
                        </audio>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Questions Builder Section (Forms/D2L style) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-[#075e38]" />
                    <span>Perguntas do Quiz ({quizQuestions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionToQuiz}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075e38] text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Pergunta</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                          Questão #{qIdx + 1}
                        </span>

                        <div className="flex items-center gap-3">
                          {/* Question Type selector */}
                          <select
                            value={q.type}
                            onChange={(e) =>
                              handleUpdateQuestion(qIdx, {
                                type: e.target.value as QuizQuestionType,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800"
                          >
                            <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
                            <option value="TRUE_FALSE">Verdadeiro ou Falso</option>
                            <option value="FILL_BLANK">Preenchimento de Lacuna</option>
                            <option value="ESSAY">Dissertativa / Aberta</option>
                          </select>

                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400">Pontos:</span>
                            <input
                              type="number"
                              value={q.points}
                              onChange={(e) =>
                                handleUpdateQuestion(qIdx, { points: Number(e.target.value) || 0 })
                              }
                              className="w-14 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-center"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remover pergunta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        placeholder="Enunciado da pergunta..."
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                        required
                      />

                      {/* Render type-specific options */}
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2 pt-1 pl-2">
                          <p className="text-[11px] font-bold text-slate-500">
                            Opções de Resposta (Marque a alternativa correta para gabarito automático):
                          </p>
                          {(q.options || []).map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correctOptionId === opt.id}
                                onChange={() => handleUpdateQuestion(qIdx, { correctOptionId: opt.id })}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const updatedOpts = [...(q.options || [])];
                                  updatedOpts[oIdx] = { ...updatedOpts[oIdx], text: e.target.value };
                                  handleUpdateQuestion(qIdx, { options: updatedOpts });
                                }}
                                className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddOptionToQuestion(qIdx)}
                            className="text-xs font-bold text-indigo-700 hover:underline pt-1 block"
                          >
                            + Adicionar alternativa
                          </button>
                        </div>
                      )}

                      {q.type === 'TRUE_FALSE' && (
                        <div className="flex items-center gap-4 pt-1 pl-2">
                          <span className="text-xs font-bold text-slate-600">Gabarito correto:</span>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf_${q.id}`}
                              checked={q.correctBooleanAnswer === true}
                              onChange={() => handleUpdateQuestion(qIdx, { correctBooleanAnswer: true })}
                            />
                            <span>Verdadeiro (True)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-rose-800 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf_${q.id}`}
                              checked={q.correctBooleanAnswer === false}
                              onChange={() => handleUpdateQuestion(qIdx, { correctBooleanAnswer: false })}
                            />
                            <span>Falso (False)</span>
                          </label>
                        </div>
                      )}

                      {q.type === 'FILL_BLANK' && (
                        <div className="pt-1 pl-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Palavra ou Frase Exata Esperada (Gabarito de preenchimento):
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: at / six / ID"
                            value={q.correctBlankAnswer || ''}
                            onChange={(e) => handleUpdateQuestion(qIdx, { correctBlankAnswer: e.target.value })}
                            className="w-full max-w-xs px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      )}

                      {q.type === 'ESSAY' && (
                        <div className="pt-1 pl-2">
                          <p className="text-[11px] text-slate-500 italic">
                            Esta pergunta é dissertativa / aberta. O estudante responderá com um texto livre e o professor avaliará com feedback pedagógico.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingQuiz ? 'Salvar Alterações no Quiz' : 'Publicar Quiz Interativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PREVIEW / TESTAR QUIZ (Google Forms / D2L Interface)             */}
      {/* ========================================================================= */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Ambiente de Resposta do Estudante (D2L / Forms)
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {previewQuiz.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewQuiz(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audio Player Bar */}
            {previewQuiz.audioUrl && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-200">
                    <Headphones className="w-4 h-4 text-indigo-300" />
                    {previewQuiz.audioTitle || 'Faixa de Áudio de Compreensão'}
                  </span>
                  <span className="text-[11px] text-indigo-300 font-mono">Listening Task</span>
                </div>
                <p className="text-xs text-indigo-100/90">
                  Ouça a gravação de áudio com atenção antes de responder às questões.
                </p>
                <audio controls src={previewQuiz.audioUrl} className="w-full mt-2">
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            )}

            {/* Instructions */}
            {previewQuiz.instructions && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <strong>Instruções:</strong> {previewQuiz.instructions}
              </div>
            )}

            {/* Questions Form */}
            <div className="space-y-5">
              {previewQuiz.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      Questão {idx + 1} de {previewQuiz.questions.length}
                    </span>
                    <span className="text-slate-400 font-semibold">{q.points} pontos</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-800">{q.question}</p>

                  {/* Options */}
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            previewAnswers[q.id] === opt.id
                              ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`ans_${q.id}`}
                            checked={previewAnswers[q.id] === opt.id}
                            onChange={() =>
                              setPreviewAnswers({ ...previewAnswers, [q.id]: opt.id })
                            }
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'TRUE_FALSE' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: true })}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          previewAnswers[q.id] === true
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ✓ Verdadeiro (True)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: false })}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          previewAnswers[q.id] === false
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ✗ Falso (False)
                      </button>
                    </div>
                  )}

                  {q.type === 'FILL_BLANK' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Digite sua resposta aqui..."
                        value={(previewAnswers[q.id] as string) || ''}
                        onChange={(e) =>
                          setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {q.type === 'ESSAY' && (
                    <div className="pt-1">
                      <textarea
                        rows={3}
                        placeholder="Escreva sua resposta dissertativa em inglês..."
                        value={(previewAnswers[q.id] as string) || ''}
                        onChange={(e) =>
                          setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* Feedback if submitted in preview */}
                  {previewSubmitted && (
                    <div className="p-3 rounded-xl bg-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Correção da Questão:</span>
                      </div>
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <p className="text-slate-600">
                          {previewAnswers[q.id] === q.correctOptionId ? '✓ Correto (+25 pts)' : '✗ Incorreto'}
                        </p>
                      )}
                      {q.type === 'TRUE_FALSE' && (
                        <p className="text-slate-600">
                          {previewAnswers[q.id] === q.correctBooleanAnswer ? '✓ Correto (+25 pts)' : '✗ Incorreto'}
                        </p>
                      )}
                      {q.type === 'FILL_BLANK' && (
                        <p className="text-slate-600">
                          Gabarito esperado: "<strong>{q.correctBlankAnswer}</strong>"
                        </p>
                      )}
                      {q.type === 'ESSAY' && (
                        <p className="text-slate-600">Resposta enviada para avaliação manual do docente.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit / Finish Preview Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {previewSubmitted && (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    Pontuação no Teste: {previewScore} / {previewQuiz.totalPoints} pts
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let score = 0;
                    previewQuiz.questions.forEach((q) => {
                      if (q.type === 'MULTIPLE_CHOICE' && previewAnswers[q.id] === q.correctOptionId) {
                        score += q.points;
                      } else if (q.type === 'TRUE_FALSE' && previewAnswers[q.id] === q.correctBooleanAnswer) {
                        score += q.points;
                      } else if (
                        q.type === 'FILL_BLANK' &&
                        typeof previewAnswers[q.id] === 'string' &&
                        (previewAnswers[q.id] as string).trim().toLowerCase() ===
                          (q.correctBlankAnswer || '').trim().toLowerCase()
                      ) {
                        score += q.points;
                      } else if (q.type === 'ESSAY' && previewAnswers[q.id]) {
                        score += q.points;
                      }
                    });
                    setPreviewScore(score);
                    setPreviewSubmitted(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {previewSubmitted ? 'Recalcular Gabarito' : 'Enviar Respostas (Simulação)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDITAR ATIVIDADE / TAREFA (Requirement 5)                        */}
      {/* ========================================================================= */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Atividade Publicada</h3>
                  <p className="text-xs text-slate-500">
                    Ajuste instruções, prazo ou critérios sem perder entregas existentes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  required
                  value={editAsgTitle}
                  onChange={(e) => setEditAsgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    required
                    value={editAsgDueDate}
                    onChange={(e) => setEditAsgDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nota Máxima (pts)
                  </label>
                  <input
                    type="number"
                    required
                    value={editAsgMaxScore}
                    onChange={(e) => setEditAsgMaxScore(Number(e.target.value) || 100)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruções e Enunciado
                </label>
                <textarea
                  rows={4}
                  required
                  value={editAsgInstructions}
                  onChange={(e) => setEditAsgInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDITAR AVALIAÇÃO / PROVA (Requirement 5)                         */}
      {/* ========================================================================= */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Avaliação / Prova</h3>
                  <p className="text-xs text-slate-500">
                    Ajuste datas, pesos ou conteúdo programático da avaliação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAssessment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Prova *
                </label>
                <input
                  type="text"
                  required
                  value={editExamTitle}
                  onChange={(e) => setEditExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Aplicação
                  </label>
                  <input
                    type="date"
                    required
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={editExamTime}
                    onChange={(e) => setEditExamTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso na Média (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={editExamWeight}
                    onChange={(e) => setEditExamWeight(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nota Máxima (pts)
                  </label>
                  <input
                    type="number"
                    required
                    value={editExamMaxScore}
                    onChange={(e) => setEditExamMaxScore(Number(e.target.value) || 100)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conteúdo Programático Cobrado
                </label>
                <textarea
                  rows={3}
                  value={editExamContent}
                  onChange={(e) => setEditExamContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
