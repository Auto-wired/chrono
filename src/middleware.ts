import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// 💡 DB 로직이 없는 가벼운 설정으로 초기화
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 💡 기존 코드의 startsWith("/")는 /login 까지 잡아버리는 버그가 있어서 
  // 메인 페이지만 정확히 타겟팅하도록 수정했습니다.
  const isProtected = pathname === "/";

  if (isProtected && !isLoggedIn) {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

// 💡 에러를 유발하던 (.+) 그룹 캡처를 제거한 표준 안전 매처
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)"],
};