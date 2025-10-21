// Embed endpoint for Twitter player cards - server-side rendered
export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Error - Gistvox</title>
      </head>
      <body style="font-family: system-ui; text-align: center; padding: 40px;">
        <h1>Invalid Request</h1>
        <p>Missing post ID</p>
      </body>
      </html>
    `);
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
      .select('id, title, description, audio_url, audio_duration, created_at, user_id, audience_type')
      .eq('id', id)
      .eq('audience_type', 'public')
      .single();
    
    if (error || !post) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Not Found - Gistvox</title>
          <style>
            body {
              font-family: -apple-system, system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .error {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
              color: #ef4444;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Post Not Found</h2>
            <p>This audio may be private or doesn't exist.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Fetch user data
    const { data: user } = await supabase
      .from('users')
      .select('handle, display_name')
      .eq('id', post.user_id)
      .single();
    
    const userHandle = user?.handle || 'anonymous';
    const displayName = user?.display_name || 'Anonymous';
    const duration = post.audio_duration ? 
      `${Math.floor(post.audio_duration / 60)}:${String(post.audio_duration % 60).padStart(2, '0')}` : '';
    
    // Generate the HTML with embedded player
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${post.title} - Gistvox</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .player-card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin: 0 auto 24px;
    }
    
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      text-align: center;
    }
    
    .meta {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .meta span {
      color: #667eea;
      font-weight: 600;
    }
    
    .description {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 24px;
      text-align: center;
      padding: 0 16px;
    }
    
    .audio-wrapper {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    audio {
      width: 100%;
      height: 54px;
      outline: none;
    }
    
    /* Custom audio controls styling */
    audio::-webkit-media-controls-panel {
      background: #f9fafb;
    }
    
    .stats {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      margin-top: 24px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .branding {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .branding a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    
    .branding a:hover {
      color: #764ba2;
    }
    
    /* Animation */
    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    
    .player-card {
      animation: slideUp 0.5s ease-out;
    }
    
    /* Responsive */
    @media (max-width: 500px) {
      .player-card {
        padding: 24px;
      }
      
      .title {
        font-size: 20px;
      }
      
      .logo {
        width: 50px;
        height: 50px;
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="player-card">
    <div class="logo">G</div>
    
    <h1 class="title">${post.title}</h1>
    
    <div class="meta">
      by <span>@${userHandle}</span> • ${duration} • ${new Date(post.created_at).toLocaleDateString()}
    </div>
    
    ${post.description ? `
    <div class="description">
      ${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}
    </div>
    ` : ''}
    
    <div class="audio-wrapper">
      <audio controls preload="metadata" controlsList="nodownload">
        <source src="${post.audio_url}" type="audio/mpeg">
        <source src="${post.audio_url}" type="audio/ogg">
        Your browser does not support the audio element.
      </audio>
    </div>
    
    <div class="branding">
      <a href="https://gistvox.com" target="_blank">🎙️ Powered by Gistvox</a>
    </div>
  </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding in iframes
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Embed error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Error - Gistvox</title>
      </head>
      <body style="font-family: system-ui; text-align: center; padding: 40px;">
        <h1>Server Error</h1>
        <p>Failed to load audio player</p>
      </body>
      </html>
    `);
  }
}
