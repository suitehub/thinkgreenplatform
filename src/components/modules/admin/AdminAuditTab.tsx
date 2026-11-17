import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Shield,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AuditLog } from '../../../types';
import { Modal } from '../../common/Modal';

export const AdminAuditTab: React.FC = () => {
  const { state } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLog | null>(null);

  const logs = state.auditLogs || [];

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      log.entityType.toLowerCase().includes(s) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(s)) ||
      (typeof log.newValue === 'string' && log.newValue.toLowerCase().includes(s));

    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;

    return matchesSearch && matchesModule && matchesRole;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `thinkgreen_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Date/Time', 'User', 'Role', 'Module', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      l.role,
      l.module,
      l.action,
      l.entityType,
      l.entityId,
      `"${(l.details || l.newValue || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `thinkgreen_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'SECRETARIAT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">SECRETARIAT</span>;
      case 'FINANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">FINANCE</span>;
      case 'ACADEMIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">ACADEMIC</span>;
      case 'ACCOUNTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">ACCOUNTING</span>;
      case 'LMS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">LMS</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-950 border border-purple-300">ADMIN</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{mod}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Immutable Audit Trail (Audit Logs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological, immutable record of all sensitive actions performed in Think Green.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Full log download in JSON format"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search operator, action, entity or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Module & Role filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Modules ({logs.length})</option>
            <option value="SECRETARIAT">Secretariat</option>
            <option value="FINANCE">Finance</option>
            <option value="ACADEMIC">Academic</option>
            <option value="ACCOUNTING">Accounting</option>
            <option value="LMS">LMS</option>
            <option value="ADMIN">Administration</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="FINANCE">Finance</option>
            <option value="SECRETARIAT">Secretariat</option>
            <option value="ACCOUNTING">Accounting</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {(searchQuery || moduleFilter !== 'ALL' || roleFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setModuleFilter('ALL');
                setRoleFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action Logged</th>
                <th className="px-4 py-3">Affected Entity</th>
                <th className="px-4 py-3">Details / Payload</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No logs found for the given parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getModuleBadge(log.module)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {log.entityType} <span className="text-[10px] text-slate-400 font-mono">({log.entityId})</span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px] truncate max-w-xs">
                      {typeof log.details === 'string'
                        ? log.details
                        : typeof log.newValue === 'string'
                        ? log.newValue
                        : typeof log.details === 'object' && log.details !== null
                        ? JSON.stringify(log.details)
                        : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLogForDetail(log)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="View full log details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Details */}
      {selectedLogForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLogForDetail(null)}
          title={`Action Details: ${selectedLogForDetail.action}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium">
              <div>
                <span className="text-slate-400 block text-[10px]">Date and Time:</span>
                <span className="font-mono text-slate-900 font-bold">{selectedLogForDetail.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Operator:</span>
                <span className="text-slate-900 font-bold">{selectedLogForDetail.userName} ({selectedLogForDetail.role})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Module:</span>
                <span className="text-slate-900 font-bold">{selectedLogForDetail.module}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Entity:</span>
                <span className="text-slate-900 font-bold">{selectedLogForDetail.entityType} ({selectedLogForDetail.entityId})</span>
              </div>
            </div>

            {selectedLogForDetail.details && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Details:</label>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 break-words">
                  {typeof selectedLogForDetail.details === 'string'
                    ? selectedLogForDetail.details
                    : JSON.stringify(selectedLogForDetail.details, null, 2)}
                </div>
              </div>
            )}

            {selectedLogForDetail.newValue && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Value / Payload:</label>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 break-words max-h-48 overflow-y-auto">
                  {typeof selectedLogForDetail.newValue === 'string'
                    ? selectedLogForDetail.newValue
                    : JSON.stringify(selectedLogForDetail.newValue, null, 2)}
                </div>
              </div>
            )}

            {selectedLogForDetail.previousValue && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Previous Value:</label>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 break-words">
                  {typeof selectedLogForDetail.previousValue === 'string'
                    ? selectedLogForDetail.previousValue
                    : JSON.stringify(selectedLogForDetail.previousValue, null, 2)}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
