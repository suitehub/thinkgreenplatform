import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  BookOpen,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Printer,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Volume2,
  Smile,
  AlertCircle,
  X,
  Save,
  Check,
  LayoutList,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ClassRoom, ClassLessonPlan } from '../../../types';

interface ClassLessonPlanTabProps {
  selectedClass: ClassRoom;
  lessonPlans: ClassLessonPlan[];
  onSaveLessonPlan: (plan: ClassLessonPlan) => void;
  onDeleteLessonPlan: (planId: string) => void;
}

export const ClassLessonPlanTab: React.FC<ClassLessonPlanTabProps> = ({
  selectedClass,
  lessonPlans,
  onSaveLessonPlan,
  onDeleteLessonPlan,
}) => {
  // View mode: 'cards' (prático e descritivo) or 'table' (planilha estilo Excel modernizado)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLANEJADA' | 'MINISTRADA'>('ALL');

  // Expanded cards state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Modal State for New / Edit Lesson Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form Fields
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDateDisplay, setFormDateDisplay] = useState('');
  const [formStatus, setFormStatus] = useState<'PLANEJADA' | 'MINISTRADA' | 'EM_ANDAMENTO'>('PLANEJADA');
  const [formUnitContent, setFormUnitContent] = useState('');
  const [formHandwriting, setFormHandwriting] = useState('');
  const [formReading, setFormReading] = useState('');
  const [formWriting, setFormWriting] = useState('');
  const [formSpeakingTime, setFormSpeakingTime] = useState('');
  const [formHomework, setFormHomework] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formObservations, setFormObservations] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter plans for this class
  const classPlans = lessonPlans.filter((p) => {
    // Match current class or fall back to all if general
    const matchClass = p.classId === selectedClass.id || (!p.classId && selectedClass.id === 'class_eng_a');
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchSearch =
      searchQuery === '' ||
      p.unitContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dateDisplay?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handwriting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.speakingTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.homework.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.observations.toLowerCase().includes(searchQuery.toLowerCase());

    return matchClass && matchStatus && matchSearch;
  });

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handleOpenNewModal = () => {
    setEditingPlanId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormDateDisplay(formatDateDisplay(today));
    setFormStatus('PLANEJADA');
    setFormUnitContent('');
    setFormHandwriting('');
    setFormReading('');
    setFormWriting('');
    setFormSpeakingTime('');
    setFormHomework('');
    setFormMaterials('');
    setFormObservations('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: ClassLessonPlan) => {
    setEditingPlanId(plan.id);
    setFormDate(plan.date || new Date().toISOString().split('T')[0]);
    setFormDateDisplay(plan.dateDisplay || formatDateDisplay(plan.date));
    setFormStatus(plan.status || 'PLANEJADA');
    setFormUnitContent(plan.unitContent || '');
    setFormHandwriting(plan.handwriting || '');
    setFormReading(plan.reading || '');
    setFormWriting(plan.writing || '');
    setFormSpeakingTime(plan.speakingTime || '');
    setFormHomework(plan.homework || '');
    setFormMaterials(plan.materials || '');
    setFormObservations(plan.observations || '');
    setIsModalOpen(true);
  };

  const handleDuplicatePlan = (plan: ClassLessonPlan) => {
    // Add 7 days to date
    let newDateStr = plan.date;
    try {
      const d = new Date(plan.date);
      d.setDate(d.getDate() + 7);
      newDateStr = d.toISOString().split('T')[0];
    } catch {
      newDateStr = new Date().toISOString().split('T')[0];
    }

    const duplicated: ClassLessonPlan = {
      ...plan,
      id: `lp_${Date.now()}`,
      date: newDateStr,
      dateDisplay: formatDateDisplay(newDateStr),
      dateFormatted: formatDateFormatted(newDateStr),
      status: 'PLANEJADA',
      observations: `Duplicado a partir do plano de ${plan.dateDisplay || plan.date}.`,
      createdAt: new Date().toISOString(),
    };

    onSaveLessonPlan(duplicated);
    showToast(`Plano de aula duplicado para ${duplicated.dateDisplay}!`);
  };

  const handleToggleStatus = (plan: ClassLessonPlan) => {
    const nextStatus = plan.status === 'MINISTRADA' ? 'PLANEJADA' : 'MINISTRADA';
    onSaveLessonPlan({
      ...plan,
      status: nextStatus,
    });
    showToast(`Status atualizado para: ${nextStatus === 'MINISTRADA' ? 'Ministrada' : 'Planejada'}`);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const monthsShort = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const daysShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
        const m = monthsShort[d.getMonth()] || '';
        const day = String(d.getDate()).padStart(2, '0');
        const wd = daysShort[d.getDay()] || '';
        return `${m} ${day} (${wd})`;
      }
    } catch {
      // ignore
    }
    return dateStr;
  };

  const formatDateFormatted = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const monthsFull = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const daysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return `${d.getDate()} de ${monthsFull[d.getMonth()]} de ${d.getFullYear()} (${daysFull[d.getDay()]})`;
      }
    } catch {
      // ignore
    }
    return dateStr;
  };

  const handlePreFillSampleLG1 = () => {
    setFormUnitContent(
      `- LG1 book - U2 - Colors and shapes - p. 12-13;\nGreetings and social communication (Exercises And B p.12, C and D p.13):\n- Greeting with "Hi" and asking "How are you?";\n- Answering with "I'm fine".`
    );
    setFormHandwriting(
      `- Handwritting worksheet about vocabulary - p.12 (spelling about greetings and answers).`
    );
    setFormReading(
      `- Reading Text:\nMohamed: Hi!\nFarida: Hi!\nMohamed: How are you?\nFarida: I'm fine, thank you!\nMohamed: How are you?\nFarida: I'm fine!`
    );
    setFormWriting(`- LG1 - U2 grammar worksheet p.1.`);
    setFormSpeakingTime(`- Greeting friends in class using the grammar - p.12-13.`);
    setFormHomework(`- Workbook - p.11.`);
    setFormMaterials(
      `- Slides, handwritting worksheet, grammar worksheet, unit tests printed, colored pencils and LG1 books.`
    );
    setFormObservations(`- Unit 1 teste today.`);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUnitContent.trim()) {
      alert('Por favor, informe ao menos o Conteúdo da Unidade (Unit Content).');
      return;
    }

    const display = formDateDisplay || formatDateDisplay(formDate);
    const formatted = formatDateFormatted(formDate);

    const planToSave: ClassLessonPlan = {
      id: editingPlanId || `lp_${Date.now()}`,
      classId: selectedClass.id,
      className: selectedClass.name,
      teacherId: selectedClass.teacherId || 'user_teacher_1',
      teacherName: selectedClass.teacherName || 'Professor Lucas',
      date: formDate,
      dateDisplay: display,
      dateFormatted: formatted,
      unitContent: formUnitContent,
      handwriting: formHandwriting,
      reading: formReading,
      writing: formWriting,
      speakingTime: formSpeakingTime,
      homework: formHomework,
      materials: formMaterials,
      observations: formObservations,
      status: formStatus,
      createdAt: editingPlanId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLessonPlan(planToSave);
    setIsModalOpen(false);
    showToast(editingPlanId ? 'Plano de aula atualizado com sucesso!' : 'Novo plano de aula cadastrado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#075e38] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. INSTITUTIONAL HEADER REFERENCING EXCEL MODEL */}
      <div className="bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white p-6 sm:p-7 rounded-3xl border border-purple-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-10 flex items-center pr-6">
          <FileSpreadsheet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                Planejamento Pedagógico Oficial
              </span>
              <span className="text-xs text-purple-200 font-semibold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Estrutura de 8 Dimensões (Excel Referência)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Lesson Plan — {selectedClass.name}
            </h2>

            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Plano de aula estruturado por data: <strong>Unit Content</strong>, <strong>Handwriting</strong>,{' '}
              <strong>Reading</strong>, <strong>Writing</strong>, <strong>Speaking Time</strong>,{' '}
              <strong>Homework</strong>, <strong>Materials</strong> e <strong>Observations</strong>.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <span className="block text-lg font-black text-white">{classPlans.length}</span>
              <span className="text-[10px] font-bold text-purple-200 uppercase">Aulas no Plano</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-emerald-400/30 text-center min-w-[90px]">
              <span className="block text-lg font-black text-emerald-300">
                {classPlans.filter((p) => p.status === 'MINISTRADA').length}
              </span>
              <span className="text-[10px] font-bold text-emerald-200 uppercase">Ministradas</span>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-blue-400/30 text-center min-w-[90px]">
              <span className="block text-lg font-black text-blue-300">
                {classPlans.filter((p) => p.status === 'PLANEJADA').length}
              </span>
              <span className="text-[10px] font-bold text-blue-200 uppercase">Planejadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACTION & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por unidade, livro, gramática, material ou data..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 focus:border-[#075e38]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Todas ({classPlans.length})
            </button>
            <button
              onClick={() => setStatusFilter('PLANEJADA')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PLANEJADA' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Planejadas
            </button>
            <button
              onClick={() => setStatusFilter('MINISTRADA')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'MINISTRADA' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Ministradas
            </button>
          </div>
        </div>

        {/* View Switcher + New Plan Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#075e38] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em cards descritivos e práticos"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Cards Descritivos</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#075e38] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em grade/planilha estilo Excel"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Planilha Excel</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-bold"
            title="Imprimir plano de aula"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plano de Aula</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENT AREA: CARDS VIEW OR SPREADSHEET TABLE VIEW */}
      {classPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto border border-purple-200">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Nenhum plano de aula encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Você ainda não registrou planos de aula para esta turma ou os filtros atuais não retornaram resultados.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleOpenNewModal}
              className="px-5 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro Plano de Aula</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ========================================================================= */
        /* MODE A: CARDS DESCRITIVOS E PRÁTICOS (LAYOUT MODERNO SOLICITADO)          */
        /* ========================================================================= */
        <div className="space-y-5">
          {classPlans.map((plan, idx) => {
            const isExpanded = expandedCards[plan.id] !== false; // expanded by default

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-purple-300 transition-all shadow-xs overflow-hidden"
              >
                {/* Card Header Bar */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Date Badge in Excel format */}
                    <div className="flex items-center gap-2 bg-[#dc2626] text-white px-3 py-1.5 rounded-xl font-black text-xs shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-white/90" />
                      <span className="uppercase tracking-wide">{plan.dateDisplay || plan.date}</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                        Aula {idx + 1} — {plan.dateFormatted || plan.date}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Docente: {plan.teacherName || selectedClass.teacherName || 'Professor Lucas'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status on Right */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Pill Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(plan)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        plan.status === 'MINISTRADA'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                      }`}
                      title="Clique para alternar entre Planejada e Ministrada"
                    >
                      {plan.status === 'MINISTRADA' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ministrada</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Planejada</span>
                        </>
                      )}
                    </button>

                    {/* Duplicate button */}
                    <button
                      onClick={() => handleDuplicatePlan(plan)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                      title="Duplicar para a próxima aula (+7 dias)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-[#075e38] transition-colors cursor-pointer"
                      title="Editar este plano de aula"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este plano de aula?')) {
                          onDeleteLessonPlan(plan.id);
                          showToast('Plano de aula removido.');
                        }
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir plano de aula"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                      onClick={() => toggleCard(plan.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Body with the 8 Excel Sections */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Top Row: Unit Content & Speaking Time (Core Communicative Elements) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* 1. UNIT CONTENT */}
                      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                            1. Unit Content (Conteúdo da Unidade & Livro)
                          </span>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                            Student Book
                          </span>
                        </div>
                        <p className="text-xs text-sky-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.unitContent || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>

                      {/* 2. SPEAKING TIME */}
                      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                            2. Speaking Time (Prática Oral & Dinâmicas)
                          </span>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            Interactive
                          </span>
                        </div>
                        <p className="text-xs text-purple-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.speakingTime || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Reading, Writing, Handwriting (Literacy Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 3. READING */}
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            3. Reading (Leitura)
                          </span>
                        </div>
                        <p className="text-xs text-amber-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.reading || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>

                      {/* 4. WRITING */}
                      <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-rose-700" />
                            4. Writing (Escrita & Ortografia)
                          </span>
                        </div>
                        <p className="text-xs text-rose-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.writing || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>

                      {/* 5. HANDWRITING */}
                      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                            5. Handwriting (Caligrafia)
                          </span>
                        </div>
                        <p className="text-xs text-teal-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.handwriting || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Homework, Materials, Observations */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {/* 6. HOMEWORK */}
                      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                            6. Homework (Lição de Casa)
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                            Workbook
                          </span>
                        </div>
                        <p className="text-xs text-indigo-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.homework || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>

                      {/* 7. MATERIALS */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            7. Materials (Materiais Necessários)
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                          {plan.materials || <span className="italic text-slate-400">Não informado</span>}
                        </p>
                      </div>

                      {/* 8. OBSERVATIONS */}
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-emerald-700" />
                            8. Observations (Observações & Testes)
                          </span>
                        </div>
                        <p className="text-xs text-emerald-950 font-medium whitespace-pre-line leading-relaxed">
                          {plan.observations || <span className="italic text-slate-400">Sem observações</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE B: PLANILHA / TABELA ESTILO EXCEL (REPLICA ESTRUTURAL MODERNIZADA)    */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Excel Table Title Bar */}
          <div className="bg-[#ede9fe] px-6 py-3 border-b border-purple-200 flex items-center justify-between text-purple-950">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#533499]" />
              <span className="text-xs sm:text-sm font-black">
                Lesson Plan {selectedClass.name} — {selectedClass.teacherName || 'Mr. João Ferelli'}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white/80 px-2.5 py-1 rounded-md text-purple-900 border border-purple-200">
              Formato Planilha D2L / Excel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Header Row: Matching the exact Excel image column colors & labels */}
                <tr className="border-b border-slate-300 font-extrabold text-[11px] uppercase tracking-wider text-slate-900">
                  <th className="py-3 px-3.5 bg-slate-100 border-r border-slate-200 w-28 text-center">
                    Date
                  </th>
                  <th className="py-3 px-3.5 bg-[#a5f3fc]/60 text-cyan-950 border-r border-slate-200 min-w-[220px]">
                    Unit Content
                  </th>
                  <th className="py-3 px-3.5 bg-[#bae6fd]/60 text-sky-950 border-r border-slate-200 min-w-[170px]">
                    Handwriting
                  </th>
                  <th className="py-3 px-3.5 bg-[#fef08a]/60 text-amber-950 border-r border-slate-200 min-w-[170px]">
                    Reading
                  </th>
                  <th className="py-3 px-3.5 bg-[#ffedd5]/60 text-orange-950 border-r border-slate-200 min-w-[160px]">
                    Writing
                  </th>
                  <th className="py-3 px-3.5 bg-[#e0e7ff]/60 text-indigo-950 border-r border-slate-200 min-w-[180px]">
                    Speaking Time
                  </th>
                  <th className="py-3 px-3.5 bg-[#f3e8ff]/60 text-purple-950 border-r border-slate-200 min-w-[140px]">
                    Homework
                  </th>
                  <th className="py-3 px-3.5 bg-[#bfdbfe]/60 text-blue-950 border-r border-slate-200 min-w-[170px]">
                    Materials
                  </th>
                  <th className="py-3 px-3.5 bg-[#bbf7d0]/60 text-emerald-950 border-r border-slate-200 min-w-[160px]">
                    Observations
                  </th>
                  <th className="py-3 px-3.5 bg-slate-100 text-center w-24">
                    Ações
                  </th>
                </tr>

                {/* Second Header Row: Guidelines from row 2 in Excel */}
                <tr className="border-b-2 border-slate-300 text-[10px] text-slate-600 bg-slate-50/80 font-normal leading-tight italic">
                  <td className="p-2 border-r border-slate-200 bg-red-100/70 font-black text-red-800 text-center not-italic">
                    INSTRUCTION
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Describe unit content from Let's Go Student Book (p. 4-6, etc.)
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Upload worksheet / Handwriting Book pages
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Reading Text / Dialogue used in class
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Spelling Exercise / grammar worksheet
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Describe interactive activities with details
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Workbook p.0-00
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Slides, worksheets, pencils, books
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    - Other activities, incidents, special needs
                  </td>
                  <td className="p-2 text-center not-italic font-bold text-slate-400">
                    Opções
                  </td>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800">
                {classPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-purple-50/30 transition-colors align-top text-[11px]">
                    {/* Date Column (Red highlight like the Excel) */}
                    <td className="p-3 border-r border-slate-200 bg-red-600 text-white font-black text-center whitespace-nowrap shadow-2xs">
                      {plan.dateDisplay || plan.date}
                      <span className="block text-[9px] font-bold text-red-200 mt-0.5">
                        {plan.status === 'MINISTRADA' ? '✓ Feita' : 'Planejada'}
                      </span>
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed font-medium">
                      {plan.unitContent}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                      {plan.handwriting || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed font-serif text-slate-900">
                      {plan.reading || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                      {plan.writing || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed font-medium text-purple-950">
                      {plan.speakingTime || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed font-bold text-indigo-900">
                      {plan.homework || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed text-slate-600">
                      {plan.materials || '-'}
                    </td>

                    <td className="p-3 border-r border-slate-200 whitespace-pre-line leading-relaxed font-medium text-emerald-950">
                      {plan.observations || '-'}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-[#075e38] transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          className="p-1 rounded-lg hover:bg-purple-50 text-slate-500 hover:text-purple-700 transition-colors cursor-pointer"
                          title="Duplicar para a próxima aula"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir plano?')) {
                              onDeleteLessonPlan(plan.id);
                              showToast('Plano excluído.');
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CRIAR OU EDITAR PLANO DE AULA COM INSTRUÇÕES DO EXCEL           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#533499] flex items-center justify-center shadow-2xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    {editingPlanId ? 'Editar Plano de Aula' : 'Novo Plano de Aula (Lesson Plan)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Turma: <strong>{selectedClass.name}</strong> • Modelo institucional Think Green
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreFillSampleLG1}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#533499] text-xs font-bold transition-all border border-purple-200 cursor-pointer flex items-center gap-1.5"
                  title="Preencher rapidamente com o modelo da imagem do Excel (Let's Go 1 - U2)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#533499]" />
                  <span>Exemplo Let's Go 1</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Row 1: Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Data da Aula *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setFormDateDisplay(formatDateDisplay(e.target.value));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Exibição Curta (ex: ago 25 (ter))
                  </label>
                  <input
                    type="text"
                    value={formDateDisplay}
                    onChange={(e) => setFormDateDisplay(e.target.value)}
                    placeholder="Ex: ago 25 (ter)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Status da Aula
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'PLANEJADA' | 'MINISTRADA' | 'EM_ANDAMENTO')
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                  >
                    <option value="PLANEJADA">📅 Planejada (Upcoming)</option>
                    <option value="MINISTRADA">✓ Ministrada (Completed)</option>
                    <option value="EM_ANDAMENTO">⏳ Em Andamento</option>
                  </select>
                </div>
              </div>

              {/* 1. Unit Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-sky-950 uppercase">
                    1. Unit Content *
                  </label>
                  <span className="text-[10px] text-slate-400 italic">
                    Instrução do Excel: Describe the unit content from the Student Book
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={formUnitContent}
                  onChange={(e) => setFormUnitContent(e.target.value)}
                  placeholder="- Describe the unit content from the Let's Go Student Book (LG1 book p. 4-6, asking 'What's your name?')..."
                  className="w-full p-3 bg-sky-50/30 border border-sky-200 rounded-xl text-xs text-slate-800 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Row 2: Handwriting & Writing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-teal-950 uppercase">
                      2. Handwriting
                    </label>
                    <span className="text-[10px] text-slate-400 italic">Worksheets / Handwriting Book</span>
                  </div>
                  <textarea
                    rows={2}
                    value={formHandwriting}
                    onChange={(e) => setFormHandwriting(e.target.value)}
                    placeholder="- Please, upload any worksheet used in class. Handwriting Book p.10-11.pdf..."
                    className="w-full p-3 bg-teal-50/30 border border-teal-200 rounded-xl text-xs text-slate-800 font-medium focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-rose-950 uppercase">
                      3. Writing & Grammar
                    </label>
                    <span className="text-[10px] text-slate-400 italic">Spelling / grammar sheet</span>
                  </div>
                  <textarea
                    rows={2}
                    value={formWriting}
                    onChange={(e) => setFormWriting(e.target.value)}
                    placeholder="- Spelling Exercise - LG1 - U2 grammar worksheet p.1..."
                    className="w-full p-3 bg-rose-50/30 border border-rose-200 rounded-xl text-xs text-slate-800 font-medium focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 3: Reading & Speaking Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-amber-950 uppercase">
                      4. Reading
                    </label>
                    <span className="text-[10px] text-slate-400 italic">Diálogos e textos lidos</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formReading}
                    onChange={(e) => setFormReading(e.target.value)}
                    placeholder="- Reading Text: Mohamed: Hi! / Farida: Hi! How are you? / I'm fine..."
                    className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-xs text-slate-800 font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-purple-950 uppercase">
                      5. Speaking Time
                    </label>
                    <span className="text-[10px] text-slate-400 italic">Atividades interativas</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formSpeakingTime}
                    onChange={(e) => setFormSpeakingTime(e.target.value)}
                    placeholder="- Describe interactive activities with details (Greeting friends in class using grammar p.12-13)..."
                    className="w-full p-3 bg-purple-50/30 border border-purple-200 rounded-xl text-xs text-slate-800 font-medium focus:border-[#533499] focus:ring-1 focus:ring-[#533499] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 4: Homework, Materials & Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-indigo-950 uppercase">
                    6. Homework
                  </label>
                  <textarea
                    rows={2}
                    value={formHomework}
                    onChange={(e) => setFormHomework(e.target.value)}
                    placeholder="- Workbook p.0-00 (ex: Workbook - p.11)..."
                    className="w-full p-3 bg-indigo-50/30 border border-indigo-200 rounded-xl text-xs text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-900 uppercase">
                    7. Materials
                  </label>
                  <textarea
                    rows={2}
                    value={formMaterials}
                    onChange={(e) => setFormMaterials(e.target.value)}
                    placeholder="- Slides, worksheets, unit tests, colored pencils, books..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-emerald-950 uppercase">
                    8. Observations
                  </label>
                  <textarea
                    rows={2}
                    value={formObservations}
                    onChange={(e) => setFormObservations(e.target.value)}
                    placeholder="- Any incidents, tests (Unit 1 teste today), special needs..."
                    className="w-full p-3 bg-emerald-50/30 border border-emerald-200 rounded-xl text-xs text-slate-800 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-7 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Plano de Aula</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
