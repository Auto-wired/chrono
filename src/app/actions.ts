
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signIn } from "../auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  userId: z.string().min(3, "아이디는 3자 이상이어야 합니다."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  passwordConfirm: z.string(),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다."),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["passwordConfirm"],
});

export async function signup(prevState: any, formData: FormData) {
  const validatedFields = signupSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    nickname: formData.get("nickname"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "회원가입 정보가 유효하지 않습니다.",
    };
  }

  const { userId, password, nickname } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { userId } });
    if (existingUser) {
      return { message: "이미 존재하는 아이디입니다.", errors: { userId: ["이미 존재하는 아이디입니다."] } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        userId,
        password: hashedPassword,
        nickname,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { message: "이미 존재하는 아이디입니다.", errors: { userId: ["이미 존재하는 아이디입니다."] } };
    }
    console.error("회원가입 실패:", error);
    return { message: "회원가입에 실패했습니다. 다시 시도해 주세요.", errors: {} };
  }

  redirect("/login");
}

export async function authenticate(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      userId: formData.get("userId"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "아이디 또는 비밀번호가 올바르지 않습니다.";
      } else {
        console.error("로그인 실패: ", error);

        return "로그인에 실패했습니다.";
      }
    }

    throw error;
  }
}
