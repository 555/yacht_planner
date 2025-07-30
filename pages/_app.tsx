import type { AppProps } from 'next/app';
import Head from 'next/head';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import '../styles/globals.css';
import '@/devlink/global.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DevLinkProvider } from '@/devlink/DevLinkProvider';
import { LinkRenderer, ImageRenderer } from '@/components/renderers';

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
      <DevLinkProvider renderLink={LinkRenderer} renderImage={ImageRenderer}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Component {...pageProps} />
          </TooltipProvider>
        </QueryClientProvider>
      </DevLinkProvider>
    </>
  );
}