import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Eye,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  LayoutGrid,
  List,
  GraduationCap,
  Sparkles,
  Link,
  Unlink,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { Modal } from '../../../common/Modal';
import { Badge } from '../../../common/Badge';
import { ClassRoom, User } from '../../../../types';

export const SecretariatClassesTab: React.FC = () => {
  const {
    state,
    createClass,
    updateClass,
    deleteClass,
    assignTeacherToClass,
    unassignTeacherFromClass,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterTeacherStatus, setFilterTeacherStatus] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
  const [assigningTeacherClass, setAssigningTeacherClass] = useState<ClassRoom | null>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassRoom | null>(null);

  // Filter teachers list from users
  const availableTeachers = state.users.filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.department?.toLowerCase().includes('docente') ||
      u.department?.toLowerCase().includes('professor')
  );

  // New Class Form State
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    code: '',
    courseId: state.courses[0]?.id || '',
    teacherId: availableTeachers[0]?.id || '',
    teacherName: availableTeachers[0]?.name || 'Sem professor vinculado',
    schedule: 'Segunda e Quarta, 18:00 - 19:30',
    room: 'Sala 01 - Bloco A',
    maxCapacity: 25,
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    status: 'ACTIVE' as const,
  });

  // Edit Class Form State
  const [editClassForm, setEditClassForm] = useState({
    name: '',
    code: '',
    courseId: '',
    teacherId: '',
    teacherName: '',
    schedule: '',
    room: '',
    maxCapacity: 25,
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as const,
  });

  // Search inside Teacher Assign Modal
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  // Filter classes
  const filteredClasses = state.classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = filterCourse === 'ALL' || cls.courseId === filterCourse;
    const matchesStatus = filterStatus === 'ALL' || cls.status === filterStatus;

    const isUnassigned =
      !cls.teacherId ||
      cls.teacherId === '' ||
      cls.teacherName.toLowerCase().includes('sem professor');

    const matchesTeacher =
      filterTeacherStatus === 'ALL' ||
      (filterTeacherStatus === 'ASSIGNED' && !isUnassigned) ||
      (filterTeacherStatus === 'UNASSIGNED' && isUnassigned);

    return matchesSearch && matchesCourse && matchesStatus && matchesTeacher;
  });

  // Counts for summary metrics
  const totalClasses = state.classes.length;
  const classesWithTeacher = state.classes.filter(
    (c) => c.teacherId && !c.teacherName.toLowerCase().includes('sem professor')
  ).length;
  const classesWithoutTeacher = totalClasses - classesWithTeacher;
  const totalActiveEnrollments = state.enrollments.filter((e) => e.status === 'ATIVA').length;

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setEditClassForm({
      name: cls.name,
      code: cls.code,
      courseId: cls.courseId,
      teacherId: cls.teacherId,
      teacherName: cls.teacherName,
      schedule: cls.schedule,
      room: cls.room,
      maxCapacity: cls.maxCapacity,
      startDate: cls.startDate,
      endDate: cls.endDate,
      status: cls.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    updateClass(editingClass.id, {
      ...editClassForm,
    });

    setEditingClass(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingClass) return;
    deleteClass(deletingClass.id);
    setDeletingClass(null);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.name || !newClassForm.courseId) return;

    createClass({
      ...newClassForm,
    });

    setIsNewClassModalOpen(false);
    setNewClassForm({
      name: '',
      code: '',
      courseId: state.courses[0]?.id || '',
      teacherId: availableTeachers[0]?.id || '',
      teacherName: availableTeachers[0]?.name || 'Sem professor vinculado',
      schedule: 'Segunda e Quarta, 18:00 - 19:30',
      room: 'Sala 01 - Bloco A',
      maxCapacity: 25,
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      status: 'ACTIVE',
    });
  };

  const handleQuickAssign = (teacher: User) => {
    if (!assigningTeacherClass) return;
    assignTeacherToClass(assigningTeacherClass.id, teacher.id, teacher.name);
    setAssigningTeacherClass(null);
    setTeacherSearchQuery('');
  };

  const handleQuickUnassign = (cls: ClassRoom) => {
    unassignTeacherFromClass(cls.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Secretaria • Gestão de Turmas & Docência
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quadro Geral de Turmas, Salas & Professores
          </h2>
          <p className="text-xs text-slate-500">
            Crie, edite, exclua e gerencie vínculos de docentes para cada turma do centro comunitário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewClassModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Cadastrar Nova Turma
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[11px] block font-medium">Total de Turmas</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalClasses}</p>
          <span className="text-[10px] text-slate-400">Em todos os cursos</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-emerald-700 text-[11px] block font-semibold">Com Professor Vinculado</span>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{classesWithTeacher}</p>
          <span className="text-[10px] text-slate-400">Docência ativa</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-amber-700 text-[11px] block font-semibold">Sem Professor</span>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{classesWithoutTeacher}</p>
          <span className="text-[10px] text-slate-400">Requer vinculação</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-700 text-[11px] block font-semibold">Alunos Matriculados</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalActiveEnrollments}</p>
          <span className="text-[10px] text-slate-400">Vínculos ativos</span>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por turma, código, sala, docente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Filter Course */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">Todos os Cursos</option>
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Teacher Status */}
          <select
            value={filterTeacherStatus}
            onChange={(e) => setFilterTeacherStatus(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="ALL">Status Docente: Todos</option>
            <option value="ASSIGNED">Com Docente</option>
            <option value="UNASSIGNED">Sem Docente</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="ALL">Status Turma: Todos</option>
            <option value="ACTIVE">Ativa</option>
            <option value="UPCOMING">Planejada</option>
            <option value="COMPLETED">Encerrada</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Visualização em Cartões"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cartões</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Visualização em Tabela"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabela</span>
          </button>
        </div>
      </div>

      {/* Grid of Class Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nenhuma turma encontrada</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente ajustar seus filtros de busca ou cadastre uma nova turma.</p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const enrolledStudents = state.enrollments.filter(
                (e) => e.classId === cls.id && e.status === 'ATIVA'
              );
              const course = state.courses.find((c) => c.id === cls.courseId);
              const occupancyRate = Math.round((enrolledStudents.length / cls.maxCapacity) * 100);
              const hasTeacher = cls.teacherId && !cls.teacherName.toLowerCase().includes('sem professor');

              return (
                <div
                  key={cls.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Code, Status & Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {cls.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            cls.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : cls.status === 'UPCOMING'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {cls.status === 'ACTIVE' ? 'Ativa' : cls.status === 'UPCOMING' ? 'Planejada' : 'Encerrada'}
                        </span>
                      </div>
                    </div>

                    {/* Class Name & Course */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{course?.name}</p>
                    </div>

                    {/* Meta details */}
                    <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-[11px]">{cls.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-[11px]">{cls.room}</span>
                      </div>

                      {/* Teacher Row with Quick Vinculate/Desvincular */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <GraduationCap className={`w-3.5 h-3.5 flex-shrink-0 ${hasTeacher ? 'text-slate-700' : 'text-amber-500'}`} />
                          <span className={`text-[11px] truncate font-semibold ${hasTeacher ? 'text-slate-800' : 'text-amber-700'}`}>
                            {cls.teacherName || 'Sem professor'}
                          </span>
                        </div>

                        {hasTeacher ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setAssigningTeacherClass(cls)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
                              title="Trocar professor vinculado"
                            >
                              Trocar
                            </button>
                            <button
                              onClick={() => handleQuickUnassign(cls)}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold rounded border border-rose-200 transition-colors cursor-pointer"
                              title="Desvincular professor desta turma"
                            >
                              Desvincular
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningTeacherClass(cls)}
                            className="px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Link className="w-2.5 h-2.5" /> Vincular
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Capacity progress bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                        <span>Ocupação</span>
                        <span className="font-mono font-bold">
                          {enrolledStudents.length} / {cls.maxCapacity} alunos ({occupancyRate}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyRate >= 90
                              ? 'bg-rose-500'
                              : occupancyRate >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedClassForRoster(cls)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Alunos ({enrolledStudents.length})
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                        title="Editar Turma"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingClass(cls)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                        title="Excluir Turma"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Código & Turma</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Professor Responsável</th>
                  <th className="px-4 py-3">Horário & Sala</th>
                  <th className="px-4 py-3">Ocupação</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações da Secretaria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Nenhuma turma encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const enrolledStudents = state.enrollments.filter(
                      (e) => e.classId === cls.id && e.status === 'ATIVA'
                    );
                    const course = state.courses.find((c) => c.id === cls.courseId);
                    const hasTeacher = cls.teacherId && !cls.teacherName.toLowerCase().includes('sem professor');

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {cls.code}
                          </span>
                          <p className="font-bold text-slate-900 mt-1">{cls.name}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{course?.name}</td>
                        <td className="px-4 py-3">
                          {hasTeacher ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{cls.teacherName}</span>
                              <button
                                onClick={() => handleQuickUnassign(cls)}
                                className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                title="Desvincular docente"
                              >
                                Desvincular
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningTeacherClass(cls)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" /> Vincular Docente
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p className="font-medium">{cls.schedule}</p>
                          <p className="text-[11px] text-slate-400">{cls.room}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-slate-800">
                            {enrolledStudents.length} / {cls.maxCapacity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              cls.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : cls.status === 'UPCOMING'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cls.status === 'ACTIVE' ? 'Ativa' : cls.status === 'UPCOMING' ? 'Planejada' : 'Encerrada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedClassForRoster(cls)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                              title="Ver Alunos Matriculados"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAssigningTeacherClass(cls)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                              title="Vincular / Alterar Docente"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(cls)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                              title="Editar Turma"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingClass(cls)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                              title="Excluir Turma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Lista de Alunos da Turma */}
      {selectedClassForRoster && (
        <Modal
          isOpen={!!selectedClassForRoster}
          onClose={() => setSelectedClassForRoster(null)}
          size="lg"
          title={`Lista de Alunos • ${selectedClassForRoster.name}`}
          subtitle={`Horário: ${selectedClassForRoster.schedule} • Sala: ${selectedClassForRoster.room} • Docente: ${selectedClassForRoster.teacherName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome do Aluno</th>
                    <th className="px-3 py-2">Contato</th>
                    <th className="px-3 py-2">Status Matrícula</th>
                    <th className="px-3 py-2">Financeiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.enrollments
                    .filter((e) => e.classId === selectedClassForRoster.id)
                    .map((enr) => {
                      const student = state.students.find((s) => s.studentId === enr.studentId);
                      const charges = state.charges.filter((c) => c.studentId === enr.studentId);
                      const hasOverdue = charges.some((c) => c.status === 'EM ATRASO');

                      return (
                        <tr key={enr.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                            {enr.studentId}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {enr.studentName}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {student?.phone || student?.email || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge status={enr.status} />
                          </td>
                          <td className="px-3 py-2.5">
                            {hasOverdue ? (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Em Atraso
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Regular
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cadastrar Nova Turma */}
      {isNewClassModalOpen && (
        <Modal
          isOpen={isNewClassModalOpen}
          onClose={() => setIsNewClassModalOpen(false)}
          title="Cadastrar Nova Turma"
          subtitle="Crie uma nova turma, defina o curso vinculado, horários e professor responsável"
        >
          <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inglês Intermediário - Noite"
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ENG-202-B"
                  value={newClassForm.code}
                  onChange={(e) => setNewClassForm({ ...newClassForm, code: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Vinculado *</label>
                <select
                  value={newClassForm.courseId}
                  onChange={(e) => setNewClassForm({ ...newClassForm, courseId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                  required
                >
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professor Responsável</label>
                <select
                  value={newClassForm.teacherId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selectedTeacher = availableTeachers.find((t) => t.id === selId);
                    setNewClassForm({
                      ...newClassForm,
                      teacherId: selId,
                      teacherName: selectedTeacher ? selectedTeacher.name : 'Sem professor vinculado',
                    });
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                >
                  <option value="">Sem professor vinculado</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department || 'Docente'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Horário & Dias de Aula *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Terça e Quinta, 19:00 - 20:30"
                  value={newClassForm.schedule}
                  onChange={(e) => setNewClassForm({ ...newClassForm, schedule: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sala / Local *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala 03 - Bloco B"
                  value={newClassForm.room}
                  onChange={(e) => setNewClassForm({ ...newClassForm, room: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capacidade Máxima</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={newClassForm.maxCapacity}
                  onChange={(e) => setNewClassForm({ ...newClassForm, maxCapacity: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data de Início</label>
                <input
                  type="date"
                  value={newClassForm.startDate}
                  onChange={(e) => setNewClassForm({ ...newClassForm, startDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data de Término</label>
                <input
                  type="date"
                  value={newClassForm.endDate}
                  onChange={(e) => setNewClassForm({ ...newClassForm, endDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewClassModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer shadow-2xs"
              >
                Criar Turma
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar Turma */}
      {editingClass && (
        <Modal
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          title={`Editar Turma • ${editingClass.code}`}
          subtitle="Atualize dados pedagógicos, horários, capacidade e professor responsável da turma"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código da Turma *</label>
                <input
                  type="text"
                  required
                  value={editClassForm.code}
                  onChange={(e) => setEditClassForm({ ...editClassForm, code: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Vinculado *</label>
                <select
                  value={editClassForm.courseId}
                  onChange={(e) => setEditClassForm({ ...editClassForm, courseId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                  required
                >
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professor Responsável</label>
                <select
                  value={editClassForm.teacherId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selectedTeacher = availableTeachers.find((t) => t.id === selId);
                    setEditClassForm({
                      ...editClassForm,
                      teacherId: selId,
                      teacherName: selectedTeacher ? selectedTeacher.name : 'Sem professor vinculado',
                    });
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                >
                  <option value="">Sem professor vinculado</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department || 'Docente'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Horário & Dias de Aula *</label>
                <input
                  type="text"
                  required
                  value={editClassForm.schedule}
                  onChange={(e) => setEditClassForm({ ...editClassForm, schedule: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sala / Local *</label>
                <input
                  type="text"
                  required
                  value={editClassForm.room}
                  onChange={(e) => setEditClassForm({ ...editClassForm, room: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capacidade Máx.</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={editClassForm.maxCapacity}
                  onChange={(e) => setEditClassForm({ ...editClassForm, maxCapacity: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status da Turma</label>
                <select
                  value={editClassForm.status}
                  onChange={(e) => setEditClassForm({ ...editClassForm, status: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="UPCOMING">Planejada</option>
                  <option value="COMPLETED">Encerrada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Início</label>
                <input
                  type="date"
                  value={editClassForm.startDate}
                  onChange={(e) => setEditClassForm({ ...editClassForm, startDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Término</label>
                <input
                  type="date"
                  value={editClassForm.endDate}
                  onChange={(e) => setEditClassForm({ ...editClassForm, endDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditingClass(null);
                  setDeletingClass(editingClass);
                }}
                className="text-rose-600 hover:text-rose-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir esta turma
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer shadow-2xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Vincular / Alterar Professor */}
      {assigningTeacherClass && (
        <Modal
          isOpen={!!assigningTeacherClass}
          onClose={() => {
            setAssigningTeacherClass(null);
            setTeacherSearchQuery('');
          }}
          title={`Vincular Professor • ${assigningTeacherClass.name}`}
          subtitle={`Código: ${assigningTeacherClass.code} • Horário: ${assigningTeacherClass.schedule}`}
        >
          <div className="space-y-4 text-xs">
            {/* Current Status Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Professor Atual</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {assigningTeacherClass.teacherName || 'Nenhum professor vinculado'}
                </p>
              </div>

              {assigningTeacherClass.teacherId && (
                <button
                  onClick={() => {
                    handleQuickUnassign(assigningTeacherClass);
                    setAssigningTeacherClass(null);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Unlink className="w-3 h-3" /> Desvincular Professor
                </button>
              )}
            </div>

            {/* Teacher Search */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selecione o Novo Professor da Turma
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar docente por nome, e-mail ou departamento..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Teachers List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableTeachers
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                    t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                    t.department?.toLowerCase().includes(teacherSearchQuery.toLowerCase())
                )
                .map((teacher) => {
                  const assignedCount = state.classes.filter((c) => c.teacherId === teacher.id).length;
                  const isCurrent = assigningTeacherClass.teacherId === teacher.id;

                  return (
                    <div
                      key={teacher.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{teacher.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {teacher.department || 'Corpo Docente'} • {assignedCount} turma(s) vinculada(s)
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-lg border border-slate-300">
                          Vinculado Atualmente
                        </span>
                      ) : (
                        <button
                          onClick={() => handleQuickAssign(teacher)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Vincular a esta Turma
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setAssigningTeacherClass(null);
                  setTeacherSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmação de Exclusão de Turma */}
      {deletingClass && (
        <Modal
          isOpen={!!deletingClass}
          onClose={() => setDeletingClass(null)}
          title="Excluir Turma"
          subtitle="Atenção: verifique o impacto da remoção desta turma do sistema acadêmico"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3 text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">Tem certeza que deseja excluir esta turma?</p>
                <p className="mt-1 text-rose-800 leading-relaxed">
                  Você está prestes a excluir a turma <strong className="font-bold">{deletingClass.name} ({deletingClass.code})</strong>.
                </p>
                {state.enrollments.filter((e) => e.classId === deletingClass.id).length > 0 && (
                  <p className="mt-2 text-rose-900 font-semibold bg-rose-100/80 p-2.5 rounded-xl border border-rose-300">
                    Aviso importante: Existem {state.enrollments.filter((e) => e.classId === deletingClass.id).length} matrícula(s) vinculada(s) a esta turma. A exclusão desvinculará automaticamente esses alunos desta turma.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Turma:</span>
                <span className="font-bold text-slate-900">{deletingClass.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Código:</span>
                <span className="font-mono font-bold text-slate-900">{deletingClass.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Docente Responsável:</span>
                <span className="font-semibold text-slate-800">{deletingClass.teacherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Horário & Sala:</span>
                <span>{deletingClass.schedule} • {deletingClass.room}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
