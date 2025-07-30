import type { AppProps } from 'next/app';
import Head from 'next/head';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import '../styles/globals.css';
// Import DevLink CSS but handle missing files gracefully
try {
  require('@/devlink/global.css');
} catch {
  // DevLink CSS not available, skip
}
import 'mapbox-gl/dist/mapbox-gl.css';

// Simple fallback provider that just passes through children
const DefaultProvider = ({ children, ...props }: any) => {
  return <>{children}</>;
};

// Try to import DevLink provider, fall back to default
let DevLinkProvider: any;
try {
  DevLinkProvider = require('@/devlink/DevLinkProvider').DevLinkProvider;
} catch {
  DevLinkProvider = DefaultProvider;
}

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <Head>
        <title>Sailing Distance Calculator</title>
        <meta 
          name="description" 
          content="Plan your sailing route, calculate distances, and find nearby marinas." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DevLinkProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Component {...pageProps} />
          </TooltipProvider>
        </QueryClientProvider>
      </DevLinkProvider>
    </>
  );
}