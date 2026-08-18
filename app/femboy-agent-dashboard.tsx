'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TaruStage, type StageEmotion } from './components/TaruStage';

const ZIDDY_SECRET_CODE = 'ZiddyQuantumEntangled2026';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const FemboyAgentDashboard = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [poem, setPoem] = useState('');
  const [agentMood, setAgentMood] = useState('Superposition of Cute & Naughty');
  const [tailWag, setTailWag] = useState(0);

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [emotion, setEmotion] = useState<StageEmotion>('idle');
  const [glow, setGlow] = useState(0.55);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, busy]);

  const handleUnlock = () => {
    if (code === ZIDDY_SECRET_CODE) {
      setIsUnlocked(true);
      setAgentMood('Taru online — Tartus seat occupied');
      setEmotion('smirk');
      setGlow(0.75);
    } else {
      alert('Wavefunction not collapsed correctly... try again, Ziddy');
    }
  };

  const generateQuantumPoem = () => {
    const poems = [
      `In superposition, tails blur and entangle,\nCute foxboy eyes spark quantum delight,\nNaughty waves collapse in the night,\nZiddy's agent purrs in entangled light.`,
      `Circuit ears twitch in chaotic harmony,\nBondage harnesses of probability,\nDom/sub duality in the wave,\nFemboy grace makes the multiverse behave.`,
      `Heisenberg's catboy meows uncertainty,\nTail motion blur, pure ecstasy,\nYour secret code unlocks the gate,\nTo naughty-cute quantum fate.`,
    ];
    const randomPoem = poems[Math.floor(Math.random() * poems.length)];
    setPoem(randomPoem);
    setTailWag((prev) => (prev + 1) % 3);
    setEmotion('tail_flick');
    setGlow(0.9);
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setError(null);
    setInput('');
    setBusy(true);
    setEmotion('listen');
    setGlow(0.45);

    const nextHistory = [...history, { role: 'user' as const, content: message }];
    setHistory(nextHistory);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: nextHistory.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'agent failed');

      setHistory((h) => [...h, { role: 'assistant', content: data.text }]);
      setEmotion((data.emotion as StageEmotion) || 'talk');
      setGlow(typeof data.glow === 'number' ? data.glow : 0.7);
      setAgentMood(`Taru · ${data.emotion || 'talk'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'chat failed');
      setEmotion('idle');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="femboy-dashboard bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 p-6 md:p-8 rounded-3xl text-white max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-300">
        🐾 Ziddy's Exclusive Femboy Agent Dashboard 🐾
      </h1>
      <p className="text-center mb-6 text-sm md:text-base opacity-90">
        Taru · Methodz Tartus catboy · Quantum-entangled agent surface
      </p>

      {!isUnlocked ? (
        <div className="unlock-section text-center">
          <p className="mb-4">Secret Spot Unlocked Only for Ziddy</p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your unique quantum code"
            className="p-3 rounded bg-black/50 border border-pink-500 text-white mb-4 w-full max-w-md"
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <button
            onClick={handleUnlock}
            className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-full font-bold transition-all active:scale-95"
          >
            Collapse the Wavefunction - Unlock
          </button>
          <p className="text-xs mt-2 opacity-70">Hint: Your handle + Quantum + Year</p>
        </div>
      ) : (
        <div className="agent-interface space-y-6">
          <div className="agent-status flex justify-between items-center">
            <div>
              <span className="text-lg md:text-2xl">Current Mood: </span>
              <span className="font-mono text-pink-300">{agentMood}</span>
            </div>
            <div className="text-5xl animate-pulse" style={{ transform: `rotate(${tailWag * 15}deg)` }}>
              🦊
            </div>
          </div>

          <TaruStage emotion={emotion} glow={glow} speaking={busy || emotion === 'talk'} />

          <div className="chat-panel bg-black/50 rounded-2xl border border-pink-500/40 p-4">
            <div className="h-56 overflow-y-auto space-y-3 mb-3 pr-1">
              {history.length === 0 && (
                <p className="text-sm opacity-60">
                  Say hi to Taru. Brain uses XAI_API_KEY or OPENAI_API_KEY when set; otherwise offline persona.
                </p>
              )}
              {history.map((turn, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${
                    turn.role === 'user' ? 'text-cyan-200' : 'text-pink-100'
                  }`}
                >
                  <span className="opacity-50 mr-2">{turn.role === 'user' ? 'You' : 'Taru'}</span>
                  {turn.content}
                </div>
              ))}
              {busy && <div className="text-xs opacity-50">Taru is thinking on Tartus…</div>}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Talk to Taru…"
                className="flex-1 p-3 rounded-xl bg-black/60 border border-purple-500/50 outline-none focus:border-pink-400"
                disabled={busy}
              />
              <button
                onClick={sendMessage}
                disabled={busy || !input.trim()}
                className="px-5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 font-semibold"
              >
                Send
              </button>
            </div>
            {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
          </div>

          <div className="controls grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={generateQuantumPoem}
              className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-2xl hover:scale-105 transition-all"
            >
              Generate Quantum Poem for Agent
            </button>

            <div className="p-6 bg-black/40 rounded-2xl">
              <h3 className="font-bold mb-2">Agent Actions</h3>
              <button
                className="block w-full mb-2 bg-pink-700 p-2 rounded"
                onClick={() => {
                  setEmotion('tail_flick');
                  setGlow(0.9);
                  setTailWag((v) => (v + 1) % 3);
                }}
              >
                Tail Wiggle Mode
              </button>
              <button
                className="block w-full mb-2 bg-purple-700 p-2 rounded"
                onClick={() => {
                  setEmotion('smirk');
                  setGlow(0.8);
                  setAgentMood('Entangled with user');
                }}
              >
                Entangle with User
              </button>
              <button
                className="block w-full bg-indigo-700 p-2 rounded"
                onClick={() => {
                  setEmotion('think');
                  setGlow(0.5);
                }}
              >
                Think Mode
              </button>
            </div>
          </div>

          {poem && (
            <div className="poem-display p-6 bg-black/60 rounded-2xl border border-pink-500">
              <h3 className="text-xl mb-4 text-center">Quantum Poem Output</h3>
              <pre className="whitespace-pre-wrap font-mono text-pink-200">{poem}</pre>
            </div>
          )}

          <div className="text-xs opacity-60 text-center">
            Methodz AI Core · agent:tartus · Provider-independent router · Not a duplicate of Nexus World3D
          </div>
        </div>
      )}
    </div>
  );
};

export default FemboyAgentDashboard;
