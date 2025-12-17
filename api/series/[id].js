// Series share endpoint with proper meta tags for social media previews
export default async function handler(req, res) {
  const { id } = req.query;
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Import Supabase client dynamically
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Fetch series data
    const { data: series, error } = await supabase
      .from('series')
      .select('id, title, description, cover_image_url, total_duration, created_at, user_id')
      .eq('id', id)
      .single();
    
    if (error || !series) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Series Not Found - Gistvox</title>
        </head>
        <body style="font-family: system-ui; text-align: center; padding: 40px;">
          <h1>Series Not Found</h1>
          <p>This series may be private or doesn't exist.</p>
        </body>
        </html>
      `);
    }
    
    // Fetch creator data
    const { data: user } = await supabase
      .from('users')
      .select('handle, display_name')
      .eq('id', series.user_id)
      .single();
    
    // Fetch chapters count
    const { count: chaptersCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('series_id', id);
    
    const userHandle = user?.handle || 'anonymous';
    const displayName = user?.display_name || 'Anonymous';
    const duration = series.total_duration ? 
      `${Math.floor(series.total_duration / 60)}:${String(Math.floor(series.total_duration % 60)).padStart(2, '0')}` : '';
    
    // Branch.io deep link
    const branchDomain = process.env.BRANCH_DOMAIN || 'gistvox.app.link';
    const branchLink = `https://${branchDomain}/series/${id}`;
    
    // Use HCTI-generated OG image (same as single posts)
    const ogImage = `https://${req.headers.host}/og/series/${id}.png`;
    
    // Check if this is a crawler/bot
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
    
    // Build HTML with meta tags and series player
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${series.title} by ${displayName} - Gistvox Series</title>

<!-- Open Graph -->
<meta property="fb:app_id" content="1571474837592831" />
<meta property="og:url" content="https://${req.headers.host}/series/${id}" />
<meta property="og:type" content="music.album" />
<meta property="og:title" content="${series.title}" />
<meta property="og:description" content="${displayName} · ${chaptersCount || 0} chapters · ${duration} · Audio Series" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter/X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@gistvox" />
<meta name="twitter:title" content="${series.title}" />
<meta name="twitter:description" content="${series.description ? series.description.substring(0, 160) : `By ${displayName} • ${chaptersCount || 0} chapters`}" />
<meta name="twitter:image" content="${ogImage}" />
<meta name="twitter:image:width" content="1200" />
<meta name="twitter:image:height" content="630" />

<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #eef3f9;
  --card-top: #d5e3f1;
  --card-bottom: #9ebacf;
  --accent: #102132;
  --muted: rgba(16, 33, 50, 0.65);
  --line: rgba(16, 33, 50, 0.14);
  --button-bg: #ffffff;
  --button-text: #102132;
  --shadow: rgba(89, 121, 149, 0.25);
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: transparent;
  color: var(--accent);
  padding: 40px 24px;
}

.series-player {
  width: 100%;
  max-width: 960px;
  background: linear-gradient(180deg, var(--card-top) 0%, var(--card-bottom) 100%);
  border-radius: 28px;
  box-shadow: 0 25px 60px var(--shadow);
  margin: 0 auto;
}

.series-header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px 40px;
}

.series-cover {
  width: 220px;
  height: 220px;
  border-radius: 18px;
  background: linear-gradient(145deg, #84aecd, #bcd4e6);
  box-shadow: 0 18px 36px rgba(70, 107, 138, 0.35);
  overflow: hidden;
  flex-shrink: 0;
}

.series-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-cover.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  color: #ffffff;
}

.series-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.series-label {
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 12px;
  color: var(--muted);
}

.series-title {
  font-size: clamp(28px, 4vw, 52px);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;
}

.series-creator {
  font-size: 18px;
  color: var(--muted);
}

.series-description {
  font-size: 14px;
  color: var(--muted);
  max-width: 520px;
  line-height: 1.5;
  margin: 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-meta {
  font-size: 14px;
  color: var(--muted);
}

.series-actions {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 12px 22px;
  background: var(--button-bg);
  color: var(--button-text);
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(158, 186, 207, 0.35);
  transition: transform 0.2s ease;
}

.save-btn:hover { transform: translateY(-1px); }

.open-btn {
  margin-left: auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.open-btn:hover { background: rgba(255, 255, 255, 0.55); }

.open-btn img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.app-links {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.app-links a {
  display: inline-block;
}

.app-links img {
  height: 40px;
}

.player-bar {
  margin: 0 40px;
  padding: 28px 0;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}

.player-meta { flex: 1 1 220px; }

.player-meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--muted);
}

.now-playing-title {
  font-size: 18px;
  font-weight: 600;
}

.now-playing-artist {
  font-size: 14px;
  color: var(--muted);
}

.player-controls {
  flex: 2 1 320px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ghost-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.ghost-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  color: var(--accent);
}

.ghost-btn svg { width: 18px; height: 18px; }

.progress-container { flex: 1; cursor: pointer; }

.progress-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(16, 33, 50, 0.15);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.1s ease;
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-family: 'Roboto Mono', monospace;
  color: var(--muted);
  margin-top: 4px;
}

.dots-btn {
  background: none;
  border: none;
  color: var(--muted);
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 999px;
}

.dots-btn:hover { background: rgba(255, 255, 255, 0.35); }

.play-circle {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  border: none;
  background: #fff;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.play-circle:hover { transform: scale(1.05); }
.play-circle svg { width: 20px; height: 20px; }

.chapter-list {
  padding: 12px 0 28px;
  max-height: 360px;
  overflow-y: auto;
}

.chapter-list::-webkit-scrollbar { width: 6px; }
.chapter-list::-webkit-scrollbar-thumb {
  background: rgba(16, 33, 50, 0.2);
  border-radius: 999px;
}

.chapter-list-header {
  display: grid;
  grid-template-columns: 50px 1fr 90px;
  padding: 0 40px 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 11px;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.chapter-item {
  display: grid;
  grid-template-columns: 50px 1fr 90px;
  padding: 18px 40px;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.chapter-item + .chapter-item { border-top: 1px solid var(--line); }
.chapter-item:hover { background: rgba(255, 255, 255, 0.4); }
.chapter-item.playing { background: rgba(255, 255, 255, 0.55); }

.chapter-number { font-size: 16px; color: var(--muted); }
.chapter-item.playing .chapter-number { color: var(--accent); font-weight: 600; }

.chapter-info { min-width: 0; }

.chapter-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin-top: 2px;
}

.chapter-duration {
  font-size: 14px;
  text-align: right;
  color: var(--muted);
  font-family: 'Roboto Mono', monospace;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translate(-50%, 20px);
  background: rgba(0, 0, 0, 0.82);
  padding: 12px 18px;
  border-radius: 999px;
  color: #fff;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 9999;
}

.toast.show { opacity: 1; transform: translate(-50%, 0); }

.loading, .error {
  text-align: center;
  padding: 80px 40px;
  color: var(--accent);
  font-size: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(16, 33, 50, 0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.player-bar.hidden { display: none; }

@media (max-width: 768px) {
  body { padding: 16px; }
  .series-header { flex-direction: column; text-align: center; padding: 24px; }
  .series-cover { width: 180px; height: 180px; }
  .series-actions { flex-direction: column; }
  .open-btn { margin-left: 0; }
  .player-bar { margin: 0 24px; flex-direction: column; align-items: stretch; gap: 16px; }
  .player-controls { flex-wrap: wrap; }
  .play-circle { margin: 0 auto; }
  .chapter-list-header, .chapter-item { grid-template-columns: 40px 1fr 70px; padding: 14px 24px; }
  .chapter-title { font-size: 15px; }
}

@media (max-width: 480px) {
  .series-cover { width: 140px; height: 140px; }
  .series-title { font-size: 24px; }
  .series-creator { font-size: 16px; }
  .chapter-list-header, .chapter-item { grid-template-columns: 36px 1fr 60px; padding: 12px 16px; }
}
</style>
</head>
<body>
<div id="app" class="loading">
  <div class="loading-spinner"></div>
  <div>Loading series...</div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<audio id="audioPlayer"></audio>

<script>
const SUPABASE_URL = 'https://vrcshstpoimwpwyyamvq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY3Noc3Rwb2ltd3B3eXlhbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTg4NzEsImV4cCI6MjA3MTE5NDg3MX0.yAJbFPzYTGLwSZFOAVRukwXyNQQ69cdVYwYWvRAkUNc';

const seriesId = '${id}';
const autoplay = new URLSearchParams(window.location.search).get('autoplay') === 'true';

let audio = null;
let currentSeriesData = null;
let currentCreator = null;
let currentChapters = [];
let currentChapterIndex = -1;
let isDragging = false;

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + s.toString().padStart(2, '0');
}

function formatWithCommas(num) {
  return (num || 0).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
}

function formatYear(dateStr) {
  return new Date(dateStr).getFullYear();
}

function getTotalDuration(chapters) {
  return chapters.reduce(function(sum, ch) { return sum + (ch.audio_duration || 0); }, 0);
}

function refreshSeriesStats() {
  if (!currentSeriesData) return;
  const statsEl = document.getElementById('seriesStats');
  if (!statsEl) return;
  const totalListens = currentChapters.reduce(function(sum, ch) { return sum + (ch.listens_count || 0); }, 0);
  const year = formatYear(currentSeriesData.created_at);
  const duration = formatTime(currentSeriesData.total_duration || getTotalDuration(currentChapters));
  statsEl.textContent = year + ' · ' + currentChapters.length + ' chapters · ' + duration + ' · ' + formatWithCommas(totalListens) + ' listens';
}

async function loadSeries() {
  const app = document.getElementById('app');
  try {
    const seriesRes = await fetch(
      SUPABASE_URL + '/rest/v1/series?id=eq.' + seriesId + '&select=*',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } }
    );
    if (!seriesRes.ok) throw new Error('Failed to fetch series');
    const series = await seriesRes.json();
    if (!series || series.length === 0) {
      app.innerHTML = '<div class="error">Series not found</div>';
      return;
    }
    currentSeriesData = series[0];

    let creator = { handle: 'anonymous', display_name: 'Anonymous' };
    if (currentSeriesData.user_id) {
      const userRes = await fetch(
        SUPABASE_URL + '/rest/v1/users?id=eq.' + currentSeriesData.user_id + '&select=*',
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } }
      );
      const users = await userRes.json();
      if (users && users.length > 0) creator = users[0];
    }
    currentCreator = creator;

    const chaptersRes = await fetch(
      SUPABASE_URL + '/rest/v1/posts?series_id=eq.' + seriesId + '&select=*&order=chapter_number.asc',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } }
    );
    if (!chaptersRes.ok) throw new Error('Failed to fetch chapters');
    const chapters = await chaptersRes.json();
    currentChapters = chapters || [];

    const totalListens = currentChapters.reduce(function(sum, ch) { return sum + (ch.listens_count || 0); }, 0);
    const seriesYear = formatYear(currentSeriesData.created_at);
    const totalDuration = currentSeriesData.total_duration || getTotalDuration(currentChapters);
    const creatorName = creator.display_name || creator.handle;

    let chaptersHtml = '';
    for (let i = 0; i < currentChapters.length; i++) {
      const chapter = currentChapters[i];
      chaptersHtml += '<div class="chapter-item" data-index="' + i + '" onclick="playChapter(' + i + ')">' +
        '<div class="chapter-number">' + (chapter.chapter_number || i + 1) + '</div>' +
        '<div class="chapter-info">' +
          '<div class="chapter-title">' + (chapter.chapter_title || chapter.title || 'Untitled Chapter') + '</div>' +
          '<div class="chapter-subtitle">' + creatorName + '</div>' +
        '</div>' +
        '<div class="chapter-duration">' + formatTime(chapter.audio_duration || 0) + '</div>' +
      '</div>';
    }

    app.innerHTML = '<div class="series-player">' +
      '<div class="series-header">' +
        '<div class="series-cover ' + (currentSeriesData.cover_image_url ? '' : 'no-image') + '">' +
          (currentSeriesData.cover_image_url ? '<img src="' + currentSeriesData.cover_image_url + '" alt="' + currentSeriesData.title + '">' : '🎙️') +
        '</div>' +
        '<div class="series-info">' +
          '<p class="series-label">Series</p>' +
          '<h1 class="series-title">' + (currentSeriesData.title || 'Untitled Series') + '</h1>' +
          '<p class="series-creator">' + creatorName + '</p>' +
          (currentSeriesData.description ? '<p class="series-description">' + currentSeriesData.description + '</p>' : '') +
          '<p class="series-meta" id="seriesStats">' + seriesYear + ' · ' + currentChapters.length + ' chapters · ' + formatTime(totalDuration) + ' · ' + formatWithCommas(totalListens) + ' listens</p>' +
          '<div class="series-actions">' +
            '<button type="button" class="save-btn" id="shareBtn">' +
              '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9H7a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v9m0 0l-4-4m4 4l4-4"/></svg>' +
              'Share Series' +
            '</button>' +
            '<button type="button" class="open-btn" id="openInAppBtn" aria-label="Open in Gistvox">' +
              '<img src="https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png" alt="Gistvox">' +
            '</button>' +
          '</div>' +
          '<div class="app-links">' +
            '<a href="https://apps.apple.com/app/gistvox/id6751720190" title="Download on App Store">' +
              '<img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store">' +
            '</a>' +
            '<a href="https://play.google.com/store/apps/details?id=com.gistvox.app&hl=en" title="Get it on Google Play">' +
              '<img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play">' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="player-bar hidden" id="playerBar">' +
        '<div class="player-meta">' +
          '<div class="player-meta-label">Now playing</div>' +
          '<div class="now-playing-title" id="nowPlayingTitle">Nothing playing</div>' +
          '<div class="now-playing-artist" id="nowPlayingArtist">' + creatorName + '</div>' +
        '</div>' +
        '<div class="player-controls">' +
          '<button class="ghost-btn" id="prevBtn" aria-label="Previous"><svg fill="currentColor" viewBox="0 0 16 16"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7z"/></svg></button>' +
          '<div class="progress-container" id="progressContainer">' +
            '<div class="progress-track"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>' +
            '<div class="time-row"><span id="currentTime">0:00</span><span id="duration">0:00</span></div>' +
          '</div>' +
          '<button class="ghost-btn" id="nextBtn" aria-label="Next"><svg fill="currentColor" viewBox="0 0 16 16"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7z"/></svg></button>' +
          '<button class="ghost-btn dots-btn" id="moreBtn" aria-label="Copy link"><svg fill="currentColor" viewBox="0 0 16 16"><path d="M3 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg></button>' +
        '</div>' +
        '<button class="play-circle" id="playPauseBtn" aria-label="Play or pause">' +
          '<svg fill="currentColor" viewBox="0 0 24 24" id="playIcon"><path d="M8 5v14l11-7z"/></svg>' +
          '<svg fill="currentColor" viewBox="0 0 24 24" id="pauseIcon" style="display:none"><rect x="6" y="5" width="4" height="14" rx="2"/><rect x="14" y="5" width="4" height="14" rx="2"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="chapter-list">' +
        '<div class="chapter-list-header"><span>#</span><span>Title</span><span>Time</span></div>' +
        chaptersHtml +
      '</div>' +
    '</div>';

    setupEventListeners();
    refreshSeriesStats();
    
    if (autoplay && currentChapters.length > 0) {
      playChapter(0);
    }
  } catch (error) {
    console.error('Series player error:', error);
    app.innerHTML = '<div class="error">Failed to load series</div>';
  }
}

function setupEventListeners() {
  var shareBtn = document.getElementById('shareBtn');
  var moreBtn = document.getElementById('moreBtn');
  var openBtn = document.getElementById('openInAppBtn');
  var playPauseBtn = document.getElementById('playPauseBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var progressContainer = document.getElementById('progressContainer');

  if (shareBtn) shareBtn.addEventListener('click', handleShare);
  if (moreBtn) moreBtn.addEventListener('click', handleShare);
  if (openBtn) openBtn.addEventListener('click', openInApp);
  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);

  progressContainer.addEventListener('click', handleProgressClick);
  progressContainer.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', endDrag);
  progressContainer.addEventListener('touchstart', startDrag);
  document.addEventListener('touchmove', doDrag);
  document.addEventListener('touchend', endDrag);
}

function playChapter(index) {
  if (index < 0 || index >= currentChapters.length) return;
  
  currentChapterIndex = index;
  var chapter = currentChapters[index];
  
  if (!audio) {
    audio = document.getElementById('audioPlayer');
    setupAudioPlayer();
  }

  var items = document.querySelectorAll('.chapter-item');
  for (var i = 0; i < items.length; i++) {
    if (i === index) items[i].classList.add('playing');
    else items[i].classList.remove('playing');
  }

  document.getElementById('nowPlayingTitle').textContent = chapter.chapter_title || chapter.title || 'Untitled Chapter';
  document.getElementById('playerBar').classList.remove('hidden');

  audio.src = chapter.audio_url;
  audio.load();
  audio.play();
  trackChapterListen(chapter.id);
}

function setupAudioPlayer() {
  var playIcon = document.getElementById('playIcon');
  var pauseIcon = document.getElementById('pauseIcon');
  var currentTimeEl = document.getElementById('currentTime');
  var durationEl = document.getElementById('duration');
  var progressFill = document.getElementById('progressFill');

  audio.addEventListener('play', function() {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  });

  audio.addEventListener('pause', function() {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  });

  audio.addEventListener('loadedmetadata', function() {
    if (isFinite(audio.duration)) {
      durationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('timeupdate', function() {
    if (!isDragging && audio.duration) {
      var percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = percent + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('ended', function() { playNext(); });
}

function togglePlayPause() {
  if (!audio || !audio.src) {
    if (currentChapters.length) {
      var indexToPlay = currentChapterIndex === -1 ? 0 : currentChapterIndex;
      playChapter(indexToPlay);
    }
    return;
  }
  if (audio.paused) audio.play();
  else audio.pause();
}

function playPrevious() {
  if (currentChapterIndex > 0) playChapter(currentChapterIndex - 1);
}

function playNext() {
  if (currentChapterIndex < currentChapters.length - 1) playChapter(currentChapterIndex + 1);
}

function handleProgressClick(e) {
  if (!audio || !audio.duration) return;
  var rect = e.currentTarget.getBoundingClientRect();
  var percent = ((e.clientX - rect.left) / rect.width) * 100;
  audio.currentTime = (percent / 100) * audio.duration;
  document.getElementById('progressFill').style.width = percent + '%';
}

var dragStartX = 0;
function startDrag(e) {
  if (!audio || !audio.duration) return;
  isDragging = true;
  dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
}

function doDrag(e) {
  if (!isDragging || !audio || !audio.duration) return;
  var rect = document.getElementById('progressContainer').getBoundingClientRect();
  var clientX = e.clientX || (e.touches && e.touches[0].clientX);
  var percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('currentTime').textContent = formatTime((percent / 100) * audio.duration);
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  var percent = parseFloat(document.getElementById('progressFill').style.width);
  if (audio && audio.duration) audio.currentTime = (percent / 100) * audio.duration;
}

function openInApp() {
  window.open('${branchLink}', '_blank');
}

async function trackChapterListen(postId) {
  var sessionKey = 'gistvox_listened_' + postId;
  if (sessionStorage.getItem(sessionKey)) return;
  
  try {
    var response = await fetch(SUPABASE_URL + '/rest/v1/rpc/track_embed_listen', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_post_id: postId })
    });
    
    if (response.ok) {
      var result = await response.json();
      var updatedCount = typeof result.count === 'number' ? result.count : null;
      for (var i = 0; i < currentChapters.length; i++) {
        if (currentChapters[i].id === postId && updatedCount !== null) {
          currentChapters[i].listens_count = updatedCount;
          break;
        }
      }
      sessionStorage.setItem(sessionKey, 'true');
      refreshSeriesStats();
    }
  } catch (error) {
    console.error('Error tracking listen:', error);
  }
}

function handleShare() {
  var shareUrl = 'https://${req.headers.host}/series/' + seriesId;
  
  async function write() {
    try {
      if (navigator.share) {
        try {
          await navigator.share({ 
            url: shareUrl, 
            title: currentSeriesData ? currentSeriesData.title : 'Gistvox Series', 
            text: 'Listen to ' + (currentSeriesData ? currentSeriesData.title : 'this series') + ' on Gistvox' 
          });
          return true;
        } catch (e) {}
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      var ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  write().then(function(ok) {
    showToast(ok ? 'Link copied to clipboard' : 'Copy failed');
  });
}

function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toast._hideTimer) clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2000);
}

window.playChapter = playChapter;

loadSeries();
</script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Series error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Error - Gistvox</title>
      </head>
      <body style="font-family: system-ui; text-align: center; padding: 40px;">
        <h1>Server Error</h1>
        <p>Failed to load series</p>
      </body>
      </html>
    `);
  }
}

