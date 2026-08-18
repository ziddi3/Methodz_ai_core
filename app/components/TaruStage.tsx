'use client';

import React from 'react';

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

export function TaruStage({ emotion, glow, speaking }: TaruStageProps) {
  const intensity = Math.min(1, Math.max(0.25, glow));
  const tailClass =
    emotion === 'tail_flick'
      ? 'tail-flick'
      : emotion === 'talk' || speaking
        ? 'tail-sway'
        : 'tail-idle';

  return (
    <div className="taru-stage" style={{ ['--glow' as string]: String(intensity) }}>
      <div className="void" />
      <div className={`tesseract ${speaking ? 'pulse' : ''}`}>
        <div className="cube face-a" />
        <div className="cube face-b" />
        <div className="cube face-c" />
      </div>
      <div className={`character ${emotion}`}>
        <div className="ears">
          <span className="ear left" />
          <span className="ear right" />
        </div>
        <div className="head">
          <div className="eyes">
            <span />
            <span />
          </div>
          <div className={`mouth ${emotion === 'smirk' ? 'smirk' : speaking ? 'talk' : ''}`} />
        </div>
        <div className="hoodie">
          <span className="label">Methodz TECH</span>
        </div>
        <div className={`tail ${tailClass}`} />
      </div>
      <div className="caption">Taru · Tartus seat · agent:tartus</div>

      <style jsx>{`
        .taru-stage {
          position: relative;
          width: 100%;
          min-height: 320px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(236, 72, 153, 0.35);
          background: radial-gradient(circle at 50% 30%, rgba(34, 211, 238, 0.12), transparent 45%),
            radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.2), transparent 40%),
            #05050f;
        }
        .void {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.15;
        }
        .tesseract {
          position: absolute;
          left: 50%;
          bottom: 36px;
          width: 140px;
          height: 140px;
          transform: translateX(-50%) rotateX(60deg) rotateZ(45deg);
          transform-style: preserve-3d;
          filter: drop-shadow(0 0 calc(18px * var(--glow)) rgba(34, 211, 238, 0.7));
        }
        .tesseract.pulse {
          animation: pulse 1.4s ease-in-out infinite;
        }
        .cube {
          position: absolute;
          inset: 10px;
          border: 2px solid rgba(34, 211, 238, 0.85);
          box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.35);
        }
        .face-b {
          transform: scale(0.72) translateZ(20px);
          border-color: rgba(236, 72, 153, 0.8);
        }
        .face-c {
          transform: scale(0.48);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .character {
          position: absolute;
          left: 50%;
          bottom: 110px;
          width: 120px;
          height: 160px;
          transform: translateX(-50%);
          z-index: 2;
        }
        .ears {
          display: flex;
          justify-content: space-between;
          padding: 0 18px;
        }
        .ear {
          width: 22px;
          height: 28px;
          background: linear-gradient(180deg, #1f1228, #f9a8d4);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        .head {
          margin: 0 auto;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(160deg, #2a1a3a, #111);
          border: 2px solid rgba(236, 72, 153, 0.5);
          position: relative;
        }
        .eyes {
          display: flex;
          justify-content: space-between;
          padding: 28px 16px 0;
        }
        .eyes span {
          width: 10px;
          height: 14px;
          border-radius: 50%;
          background: #f472b6;
          box-shadow: 0 0 10px #f472b6;
        }
        .mouth {
          width: 16px;
          height: 4px;
          margin: 10px auto 0;
          border-radius: 4px;
          background: #fbcfe8;
        }
        .mouth.smirk {
          width: 18px;
          transform: rotate(-12deg) translateX(4px);
        }
        .mouth.talk {
          height: 8px;
          border-radius: 8px;
          animation: talk 0.35s infinite alternate;
        }
        .hoodie {
          margin: -8px auto 0;
          width: 90px;
          height: 78px;
          border-radius: 18px 18px 12px 12px;
          background: linear-gradient(180deg, #111827, #000);
          border: 1px solid rgba(34, 211, 238, 0.4);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 10px;
        }
        .label {
          font-size: 8px;
          letter-spacing: 0.08em;
          color: #67e8f9;
          text-transform: uppercase;
        }
        .tail {
          position: absolute;
          right: -10px;
          bottom: 20px;
          width: 70px;
          height: 18px;
          border-radius: 20px;
          background: linear-gradient(90deg, #1e1030, #e879f9);
          transform-origin: left center;
        }
        .tail-idle {
          transform: rotate(-18deg);
        }
        .tail-sway {
          animation: sway 1.2s ease-in-out infinite;
        }
        .tail-flick {
          animation: flick 0.55s ease-in-out 2;
        }
        .caption {
          position: absolute;
          left: 16px;
          bottom: 12px;
          font-size: 11px;
          opacity: 0.65;
          letter-spacing: 0.04em;
        }
        @keyframes sway {
          from {
            transform: rotate(-28deg);
          }
          to {
            transform: rotate(8deg);
          }
        }
        @keyframes flick {
          0% {
            transform: rotate(-20deg);
          }
          40% {
            transform: rotate(35deg);
          }
          100% {
            transform: rotate(-12deg);
          }
        }
        @keyframes talk {
          from {
            height: 4px;
          }
          to {
            height: 10px;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(236, 72, 153, 0.9));
          }
        }
      `}</style>
    </div>
  );
}
