// Root route - redirects to main Gistvox site or shows info
export default function handler(req, res) {
  // Simple landing page that redirects to Gistvox
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gistvox Share Service</title>
  <meta http-equiv="refresh" content="3; url=https://gistvox.com">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #333;
      margin: 0 0 20px 0;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 36px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">G</div>
    <h1>Gistvox Share Service</h1>
    <p>This service generates rich previews for Gistvox audio stories when shared on social media.</p>
    <p style="margin-top: 30px;">Redirecting to Gistvox.com...</p>
    <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">
      To share a story, use:<br>
      <code>https://gistvox-share.vercel.app/p/[POST_ID]</code>
    </p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
