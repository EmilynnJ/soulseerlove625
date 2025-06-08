// src/lib/paymentManager.ts
// Service for handling real-time payment tracking and processing during readings

import { addFunds, getBalance } from './api';

interface PaymentOptions {
  onBalanceUpdate?: (newBalance: number) => void;
  onBalanceLow?: (balance: number, minRequired: number) => void;
  onBalanceDepleted?: () => void;
  onBillingSuccess?: (amount: number) => void;
  onBillingError?: (error: Error) => void;
}

export class PaymentManager {
  private userId: string;
  private readerId: string;
  private sessionId: string | null = null;
  private ratePerMinute: number;
  private balance: number = 0;
  private elapsedTimeSeconds: number = 0;
  private billingIntervalId: ReturnType<typeof setInterval> | null = null;
  private billableThreshold: number = 60; // Bill every 60 seconds (1 minute)
  private lowBalanceThreshold: number = 5; // Warn when 5 minutes or less remaining
  private minBalanceRequired: number = 3; // Minimum 3 minute balance required
  private options: PaymentOptions;
  private lastBilledTime: number = 0;
  
  constructor(
    userId: string, 
    readerId: string, 
    ratePerMinute: number,
    options: PaymentOptions = {}
  ) {
    this.userId = userId;
    this.readerId = readerId;
    this.ratePerMinute = ratePerMinute;
    this.options = options;
  }
  
  /**
   * Initialize the payment manager, fetching current balance
   */
  async initialize(sessionId: string): Promise<boolean> {
    try {
      this.sessionId = sessionId;
      
      // Get current balance
      this.balance = await getBalance();
      
      // Check if user has enough balance to start (minimum 3 minutes)
      const minimumRequired = this.ratePerMinute * this.minBalanceRequired;
      if (this.balance < minimumRequired) {
        if (this.options.onBalanceLow) {
          this.options.onBalanceLow(this.balance, minimumRequired);
        }
        return false;
      }
      
      // If balance is adequate, notify current balance
      if (this.options.onBalanceUpdate) {
        this.options.onBalanceUpdate(this.balance);
      }
      
      return true;
    } catch (error) {
      console.error('Payment manager initialization error:', error);
      if (this.options.onBillingError && error instanceof Error) {
        this.options.onBillingError(error);
      }
      return false;
    }
  }
  
  /**
   * Start tracking time and billing
   */
  startBilling(): void {
    this.elapsedTimeSeconds = 0;
    this.lastBilledTime = 0;
    
    // Clear any existing interval just in case
    if (this.billingIntervalId) {
      clearInterval(this.billingIntervalId);
    }
    
    // Set up billing interval - check every second, bill every minute
    this.billingIntervalId = setInterval(() => {
      this.elapsedTimeSeconds += 1;
      
      // Check if we need to bill (every billableThreshold seconds)
      if (this.elapsedTimeSeconds % this.billableThreshold === 0) {
        this.processBilling();
      }
      
      // Check for low balance warning
      const minutesRemaining = this.balance / this.ratePerMinute;
      if (minutesRemaining <= this.lowBalanceThreshold && 
          this.elapsedTimeSeconds % 15 === 0) {  // Check every 15 seconds
        if (this.options.onBalanceLow) {
          this.options.onBalanceLow(
            this.balance, 
            this.ratePerMinute * this.minBalanceRequired
          );
        }
      }
    }, 1000);
  }
  
  /**
   * Process billing for the elapsed time
   */
  private async processBilling(): Promise<void> {
    try {
      // Calculate billable time since last billing
      const secondsSinceLastBill = this.elapsedTimeSeconds - this.lastBilledTime;
      const minutesBilled = secondsSinceLastBill / 60;
      const amountToCharge = this.ratePerMinute * minutesBilled;
      
      // Update internal balance tracker
      this.balance -= amountToCharge;
      this.lastBilledTime = this.elapsedTimeSeconds;
      
      // Notify listeners of new balance
      if (this.options.onBalanceUpdate) {
        this.options.onBalanceUpdate(this.balance);
      }
      
      // Notify of successful billing
      if (this.options.onBillingSuccess) {
        this.options.onBillingSuccess(amountToCharge);
      }
      
      // Check if balance is depleted
      if (this.balance <= 0) {
        if (this.options.onBalanceDepleted) {
          this.options.onBalanceDepleted();
        }
        this.stopBilling();
      }
      
      // In a real implementation, we would call the API to update the 
      // user's balance and record the transaction
      // For now we're just tracking it client side
      
    } catch (error) {
      console.error('Billing error:', error);
      if (this.options.onBillingError && error instanceof Error) {
        this.options.onBillingError(error);
      }
    }
  }
  
  /**
   * Stop billing and clean up
   */
  stopBilling(): void {
    if (this.billingIntervalId) {
      clearInterval(this.billingIntervalId);
      this.billingIntervalId = null;
    }
    
    // Process final billing if needed
    if (this.elapsedTimeSeconds > this.lastBilledTime) {
      this.processBilling();
    }
  }
  
  /**
   * Get the current elapsed time in seconds
   */
  getElapsedTime(): number {
    return this.elapsedTimeSeconds;
  }
  
  /**
   * Get the current balance
   */
  getCurrentBalance(): number {
    return this.balance;
  }
  
  /**
   * Get the rate per minute
   */
  getRatePerMinute(): number {
    return this.ratePerMinute;
  }
  
  /**
   * Calculate the current cost of the session
   */
  getCurrentCost(): number {
    return (this.elapsedTimeSeconds / 60) * this.ratePerMinute;
  }
  
  /**
   * Estimate how many minutes remain based on current balance
   */
  getRemainingMinutes(): number {
    return this.balance / this.ratePerMinute;
  }
}

export default PaymentManager;
