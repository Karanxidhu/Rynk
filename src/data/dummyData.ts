export type RiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: number;
};

// Start map around San Francisco
export const INITIAL_LAT = 12.93025742029852;
export const INITIAL_LNG = 77.69735317483831;

export const generateDummyRiders = (): Record<string, RiderLocation> => {
  const now = Date.now();
  return {
    "userABC": { // Match the current user id from HomeScreen 
      riderId: "userABC",
      lat: INITIAL_LAT + 0.001,
      lng: INITIAL_LNG + 0.001,
      heading: 45,
      speed: 10,
      updatedAt: now,
    },
    "rider_bot_1": {
      riderId: "rider_bot_1",
      lat: INITIAL_LAT - 0.002,
      lng: INITIAL_LNG + 0.003,
      heading: 90,
      speed: 15,
      updatedAt: now,
    },
    "rider_bot_2": {
      riderId: "rider_bot_2",
      lat: INITIAL_LAT + 0.004,
      lng: INITIAL_LNG - 0.002,
      heading: 180,
      speed: 20,
      updatedAt: now,
    },
    "rider_bot_3": {
      riderId: "rider_bot_3",
      lat: INITIAL_LAT - 0.001,
      lng: INITIAL_LNG - 0.004,
      heading: 270,
      speed: 12,
      updatedAt: now,
    }
  };
};

export const moveDummyRiders = (riders: Record<string, RiderLocation>): Record<string, RiderLocation> => {
  const updatedRiders = { ...riders };
  const now = Date.now();
  
  Object.keys(updatedRiders).forEach(id => {
    const rider = updatedRiders[id];
    // Move slightly based on heading
    const headingRad = ((rider.heading || 0) * Math.PI) / 180;
    const distanceLat = Math.cos(headingRad) * 0.0001;
    const distanceLng = Math.sin(headingRad) * 0.0001;
    
    // Add random jitter to heading
    const newHeading = ((rider.heading || 0) + (Math.random() * 20 - 10)) % 360;
    
    updatedRiders[id] = {
      ...rider,
      lat: rider.lat + distanceLat,
      lng: rider.lng + distanceLng,
      heading: newHeading,
      updatedAt: now,
    };
  });
  
  return updatedRiders;
};
