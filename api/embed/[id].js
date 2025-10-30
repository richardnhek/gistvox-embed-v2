// Beautiful embed endpoint with enhanced UI - avoiding template literal issues
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
    const displayName = user?.display_name || user?.handle || 'Anonymous';
    const duration = post.audio_duration ? 
      Math.floor(post.audio_duration / 60) + ':' + String(post.audio_duration % 60).padStart(2, '0') : '0:00';
    
    // Format dates
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const month = date.toLocaleString('en', { month: 'short' });
      return month + ' ' + date.getDate();
    };
    
    // Build HTML using string concatenation
    let html = '<!DOCTYPE html>\n';
    html += '<html lang="en">\n';
    html += '<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
    html += '<title>' + (post.title || 'Untitled') + ' - Gistvox</title>\n';
    html += '<link rel="preconnect" href="https://fonts.googleapis.com">\n';
    html += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
    html += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;600&display=swap" rel="stylesheet">\n';
    
    // Add comprehensive styles
    html += '<style>\n';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
    html += ':root {\n';
    html += '  --primary: #9EBACF;\n';
    html += '  --primary-light: #B8D0E3;\n';
    html += '  --primary-lighter: #D0E0ED;\n';
    html += '  --primary-dark: #7A9AB2;\n';
    html += '  --success: #10B981;\n';
    html += '  --muted: #6b7280;\n';
    html += '  --muted-bg: #f9fafb;\n';
    html += '  --border: #e5e7eb;\n';
    html += '  --text: #1f2937;\n';
    html += '  --text-secondary: #4b5563;\n';
    html += '  --ring-color: rgba(158, 186, 207, 0.3);\n';
    html += '}\n';
    
    html += 'body {\n';
    html += '  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  justify-content: center;\n';
    html += '  min-height: 400px;\n';
    html += '  padding: 16px;\n';
    html += '  background: linear-gradient(135deg, #f0f4f8 0%, #e8f0f7 100%);\n';
    html += '  color: var(--text);\n';
    html += '}\n';
    
    html += '.gistvox-player {\n';
    html += '  background: white;\n';
    html += '  border-radius: 20px;\n';
    html += '  padding: 20px;\n';
    html += '  width: 100%;\n';
    html += '  max-width: 420px;\n';
    html += '  min-height: 460px;\n';
    html += '  position: relative;\n';
    html += '  transition: all 0.3s ease;\n';
    html += '  box-shadow: 0 20px 40px rgba(158, 186, 207, 0.2), 0 8px 16px rgba(0, 0, 0, 0.08);\n';
    html += '  border: 1px solid rgba(158, 186, 207, 0.2);\n';
    html += '}\n';
    
    html += '.gistvox-player.playing {\n';
    html += '  transform: translateY(-2px);\n';
    html += '  box-shadow: 0 24px 48px rgba(158, 186, 207, 0.25), 0 12px 24px rgba(0, 0, 0, 0.1);\n';
    html += '}\n';
    
    // Brand header styles
    html += '.brand-header {\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  justify-content: space-between;\n';
    html += '  margin-bottom: 24px;\n';
    html += '}\n';
    
    html += '.now-playing-label {\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  gap: 8px;\n';
    html += '  font-size: 12px;\n';
    html += '  font-weight: 500;\n';
    html += '  color: var(--muted);\n';
    html += '  letter-spacing: 0.5px;\n';
    html += '  text-transform: uppercase;\n';
    html += '}\n';
    
    html += '.volume-icon {\n';
    html += '  width: 16px;\n';
    html += '  height: 16px;\n';
    html += '  color: var(--primary);\n';
    html += '}\n';
    
    html += '.audio-bars {\n';
    html += '  display: none;\n';
    html += '  align-items: center;\n';
    html += '  gap: 2px;\n';
    html += '  height: 14px;\n';
    html += '}\n';
    
    html += '.audio-bars.active {\n';
    html += '  display: flex;\n';
    html += '}\n';
    
    html += '.audio-bar {\n';
    html += '  width: 3px;\n';
    html += '  background: linear-gradient(to top, var(--primary), var(--primary-light));\n';
    html += '  border-radius: 2px;\n';
    html += '  animation: wave 0.8s ease-in-out infinite;\n';
    html += '}\n';
    
    html += '.audio-bar:nth-child(1) { animation-delay: 0s; height: 40%; }\n';
    html += '.audio-bar:nth-child(2) { animation-delay: 0.1s; height: 60%; }\n';
    html += '.audio-bar:nth-child(3) { animation-delay: 0.2s; height: 50%; }\n';
    html += '.audio-bar:nth-child(4) { animation-delay: 0.3s; height: 70%; }\n';
    html += '.audio-bar:nth-child(5) { animation-delay: 0.4s; height: 45%; }\n';
    
    html += '@keyframes wave {\n';
    html += '  0%, 100% { transform: scaleY(0.5); }\n';
    html += '  50% { transform: scaleY(1); }\n';
    html += '}\n';
    
    html += '.gistvox-link {\n';
    html += '  opacity: 0.8;\n';
    html += '  transition: opacity 0.2s;\n';
    html += '}\n';
    
    html += '.gistvox-link:hover {\n';
    html += '  opacity: 1;\n';
    html += '}\n';
    
    // User section styles
    html += '.user-section {\n';
    html += '  display: flex;\n';
    html += '  align-items: flex-start;\n';
    html += '  gap: 14px;\n';
    html += '  margin-bottom: 20px;\n';
    html += '}\n';
    
    html += '.avatar {\n';
    html += '  width: 56px;\n';
    html += '  height: 56px;\n';
    html += '  border-radius: 28px;\n';
    html += '  background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--primary) 100%);\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  justify-content: center;\n';
    html += '  color: white;\n';
    html += '  font-size: 20px;\n';
    html += '  font-weight: 600;\n';
    html += '  flex-shrink: 0;\n';
    html += '  overflow: hidden;\n';
    html += '  box-shadow: 0 4px 12px rgba(158, 186, 207, 0.3);\n';
    html += '  position: relative;\n';
    html += '}\n';
    
    html += '.avatar.with-image {\n';
    html += '  background: white;\n';
    html += '  padding: 2px;\n';
    html += '}\n';
    
    html += '.avatar img {\n';
    html += '  width: 100%;\n';
    html += '  height: 100%;\n';
    html += '  object-fit: cover;\n';
    html += '  border-radius: 50%;\n';
    html += '}\n';
    
    html += '.content-info {\n';
    html += '  flex: 1;\n';
    html += '  min-width: 0;\n';
    html += '}\n';
    
    html += '.title {\n';
    html += '  font-size: 17px;\n';
    html += '  font-weight: 600;\n';
    html += '  color: var(--text);\n';
    html += '  line-height: 1.3;\n';
    html += '  margin-bottom: 6px;\n';
    html += '}\n';
    
    html += '.user-handle {\n';
    html += '  font-size: 13px;\n';
    html += '  font-weight: 500;\n';
    html += '  color: var(--primary);\n';
    html += '  margin-bottom: 2px;\n';
    html += '}\n';
    
    html += '.date {\n';
    html += '  font-size: 11px;\n';
    html += '  color: var(--muted);\n';
    html += '}\n';
    
    html += '.description {\n';
    html += '  font-size: 13px;\n';
    html += '  color: var(--text-secondary);\n';
    html += '  line-height: 1.5;\n';
    html += '  margin-bottom: 20px;\n';
    html += '  display: -webkit-box;\n';
    html += '  -webkit-line-clamp: 2;\n';
    html += '  -webkit-box-orient: vertical;\n';
    html += '  overflow: hidden;\n';
    html += '}\n';
    
    // Progress section styles
    html += '.progress-section {\n';
    html += '  margin-bottom: 12px;\n';
    html += '}\n';
    
    html += '.progress-container {\n';
    html += '  position: relative;\n';
    html += '  width: 100%;\n';
    html += '  height: 48px;\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  cursor: pointer;\n';
    html += '}\n';
    
    html += '.progress-track {\n';
    html += '  width: 100%;\n';
    html += '  height: 10px;\n';
    html += '  background: rgba(107, 114, 128, 0.15);\n';
    html += '  border-radius: 999px;\n';
    html += '  position: relative;\n';
    html += '  overflow: hidden;\n';
    html += '  transition: height 0.15s;\n';
    html += '}\n';
    
    html += '.progress-track:hover {\n';
    html += '  height: 12px;\n';
    html += '}\n';
    
    html += '.progress-fill {\n';
    html += '  position: absolute;\n';
    html += '  left: 0;\n';
    html += '  top: 0;\n';
    html += '  height: 100%;\n';
    html += '  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);\n';
    html += '  border-radius: 999px;\n';
    html += '  transition: width 0.1s;\n';
    html += '  box-shadow: 0 2px 8px rgba(158, 186, 207, 0.3);\n';
    html += '}\n';
    
    html += '.progress-thumb {\n';
    html += '  position: absolute;\n';
    html += '  width: 16px;\n';
    html += '  height: 16px;\n';
    html += '  background: white;\n';
    html += '  border: 3px solid var(--primary);\n';
    html += '  border-radius: 50%;\n';
    html += '  top: 50%;\n';
    html += '  transform: translate(-50%, -50%);\n';
    html += '  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);\n';
    html += '  transition: transform 0.15s;\n';
    html += '  opacity: 0;\n';
    html += '}\n';
    
    html += '.progress-container:hover .progress-thumb,\n';
    html += '.progress-thumb.visible {\n';
    html += '  opacity: 1;\n';
    html += '}\n';
    
    html += '.time-display {\n';
    html += '  display: flex;\n';
    html += '  justify-content: space-between;\n';
    html += '  font-family: "Roboto Mono", monospace;\n';
    html += '  font-size: 12px;\n';
    html += '  color: var(--muted);\n';
    html += '  margin-bottom: 24px;\n';
    html += '}\n';
    
    // Controls styles
    html += '.controls {\n';
    html += '  display: flex;\n';
    html += '  justify-content: center;\n';
    html += '  align-items: center;\n';
    html += '  gap: 28px;\n';
    html += '  margin: 24px 0;\n';
    html += '}\n';
    
    html += '.control-btn {\n';
    html += '  background: none;\n';
    html += '  border: none;\n';
    html += '  cursor: pointer;\n';
    html += '  padding: 8px;\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  justify-content: center;\n';
    html += '  transition: all 0.2s;\n';
    html += '  color: var(--text);\n';
    html += '  border-radius: 50%;\n';
    html += '}\n';
    
    html += '.control-btn:hover {\n';
    html += '  background: var(--muted-bg);\n';
    html += '  transform: scale(1.1);\n';
    html += '}\n';
    
    html += '.control-btn.skip {\n';
    html += '  width: 48px;\n';
    html += '  height: 48px;\n';
    html += '}\n';
    
    html += '.control-btn.skip svg {\n';
    html += '  width: 24px;\n';
    html += '  height: 24px;\n';
    html += '}\n';
    
    html += '.play-btn {\n';
    html += '  width: 88px;\n';
    html += '  height: 88px;\n';
    html += '  border-radius: 50%;\n';
    html += '  border: 3px solid var(--primary);\n';
    html += '  background: white;\n';
    html += '  position: relative;\n';
    html += '  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n';
    html += '  box-shadow: 0 8px 24px rgba(158, 186, 207, 0.2);\n';
    html += '}\n';
    
    html += '.play-btn:hover {\n';
    html += '  transform: scale(1.05);\n';
    html += '  box-shadow: 0 12px 32px rgba(158, 186, 207, 0.3);\n';
    html += '}\n';
    
    html += '.play-btn.playing {\n';
    html += '  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);\n';
    html += '  box-shadow: 0 12px 36px rgba(158, 186, 207, 0.4);\n';
    html += '}\n';
    
    html += '.play-btn svg {\n';
    html += '  width: 36px;\n';
    html += '  height: 36px;\n';
    html += '  color: var(--primary);\n';
    html += '}\n';
    
    html += '#playIcon {\n';
    html += '  margin-left: 3px;\n';
    html += '}\n';
    
    html += '.play-btn.playing svg {\n';
    html += '  color: white;\n';
    html += '}\n';
    
    // Action buttons styles
    html += '.action-buttons {\n';
    html += '  display: flex;\n';
    html += '  gap: 10px;\n';
    html += '  margin: 20px 0;\n';
    html += '}\n';
    
    html += '.action-btn {\n';
    html += '  flex: 1;\n';
    html += '  padding: 12px;\n';
    html += '  background: white;\n';
    html += '  border: 1.5px solid var(--border);\n';
    html += '  border-radius: 12px;\n';
    html += '  cursor: pointer;\n';
    html += '  display: flex;\n';
    html += '  align-items: center;\n';
    html += '  justify-content: center;\n';
    html += '  gap: 6px;\n';
    html += '  font-size: 13px;\n';
    html += '  color: var(--text);\n';
    html += '  font-weight: 500;\n';
    html += '  transition: all 0.2s;\n';
    html += '  font-family: "Inter", sans-serif;\n';
    html += '}\n';
    
    html += '.action-btn:hover {\n';
    html += '  background: var(--muted-bg);\n';
    html += '  border-color: var(--primary);\n';
    html += '  transform: translateY(-1px);\n';
    html += '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n';
    html += '}\n';
    
    html += '.action-btn svg {\n';
    html += '  width: 16px;\n';
    html += '  height: 16px;\n';
    html += '}\n';
    
    // Stats bar styles
    html += '.stats-bar {\n';
    html += '  background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);\n';
    html += '  border-radius: 12px;\n';
    html += '  padding: 12px 14px;\n';
    html += '  text-align: center;\n';
    html += '}\n';
    
    html += '.stats-text {\n';
    html += '  font-family: "Roboto Mono", monospace;\n';
    html += '  font-size: 12px;\n';
    html += '  font-weight: 400;\n';
    html += '  color: var(--muted);\n';
    html += '  letter-spacing: -0.2px;\n';
    html += '}\n';
    
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    
    // Add the enhanced player HTML
    html += '<div class="gistvox-player" id="player">\n';
    
    // Brand header
    html += '  <div class="brand-header">\n';
    html += '    <div class="now-playing-label">\n';
    html += '      <svg class="volume-icon" fill="currentColor" viewBox="0 0 20 20">\n';
    html += '        <path d="M10 3.22L6.603 6H3a1 1 0 00-1 1v6a1 1 0 001 1h3.603L10 16.78V3.22zM14.82 4.58a7.023 7.023 0 010 10.84l-.71-.71a5.975 5.975 0 000-8.42l.71-.71z"/>\n';
    html += '      </svg>\n';
    html += '      <span>Now Playing</span>\n';
    html += '      <div class="audio-bars" id="audioBars">\n';
    html += '        <div class="audio-bar"></div>\n';
    html += '        <div class="audio-bar"></div>\n';
    html += '        <div class="audio-bar"></div>\n';
    html += '        <div class="audio-bar"></div>\n';
    html += '        <div class="audio-bar"></div>\n';
    html += '      </div>\n';
    html += '    </div>\n';
    html += '    <a href="https://gistvox.app.link/post/' + id + '" target="_blank" class="gistvox-link">\n';
    html += '      <img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" alt="Gistvox" height="24">\n';
    html += '    </a>\n';
    html += '  </div>\n';
    
    // User section
    html += '  <div class="user-section">\n';
    const avatarClass = user?.avatar_url ? 'avatar with-image' : 'avatar';
    html += '    <div class="' + avatarClass + '">\n';
    if (user?.avatar_url) {
      html += '      <img src="' + user.avatar_url + '" alt="' + displayName + '">\n';
    } else {
      html += '      <img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" alt="Gistvox" style="width: 70%; height: 70%; object-fit: contain;">\n';
    }
    html += '    </div>\n';
    html += '    <div class="content-info">\n';
    html += '      <h3 class="title">' + (post.title || 'Untitled Story') + '</h3>\n';
    html += '      <div class="user-handle">@' + userHandle + '</div>\n';
    html += '      <div class="date">' + formatDate(post.created_at) + ' • ' + duration + '</div>\n';
    html += '    </div>\n';
    html += '  </div>\n';
    
    // Description if exists
    if (post.description) {
      html += '  <p class="description">' + post.description.substring(0, 150) + (post.description.length > 150 ? '...' : '') + '</p>\n';
    }
    
    // Progress section
    html += '  <div class="progress-section">\n';
    html += '    <div class="progress-container" id="progressContainer">\n';
    html += '      <div class="progress-track" id="progressTrack">\n';
    html += '        <div class="progress-fill" id="progressFill" style="width:0%"></div>\n';
    html += '        <div class="progress-thumb" id="progressThumb" style="left:0%"></div>\n';
    html += '      </div>\n';
    html += '    </div>\n';
    html += '    <div class="time-display">\n';
    html += '      <span id="currentTime">0:00</span>\n';
    html += '      <span id="duration">' + duration + '</span>\n';
    html += '    </div>\n';
    html += '  </div>\n';
    
    // Controls
    html += '  <div class="controls">\n';
    html += '    <button class="control-btn skip" id="skipBack" aria-label="Rewind 15 seconds">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20">\n';
    html += '        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '    <button class="control-btn play-btn" id="playBtn" aria-label="Play/Pause">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 24 24" id="playIcon">\n';
    html += '        <path d="M8 5v14l11-7z"/>\n';
    html += '      </svg>\n';
    html += '      <svg fill="currentColor" viewBox="0 0 24 24" id="pauseIcon" style="display:none">\n';
    html += '        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '    <button class="control-btn skip" id="skipForward" aria-label="Skip forward 15 seconds">\n';
    html += '      <svg fill="currentColor" viewBox="0 0 20 20">\n';
    html += '        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>\n';
    html += '      </svg>\n';
    html += '    </button>\n';
    html += '  </div>\n';
    
    // Action buttons
    html += '  <div class="action-buttons">\n';
    html += '    <button class="action-btn" id="shareBtn">\n';
    html += '      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">\n';
    html += '        <path stroke-linecap="round" stroke-linejoin="round" d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z"/>\n';
    html += '      </svg>\n';
    html += '      <span>Share</span>\n';
    html += '    </button>\n';
    html += '    <button class="action-btn" id="openAppBtn">\n';
    html += '      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">\n';
    html += '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>\n';
    html += '      </svg>\n';
    html += '      <span>Open in App</span>\n';
    html += '    </button>\n';
    html += '  </div>\n';
    
    // Stats bar
    html += '  <div class="stats-bar">\n';
    html += '    <div class="stats-text">\n';
    html += '      <span id="listensCount">' + (post.listens_count || 0) + '</span> listens • ';
    html += '<span id="likesCount">' + (post.likes_count || 0) + '</span> likes • ';
    html += '<span id="savesCount">' + (post.saves_count || 0) + '</span> saves • ';
    html += '<span id="sharesCount">' + (post.shares_count || 0) + '</span> shares\n';
    html += '    </div>\n';
    html += '  </div>\n';
    
    html += '  <audio id="audioPlayer" preload="metadata">\n';
    html += '    <source src="' + post.audio_url + '" type="audio/mpeg">\n';
    html += '  </audio>\n';
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
    html += 'const progressThumb = document.getElementById("progressThumb");\n';
    html += 'const currentTimeEl = document.getElementById("currentTime");\n';
    html += 'const durationEl = document.getElementById("duration");\n';
    html += 'const skipBack = document.getElementById("skipBack");\n';
    html += 'const skipForward = document.getElementById("skipForward");\n';
    html += 'const audioBars = document.getElementById("audioBars");\n';
    html += 'const player = document.getElementById("player");\n';
    html += 'const shareBtn = document.getElementById("shareBtn");\n';
    html += 'const openAppBtn = document.getElementById("openAppBtn");\n';
    html += 'const listensCount = document.getElementById("listensCount");\n';
    html += 'const SKIP_SECONDS = 15;\n';
    html += 'let hasTrackedListen = false;\n';
    html += 'let isDragging = false;\n';
    
    html += 'function formatTime(seconds) {\n';
    html += '  const m = Math.floor(seconds / 60);\n';
    html += '  const s = Math.floor(seconds % 60);\n';
    html += '  return m + ":" + s.toString().padStart(2, "0");\n';
    html += '}\n';
    
    html += 'function formatWithCommas(num) {\n';
    html += '  return parseInt(num).toLocaleString();\n';
    html += '}\n';
    
    html += 'playBtn.addEventListener("click", function() {\n';
    html += '  if (audio.paused) { audio.play(); } else { audio.pause(); }\n';
    html += '});\n';
    
    html += 'audio.addEventListener("play", function() {\n';
    html += '  playIcon.style.display = "none";\n';
    html += '  pauseIcon.style.display = "block";\n';
    html += '  playBtn.classList.add("playing");\n';
    html += '  player.classList.add("playing");\n';
    html += '  audioBars.classList.add("active");\n';
    html += '  progressThumb.classList.add("visible");\n';
    html += '  if (!hasTrackedListen) { trackListen(); }\n';
    html += '});\n';
    
    html += 'audio.addEventListener("pause", function() {\n';
    html += '  playIcon.style.display = "block";\n';
    html += '  pauseIcon.style.display = "none";\n';
    html += '  playBtn.classList.remove("playing");\n';
    html += '  player.classList.remove("playing");\n';
    html += '  audioBars.classList.remove("active");\n';
    html += '});\n';
    
    html += 'audio.addEventListener("loadedmetadata", function() {\n';
    html += '  if (isFinite(audio.duration)) {\n';
    html += '    durationEl.textContent = formatTime(audio.duration);\n';
    html += '  }\n';
    html += '});\n';
    
    html += 'skipBack.addEventListener("click", function() {\n';
    html += '  audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);\n';
    html += '});\n';
    
    html += 'skipForward.addEventListener("click", function() {\n';
    html += '  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + SKIP_SECONDS);\n';
    html += '});\n';
    
    html += 'audio.addEventListener("timeupdate", function() {\n';
    html += '  if (!isDragging && audio.duration) {\n';
    html += '    const percent = (audio.currentTime / audio.duration) * 100;\n';
    html += '    progressFill.style.width = percent + "%";\n';
    html += '    progressThumb.style.left = percent + "%";\n';
    html += '    currentTimeEl.textContent = formatTime(audio.currentTime);\n';
    html += '  }\n';
    html += '});\n';
    
    // Drag functionality
    html += 'function startDrag(e) {\n';
    html += '  isDragging = true;\n';
    html += '  progressThumb.classList.add("visible");\n';
    html += '  updateProgress(e);\n';
    html += '}\n';
    
    html += 'function doDrag(e) {\n';
    html += '  if (!isDragging) return;\n';
    html += '  updateProgress(e);\n';
    html += '}\n';
    
    html += 'function endDrag(e) {\n';
    html += '  if (!isDragging) return;\n';
    html += '  isDragging = false;\n';
    html += '  updateProgress(e);\n';
    html += '  const rect = progressContainer.getBoundingClientRect();\n';
    html += '  const clientX = e.clientX || e.touches[0].clientX;\n';
    html += '  const percent = ((clientX - rect.left) / rect.width) * 100;\n';
    html += '  if (audio.duration) {\n';
    html += '    audio.currentTime = (Math.max(0, Math.min(100, percent)) / 100) * audio.duration;\n';
    html += '  }\n';
    html += '}\n';
    
    html += 'function updateProgress(e) {\n';
    html += '  const rect = progressContainer.getBoundingClientRect();\n';
    html += '  const clientX = e.clientX || (e.touches && e.touches[0].clientX);\n';
    html += '  if (clientX) {\n';
    html += '    const percent = ((clientX - rect.left) / rect.width) * 100;\n';
    html += '    const clampedPercent = Math.max(0, Math.min(100, percent));\n';
    html += '    progressFill.style.width = clampedPercent + "%";\n';
    html += '    progressThumb.style.left = clampedPercent + "%";\n';
    html += '    if (audio.duration) {\n';
    html += '      currentTimeEl.textContent = formatTime((clampedPercent / 100) * audio.duration);\n';
    html += '    }\n';
    html += '  }\n';
    html += '}\n';
    
    html += 'progressContainer.addEventListener("click", function(e) {\n';
    html += '  if (!isDragging) {\n';
    html += '    const rect = progressContainer.getBoundingClientRect();\n';
    html += '    const percent = ((e.clientX - rect.left) / rect.width) * 100;\n';
    html += '    if (audio.duration) {\n';
    html += '      audio.currentTime = (Math.max(0, Math.min(100, percent)) / 100) * audio.duration;\n';
    html += '    }\n';
    html += '  }\n';
    html += '});\n';
    
    html += 'progressContainer.addEventListener("mousedown", startDrag);\n';
    html += 'document.addEventListener("mousemove", doDrag);\n';
    html += 'document.addEventListener("mouseup", endDrag);\n';
    html += 'progressContainer.addEventListener("touchstart", startDrag);\n';
    html += 'document.addEventListener("touchmove", doDrag);\n';
    html += 'document.addEventListener("touchend", endDrag);\n';
    
    // Share button
    html += 'shareBtn.addEventListener("click", async function() {\n';
    html += '  const shareUrl = "https://gistvox-share.vercel.app/p/" + postId;\n';
    html += '  try {\n';
    html += '    await navigator.clipboard.writeText(shareUrl);\n';
    html += '    const span = shareBtn.querySelector("span");\n';
    html += '    const original = span.textContent;\n';
    html += '    span.textContent = "Copied!";\n';
    html += '    setTimeout(function() { span.textContent = original; }, 2000);\n';
    html += '  } catch (error) {\n';
    html += '    const ta = document.createElement("textarea");\n';
    html += '    ta.value = shareUrl;\n';
    html += '    ta.style.position = "fixed";\n';
    html += '    ta.style.opacity = "0";\n';
    html += '    document.body.appendChild(ta);\n';
    html += '    ta.select();\n';
    html += '    document.execCommand("copy");\n';
    html += '    document.body.removeChild(ta);\n';
    html += '    const span = shareBtn.querySelector("span");\n';
    html += '    const original = span.textContent;\n';
    html += '    span.textContent = "Copied!";\n';
    html += '    setTimeout(function() { span.textContent = original; }, 2000);\n';
    html += '  }\n';
    html += '});\n';
    
    // Open in app button
    html += 'openAppBtn.addEventListener("click", function() {\n';
    html += '  window.open("https://gistvox.app.link/post/" + postId, "_blank");\n';
    html += '});\n';
    
    // Track listen function
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
    html += '      if (result.count && listensCount) {\n';
    html += '        listensCount.textContent = formatWithCommas(result.count);\n';
    html += '      }\n';
    html += '    }\n';
    html += '  } catch (error) {\n';
    html += '    console.error("Error tracking listen:", error);\n';
    html += '  }\n';
    html += '}\n';
    
    // Notify parent window when playing
    html += 'audio.addEventListener("play", function() {\n';
    html += '  if (window.parent !== window) {\n';
    html += '    window.parent.postMessage({ type: "gistvox-embed-play", postId: postId }, "*");\n';
    html += '  }\n';
    html += '});\n';
    
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