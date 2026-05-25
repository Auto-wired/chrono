/** Next.js redirect()가 던지는 특수 오류 — 다시 throw 해야 네비게이션이 동작함 */
export function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}
