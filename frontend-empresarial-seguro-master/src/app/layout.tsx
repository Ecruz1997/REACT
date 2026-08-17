import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bóveda — Portal de operaciones',
  description: 'Proyecto de referencia del curso SOFT-750',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
