// src/lib/api.ts
// API utility for SoulSeer backend auth, sessions, payments, and WebRTC

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Auth API Functions
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // for httpOnly cookies
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data.user;
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function logoutUser() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

// Session API Functions
export async function startSession(readerId: string) {
  const res = await fetch(`${API_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reader_id: readerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to start session');
  return data;
}

export async function endSession(sessionId: string) {
  const res = await fetch(`${API_BASE}/sessions/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ session_id: sessionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to end session');
  return data;
}

export async function getUserSessions() {
  const res = await fetch(`${API_BASE}/sessions/user/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch sessions');
  return data;
}

export async function getUserReviews() {
  const res = await fetch(`${API_BASE}/reviews/user/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch user reviews');
  return data;
}

export async function getReaderSessions() {
  const res = await fetch(`${API_BASE}/sessions/reader/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reader sessions');
  return data;
}

export async function getReaderReviews() {
  const res = await fetch(`${API_BASE}/reviews/reader/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reader reviews');
  return data;
}

export async function getEarnings() {
  const res = await fetch(`${API_BASE}/earnings/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch earnings');
  return data;
}

export interface ReviewInput {
  readerId: string;
  sessionId?: string; // Optional: link review to a specific session
  rating: number;
  text: string;
}

export async function submitReview(reviewData: ReviewInput) {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit review');
  return data; // Assuming the backend returns the created review or a success message
}

export async function getEarnings() {
  // Mock data for development
  return 150.0;
}

// Payment API Functions
export async function addFunds(amount: number, paymentMethodId: string) {
  const res = await fetch(`${API_BASE}/payments/add-funds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, payment_method_id: paymentMethodId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add funds');
  return data;
}

export async function getBalance() {
  const res = await fetch(`${API_BASE}/payments/balance`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch balance');
  return data.balance;
}

// Reader API Functions
export async function getAvailableReaders() {
  const res = await fetch(`${API_BASE}/readers/available`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch readers');
  return data;
}

export async function getReaderProfile(readerId: string) {
  const res = await fetch(`${API_BASE}/readers/${readerId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reader profile');
  return data;
}

// Socket.IO Connection Helper
export function createSocketConnection() {
  // This will be implemented in a separate file (webrtc.ts)
  // to handle the WebRTC signaling and connections
  return null;
}

