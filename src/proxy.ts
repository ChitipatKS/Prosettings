import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * รัน middleware กับทุก route ยกเว้น:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images/icons ต่างๆ
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};