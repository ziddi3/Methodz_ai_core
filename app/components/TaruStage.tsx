'use client';

import React, { useEffect, useState } from 'react';

export type StageEmotion =
  | 'idle'
  | 'talk'
  | 'smirk'
  | 'tail_flick'
  | 'listen'
  | 'think';

interface TaruStageProps {
  emotion: StageEmotion;
  glow: number;
  speaking?: boolean;
}

const BRAND_ASSET_ENDPOINT =
  'https://image.methodz.ca/api/v1/assets/agents/taru-portrait.json';

const FALLBACK_RAW =
  'https://image.methodz.ca/logos/agents/taru-portrait.jpg';

const FALLBACK_CDN =
  'https://cdn.jsdelivr.net/gh/ziddi3/methodz-brand-assets@main/logos/agents/taru-portrait.jpg';

export function TaruStage({ emotion, glow, speaking }: TaruStageProps) {
  const intensity = Math.min(1, Math.max(0.3, glow));
  const [src, setSrc] = useState<string>(FALLBACK_CDN);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(BRAND_ASSET_ENDPOINT, { cache: 'force-cache' });
        if (!res.ok) return;
        const meta = await res.json();
        const url = meta.cdn_url || meta.raw_url || FALLBACK_CDN;
        if (!cancelled) setSrc(url);
      } catch {
        /* keep CDN fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pose =
    emotion === 'smirk'
      ? 'pose-smirk'
      : emotion === 'talk' || speaking
        ? 'pose-talk'
        : emotion === 'tail_flick'
          ? 'pose-flick'
          : emotion === 'listen'
            ? 'pose-listen'
            : emotion === 'think'
              ? 'pose-think'
              : 'pose-idle';

  return (
    <div
      className="taru-stage"
      style={{ ['--glow' as string]: String(intensity) }}
      data-emotion={emotion}
    >
      <div className="void" />
      <div className="nebula" />

      <div className="scene">
        {/* CSS 3D Tartus seat */}
        <div className={`tartus ${speaking ? 'pulse' : ''}`} aria-hidden>
          <div className="face f1" />
          <div className="face f2" />
          <div className="face f3" />
          <div className="face f4" />
          <div className="face f5" />
          <div className="face f6" />
          <div className="inner" />
        </div>

        {/* Billboard plate — Brand Assets portrait */}
        <div className={`billboard ${pose} ${speaking ? 'speaking' : ''}`}>
          {!failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="plate"
              src={src}
              alt="Taru — Methodz Tartus catboy"
              draggable={false}
              onError={() => {
                if (src !== FALLBACK_RAW) setSrc(FALLBACK_RAW);
                else setFailed(true);
              }}
            />
          ) : (
            <div className="plate-fallback">Taru plate pending in Brand Assets</div>
          )}
          <div className="glow-ring" />
        </div>
      </div>

      <div className="caption">
        Taru · 3D billboard stage · agent:tartus · Brand Assets
      </div>

      <style jsx>{`
        .taru-stage {
          position: relative;
          width: 100%;
          min-height: 440px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(236, 72, 153, 0.35);
          background: #03040c;
          perspective: 900px;
        }
        .void {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: 0.1;
          pointer-events: none;
          animation: drift 40s linear infinite;
        }
        .nebula {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(circle at 30% 20%, rgba(34, 211, 238, 0.18), transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.22), transparent 42%),
            radial-gradient(circle at 50% 90%, rgba(236, 72, 153, 0.12), transparent 35%);
          pointer-events: none;
          animation: breathe 6s ease-in-out infinite;
        }

        .scene {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          transform-style: preserve-3d;
        }

        .tartus {
          position: absolute;
          bottom: 8%;
          width: 120px;
          height: 120px;
          transform-style: preserve-3d;
          transform: rotateX(62deg) rotateZ(45deg);
          animation: spin-slow 18s linear infinite;
          filter: drop-shadow(0 0 calc(16px * var(--glow)) rgba(34, 211, 238, 0.7));
          z-index: 1;
        }
        .tartus.pulse {
          animation: spin-slow 18s linear infinite, pulse-cube 1.2s ease-in-out infinite;
        }
        .face {
          position: absolute;
          inset: 0;
          border: 1.5px solid rgba(34, 211, 238, 0.85);
          background: rgba(6, 20, 40, 0.35);
          box-shadow: inset 0 0 24px rgba(168, 85, 247, 0.25);
        }
        .f1 { transform: translateZ(60px); }
        .f2 { transform: rotateY(180deg) translateZ(60px); border-color: rgba(236, 72, 153, 0.7); }
        .f3 { transform: rotateY(90deg) translateZ(60px); }
        .f4 { transform: rotateY(-90deg) translateZ(60px); }
        .f5 { transform: rotateX(90deg) translateZ(60px); border-color: rgba(255, 255, 255, 0.35); }
        .f6 { transform: rotateX(-90deg) translateZ(60px); }
        .inner {
          position: absolute;
          inset: 22px;
          border: 1px solid rgba(236, 72, 153, 0.55);
          transform: translateZ(0);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.35);
        }

        .billboard {
          position: relative;
          width: min(300px, 82%);
          z-index: 4;
          transform-style: preserve-3d;
          transform: translateY(-18px) rotateY(-6deg) rotateX(4deg);
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.35s ease;
          filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55))
            drop-shadow(0 0 calc(22px * var(--glow)) rgba(236, 72, 153, 0.45));
        }
        .billboard.speaking {
          filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55))
            drop-shadow(0 0 calc(34px * var(--glow)) rgba(34, 211, 238, 0.65));
        }

        .pose-idle {
          animation: float 4.5s ease-in-out infinite;
        }
        .pose-talk {
          transform: translateY(-18px) rotateY(4deg) rotateX(2deg) scale(1.02);
          animation: talk-bob 0.45s ease-in-out infinite alternate;
        }
        .pose-smirk {
          transform: translateY(-22px) rotateY(-12deg) rotateX(6deg) scale(1.03);
        }
        .pose-flick {
          animation: flick-tilt 0.6s ease-in-out 2;
        }
        .pose-listen {
          transform: translateY(-16px) rotateY(10deg) rotateX(3deg);
        }
        .pose-think {
          transform: translateY(-20px) rotateY(-8deg) rotateX(8deg);
          filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55))
            drop-shadow(0 0 calc(18px * var(--glow)) rgba(168, 85, 247, 0.55));
        }

        .plate {
          display: block;
          width: 100%;
          height: auto;
          max-height: 340px;
          object-fit: contain;
          object-position: center center;
          border-radius: 16px;
          border: 1px solid rgba(244, 114, 182, 0.4);
          background: linear-gradient(160deg, #0a0a14, #05050c);
          user-select: none;
        }
        .plate-fallback {
          min-height: 260px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          border: 1px dashed rgba(244, 114, 182, 0.4);
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          padding: 16px;
          text-align: center;
        }
        .glow-ring {
          position: absolute;
          inset: -3px;
          border-radius: 18px;
          pointer-events: none;
          box-shadow:
            0 0 0 1px rgba(34, 211, 238, 0.25),
            0 0 calc(20px * var(--glow)) rgba(236, 72, 153, 0.2);
        }

        .caption {
          position: absolute;
          left: 16px;
          bottom: 12px;
          font-size: 11px;
          opacity: 0.65;
          letter-spacing: 0.04em;
          z-index: 6;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(-18px) rotateY(-6deg) rotateX(4deg);
          }
          50% {
            transform: translateY(-28px) rotateY(-4deg) rotateX(5deg);
          }
        }
        @keyframes talk-bob {
          from {
            transform: translateY(-16px) rotateY(4deg) rotateX(2deg) scale(1.02);
          }
          to {
            transform: translateY(-24px) rotateY(6deg) rotateX(3deg) scale(1.035);
          }
        }
        @keyframes flick-tilt {
          0% {
            transform: translateY(-18px) rotateY(-6deg) rotateX(4deg);
          }
          35% {
            transform: translateY(-26px) rotateY(14deg) rotateX(2deg) scale(1.04);
          }
          100% {
            transform: translateY(-18px) rotateY(-6deg) rotateX(4deg);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotateX(62deg) rotateZ(45deg);
          }
          to {
            transform: rotateX(62deg) rotateZ(405deg);
          }
        }
        @keyframes pulse-cube {
          0%,
          100% {
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.55));
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(236, 72, 153, 0.9));
          }
        }
        @keyframes breathe {
          0%,
          100% {
            opacity: 0.85;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }
        @keyframes drift {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 26px 26px;
          }
        }
      `}</style>
    </div>
  );
}
