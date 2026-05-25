import Calendar from "@/components/Calendar";
import { signOut, auth } from "@/auth";
import { Calendar as CalendarIcon } from "lucide-react";
import { AIChat } from "@/components/AIChat";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 pb-24 lg:p-10 lg:pb-28">
      <div className="mx-auto max-w-[1600px] h-[calc(100vh-5rem)] flex flex-col space-y-6">
        <header className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chrono v0.0.7</h1>
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm text-sm text-slate-700 font-medium">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span>{session.user.name} 님 환영합니다!</span>
              </div>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                로그아웃
              </button>
            </form>
          </div>
        </header>
        
        <div className="flex-grow min-h-0 relative">
          <Calendar />
        </div>
      </div>
      <AIChat />
    </main>
  );
}
