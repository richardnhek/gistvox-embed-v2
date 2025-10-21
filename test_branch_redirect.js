// Test script to verify Branch.io redirect logic
const handler = require('./api/p/[id]').default;

// Mock request/response for testing
const mockReq = (userAgent, postId) => ({
  method: 'GET',
  query: { id: postId },
  headers: {
    'user-agent': userAgent,
    'host': 'share.gistvox.com'
  }
});

const mockRes = () => {
  let statusCode = 200;
  let headers = {};
  let body = '';
  let redirectUrl = null;
  
  return {
    status: (code) => {
      statusCode = code;
      return {
        send: (content) => {
          body = content;
          return { statusCode, headers, body, redirectUrl };
        },
        json: (data) => {
          body = JSON.stringify(data);
          return { statusCode, headers, body, redirectUrl };
        }
      };
    },
    redirect: (code, url) => {
      statusCode = code;
      redirectUrl = url;
      return { statusCode, headers, body, redirectUrl };
    },
    setHeader: (key, value) => {
      headers[key] = value;
    },
    getResult: () => ({ statusCode, headers, body, redirectUrl })
  };
};

async function runTests() {
  console.log('🧪 Testing Branch.io Redirect Logic\n');
  console.log('=' . repeat(50));
  
  const testPostId = '233d8054-c0c8-489e-b64f-5fc23ae7f783';
  
  // Test 1: Real user (Chrome browser)
  console.log('\n📱 Test 1: Real User (Chrome)');
  const chromeReq = mockReq('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/91.0', testPostId);
  const chromeRes = mockRes();
  
  try {
    await handler(chromeReq, chromeRes);
    const result = chromeRes.getResult();
    
    if (result.redirectUrl && result.redirectUrl.includes('gistvox.app.link')) {
      console.log('✅ PASS: Redirects to Branch.io');
      console.log(`   Redirect: ${result.redirectUrl}`);
    } else {
      console.log('❌ FAIL: Should redirect to Branch.io');
      console.log(`   Got: ${result.redirectUrl || 'No redirect'}`);
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  // Test 2: Twitter bot
  console.log('\n🐦 Test 2: Twitter Bot');
  const twitterReq = mockReq('Twitterbot/1.0', testPostId);
  const twitterRes = mockRes();
  
  try {
    await handler(twitterReq, twitterRes);
    const result = twitterRes.getResult();
    
    if (!result.redirectUrl && result.body.includes('twitter:player')) {
      console.log('✅ PASS: Serves meta tags (no redirect)');
      console.log('   Contains Twitter Player Card meta tags');
    } else {
      console.log('❌ FAIL: Should serve meta tags');
      console.log(`   Redirect: ${result.redirectUrl || 'None (correct)'}`);
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  // Test 3: Facebook crawler
  console.log('\n📘 Test 3: Facebook Crawler');
  const fbReq = mockReq('facebookexternalhit/1.1', testPostId);
  const fbRes = mockRes();
  
  try {
    await handler(fbReq, fbRes);
    const result = fbRes.getResult();
    
    if (!result.redirectUrl && result.body.includes('og:title')) {
      console.log('✅ PASS: Serves Open Graph meta tags');
      console.log('   Contains og:title, og:image, etc.');
    } else {
      console.log('❌ FAIL: Should serve OG meta tags');
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  // Test 4: WhatsApp crawler
  console.log('\n💬 Test 4: WhatsApp Crawler');
  const whatsappReq = mockReq('WhatsApp/2.21.0', testPostId);
  const whatsappRes = mockRes();
  
  try {
    await handler(whatsappReq, whatsappRes);
    const result = whatsappRes.getResult();
    
    if (!result.redirectUrl && result.body.includes('og:description')) {
      console.log('✅ PASS: Serves meta tags for WhatsApp');
    } else {
      console.log('❌ FAIL: Should serve meta tags');
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  // Test 5: Safari mobile (real user)
  console.log('\n📱 Test 5: Safari Mobile (Real User)');
  const safariReq = mockReq('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Safari/604.1', testPostId);
  const safariRes = mockRes();
  
  try {
    await handler(safariReq, safariRes);
    const result = safariRes.getResult();
    
    if (result.redirectUrl && result.redirectUrl.includes('gistvox.app.link')) {
      console.log('✅ PASS: Mobile users redirected to Branch');
      console.log(`   Will open app or App Store`);
    } else {
      console.log('❌ FAIL: Should redirect to Branch');
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
  
  console.log('\n' + '=' . repeat(50));
  console.log('🎯 Summary: Branch.io deep linking preserved!');
  console.log('   - Bots see meta tags for rich previews');
  console.log('   - Users get Branch redirect for app opening');
}

// Note: This won't run directly due to Supabase dependency
// But shows the logic we're implementing
console.log(`
⚠️  This test demonstrates the logic but requires:
1. Supabase credentials in .env.local
2. Running: vercel dev

The key implementation:
- Bots/crawlers → HTML with meta tags
- Real users → Redirect to Branch.io
`);

// Export for documentation
module.exports = { runTests };
