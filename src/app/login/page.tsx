'use client';

'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useFormState } from 'react-dom';
import { authenticate } from '@/app/actions';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit"
      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-disabled={pending}
    >
      {pending ? '로그인 중...' : '로그인'}
    </button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 mb-2">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chrono</h1>
          <p className="text-slate-500 font-medium">스마트한 일정 관리의 시작</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-slate-800">환영합니다!</h2>
            <p className="text-sm text-slate-400">계정에 로그인하여 일정을 관리하세요</p>
          </div>

          <form action={dispatch} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">아이디</label>
              <input 
                type="text" 
                placeholder="아이디를 입력하세요"
                name="userId"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
              <input 
                type="password" 
                placeholder="비밀번호를 입력하세요"
                name="password"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <LoginButton />

            {errorMessage && (
              <div className="text-red-500 text-center text-sm font-medium mt-4">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="pt-4 text-center">
            <p className="text-sm text-slate-500 font-medium">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-slate-900 font-bold hover:underline underline-offset-4 decoration-2">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          &copy; 2026 Chrono Scheduler. All rights reserved.
        </p>
      </div>
    </div>
  );
}
