import React, { useState, useMemo } from 'react';
import {
  Compass,
  Users,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  BookOpen,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  Award,
  ArrowRight,
  FolderOpen,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { TeacherPortal, TeacherNavTab } from '../../teacher/TeacherPortal';
import { ClassRoom } from '../../../../types';

export const SecretariatCounselorTab: React.FC = () => {
  const { state } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedNavTab, setSelectedNavTab] = useState<TeacherNavTab>('turmas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return state.classes.filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.teacherName && cls.teacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.courseName && cls.courseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourse =
        selectedCourseFilter === 'ALL' || cls.courseId === selectedCourseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [state.classes, searchQuery, selectedCourseFilter]);

  // If a class is selected, render TeacherPortal with counselorMode
  if (selectedClassId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <TeacherPortal
          currentTab="sec_counselor"
          setCurrentTab={() => {}}
          counselorMode={true}
          initialClassId={selectedClassId}
          initialNavTab={selectedNavTab}
          onBackToCounselor={() => {
            setSelectedClassId(null);
            setSelectedNavTab('turmas');
          }}
        />
      </div>
    );
  }

  // Summary Metrics
  const totalClasses = state.classes.length;
  const activeEnrollmentsCount = state.enrollments.filter((e) => e.status === 'ATIVA').length;
  const totalLessonsCount = state.lessons.length;
  const totalAssessmentsCount = state.assessments.length;
  const totalAssignmentsCount = state.assignments.length;
  const totalAttendanceCount = state.attendance.length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#075e38] to-teal-900 text-white p-6 sm:p-8 shadow-md border border-emerald-800/40">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              Orientador Educacional
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-emerald-100 backdrop-blur-xs">
              Supervisão Pedagógica & Acompanhamento
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Central do Orientador Educacional
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-3xl">
            Acompanhe o desempenho de todas as turmas da instituição com acesso irrestrito às mesmas ferramentas do professor.
            Clique em qualquer turma para gerenciar chamadas, inspecionar notas de provas, revisar diários de aula e tarefas pedagógicas.
          </p>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center mb-2.5">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalClasses}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Turmas Ativas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{activeEnrollmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Alunos Matriculados</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalAttendanceCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Chamadas Feitas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalAssessmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Provas & Exames</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalLessonsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Aulas no Diário</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2.5">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalAssignmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Atividades Criadas</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar turma por nome, código (ex: SOC-8A), professor..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38] focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold self-start sm:self-auto">
            Mostrando <span className="text-[#075e38] font-bold">{filteredClasses.length}</span> de{' '}
            <span className="font-bold">{state.classes.length}</span> turmas
          </div>
        </div>

        {/* Course Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Cursos:
          </span>
          <button
            onClick={() => setSelectedCourseFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              selectedCourseFilter === 'ALL'
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Cursos
          </button>
          {state.courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseFilter(course.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCourseFilter === course.id
                  ? 'bg-[#075e38] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {course.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma turma encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nenhuma turma corresponde à sua busca por "{searchQuery}". Tente usar outro termo ou limpar os filtros.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCourseFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const enrollments = state.enrollments.filter(
              (e) => e.classId === cls.id && e.status === 'ATIVA'
            );
            const classAssessments = state.assessments.filter((a) => a.classId === cls.id);
            const classLessons = state.lessons.filter((l) => l.classId === cls.id);
            const classAttendance = state.attendance.filter((att) => att.classId === cls.id);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-3xl border-2 border-slate-200/80 hover:border-[#075e38] transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Card Section */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Badges Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#075e38] text-[11px] font-black uppercase tracking-wider">
                      {cls.code}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                      {cls.status === 'ATIVA' ? 'Turma Ativa' : 'Em Formação'}
                    </span>
                  </div>

                  {/* Title & Course */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#075e38] transition-colors leading-tight">
                      {cls.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#075e38]" />
                      <span>{cls.courseName || 'Curso Think Green'}</span>
                    </p>
                  </div>

                  {/* Class Meta Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500 font-medium">Professor:</span>
                      <strong className="text-slate-900 font-semibold">{cls.teacherName || 'Docente Responsável'}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500 font-medium">Horário:</span>
                      <strong className="text-slate-800 font-semibold">{cls.schedule}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500 font-medium">Local:</span>
                      <strong className="text-slate-800 font-semibold">{cls.room}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500 font-medium">Matriculados:</span>
                      <strong className="text-slate-900 font-bold">{enrollments.length} alunos</strong>
                      <span className="text-[10px] text-slate-400">(máx. {cls.capacity || 25})</span>
                    </div>
                  </div>

                  {/* Mini Stats Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-black text-slate-800">{classAttendance.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Chamadas</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-black text-slate-800">{classAssessments.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Provas</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-black text-slate-800">{classLessons.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Aulas</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Section */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                  {/* Primary Enter Button */}
                  <button
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedNavTab('turmas');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <span>Entrar na Turma (Visão do Professor)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Direct Tab Shortcuts */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedNavTab('chamadas');
                      }}
                      className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      title="Abrir Diário de Chamadas"
                    >
                      Chamada
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedNavTab('notas');
                      }}
                      className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      title="Abrir Boletim e Notas"
                    >
                      Notas
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedNavTab('provas');
                      }}
                      className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      title="Abrir Avaliações e Exames"
                    >
                      Provas
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedNavTab('aulas');
                      }}
                      className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 hover:text-[#075e38] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      title="Abrir Plano de Aulas"
                    >
                      Aulas
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
