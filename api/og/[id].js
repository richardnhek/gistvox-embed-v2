// Simple OG image generator - returns a default image for now
// Can be enhanced later with dynamic image generation using @vercel/og

export default async function handler(req, res) {
  const { id } = req.query;
  
  // For now, redirect to a default Gistvox image
  // In production, you'd generate dynamic images with post title/author
  const defaultImage = 'https://vrcshstpoimwpwyyamvq.supabase.co/storage/v1/object/public/gistvox-public/gistvox-resized.png';
  
  // Redirect to the default image
  res.redirect(301, defaultImage);
  
  // Later, you can implement dynamic OG images using @vercel/og:
  // import { ImageResponse } from '@vercel/og';
  // return new ImageResponse(<div>...</div>);
}
