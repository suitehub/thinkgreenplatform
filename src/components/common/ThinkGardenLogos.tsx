import React, { useState } from 'react';

/**
 * Think Green Platform Logo
 * Supports TGCCLOGO.png with smooth fallback to crystal origami polygon
 */
export const ThinkGardenLogo: React.FC<{ className?: string; imgClassName?: string }> = ({
  className = 'h-10 sm:h-11',
  imgClassName = 'h-9 sm:h-10 w-auto object-contain',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {!imgError ? (
        <img
          src="/TGCCLOGO.png"
          alt="Think Green Platform"
          className={imgClassName}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Geometric Origami Diamond Icon Fallback */
        <svg
          viewBox="0 0 100 100"
          className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="50,6 90,30 50,54" fill="#E8175D" />
          <polygon points="50,6 10,30 50,54" fill="#8B1E6D" />
          <polygon points="10,30 50,54 10,72" fill="#FF5722" />
          <polygon points="90,30 50,54 90,72" fill="#FF9800" />
          <polygon points="10,72 50,54 50,94" fill="#FFC107" />
          <polygon points="90,72 50,54 50,94" fill="#8BC34A" />
          <polygon points="50,54 90,72 50,94" fill="#00A859" />
          <polygon points="50,22 72,48 50,72 28,48" fill="#FFFFFF" fillOpacity="0.25" />
        </svg>
      )}
      <div className="flex flex-col">
        <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none">
          THINK <span className="text-[#075e38]">GREEN</span>
        </span>
        <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-600 tracking-[0.34em] mt-0.5 leading-none">
          PLATFORM
        </span>
      </div>
    </div>
  );
};

/**
 * Soccer Ball Badge
 * Rendered inside a circular white disc with the custom bola.png asset, matching the USA flag badge
 */
export const SoccerBallBadge: React.FC<{ className?: string; imgClassName?: string }> = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
  imgClassName = 'w-full h-full object-contain',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center ${className} flex-shrink-0`}>
      {/* Outer halo / ring - matching USAFlagBadge */}
      <div className="w-full h-full rounded-full bg-white shadow-md flex items-center justify-center p-1 border-2 border-white/80 overflow-hidden">
        {!imgError ? (
          <img
            src="/bola.png"
            alt="Soccer Ball"
            className={imgClassName}
            onError={() => setImgError(true)}
          />
        ) : (
          /* Soccer Ball SVG Fallback */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="soccerBallSphere">
                <circle cx="50" cy="50" r="46" />
              </clipPath>
              <radialGradient id="soccerSphereShade" cx="36%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="75%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </radialGradient>
            </defs>

            {/* Sphere Base with outline */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="url(#soccerSphereShade)"
              stroke="#0f172a"
              strokeWidth="2.8"
            />

            <g clipPath="url(#soccerBallSphere)">
              {/* 1. Center Pentagon (Black) */}
              <polygon
                points="50,35 64.3,45.4 58.8,62.1 41.2,62.1 35.7,45.4"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* 2. Seams radiating from center pentagon to 5 outer nodes */}
              <line x1="50" y1="35" x2="50" y2="22" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="64.3" y1="45.4" x2="76.6" y2="41.4" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="58.8" y1="62.1" x2="66.5" y2="72.7" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="41.2" y1="62.1" x2="33.5" y2="72.7" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="35.7" y1="45.4" x2="23.4" y2="41.4" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />

              {/* 3. Outer Hexagon Seam Lines */}
              <line x1="50" y1="22" x2="39" y2="13" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="50" y1="22" x2="61" y2="13" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="61" y1="13" x2="85" y2="27" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="39" y1="13" x2="15" y2="27" stroke="#0f172a" strokeWidth="2.2" />

              <line x1="76.6" y1="41.4" x2="85" y2="27" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="76.6" y1="41.4" x2="88" y2="54" stroke="#0f172a" strokeWidth="2.2" />

              <line x1="66.5" y1="72.7" x2="88" y2="54" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="66.5" y1="72.7" x2="57" y2="83" stroke="#0f172a" strokeWidth="2.2" />

              <line x1="57" y1="83" x2="43" y2="83" stroke="#0f172a" strokeWidth="2.2" />

              <line x1="33.5" y1="72.7" x2="43" y2="83" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="33.5" y1="72.7" x2="12" y2="54" stroke="#0f172a" strokeWidth="2.2" />

              <line x1="23.4" y1="41.4" x2="12" y2="54" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="23.4" y1="41.4" x2="15" y2="27" stroke="#0f172a" strokeWidth="2.2" />

              {/* 4. Five Outer Edge Patches (Black) */}
              <polygon
                points="50,22 39,13 39,0 61,0 61,13"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <polygon
                points="76.6,41.4 85,27 100,27 100,56 88,54"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <polygon
                points="66.5,72.7 88,54 100,70 76,100 57,83"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <polygon
                points="33.5,72.7 57,83 43,83 24,100 0,70 12,54"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <polygon
                points="23.4,41.4 12,54 0,56 0,27 15,27"
                fill="#111827"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};

/**
 * USA Flag Badge
 * Rendered inside a circular disc with stripes and starred canton
 */
export const USAFlagBadge: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
}) => (
  <div className={`relative flex items-center justify-center ${className} flex-shrink-0`}>
    {/* Outer halo / ring */}
    <div className="w-full h-full rounded-full bg-white shadow-md flex items-center justify-center p-1 border-2 border-white/80 overflow-hidden">
      {/* USA Flag Circle */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full rounded-full shadow-inner"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="usaCircleClip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
          <linearGradient id="flagGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <g clipPath="url(#usaCircleClip)">
          {/* 13 Stripes (Red & White) */}
          <rect x="0" y="0" width="100" height="100" fill="#B22234" />
          <rect x="0" y="7.69" width="100" height="7.69" fill="#FFFFFF" />
          <rect x="0" y="23.07" width="100" height="7.69" fill="#FFFFFF" />
          <rect x="0" y="38.46" width="100" height="7.69" fill="#FFFFFF" />
          <rect x="0" y="53.84" width="100" height="7.69" fill="#FFFFFF" />
          <rect x="0" y="69.23" width="100" height="7.69" fill="#FFFFFF" />
          <rect x="0" y="84.61" width="100" height="7.69" fill="#FFFFFF" />

          {/* Blue Canton */}
          <rect x="0" y="0" width="48" height="53.84" fill="#3C3B6E" />

          {/* Stars Grid */}
          <g fill="#FFFFFF">
            <circle cx="9" cy="9" r="2.2" />
            <circle cx="19" cy="9" r="2.2" />
            <circle cx="29" cy="9" r="2.2" />
            <circle cx="39" cy="9" r="2.2" />

            <circle cx="14" cy="17" r="2.2" />
            <circle cx="24" cy="17" r="2.2" />
            <circle cx="34" cy="17" r="2.2" />

            <circle cx="9" cy="25" r="2.2" />
            <circle cx="19" cy="25" r="2.2" />
            <circle cx="29" cy="25" r="2.2" />
            <circle cx="39" cy="25" r="2.2" />

            <circle cx="14" cy="33" r="2.2" />
            <circle cx="24" cy="33" r="2.2" />
            <circle cx="34" cy="33" r="2.2" />

            <circle cx="9" cy="41" r="2.2" />
            <circle cx="19" cy="41" r="2.2" />
            <circle cx="29" cy="41" r="2.2" />
            <circle cx="39" cy="41" r="2.2" />

            <circle cx="14" cy="48" r="2.2" />
            <circle cx="24" cy="48" r="2.2" />
            <circle cx="34" cy="48" r="2.2" />
          </g>

          {/* Gloss overlay */}
          <rect x="0" y="0" width="100" height="100" fill="url(#flagGloss)" />
          <circle
            cx="50"
            cy="50"
            r="47.5"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.5"
            strokeOpacity="0.2"
          />
        </g>
      </svg>
    </div>
  </div>
);

/**
 * Reading Book Badge for Reading Class
 * Rendered inside a circular disc with subtle blue styling and open book
 */
export const ReadingBookBadge: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
}) => (
  <div className={`relative flex items-center justify-center ${className} flex-shrink-0`}>
    <div className="w-full h-full rounded-full bg-blue-50 border-2 border-blue-200 shadow-md flex items-center justify-center p-1.5 overflow-hidden text-blue-600">
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </div>
  </div>
);

/**
 * Preschool Badge
 * Rendered inside a circular disc with playful sun/rainbow colors
 */
export const PreschoolBadge: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
}) => (
  <div className={`relative flex items-center justify-center ${className} flex-shrink-0`}>
    <div className="w-full h-full rounded-full bg-orange-50 border-2 border-orange-200 shadow-md flex items-center justify-center p-1.5 overflow-hidden text-orange-500">
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    </div>
  </div>
);

/**
 * Women Fitness Badge
 * Rendered inside a circular disc with vibrant pink styling
 */
export const WomenFitBadge: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
}) => (
  <div className={`relative flex items-center justify-center ${className} flex-shrink-0`}>
    <div className="w-full h-full rounded-full bg-pink-50 border-2 border-pink-200 shadow-md flex items-center justify-center p-1.5 overflow-hidden text-pink-500">
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
  </div>
);

/**
 * Sun / Star Watermark for Preschool Card
 */
export const SunWatermark: React.FC<{ className?: string }> = ({
  className = 'w-64 h-64',
}) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="100" cy="100" r="45" stroke="currentColor" strokeWidth="8" />
    <path d="M100 20V40M100 160V180M20 100H40M160 100H180M43.4 43.4L57.5 57.5M142.5 142.5L156.6 156.6M43.4 156.6L57.5 142.5M142.5 57.5L156.6 43.4" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

/**
 * Heart / Energy Watermark for Women Fitness Card
 */
export const FitnessWatermark: React.FC<{ className?: string }> = ({
  className = 'w-64 h-64',
}) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M100 170S30 120 30 70A40 40 0 0 1 100 50A40 40 0 0 1 170 70C170 120 100 170 100 170Z"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Plant / Leaves Watermark for Soccer Card and Avisos Card
 */
export const LeavesWatermark: React.FC<{ className?: string }> = ({
  className = 'w-64 h-64',
}) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M60 165C60 165 75 110 130 90C170 75 185 35 185 35C185 35 150 48 118 75C82 105 68 148 60 165Z"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M75 142C75 142 50 102 68 65C82 38 118 25 118 25C118 25 98 48 94 72C88 98 78 126 75 142Z"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M60 165C72 174 95 180 120 174"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Open Book Watermark for English Card
 */
export const BookWatermark: React.FC<{ className?: string }> = ({
  className = 'w-64 h-64',
}) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M100 152C78 136 42 130 20 142V52C42 40 78 46 100 62C122 46 158 40 180 52V142C158 130 122 136 100 152Z"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="100"
      y1="62"
      x2="100"
      y2="152"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
    />
  </svg>
);

