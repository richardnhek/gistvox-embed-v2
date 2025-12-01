## Goal

Ship a zero-external-quota, low-latency OG image generator that runs entirely on Vercel Edge using `@vercel/og` and Supabase REST. Keep current HCTI route as a fallback until the Edge route is verified in production, then switch the canonical `/og/:id.png` to the Edge route.

---

## High-Level Architecture

- Request: `GET /og2/:id.png` → rewrite → `GET /api/og2/:id`
- Runtime: Vercel Edge Function (Web standard APIs, no Node APIs)
- Renderer: `@vercel/og` → `new ImageResponse(JSX, { width: 1200, height: 630, fonts })`
- Data: Supabase REST (using anon key) to fetch `posts` and `users`
- Assets: Inter fonts (TTF) fetched from a public Supabase bucket; logo inlined as base64 (reliable) or loaded from a public URL
- Output: PNG with long CDN cache headers
- Fallbacks: On error, 302 to static template (`og-universal-template.png`)

---

## Routes & Rewrites

vercel.json additions:

```json
{
  "functions": {
    "api/og2/[id].js": { "runtime": "edge" }
  },
  "rewrites": [
    { "source": "/og2/:id.png", "destination": "/api/og2/:id" }
  ]
}
```

Switch-over (later): update the existing `/og/:id.png` rewrite to point at `/api/og2/:id` when ready.

---

## Environment Variables (Project → Settings → Environment Variables)

- `SUPABASE_URL` (e.g., `https://<project>.supabase.co`)
- `SUPABASE_ANON_KEY` (anon key, safe for Edge usage)
- Optional if hosting fonts in Supabase Storage:
  - `FONT_INTER_REGULAR_URL` (public URL to Inter-Regular.ttf)
  - `FONT_INTER_BOLD_URL` (public URL to Inter-Bold.ttf)

Nothing secret (no service_role) is required for this Edge route.

---

## Data Fetching (Supabase REST)

Headers for all REST calls:

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
```

Queries (URL-encoded):

- Post:
```
GET {SUPABASE_URL}/rest/v1/posts?
  id=eq.{POST_ID}&
  audience_type=eq.public&
  select=id,title,description,audio_duration,created_at,user_id&
  limit=1
```

- User:
```
GET {SUPABASE_URL}/rest/v1/users?
  id=eq.{USER_ID}&
  select=handle,display_name&
  limit=1
```

Edge constraints: use `fetch` (Web API). Avoid `@supabase/supabase-js` to keep the bundle tiny.

---

## Fonts & Logo Strategy

- Inter TTFs hosted in Supabase public Storage (`fonts/Inter-Regular.ttf`, `fonts/Inter-Bold.ttf`).
- In Edge function:
  - `const interRegular = await (await fetch(process.env.FONT_INTER_REGULAR_URL)).arrayBuffer()`
  - `const interBold = await (await fetch(process.env.FONT_INTER_BOLD_URL)).arrayBuffer()`
  - Pass into `ImageResponse` fonts:
    ```js
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interBold, weight: 700, style: 'normal' }
    ]
    ```
- Logo:
  - Preferred: fetch once and inline as base64 in an `<img src="data:image/png;base64,...">` to avoid any asset fetch failures during render.
  - Acceptable: reference the public Supabase URL directly.

---

## Layout (matches current design)

- Background: solid or subtle gradient (#D0E0ED → #B8D0E3)
- Top row: left = logo + "Gistvox" (700, 30px); right = duration (24px)
- Middle: title (700, 64px), clamp to 2–3 lines, ellipsis
- Bottom-left: displayName (700, 26px), handle (22px)
- Bottom-right: CTA pill "Listen on Gistvox" (700, 22px, white on #9EBACF)

Text rules:
- Title max length ~110 chars; escape HTML; normalize whitespace; support emoji.
- Duration format `m:ss` when available, else blank.

---

## Edge Function Skeleton (pseudocode)

```js
// api/og2/[id].js (Edge runtime)
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { searchParams, pathname } = new URL(req.url);
    const id = pathname.split('/').pop();
    if (!id) return new Response('Missing id', { status: 400 });

    // 1) Fetch post
    const postRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/posts?...`, { headers });
    const [post] = await postRes.json();
    if (!post) return Response.redirect(STATIC_TEMPLATE_URL, 302);

    // 2) Fetch user
    const userRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?...`, { headers });
    const [user] = await userRes.json();

    // 3) Prepare strings (title, displayName, handle, duration)

    // 4) Load fonts (arrayBuffer) and logo (as base64 or URL)

    // 5) Return ImageResponse
    return new ImageResponse(
      (<div style={styles.wrap}> {/* JSX layout */} </div>),
      {
        width: 1200,
        height: 630,
        fonts: [/* Inter 400 + 700 */],
        // Optionally: headers: { 'cache-control': 'public, s-maxage=604800, stale-while-revalidate=86400' }
      },
    );
  } catch (err) {
    if (new URL(req.url).searchParams.get('debug') === '1') {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    return Response.redirect(STATIC_TEMPLATE_URL, 302);
  }
}
```

---

## Caching Strategy

- Set `Cache-Control: public, s-maxage=604800, stale-while-revalidate=86400` on the response.
- Title/author/duration rarely change; if needed, add a cache buster (e.g., `?v=<updated_at>`).

---

## Error Handling & Debugging

- Any failure → 302 to static template (guarantees a valid image).
- `?debug=1` on the Edge route returns JSON with error details for quick diagnosis (but never expose secrets).

---

## Implementation Steps (Checklist)

1) Upload Inter-Regular.ttf and Inter-Bold.ttf to Supabase Storage (public). Capture their public URLs.
2) Add env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FONT_INTER_*_URL`).
3) Add `api/og2/[id].js` Edge function using `@vercel/og` with the layout above.
4) Add vercel.json runtime + rewrite for `/og2/:id.png`.
5) Test locally: `vercel dev` → `http://localhost:3000/og2/<id>.png`.
6) Deploy: `vercel --prod`. Verify headers: `curl -I https://<domain>/og2/<id>.png`.
7) Use Facebook Sharing Debugger (Scrape Again) on `/p/<id>`.
8) Monitor: validate logs & render timing; confirm cache hits.
9) Flip canonical: change `/og/:id.png` rewrite to `/api/og2/:id` when satisfied.
10) Keep HCTI route as emergency fallback for one deployment, then remove.

---

## Security Notes

- Only anon key is used; no privileged operations.
- Public font URLs only; no private buckets.
- Do not echo env values in debug output.

---

## Acceptance Criteria

- `GET /og2/:id.png` returns a PNG within ~100–300ms warm, <1s cold.
- Typography matches current HCTI output (Inter 400/700).
- Logo and CTA present; duration and author metadata correct.
- Graceful fallback on any error; cache headers set.


