import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'RS Galaxy Hotel — Always With You',
  description: 'Premium 5-star hotel management system. Book luxury rooms across Goa & Rishikesh.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#faf9f6] text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen pt-20">{children}</main>
        <Footer />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1f2937', color: '#fff', border: '1px solid #f59e0b' },
        }} />
      </body>
    </html>
  );
}
