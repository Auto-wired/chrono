'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { scheduleAction } from '@/app/chat-actions';
import { Send, Loader2, Cpu, Mic, MicOff } from 'lucide-react';
import { clsx } from 'clsx';

type ModelType = 'ollama' | 'gemini';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function AIChat() {
  const [modelType, setModelType] = useState<ModelType>('ollama');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const runSchedule = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const result = await scheduleAction(trimmed, modelType);

      if (result.success) {
        setInput('');
        setStatus({ type: 'success', message: '일정이 반영되었습니다.' });
        window.dispatchEvent(new CustomEvent('calendarReload'));
      } else {
        setStatus({ type: 'error', message: result.error ?? '처리에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Schedule action error:', error);
      setStatus({ type: 'error', message: '오류가 발생했습니다. 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, modelType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSchedule(input);
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (isLoading) return;

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setStatus({ type: 'error', message: '이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)' });
      return;
    }

    stopListening();

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        setInput(transcript);
        void runSchedule(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setStatus({ type: 'error', message: '음성 인식에 실패했습니다. 다시 시도해 주세요.' });
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setStatus(null);
    recognition.start();
  }, [isLoading, runSchedule, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const busy = isLoading || isListening;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60"
      >
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5">
          <Cpu size={14} className="text-slate-500" />
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as ModelType)}
            disabled={busy}
            className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="AI 모델 선택"
          >
            <option value="ollama">llama3.1:8b</option>
            <option value="gemini">gemini-2.5-flash</option>
          </select>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? '말씀해 주세요...' : '예: "내일 오후 3시 회의 추가해줘"'}
          className="min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
        />

        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-xl p-2.5 transition-all active:scale-95 disabled:opacity-50',
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
          aria-label={isListening ? '음성 인식 중지' : '음성으로 일정 요청'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex shrink-0 items-center justify-center rounded-xl bg-blue-600 p-2.5 text-white transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-95"
          aria-label="일정 요청 실행"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      {status && (
        <p
          className={clsx(
            'mt-2 text-center text-xs font-medium',
            status.type === 'success' ? 'text-green-600' : 'text-red-500'
          )}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
