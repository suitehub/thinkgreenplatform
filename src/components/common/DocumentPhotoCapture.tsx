import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Eye, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DocumentPhotoCaptureProps {
  value?: string;
  onChange: (photoUrl: string | undefined) => void;
  label?: string;
  helperText?: string;
}

export const DocumentPhotoCapture: React.FC<DocumentPhotoCaptureProps> = ({
  value,
  onChange,
  label = 'Foto do Documento de Identidade (RG / ID)',
  helperText = 'Opcional. Anexe uma foto ou use a câmera do dispositivo. A imagem irá diretamente para a pasta de documentos na ficha do aluno.',
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Start webcam / camera stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta captura direta. Usando seletor de câmera.');
      }

      // Try environment/back camera first, fallback to user/front
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Não foi possível acessar a câmera diretamente. Use o botão abaixo para tirar foto usando o app nativo da câmera.');
    }
  };

  // Take snapshot from active video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        onChange(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error('Error capturing snapshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle file upload (from desktop/mobile gallery or camera picker)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-2 text-xs">
      {/* Label and Subtitle */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700">
          {label} <span className="text-slate-400 font-normal">(Opcional)</span>
        </label>
        {value && (
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Imagem Anexada
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-tight">
        {helperText}
      </p>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* When NO photo is yet attached and camera is NOT active */}
      {!value && !isCameraOpen && (
        <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-2xs">
              <Camera className="w-4 h-4 text-[#075e38]" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">Anexar Foto do RG / Documento</p>
              <p className="text-[10px] text-slate-400">Tire foto com a webcam/celular ou anexe arquivo salvo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Tirar Foto</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Anexar Imagem</span>
            </button>
          </div>
        </div>
      )}

      {/* CAMERA VIEWFINDER MODAL / INLINE VIEW */}
      {isCameraOpen && (
        <div className="p-3.5 bg-slate-900 rounded-xl text-white space-y-3 border border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-xs flex items-center gap-2 text-emerald-400">
              <Camera className="w-4 h-4" /> Enquadre a Identidade / RG
            </span>
            <button
              type="button"
              onClick={stopCamera}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cameraError ? (
            <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-lg text-xs space-y-2">
              <p className="text-amber-200 flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => cameraFallbackInputRef.current?.click()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Abrir Câmera do Sistema / Celular
              </button>
            </div>
          ) : (
            <>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual guideline overlay for ID card */}
                <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-emerald-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="bg-black/70 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    Posicione o documento no quadro
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraFallbackInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs underline cursor-pointer"
                    title="Usar seletor nativo se a imagem estiver escura"
                  >
                    Usar Câmera Nativa
                  </button>

                  <button
                    type="button"
                    disabled={isCapturing}
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isCapturing ? 'Processando...' : 'Capturar Foto do RG'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* When a photo IS attached: Rich preview with actions */}
      {value && !isCameraOpen && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
              <img
                src={value}
                alt="Foto do RG / Documento"
                className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-2xs"
              />
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Eye className="w-4 h-4" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="font-black text-xs text-slate-900 truncate">
                Foto do Documento (ID/RG)
              </p>
              <p className="text-[10px] text-emerald-800 font-medium">
                ✓ Pronto para vincular automaticamente aos arquivos do aluno
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="text-[11px] font-bold text-[#075e38] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> Visualizar em tamanho maior
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={startCamera}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Tirar outra foto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tirar Outra</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Trocar arquivo por outro"
            >
              <Upload className="w-3 h-3" />
              <span>Trocar</span>
            </button>

            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Remover documento"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remover</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {isPreviewOpen && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-black text-slate-900 text-sm">Visualização do Documento (ID / RG)</h4>
                <p className="text-[11px] text-slate-500">Documento que será salvo no prontuário oficial</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={value}
                alt="Documento ampliado"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
