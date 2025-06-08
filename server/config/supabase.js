// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://kamsdtxsunnlwofviwyk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbXNkdHhzdW5ubHdvZnZpd3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTI3MDUsImV4cCI6MjA2NDI4ODcwNX0.AIIB3q18WSZ4auvMDpSHwlnTARfYaF-7S8rZRpWKr_M';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Supabase and create schema if not exists
export const initializeSupabase = async () => {
  try {
    console.log('Initializing Supabase connection...');
    
    // Check connection by getting session
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error);
      return;
    }
    
    console.log('Supabase connection established successfully');
    
    // Create necessary tables if they don't exist
    await createTables();
    
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
};

// Create all required tables in Supabase
async function createTables() {
  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table_if_not_exists');
    if (usersError) console.error('Error creating users table:', usersError);
    
    // Create readings table
    const { error: readingsError } = await supabase.rpc('create_readings_table_if_not_exists');
    if (readingsError) console.error('Error creating readings table:', readingsError);
    
    // Create messages table
    const { error: messagesError } = await supabase.rpc('create_messages_table_if_not_exists');
    if (messagesError) console.error('Error creating messages table:', messagesError);
    
    // Create bookings table
    const { error: bookingsError } = await supabase.rpc('create_bookings_table_if_not_exists');
    if (bookingsError) console.error('Error creating bookings table:', bookingsError);
    
    // Create transactions table
    const { error: transactionsError } = await supabase.rpc('create_transactions_table_if_not_exists');
    if (transactionsError) console.error('Error creating transactions table:', transactionsError);
    
    // Create reviews table
    const { error: reviewsError } = await supabase.rpc('create_reviews_table_if_not_exists');
    if (reviewsError) console.error('Error creating reviews table:', reviewsError);
    
    console.log('All tables created or verified in Supabase');
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
  }
}
