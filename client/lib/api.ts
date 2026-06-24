const API_URL = "http://localhost:4000";

export interface AuthUser {
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function registerRequest(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "Registration failed.");
  return data as AuthResponse;
}

export async function loginRequest(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "Login failed.");
  return data as AuthResponse;
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "Session expired.");
  return data.user as AuthUser;
}

// ── Token storage ──────────────────────────────────────────
const TOKEN_KEY = "chatapp_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}