// Fixed embed endpoint - avoiding template literal issues
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
          <title>Not Found - Gistvox</title>
        </head>
        <body style="font-family: system-ui; text-align: center; padding: 40px;">
          <h2>Post Not Found</h2>
          <p>This audio may be private or doesn't exist.</p>
        </body>
        </html>
      `);
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
      Math.floor(post.audio_duration / 60) + ':' + String(post.audio_duration % 60).padStart(2, '0') : '0:00';
    
    // Format dates
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = date.toLocaleString('en', { month: 'short' });
      return month + ' ' + date.getDate();
    };
    
    // Build HTML using string concatenation instead of template literals
    let html = '<!DOCTYPE html>\n';
    html += '<html lang="en">\n';
    html += '<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
    html += '<title>' + (post.title || 'Untitled') + ' - Gistvox</title>\n';
    html += '<link rel="preconnect" href="https://fonts.googleapis.com">\n';
    html += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
    html += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n';
    
    // Add all the styles
    html += '<style>\n';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
    html += ':root { --primary: #9EBACF; --primary-light: #B8D0E3; --primary-lighter: #D0E0ED; --primary-dark: #7A9AB2; --success: #10B981; --muted: #6b7280; --muted-bg: #f9fafb; --border: #e5e7eb; --text: #1f2937; --text-secondary: #4b5563; --ring-color: rgba(158, 186, 207, 0.3); }\n';
    html += 'body { font-family: Inter, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 350px; padding: 16px; background: linear-gradient(135deg, #f0f4f8 0%, #e8f0f7 100%); color: var(--text); }\n';
    html += '.gistvox-player { background: white; border-radius: 16px; padding: 14px; width: 100%; max-width: 380px; min-height: 320px; position: relative; transition: all 0.3s ease; box-shadow: 0 2px 16px rgba(158, 186, 207, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05); border: 2px solid var(--ring-color); }\n';
    html += '.now-playing { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); font-weight: 500; margin-bottom: 20px; }\n';
    html += '.progress-container { position: relative; width: 100%; height: 44px; display: flex; align-items: center; cursor: pointer; margin-bottom: 8px; }\n';
    html += '.progress-track { width: 100%; height: 8px; background: rgba(107, 114, 128, 0.2); border-radius: 999px; position: relative; overflow: hidden; }\n';
    html += '.progress-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--primary); border-radius: 999px; transition: width 0.1s; }\n';
    html += '.time-display { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); font-family: monospace; margin-bottom: 16px; }\n';
    html += '.controls { display: flex; justify-content: center; align-items: center; gap: 24px; margin: 20px 0; }\n';
    html += '.control-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--text); }\n';
    html += '.control-btn:hover { transform: scale(1.1); }\n';
    html += '.control-btn svg { width: 24px; height: 24px; }\n';
    html += '.play-btn { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--primary); background: transparent; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }\n';
    html += '.play-btn.playing { background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%); }\n';
    html += '.play-btn svg { width: 28px; height: 28px; color: var(--primary); }\n';
    html += '.play-btn.playing svg { color: white; }\n';
    html += '.stats-text { text-align: center; font-size: 11px; color: var(--muted); margin-top: 20px; }\n';
    html += '.title { font-size: 16px; font-weight: 600; margin-bottom: 8px; text-align: center; }\n';
    html += '.meta { font-size: 12px; color: var(--muted); text-align: center; margin-bottom: 20px; }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    
    // Add the player HTML
    html += '<div class="gistvox-player">\n';
    html += '  <div class="now-playing">Now Playing</div>\n';
    html += '  <h3 class="title">' + (post.title || 'Untitled Story') + '</h3>\n';
    html += '  <div class="meta">@' + userHandle + ' • ' + formatDate(post.created_at) + ' • ' + duration + '</div>\n';
    html += '  <div class="progress-container" id="progressContainer">\n';
    html += '    <div class="progress-track" id="progressTrack">\n';
    html += '      <div class="progress-fill" id="progressFill" style="width:0%"></div>\n';
    html += '    </div>\n';
    html += '  </div>\n';
    html += '  <div class="time-display">\n';
    html += '    <span id="currentTime">0:00</span>\n';
    html += '    <span id="duration">' + duration + '</span>\n';
    html += '  </div>\n';
    html += '  <div class="controls">\n';
    html += '    <button class="control-btn" id="skipBack" aria-label="Rewind 15 seconds">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20">\n';
    html += '        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '    <button class="control-btn play-btn" id="playBtn" aria-label="Play/Pause">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20" id="playIcon">\n';
    html += '        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>\n';
    html += '      </svg>\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20" id="pauseIcon" style="display:none">\n';
    html += '        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '    <button class="control-btn" id="skipForward" aria-label="Skip forward 15 seconds">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20">\n';
    html += '        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '  </div>\n';
    html += '  <audio id="audioPlayer" preload="metadata">\n';
    html += '    <source src="' + post.audio_url + '" type="audio/mpeg">\n';
    html += '  </audio>\n';
    html += '  <div class="stats-text">\n';
    html += '    ' + (post.listens_count || 0) + ' listens • ' + (post.likes_count || 0) + ' likes • ' + (post.saves_count || 0) + ' saves • ' + (post.shares_count || 0) + ' shares\n';
    html += '  </div>\n';
    html += '</div>\n';
    
    // Add JavaScript
    html += '<script>\n';
    html += 'const postId = "' + id + '";\n';
    html += 'const audio = document.getElementById("audioPlayer");\n';
    html += 'const playBtn = document.getElementById("playBtn");\n';
    html += 'const playIcon = document.getElementById("playIcon");\n';
    html += 'const pauseIcon = document.getElementById("pauseIcon");\n';
    html += 'const progressContainer = document.getElementById("progressContainer");\n';
    html += 'const progressFill = document.getElementById("progressFill");\n';
    html += 'const currentTimeEl = document.getElementById("currentTime");\n';
    html += 'const skipBack = document.getElementById("skipBack");\n';
    html += 'const skipForward = document.getElementById("skipForward");\n';
    html += 'const SKIP_SECONDS = 15;\n';
    html += 'let hasTrackedListen = false;\n';
    
    html += 'function formatTime(seconds) {\n';
    html += '  const m = Math.floor(seconds / 60);\n';
    html += '  const s = Math.floor(seconds % 60);\n';
    html += '  return m + ":" + s.toString().padStart(2, "0");\n';
    html += '}\n';
    
    html += 'playBtn.addEventListener("click", function() {\n';
    html += '  if (audio.paused) { audio.play(); } else { audio.pause(); }\n';
    html += '});\n';
    
    html += 'audio.addEventListener("play", function() {\n';
    html += '  playIcon.style.display = "none";\n';
    html += '  pauseIcon.style.display = "block";\n';
    html += '  playBtn.classList.add("playing");\n';
    html += '  if (!hasTrackedListen) { trackListen(); }\n';
    html += '});\n';
    
    html += 'audio.addEventListener("pause", function() {\n';
    html += '  playIcon.style.display = "block";\n';
    html += '  pauseIcon.style.display = "none";\n';
    html += '  playBtn.classList.remove("playing");\n';
    html += '});\n';
    
    html += 'skipBack.addEventListener("click", function() {\n';
    html += '  audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);\n';
    html += '});\n';
    
    html += 'skipForward.addEventListener("click", function() {\n';
    html += '  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + SKIP_SECONDS);\n';
    html += '});\n';
    
    html += 'audio.addEventListener("timeupdate", function() {\n';
    html += '  if (audio.duration) {\n';
    html += '    const percent = (audio.currentTime / audio.duration) * 100;\n';
    html += '    progressFill.style.width = percent + "%";\n';
    html += '    currentTimeEl.textContent = formatTime(audio.currentTime);\n';
    html += '  }\n';
    html += '});\n';
    
    html += 'progressContainer.addEventListener("click", function(e) {\n';
    html += '  const rect = progressContainer.getBoundingClientRect();\n';
    html += '  const percent = ((e.clientX - rect.left) / rect.width) * 100;\n';
    html += '  if (audio.duration) {\n';
    html += '    audio.currentTime = (percent / 100) * audio.duration;\n';
    html += '  }\n';
    html += '});\n';
    
    html += 'async function trackListen() {\n';
    html += '  hasTrackedListen = true;\n';
    html += '  try {\n';
    html += '    const response = await fetch("https://vrcshstpoimwpwyyamvq.supabase.co/rest/v1/rpc/track_embed_listen", {\n';
    html += '      method: "POST",\n';
    html += '      headers: {\n';
    html += '        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc",\n';
    html += '        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc",\n';
    html += '        "Content-Type": "application/json"\n';
    html += '      },\n';
    html += '      body: JSON.stringify({ p_post_id: postId })\n';
    html += '    });\n';
    html += '    if (response.ok) {\n';
    html += '      const result = await response.json();\n';
    html += '      console.log("Listen tracked:", result);\n';
    html += '    }\n';
    html += '  } catch (error) {\n';
    html += '    console.error("Error tracking listen:", error);\n';
    html += '  }\n';
    html += '}\n';
    html += '</script>\n';
    
    html += '</body>\n';
    html += '</html>';
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
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
