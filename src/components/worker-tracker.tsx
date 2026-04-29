'use client';

import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {MapPin, Navigation, Clock, Ban, CalendarDays, Loader2} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {db} from '@/lib/firebase';
import {doc, setDoc, serverTimestamp} from 'firebase/firestore';
import * as gf from 'geofire-common';
import {useToast} from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function WorkerTracker() {
  const {user} = useAuth();
  const {toast} = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watcherRef = useRef<number | null>(null);

  // Inactive Modal State
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveDuration, setInactiveDuration] = useState('');
  const [inactiveUnit, setInactiveUnit] = useState('hours'); // minutes, hours, days
  const [inactiveReason, setInactiveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We actually keep tracking their location even when Inactive, 
  // so their red dot follows them if they drive home!
  const [isGpsRunning, setIsGpsRunning] = useState(false);

  useEffect(() => {
    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, []);

  const uploadLocation = async (latitude: number, longitude: number, activeState: boolean, additionalData: any = {}) => {
      if (!user || !user.id) return;
      const hash = gf.geohashForLocation([latitude, longitude]);
      try {
        await setDoc(doc(db, 'workerLocations', user.id), {
          lat: latitude,
          lng: longitude,
          geohash: hash,
          lastUpdated: serverTimestamp(),
          isActive: activeState,
          availabilityStatus: activeState ? 'active' : 'inactive',
          name: user.name,
          ...additionalData
        }, { merge: true });
        
        if (!activeState) setIsSubmitting(false); // Stop loading if it was a status change
      } catch (e) {
        console.error('Error updating location:', e);
        if (!activeState) setIsSubmitting(false);
      }
  };

  const startGps = (activeState: boolean, additionalData: any = {}) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);
    setIsGpsRunning(true);

    if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        uploadLocation(position.coords.latitude, position.coords.longitude, activeState, additionalData);
      },
      (error) => {
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
  };

  const handleSetActive = () => {
    setIsActive(true);
    startGps(true, {
        inactiveStart: null,
        inactiveUntil: null,
        inactiveReason: null
    });
    toast({
        title: 'You are now ACTIVE',
        description: 'Clients can see you and book you on the map.',
    });
  };

  const handleSetInactive = () => {
      setShowInactiveModal(true);
  };

  const confirmInactive = () => {
      setIsSubmitting(true);
      setIsActive(false);

      let untilTimestamp = null;
      let durationMinutes = null;

      if (inactiveDuration && !isNaN(Number(inactiveDuration)) && Number(inactiveDuration) > 0) {
          const val = Number(inactiveDuration);
          let multiplier = 1;
          if (inactiveUnit === 'hours') multiplier = 60;
          if (inactiveUnit === 'days') multiplier = 60 * 24;

          durationMinutes = val * multiplier;
          untilTimestamp = new Date(Date.now() + durationMinutes * 60 * 1000);
      }

      startGps(false, {
          inactiveStart: serverTimestamp(),
          inactiveUntil: untilTimestamp,
          durationMinutes: durationMinutes,
          inactiveReason: inactiveReason || null
      });

      // The uploadLocation inside startGps will stop the spinner on success, but just to be safe:
      setTimeout(() => {
          setIsSubmitting(false);
          setShowInactiveModal(false);
          toast({
              title: 'You are now INACTIVE',
              description: 'Your marker is red on the map. Clients know you are unavailable.'
          });
      }, 500);
  };

  const getExpectedReturn = () => {
      if (!inactiveDuration || isNaN(Number(inactiveDuration))) return null;
      const val = Number(inactiveDuration);
      if (val <= 0) return null;
      
      let multiplier = 1;
      if (inactiveUnit === 'hours') multiplier = 60;
      if (inactiveUnit === 'days') multiplier = 60 * 24;

      return new Date(Date.now() + val * multiplier * 60 * 1000);
  };

  const expectedReturn = getExpectedReturn();

  if (!user || user.role !== 'worker') return null;

  return (
    <>
    <div className={`rounded-xl p-4 flex items-center justify-between border ${isActive ? 'bg-green-50/50 border-green-200' : 'bg-muted/50 border-border'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isActive ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-100 text-red-600'}`}>
          {isActive ? <Navigation className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
        </div>
        <div>
          <h3 className={`font-semibold ${isActive ? 'text-green-800' : 'text-red-800'}`}>
              {isActive ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isActive ? 'You are visible and available on the map.' : 'You are grayed out on the map. Tracking continues.'}
          </p>
          {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
        </div>
      </div>
      
      {isActive ? (
        <Button variant="destructive" onClick={handleSetInactive} className="gap-2">
          Go Inactive
        </Button>
      ) : (
        <Button onClick={handleSetActive} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <MapPin className="h-4 w-4" /> Go Active
        </Button>
      )}
    </div>

    <Dialog open={showInactiveModal} onOpenChange={setShowInactiveModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Set Unavailable Status</DialogTitle>
                <DialogDescription>
                    Clients will still see you on the map, but marked as unavailable with a red marker.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Input 
                       id="reason" 
                       placeholder="e.g. On a lunch break, In a meeting..." 
                       value={inactiveReason} 
                       onChange={e => setInactiveReason(e.target.value)} 
                    />
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="duration">Duration (Optional)</Label>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            id="duration" 
                            type="number" 
                            min="0"
                            placeholder="e.g. 2" 
                            className="flex-1"
                            value={inactiveDuration} 
                            onChange={e => {
                                const val = e.target.value;
                                if (Number(val) < 0) return;
                                setInactiveDuration(val);
                            }} 
                        />
                        <Select value={inactiveUnit} onValueChange={setInactiveUnit}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {expectedReturn ? (
                        <p className="text-sm font-medium text-green-700 bg-green-50 p-2 rounded border border-green-100 flex items-center gap-2">
                           <CalendarDays className="h-4 w-4" />
                           Available at: {expectedReturn.toLocaleDateString()} — {expectedReturn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Availability time not specified</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setShowInactiveModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="destructive" onClick={confirmInactive} disabled={isSubmitting} className="min-w-[160px]">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set as Unavailable'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
