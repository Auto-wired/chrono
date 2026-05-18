import { NextRequest } from "next/server";
import { handlers } from "@/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  await context.params; 
  return handlers.GET(request);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  await context.params;
  return handlers.POST(request);
}