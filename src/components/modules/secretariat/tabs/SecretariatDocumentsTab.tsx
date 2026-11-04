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
        return 'RG / Documento Oficial';
      case 'REGISTRATION_FORM':
        return 'Ficha de Matrícula Assinada';
      case 'PAYMENT_PROOF':
        return 'Comprovante / Recibo';
      case 'MEDICAL':
        return 'Atestado Médico';
      default:
        return 'Outro Arquivo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Secretaria • Prontuário Digital
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Documentos & Prontuários dos Alunos
          </h2>
          <p className="text-xs text-slate-500">
            Armazenamento e auditoria de certidões, termos de compromisso, autorizações e fichas de matrícula físicas.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" /> Anexar Documento ao Aluno
        </button>
      </div>

      {/* Overview Metric Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Total de Documentos</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{allDocumentsWithStudent.length}</p>
          <span className="text-[10px] text-slate-500">Arquivos indexados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Documentos Oficiais (RG/ID)</span>
          <p className="text-xl font-bold font-mono text-purple-700 mt-1">
            {allDocumentsWithStudent.filter((d) => d.type === 'ID_CARD').length}
          </p>
          <span className="text-[10px] text-slate-500">Identificação confirmada</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Fichas de Matrícula</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {allDocumentsWithStudent.filter((d) => d.type === 'REGISTRATION_FORM').length}
          </p>
          <span className="text-[10px] text-slate-500">Contratos assinados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block">Alunos com Prontuário</span>
          <p className="text-xl font-bold font-mono text-sky-700 mt-1">
            {state.students.filter((s) => s.documents.length > 0).length} / {state.students.length}
          </p>
          <span className="text-[10px] text-slate-500">Com documentação em dia</span>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Arquivos Arquivados ({filteredDocs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Listagem consolidada de anexos com data de envio e operador
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documento ou aluno..."
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
              <option value="ALL">Todos os Tipos</option>
              <option value="ID_CARD">RG / Documento Oficial</option>
              <option value="REGISTRATION_FORM">Ficha de Matrícula</option>
              <option value="PAYMENT_PROOF">Comprovante de Pagamento</option>
              <option value="MEDICAL">Atestado Médico</option>
              <option value="OTHER">Outros</option>
            </select>

            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="ALL">Todos os Alunos</option>
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
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Aluno Vinculado</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Data de Upload</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum documento encontrado com os filtros informados.
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
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteStudentDocument(doc.studentId, doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Documento"
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

      {/* Modal Preview Documento */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.doc.title}
          subtitle={`Aluno: ${previewDoc.studentName} • Tipo: ${getDocTypeLabel(previewDoc.doc.type)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Data de Envio:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.uploadedAt}</p>
                </div>
                <div>
                  <span className="text-slate-400">Enviado por:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.uploadedBy}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tamanho do Arquivo:</span>
                  <p className="font-bold text-slate-900">{previewDoc.doc.size || '1.0 MB'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status no Prontuário:</span>
                  <p className="font-bold text-emerald-700">Autenticado & Arquivado</p>
                </div>
              </div>
            </div>

            <div className="p-8 text-center bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <FileText className="w-10 h-10 text-purple-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">{previewDoc.doc.title}</p>
              <p className="text-[11px] text-slate-500">
                Visualização do documento em alta resolução arquivado no servidor institucional.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Upload de Documento */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Anexar Documento ao Prontuário do Aluno"
          subtitle="Selecione o estudante e informe o tipo e título do documento"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Selecione o Aluno *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Título do Documento *</label>
              <input
                type="text"
                required
                placeholder="Ex: Cópia do RG / Certidão de Nascimento"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="ID_CARD">RG / Documento Oficial</option>
                  <option value="REGISTRATION_FORM">Ficha de Matrícula Assinada</option>
                  <option value="PAYMENT_PROOF">Comprovante de Pagamento</option>
                  <option value="MEDICAL">Atestado Médico</option>
                  <option value="OTHER">Outros Anexos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tamanho Estimado</label>
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
              <p className="font-bold text-slate-800 text-xs">Arraste arquivos PDF, JPG ou PNG aqui</p>
              <p className="text-[10px] text-slate-400">Até 15MB por arquivo indexado</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Anexar ao Prontuário
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
