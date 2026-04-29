import dynamic from 'next/dynamic';

const SeekerLiveMap = dynamic(
  () => import('@/components/seeker-live-map').then((mod) => mod.SeekerLiveMap),
  { ssr: false }
);

export default function LiveMapPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold font-headline mb-4">Live Worker Map</h1>
      <p className="text-muted-foreground mb-6">Track available workers near your location in real-time.</p>
      
      <SeekerLiveMap />
    </div>
  );
}
