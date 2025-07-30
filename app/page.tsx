import { SailingCalculator } from "../components/sailing/SailingCalculator";

// Force dynamic rendering for client-side components
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SailingCalculator />
    </div>
  );
}
