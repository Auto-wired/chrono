import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config'; // 💡 가벼운 설정 가져오기
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // 💡 설정 병합
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        userId: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { userId: credentials.userId as string }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.userId,
          name: user.nickname,
        };
      }
    })
  ],
});