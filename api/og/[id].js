import { Buffer } from 'buffer';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(400).send('Missing post ID');
    return;
  }

  try {
    // Load post + user data
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: post } = await supabase
      .from('posts')
      .select('id, title, description, audio_duration, created_at, user_id, audience_type')
      .eq('id', id)
      .eq('audience_type', 'public')
      .single();

    if (!post) {
      res.status(404).send('Post not found');
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('handle, display_name')
      .eq('id', post.user_id)
      .single();

    const title = (post.title || 'Untitled').slice(0, 110);
    const userHandle = user?.handle ? `@${user.handle}` : 'Gistvox';
    const displayName = user?.display_name || userHandle;
    const duration = Number.isFinite(post?.audio_duration)
      ? `${Math.floor(post.audio_duration / 60)}:${String(Math.floor(post.audio_duration % 60)).padStart(2, '0')}`
      : '';

    // Embed logo as base64 to guarantee rendering in the HTML-to-image service
    const logoUrl = 'https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png';
    let logoSrc = logoUrl;
    try {
      const lr = await fetch(logoUrl);
      const lab = await lr.arrayBuffer();
      logoSrc = `data:image/png;base64,${Buffer.from(lab).toString('base64')}`;
    } catch {}

    // Build HTML for HCTI (Inter via Google Fonts)
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; }
    .wrap {
      width: 1200px; height: 630px; display: flex; flex-direction: column;
      justify-content: space-between; padding: 48px; background: linear-gradient(135deg, #D0E0ED 0%, #B8D0E3 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .brand-group { display: flex; align-items: center; gap: 16px; }
    .logo { width: 48px; height: 48px; border-radius: 12px; display: block; }
    .brand { font-weight: 700; font-size: 30px; color: #1a1a1a; }
    .dur { font-size: 24px; color: #1f2937; }
    .title { flex: 1; display: flex; align-items: center; font-weight: 700; font-size: 64px; color: #111827; line-height: 1.1; }
    .foot { display: flex; justify-content: space-between; align-items: center; }
    .name { font-weight: 700; font-size: 26px; color: #111827; }
    .handle { font-size: 22px; color: #4b5563; }
    .cta { font-weight: 700; font-size: 22px; color: #fff; background: #9EBACF; padding: 10px 16px; border-radius: 999px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="brand-group">
        <img class="logo" src="${logoSrc}" alt="Gistvox" />
        <div class="brand">Gistvox</div>
      </div>
      <div class="dur">${duration}</div>
    </div>
    <div class="title">${escapeHtml(title)}</div>
    <div class="foot">
      <div>
        <div class="name">${escapeHtml(displayName)}</div>
        <div class="handle">${escapeHtml(userHandle)}</div>
      </div>
      <div class="cta">Listen on Gistvox</div>
    </div>
  </div>
</body>
</html>`;

    const HCTI_USER_ID = process.env.HCTI_USER_ID;
    const HCTI_API_KEY = process.env.HCTI_API_KEY;

    if (!HCTI_USER_ID || !HCTI_API_KEY) {
      throw new Error('Missing HCTI credentials');
    }

    const auth = Buffer.from(`${HCTI_USER_ID}:${HCTI_API_KEY}`).toString('base64');

    const resp = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        html,
        viewport_width: 1200,
        viewport_height: 630,
        device_scale: 2,
        ms_delay: 200
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HCTI error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    if (!data.url) {
      throw new Error('HCTI missing url');
    }

    res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');
    res.redirect(302, data.url);
    return;
  } catch (err) {
    // Optional debug mode to surface exact error
    if (req.query.debug === '1') {
      res.status(500).json({ error: 'OG generation failed', message: err?.message || String(err) });
      return;
    }
    console.error('OG generation failed, falling back:', err?.message);
    const customImageUrl = `https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/custom-og-${id}.png`;
    try {
      const checkResponse = await fetch(customImageUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        res.redirect(301, customImageUrl);
        return;
      }
    } catch {}
    const templateUrl = 'https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/og-universal-template.png';
    try {
      const templateCheck = await fetch(templateUrl, { method: 'HEAD' });
      if (templateCheck.ok) {
        res.redirect(301, templateUrl);
        return;
      }
    } catch {}
    res.redirect(301, 'https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-logo.png');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}