import React, { useState } from 'react';
import {
  Headphones,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Modal } from '../../common/Modal';

interface SecretariatSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretariatSupportModal: React.FC<SecretariatSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [supportType, setSupportType] = useState('Dúvida sobre matrícula');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const WHATSAPP_NUMBER = '5511972499370';

  const handleOpenWhatsApp = (customText?: string) => {
    const textToSend =
      customText ||
      `Olá! Estou usando a plataforma Think Green e preciso de suporte com a Secretaria.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMsg = `*Suporte Think Green - Secretaria*\n\n*Tipo de Solicitação:* ${supportType}\n*Mensagem:* ${message}`;
    handleOpenWhatsApp(formattedMsg);

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Suporte da Plataforma Think Green"
      subtitle="Atendimento técnico e operacional via WhatsApp (11) 97249-9370"
    >
      <div className="space-y-5 text-xs">
        {sentSuccess ? (
          <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Redirecionando para o WhatsApp...</h4>
            <p className="text-xs text-slate-600">
              Sua solicitação foi preparada e enviada diretamente para o número <strong>(11) 97249-9370</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Card */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  'Olá! Preciso de suporte com a Secretaria da Think Green.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/80 rounded-2xl border border-emerald-200/80 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#075e38] text-white flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">WhatsApp Suporte</p>
                    <p className="text-xs text-emerald-800 font-mono font-bold">(11) 97249-9370</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Email Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Email da Equipe</p>
                  <p className="text-xs text-slate-500">suporte@thinkgreen.org</p>
                </div>
              </div>
            </div>

            {/* Support Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Solicitação</label>
                <select
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs"
                >
                  <option value="Dúvida sobre matrícula">Dúvida sobre matrícula / Alunos</option>
                  <option value="Erro no cadastro ou validação">Erro no cadastro ou validação de RG/CPF</option>
                  <option value="Problema com turmas ou horários">Problema com turmas ou horários</option>
                  <option value="Emissão de documentos">Emissão de documentos / Declarações</option>
                  <option value="Outro assunto">Outro assunto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descreva o que você precisa</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique o que ocorreu ou qual funcionalidade precisa de assistência..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Atendimento das 08h às 21h</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar pelo WhatsApp
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};
