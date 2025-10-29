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
      .select('id, title, description, audio_url, audio_duration, created_at, user_id, audience_type, listens_count, likes_count, saves_count, shares_count')
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
          background: linear-gradient(135deg, #D0E0ED 0%, #B8D0E3 100%);
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
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          padding: 12px;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
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
          color: #9EBACF;
          font-weight: 600;
        }
        .description {
          text-align: center;
          color: #4a5568;
          margin-bottom: 30px;
          line-height: 1.6;
          padding: 0 20px;
        }
        /* Custom Audio Player */
        .audio-player {
          background: #f7f9fc;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .player-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .now-playing {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
        .audio-bars {
          display: none;
          align-items: center;
          gap: 2px;
          height: 12px;
        }
        .audio-bars.playing {
          display: flex;
        }
        .audio-bar {
          width: 3px;
          background: #9EBACF;
          border-radius: 2px;
          animation: wave 0.8s ease-in-out infinite;
        }
        .audio-bar:nth-child(1) { animation-delay: 0s; height: 40%; }
        .audio-bar:nth-child(2) { animation-delay: 0.1s; height: 60%; }
        .audio-bar:nth-child(3) { animation-delay: 0.2s; height: 50%; }
        .audio-bar:nth-child(4) { animation-delay: 0.3s; height: 70%; }
        .audio-bar:nth-child(5) { animation-delay: 0.4s; height: 45%; }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .progress-container {
          position: relative;
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .progress-track {
          width: 100%;
          height: 8px;
          background: rgba(107, 114, 128, 0.2);
          border-radius: 999px;
          position: relative;
          overflow: hidden;
        }
        .progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: #9EBACF;
          border-radius: 999px;
          transition: width 0.1s;
        }
        .time-display {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
          margin-bottom: 16px;
        }
        .controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
        }
        .control-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #1f2937;
        }
        .control-btn:hover {
          transform: scale(1.1);
        }
        .control-btn svg {
          width: 24px;
          height: 24px;
        }
        .play-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid #9EBACF;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .play-btn.playing {
          background: linear-gradient(135deg, #B8D0E3, #9EBACF);
        }
        .play-btn.playing svg {
          color: white;
        }
        .play-btn svg {
          width: 28px;
          height: 28px;
          color: #9EBACF;
        }
        .stats-bar {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          font-family: monospace;
          margin-bottom: 24px;
        }
        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 24px;
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
          background: linear-gradient(135deg, #9EBACF, #7A9AB2);
          color: white;
          box-shadow: 0 4px 15px rgba(158,186,207,0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(158,186,207,0.6);
        }
        .btn-secondary {
          background: white;
          color: #9EBACF;
          border: 2px solid #9EBACF;
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
        
        // Audio Player Functionality
        document.addEventListener('DOMContentLoaded', function() {
          const audio = document.getElementById('audioPlayer');
          const playBtn = document.getElementById('playBtn');
          const playIcon = document.getElementById('playIcon');
          const pauseIcon = document.getElementById('pauseIcon');
          const progressContainer = document.getElementById('progressContainer');
          const progressFill = document.getElementById('progressFill');
          const currentTimeEl = document.getElementById('currentTime');
          const durationEl = document.getElementById('duration');
          const audioBars = document.getElementById('audioBars');
          const skipBack = document.getElementById('skipBack');
          const skipForward = document.getElementById('skipForward');
          const listensCount = document.getElementById('listensCount');
          const SKIP_SECONDS = 15;
          
          let hasTrackedListen = false;
          const sessionKey = 'gistvox_listened_${id}';
          
          // Format time helper
          function formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return m + ':' + s.toString().padStart(2, '0');
          }
          
          function formatWithCommas(num) {
            return num.toString().replace(/\\\\B(?=(\\\\d{3})+(?!\\\\d))/g, ',');
          }
          
          // Track listen to Supabase
          async function trackListen() {
            if (hasTrackedListen) return;
            if (sessionStorage.getItem(sessionKey)) {
              hasTrackedListen = true;
              return;
            }
            
            try {
              const response = await fetch('https://vrcshstpoimwpwyyamvq.supabase.co/rest/v1/rpc/track_embed_listen', {
                method: 'POST',
                headers: {
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc',
                  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_post_id: '${id}' })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log('Listen tracked:', result);
                
                // Update displayed count
                if (result.count && listensCount) {
                  listensCount.textContent = formatWithCommas(result.count);
                }
              }
              
              hasTrackedListen = true;
              sessionStorage.setItem(sessionKey, 'true');
              
            } catch (error) {
              console.error('Error tracking listen:', error);
            }
          }
          
          // Play/Pause
          playBtn.addEventListener('click', function() {
            if (audio.paused) {
              audio.play();
            } else {
              audio.pause();
            }
          });
          
          // Handle play event
          audio.addEventListener('play', function() {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playBtn.classList.add('playing');
            audioBars.classList.add('playing');
            
            // Track listen when play starts
            trackListen();
          });
          
          // Handle pause event
          audio.addEventListener('pause', function() {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playBtn.classList.remove('playing');
            audioBars.classList.remove('playing');
          });
          
          // Skip controls
          skipBack.addEventListener('click', function() {
            audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
          });
          
          skipForward.addEventListener('click', function() {
            audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + SKIP_SECONDS);
          });
          
          // Duration
          audio.addEventListener('loadedmetadata', function() {
            if (isFinite(audio.duration)) {
              durationEl.textContent = formatTime(audio.duration);
            }
          });
          
          // Progress update
          audio.addEventListener('timeupdate', function() {
            if (audio.duration) {
              const percent = (audio.currentTime / audio.duration) * 100;
              progressFill.style.width = percent + '%';
              currentTimeEl.textContent = formatTime(audio.currentTime);
            }
          });
          
          // Click on progress bar to seek
          progressContainer.addEventListener('click', function(e) {
            const rect = progressContainer.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            if (audio.duration) {
              audio.currentTime = (percent / 100) * audio.duration;
            }
          });
        });
      </script>
      ` : ''}
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" alt="Gistvox">
        </div>
        
        <h1>${post.title}</h1>
        
        <div class="meta">
          By <span>@${userHandle}</span> • ${duration} • ${new Date(post.created_at).toLocaleDateString()}
        </div>
        
        ${post.description ? `
        <div class="description">
          ${post.description.substring(0, 200)}${post.description.length > 200 ? '...' : ''}
        </div>
        ` : ''}
        
        <div class="audio-player">
          <div class="player-header">
            <div class="now-playing">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="color: #9EBACF;">
                <path d="M10 3.22L6.603 6H3a1 1 0 00-1 1v6a1 1 0 001 1h3.603L10 16.78V3.22zM14.82 4.58a7.023 7.023 0 010 10.84l-.71-.71a5.975 5.975 0 000-8.42l.71-.71z"/>
              </svg>
              <span>Now Playing</span>
              <div class="audio-bars" id="audioBars">
                <div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div>
              </div>
            </div>
            <img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" alt="Gistvox" height="20">
          </div>
          
          <div class="progress-container" id="progressContainer">
            <div class="progress-track" id="progressTrack">
              <div class="progress-fill" id="progressFill" style="width:0%"></div>
            </div>
          </div>
          
          <div class="time-display">
            <span id="currentTime">0:00</span>
            <span id="duration">${duration}</span>
          </div>
          
          <div class="controls">
            <button class="control-btn" id="skipBack" aria-label="Rewind 15 seconds">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
              </svg>
            </button>
            <button class="control-btn play-btn" id="playBtn" aria-label="Play/Pause">
              <svg fill="currentColor" viewBox="0 0 20 20" id="playIcon">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
              </svg>
              <svg fill="currentColor" viewBox="0 0 20 20" id="pauseIcon" style="display:none">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
              </svg>
            </button>
            <button class="control-btn" id="skipForward" aria-label="Skip forward 15 seconds">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
              </svg>
            </button>
          </div>
          
          <audio id="audioPlayer" preload="metadata">
            <source src="${post.audio_url}" type="audio/mpeg">
          </audio>
        </div>
        
        <div class="stats-bar" id="statsBar">
          <span id="listensCount">${post.listens_count || 0}</span> listens • 
          <span id="likesCount">${post.likes_count || 0}</span> likes • 
          <span id="savesCount">${post.saves_count || 0}</span> saves • 
          <span id="sharesCount">${post.shares_count || 0}</span> shares
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