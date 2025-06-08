// SoulSeer Backend API Interface (RESTful)
// Replace all mock API calls with these real endpoints
// Ensure to set VITE_API_BASE in your .env file

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kamsdtxsunnlwofviwyk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbXNkdHhzdW5ubHdvZnZpd3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTI3MDUsImV4cCI6MjA2NDI4ODcwNX0.AIIB3q18WSZ4auvMDpSHwlnTARfYaF-7S8rZRpWKr_M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// --- Types ---
export interface Availability {
  [day: string]: { enabled: boolean; start: string; end: string };
}

export interface Booking {
  id: string;
  readerId: string;
  clientId: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  price: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
}

export interface Wallet {
  balance: number;
  transactions: Array<{ id: string; amount: number; type: string; date: string }>;
}

// --- Availability ---
export async function getReaderAvailability(readerId: string): Promise<Availability> {
  const res = await fetch(`${API_BASE}/readers/${readerId}/availability`);
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function setReaderAvailability(readerId: string, availability: Availability): Promise<void> {
  const res = await fetch(`${API_BASE}/readers/${readerId}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability }),
  });
  if (!res.ok) throw new Error('Failed to save availability');
}

// --- Bookings ---
export async function createBooking(data: { readerId: string; date: string; time: string; price: number }): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}

export async function getUserBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function getReaderBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/reader`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function acceptBooking(bookingId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/accept`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to accept booking');
}

export async function declineBooking(bookingId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/decline`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to decline booking');
}

// --- Payments ---
export async function createPaymentIntent(amount: number): Promise<PaymentIntentResponse> {
  const res = await fetch(`${API_BASE}/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error('Failed to create payment intent');
  return res.json();
}

// --- Wallet ---
export async function getWallet(): Promise<Wallet> {
  const res = await fetch(`${API_BASE}/wallet`);
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

export async function topUpWallet(amount: number, paymentIntentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/wallet/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, paymentIntentId }),
  });
  if (!res.ok) throw new Error('Failed to top up wallet');
}

// --- Reviews ---
export interface Review {
  readerId: string;
  sessionId: string;
  rating: number;
  reviewText: string;
  timestamp: string;
}

export async function submitReview(review: Review): Promise<void> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) throw new Error('Failed to submit review');
}

// --- Chat/Session Persistence ---
export interface ChatMessage {
  senderId: string;
  content: string;
  timestamp: string;
}

export async function saveChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error('Failed to save chat message');
}
