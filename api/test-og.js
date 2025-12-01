// Test endpoint to verify OG implementation
export default async function handler(req, res) {
  const testPostId = '233d6b1d-38cc-412d-b34b-37f479971f09'; // Example ID - replace with a real one
  const host = req.headers.host || 'gistvox-share.vercel.app';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OG Tag Test - Gistvox</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #D0E0ED 0%, #B8D0E3 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    }
    h1 {
      color: #1f2937;
      margin-bottom: 30px;
      font-size: 36px;
    }
    .section {
      margin-bottom: 40px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .section h2 {
      color: #9EBACF;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .test-link {
      display: inline-block;
      padding: 12px 24px;
      background: #9EBACF;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin: 10px 10px 10px 0;
      transition: all 0.2s;
    }
    .test-link:hover {
      background: #7A9AB2;
      transform: translateY(-2px);
    }
    .code-block {
      background: #1f2937;
      color: #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      margin: 15px 0;
    }
    .success { color: #10B981; }
    .warning { color: #F59E0B; }
    .error { color: #EF4444; }
    .info-box {
      background: #EFF6FF;
      border: 2px solid #3B82F6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .checklist {
      list-style: none;
      padding: 0;
    }
    .checklist li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
    }
    .checklist li:last-child {
      border-bottom: none;
    }
    .check-icon {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      background: #10B981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .preview-container {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    .preview-box {
      flex: 1;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: #f9fafb;
    }
    .preview-box h3 {
      margin-bottom: 15px;
      color: #4b5563;
    }
    .preview-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Gistvox OG Tag Testing & Validation</h1>
    
    <div class="info-box">
      <h3>✅ Implementation Status</h3>
      <p>Dynamic OG image generation is now active at 1200x630px for optimal Facebook side-by-side layout.</p>
    </div>

    <div class="section">
      <h2>📋 Critical Checklist</h2>
      <ul class="checklist">
        <li>
          <span class="check-icon">✓</span>
          <span><strong>Server-side rendering:</strong> OG tags are rendered server-side (not via JavaScript)</span>
        </li>
        <li>
          <span class="check-icon">✓</span>
          <span><strong>Image dimensions:</strong> 1200x630px (1.91:1 aspect ratio)</span>
        </li>
        <li>
          <span class="check-icon">✓</span>
          <span><strong>Image format:</strong> PNG with proper Content-Type headers</span>
        </li>
        <li>
          <span class="check-icon">✓</span>
          <span><strong>Public accessibility:</strong> Images are publicly accessible without authentication</span>
        </li>
        <li>
          <span class="check-icon">✓</span>
          <span><strong>OG tags present:</strong> title, description, url, image, image:width, image:height</span>
        </li>
      </ul>
    </div>

    <div class="section">
      <h2>🔍 Test URLs</h2>
      <p style="margin-bottom: 15px;">Use these URLs to test the implementation:</p>
      
      <div>
        <a href="https://${host}/p/${testPostId}" target="_blank" class="test-link">
          📄 Share Page
        </a>
        <a href="https://${host}/og/${testPostId}.png" target="_blank" class="test-link">
          🖼️ OG Image
        </a>
        <a href="https://developers.facebook.com/tools/debug/?q=https://${host}/p/${testPostId}" target="_blank" class="test-link">
          🔧 Facebook Debugger
        </a>
      </div>
    </div>

    <div class="section">
      <h2>💻 Terminal Commands</h2>
      
      <h3>1. Verify OG Tags (simulates Facebook crawler):</h3>
      <div class="code-block">
curl -A "facebookexternalhit/1.1" https://${host}/p/${testPostId} | grep -i 'og:'
      </div>
      
      <h3>2. Check Image Response Headers:</h3>
      <div class="code-block">
curl -I https://${host}/og/${testPostId}.png
      </div>
      
      <h3>3. Test Image Dimensions:</h3>
      <div class="code-block">
curl -s https://${host}/og/${testPostId}.png | file -
      </div>
    </div>

    <div class="section">
      <h2>🚀 Deployment Steps</h2>
      <ol style="line-height: 2; padding-left: 20px;">
        <li><strong>Deploy to Vercel:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">vercel --prod</code></li>
        <li><strong>Wait 2-3 minutes</strong> for deployment to propagate</li>
        <li><strong>Test with Facebook Debugger:</strong>
          <ul style="margin-top: 10px; margin-left: 20px;">
            <li>Go to <a href="https://developers.facebook.com/tools/debug/" target="_blank" style="color: #3B82F6;">Facebook Sharing Debugger</a></li>
            <li>Enter your URL</li>
            <li>Click "Debug"</li>
            <li>Click "Scrape Again" to clear cache</li>
          </ul>
        </li>
        <li><strong>Share on Facebook</strong> to verify side-by-side layout</li>
      </ol>
    </div>

    <div class="section">
      <h2>🎨 Expected Results</h2>
      <div class="preview-container">
        <div class="preview-box">
          <h3>✅ Correct (Side-by-side)</h3>
          <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
            <div style="width: 100px; height: 100px; background: #9EBACF; border-radius: 8px;"></div>
            <div>
              <div style="font-weight: bold; margin-bottom: 5px;">Title</div>
              <div style="font-size: 14px; color: #6b7280;">Description</div>
              <div style="font-size: 12px; color: #9b9b9b; margin-top: 5px;">gistvox.com</div>
            </div>
          </div>
        </div>
        
        <div class="preview-box">
          <h3>❌ Wrong (Vertical stack)</h3>
          <div style="padding: 10px; background: white; border-radius: 8px;">
            <div style="width: 100%; height: 150px; background: #9EBACF; border-radius: 8px; margin-bottom: 10px;"></div>
            <div style="font-weight: bold; margin-bottom: 5px;">Title</div>
            <div style="font-size: 14px; color: #6b7280;">Description</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>⚠️ Common Issues & Solutions</h2>
      <ul style="line-height: 1.8; padding-left: 20px;">
        <li><strong class="warning">Image too small:</strong> Ensure image is exactly 1200x630px</li>
        <li><strong class="warning">Cache issues:</strong> Use Facebook Debugger's "Scrape Again" button</li>
        <li><strong class="warning">Missing OG tags:</strong> Check server-side rendering, not client-side</li>
        <li><strong class="warning">Wrong layout persists:</strong> Old posts won't update; test with new shares</li>
        <li><strong class="warning">Edge runtime errors:</strong> Check Vercel function logs for Supabase connection issues</li>
      </ul>
    </div>

    <div class="info-box" style="background: #FEF2F2; border-color: #EF4444;">
      <h3>🔴 Important Notes:</h3>
      <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.8;">
        <li>Facebook caches OG data per URL - changes won't affect existing shares</li>
        <li>Always test with Facebook Debugger after deployment</li>
        <li>The Edge runtime is required for @vercel/og image generation</li>
        <li>Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel environment</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
