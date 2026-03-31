import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: '#4F7BF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="24" width="7" height="14" rx="2" fill="white" />
        <rect x="20.5" y="16" width="7" height="22" rx="2" fill="white" />
        <rect x="31" y="10" width="7" height="28" rx="2" fill="white" />
      </svg>
    </div>,
    { ...size },
  )
}
