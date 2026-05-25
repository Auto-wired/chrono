'use client';

import Link from 'next/link';
import { Calendar, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { signup } from '@/app/actions';
import { isNextRedirect } from '@/lib/next-navigation';

type SignupState = {
  errors?: {
    nickname?: string[];
    userId?: string[];
    password?: string[];
    passwordConfirm?: string[];
  };
  message?: string;
};

export default function SignupPage() {
  const [state, setState] = useState<SignupState | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState(undefined);

    const formData = new FormData();
    formData.set('nickname', nickname);
    formData.set('userId', userId);
    formData.set('password', password);
    formData.set('passwordConfirm', passwordConfirm);

    try {
      const result = await signup(undefined, formData);
      if (result) setState(result);
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      console.error('회원가입 처리 오류:', error);
      setState({ message: '회원가입에 실패했습니다. 다시 시도해 주세요.', errors: {} });
    } finally {
      setIsPending(false);
    }
  };

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">닉네임</label>
              <input
                type="text"
                placeholder="사용하실 닉네임을 입력하세요"
                name="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                autoComplete="nickname"
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
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                autoComplete="username"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                autoComplete="new-password"
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? '회원가입 중...' : '회원가입 완료'}
            </button>
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
