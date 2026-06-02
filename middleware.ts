import { type NextRequest } from "next/server";
import { updateSession } from "./src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Всё, кроме статики, картинок и manifest.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
