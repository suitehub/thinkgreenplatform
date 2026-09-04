import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textClassName = '',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { icon: 'w-7 h-7', title: 'text-xs', subtitle: 'text-[9px]' },
    md: { icon: 'w-9 h-9', title: 'text-sm font-bold', subtitle: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', title: 'text-base font-bold', subtitle: 'text-xs' },
    xl: { icon: 'w-16 h-16', title: 'text-xl font-extrabold', subtitle: 'text-xs' },
    '2xl': { icon: 'w-24 h-24', title: 'text-2xl font-extrabold', subtitle: 'text-sm' },
  };

  const { icon, title, subtitle } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* TGCC Official Logo Image with vector fallback */}
      <div className={`relative flex-shrink-0 ${icon} drop-shadow-sm flex items-center justify-center`}>
        {!imgError ? (
          <img
            src="/TGCCLOGO.png"
            alt="Think Green Platform"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain"
          >
            <defs>
              <linearGradient id="purpleGrad" x1="50" y1="50" x2="250" y2="450" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="50%" stopColor="#7E22CE" />
                <stop offset="100%" stopColor="#581C87" />
              </linearGradient>
              <linearGradient id="purpleGlow" x1="100" y1="200" x2="250" y2="450" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#6B21A8" />
              </linearGradient>
              <linearGradient id="orangeGrad" x1="240" y1="60" x2="120" y2="300" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="30%" stopColor="#FB923C" />
                <stop offset="70%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="200" y1="50" x2="245" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="darkGreenGrad" x1="255" y1="20" x2="480" y2="460" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#15803D" />
                <stop offset="50%" stopColor="#166534" />
                <stop offset="100%" stopColor="#14532D" />
              </linearGradient>
              <linearGradient id="leafTop" x1="250" y1="30" x2="400" y2="240" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="40%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
              <linearGradient id="leafLeft" x1="255" y1="240" x2="310" y2="460" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="60%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
              <linearGradient id="leafRight" x1="320" y1="260" x2="470" y2="380" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A3E635" />
                <stop offset="50%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
              <filter id="leafShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.35" />
              </filter>
            </defs>

            <g>
              <path d="M 242 16 L 62 250 L 242 470 Z" fill="url(#purpleGrad)" />
              <path d="M 242 16 L 62 250 L 98 250 L 242 74 Z" fill="url(#purpleGlow)" opacity="0.6" />
              <path d="M 92 260 L 242 410 L 242 430 L 92 280 Z" fill="#FFFFFF" opacity="0.95" />
              <path d="M 120 286 L 242 410 L 242 422 L 120 298 Z" fill="#FFFFFF" opacity="0.95" />
              <path d="M 145 285 L 145 375 L 160 360 L 175 375 L 175 315 Z" fill="#FFFFFF" />
              <path
                d="M 242 30 C 235 60, 200 120, 160 160 C 130 190, 130 220, 150 250 C 180 290, 230 310, 242 340 L 242 270 C 220 240, 185 225, 175 195 C 165 165, 195 125, 230 80 L 242 30 Z"
                fill="url(#orangeGrad)"
              />
              <path d="M 242 16 L 210 130 C 220 90, 235 50, 242 16 Z" fill="url(#goldGrad)" />
            </g>

            <g filter="url(#leafShadow)">
              <path d="M 258 16 L 438 250 L 258 470 Z" fill="url(#darkGreenGrad)" />
              <path d="M 258 20 C 310 70, 390 140, 420 220 C 360 215, 290 160, 258 80 Z" fill="url(#leafTop)" />
              <path d="M 265 40 Q 330 130 405 205" stroke="#BBF7D0" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
              <path d="M 258 245 C 290 245, 315 310, 315 385 C 315 440, 290 465, 258 465 C 258 380, 258 300, 258 245 Z" fill="url(#leafLeft)" />
              <path d="M 262 260 Q 288 350 288 440" stroke="#DCFCE7" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
              <path d="M 325 350 C 350 290, 425 285, 435 295 C 435 340, 375 390, 325 350 Z" fill="url(#leafRight)" />
              <path d="M 335 340 Q 380 315 425 305" stroke="#ECFCCB" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            </g>

            <line x1="250" y1="10" x2="250" y2="480" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`text-slate-900 tracking-tight flex items-center gap-1.5 ${title} ${textClassName}`}>
            <span className="text-purple-700 font-black">THINK</span>
            <span className="text-emerald-600 font-black">GREEN</span>
          </span>
          <span className={`font-bold tracking-[0.2em] text-slate-500 uppercase ${subtitle}`}>
            PLATFORM
          </span>
        </div>
      )}
    </div>
  );
};

