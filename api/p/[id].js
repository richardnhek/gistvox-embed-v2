export default async function handler(req, res) {
  const { id } = req.query;
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Import Supabase client dynamically to avoid build issues
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
          <title>Post Not Found - Gistvox</title>
        </head>
        <body style="font-family: system-ui; text-align: center; padding: 40px;">
          <h1>Post Not Found</h1>
          <p>This post may be private or doesn't exist.</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Error: ${error?.message || 'Post not found'}
          </p>
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
    const duration = post.audio_duration ? `${Math.floor(post.audio_duration / 60)}:${String(post.audio_duration % 60).padStart(2, '0')}` : '';
    
    // Branch.io deep link for app opening
    const branchDomain = process.env.BRANCH_DOMAIN || 'gistvox.app.link';
    const branchLink = `https://${branchDomain}/post/${id}`;
    
    // Check if this is a crawler/bot (for meta tags)
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
    
    // Both bots AND users get the same HTML with meta tags
    // But users see a nice landing page instead of instant redirect
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${post.title} by @${userHandle} - Gistvox</title>
      
      <!-- Open Graph for Facebook, LinkedIn, WhatsApp -->
      <meta property="og:type" content="music.song" />
      <meta property="og:title" content="${post.title}" />
      <meta property="og:description" content="By @${userHandle} • ${duration} • Listen on Gistvox" />
      <meta property="og:url" content="https://${req.headers.host}/p/${id}" />
      <meta property="og:image" content="https://${req.headers.host}/og/${id}.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Gistvox" />
      <meta property="og:audio" content="${post.audio_url}" />
      
      <!-- Twitter/X Player Card - Enables playable audio in tweets! -->
      <meta name="twitter:card" content="player" />
      <meta name="twitter:site" content="@gistvox" />
      <meta name="twitter:title" content="${post.title}" />
      <meta name="twitter:description" content="By @${userHandle} • ${duration}" />
      <meta name="twitter:image" content="https://${req.headers.host}/og/${id}.png" />
      <meta name="twitter:player" content="https://${req.headers.host}/embed/${id}?v=2" />
      <meta name="twitter:player:width" content="480" />
      <meta name="twitter:player:height" content="400" />
      
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 30px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 30px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 36px;
          font-weight: bold;
        }
        h1 {
          text-align: center;
          color: #1a1a1a;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .meta {
          text-align: center;
          color: #666;
          margin-bottom: 20px;
          font-size: 16px;
        }
        .meta span {
          color: #667eea;
          font-weight: 600;
        }
        .description {
          text-align: center;
          color: #4a5568;
          margin-bottom: 30px;
          line-height: 1.6;
          padding: 0 20px;
        }
        .player-container {
          background: #f7f9fc;
          border-radius: 16px;
          padding: 8px;
          margin-bottom: 30px;
        }
        .player-container iframe {
          border-radius: 12px;
        }
        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          padding: 14px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 15px rgba(102,126,234,0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102,126,234,0.6);
        }
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        .btn-secondary:hover {
          background: #f7f9fc;
        }
        .app-links {
          margin-top: 20px;
          text-align: center;
        }
        .app-links a {
          display: inline-block;
          margin: 0 10px;
        }
        .app-links img {
          height: 40px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          .container {
            padding: 30px 20px;
          }
          h1 {
            font-size: 24px;
          }
          .btn {
            width: 100%;
          }
        }
      </style>
      
      ${!isBot ? `
      <script>
        // Try to detect if app is installed (works on some platforms)
        function tryOpenApp() {
          const startTime = Date.now();
          
          // Try to open the app
          window.location.href = '${branchLink}';
          
          // If still here after 2.5 seconds, app probably not installed
          setTimeout(() => {
            if (Date.now() - startTime < 3000) {
              // User is still here, show app store options
              if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                window.location.href = 'https://apps.apple.com/app/gistvox/id6751720190';
              } else if (/Android/i.test(navigator.userAgent)) {
                window.location.href = 'https://play.google.com/store/apps/details?id=com.gistvox.app';
              }
            }
          }, 2500);
        }
      </script>
      ` : ''}
    </head>
    <body>
      <div class="container">
        <div class="logo">G</div>
        
        <h1>${post.title}</h1>
        
        <div class="meta">
          By <span>@${userHandle}</span> • ${duration} • ${new Date(post.created_at).toLocaleDateString()}
        </div>
        
        ${post.description ? `
        <div class="description">
          ${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}
        </div>
        ` : ''}
        
        <div class="player-container">
          <iframe 
            src="https://${req.headers.host}/embed/${id}" 
            width="100%" 
            height="380" 
            frameborder="0"
            allow="autoplay">
          </iframe>
        </div>
        
        <div class="buttons">
          <a href="${branchLink}" class="btn btn-primary" ${!isBot ? 'onclick="tryOpenApp(); return false;"' : ''}>
            📱 Open in Gistvox App
          </a>
          <a href="https://gistvox.com" class="btn btn-secondary">
            🌐 Visit Website
          </a>
        </div>
        
        <div class="app-links">
          <a href="https://apps.apple.com/app/gistvox/id6751720190" title="Download on App Store">
            <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store">
          </a>
        </div>
        
        <div class="footer">
          <p>🎙️ Gistvox - Share your audio stories</p>
        </div>
      </div>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}