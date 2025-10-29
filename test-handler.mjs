// Test the embed handler directly
import { createClient } from '@supabase/supabase-js';

// Mock environment variables
process.env.SUPABASE_URL = 'https://vrcshstpoimwpwyyamvq.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc';

// Import the handler
import handler from './api/embed/[id].js';

// Mock req and res objects
const req = {
  query: {
    id: '233d8054-c0c8-489e-b64f-5fc23ae7f783'
  }
};

const res = {
  status: (code) => ({
    send: (html) => {
      if (code === 200) {
        console.log('Success! HTML length:', html.length);
        // Check for any obvious issues
        if (html.includes('undefined')) {
          console.log('Warning: HTML contains undefined');
        }
      } else {
        console.log('Error status:', code);
        console.log(html.substring(0, 200));
      }
    }
  }),
  setHeader: (key, value) => {
    // console.log('Header:', key, '=', value);
  }
};

// Run the handler
try {
  await handler(req, res);
} catch (error) {
  console.error('Handler error:', error.message);
  console.error(error.stack);
}
