import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  Plus,
  Paperclip,
  Download,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import { Modal } from '../../../common/Modal';
import { Student, StudentDocument } from '../../../../types';

export const SecretariatDocumentsTab: React.FC = () => {
  const { state, addStudentDocument, deleteStudentDocument } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStudent, setFilterStudent] = useState('ALL');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(state.students[0]?.studentId || '');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<StudentDocument['type']>('ID_CARD');
  const [docSize, setDocSize] = useState('1.2 MB');
  const [previewDoc, setPreviewDoc] = useState<{ doc: StudentDocument; studentName: string } | null>(null);

  // Aggregate all documents across all students
  const allDocumentsWithStudent = state.students.flatMap((student) =>
    (student.documents || []).map((doc) => ({
      ...doc,
      studentId: student.studentId,
      studentName: student.name,
      studentPhone: student.phone,
    }))
  );

  const filteredDocs = allDocumentsWithStudent.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesStudent = filterStudent === 'ALL' || doc.studentId === filterStudent;

    return matchesSearch && matchesType && matchesStudent;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !docTitle) return;

    addStudentDocument(selectedStudentId, {
      title: docTitle,
      type: docType,
      url: `https://thinkgreen.org/docs/${selectedStudentId}_${Date.now()}.pdf`,
      size: docSize,
    });

    setIsUploadModalOpen(false);
    setDocTitle('');
    setDocType('ID_CARD');
  };

  const getDocTypeLabel = (type: StudentDocument['type']) => {
    switch (type) {
      case 'ID_CARD':
        return 'ID / Official Document';
      case 'REGISTRATION_FORM':
        return 'Signed Enrollment Form';
      case 'PAYMENT_PROOF':
        return 'Payment Proof / Receipt';
      case 'MEDICAL':
        return 'Medical Certificate';
      default:
        return 'Other File';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Registrar's Office • Digital Records
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Student Documents & Records
          </h2>
          <p className="text-xs text-slate-500">
            Storage and auditing of certificates, commitment terms, authorizations, and physical enrollment forms.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" /> Attach Document to Student
        </button>
      </div>

      {/* Overview Metric Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Total Documents</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{allDocumentsWithStudent.length}</p>
          <span className="text-[10px] text-slate-500">Indexed files</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Official Documents (ID)</span>
          <p className="text-xl font-bold font-mono text-purple-700 mt-1">
            {allDocumentsWithStudent.filter((d) => d.type === 'ID_CARD').length}
          </p>
          <span className="text-[10px] text-slate-500">Identity confirmed</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Enrollment Forms</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {allDocumentsWithStudent.filter((d) => d.type === 'REGISTRATION_FORM').length}
          </p>
          <span className="text-[10px] text-slate-500">Signed contracts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Students with Records</span>
          <p className="text-xl font-bold font-mono text-sky-700 mt-1">
            {state.students.filter((s) => s.documents.length > 0).length} / {state.students.length}
          </p>
          <span className="text-[10px] text-slate-500">With documentation up to date</span>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Archived Files ({filteredDocs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Consolidated list of attachments with upload date and operator
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search document or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl w-48 sm:w-56"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">All Types</option>
              <option value="ID_CARD">ID / Official Document</option>
              <option value="REGISTRATION_FORM">Enrollment Form</option>
              <option value="PAYMENT_PROOF">Payment Proof</option>
              <option value="MEDICAL">Medical Certificate</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">All Students</option>
              {state.students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentId} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Linked Student</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No documents found with the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-bold text-slate-900">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        {getDocTypeLabel(doc.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mr-1.5 border border-purple-200">
                          {doc.studentId}
                        </span>
                        <span className="font-bold text-slate-800">{doc.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {doc.size || '1.0 MB'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {doc.uploadedAt}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDoc({ doc, studentName: doc.studentName })}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteStudentDocument(doc.studentId, doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.doc.title}
          subtitle={`Student: ${previewDoc.studentName} • Type: ${getDocTypeLabel(previewDoc.doc.type)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Upload Date:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.uploadedAt}</p>
                </div>
                <div>
                  <span className="text-slate-400">Uploaded by:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.uploadedBy}</p>
                </div>
                <div>
                  <span className="text-slate-400">File Size:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.size || '1.0 MB'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Record Status:</span>
                  <p className="font-bold text-emerald-700">Authenticated & Archived</p>
                </div>
              </div>
            </div>

            <div className="p-8 text-center bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <FileText className="w-10 h-10 text-purple-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">{previewDoc.doc.title}</p>
              <p className="text-[11px] text-slate-500">
                High-resolution preview of the document archived on the institutional server.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Upload Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Attach Document to Student Record"
          subtitle="Select the student and enter the document type and title"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                required
              >
                {state.students.map((stu) => (
                  <option key={stu.studentId} value={stu.studentId}>
                    {stu.studentId} — {stu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="Ex: Copy of ID / Birth Certificate"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="ID_CARD">ID / Official Document</option>
                  <option value="REGISTRATION_FORM">Signed Enrollment Form</option>
                  <option value="PAYMENT_PROOF">Payment Proof</option>
                  <option value="MEDICAL">Medical Certificate</option>
                  <option value="OTHER">Other Attachments</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Size</label>
                <input
                  type="text"
                  value={docSize}
                  onChange={(e) => setDocSize(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Fake drag and drop zone */}
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-1 bg-slate-50">
              <Upload className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">Drag PDF, JPG, or PNG files here</p>
              <p className="text-[10px] text-slate-400">Up to 15MB per indexed file</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Attach to Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
