import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'FormFlow - Dynamic Noir Detective Form Management',
  description: 'Manage Cases, gather Clues, collect Testimony, and inspect Evidence Boards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="paper-grain font-sans antialiased min-h-screen flex flex-col bg-bg-primary text-text-primary transition-colors duration-200">
        <TRPCProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-border-color py-6 text-center font-typewriter text-xs text-fog-grey">
            <p>FormFlow Detective Bureau © {new Date().getFullYear()} — CONFIDENTIAL CASE ARCHIVES</p>
          </footer>
        </TRPCProvider>
      </body>
    </html>
  );
}
