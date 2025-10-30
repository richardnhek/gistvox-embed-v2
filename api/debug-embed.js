// Debug version of embed endpoint with detailed error logging
export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing ID' });
  }
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Fetch post data
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, title, description, audio_url, audio_duration, created_at, user_id, audience_type, listens_count, likes_count, saves_count, shares_count')
      .eq('id', id)
      .eq('audience_type', 'public')
      .single();
    
    if (error || !post) {
      return res.status(404).json({ error: 'Post not found', details: error });
    }
    
    // Fetch user data
    const { data: user } = await supabase
      .from('users')
      .select('handle, display_name, avatar_url')
      .eq('id', post.user_id)
      .single();
    
    const userHandle = user?.handle || 'anonymous';
    const displayName = user?.display_name || 'Anonymous';
    const duration = post.audio_duration ? 
      `${Math.floor(post.audio_duration / 60)}:${String(post.audio_duration % 60).padStart(2, '0')}` : '0:00';
    
    // Format dates
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = date.toLocaleString('en', { month: 'short' });
      return `${month} ${date.getDate()}`;
    };
    
    // Try to generate a simple HTML first
    const simpleHtml = `<!DOCTYPE html>
<html>
<head>
<title>Test</title>
</head>
<body>
<h1>${post.title}</h1>
<p>By ${userHandle}</p>
<audio controls src="${post.audio_url}"></audio>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(simpleHtml);
    
  } catch (error) {
    console.error('Debug embed error:', error);
    res.status(500).json({ 
      error: 'Failed to generate HTML',
      message: error.message,
      stack: error.stack
    });
  }
}
