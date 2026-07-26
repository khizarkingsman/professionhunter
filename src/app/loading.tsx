import { LoadingScreen } from '@/components/loading-screen';

export default function GlobalLoading() {
  return <LoadingScreen message="Loading page..." fullScreen={true} />;
}
