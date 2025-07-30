import type { AppProps } from 'next/app';
import Head from 'next/head';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import '../styles/globals.css';
import '@/devlink/global.css';
import 'mapbox-gl/dist/mapbox-gl.css';
// DevLink imports with fallback
let DevLinkProvider: any;
let LinkRenderer: any;
let ImageRenderer: any;

try {
  const devlinkModule = require('@/devlink/DevLinkProvider');
  DevLinkProvider = devlinkModule.DevLinkProvider;
  
  const renderersModule = require('@/components/renderers');
  LinkRenderer = renderersModule.LinkRenderer;
  ImageRenderer = renderersModule.ImageRenderer;
} catch {
  // DevLink not available, use fallback
  DevLinkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  LinkRenderer = undefined;
  ImageRenderer = undefined;
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
                 <DevLinkProvider 
             {...(LinkRenderer && ImageRenderer ? { renderLink: LinkRenderer, renderImage: ImageRenderer } : {})}
           >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Component {...pageProps} />
          </TooltipProvider>
        </QueryClientProvider>
      </DevLinkProvider>
    </>
  );
}