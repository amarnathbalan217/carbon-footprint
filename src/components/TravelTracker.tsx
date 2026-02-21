import React, { useState, useEffect } from 'react';
import { MapPin, Play, Square, Navigation, Car, Bike, Users, Footprints } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

export const TravelTracker: React.FC = () => {
  const {
    currentPosition,
    isTracking,
    travelHistory,
    error,
    startTracking,
    stopTracking
  } = useGeolocation();

  const [todayDistance, setTodayDistance] = useState(0);
  const [todayEmissions, setTodayEmissions] = useState(0);

  useEffect(() => {
    // Calculate today's totals
    const today = new Date().toDateString();
    const todayTrips = travelHistory.filter(trip =>
      new Date(trip.startPosition.timestamp).toDateString() === today
    );

    const distance = todayTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const emissions = todayTrips.reduce((sum, trip) => sum + trip.emissions, 0);

    setTodayDistance(distance);
    setTodayEmissions(emissions);
  }, [travelHistory]);

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'walking': return <Footprints className="h-4 w-4" />;
      case 'cycling': return <Bike className="h-4 w-4" />;
      case 'driving': return <Car className="h-4 w-4" />;
      case 'public_transport': return <Users className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  const getTransportColor = (mode: string) => {
    switch (mode) {
      case 'walking': return 'text-green-600 bg-green-100';
      case 'cycling': return 'text-blue-600 bg-blue-100';
      case 'driving': return 'text-red-600 bg-red-100';
      case 'public_transport': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Travel Tracker</h3>
              <p className="text-sm text-gray-600">Automatically track your travel distance and emissions</p>
            </div>
          </div>

          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isTracking
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
          >
            {isTracking ? (
              <>
                <Square className="h-4 w-4" />
                <span>Stop Tracking</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Tracking</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Today's Distance</p>
                <p className="text-2xl font-bold text-blue-600">{todayDistance.toFixed(1)} km</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Today's Emissions</p>
                <p className="text-2xl font-bold text-red-600">{todayEmissions.toFixed(3)} tons</p>
              </div>
              <div className="text-2xl">💨</div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Status</p>
                <p className="text-lg font-bold text-emerald-600">
                  {isTracking ? 'Tracking' : 'Stopped'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            </div>
          </div>
        </div>

        {currentPosition && (
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Location</h4>
            <p className="text-sm text-gray-600">
              Lat: {currentPosition.latitude.toFixed(6)},
              Lng: {currentPosition.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(currentPosition.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Trips</h3>

        {travelHistory.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No trips recorded yet</p>
            <p className="text-sm text-gray-500">Start tracking to see your travel history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {travelHistory.slice(-10).reverse().map((trip, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getTransportColor(trip.transportMode)}`}>
                    {getTransportIcon(trip.transportMode)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {trip.transportMode.replace('_', ' ')} Trip
                    </p>
                    <p className="text-sm text-gray-600">
                      {trip.distance.toFixed(2)} km • {Math.round(trip.duration / 60000)} minutes
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(trip.startPosition.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {trip.emissions.toFixed(3)} tons
                  </p>
                  <p className="text-sm text-gray-600">CO₂</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Location Tracking</h4>
              <p className="text-sm text-gray-600">Uses GPS to monitor your movement patterns</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="h-5 w-5 text-purple-600 font-bold">AI</div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Smart Detection</h4>
              <p className="text-sm text-gray-600">AI analyzes speed patterns to identify transport mode</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="h-5 w-5 text-green-600">📊</div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Auto Calculation</h4>
              <p className="text-sm text-gray-600">Automatically calculates distance and emissions</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="h-5 w-5 text-yellow-600">🔒</div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Privacy First</h4>
              <p className="text-sm text-gray-600">All data stays on your device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};