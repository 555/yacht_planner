import { Locations } from '@/devlink/Locations';
import { Footer } from '@/devlink/Footer';
import { MainNavigation } from '@/devlink/MainNavigation';
import { Divider } from '@/devlink/Divider';

export default function WebflowTestPage() {
  return (
    <div className="min-h-screen">
      <MainNavigation />
      
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Webflow DevLink Components Test
        </h1>
        
        <p className="text-center text-lg mb-8">
          Testing the synced Webflow components in our Next.js Pages Router setup.
        </p>
        
        <Divider />
        
        <div className="my-8">
          <h2 className="text-2xl font-semibold mb-4">Locations Component</h2>
          <Locations />
        </div>
        
        <Divider />
      </div>
      
      <Footer />
    </div>
  );
}