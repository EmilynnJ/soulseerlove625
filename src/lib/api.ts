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
  // For dev: return mock data if no backend
  if (!API_BASE || API_BASE.includes('mock')) {
    return [
      { id: '1', readerName: 'Mystic Luna', startedAt: '2025-06-05T19:00:00Z', endedAt: '2025-06-05T19:30:00Z', status: 'completed', cost: 45 },
      { id: '2', readerName: 'Crystal Sage', startedAt: '2025-06-01T20:00:00Z', endedAt: '2025-06-01T20:15:00Z', status: 'completed', cost: 22.5 },
    ];
  }
  const res = await fetch(`${API_BASE}/sessions/user/me`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch sessions');
  return data;
}

export async function getUserReviews() {
  // Mock data for development
  return [
    { id: 'r1', readerName: 'Mystic Luna', rating: 5, text: 'Amazing reading!', createdAt: '2025-06-05T19:35:00Z' },
    { id: 'r2', readerName: 'Crystal Sage', rating: 4, text: 'Very insightful.', createdAt: '2025-06-01T20:20:00Z' },
  ];
}

export async function getReaderSessions() {
  // Mock data for development
  return [
    { id: 's1', clientName: 'Emily', startedAt: '2025-06-06T21:00:00Z', endedAt: '2025-06-06T21:30:00Z', status: 'completed', earnings: 60 },
    { id: 's2', clientName: 'Alex', startedAt: '2025-06-02T18:00:00Z', endedAt: '2025-06-02T18:45:00Z', status: 'completed', earnings: 90 },
  ];
}

export async function getReaderReviews() {
  // Mock data for development
  return [
    { id: 'rr1', clientName: 'Emily', rating: 5, text: 'A wonderful experience!', createdAt: '2025-06-06T21:35:00Z' },
    { id: 'rr2', clientName: 'Alex', rating: 4, text: 'Great insights.', createdAt: '2025-06-02T18:50:00Z' },
  ];
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

