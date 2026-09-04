import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Award,
  CalendarCheck,
  PieChart,
  Plus,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency } from '../../../lib/storage';
import { Course, ClassRoom, Assessment } from '../../../types';

interface AcademicModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AcademicModule: React.FC<AcademicModuleProps> = ({ currentTab, setCurrentTab }) => {
  const { state, createAssessment } = useApp();

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [newAsmTitle, setNewAsmTitle] = useState('');
  const [newAsmCourseId, setNewAsmCourseId] = useState(state.courses[0]?.id || '');
  const [newAsmClassId, setNewAsmClassId] = useState(state.classes[0]?.id || '');
  const [newAsmMaxScore, setNewAsmMaxScore] = useState(100);
  const [newAsmRequiredStage, setNewAsmRequiredStage] = useState<'NONE' | 'STAGE_1_PAID' | 'STAGE_2_PAID' | 'ALL_PAID'>('STAGE_1_PAID');
  const [newAsmDate, setNewAsmDate] = useState('2025-11-20');

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const course = state.courses.find((c) => c.id === newAsmCourseId);
    createAssessment({
      courseId: newAsmCourseId,
      courseName: course?.name || 'Curso',
      classId: newAsmClassId,
      title: newAsmTitle,
      type: 'PROVA_FINAL',
      weight: 40,
      maxScore: newAsmMaxScore,
      date: newAsmDate,
      requiredFinancialStage: newAsmRequiredStage,
    });
    setIsAssessmentModalOpen(false);
    setNewAsmTitle('');
  };

  return (
    <div className="space-y-6">
      {/* 1. ACADEMIC HERO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Diretoria Pedagógica & Acadêmica
            </span>
            <span className="text-xs text-slate-400">Think Green Academic Core</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Gestão Pedagógica, Cursos & Turmas
          </h1>
          <p className="text-xs text-slate-500">
            Controle de matrizes curriculares, alocação de docentes, avaliações e travas pedagógicas.
          </p>
        </div>

        <button
          onClick={() => setIsAssessmentModalOpen(true)}
          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="w-4 h-4" /> Nova Avaliação / Prova
        </button>
      </div>

      {/* 2. STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Frentes Pedagógicas"
          value={`${state.courses.length} Cursos`}
          subtitle="Idiomas, Infantil, Esportes"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Turmas em Execução"
          value={`${state.classes.length} Turmas`}
          subtitle="Salas e Campos no Cairo"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Avaliações Agendadas"
          value={`${state.assessments.length} Provas`}
          subtitle="Com travas de negócios"
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Total de Matrículas"
          value={state.enrollments.length}
          subtitle="Alunos ativos no centro"
          icon={Users}
          color="sky"
        />
      </div>

      {/* 3. COURSES & TRACKS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-700" />
          Cursos e Frentes de Atuação da Think Green
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.courses.map((course) => {
            const courseClasses = state.classes.filter((c) => c.courseId === course.id);
            const courseEnrollments = state.enrollments.filter((e) => e.courseId === course.id);

            return (
              <div
                key={course.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{course.name}</h3>
                    <p className="text-xs text-slate-500">{course.description}</p>
                  </div>
                  <Badge status="ATIVA" size="sm" />
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Turmas:</span>
                    <p className="font-bold text-slate-800">{courseClasses.length} turmas</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Alunos:</span>
                    <p className="font-bold text-slate-800">{courseEnrollments.length} matriculados</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Mensalidade:</span>
                    <p className="font-mono font-bold text-emerald-700">
                      {formatCurrency(course.monthlyFee, 'EGP')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CLASSES & ROOMS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Turmas, Professores & Espaços Físicos
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Professor</th>
                <th className="px-4 py-3">Horário</th>
                <th className="px-4 py-3">Local / Sala</th>
                <th className="px-4 py-3 text-right">Alunos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.classes.map((cls) => {
                const enrCount = state.enrollments.filter((e) => e.classId === cls.id).length;
                return (
                  <tr key={cls.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-purple-700">{cls.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{cls.name}</td>
                    <td className="px-4 py-3 text-slate-600">{cls.courseName}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cls.teacherName}</td>
                    <td className="px-4 py-3 text-slate-600">{cls.schedule}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{cls.room}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-700 font-mono">
                      {enrCount} / {cls.capacity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Avaliação */}
      <Modal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title="Agendar Nova Avaliação & Definir Trava Financeira"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Título da Prova / Avaliação</label>
            <input
              type="text"
              required
              placeholder="Ex: Exame Final Oral e Escrito - Term 1"
              value={newAsmTitle}
              onChange={(e) => setNewAsmTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Curso</label>
              <select
                value={newAsmCourseId}
                onChange={(e) => {
                  setNewAsmCourseId(e.target.value);
                  const matchingClass = state.classes.find((c) => c.courseId === e.target.value);
                  if (matchingClass) setNewAsmClassId(matchingClass.id);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Turma</label>
              <select
                value={newAsmClassId}
                onChange={(e) => setNewAsmClassId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                {state.classes
                  .filter((c) => c.courseId === newAsmCourseId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Regra de Negócio / Trava Financeira para Liberação
            </label>
            <select
              value={newAsmRequiredStage}
              onChange={(e: any) => setNewAsmRequiredStage(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-purple-800 bg-purple-50"
            >
              <option value="NONE">Sem trava (Livre acesso a todos)</option>
              <option value="STAGE_1_PAID">Exige Parcela 1 Paga (Prova Intermediária)</option>
              <option value="STAGE_2_PAID">Exige Parcelas 1 e 2 Pagas</option>
              <option value="ALL_PAID">Exige Quitação Integral de Todas as Parcelas</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAssessmentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold"
            >
              Agendar Avaliação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
