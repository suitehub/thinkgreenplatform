import React from 'react';
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Clock,
  Award,
  BookOpen,
  Plus,
  CalendarCheck,
  ChevronDown,
  LayoutGrid,
  FileText,
  UserCheck,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { ClassRoom } from '../../../types';
import {
  SoccerBallBadge,
  USAFlagBadge,
  ReadingBookBadge,
  PreschoolBadge,
  WomenFitBadge,
  ThinkGardenLogo,
} from '../../common/ThinkGardenLogos';

export type ClassSubTab = 'visao_geral' | 'conteudos' | 'pessoas' | 'notas' | 'chamada';

interface ClassHeaderProps {
  selectedClass: ClassRoom;
  allClasses: ClassRoom[];
  onSelectClass: (classId: string) => void;
  onBackToClasses: () => void;
  activeSubTab: ClassSubTab;
  onChangeSubTab: (tab: ClassSubTab) => void;
  studentsCount: number;
  onOpenNewExam: () => void;
  onOpenNewLesson: () => void;
  onOpenNewAssignment: () => void;
  counselorMode?: boolean;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  selectedClass,
  allClasses,
  onSelectClass,
  onBackToClasses,
  activeSubTab,
  onChangeSubTab,
  studentsCount,
  onOpenNewExam,
  onOpenNewLesson,
  onOpenNewAssignment,
  counselorMode = false,
}) => {
  // Helper to choose badge icon based on class/course name
  const renderBadge = () => {
    const name = (selectedClass.name || '').toLowerCase();
    const course = (selectedClass.courseName || '').toLowerCase();
    if (name.includes('soccer') || course.includes('futebol')) {
      return <SoccerBallBadge className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0" />;
    }
    if (name.includes('english') || course.includes('inglês') || course.includes('ingles')) {
      return <USAFlagBadge className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0" />;
    }
    if (name.includes('reading') || course.includes('leitura')) {
      return <ReadingBookBadge className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0" />;
    }
    if (name.includes('preschool') || course.includes('infantil')) {
      return <PreschoolBadge className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0" />;
    }
    if (name.includes('women') || course.includes('feminino') || course.includes('fit')) {
      return <WomenFitBadge className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0" />;
    }
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
        <BookOpen className="w-8 h-8 text-emerald-200" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb + Quick Switcher + Return */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 sm:px-5 py-3 rounded-2xl border border-slate-200/70 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onBackToClasses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Voltar para a lista geral de turmas"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>{counselorMode ? 'Voltar às Turmas' : 'Minhas Turmas'}</span>
          </button>

          <span className="text-slate-300 hidden sm:inline">/</span>

          {/* Class Quick Switcher */}
          <div className="relative inline-flex items-center min-w-0 max-w-full">
            <span className="text-xs font-semibold text-slate-500 mr-2 hidden md:inline flex-shrink-0">
              Turma Ativa:
            </span>
            <div className="relative min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
              <select
                value={selectedClass.id}
                onChange={(e) => onSelectClass(e.target.value)}
                className="w-full appearance-none bg-emerald-50/70 hover:bg-emerald-50 text-[#075e38] font-bold text-xs sm:text-sm pl-3 pr-8 py-1.5 rounded-xl border border-emerald-200/80 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 cursor-pointer shadow-2xs truncate"
              >
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                    {c.name} ({c.code || 'Turma'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#075e38] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Classroom Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onChangeSubTab('chamada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              activeSubTab === 'chamada'
                ? 'bg-[#075e38] text-white'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#075e38] border border-slate-200/70'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fazer Chamada</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <button
              onClick={onOpenNewLesson}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60 cursor-pointer transition-colors"
              title="Publicar nova aula com materiais"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Aula</span>
            </button>

            <button
              onClick={onOpenNewAssignment}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60 cursor-pointer transition-colors"
              title="Criar nova atividade para a turma"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Atividade</span>
            </button>

            <button
              onClick={onOpenNewExam}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60 cursor-pointer transition-colors"
              title="Cadastrar nova prova ou avaliação"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Prova</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Think Green Institutional Class Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e2e] via-[#075e38] to-[#0a6c42] text-white shadow-md p-6 sm:p-8">
        {/* Subtle geometric pattern / ambient decor */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <ThinkGardenLogo className="w-64 h-64 text-white" />
        </div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {renderBadge()}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-white/20 text-emerald-100 border border-white/20 flex-shrink-0">
                  {selectedClass.code || 'TURMA'}
                </span>
                <span className="text-xs text-emerald-200 font-medium truncate">
                  {selectedClass.courseName || 'Programa Educacional Think Green'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words" title={selectedClass.name}>
                {selectedClass.name}
              </h1>

              {/* Meta details list */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100/90 pt-1">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    Professor: <strong className="text-white">{selectedClass.teacherName || 'Lucas Silva'}</strong>
                  </span>
                </div>

                {selectedClass.schedule && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{selectedClass.schedule}</span>
                  </div>
                )}

                {selectedClass.room && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{selectedClass.room}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    <strong className="text-white">{studentsCount}</strong> alunos matriculados
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick status box on the right */}
          <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-white/15 pt-4 md:pt-0">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-100">Turma Ativa • 2026</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-medium text-right hidden sm:block">
              Gestão Pedagógica Centralizada
            </p>
          </div>
        </div>
      </div>

      {/* Google Classroom-Inspired Structural Navigation Bar (Think Green Styling) */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-1.5 shadow-2xs flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* 1. Visão Geral (Stream / Mural) */}
        <button
          onClick={() => onChangeSubTab('visao_geral')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'visao_geral'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Visão Geral</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'visao_geral'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            Mural
          </span>
        </button>

        {/* 2. Conteúdos (Classwork / Tópicos) */}
        <button
          onClick={() => onChangeSubTab('conteudos')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'conteudos'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Conteúdos</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'conteudos'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            Tópicos
          </span>
        </button>

        {/* 3. Pessoas (People) */}
        <button
          onClick={() => onChangeSubTab('pessoas')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pessoas'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pessoas</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'pessoas'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {studentsCount}
          </span>
        </button>

        {/* 4. Notas (Gradebook) */}
        <button
          onClick={() => onChangeSubTab('notas')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'notas'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Notas</span>
        </button>

        {/* 5. Chamada (Frequência) */}
        <button
          onClick={() => onChangeSubTab('chamada')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'chamada'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Frequência</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'chamada'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100/70 text-[#075e38]'
            }`}
          >
            Diário
          </span>
        </button>
      </div>
    </div>
  );
};
