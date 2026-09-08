import React from 'react';
import {
  X,
  GraduationCap,
  Award,
  CheckCircle,
  Clock,
  FileText,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  User,
  Star,
  BookOpen,
} from 'lucide-react';
import { Student, ClassRoom, Assessment, Grade, Assignment, Submission, AttendanceRecord } from '../../../types';

interface StudentPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  selectedClass: ClassRoom;
  assessments: Assessment[];
  grades: Grade[];
  assignments: Assignment[];
  submissions: Submission[];
  attendanceRecords: AttendanceRecord[];
}

export const StudentPerformanceModal: React.FC<StudentPerformanceModalProps> = ({
  isOpen,
  onClose,
  student,
  selectedClass,
  assessments,
  grades,
  assignments,
  submissions,
  attendanceRecords,
}) => {
  if (!isOpen || !student) return null;

  // Compute student attendance in this class
  let presentDays = 0;
  let totalClassDays = 0;
  attendanceRecords.forEach((record) => {
    if (record.classId === selectedClass.id) {
      const studentRec = record.students.find((s) => s.studentId === student.id);
      if (studentRec) {
        totalClassDays++;
        if (studentRec.present) presentDays++;
      }
    }
  });

  const attendancePercent =
    totalClassDays > 0 ? Math.round((presentDays / totalClassDays) * 100) : 100;

  // Student's grades in this class
  const studentGrades = grades.filter(
    (g) => g.studentId === student.id && (g.classId === selectedClass.id || !g.classId)
  );

  // Student's submissions in this class
  const studentSubmissions = submissions.filter(
    (s) => s.studentId === student.id
  );

  // Overall Average % calculation
  let totalScoreSum = 0;
  let totalMaxSum = 0;

  studentGrades.forEach((g) => {
    totalScoreSum += g.score;
    totalMaxSum += g.maxScore || 100;
  });

  studentSubmissions.forEach((s) => {
    if (s.score !== undefined && s.maxScore) {
      totalScoreSum += s.score;
      totalMaxSum += s.maxScore;
    }
  });

  const overallAveragePercent =
    totalMaxSum > 0 ? Math.round((totalScoreSum / totalMaxSum) * 100) : 85;

  // Compile detailed list of academic items
  const performanceItems: {
    id: string;
    title: string;
    type: 'PROVA' | 'ATIVIDADE' | 'FREQUENCIA';
    date: string;
    status: 'ENTREGUE' | 'AVALIADO' | 'PENDENTE' | 'AUSENTE' | 'PRESENTE';
    scoreDisplay: string;
    scorePercent?: number;
    feedback?: string;
  }[] = [];

  // 1. Add attendance summary item
  performanceItems.push({
    id: 'perf_att',
    title: 'Frequência e Presença em Aula',
    type: 'FREQUENCIA',
    date: `${presentDays} de ${totalClassDays || 1} dias`,
    status: attendancePercent >= 75 ? 'PRESENTE' : 'AUSENTE',
    scoreDisplay: `${attendancePercent} / 100`,
    scorePercent: attendancePercent,
    feedback: attendancePercent >= 75 ? 'Frequência regular satisfatória' : 'Atenção aos limites de faltas',
  });

  // 2. Add assessments
  assessments.forEach((exam) => {
    const studentGrade = studentGrades.find((g) => g.assessmentId === exam.id);
    if (studentGrade) {
      performanceItems.push({
        id: `perf_exam_${exam.id}`,
        title: exam.title,
        type: 'PROVA',
        date: exam.date,
        status: 'AVALIADO',
        scoreDisplay: `${studentGrade.score} / ${studentGrade.maxScore}`,
        scorePercent: Math.round((studentGrade.score / studentGrade.maxScore) * 100),
        feedback: studentGrade.feedback || 'Avaliação corrigida e pontuada.',
      });
    } else {
      performanceItems.push({
        id: `perf_exam_${exam.id}`,
        title: exam.title,
        type: 'PROVA',
        date: exam.date,
        status: 'PENDENTE',
        scoreDisplay: `— / ${exam.maxScore}`,
        feedback: 'Aguardando aplicação ou lançamento de notas.',
      });
    }
  });

  // 3. Add assignments
  assignments.forEach((assign) => {
    const sub = studentSubmissions.find((s) => s.assignmentId === assign.id);
    if (sub) {
      const isGraded = sub.status === 'AVALIADO' && sub.score !== undefined;
      performanceItems.push({
        id: `perf_assign_${assign.id}`,
        title: assign.title,
        type: 'ATIVIDADE',
        date: assign.dueDate,
        status: isGraded ? 'AVALIADO' : 'ENTREGUE',
        scoreDisplay: isGraded ? `${sub.score} / ${sub.maxScore || assign.maxScore}` : 'Entregue',
        scorePercent: isGraded && sub.maxScore ? Math.round((sub.score! / sub.maxScore) * 100) : undefined,
        feedback: sub.feedback || 'Trabalho submetido pelo estudante.',
      });
    } else {
      performanceItems.push({
        id: `perf_assign_${assign.id}`,
        title: assign.title,
        type: 'ATIVIDADE',
        date: assign.dueDate,
        status: 'PENDENTE',
        scoreDisplay: `— / ${assign.maxScore}`,
        feedback: 'Não entregue ou em andamento.',
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#064e2e] to-[#075e38] text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold text-xl border border-white/20">
              {student.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 text-emerald-100 uppercase tracking-wider">
                  {student.id}
                </span>
                <span className="text-xs text-emerald-200">
                  {selectedClass.name}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                {student.name}
              </h3>
              <p className="text-xs text-emerald-100/80">
                Acompanhamento Pedagógico Individual • Desempenho Escolar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Média Geral
            </span>
            <span
              className={`text-xl font-black block mt-0.5 ${
                overallAveragePercent >= 70 ? 'text-[#075e38]' : 'text-amber-600'
              }`}
            >
              {overallAveragePercent}%
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Frequência
            </span>
            <span
              className={`text-xl font-black block mt-0.5 ${
                attendancePercent >= 75 ? 'text-[#075e38]' : 'text-rose-600'
              }`}
            >
              {attendancePercent}%
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tarefas Entregues
            </span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              {studentSubmissions.length} / {assignments.length || 1}
            </span>
          </div>
        </div>

        {/* Academic Breakdown Table */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Detalhamento de Avaliações, Trabalhos e Frequência
          </h4>

          <div className="space-y-2.5">
            {performanceItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'PROVA'
                        ? 'bg-purple-50 text-purple-700'
                        : item.type === 'ATIVIDADE'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-[#075e38]'
                    }`}
                  >
                    {item.type === 'PROVA' ? (
                      <Award className="w-4 h-4" />
                    ) : item.type === 'ATIVIDADE' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <CalendarCheck className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {item.type}
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.feedback}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-sm font-black block ${
                      item.status === 'AVALIADO' || item.status === 'PRESENTE'
                        ? 'text-slate-900'
                        : item.status === 'ENTREGUE'
                        ? 'text-blue-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.scoreDisplay}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      item.status === 'AVALIADO' || item.status === 'PRESENTE'
                        ? 'bg-emerald-50 text-[#075e38] border border-emerald-200'
                        : item.status === 'ENTREGUE'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status === 'AVALIADO'
                      ? 'Avaliado'
                      : item.status === 'ENTREGUE'
                      ? 'Entregue'
                      : item.status === 'PRESENTE'
                      ? 'Presente'
                      : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
