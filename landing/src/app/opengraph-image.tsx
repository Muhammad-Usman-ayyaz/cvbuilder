import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #1A365D 0%, #0F172A 55%, #0B1220 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #2C5282, #14B8A6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"
                fill="white"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, color: '#F8FAFC' }}>
            {SITE_NAME}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: '#FFFFFF', maxWidth: 900, lineHeight: 1.15 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#94A3B8', marginTop: 28, maxWidth: 820 }}>
          Live-preview resume builder + real AI-powered ATS scoring
        </div>
      </div>
    ),
    { ...size }
  );
}
