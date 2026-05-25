'use client';

import Link from 'next/link';
import { Calendar, UserPlus } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { signup } from '@/app/actions';

function SignupButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit"
      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-disabled={pending}
    >
      {pending ? '회원가입 중...' : '회원가입 완료'}
    </button>
  );
}

export default function SignupPage() {
  const [state, dispatch] = useActionState(signup, undefined);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 mb-2">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chrono</h1>
          <p className="text-slate-500 font-medium">나만의 커스텀 스케줄러 만들기</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5 text-slate-900" />
              새로운 계정 만들기
            </h2>
            <p className="text-sm text-slate-400">필요한 정보를 입력하여 시작하세요</p>
          </div>

          <form action={dispatch} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">닉네임</label>
              <input 
                type="text" 
                placeholder="사용하실 닉네임을 입력하세요"
                name="nickname"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
              />
              {state?.errors?.nickname && (
                <p className="text-red-500 text-xs mt-1 ml-1">{state.errors.nickname[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">아이디</label>
              <input 
                type="text" 
                placeholder="로그인에 사용할 아이디를 입력하세요"
                name="userId"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
              />
              {state?.errors?.userId && (
                <p className="text-red-500 text-xs mt-1 ml-1">{state.errors.userId[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호"
                name="password"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
              />
              {state?.errors?.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{state.errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">비밀번호 확인</label>
              <input
                type="password"
                placeholder="다시 입력"
                name="passwordConfirm"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-900 outline-none transition-all text-slate-800 placeholder:text-slate-300 font-medium"
              />
              {state?.errors?.passwordConfirm && (
                <p className="text-red-500 text-xs mt-1 ml-1">{state.errors.passwordConfirm[0]}</p>
              )}
            </div>

            {state?.message && !state?.errors?.userId && (
              <div
                className={`text-center text-sm font-medium mt-4 ${
                  state.message.includes('성공') ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {state.message}
              </div>
            )}

            <SignupButton />

          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-slate-500 font-medium">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-slate-900 font-bold hover:underline underline-offset-4 decoration-2">
                로그인하기
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          Chrono를 통해 체계적인 일상을 관리하세요
        </p>
      </div>
    </div>
  );
}
