import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, MapPin, Clock, Gauge, Navigation } from 'lucide-react';

const VehicleTracker = () => {
  // Dummy route data
  const routeData = [
    { latitude: 17.385044, longitude: 78.486671, timestamp: "2024-07-20T10:00:00Z" },
    { latitude: 17.385144, longitude: 78.486771, timestamp: "2024-07-20T10:00:05Z" },
    { latitude: 17.385244, longitude: 78.486871, timestamp: "2024-07-20T10:00:10Z" },
    { latitude: 17.385344, longitude: 78.486971, timestamp: "2024-07-20T10:00:15Z" },
    { latitude: 17.385444, longitude: 78.487071, timestamp: "2024-07-20T10:00:20Z" },
    { latitude: 17.385544, longitude: 78.487171, timestamp: "2024-07-20T10:00:25Z" },
    { latitude: 17.385644, longitude: 78.487271, timestamp: "2024-07-20T10:00:30Z" },
    { latitude: 17.385744, longitude: 78.487371, timestamp: "2024-07-20T10:00:35Z" },
    { latitude: 17.385844, longitude: 78.487471, timestamp: "2024-07-20T10:00:40Z" },
    { latitude: 17.385944, longitude: 78.487571, timestamp: "2024-07-20T10:00:45Z" },
    { latitude: 17.386044, longitude: 78.487671, timestamp: "2024-07-20T10:00:50Z" },
    { latitude: 17.386144, longitude: 78.487771, timestamp: "2024-07-20T10:00:55Z" },
    { latitude: 17.386244, longitude: 78.487871, timestamp: "2024-07-20T10:01:00Z" },
    { latitude: 17.386344, longitude: 78.487971, timestamp: "2024-07-20T10:01:05Z" },
    { latitude: 17.386444, longitude: 78.488071, timestamp: "2024-07-20T10:01:10Z" },
    { latitude: 17.386544, longitude: 78.488171, timestamp: "2024-07-20T10:01:15Z" },
    { latitude: 17.386644, longitude: 78.488271, timestamp: "2024-07-20T10:01:20Z" },
    { latitude: 17.386744, longitude: 78.488371, timestamp: "2024-07-20T10:01:25Z" },
    { latitude: 17.386844, longitude: 78.488471, timestamp: "2024-07-20T10:01:30Z" },
    { latitude: 17.386944, longitude: 78.488571, timestamp: "2024-07-20T10:01:35Z" },
    { latitude: 17.387044, longitude: 78.488671, timestamp: "2024-07-20T10:01:40Z" },
    { latitude: 17.387144, longitude: 78.488771, timestamp: "2024-07-20T10:01:45Z" },
    { latitude: 17.387244, longitude: 78.488871, timestamp: "2024-07-20T10:01:50Z" },
    { latitude: 17.387344, longitude: 78.488971, timestamp: "2024-07-20T10:01:55Z" },
    { latitude: 17.387444, longitude: 78.489071, timestamp: "2024-07-20T10:02:00Z" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const traveledPolylineRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      const L = window.L;
      
      // Initialize map
      const map = L.map(mapRef.current).setView([routeData[0].latitude, routeData[0].longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Custom vehicle icon
      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker',
        html: '<div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Create marker
      const marker = L.marker([routeData[0].latitude, routeData[0].longitude], {
        icon: vehicleIcon
      }).addTo(map);

      // Draw complete route (blue)
      const completeRoute = routeData.map(point => [point.latitude, point.longitude]);
      const routePolyline = L.polyline(completeRoute, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.5,
        dashArray: '10, 10'
      }).addTo(map);

      // Traveled path (green)
      const traveledPolyline = L.polyline([], {
        color: '#10B981',
        weight: 5,
        opacity: 0.8
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      routePolylineRef.current = routePolyline;
      traveledPolylineRef.current = traveledPolyline;
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate speed
  const calculateSpeed = (point1, point2) => {
    const distance = calculateDistance(
      point1.latitude, point1.longitude,
      point2.latitude, point2.longitude
    );
    const time1 = new Date(point1.timestamp);
    const time2 = new Date(point2.timestamp);
    const timeDiff = (time2 - time1) / 1000 / 3600;
    return timeDiff > 0 ? (distance / timeDiff).toFixed(2) : 0;
  };

  // Animation effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          if (prevIndex >= routeData.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }

          const nextIndex = prevIndex + 1;
          const currentPoint = routeData[nextIndex];

          // Update marker position
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([currentPoint.latitude, currentPoint.longitude]);
            
            // Update traveled path
            const traveledPath = routeData.slice(0, nextIndex + 1).map(p => [p.latitude, p.longitude]);
            traveledPolylineRef.current.setLatLngs(traveledPath);
            
            // Pan to current position
            mapInstanceRef.current.panTo([currentPoint.latitude, currentPoint.longitude]);
          }

          // Calculate speed
          if (nextIndex > 0) {
            const spd = calculateSpeed(routeData[nextIndex - 1], currentPoint);
            setCurrentSpeed(spd);
          }

          return nextIndex;
        });
      }, 1000 / speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed]);

  const handlePlay = () => {
    if (currentIndex >= routeData.length - 1) {
      handleReset();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setCurrentSpeed(0);
    
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([routeData[0].latitude, routeData[0].longitude]);
      traveledPolylineRef.current.setLatLngs([]);
      mapInstanceRef.current.setView([routeData[0].latitude, routeData[0].longitude], 15);
    }
  };

  const currentPoint = routeData[currentIndex];
  const progress = ((currentIndex + 1) / routeData.length) * 100;
  const currentTime = new Date(currentPoint.timestamp).toLocaleTimeString();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full z-0"></div>

      {/* Control Panel */}
      < className="absolute top-4 right-4 left-4 md:left-auto md:w-96 bg-white rounded-xl shadow-2xl z-10 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vehicle Tracker</h1>
            <p className="text-xs text-gray-500">Real-time Simulation</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Play</span>
          </button>
          
          <button
            onClick={handlePause}
            disabled={!isPlaying}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-600">Progress</span>
            <span className="text-xs font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">{currentIndex + 1} / {routeData.length}</span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">Animation Speed</label>
            <span className="text-sm font-bold text-blue-600">{speed}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-2">
          {/* Coordinates */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900">Current Location</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-blue-700 font-medium">Lat:</span>
                <p className="font-mono font-bold text-blue-900">{currentPoint.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Lng:</span>
                <p className="font-mono font-bold text-blue-900">{currentPoint.longitude.toFixed(6)}</p>
              
