import type { Metadata, Viewport } from 'next';
import { B612, B612_Mono, Archivo_Narrow } from 'next/font/google';

import './globals.css';

/**
 * B612 was drawn for aircraft cockpit displays: a face built to be read off a
 * screen, at speed, when the number matters. For a sheet whose whole claim is a
 * measurement you can trust, no other face answers the brief as directly.
 * Archivo Narrow carries the title-block lettering, condensed the way a drawing
 * sheet is titled.
 */
const b612 = B612({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-b612',
  display: 'swap',
});

const b612Mono = B612_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-b612-mono',
  display: 'swap',
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-archivo-narrow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Blue Line — Midtown land use',
  description:
    'Draw a boundary over Midtown Manhattan and get a real measurement back: tax lots and zoning from NYC City Planning, intersected in PostGIS.',
};

export const viewport: Viewport = {
  themeColor: '#071829',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${b612.variable} ${b612Mono.variable} ${archivoNarrow.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
