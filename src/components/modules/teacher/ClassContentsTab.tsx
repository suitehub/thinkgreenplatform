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
} from 'lucide-react';
import { ClassRoom, Assessment, Assignment, Lesson, Submission } from '../../../types';
import {
  ClassTopic,
  getStoredTopics,
  saveStoredTopics,
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
  const [topics, setTopics] = useState<ClassTopic[]>(() => getStoredTopics());
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Topics for this class
  const classTopics = topics.filter((t) => t.classId === selectedClass.id);

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

  // Helper to map content items into topics or default groupings
  // In our pedagogical mapping:
  // - Assessments usually fall into topic_eng_3 / topic_soc_3 / topic_read_3 (or the topic containing 'Avalia' or last topic)
  // - Lessons are distributed: earlier lessons in topic 1, later in topic 2
  // - Assignments follow suit
  const getItemsForTopic = (topic: ClassTopic) => {
    const isEvaluationTopic = topic.title.toLowerCase().includes('avalia') || topic.title.toLowerCase().includes('prova');

    // Filter assessments
    const matchedExams = isEvaluationTopic ? classAssessments : [];

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

    return { matchedLessons, matchedAssignments, matchedExams };
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
              className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-30 animate-in fade-in zoom-in-95"
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
              <button
                onClick={onOpenNewLesson}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <PlaySquare className="w-4 h-4 text-blue-600" />
                <span>Nova Aula (AVA)</span>
              </button>
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
            </div>
          )}
        </div>

        {/* Right: Quick Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar aulas, atividades ou provas..."
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
            <h4 className="text-xs sm:text-sm font-bold text-[#075e38]">
              Novo Tópico da Turma
            </h4>
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

      {/* Topics Content Structure (Google Classroom Classwork format) */}
      <div className="space-y-6">
        {classTopics
          .filter((t) => selectedTopicId === 'all' || selectedTopicId === t.id)
          .map((topic) => {
            const { matchedLessons, matchedAssignments, matchedExams } = getItemsForTopic(topic);
            const totalCount = matchedLessons.length + matchedAssignments.length + matchedExams.length;

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
                      <p className="text-xs text-slate-500 pl-5">
                        {topic.description}
                      </p>
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
                  {/* 1. Lessons */}
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
                            <h4 className="text-sm font-bold text-slate-900">
                              {lesson.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {lesson.description}
                          </p>
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

                  {/* 2. Assignments */}
                  {matchedAssignments.map((assign) => {
                    const assignSubmissions = submissions.filter((s) => s.assignmentId === assign.id);
                    const completedCount = assignSubmissions.filter((s) => s.status === 'AVALIADO' || s.status === 'VISTO').length;
                    const pendingReviewCount = assignSubmissions.filter((s) => s.status === 'PENDENTE_CORRECAO').length;

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
                              <h4 className="text-sm font-bold text-slate-900">
                                {assign.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">
                              {assign.instructions}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                              <span>Prazo: <strong>{assign.dueDate}</strong></span>
                              <span>•</span>
                              <span>Pontuação: <strong>{assign.maxScore} pontos</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Submission counters */}
                          <div className="text-right text-[11px] space-y-0.5 hidden sm:block">
                            <span className="text-emerald-700 font-bold block">
                              ✓ {completedCount} avaliados
                            </span>
                            {pendingReviewCount > 0 && (
                              <span className="text-amber-700 font-bold block">
                                ⚠ {pendingReviewCount} aguardando correção
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => onReviewAssignmentSubmissions(assign)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                          >
                            Ver Entregas ({assignSubmissions.length})
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

                  {/* 3. Assessments / Exams */}
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
                            <h4 className="text-sm font-bold text-slate-900">
                              {exam.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {exam.content || exam.description || 'Avaliação bimestral integrada com conteúdo programático cadastrado.'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span>Data da Prova: <strong>{exam.date}</strong></span>
                            <span>•</span>
                            <span>Peso na Média: <strong>{exam.weight}%</strong></span>
                            <span>•</span>
                            <span>Nota Máxima: <strong>{exam.maxScore} pontos</strong></span>
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

                  {totalCount === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium">Nenhum conteúdo publicado neste tópico ainda.</p>
                      <p className="text-[11px]">Use o botão "Criar Conteúdo" acima para adicionar aulas, atividades ou provas.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
