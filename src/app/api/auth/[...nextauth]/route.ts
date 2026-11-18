// Auth.js handles every URL under /api/auth/... (sign in, callback, sign out).
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
