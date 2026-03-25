import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fetemi Content Automation',
  description: 'End-to-end content creation and publishing automation for marketing agencies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased min-h-screen">
        <div className="noise-bg" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
