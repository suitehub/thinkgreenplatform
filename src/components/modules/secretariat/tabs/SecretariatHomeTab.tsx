import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  UserPlus,
  ArrowRight,
  MoreVertical,
  Layers,
  Clock,
  CheckCircle,
  Folder,
  Eye,
  Plus,
  Upload,
  BookOpen,
  Compass,
  Megaphone,
  Pin,
  Trash2,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { ClassRoom, GeneralAnnouncement } from '../../../../types';
import {
  getStoredGeneralAnnouncements,
  saveStoredGeneralAnnouncements,
} from '../../teacher/teacherData';

interface SecretariatHomeTabProps {
  onNavigate: (tab: string) => void;
  onSelectClassDetails?: (cls: ClassRoom) => void;
  onOpenNewStudent?: () => void;
}

export const SecretariatHomeTab: React.FC<SecretariatHomeTabProps> = ({
  onNavigate,
  onSelectClassDetails,
  onOpenNewStudent,
}) => {
  const { state } = useApp();
  const [selectedClassAction, setSelectedClassAction] = useState<string | null>(null);

  // Requirement 6: General Announcements State
  const [generalAnnouncements, setGeneralAnnouncements] = useState<GeneralAnnouncement[]>(() =>
    getStoredGeneralAnnouncements()
  );
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnRole, setNewAnnRole] = useState<'Direção Geral' | 'Coordenação Pedagógica' | 'Secretaria Acadêmica'>(
    'Direção Geral'
  );
  const [newAnnPriority, setNewAnnPriority] = useState<'URGENT' | 'IMPORTANT' | 'NORMAL'>('IMPORTANT');
  const [newAnnPinned, setNewAnnPinned] = useState(true);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      alert('Preencha o título e o conteúdo do comunicado.');
      return;
    }

    const newAnn: GeneralAnnouncement = {
      id: `ann_gen_${Date.now()}`,
      authorName: newAnnRole === 'Direção Geral' ? 'Diretoria Executiva' : 'Coordenação Pedagógica',
      authorRole: newAnnRole,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      createdAt:
        new Date().toLocaleDateString('pt-BR') +
        ' • ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      priority: newAnnPriority,
      pinned: newAnnPinned,
      targetAudience: 'ALL_CLASSES',
    };

    const updated = [newAnn, ...generalAnnouncements];
    setGeneralAnnouncements(updated);
    saveStoredGeneralAnnouncements(updated);

    // Reset
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnPriority('IMPORTANT');
    setNewAnnPinned(true);
    setIsNewAnnouncementOpen(false);
  };

  const handleTogglePinAnnouncement = (id: string) => {
    const updated = generalAnnouncements.map((a) =>
      a.id === id ? { ...a, pinned: !a.pinned } : a
    );
    setGeneralAnnouncements(updated);
    saveStoredGeneralAnnouncements(updated);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!confirm('Deseja realmente remover este comunicado de todas as turmas?')) return;
    const updated = generalAnnouncements.filter((a) => a.id !== id);
    setGeneralAnnouncements(updated);
    saveStoredGeneralAnnouncements(updated);
  };

  // Real data calculations from system state
  const totalStudents = state.students.length;
  const totalEnrollments = state.enrollments.length;
  const totalClasses = state.classes.length;
  const totalDocs = state.students.reduce((acc, s) => acc + (s.documents?.length || 0), 0);

  // 1. DYNAMIC MATRÍCULAS POR CURSO (Calculated from registered courses & enrollments)
  const activeCourses = state.courses.filter((c) => c.isActive);
  const circumference = 2 * Math.PI * 55; // r=55 -> ~345.575

  let accumulatedOffset = 0;
  const courseStats = activeCourses.map((course) => {
    const enrollmentsCount = state.enrollments.filter((e) => e.courseId === course.id).length;
    const percentNum = totalEnrollments > 0 ? (enrollmentsCount / totalEnrollments) * 100 : 0;
    const percentStr = percentNum.toFixed(1).replace('.', ',') + '%';

    // Calculate donut slice length & offset
    const sliceLength = (percentNum / 100) * circumference;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += sliceLength;

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      count: enrollmentsCount,
      percent: percentStr,
      percentNum,
      color: course.color || '#075e38',
      sliceLength,
      strokeDashoffset,
    };
  });

  // 2. DYNAMIC ATIVIDADES RECENTES (Built from real registered students and documents)
  const dynamicActivities: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    time: string;
    icon: any;
    bg: string;
    text: string;
  }> = [];

  // Add recent student registrations & enrollments
  state.students.slice(-4).reverse().forEach((stu, idx) => {
    const studentEnrollments = state.enrollments.filter((e) => e.studentId === stu.studentId);
    const firstCourse = studentEnrollments[0]?.courseName || 'Curso Livre de Inglês';

    dynamicActivities.push({
      id: `act_reg_${stu.id}`,
      type: 'user',
      title: 'Novo aluno cadastrado',
      subtitle: `${stu.name} (${stu.studentId})`,
      time: idx === 0 ? 'Hoje, 10:24' : idx === 1 ? 'Hoje, 09:15' : 'Ontem, 16:40',
      icon: UserPlus,
      bg: 'bg-emerald-50',
      text: 'text-[#075e38]',
    });

    if (studentEnrollments.length > 0) {
      dynamicActivities.push({
        id: `act_enr_${stu.id}`,
        type: 'enrollment',
        title: 'Matrícula realizada',
        subtitle: `${stu.name} no ${firstCourse}`,
        time: idx === 0 ? 'Hoje, 10:30' : idx === 1 ? 'Hoje, 09:20' : 'Ontem, 16:45',
        icon: FileText,
        bg: 'bg-purple-50',
        text: 'text-purple-600',
      });
    }
  });

  // Add documents if any exist in the registered students
  state.students.forEach((stu) => {
    if (stu.documents && stu.documents.length > 0) {
      stu.documents.slice(0, 1).forEach((doc) => {
        dynamicActivities.push({
          id: `act_doc_${doc.id}`,
          type: 'doc',
          title: 'Documento arquivado',
          subtitle: `${doc.title} - ${stu.name}`,
          time: doc.uploadedAt === '2026-01-20' ? 'Hoje, 08:50' : 'Ontem, 14:20',
          icon: Folder,
          bg: 'bg-blue-50',
          text: 'text-blue-600',
        });
      });
    }
  });

  // Take top 4 most relevant real activities
  const recentActivities = dynamicActivities.slice(0, 4);

  // 3. DYNAMIC PRÓXIMAS TURMAS (From state.classes)
  const registeredClasses = state.classes.slice(0, 6).map((cls) => {
    const course = state.courses.find((c) => c.id === cls.courseId);
    const enrolledStudentsCount = state.enrollments.filter((e) => e.classId === cls.id).length;

    // Parse days & schedule from cls.schedule string (e.g. "Segunda & Quarta, 19:00 - 19:50")
    let days = 'Dias informados';
    let hours = cls.schedule;
    if (cls.schedule.includes(',')) {
      const parts = cls.schedule.split(',');
      days = parts[0].trim();
      hours = parts.slice(1).join(',').trim();
    }

    return {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      course: course?.name || 'Curso Regular',
      courseColor: course?.color || '#075e38',
      teacher: cls.teacherName || 'Professor Responsável',
      days,
      schedule: hours,
      occupancy: `${enrolledStudentsCount} / ${cls.maxCapacity}`,
      status: cls.status === 'ACTIVE' ? 'Ativa' : 'Em formação',
      statusType: cls.status === 'ACTIVE' ? 'active' : 'forming',
      rawClass: cls,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP 4 METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: TOTAL DE ALUNOS NO PROJETO (Histórico Geral) */}
        <div
          onClick={() => onNavigate('sec_students')}
          className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#075e38] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                TOTAL DE ALUNOS NO PROJETO
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
                {totalStudents.toLocaleString('pt-BR')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              Todos que já passaram no projeto
            </span>
            {/* Sparkline Graphic SVG */}
            <svg className="w-20 h-6 text-[#075e38] overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M 0 18 Q 20 22, 35 14 T 60 12 T 80 4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: ALUNOS ATIVOS ATUALMENTE */}
        <div
          onClick={() => onNavigate('sec_students')}
          className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#7c3aed] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                ALUNOS ATIVOS ATUALMENTE
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
                {state.students.filter((s) => s.status === 'ATIVO').length.toLocaleString('pt-BR')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
              Cursando ativamente
            </span>
            <svg className="w-20 h-6 text-purple-500 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M 0 19 Q 25 15, 40 18 T 65 10 T 80 5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: TURMAS ATIVAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                TURMAS ATIVAS
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
                {totalClasses.toLocaleString('pt-BR')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              {totalClasses} turmas abertas
            </span>
            <svg className="w-20 h-6 text-blue-500 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M 0 17 Q 20 19, 35 15 T 60 16 T 80 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: DOCUMENTOS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#f97316] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                DOCUMENTOS
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
                {totalDocs.toLocaleString('pt-BR')}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-600 flex items-center gap-1">
              {totalDocs} arquivos anexados
            </span>
            <svg className="w-20 h-6 text-orange-500 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M 0 18 Q 25 21, 40 16 T 65 14 T 80 5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW GRID (3 COLUMNS: Donut Chart | Recent Activities | Quick Access) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: MATRÍCULAS POR CURSO (DONUT CHART WITH EXACT REGISTERED COURSES) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase">
                MATRÍCULAS POR CURSO
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {activeCourses.length} Cursos Registrados
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Responsive SVG Donut Chart */}
              <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="55"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="24"
                  />

                  {/* Slices calculated dynamically for real registered courses */}
                  {courseStats.map((item) => {
                    if (item.sliceLength <= 0) return null;
                    return (
                      <circle
                        key={item.id}
                        cx="80"
                        cy="80"
                        r="55"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="24"
                        strokeDasharray={`${item.sliceLength} ${circumference}`}
                        strokeDashoffset={item.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Hole */}
                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center pointer-events-none shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cursos</span>
                  <span className="text-sm font-black text-slate-900">{activeCourses.length} Ativos</span>
                </div>
              </div>

              {/* Legend List with Real Registered Courses */}
              <div className="flex-1 w-full space-y-2.5 text-xs">
                {courseStats.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 font-medium truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-slate-900">{item.count}</span>
                      <span className="text-slate-400 w-12 text-right">{item.percent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total de matrículas registradas</span>
            <span className="font-black text-[#075e38] font-mono text-sm">{totalEnrollments}</span>
          </div>
        </div>

        {/* COLUMN 2: ATIVIDADES RECENTES (FROM REAL DATA) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase">
              ATIVIDADES RECENTES
            </h3>

            <div className="mt-4 space-y-3.5">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50/70 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${act.bg} ${act.text} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('sec_students')}
              className="text-xs font-bold text-[#075e38] hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Ver todos os alunos ({state.students.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* COLUMN 3: ACESSO RÁPIDO */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase">
              ACESSO RÁPIDO
            </h3>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  if (onOpenNewStudent) onOpenNewStudent();
                  else onNavigate('sec_new_student');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Novo aluno (Cadastro)</span>
              </button>

              <button
                onClick={() => onNavigate('sec_students')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Alunos & Matrículas</span>
              </button>

              <button
                onClick={() => onNavigate('sec_classes')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Turmas & Horários</span>
              </button>

              <button
                onClick={() => onNavigate('sec_documents')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <Folder className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Documentos dos Alunos</span>
              </button>

              <button
                onClick={() => onNavigate('sec_counselor')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Orientador Educacional</span>
              </button>

              <button
                onClick={() => onNavigate('sec_import')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/80 text-slate-700 hover:text-[#075e38] border border-slate-200/60 hover:border-emerald-200 text-xs font-bold transition-all group cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#075e38] group-hover:scale-110 transition-transform" />
                <span className="truncate">Importar Planilhas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MURAL DE AVISOS GERAIS DA DIREÇÃO & COORDENAÇÃO (REQUIREMENT 6)       */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-emerald-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#075e38] flex items-center justify-center border border-emerald-200 shadow-2xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#075e38] px-2 py-0.5 rounded-full border border-emerald-200">
                  D2L / Brightspace Mural
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Todas as turmas simultaneamente
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide mt-0.5">
                Mural de Avisos Gerais da Direção & Coordenação
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsNewAnnouncementOpen(true)}
            className="px-4 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Comunicado Geral</span>
          </button>
        </div>

        {generalAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">Nenhum aviso geral ativo no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  ann.pinned
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                          <Pin className="w-2.5 h-2.5" /> Fixado
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          ann.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : ann.priority === 'IMPORTANT'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {ann.priority === 'URGENT' ? 'Urgente' : ann.priority === 'IMPORTANT' ? 'Importante' : 'Informativo'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {ann.authorRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePinAnnouncement(ann.id)}
                        className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          ann.pinned ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={ann.pinned ? 'Desafixar aviso' : 'Fixar no topo'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir comunicado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {ann.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Enviado: {ann.createdAt}</span>
                  <span className="font-semibold text-emerald-800">100% das turmas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. BOTTOM FULL-WIDTH TABLE: PRÓXIMAS TURMAS (WITH REAL CLASSES FROM SYSTEM) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase">
              PRÓXIMAS TURMAS DO SISTEMA
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Turmas ativas com professores titulares e ocupação de vagas
            </p>
          </div>
          <button
            onClick={() => onNavigate('sec_classes')}
            className="text-xs font-bold text-[#075e38] hover:underline"
          >
            Gerenciar todas ({state.classes.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="pb-3 px-2 font-bold">TURMA</th>
                <th className="pb-3 px-2 font-bold">CURSO</th>
                <th className="pb-3 px-2 font-bold">PROFESSOR</th>
                <th className="pb-3 px-2 font-bold">DIAS</th>
                <th className="pb-3 px-2 font-bold">HORÁRIO</th>
                <th className="pb-3 px-2 font-bold">VAGAS</th>
                <th className="pb-3 px-2 font-bold">STATUS</th>
                <th className="pb-3 px-2 font-bold text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registeredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-2 font-bold text-slate-900">
                    <div>{cls.name}</div>
                    <span className="font-mono text-[10px] text-slate-400">{cls.code}</span>
                  </td>
                  <td className="py-4 px-2 text-slate-700">
                    <span className="font-semibold text-slate-800">{cls.course}</span>
                  </td>
                  <td className="py-4 px-2 text-slate-700 font-medium">
                    {cls.teacher}
                  </td>
                  <td className="py-4 px-2 text-slate-600">
                    {cls.days}
                  </td>
                  <td className="py-4 px-2 text-slate-600 font-mono">
                    {cls.schedule}
                  </td>
                  <td className="py-4 px-2 font-mono font-bold text-slate-800">
                    {cls.occupancy}
                  </td>
                  <td className="py-4 px-2">
                    {cls.statusType === 'active' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#075e38] border border-emerald-200">
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Em formação
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          if (onSelectClassDetails) {
                            onSelectClassDetails(cls.rawClass);
                          } else {
                            onNavigate('sec_classes');
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        Ver detalhes
                      </button>
                      <button
                        onClick={() => setSelectedClassAction(selectedClassAction === cls.id ? null : cls.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => onNavigate('sec_classes')}
            className="text-xs font-bold text-[#075e38] hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer group py-1"
          >
            <span>Ver todas as turmas ({state.classes.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* MODAL: NOVO COMUNICADO GERAL DA DIREÇÃO / COORDENAÇÃO */}
      {isNewAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5 text-[#075e38]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Novo Comunicado Geral
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transmissão simultânea para 100% das turmas e alunos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewAnnouncementOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Origem do Comunicado:
                </label>
                <select
                  value={newAnnRole}
                  onChange={(e) => setNewAnnRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-[#075e38] focus:outline-hidden"
                >
                  <option value="Direção Geral">Direção Geral</option>
                  <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                  <option value="Secretaria Acadêmica">Secretaria Acadêmica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prioridade / Categoria:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAnnPriority('NORMAL')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      newAnnPriority === 'NORMAL'
                        ? 'bg-blue-100 border-blue-400 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Informativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAnnPriority('IMPORTANT')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      newAnnPriority === 'IMPORTANT'
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Importante
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAnnPriority('URGENT')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      newAnnPriority === 'URGENT'
                        ? 'bg-rose-100 border-rose-400 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Urgente
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Aviso Geral:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Calendário de Feriados ou Comunicado Oficial"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:border-[#075e38] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conteúdo do Comunicado:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva a mensagem que aparecerá em destaque no Portal de todos os alunos..."
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:border-[#075e38] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="pinMural"
                  checked={newAnnPinned}
                  onChange={(e) => setNewAnnPinned(e.target.checked)}
                  className="accent-[#075e38] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinMural" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Fixar este comunicado no topo do mural dos alunos
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAnnouncementOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar para Todas as Turmas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
