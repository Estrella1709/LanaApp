// src/services/api.js
import * as SecureStore from 'expo-secure-store';

// CAMBIA por tu URL de FastAPI
const API_URL = 'http://192.168.0.8:8001';

// -------------------- token memo + helpers base --------------------
let authToken = null;
export async function loadToken() {
  authToken = await SecureStore.getItemAsync('auth_token');
}
export async function setToken(token) {
  authToken = token;
  if (token) await SecureStore.setItemAsync('auth_token', token);
  else await SecureStore.deleteItemAsync('auth_token');
}

export async function getToken() {
  return authToken || await SecureStore.getItemAsync('auth_token');
}

// Llamada base
export async function apiFetch(path, { method='GET', headers={}, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // estos headers no los usa tu backend, pero no molestan
      ...(authToken ? { Authorization: `Bearer ${authToken}`, token: authToken } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.detail || j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;

  try { return await res.json(); } catch { return null; }
}

// Adjunta ?token=... en la URL (así lo pide getIdFromToken)
async function withToken(path) {
  const t = authToken || await SecureStore.getItemAsync('auth_token');
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}token=${encodeURIComponent(t || '')}`;
}

// -------------------- AUTH --------------------
export async function login({ email, phone, password }) {
  // la API acepta email O phone + password
  const body = { password };
  if (email) body.email = email;
  if (phone) body.phone = phone;

  const res = await apiFetch('/validateUser', { method: 'POST', body });
  // tu endpoint regresa el token como string plano
  const token = typeof res === 'string' ? res : (res?.token || res?.access_token);
  if (!token) throw new Error('No se recibió token');

  await setToken(token);
  return token;
}

export async function register({ name, lastname, email, phone, password }) {
  return apiFetch('/registerUser', {
    method: 'POST',
    body: { name, lastname, email, phone, password }
  });
}

// -------------------- TRANSACTIONS --------------------
export async function listTransactions(params = {}) {
  // opcional: filtrar por mes, etc. via params
  let path = '/transactions/';
  const qs = new URLSearchParams(params).toString();
  if (qs) path += `?${qs}`;
  path = await withToken(path);
  return apiFetch(path, { method: 'GET' });
}

export async function createTransaction(payload) {
  // payload: { amount, datetime, description, category }
  const path = await withToken('/transactions/');
  return apiFetch(path, { method: 'POST', body: payload });
}

// En tu backend actual PUT/DELETE por id no usan token; si luego lo piden,
// cambia a: await withToken(`/transactions/${id}`)
export async function updateTransaction(id, payload) {
  return apiFetch(`/transactions/${id}`, { method: 'PUT', body: payload });
}

export async function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

// --- CATEGORIES ---
export async function getCategoriesApi() {
  return apiFetch('/categories/');
}

export async function createCategoryApi({ name, description = '', schedulable = false }) {
  const path = await withToken('/categories/');            // 👈 agrega ?token=...
  return apiFetch(path, {
    method: 'POST',
    body: { name, description, schedulable },
  });
}

export async function updateCategoryApi(id, { name, description = '', schedulable = false }) {
  const path = await withToken(`/categories/${id}`);        // 👈 agrega ?token=...
  return apiFetch(path, {
    method: 'PUT',
    body: { name, description, schedulable },
  });
}

export async function deleteCategoryApi(id) {
  const path = await withToken(`/categories/${id}`);        // 👈 agrega ?token=...
  return apiFetch(path, { method: 'DELETE' });
}


// ---- ALIAS para que tu código actual no truene ----
export const listCategories = getCategoriesApi;
export const createCategory = createCategoryApi;
export const updateCategory = updateCategoryApi;
export const deleteCategory = deleteCategoryApi;

// ----- FIXED PAYMENTS (ScheduledTransactions) -----
const FIXED_BASE = '/scheduled-transactions'; // <-- cámbialo si tu router usa otro prefijo

export async function listFixedPayments() {
  const path = await withToken(`${FIXED_BASE}/`);
  return apiFetch(path, { method: 'GET' });
}

export async function createFixedPayment(payload) {
  const path = await withToken(`${FIXED_BASE}/`);
  return apiFetch(path, { method: 'POST', body: payload });
}

export async function updateFixedPayment(id, payload) {
  const path = await withToken(`${FIXED_BASE}/${id}`);
  return apiFetch(path, { method: 'PUT', body: payload });
}

export async function deleteFixedPayment(id) {
  const path = await withToken(`${FIXED_BASE}/${id}`);
  return apiFetch(path, { method: 'DELETE' });
}

// --- BUDGETS ---

export async function listBudgets() {
  const path = await withToken('/budgets/');
  return apiFetch(path);
}
export async function createBudget({ category, amount, month }) {
  const path = await withToken('/budgets/');
  return apiFetch(path, { method: 'POST', body: { category, amount, month } });
}
export async function updateBudget(id, body) {
  const path = await withToken(`/budgets/${id}`);
  return apiFetch(path, { method: 'PUT', body });
}
export async function deleteBudget(id) {
  const path = await withToken(`/budgets/${id}`);
  return apiFetch(path, { method: 'DELETE' });
}