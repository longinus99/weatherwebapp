export const metadata = {
  title: '모바일 날씨 앱',
  description: 'Next.js로 만든 모바일 웹 날씨 앱',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  )
}
