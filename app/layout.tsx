import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './globals.css';
import { Metadata } from 'next';
import ClientProviders from './client-providers';

export const metadata: Metadata = {
  title: 'Sailing Distance Calculator',
  description: 'Plan your sailing route, calculate distances, and find nearby marinas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
