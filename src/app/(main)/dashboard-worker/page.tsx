import DashboardWorkerClient from './dashboard-worker-client';

export default function WorkerDashboardPage() {
  // This is now a Server Component.
  // We can fetch data here and pass it to the client component if needed.
  return <DashboardWorkerClient />;
}
