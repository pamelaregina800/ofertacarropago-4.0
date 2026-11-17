import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '99Pay',
  description: 'Sua carteira digital 99Pay',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '99Pay',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
  themeColor: '#FFD500',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-[#f5f5f5]">
        {/* Frame centralizado: no celular ocupa 100% da largura;
            no desktop centraliza em ~430px simulando o layout mobile,
            com uma leve sombra para destacar do fundo. */}
        <div className="mx-auto w-full md:max-w-[430px] md:min-h-screen md:shadow-2xl md:bg-[#f5f5f5] relative">
          {children}
        </div>

        <Analytics />

        {/* === UTMify - Script oficial de captura de UTMs === */}
        <Script
          id="utmify-utms"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          strategy="afterInteractive"
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
        />

        {/* === UTMify - Pixel Facebook/Meta === */}
        <Script id="utmify-fb-init" strategy="afterInteractive">
          {`window.pixelId = "6a016acc630b1c03a1f6c869";`}
        </Script>
        <Script
          id="utmify-fb-pixel"
          src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
          strategy="afterInteractive"
        />

        {/* === Microsoft Clarity - Heatmaps e gravacao de sessao === */}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wm4lgfrjmc");`}
        </Script>
      </body>
    </html>
  )
}
