import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface TravelSegment {
  startPosition: Position;
  endPosition: Position;
  distance: number;
  duration: number;
  transportMode: 'walking' | 'cycling' | 'driving' | 'public_transport';
  emissions: number;
}

export const useGeolocation = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [travelHistory, setTravelHistory] = useState<TravelSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<Position | null>(null);
  const isMovingRef = useRef(false);

  useEffect(() => {
    // Fetch initial history
    const fetchHistory = async () => {
      try {
        const history = await api.travel.list();
        // Map backend data to frontend structure if necessary
        // Backend stores flat structure, frontend expects complex object?
        // Let's adapt frontend to backend or vice-versa.
        // For simplicity, let's assume backend returns array of segments compatible with frontend or map it.
        // Backend returns: start_lat, start_lng, end_lat, end_lng...
        // Frontend expects: startPosition: { latitude, longitude... }

        const mappedHistory = history.map((item: any) => ({
          startPosition: { latitude: item.start_lat, longitude: item.start_lng, timestamp: new Date(item.timestamp).getTime() - item.duration },
          endPosition: { latitude: item.end_lat, longitude: item.end_lng, timestamp: new Date(item.timestamp).getTime() },
          distance: item.distance,
          duration: item.duration,
          transportMode: item.transport_mode,
          emissions: item.emissions
        }));

        setTravelHistory(mappedHistory);
      } catch (err) {
        console.error('Failed to fetch travel history', err);
      }
    };
    fetchHistory();
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // AI-powered transport mode detection based on speed and movement patterns
  const detectTransportMode = (distance: number, duration: number): 'walking' | 'cycling' | 'driving' | 'public_transport' => {
    const speedKmh = (distance / (duration / 3600000)); // Convert ms to hours, distance in km

    if (speedKmh < 6.4) return 'walking';       // ~4 mph
    if (speedKmh < 24) return 'cycling';         // ~15 mph
    if (speedKmh < 56) return 'public_transport'; // ~35 mph
    return 'driving';
  };

  // Calculate emissions based on transport mode
  const calculateEmissions = (distance: number, mode: string): number => {
    const emissionFactors = {
      walking: 0,
      cycling: 0,
      public_transport: 0.01864, // tons CO2 per km (converted from 0.03/mile)
      driving: 0.07456 // tons CO2 per km (converted from 0.12/mile)
    };
    return distance * (emissionFactors[mode as keyof typeof emissionFactors] || 0.07456);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };

        setCurrentPosition(newPosition);

        // Check if user is moving
        if (lastPositionRef.current) {
          const distance = calculateDistance(lastPositionRef.current, newPosition);
          const timeDiff = newPosition.timestamp - lastPositionRef.current.timestamp;

          // If moved more than 0.016 km (about 16 meters) in the last update
          if (distance > 0.016) {
            if (!isMovingRef.current) {
              // Started moving
              isMovingRef.current = true;
            }
          } else if (isMovingRef.current && timeDiff > 300000) { // 5 minutes of no movement
            // Stopped moving - create travel segment
            const totalDistance = calculateDistance(lastPositionRef.current, newPosition);
            const transportMode = detectTransportMode(totalDistance, timeDiff);
            const emissions = calculateEmissions(totalDistance, transportMode);

            if (totalDistance > 0.16) { // Only log trips longer than 0.16 km (~160m)
              const segment: TravelSegment = {
                startPosition: lastPositionRef.current,
                endPosition: newPosition,
                distance: totalDistance,
                duration: timeDiff,
                transportMode,
                emissions
              };

              // Persist logic
              api.travel.create({
                start_lat: segment.startPosition.latitude,
                start_lng: segment.startPosition.longitude,
                end_lat: segment.endPosition.latitude,
                end_lng: segment.endPosition.longitude,
                distance: totalDistance,
                transport_mode: transportMode,
                emissions,
                timestamp: new Date().toISOString(),
                duration: timeDiff
              }).then(() => {
                setTravelHistory(prev => [...prev, segment]);
              }).catch(err => {
                console.error('Failed to save trip', err);
              });
            }

            isMovingRef.current = false;
          }
        }

        lastPositionRef.current = newPosition;
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      options
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    currentPosition,
    isTracking,
    travelHistory,
    error,
    startTracking,
    stopTracking
  };
};