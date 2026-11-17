import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Sliders,
  HelpCircle,
  Play,
  GraduationCap,
  BookOpen,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SystemSettings } from '../../../types';

export const AdminRulesTab: React.FC = () => {
  const { state, updateSettings, checkExamAccess, checkClassroomAccess } = useApp();

  const [savedFeedback, setSavedFeedback] = useState(false);

  // Settings accessor with safe fallbacks
  const settings = state.settings || {
    centerName: 'Think Green Community Center',
    location: 'Cairo, Egypt (مصر)',
    currencySymbol: 'EGP',
    currencyCode: 'EGP',
    enableAutomaticExamGates: true,
    enableAutomaticClassroomGates: true,
    minimumPassingGrade: 60,
    attendanceRequirementPercent: 75,
    rulesConfig: {
      rule1_classroomRequiresFirstPayment: true,
      rule2_exam1RequiresSecondPayment: true,
      rule3_finalExamRequiresFullPayment: true,
    },
  };

  // Academic criteria state
  const [minGrade, setMinGrade] = useState<number>(settings.minimumPassingGrade || 60);
  const [minAttendance, setMinAttendance] = useState<number>(settings.attendanceRequirementPercent || 75);

  // Simulator state
  const [simulatorStudentId, setSimulatorStudentId] = useState<string>(
    state.students[0]?.studentId || ''
  );
  const [simulatorAssessmentId, setSimulatorAssessmentId] = useState<string>(
    state.assessments[0]?.id || ''
  );
  const [simulatorClassId, setSimulatorClassId] = useState<string>(
    state.classes[0]?.id || ''
  );
  const [simulatorExamResult, setSimulatorExamResult] = useState<{
    allowed: boolean;
    reason?: string;
    requiredStage?: string;
    isFinancialBlock?: boolean;
  } | null>(null);
  const [simulatorClassResult, setSimulatorClassResult] = useState<{
    allowed: boolean;
    reason?: string;
    isFinancialBlock?: boolean;
    overdueCount?: number;
    unpaidInstallments?: number[];
  } | null>(null);

  const handleToggleRule = (key: keyof typeof settings.rulesConfig) => {
    const currentRules = settings.rulesConfig || {
      rule1_classroomRequiresFirstPayment: true,
      rule2_exam1RequiresSecondPayment: true,
      rule3_finalExamRequiresFullPayment: true,
    };
    const updatedRules = { ...currentRules, [key]: !currentRules[key] };
    updateSettings({
      rulesConfig: updatedRules,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleToggleMasterGate = (key: 'enableAutomaticExamGates' | 'enableAutomaticClassroomGates') => {
    updateSettings({
      [key]: !settings[key],
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleSaveAcademicCriteria = () => {
    updateSettings({
      minimumPassingGrade: Number(minGrade),
      attendanceRequirementPercent: Number(minAttendance),
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleRunSimulation = () => {
    if (!simulatorStudentId) return;

    // Check Exam Gate
    const selectedAssessment = state.assessments.find((a) => a.id === simulatorAssessmentId) || state.assessments[0];
    if (selectedAssessment) {
      const examRes = checkExamAccess(simulatorStudentId, selectedAssessment);
      setSimulatorExamResult(examRes);
    }

    // Check Classroom Gate
    const selectedClass = state.classes.find((c) => c.id === simulatorClassId) || state.classes[0];
    if (selectedClass) {
      const classRes = checkClassroomAccess(simulatorStudentId, selectedClass.id);
      setSimulatorClassResult(classRes);
    }
  };

  const selectedStudentObj = state.students.find((s) => s.studentId === simulatorStudentId);
  const studentEnrollments = state.enrollments.filter((e) => e.studentId === simulatorStudentId);
  const studentCharges = state.charges.filter((c) => c.studentId === simulatorStudentId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
            Business Rules Engine & Automatic Gates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the academic release gates based on financial standing and test them in real time.
          </p>
        </div>

        {savedFeedback && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Rules updated across all portals!
          </div>
        )}
      </div>

      {/* Master Gate Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Financial Exam Gate</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Automatic Lock on Assessments (LMS)</h4>
            <p className="text-xs text-slate-500 mt-1">
              Prevents students with pending tuition from taking Exam 1 or the Final Exam in the student portal.
            </p>
          </div>

          <button
            onClick={() => handleToggleMasterGate('enableAutomaticExamGates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              settings.enableAutomaticExamGates
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {settings.enableAutomaticExamGates ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Attendance & Access Gate</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Classroom Entry / Attendance Lock</h4>
            <p className="text-xs text-slate-500 mt-1">
              Flags an alert in the teacher's log and blocks course materials if the 1st installment is not paid.
            </p>
          </div>

          <button
            onClick={() => handleToggleMasterGate('enableAutomaticClassroomGates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              settings.enableAutomaticClassroomGates
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {settings.enableAutomaticClassroomGates ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* The 3 Core Rules Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-purple-600" />
          Individual Configuration of the 3 Strategic Rules
        </h3>

        <div className="space-y-3.5 text-xs">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Rule 1: Classroom / Field Access Requires 1st Installment (Enrollment)
                </h4>
              </div>
              <p className="text-slate-600">
                Newly registered students must have the first installment (or registration fee) paid at the treasury to appear as released on the teacher's attendance list.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule1_classroomRequiresFirstPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule1_classroomRequiresFirstPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule1_classroomRequiresFirstPayment ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Rule 2: Lock on 1st Assessment / Midterm (Requires 2nd Installment)
                </h4>
              </div>
              <p className="text-slate-600">
                At the midpoint of the course (Exam 1), the student can only open the test if the 2nd tuition payment is confirmed in the financial system. Instructions for immediate regularization are shown.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule2_exam1RequiresSecondPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule2_exam1RequiresSecondPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule2_exam1RequiresSecondPayment ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Rule 3: Final Exam Lock and Certificate Issuance (Requires Full Payment)
                </h4>
              </div>
              <p className="text-slate-600">
                Requires 100% of enrollment installments (e.g., 4 installments) to be fully paid before releasing the course Final Exam and printing the official completion certificate.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule3_finalExamRequiresFullPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule3_finalExamRequiresFullPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule3_finalExamRequiresFullPayment ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Academic Thresholds Config */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-emerald-600" />
          Academic Passing Criteria & Attendance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Minimum Passing Average (0 to 100 points):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={minGrade}
                onChange={(e) => setMinGrade(Number(e.target.value))}
                className="w-32 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-slate-500">minimum points required</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Attendance Tracking Target (%):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-32 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-slate-500">% attendance (informational only)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Student passing does not depend on minimum attendance (no failing for absence). Attendance viewing is kept for pedagogical monitoring.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAcademicCriteria}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
          >
            Save Academic Criteria
          </button>
        </div>
      </div>

      {/* Live Interactive Rule Simulator / Gate Tester */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-700" />
              Live Rule Engine Simulator (Gate Tester)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a student and instantly simulate the behavior of the financial and academic gates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Select Student */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. Select the Student:</label>
            <select
              value={simulatorStudentId}
              onChange={(e) => {
                setSimulatorStudentId(e.target.value);
                setSimulatorExamResult(null);
                setSimulatorClassResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.students.map((s) => (
                <option key={s.id} value={s.studentId}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Select Assessment */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">2. Select the Assessment:</label>
            <select
              value={simulatorAssessmentId}
              onChange={(e) => {
                setSimulatorAssessmentId(e.target.value);
                setSimulatorExamResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Select Class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">3. Select the Class:</label>
            <select
              value={simulatorClassId}
              onChange={(e) => {
                setSimulatorClassId(e.target.value);
                setSimulatorClassResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunSimulation}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run Gate Simulation
          </button>
        </div>

        {/* Simulation Output */}
        {(simulatorExamResult || simulatorClassResult) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in text-xs">
            {/* Exam Gate Verdict */}
            {simulatorExamResult && (
              <div
                className={`p-4 rounded-2xl border ${
                  simulatorExamResult.allowed
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {simulatorExamResult.allowed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Assessment: RELEASED TO TAKE
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-rose-600" />
                      Assessment: BLOCKED BY BUSINESS RULE
                    </>
                  )}
                </div>
                <p className="text-[11px] mt-1">
                  {simulatorExamResult.reason || 'Student meets all financial requirements for this assessment.'}
                </p>
                {simulatorExamResult.requiredStage && (
                  <p className="text-[10px] font-mono mt-2 font-bold text-slate-600">
                    Required Stage: {simulatorExamResult.requiredStage}
                  </p>
                )}
              </div>
            )}

            {/* Classroom Access Verdict */}
            {simulatorClassResult && (
              <div
                className={`p-4 rounded-2xl border ${
                  simulatorClassResult.allowed
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {simulatorClassResult.allowed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Classroom: ACCESS GRANTED
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Classroom: OUTSTANDING ISSUE FOUND
                    </>
                  )}
                </div>
                <p className="text-[11px] mt-1">
                  {simulatorClassResult.reason || 'Student in good standing with the first enrollment installment.'}
                </p>
                {simulatorClassResult.unpaidInstallments && simulatorClassResult.unpaidInstallments.length > 0 && (
                  <p className="text-[10px] font-mono mt-2 font-bold text-slate-600">
                    Open Installments: {simulatorClassResult.unpaidInstallments.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
