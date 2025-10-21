// Simple test endpoint to verify environment variables
export default function handler(req, res) {
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
  const hasBranchDomain = !!process.env.BRANCH_DOMAIN;
  
  res.status(200).json({
    status: 'ok',
    env: {
      SUPABASE_URL: hasSupabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_ANON_KEY: hasSupabaseKey ? 'SET' : 'MISSING',
      BRANCH_DOMAIN: hasBranchDomain ? 'SET' : 'MISSING'
    },
    timestamp: new Date().toISOString()
  });
}
