import { DevLinkComponent, withDevLink } from '@/components/DevLinkWrapper';

// Example page using DevLink components with fallbacks
function WebflowDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* DevLink component with fallback */}
      <DevLinkComponent 
        componentName="MainNavigation"
        fallback={
          <nav className="bg-blue-600 text-white p-4">
            <h1>Fallback Navigation</h1>
          </nav>
        }
      />
      
      <main className="container mx-auto py-8">
        <DevLinkComponent 
          componentName="Locations"
          fallback={
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Locations (Fallback)</h2>
              <p>DevLink component not available. This is a fallback view.</p>
            </div>
          }
        />
        
        <DevLinkComponent 
          componentName="Divider"
          fallback={<hr className="my-8 border-gray-300" />}
        />
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">DevLink Status</h2>
          <p>
            This page demonstrates sustainable DevLink integration. 
            It works in both development (with DevLink) and production (with fallbacks).
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold">To enable DevLink components:</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Run <code className="bg-gray-200 px-2 py-1 rounded">webflow auth login</code></li>
              <li>Run <code className="bg-gray-200 px-2 py-1 rounded">webflow devlink sync</code></li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      </main>
      
      <DevLinkComponent 
        componentName="Footer"
        fallback={
          <footer className="bg-gray-800 text-white p-4 mt-8">
            <p className="text-center">Fallback Footer</p>
          </footer>
        }
      />
    </div>
  );
}

// Export with DevLink wrapper for additional safety
export default withDevLink(
  WebflowDemoPage,
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">DevLink Demo</h1>
      <p>DevLink components are not available in this environment.</p>
      <p className="text-sm text-gray-600 mt-2">
        Run `webflow devlink sync` locally to enable Webflow components.
      </p>
    </div>
  </div>
);