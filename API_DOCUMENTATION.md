# Rynk Backend API & WebSocket Documentation

This document provides a comprehensive overview of the REST API endpoints, WebSocket events, and data models for the Rynk Backend. This information is intended to help build optimal client applications (e.g., mobile apps, web clients, or other LLM-generated clients).

## 1. Overview
- **Protocol:** HTTP (REST) and WebSocket (Socket.IO).
- **Base URL:** Defined by the environment (default local port: `5000`).
- **Data Format:** JSON for REST endpoints; parsed JSON/Objects for WebSocket payloads.

---

## 2. REST API Endpoints

### 2.1 Health Check
- **Endpoint:** `GET /`
- **Description:** Verifies that the server is running.
- **Request Parameters:** None.
- **Response:**
  - **Status:** `200 OK`
  - **Body (Text):** `"Server running 🚀"`

### 2.2 Get Room Riders
- **Endpoint:** `GET /room/:roomId`
- **Description:** Retrieves the current state and location of all riders within a specific room. The data is fetched directly from the Redis store.
- **Path Parameters:**
  - `roomId` (string): The unique identifier for the room/ride session.
- **Response:**
  - **Status:** `200 OK`
  - **Body Format:** `Array<RiderLocation>`
  - **Example Response:**
    ```json
    [
      {
        "riderId": "user_123",
        "lat": 37.7749,
        "lng": -122.4194,
        "heading": 90,
        "speed": 15,
        "updatedAt": 1690000000000
      }
    ]
    ```

---

## 3. WebSocket (Socket.IO) Events

The WebSocket server provides real-time location tracking and synchronization for riders in a room. 
- **Connection Namespace:** `/` (Default)
- **CORS:** Allowed for all origins (`*`) on methods `GET` and `POST`.

### 3.1 Client-to-Server (Incoming Events)

#### `joinRide`
- **Description:** Allows a client to subscribe to real-time updates for a specific room.
- **Payload Structure:**
  ```typescript
  {
    roomId: string;
  }
  ```
- **Action:** The server adds the client socket to the specified `roomId` and the client can now receive broadcasts for that room.

#### `locationUpdate`
- **Description:** Sent by a rider client to update their current coordinates, heading, and speed.
- **Payload Structure:**
  ```typescript
  {
    roomId: string;
    riderId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }
  ```
  *(Note: The server supports payloads sent either as an Object or a strict JSON string which it parses automatically).*
- **Action:**
  1. The server augments the payload with a server-side timestamp (`updatedAt`).
  2. Saves the new location state into the Redis room store.
  3. Broadcasts the generated `RiderLocation` payload via the `riderLocation` event to everyone in the room.

### 3.2 Server-to-Client (Outgoing Events)

#### `riderLocation`
- **Description:** Broadcasted to all clients in a room whenever any rider updates their location.
- **Payload Structure (RiderLocation):**
  ```typescript
  {
    riderId: string;
    lat: number;
    lng: number;
    heading?: number;
    updatedAt: number; // Server-issued Epoch timestamp
  }
  ```

---

## 4. Data Models

These models define the strict structures used in both the database (Redis via caching) and the APIs.

### `RiderLocation`
Represents the current location data for a single participant (rider).
```typescript
type RiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: number;
}
```

### `RideRoom`
Represents the collective state of a room tracking multiple riders.
```typescript
type RideRoom = {
  roomId: string;
  riders: Record<string, RiderLocation>; // Keyed by riderId
}
```

---
*Generated for LLM Client Integration*
