import React, { useState } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Info,
  Layers,
  Users,
  RefreshCw,
  Calendar,
  Phone,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import {
  parseOfficialSpreadsheet,
  resolveClassByLevel,
  ACADEMIC_MONTHS_MAP,
  ParsedSpreadsheetStudent,
} from '../../../../lib/spreadsheetParser';

export const SecretariatImportTab: React.FC = () => {
  const { state, importStudentsBatch } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSpreadsheetStudent[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [importResult, setImportResult] = useState<{
    count: number;
    totalAmount: number;
    timestamp: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseAndResolve = (
    text: string,
    courseId: string,
    classId: string
  ) => {
    const parsed = parseOfficialSpreadsheet(text, courseId, classId);

    // Count already-enrolled students to distribute classes of the same level
    const usage: Record<string, number> = {};
    state.enrollments.forEach((enr) => {
      if (enr.status === 'ATIVA') usage[enr.classId] = (usage[enr.classId] || 0) + 1;
    });

    return parsed.map((row) => {
      const matched = resolveClassByLevel(row.level, state.classes, usage);
      if (!matched) return row;
      usage[matched.id] = (usage[matched.id] || 0) + 1;
      return {
        ...row,
        classId: matched.id,
        className: matched.name,
        courseId: matched.courseId || row.courseId,
      };
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    setParsedRows(parseAndResolve(text, selectedCourseId, selectedClassId));
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (rawText.trim()) setParsedRows(parseAndResolve(rawText, courseId, selectedClassId));
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (rawText.trim()) setParsedRows(parseAndResolve(rawText, selectedCourseId, classId));
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const totalPaid = parsedRows.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
      const importedCount = importStudentsBatch(parsedRows);
      setIsProcessing(false);
      setImportResult({
        count: importedCount,
        totalAmount: totalPaid,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      setRawText('');
      setParsedRows([]);
    }, 600);
  };

  const handleDownloadTemplate = () => {
    const headerLine = 'Timestamp\tSTU_ID\tName\tDate of birth\tGender\tEmail\tCountry Code\tPhone number\tStudent ID\tIsParent\tResponsible Email\tResponsible ID\tFather Name\tMother Name\tLevel\n';
    const sampleLine = '01/08/2026 10:00\tSTU00001\tSTUDENT NAME\t07/12/2014\tFemale\tstudent@thinkgreen.org\t20\t1142048695\t31401300000000\tYes\t\t\tStudent\'s Father\tStudent\'s Mother\tA1\n';
    const content = headerLine + sampleLine;
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'think_green_spreadsheet_template.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalImportPaid = parsedRows.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
  const totalImportPending = parsedRows.reduce((acc, curr) => acc + curr.totalPendingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Registrar's Office • Official Spreadsheet Order
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Student Management Layout (Level in the last column)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Community Center Spreadsheet Importer
          </h2>
          <p className="text-xs text-slate-500">
            Configured to read: <span className="font-mono font-semibold text-slate-700">Timestamp, STU_ID, Name, Date of birth, Gender, Email, Country Code, Phone number, Student ID, IsParent, Responsible Email, Responsible ID, Father Name, Mother Name, Level</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download a template compatible with Excel and Google Sheets"
          >
            <Download className="w-4 h-4" /> Download TSV Template
          </button>
        </div>
      </div>

      {/* Official Column Sequence Visual Legend */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Exact Spreadsheet Column Order
          </span>
          <span className="text-[10px] text-slate-400 font-mono">15 Mapped Columns</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
          {['Timestamp', 'STU_ID', 'Name', 'Date of birth', 'Gender', 'Email', 'Country Code', 'Phone number', 'Student ID', 'IsParent', 'Responsible Email', 'Responsible ID', 'Father Name', 'Mother Name', 'Level'].map((label, idx) => (
            <span
              key={label}
              className={`px-2 py-1 rounded border shrink-0 ${
                label === 'Level'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-bold'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
              }`}
            >
              {idx + 1}. {label}
            </span>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-700" /> STU ID Preservation
          </span>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            If the spreadsheet already contains codes (e.g. <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-950 font-bold">STU00001</code>), they are kept. If empty, new codes are generated sequentially.
          </p>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" /> Installments & Receipts
          </span>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            When the spreadsheet includes month columns (Aug..July), the amounts generate automatic receipts for the Treasury and Revenue entries in Accounting.
          </p>
        </div>

        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-sky-700" /> Automatic Portal Access
          </span>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            Creates student login accounts for immediate access to the LMS environment and grade reports.
          </p>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Import Completed Successfully!
              </h4>
              <p className="text-xs text-emerald-800">
                {importResult.count} students were registered and automatically assigned to classes by LEVEL. {importResult.totalAmount > 0 && `${importResult.totalAmount.toLocaleString()} EGP were reconciled into receipts.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Configuration & Input Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Optional Defaults for Course and Class */}
        <div className="space-y-3 pb-4 border-b border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-semibold leading-relaxed">
            <span className="flex items-center gap-1.5 font-bold">
              <Layers className="w-4 h-4 text-emerald-700" /> Class identified automatically by LEVEL
            </span>
            The spreadsheet does not need a class column: the system compares each student's LEVEL (A1, A2, A2+, B1, B2, C1...) with the levels of already-registered classes and assigns the student to the matching class. If multiple classes exist for the same level (e.g. A2 (A) and A2 (B)), students are distributed to balance enrollment counts. The fields below are only used when the level does not match any class.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Course (when the level does not match any class):</label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.monthlyFee} EGP/month)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Class (fallback):</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.schedule})
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              Paste Rows from Your Spreadsheet (Google Sheets / Excel / CSV)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {parsedRows.length} row(s) recognized
            </span>
          </div>

          <textarea
            rows={7}
            value={rawText}
            onChange={handleTextChange}
            placeholder={`Paste the rows copied from your Excel or Google Sheets spreadsheet here...\nExample:\n01/08/2026 10:00\tSTU00001\tSTUDENT NAME\t07/12/2014\tFemale\tstudent@thinkgreen.org\t20\t1142048695\t31401300000000\tYes\t\t\tStudent's Father\tStudent's Mother\tA1`}
            className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Live Preview Table of Parsed Rows */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-xs">
                  Import Preview ({parsedRows.length} students detected):
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-700 font-bold">
                  Total Paid in Batch: {totalImportPaid.toLocaleString()} EGP
                </span>
                <span className="text-amber-700 font-semibold">
                  Upcoming/Pending: {totalImportPending.toLocaleString()} EGP
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">STUDENT ID</th>
                    <th className="px-3 py-2.5">NAME</th>
                    <th className="px-3 py-2.5">LEVEL</th>
                    <th className="px-3 py-2.5">CLASS (AUTO)</th>
                    <th className="px-3 py-2.5">DATE OF BIRTH</th>
                    <th className="px-3 py-2.5">TELEPHONE</th>
                    <th className="px-3 py-2.5">START DATE</th>
                    <th className="px-3 py-2.5">AGE</th>
                    {ACADEMIC_MONTHS_MAP.map((m) => (
                      <th key={m.key} className="px-2.5 py-2.5 text-center font-mono">
                        {m.label}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-bold text-slate-800">Total (EGP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-purple-700">
                        {row.studentId || <span className="text-slate-400 font-normal italic">Auto-generate</span>}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">{row.name}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {row.level}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.className ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {row.className.split('|')[0].trim()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Default class</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{row.birthDate || '—'}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{row.phone}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{row.startDate}</td>
                      <td className="px-3 py-2 text-slate-600 text-center">{row.age ? `${row.age} years` : '—'}</td>

                      {/* Month badges */}
                      {row.months.map((m) => (
                        <td key={m.key} className="px-2 py-2 text-center">
                          {m.isPaid ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono"
                              title={`${m.fullName}: ${m.amount} EGP PAID`}
                            >
                              {m.amount}
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400 font-mono"
                              title={`${m.fullName}: Pending`}
                            >
                              —
                            </span>
                          )}
                        </td>
                      ))}

                      <td className="px-3 py-2 text-right font-bold font-mono text-emerald-800">
                        {row.computedTotalPaid} EGP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setParsedRows([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Clear Data
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing Batch...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Import {parsedRows.length} Student(s) and Assign to Classes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
