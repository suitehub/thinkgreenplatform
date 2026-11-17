import React, { useState } from 'react';
import {
  Star,
  Award,
  Save,
  CheckCircle,
  FileSpreadsheet,
  HelpCircle,
  Edit,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  Check,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { Student, ClassRoom, Assessment, Grade, Assignment, Submission } from '../../../types';

interface ClassGradesTabProps {
  selectedClass: ClassRoom;
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  assignments: Assignment[];
  submissions: Submission[];
  onSaveGrade: (grade: Omit<Grade, 'id' | 'gradedAt' | 'gradedBy'>) => void;
  onSaveBatchGrades: (grades: Omit<Grade, 'id' | 'gradedAt' | 'gradedBy'>[]) => void;
  onOpenExamDetails?: (exam: Assessment) => void;
  onToggleFinalGradeRelease?: (isReleased: boolean) => void;
}

export const ClassGradesTab: React.FC<ClassGradesTabProps> = ({
  selectedClass,
  students,
  assessments,
  grades,
  assignments,
  submissions,
  onSaveGrade,
  onSaveBatchGrades,
  onOpenExamDetails,
  onToggleFinalGradeRelease,
}) => {
  // Mode: 'gradebook' (table matrix) or 'grading' (direct entry form for the selected assessment)
  const [viewMode, setViewMode] = useState<'gradebook' | 'grading'>('gradebook');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );
  const [batchDraftGrades, setBatchDraftGrades] = useState<{
    [studentId: string]: { score: number; feedback: string };
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // Requirement 4: Final Exam and final grade release state
  const finalExam = assessments.find(
    (a) =>
      a.type === 'PROVA_FINAL' ||
      a.title.toLowerCase().includes('final') ||
      a.title.toLowerCase().includes('conclus')
  );
  const finalExamGradesCount = finalExam
    ? grades.filter((g) => g.assessmentId === finalExam.id).length
    : 0;
  const isFinalGradeReleased = selectedClass.isFinalGradeReleased ?? false;

  // Sync selectedAssessmentId if assessments change
  React.useEffect(() => {
    if (!selectedAssessmentId && assessments.length > 0) {
      setSelectedAssessmentId(assessments[0].id);
    }
  }, [assessments, selectedAssessmentId]);

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  // Initialize draft grades when activeAssessment changes
  React.useEffect(() => {
    if (!activeAssessment) return;
    const initialDraft: { [studentId: string]: { score: number; feedback: string } } = {};
    students.forEach((st) => {
      const existingGrade = grades.find(
        (g) => g.assessmentId === activeAssessment.id && g.studentId === st.id
      );
      initialDraft[st.id] = {
        score: existingGrade ? existingGrade.score : 80,
        feedback: existingGrade?.feedback || '',
      };
    });
    setBatchDraftGrades(initialDraft);
  }, [activeAssessment, students, grades]);

  // Calculate overall average for each student
  const studentMetrics = React.useMemo(() => {
    const map: {
      [studentId: string]: {
        averagePercent: number;
        totalEarned: number;
        totalMax: number;
      };
    } = {};

    students.forEach((st) => {
      let earned = 0;
      let max = 0;

      // From assessments
      assessments.forEach((exam) => {
        const g = grades.find(
          (grade) => grade.assessmentId === exam.id && grade.studentId === st.id
        );
        if (g) {
          earned += g.score;
          max += g.maxScore || 100;
        }
      });

      // From graded assignments
      assignments.forEach((assign) => {
        const sub = submissions.find(
          (s) => s.assignmentId === assign.id && s.studentId === st.id
        );
        if (sub && sub.score !== undefined && sub.maxScore) {
          earned += sub.score;
          max += sub.maxScore;
        }
      });

      const averagePercent = max > 0 ? Math.round((earned / max) * 100) : 80;
      map[st.id] = { averagePercent, totalEarned: earned, totalMax: max };
    });

    return map;
  }, [students, assessments, assignments, grades, submissions]);

  // Handle single grade save
  const handleSaveSingleGrade = (studentId: string, studentName: string) => {
    if (!activeAssessment) return;
    const draft = batchDraftGrades[studentId];
    if (!draft) return;

    onSaveGrade({
      assessmentId: activeAssessment.id,
      assessmentTitle: activeAssessment.title,
      classId: selectedClass.id,
      studentId,
      studentName,
      score: draft.score,
      maxScore: activeAssessment.maxScore,
      percentage: Math.round((draft.score / activeAssessment.maxScore) * 100),
      feedback: draft.feedback,
    });

    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3500);
  };

  // Handle batch grade save
  const handleSaveAllGrades = () => {
    if (!activeAssessment) return;

    const listToSave = students.map((st) => {
      const draft = batchDraftGrades[st.id] || { score: 80, feedback: '' };
      return {
        assessmentId: activeAssessment.id,
        assessmentTitle: activeAssessment.title,
        classId: selectedClass.id,
        studentId: st.id,
        studentName: st.name,
        score: draft.score,
        maxScore: activeAssessment.maxScore,
        percentage: Math.round((draft.score / activeAssessment.maxScore) * 100),
        feedback: draft.feedback,
      };
    });

    onSaveBatchGrades(listToSave);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3500);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {savedSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Grades saved successfully! The student report card and academic reports have been updated.</span>
          </div>
          <button
            onClick={() => setSavedSuccessToast(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Requirement 4: Final average visibility control */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isFinalGradeReleased
            ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
            : 'bg-amber-50/70 border-amber-300 shadow-xs'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isFinalGradeReleased
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'bg-amber-500 text-white shadow-2xs'
            }`}
          >
            {isFinalGradeReleased ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isFinalGradeReleased
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-200 text-amber-950 border border-amber-300'
                }`}
              >
                {isFinalGradeReleased
                  ? 'Final Average Released to Students'
                  : 'Final Average Hidden / In Progress for Students'}
              </span>
              {finalExam && (
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {finalExam.title}: {finalExamGradesCount}/{students.length} grades entered
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {isFinalGradeReleased
                ? 'Enrolled students can see the finalized final average on their report card.'
                : 'The final average is protected: students see an "In progress" status to avoid premature interpretation of partial averages.'}
            </h4>
            <p className="text-xs text-slate-600">
              {isFinalGradeReleased
                ? 'If you need to review or change grades, you can suspend the release at any time.'
                : 'The final average should only be shown in the student portal once the required assessments are complete, the grades entered and released by the teacher.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isFinalGradeReleased && finalExam && finalExamGradesCount < students.length) {
                if (
                  !confirm(
                    `Warning: The final exam "${finalExam.title}" still has pending grades (${finalExamGradesCount}/${students.length} entered).\n\nDo you still want to release the final average to students?`
                  )
                ) {
                  return;
                }
              }
              onToggleFinalGradeRelease?.(!isFinalGradeReleased);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
              isFinalGradeReleased
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                : 'bg-[#075e38] hover:bg-[#064e2e] text-white'
            }`}
          >
            {isFinalGradeReleased ? (
              <>
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Suspend Release (Hide Average)</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Release Final Average to Students</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control header and mode switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#075e38]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {viewMode === 'gradebook' ? 'General Gradebook' : 'Enter Grades by Assessment'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'gradebook'
              ? 'Integrated table comparing assessments, assignments and the overall class average.'
              : 'Select the term assessment to enter or update individual grades with academic feedback.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('gradebook')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'gradebook'
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Overview (Gradebook)
          </button>
          <button
            onClick={() => setViewMode('grading')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grading'
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#075e38] border border-emerald-200'
            }`}
          >
            Enter Grades
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: GRADEBOOK TABLE MATRIX (Google Classroom gradebook model)        */}
      {/* ========================================================================= */}
      {viewMode === 'gradebook' && (
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs overflow-hidden">
          {/* Table search and filter bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter students by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {filteredStudents.length} students listed
              </span>
            </div>
          </div>

          {/* Scrollable matrix table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700">
                  <th className="p-4 font-bold min-w-[200px] sticky left-0 bg-slate-50 z-10">
                    Student
                  </th>
                  <th className="p-4 font-black text-[#075e38] min-w-[110px] text-center bg-emerald-50/50">
                    Overall Average
                  </th>
                  {/* Dynamic assessment columns */}
                  {assessments.map((exam) => (
                    <th
                      key={exam.id}
                      className="p-4 font-bold min-w-[150px] hover:bg-slate-100/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedAssessmentId(exam.id);
                        setViewMode('grading');
                      }}
                      title="Click to enter grades for this exam"
                    >
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span className="truncate">{exam.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        {exam.date} • Weight {exam.weight}% • Max: {exam.maxScore}
                      </span>
                    </th>
                  ))}
                  {/* Graded assignment columns */}
                  {assignments.map((assign) => (
                    <th key={assign.id} className="p-4 font-bold min-w-[140px]">
                      <span className="truncate block">{assign.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        Assignment • Max: {assign.maxScore}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const metric = studentMetrics[st.id] || { averagePercent: 80 };

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student name sticky column */}
                      <td className="p-4 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#075e38] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                            {st.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="block leading-tight">{st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              {st.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Overall average cell */}
                      <td className="p-4 text-center font-black bg-emerald-50/20">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                            metric.averagePercent >= 70
                              ? 'bg-emerald-100 text-[#075e38]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {metric.averagePercent}%
                        </span>
                      </td>

                      {/* Assessment grade cells */}
                      {assessments.map((exam) => {
                        const gradeRec = grades.find(
                          (g) => g.assessmentId === exam.id && g.studentId === st.id
                        );

                        return (
                          <td
                            key={exam.id}
                            onClick={() => {
                              setSelectedAssessmentId(exam.id);
                              setViewMode('grading');
                            }}
                            className="p-4 cursor-pointer hover:bg-purple-50/40 transition-colors"
                          >
                            {gradeRec ? (
                              <div>
                                <span className="font-bold text-slate-900">
                                  {gradeRec.score}
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                  {' '}/ {exam.maxScore}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-semibold text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Assignment grade cells */}
                      {assignments.map((assign) => {
                        const sub = submissions.find(
                          (s) => s.assignmentId === assign.id && s.studentId === st.id
                        );

                        return (
                          <td key={assign.id} className="p-4">
                            {sub && sub.score !== undefined ? (
                              <div>
                                <span className="font-bold text-slate-900">
                                  {sub.score}
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                  {' '}/ {assign.maxScore}
                                </span>
                              </div>
                            ) : sub ? (
                              <span className="text-blue-600 font-medium text-[11px] bg-blue-50 px-2 py-0.5 rounded">
                                Submitted
                              </span>
                            ) : (
                              <span className="text-slate-300 font-semibold text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DIRECT ASSESSMENT GRADING VIEW (grade entry)                     */}
      {/* ========================================================================= */}
      {viewMode === 'grading' && (
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-7 space-y-6">
          {/* Assessment selection bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Select Assessment for Grade Entry:
              </span>
              <div className="relative">
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="appearance-none bg-white font-bold text-sm text-slate-900 pl-3 pr-8 py-2 rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-400/30 cursor-pointer shadow-2xs"
                >
                  {assessments.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} (Date: {exam.date} • Weight: {exam.weight}%)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {activeAssessment && (
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 block">Maximum Grade</span>
                  <strong className="text-slate-900 text-sm font-black">{activeAssessment.maxScore} points</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Term Weight</span>
                  <strong className="text-purple-700 text-sm font-black">{activeAssessment.weight}%</strong>
                </div>
                <button
                  onClick={handleSaveAllGrades}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ml-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Grades</span>
                </button>
              </div>
            )}
          </div>

          {/* Student grading form table */}
          {activeAssessment ? (
            <div className="divide-y divide-slate-100">
              <div className="hidden sm:grid grid-cols-12 gap-3 py-2 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-4">Student</div>
                <div className="col-span-2 text-center">Current Grade</div>
                <div className="col-span-2 text-center">New Grade</div>
                <div className="col-span-3">Academic Feedback</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {filteredStudents.map((st) => {
                const currentGrade = grades.find(
                  (g) => g.assessmentId === activeAssessment.id && g.studentId === st.id
                );
                const draft = batchDraftGrades[st.id] || { score: 80, feedback: '' };

                return (
                  <div
                    key={st.id}
                    className="py-3.5 px-3 hover:bg-slate-50/70 transition-colors flex flex-col sm:grid sm:grid-cols-12 gap-3 items-start sm:items-center rounded-2xl"
                  >
                    {/* Student info */}
                    <div className="sm:col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {st.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {st.id}
                        </span>
                      </div>
                    </div>

                    {/* Current grade */}
                    <div className="sm:col-span-2 text-center w-full sm:w-auto">
                      <span className="text-xs text-slate-400 sm:hidden">Current Grade: </span>
                      <span className="text-xs font-bold text-slate-700">
                        {currentGrade ? `${currentGrade.score} / ${activeAssessment.maxScore}` : 'Not entered'}
                      </span>
                    </div>

                    {/* New grade input */}
                    <div className="sm:col-span-2 flex items-center justify-center gap-1.5 w-full sm:w-auto">
                      <span className="text-xs text-slate-400 sm:hidden">New Grade: </span>
                      <input
                        type="number"
                        min={0}
                        max={activeAssessment.maxScore}
                        value={draft.score}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBatchDraftGrades({
                            ...batchDraftGrades,
                            [st.id]: { ...draft, score: val },
                          });
                        }}
                        className="w-20 px-2.5 py-1.5 text-center font-black text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/30"
                      />
                      <span className="text-[11px] text-slate-400">/ {activeAssessment.maxScore}</span>
                    </div>

                    {/* Feedback input */}
                    <div className="sm:col-span-3 w-full">
                      <input
                        type="text"
                        placeholder="Note or feedback for the student..."
                        value={draft.feedback}
                        onChange={(e) => {
                          setBatchDraftGrades({
                            ...batchDraftGrades,
                            [st.id]: { ...draft, feedback: e.target.value },
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20"
                      />
                    </div>

                    {/* Save action */}
                    <div className="sm:col-span-1 text-right w-full sm:w-auto self-end sm:self-center">
                      <button
                        onClick={() => handleSaveSingleGrade(st.id, st.name)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#075e38] text-[#075e38] hover:text-white text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
                        title="Save this student's grade"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">
              No assessment selected or registered for this class.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
