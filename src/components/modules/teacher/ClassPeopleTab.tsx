import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Search,
  SlidersHorizontal,
  Mail,
  MoreVertical,
  Award,
  CalendarCheck,
  UserPlus,
  Eye,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Student, ClassRoom, Enrollment, Assessment, Grade, Assignment, Submission, AttendanceRecord } from '../../../types';
import { StudentPerformanceModal } from './StudentPerformanceModal';

interface ClassPeopleTabProps {
  selectedClass: ClassRoom;
  students: Student[];
  enrollments: Enrollment[];
  assessments: Assessment[];
  grades: Grade[];
  assignments: Assignment[];
  submissions: Submission[];
  attendanceRecords: AttendanceRecord[];
}

export const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({
  selectedClass,
  students,
  enrollments,
  assessments,
  grades,
  assignments,
  submissions,
  attendanceRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'attendance' | 'grade'>('name');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Active enrollments for this class
  const classEnrollmentStudentIds = new Set(
    enrollments
      .filter((e) => e.classId === selectedClass.id && e.status === 'ATIVA')
      .map((e) => e.studentId)
  );

  // Filter students enrolled in this class
  const classStudents = students.filter((s) => classEnrollmentStudentIds.has(s.id));

  // If none explicitly enrolled, fallback to all students or class sample
  const displayedStudents = classStudents.length > 0 ? classStudents : students;

  // Compute stats per student (attendance % and average grade %)
  const enrichedStudents = React.useMemo(() => {
    return displayedStudents.map((st) => {
      // Attendance
      let presentCount = 0;
      let totalAttDays = 0;
      attendanceRecords.forEach((rec) => {
        if (rec.classId === selectedClass.id) {
          const sRec = rec.students.find((s) => s.studentId === st.id);
          if (sRec) {
            totalAttDays++;
            if (sRec.present) presentCount++;
          }
        }
      });
      const attendancePercent =
        totalAttDays > 0 ? Math.round((presentCount / totalAttDays) * 100) : 100;

      // Grade average
      const sGrades = grades.filter(
        (g) => g.studentId === st.id && (g.classId === selectedClass.id || !g.classId)
      );
      let scoreSum = 0;
      let maxScoreSum = 0;
      sGrades.forEach((g) => {
        scoreSum += g.score;
        maxScoreSum += g.maxScore || 100;
      });
      const averagePercent =
        maxScoreSum > 0 ? Math.round((scoreSum / maxScoreSum) * 100) : 80;

      return {
        student: st,
        attendancePercent,
        averagePercent,
      };
    });
  }, [displayedStudents, attendanceRecords, grades, selectedClass.id]);

  // Apply search and sort
  const filteredStudents = enrichedStudents
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.student.name.toLowerCase().includes(q) ||
        item.student.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.student.name.localeCompare(b.student.name);
      if (sortBy === 'id') return a.student.id.localeCompare(b.student.id);
      if (sortBy === 'attendance') return b.attendancePercent - a.attendancePercent;
      if (sortBy === 'grade') return b.averagePercent - a.averagePercent;
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. SEÇÃO PROFESSORES (Docentes responsáveis)                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#075e38]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Professores da Turma
            </h3>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            1 Docente Titular
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f5e9] text-[#075e38] flex items-center justify-center font-bold text-base shadow-2xs border border-emerald-200/50">
              LS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedClass.teacherName || 'Lucas Silva'}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#075e38]">
                  Docente Titular
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                lucas.silva@thinkgreen.org • Coordenação Pedagógica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
              ✓ Acesso Completo
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEÇÃO ALUNOS (Lista completa, busca, ordenação e desempenho individual) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#075e38]" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Alunos Matriculados
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer aluno para abrir o detalhamento completo de notas, avaliações e frequência.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-[#075e38] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {enrichedStudents.length} alunos
            </span>
          </div>
        </div>

        {/* Search & Sort Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aluno por nome ou matrícula (ex: STU0186)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20"
            >
              <option value="name">Nome (A - Z)</option>
              <option value="id">Matrícula</option>
              <option value="grade">Maior Média</option>
              <option value="attendance">Maior Frequência</option>
            </select>
          </div>
        </div>

        {/* Students Table / List */}
        <div className="divide-y divide-slate-100">
          {filteredStudents.map(({ student, attendancePercent, averagePercent }) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudentForModal(student)}
              className="py-3.5 px-3 rounded-2xl hover:bg-emerald-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-[#e8f5e9] group-hover:text-[#075e38] transition-colors flex items-center justify-center font-bold text-sm shadow-2xs">
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#075e38] transition-colors">
                    {student.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono font-semibold text-slate-600">
                      {student.id}
                    </span>
                    <span>•</span>
                    <span>{student.city || 'Cairo'}</span>
                  </div>
                </div>
              </div>

              {/* Stats badges & Action */}
              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Attendance */}
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Presença
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      attendancePercent >= 75 ? 'text-[#075e38]' : 'text-rose-600'
                    }`}
                  >
                    {attendancePercent}%
                  </span>
                </div>

                {/* Grade */}
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Média
                  </span>
                  <span
                    className={`text-xs font-black ${
                      averagePercent >= 70 ? 'text-[#075e38]' : 'text-amber-600'
                    }`}
                  >
                    {averagePercent}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pl-2">
                  <span className="text-xs font-bold text-[#075e38] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 group-hover:bg-[#075e38] group-hover:text-white transition-all flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Desempenho</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">Nenhum aluno encontrado para "{searchQuery}".</p>
            </div>
          )}
        </div>
      </div>

      {/* Student Performance Individual Modal */}
      {selectedStudentForModal && (
        <StudentPerformanceModal
          isOpen={!!selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          student={selectedStudentForModal}
          selectedClass={selectedClass}
          assessments={assessments}
          grades={grades}
          assignments={assignments}
          submissions={submissions}
          attendanceRecords={attendanceRecords}
        />
      )}
    </div>
  );
};
