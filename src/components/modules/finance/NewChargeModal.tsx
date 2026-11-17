import React, { useState } from 'react';
import { X, PlusCircle, User, BookOpen, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';

interface NewChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChargeModal: React.FC<NewChargeModalProps> = ({ isOpen, onClose }) => {
  const { state, addEnrollmentToStudent } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [installmentsCount, setInstallmentsCount] = useState(4);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const selectedCourse = state.courses.find((c) => c.id === selectedCourseId);
  const totalAmount = selectedCourse ? selectedCourse.price : 1920;
  const installmentAmount = Math.round(totalAmount / installmentsCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !selectedClassId) return;

    try {
      addEnrollmentToStudent(selectedStudentId, selectedCourseId, selectedClassId, installmentsCount);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Charge & Installment Plan</h2>
              <p className="text-xs text-slate-400">
                Issue an installment plan for an enrolled student
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage ? (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Charge and Installment Plan Created!</h3>
            <p className="text-xs text-emerald-800">
              The installments were successfully registered in the financial system.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Student Select */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student (Student ID)</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
              >
                <option value="">-- Select Student --</option>
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            {/* Course & Class Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatCurrency(c.price, 'EGP')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  {state.classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name} ({cl.schedule})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Installments count */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Installments</label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              >
                <option value={1}>Paid in full (1 installment)</option>
                <option value={2}>2 Installments</option>
                <option value={3}>3 Installments</option>
                <option value={4}>4 Monthly Installments</option>
                <option value={6}>6 Installments</option>
              </select>
            </div>

            {/* Financial Summary Preview */}
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Total Course Amount:</span>
                <strong className="text-slate-900 font-mono">
                  {formatCurrency(totalAmount, 'EGP')}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Selected Plan:</span>
                <strong className="text-emerald-900 font-mono">
                  {installmentsCount}x de {formatCurrency(installmentAmount, 'EGP')}
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-200/60">
                <span>Initial due date:</span>
                <span>Day 05 of next month</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStudentId}
                className="px-5 py-2.5 bg-[#075e38] hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Generate Financial Installment Plan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
