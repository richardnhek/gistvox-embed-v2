// Embed endpoint for Twitter player cards - hosted on same Vercel deployment
export default async function handler(req, res) {
  const { id } = req.query;
  
  // Twitter requires very specific iframe content
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gistvox Player</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffff;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.player-container {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.loading {
  text-align: center;
  color: #6b7280;
  padding: 40px;
}
.error {
  text-align: center;
  color: #ef4444;
  padding: 40px;
}
.audio-player {
  width: 100%;
  margin: 16px 0;
}
.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}
.meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}
.logo {
  display: inline-block;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  text-align: center;
  line-height: 32px;
  color: white;
  font-weight: bold;
  margin-bottom: 16px;
}
</style>
</head>
<body>
<div class="player-container">
  <div id="player" class="loading">Loading...</div>
</div>
<script>
(async function() {
  const postId = '${id}';
  const container = document.getElementById('player');
  
  if (!postId) {
    container.innerHTML = '<div class="error">Invalid post ID</div>';
    return;
  }
  
  try {
    // Fetch post data from Supabase
    const SUPABASE_URL = 'https://vrcshstpoimwpwyyamvq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkyMDE3NjksImV4cCI6MjAyNDc3Nzc2OX0.7kaqnRoUxj9mFmsOXWqwKt2pLCW9wvN9CqcrHp2N_0Y';
    
    const response = await fetch(
      \`\${SUPABASE_URL}/rest/v1/posts?id=eq.\${postId}&select=id,title,audio_url,audio_duration,user_id,audience_type\`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
      }
    );
    
    const data = await response.json();
    const post = data[0];
    
    if (!post) {
      container.innerHTML = '<div class="error">Post not found</div>';
      return;
    }
    
    if (post.audience_type !== 'public') {
      container.innerHTML = '<div class="error">Private post</div>';
      return;
    }
    
    // Fetch user data
    const userResponse = await fetch(
      \`\${SUPABASE_URL}/rest/v1/users?id=eq.\${post.user_id}&select=handle,display_name\`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
      }
    );
    
    const userData = await userResponse.json();
    const user = userData[0];
    const userHandle = user?.handle || 'anonymous';
    const duration = post.audio_duration ? 
      \`\${Math.floor(post.audio_duration / 60)}:\${String(post.audio_duration % 60).padStart(2, '0')}\` : '';
    
    // Render player
    container.innerHTML = \`
      <div class="logo">G</div>
      <div class="title">\${post.title}</div>
      <div class="meta">@\${userHandle} • \${duration}</div>
      <audio class="audio-player" controls preload="metadata">
        <source src="\${post.audio_url}" type="audio/mpeg">
        Your browser does not support audio playback.
      </audio>
    \`;
  } catch (error) {
    console.error('Error loading post:', error);
    container.innerHTML = '<div class="error">Failed to load audio</div>';
  }
})();
</script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'max-age=3600');
  res.status(200).send(html);
}
