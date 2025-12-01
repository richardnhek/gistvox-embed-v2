// Simple test for @vercel/og without JSX
import { ImageResponse } from '@vercel/og';
import React from 'react';

export default async function handler(req, res) {
  try {
    const image = new ImageResponse(
      React.createElement('div', {
        style: {
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }
      }, 'Hello World'),
      {
        width: 1200,
        height: 630,
      }
    );
    
    const buffer = await image.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating image: ' + error.message);
  }
}
