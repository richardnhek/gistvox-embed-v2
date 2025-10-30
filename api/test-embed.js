// Simple test endpoint
export default async function handler(req, res) {
  try {
    // Test basic functionality
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Try to fetch a simple test
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', '233d8054-c0c8-489e-b64f-5fc23ae7f783')
      .single();
    
    res.status(200).json({ 
      success: true, 
      post: post || null,
      error: error || null,
      env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
}
