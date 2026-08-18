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

  const mouthClass =
    emotion === 'smirk' ? 'smirk' : speaking || emotion === 'talk' ? 'talk' : '';

  return (
    <div className="taru-stage" style={{ ['--glow' as string]: String(intensity) }}>
      <div className="void" />

      {/* Tartus seat */}
      <div className={`tesseract ${speaking ? 'pulse' : ''}`} aria-hidden>
        <div className="cube face-a" />
        <div className="cube face-b" />
        <div className="cube face-c" />
      </div>

      {/* Catboy silhouette — seated on tesseract, no horizontal body bar */}
      <div className={`character ${emotion}`} aria-label="Taru">
        <div className={`tail ${tailClass}`} />
        <div className="torso">
          <div className="hoodie">
            <span className="label">Methodz TECH</span>
          </div>
        </div>
        <div className="head-block">
          <div className="ear left" />
          <div className="ear right" />
          <div className="head">
            <div className="bangs" />
            <div className="eyes">
              <span className={emotion === 'think' ? 'half' : ''} />
              <span className={emotion === 'think' ? 'half' : ''} />
            </div>
            <div className={`mouth ${mouthClass}`} />
          </div>
        </div>
      </div>

      <div className="caption">Taru · Tartus seat · agent:tartus</div>
      <div className="note">Portrait stage v2 · anime plate coming next</div>

      <style jsx>{`
        .taru-stage {
          position: relative;
          width: 100%;
          min-height: 360px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(236, 72, 153, 0.35);
          background:
            radial-gradient(circle at 50% 20%, rgba(34, 211, 238, 0.14), transparent 42%),
            radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.22), transparent 45%),
            #05050f;
        }
        .void {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.12;
          pointer-events: none;
        }

        .tesseract {
          position: absolute;
          left: 50%;
          bottom: 28px;
          width: 150px;
          height: 150px;
          transform: translateX(-50%) rotateX(58deg) rotateZ(45deg);
          transform-style: preserve-3d;
          filter: drop-shadow(0 0 calc(20px * var(--glow)) rgba(34, 211, 238, 0.75));
        }
        .tesseract.pulse {
          animation: pulse 1.4s ease-in-out infinite;
        }
        .cube {
          position: absolute;
          inset: 12px;
          border: 2px solid rgba(34, 211, 238, 0.9);
          box-shadow: inset 0 0 22px rgba(168, 85, 247, 0.4);
        }
        .face-b {
          transform: scale(0.72) translateZ(18px);
          border-color: rgba(236, 72, 153, 0.85);
        }
        .face-c {
          transform: scale(0.46);
          border-color: rgba(255, 255, 255, 0.55);
        }

        .character {
          position: absolute;
          left: 50%;
          bottom: 95px;
          width: 140px;
          height: 200px;
          transform: translateX(-50%);
          z-index: 3;
        }

        .tail {
          position: absolute;
          right: -28px;
          top: 88px;
          width: 78px;
          height: 16px;
          border-radius: 999px;
          background: linear-gradient(90deg, #1a0f28 0%, #c026d3 55%, #f9a8d4 100%);
          transform-origin: 8px 50%;
          z-index: 0;
          box-shadow: 0 0 12px rgba(236, 72, 153, 0.45);
        }
        .tail-idle {
          transform: rotate(-22deg);
        }
        .tail-sway {
          animation: sway 1.15s ease-in-out infinite;
        }
        .tail-flick {
          animation: flick 0.55s ease-in-out 2;
        }

        .torso {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          z-index: 1;
        }
        .hoodie {
          width: 92px;
          height: 100px;
          margin: 0 auto;
          border-radius: 28px 28px 18px 18px;
          background: linear-gradient(165deg, #1e293b 0%, #0b1220 55%, #020617 100%);
          border: 1.5px solid rgba(34, 211, 238, 0.45);
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.45),
            inset 0 -20px 30px rgba(34, 211, 238, 0.06);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 14px;
          position: relative;
        }
        .hoodie::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 18px;
          border-radius: 0 0 12px 12px;
          border: 1.5px solid rgba(34, 211, 238, 0.35);
          border-top: none;
          opacity: 0.8;
        }
        .label {
          font-size: 7px;
          letter-spacing: 0.12em;
          color: #67e8f9;
          text-transform: uppercase;
          font-weight: 600;
        }

        .head-block {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 88px;
          z-index: 2;
        }
        .ear {
          position: absolute;
          top: 2px;
          width: 24px;
          height: 32px;
          background: linear-gradient(180deg, #2a1538, #f472b6);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          z-index: 0;
        }
        .ear.left {
          left: 6px;
          transform: rotate(-8deg);
        }
        .ear.right {
          right: 6px;
          transform: rotate(8deg);
        }
        .ear::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 4px;
          transform: translateX(-50%);
          width: 10px;
          height: 14px;
          background: #fbcfe8;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          opacity: 0.85;
        }

        .head {
          position: relative;
          margin: 18px auto 0;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(160deg, #3b1d4e 0%, #1a1025 45%, #0c0a12 100%);
          border: 2px solid rgba(244, 114, 182, 0.55);
          box-shadow: 0 0 18px rgba(236, 72, 153, 0.25);
          z-index: 1;
          overflow: hidden;
        }
        .bangs {
          position: absolute;
          top: -2px;
          left: 8px;
          right: 8px;
          height: 22px;
          background: linear-gradient(180deg, #1e1030, transparent);
          border-radius: 0 0 40% 40%;
          opacity: 0.9;
        }
        .eyes {
          display: flex;
          justify-content: space-between;
          padding: 28px 14px 0;
        }
        .eyes span {
          width: 11px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fce7f3, #ec4899 55%, #9d174d);
          box-shadow: 0 0 10px #f472b6;
        }
        .eyes span.half {
          height: 8px;
          margin-top: 4px;
          border-radius: 8px 8px 4px 4px;
        }
        .mouth {
          width: 14px;
          height: 3px;
          margin: 8px auto 0;
          border-radius: 4px;
          background: #fbcfe8;
        }
        .mouth.smirk {
          width: 16px;
          height: 3px;
          transform: rotate(-14deg) translateX(3px);
          border-radius: 4px;
        }
        .mouth.talk {
          width: 12px;
          height: 8px;
          border-radius: 6px;
          animation: talk 0.32s infinite alternate;
        }

        .caption {
          position: absolute;
          left: 16px;
          bottom: 12px;
          font-size: 11px;
          opacity: 0.65;
          letter-spacing: 0.04em;
        }
        .note {
          position: absolute;
          right: 16px;
          bottom: 12px;
          font-size: 10px;
          opacity: 0.4;
        }

        @keyframes sway {
          from {
            transform: rotate(-28deg);
          }
          to {
            transform: rotate(10deg);
          }
        }
        @keyframes flick {
          0% {
            transform: rotate(-20deg);
          }
          40% {
            transform: rotate(38deg);
          }
          100% {
            transform: rotate(-12deg);
          }
        }
        @keyframes talk {
          from {
            height: 3px;
          }
          to {
            height: 9px;
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
