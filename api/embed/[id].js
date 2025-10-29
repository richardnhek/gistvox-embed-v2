// Embed endpoint for Twitter player cards - server-side rendered with beautiful UI
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
    
    // Generate the HTML with embedded player matching model-embed.html
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${post.title} - Gistvox</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #9EBACF;
  --primary-light: #B8D0E3;
  --primary-lighter: #D0E0ED;
  --primary-dark: #7A9AB2;
  --success: #10B981;
  --muted: #6b7280;
  --muted-bg: #f9fafb;
  --border: #e5e7eb;
  --text: #1f2937;
  --text-secondary: #4b5563;
  --ring-color: rgba(158, 186, 207, 0.3);
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8f0f7 100%);
  color: var(--text);
}

/* Main container with ring effect */
.gistvox-player {
  background: white;
  border-radius: 16px;
  padding: 14px;
  width: 100%;
  max-width: 380px;
  min-height: 410px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 16px rgba(158, 186, 207, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 2px solid var(--ring-color);
}

.gistvox-player.playing {
  border-color: rgba(158, 186, 207, 0.5);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 12px 24px rgba(158, 186, 207, 0.3),
    0 4px 8px rgba(158, 186, 207, 0.15);
}

/* Gistvox Branding Header */
.brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.now-playing-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: -0.2px;
}

.volume-icon {
  width: 16px;
  height: 16px;
  color: var(--primary);
}

.audio-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 12px;
  width: 28px;
}

.audio-bar {
  width: 4px;
  background: var(--primary);
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

.gistvox-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.gistvox-link:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid rgba(158, 186, 207, 0.3);
  position: relative;
}

.avatar.with-image {
  background: white;
  padding: 1px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.content-info {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.user-handle {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  margin-top: 4px;
  margin-bottom: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.25;
  margin-bottom: 4px;
}

.date {
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 8px;
}

.description {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Progress Section */
.progress-section {
  margin-bottom: 8px;
}

.progress-container {
  height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 12px;
  background: rgba(107, 114, 128, 0.3);
  border-radius: 999px;
  overflow: hidden;
  transition: height 0.15s;
}

.progress-track.dragging {
  height: 15px;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 0.1s;
  box-shadow: 0 2px 8px rgba(158, 186, 207, 0.3);
  width: 0%;
}

.progress-fill.playing::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%, 
    rgba(255,255,255,0.2) 50%, 
    rgba(255,255,255,0) 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: white;
  border: 2px solid var(--primary);
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: width 0.15s, height 0.15s;
  left: 0%;
}

.progress-thumb.dragging {
  width: 20px;
  height: 20px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  color: var(--muted);
}

/* Controls */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 22px;
  margin: 16px 0 20px 0;
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
  color: var(--text);
}

.control-btn:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.control-btn.skip {
  width: 44px;
  height: 44px;
}

.control-btn.skip svg {
  width: 22px;
  height: 22px;
}

.play-btn {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  background: transparent;
  position: relative;
  transition: all 0.2s;
}

.play-btn.playing {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  box-shadow: 0 4px 16px rgba(158, 186, 207, 0.35);
}

.play-btn.playing svg { color: white; }
.play-btn:not(.playing) svg { color: var(--primary); }

.play-btn svg {
  width: 28px;
  height: 28px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.action-row { display: flex; gap: 8px; width: 100%; }

.action-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--muted-bg);
  border-color: var(--primary);
}

.action-btn svg { width: 14px; height: 14px; }

/* Stats Bar */
.stats-bar {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 12px;
  text-align: center;
}

.stats-text {
  font-family: 'Roboto Mono', monospace;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--muted);
  letter-spacing: -0.2px;
}

/* Loading & Error States */
.loading, .error { text-align: center; padding: 40px; }
.loading { color: var(--muted); }

.loading-spinner {
  width: 30px; height: 30px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.error { color: #ef4444; }

/* Responsive */
@media (max-width: 480px) {
  .gistvox-player { padding: 12px; }
  .title { font-size: 14px; }
  .stats-text { font-size: 10px; }
}
</style>
</head>
<body>
<div class="gistvox-player" id="player">
  <div class="brand-header">
    <div class="now-playing-label">
      <svg class="volume-icon" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3.22L6.603 6H3a1 1 0 00-1 1v6a1 1 0 001 1h3.603L10 16.78V3.22zM14.82 4.58a7.023 7.023 0 010 10.84l-.71-.71a5.975 5.975 0 000-8.42l.71-.71z"/>
      </svg>
      <span>Now Playing</span>
      <div class="audio-bars" id="audioBars" style="display:none">
        <div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div>
      </div>
    </div>
    <a href="https://gistvox.app.link/post/${id}" target="_blank" class="gistvox-link">
      <img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" 
           alt="Gistvox" 
           style="height: 24px; width: auto;" />
    </a>
  </div>

  <div class="user-section">
    <div class="content-info">
      <h3 class="title">${post.title || 'Untitled Story'}</h3>
      <div class="user-handle">@${userHandle}</div>
      <div class="date">${formatDate(post.created_at)} • ${duration}</div>
    </div>
  </div>

  <div class="progress-section">
    <div class="progress-container" id="progressContainer">
      <div class="progress-track" id="progressTrack">
        <div class="progress-fill" id="progressFill"></div>
        <div class="progress-thumb" id="progressThumb"></div>
      </div>
    </div>
    <div class="time-display">
      <span class="current" id="currentTime">0:00</span>
      <span id="duration">${duration}</span>
    </div>
  </div>

  <div class="controls">
    <button class="control-btn skip" id="skipBack" aria-label="Rewind 15 seconds">
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
    <button class="control-btn skip" id="skipForward" aria-label="Skip forward 15 seconds">
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
      </svg>
    </button>
  </div>

  <audio id="audioPlayer" preload="metadata">
    <source src="${post.audio_url}" type="audio/mpeg">
  </audio>

  <div class="action-buttons">
    <div class="action-row">
      <button class="action-btn" onclick="handleShare(event)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 2.943-9.543 7a9.97 9.97 0 001.827 3.342m7.432 4.026a9.97 9.97 0 001.827-3.342"/>
        </svg>
        <span>Share</span>
      </button>
      <button class="action-btn" onclick="openInApp()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
        <span>Open in App</span>
      </button>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stats-text">
      ${formatWithCommas(post.listens_count || 0)} listens • 
      ${formatWithCommas(post.likes_count || 0)} likes • 
      ${formatWithCommas(post.saves_count || 0)} saves • 
      ${formatWithCommas(post.shares_count || 0)} shares
    </div>
  </div>
</div>

<script>
// Helper functions
function formatWithCommas(num) {
  return parseInt(num).toLocaleString();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + s.toString().padStart(2, '0');
}

// Setup audio player
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressContainer = document.getElementById('progressContainer');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const audioBars = document.getElementById('audioBars');
const player = document.getElementById('player');
const skipBack = document.getElementById('skipBack');
const skipForward = document.getElementById('skipForward');

let isDragging = false;
let hasTrackedListen = false;
const SKIP_SECONDS = 15;

// Play/Pause
playBtn.addEventListener('click', () => { 
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', () => {
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
  playBtn.classList.add('playing');
  player.classList.add('playing');
  audioBars.style.display = 'flex';
  progressFill.classList.add('playing');
  
  // Track listen on first play
  if (!hasTrackedListen) {
    trackListen();
  }
});

audio.addEventListener('pause', () => {
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  playBtn.classList.remove('playing');
  player.classList.remove('playing');
  audioBars.style.display = 'none';
  progressFill.classList.remove('playing');
});

// Skip controls
skipBack.addEventListener('click', () => {
  audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
});

skipForward.addEventListener('click', () => {
  audio.currentTime = Math.min(audio.duration, audio.currentTime + SKIP_SECONDS);
});

// Duration
audio.addEventListener('loadedmetadata', () => {
  if (isFinite(audio.duration)) {
    durationEl.textContent = formatTime(audio.duration);
  }
});

// Progress update
audio.addEventListener('timeupdate', () => {
  if (!isDragging && audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + '%';
    progressThumb.style.left = percent + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

// Progress bar click to seek
progressContainer.addEventListener('click', (e) => {
  if (isDragging) return;
  const rect = progressContainer.getBoundingClientRect();
  const percent = ((e.clientX - rect.left) / rect.width) * 100;
  const newTime = (percent / 100) * audio.duration;
  audio.currentTime = newTime;
});

// Drag to seek
const startDrag = (e) => {
  isDragging = true;
  progressTrack.classList.add('dragging');
  progressThumb.classList.add('dragging');
  const rect = progressContainer.getBoundingClientRect();
  const clientX = e.clientX || e.touches[0].clientX;
  const percent = ((clientX - rect.left) / rect.width) * 100;
  updateProgress(Math.max(0, Math.min(100, percent)));
};

const doDrag = (e) => {
  if (!isDragging) return;
  const rect = progressContainer.getBoundingClientRect();
  const clientX = e.clientX || e.touches[0].clientX;
  const percent = ((clientX - rect.left) / rect.width) * 100;
  updateProgress(Math.max(0, Math.min(100, percent)));
};

const endDrag = () => {
  if (!isDragging) return;
  isDragging = false;
  progressTrack.classList.remove('dragging');
  progressThumb.classList.remove('dragging');
  const percent = parseFloat(progressFill.style.width);
  if (audio.duration) {
    audio.currentTime = (percent / 100) * audio.duration;
  }
};

const updateProgress = (percent) => {
  progressFill.style.width = percent + '%';
  progressThumb.style.left = percent + '%';
  const time = audio.duration ? (percent / 100) * audio.duration : 0;
  currentTimeEl.textContent = formatTime(time);
};

progressContainer.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', doDrag);
document.addEventListener('mouseup', endDrag);
progressContainer.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', doDrag);
document.addEventListener('touchend', endDrag);

// Track listen
async function trackListen() {
  hasTrackedListen = true;
  
  try {
    const response = await fetch('${process.env.SUPABASE_URL}/rest/v1/rpc/track_embed_listen', {
      method: 'POST',
      headers: {
        'apikey': '${process.env.SUPABASE_ANON_KEY}',
        'Authorization': 'Bearer ${process.env.SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_post_id: '${id}' })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Listen tracked');
      
      // Update displayed count
      if (result.count) {
        const statsText = document.querySelector('.stats-text');
        if (statsText) {
          const currentText = statsText.textContent;
          const newText = currentText.replace(/(\\d+(?:,\\d+)*) listens/, 
            formatWithCommas(result.count) + ' listens');
          statsText.textContent = newText;
        }
      }
    }
  } catch (error) {
    console.error('Error tracking listen:', error);
  }
}

// Share handler
window.handleShare = async (e) => {
  const shareUrl = 'https://gistvox-share.vercel.app/p/${id}';
  
  try {
    await navigator.clipboard.writeText(shareUrl);
    const btn = e.currentTarget;
    const span = btn.querySelector('span');
    const original = span.textContent;
    span.textContent = 'Copied!';
    setTimeout(() => { span.textContent = original; }, 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    
    const btn = e.currentTarget;
    const span = btn.querySelector('span');
    const original = span.textContent;
    span.textContent = 'Copied!';
    setTimeout(() => { span.textContent = original; }, 2000);
  }
};

// Open in app handler
window.openInApp = () => {
  window.open('https://gistvox.app.link/post/${id}', '_blank');
};

// Notify parent window
audio.addEventListener('play', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'gistvox-embed-play', postId: '${id}' }, '*');
  }
});
</script>
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