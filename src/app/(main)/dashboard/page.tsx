
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  // This is now a Server Component. 
  // We can fetch data here and pass it to the client component if needed.
  return <DashboardClient />;
}
