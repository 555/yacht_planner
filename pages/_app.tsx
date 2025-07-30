import type { AppProps } from 'next/app';
import Head from 'next/head';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import '../styles/globals.css';
import '@/devlink/global.css';
import 'mapbox-gl/dist/mapbox-gl.css';

// Fallback DevLink Provider
const FallbackDevLinkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
FallbackDevLinkProvider.displayName = 'DevLinkProviderFallback';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [DevLinkProvider, setDevLinkProvider] = useState<any>(FallbackDevLinkProvider);
  const [renderers, setRenderers] = useState<{LinkRenderer?: any, ImageRenderer?: any}>({});

  useEffect(() => {
    // Try to load DevLink components dynamically
    const loadDevLink = async () => {
      try {
        const [devlinkModule, renderersModule] = await Promise.all([
          import('@/devlink/DevLinkProvider').catch(() => null),
          import('@/components/renderers').catch(() => null)
        ]);
        
        if (devlinkModule?.DevLinkProvider) {
          setDevLinkProvider(() => devlinkModule.DevLinkProvider);
        }
        
        if (renderersModule?.LinkRenderer && renderersModule?.ImageRenderer) {
          setRenderers({
            LinkRenderer: renderersModule.LinkRenderer,
            ImageRenderer: renderersModule.ImageRenderer
          });
        }
      } catch (error) {
        // DevLink not available, use fallback
        console.log('DevLink not available, using fallback provider');
      }
    };

    loadDevLink();
  }, []);

  const providerProps = renderers.LinkRenderer && renderers.ImageRenderer 
    ? { renderLink: renderers.LinkRenderer, renderImage: renderers.ImageRenderer }
    : {};

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
      <DevLinkProvider {...providerProps}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Component {...pageProps} />
          </TooltipProvider>
        </QueryClientProvider>
      </DevLinkProvider>
    </>
  );
}