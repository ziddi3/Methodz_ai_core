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

/** Canonical registry — upload once, every Methodz site resolves the same plate */
const BRAND_ASSET_ENDPOINT =
  'https://raw.githubusercontent.com/ziddi3/methodz-brand-assets/main/api/v1/assets/agents/taru-portrait.json';

const FALLBACK_RAW =
  'https://raw.githubusercontent.com/ziddi3/methodz-brand-assets/main/logos/agents/taru-portrait.jpg';

const FALLBACK_CDN =
  'https://cdn.jsdelivr.net/gh/ziddi3/methodz-brand-assets@main/logos/agents/taru-portrait.jpg';

export function TaruStage({ emotion, glow, speaking }: TaruStageProps) {
  const intensity = Math.min(1, Math.max(0.25, glow));
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

  return (
    <div className="taru-stage" style={{ ['--glow' as string]: String(intensity) }}>
      <div className="void" />

      <div className={`portrait-wrap ${emotion} ${speaking ? 'speaking' : ''}`}>
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="portrait"
            src={src}
            alt="Taru — Methodz Tartus catboy"
            onError={() => {
              if (src !== FALLBACK_RAW) setSrc(FALLBACK_RAW);
              else setFailed(true);
            }}
          />
        ) : (
          <div className="portrait-fallback">Taru plate pending in Brand Assets</div>
        )}
        <div className={`rim ${speaking ? 'hot' : ''}`} />
      </div>

      <div className="caption">Taru · Tartus seat · agent:tartus · Brand Assets API</div>

      <style jsx>{`
        .taru-stage {
          position: relative;
          width: 100%;
          min-height: 420px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(236, 72, 153, 0.35);
          background:
            radial-gradient(circle at 50% 18%, rgba(34, 211, 238, 0.16), transparent 42%),
            radial-gradient(circle at 78% 78%, rgba(168, 85, 247, 0.22), transparent 48%),
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

        .portrait-wrap {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -52%);
          width: min(320px, 88%);
          z-index: 3;
          filter: drop-shadow(0 0 calc(28px * var(--glow)) rgba(236, 72, 153, 0.4));
          transition: filter 0.3s ease;
        }
        .portrait-wrap.speaking {
          filter: drop-shadow(0 0 calc(36px * var(--glow)) rgba(34, 211, 238, 0.55));
        }
        .portrait {
          display: block;
          width: 100%;
          height: auto;
          max-height: 360px;
          object-fit: contain;
          object-position: center top;
          border-radius: 18px;
          border: 1px solid rgba(244, 114, 182, 0.35);
          background: #0a0a12;
        }
        .portrait-fallback {
          min-height: 280px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          border: 1px dashed rgba(244, 114, 182, 0.4);
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          padding: 16px;
          text-align: center;
        }
        .rim {
          position: absolute;
          inset: -2px;
          border-radius: 20px;
          pointer-events: none;
          box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.25);
        }
        .rim.hot {
          box-shadow:
            0 0 0 1px rgba(236, 72, 153, 0.55),
            0 0 28px rgba(236, 72, 153, 0.35);
        }

        .caption {
          position: absolute;
          left: 16px;
          bottom: 12px;
          font-size: 11px;
          opacity: 0.65;
          letter-spacing: 0.04em;
          z-index: 5;
        }
      `}</style>
    </div>
  );
}
