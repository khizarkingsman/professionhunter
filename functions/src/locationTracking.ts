import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as gf from "geofire-common";

export const getNearbyWorkers = onCall({ region: "us-central1" }, async (request) => {
  const { lat, lng, radiusInKm = 15 } = request.data;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new HttpsError('invalid-argument', 'Latitude and longitude must be numbers.');
  }

  const center: [number, number] = [lat, lng];
  const radiusInM = radiusInKm * 1000;

  // Calculate the bounds for the given radius
  const bounds = gf.geohashQueryBounds(center, radiusInM);
  
  const db = admin.firestore();
  
  // Cutoff for workers (updated in the last 24 hours, to keep inactive markers visible)
  const cutoffTime = admin.firestore.Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago

  const promises = bounds.map((b) => {
    const q = db.collection('workerLocations')
      .orderBy('geohash')
      .startAt(b[0])
      .endAt(b[1]);
    return q.get();
  });

  const snapshots = await Promise.all(promises);

  const matchingWorkers: any[] = [];

  snapshots.forEach((snap) => {
    for (const doc of snap.docs) {
      const data = doc.data();
      
      // Filter 1: Check Stale Location (lastUpdated < 24 hours ago)
      // If it exists but is old, hide it from the map completely.
      if (!data.lastUpdated || data.lastUpdated.toMillis() < cutoffTime.toMillis()) {
         continue;
      }

      const lat = data.lat;
      const lng = data.lng;

      // Filter 3: Exact distance check (Haversine)
      // The Geohash bound might give false positives outside the radius
      const distanceInKm = gf.distanceBetween([lat, lng], center);
      const distanceInM = distanceInKm * 1000;

      if (distanceInM <= radiusInM) {
        matchingWorkers.push({
           workerId: doc.id,
           lat,
           lng,
           lastUpdated: data.lastUpdated?.toDate()?.toISOString(),
           distanceInKm,
           isActive: data.isActive !== false, // Default to true if missing
           availabilityStatus: data.availabilityStatus || 'active',
           inactiveStart: data.inactiveStart?.toDate()?.toISOString() || null,
           inactiveUntil: data.inactiveUntil?.toDate()?.toISOString() || null,
           inactiveReason: data.inactiveReason || null
        });
      }
    }
  });

  // Remove duplicates just in case geohashes overlapped
  const uniqueWorkers = Array.from(new Map(matchingWorkers.map(w => [w.workerId, w])).values());

  return { workers: uniqueWorkers };
});
