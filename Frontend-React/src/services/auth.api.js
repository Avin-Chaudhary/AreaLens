const BACKEND_URL = import.meta.env.VITE_NODE_API_URL;

/**
 * Backend response shape:
 * { status: "success", data: { username } }
 */
const extractUser = async (res) => {
  const json = await res.json();
  return json.data;
};

/* ---------- PUBLIC AUTH ---------- */

export const signup = async ({ username, password }) => {
  const res = await fetch(`${BACKEND_URL}/v1/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Signup failed");
  return extractUser(res);
};

export const signin = async ({ username, password }) => {
  const res = await fetch(`${BACKEND_URL}/v1/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Signin failed");
  return extractUser(res);
};

/* ---------- SESSION ---------- */

export const fetchCurrentUser = async () => {
  const res = await fetch(`${BACKEND_URL}/v1/user/me`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not authenticated");
  return extractUser(res);
};

/* ---------- LOGOUT ---------- */

export const logout = async () => {
  await fetch(`${BACKEND_URL}/v1/user/logout`, {
    method: "POST",
    credentials: "include",
  });
};

/* ---------- ACCOUNT ---------- */

export const updatePassword = async ({ username, password, newPassword }) => {
  const res = await fetch(`${BACKEND_URL}/v1/user/updatepassword`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, newPassword }),
  });

  if (!res.ok) throw new Error("Password update failed");
};

export const deleteAccount = async ({ username, password }) => {
  const res = await fetch(`${BACKEND_URL}/v1/user/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Account deletion failed");
};
