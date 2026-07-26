'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, CalendarClock, Ban, MapPin, Search } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/context/auth-context';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';

export function SeekerLiveMap() {
  const { user } = useAuth();
  const [clientPos, setClientPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  
  const [activeWorkerCount, setActiveWorkerCount] = useState(0);
  const [inactiveWorkerCount, setInactiveWorkerCount] = useState(0);

  // Selected Worker Modal State
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkersRef = useRef<Map<string, any>>(new Map());
  const workerDataRef = useRef<Map<string, any>>(new Map());
  const unsubscribersRef = useRef<Function[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsLocating(false);
      setClientPos([24.7136, 46.6753]); // Default to Riyadh
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClientPos([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (err) => {
        // Handle NotAllowedError or timeout cleanly without raw console error dump
        if (err.code === err.PERMISSION_DENIED) {
          console.warn("Location permission denied by user/browser. Defaulting map location to Riyadh.");
        } else {
          console.warn("Geolocation notice:", err.message);
        }
        setClientPos([24.7136, 46.6753]); // Default fallback location
        setIsLocating(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (!clientPos || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const clientIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    mapInstanceRef.current = L.map(mapContainerRef.current).setView(clientPos, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM'
    }).addTo(mapInstanceRef.current);

    L.marker(clientPos, { icon: clientIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('You are here');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      workerMarkersRef.current.clear();
      workerDataRef.current.clear();
    };
  }, [clientPos]);

  useEffect(() => {
    if (!clientPos || !mapInstanceRef.current) return;

    let isMounted = true;
    const functions = getFunctions();
    const getNearbyWorkers = httpsCallable(functions, 'getNearbyWorkers');

    const L = require('leaflet');

    const activeIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const inactiveIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const fetchWorkers = async () => {
      try {
        const response: any = await getNearbyWorkers({ lat: clientPos[0], lng: clientPos[1], radiusInKm: 15 });
        if (!isMounted) return;

        const nearbyIds = response.data.workers.map((w: any) => w.workerId);
        
        unsubscribersRef.current.forEach(u => u());
        unsubscribersRef.current = [];
        
        nearbyIds.forEach((id: string) => {
           const unsub = onSnapshot(doc(db, 'workerLocations', id), (docSnap) => {
               if (!docSnap.exists() || !mapInstanceRef.current) return;
               
               const data = docSnap.data();
               const markers = workerMarkersRef.current;
               
               workerDataRef.current.set(id, data);

               const isWorkerActive = data.isActive !== false;

               if (markers.has(id)) {
                  // Update position and icon/opacity
                  const marker = markers.get(id);
                  marker.setLatLng([data.lat, data.lng]);
                  marker.setIcon(isWorkerActive ? activeIcon : inactiveIcon);
                  marker.setOpacity(isWorkerActive ? 1.0 : 0.6);
               } else {
                  // Create marker
                  const newMarker = L.marker([data.lat, data.lng], { 
                      icon: isWorkerActive ? activeIcon : inactiveIcon,
                      opacity: isWorkerActive ? 1.0 : 0.6
                  }).addTo(mapInstanceRef.current);
                  
                  newMarker.on('click', () => {
                      setSelectedWorker({ id, ...workerDataRef.current.get(id) });
                  });

                  markers.set(id, newMarker);
               }
               
               // Count calculation
               let activeCount = 0;
               let inactiveCount = 0;
               workerDataRef.current.forEach(w => {
                   if (w.isActive !== false) activeCount++;
                   else inactiveCount++;
               });
               setActiveWorkerCount(activeCount);
               setInactiveWorkerCount(inactiveCount);
           });
           unsubscribersRef.current.push(unsub);
        });

      } catch (error) {
        console.warn("Failed to fetch nearby workers.", error);
      }
    };

    fetchWorkers();
    
    const interval = setInterval(fetchWorkers, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribersRef.current.forEach(u => u());
    };
  }, [clientPos]);

  // Modal Render Logic
  const renderWorkerModal = () => {
      if (!selectedWorker) return null;
      const isActive = selectedWorker.isActive !== false;

      // Calculate relative times safely
      let durationStr = "Time not specified";
      if (!isActive && selectedWorker.inactiveStart && selectedWorker.inactiveUntil) {
           const startMs = selectedWorker.inactiveStart.toMillis ? selectedWorker.inactiveStart.toMillis() : Date.parse(selectedWorker.inactiveStart);
           const endMs = selectedWorker.inactiveUntil.toMillis ? selectedWorker.inactiveUntil.toMillis() : Date.parse(selectedWorker.inactiveUntil);
           if (!isNaN(startMs) && !isNaN(endMs)) {
               const diffHours = (endMs - startMs) / (1000 * 60 * 60);
               durationStr = `${diffHours.toFixed(1)} hours`;
           }
      } else if (!isActive && selectedWorker.inactiveUntil) {
           const endD = selectedWorker.inactiveUntil.toDate ? selectedWorker.inactiveUntil.toDate() : new Date(selectedWorker.inactiveUntil);
           durationStr = `Until ${endD.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} on ${endD.toLocaleDateString()}`;
      } else if (!isActive && selectedWorker.inactiveStart) {
          durationStr = "Ongoing (no end time)";
      }

      return (
        <Dialog open={!!selectedWorker} onOpenChange={(open) => !open && setSelectedWorker(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                         <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                             {selectedWorker.name || 'Worker Profile'}
                         </DialogTitle>
                         <Badge variant={isActive ? "default" : "destructive"} className="uppercase font-bold tracking-wide">
                             {isActive ? 'Available' : 'Unavailable'}
                         </Badge>
                    </div>
                </DialogHeader>

                {isActive ? (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3 text-muted-foreground bg-green-50/50 p-3 rounded-lg border border-green-100">
                             <Search className="h-5 w-5 text-green-600" />
                             <span className="text-sm font-medium text-green-800">This worker is currently active and looking for jobs in your area.</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl space-y-3">
                             <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                                <Ban className="h-5 w-5" /> Provider Currently Unavailable
                             </div>
                             
                             <div className="grid grid-cols-3 gap-2 text-sm text-red-900/80">
                                 <div className="font-semibold">Reason:</div>
                                 <div className="col-span-2">{selectedWorker.inactiveReason || 'Not specified'}</div>
                                 
                                 <div className="font-semibold">Duration:</div>
                                 <div className="col-span-2">{durationStr}</div>
                             </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    {/* Subscription Gate Logic */}
                    {(!user || !user.isSeekerPro) ? (
                        <div className="w-full text-center p-3 bg-muted rounded-lg border">
                             <p className="text-sm text-muted-foreground mb-2">You must be a Pro Seeker to contact or book workers directly from the live map.</p>
                             <Button className="w-full" asChild>
                                 <a href="/subscription" target="_blank">Upgrade to Pro</a>
                             </Button>
                        </div>
                    ) : (
                        <Button 
                            className="w-full" 
                            disabled={!isActive} 
                            variant={isActive ? "default" : "secondary"}
                        >
                            {isActive ? 'Contact Worker' : 'Booking Disabled'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      );
  }

  if (isLocating || !clientPos) {
    return (
      <div className="h-[400px] w-full rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground border">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Locating you on the map...</p>
      </div>
    );
  }

  return (
    <>
        <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />
        
        <div className="absolute top-4 right-4 z-[999] bg-white/90 backdrop-blur p-3 rounded-lg shadow border text-sm font-medium flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border border-white"></div> 
                <span className="text-muted-foreground">You</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm border border-white"></div> 
                <span>Active ({activeWorkerCount})</span>
            </div>
            <div className="flex items-center gap-2 opacity-70">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white"></div> 
                <span className="text-muted-foreground">Unavailable ({inactiveWorkerCount})</span>
            </div>
        </div>
        </div>
        
        {renderWorkerModal()}
    </>
  );
}
