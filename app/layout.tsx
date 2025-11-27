import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'LifeØS | AI Compliance Analysis',
  description: 'Upload your documents and get instant AI-powered compliance analysis. Identify OSHA, HIPAA, ADA violations with specific fixes and action plans.',
  keywords: ['compliance', 'AI', 'OSHA', 'HIPAA', 'ADA', 'risk assessment', 'document analysis'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white min-h-screen antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
