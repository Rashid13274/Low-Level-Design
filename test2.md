# 📍 What is Geolocation Data?

Geolocation data refers to information that identifies the geographic location of an object or place on Earth. It is commonly represented using coordinates, specifically:

- **Latitude** (north–south position)
- **Longitude** (east–west position)

---

## Geospatial Indexes in MongoDB

Geospatial indexes in MongoDB are used to store and query geolocation data such as coordinates (latitude and longitude). These indexes enable efficient execution of geospatial queries like:

- Finding documents near a point
- Finding documents within a polygon
- Sorting results by proximity

---

## 📌 Types of Geospatial Indexes

MongoDB supports two main types of geospatial indexes:

### 1. 2dsphere Index

- Supports Earth-like spherical coordinates (latitude and longitude).
- Used with GeoJSON objects.
- Suitable for most real-world geolocation use cases.

### 2. 2d Index

- Works with flat (planar) coordinates.
- Legacy and less accurate for Earth-based calculations.

---

## 🌐 1. 2dsphere Index Example

**Collection:** `places`

```js
db.places.insertOne({
     name: "India Gate",
     location: {
          type: "Point",
          coordinates: [77.2295, 28.6129]  // [longitude, latitude]
     }
})
```

**Create 2dsphere Index on location field:**

```js
db.places.createIndex({ location: "2dsphere" })
```

**Find places near a location:**

```js
db.places.find({
     location: {
          $near: {
               $geometry: {
                    type: "Point",
                    coordinates: [77.2300, 28.6130]
               },
               $maxDistance: 1000  // in meters
          }
     }
})
```

This query finds places within 1000 meters of the specified coordinates.

---

## 🗺️ 2. 2d Index Example (Legacy/Flat)

```js
db.places2d.insertOne({
     name: "Some Point",
     loc: [50, 30] // [x, y]
})
```

**Create the 2d index:**

```js
db.places2d.createIndex({ loc: "2d" })
```

**Find points near [50, 30]:**

```js
db.places2d.find({
     loc: {
          $near: [50, 30]
     }
})
```

---

## ✅ Use Cases of Geospatial Indexes

- Location-based search (e.g., "restaurants near me")
- Logistics and tracking systems
- Mapping and geofencing
- Ride-sharing apps (e.g., Uber, Ola)