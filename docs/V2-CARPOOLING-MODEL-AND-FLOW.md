# 🚗 Carpooling Booking Cycle (Route-Based Matching)

---

## PHASE 1: Driver Creates a Ride

1. **Driver logs in**
   - Verified as student or employee
   - Vehicle information already registered

2. **Driver creates a ride**
   - Driver inputs:
     - Start location (📍 Baguio location or Campus)
     - Destination (📍 Baguio location or Campus)
     - Departure time / time window
     - Available seats

3. **System processes the ride**
   - Generates the optimal route (map polyline)
   - Stores:
     - Route geometry
     - Start → end sequence
     - Seat availability
     - Ride status = `AVAILABLE`

✅ Ride becomes discoverable to passengers

---

## PHASE 2: Passenger Searches for a Ride

1. **Passenger logs in**
   - Verified as student or employee

2. **Passenger inputs ride request**
   - Pickup location
   - Drop-off location
   - Desired time

3. **System filters available rides**
   - System checks:
     - Ride status = `AVAILABLE`
     - Time compatibility
     - Available seats ≥ 1

---

## PHASE 3: Route Compatibility Check

For each candidate driver ride:

1. **Pickup proximity validation**
   - Passenger pickup must be within **X meters** of the driver’s route

2. **Drop-off proximity validation**
   - Passenger drop-off must be within **X meters** of the same route

3. **Order validation**
   - Pickup point appears **before** drop-off point along the route

4. **Detour constraint** *(optional but recommended)*
   - No route recalculation **OR**
   - Detour ≤ acceptable threshold (e.g., +5 minutes)

✅ If all conditions pass, the ride is shown to the passenger

---

## PHASE 4: Ride Selection & Booking

1. **Passenger selects a ride**
   - Sees:
     - Driver information
     - Estimated pickup & drop-off times
     - Walking distance to pickup point

2. **Passenger sends booking request**
   - Ride status temporarily set to `PENDING`
   - Seat is soft-reserved

3. **Driver response**
   - Accepts or rejects request

---

## PHASE 5: Confirmation

### If driver **ACCEPTS**:
1. **System confirms booking**
   - Seat count −1
   - Ride status remains `OPEN` (or `FULL` if seats = 0)
   - Booking status = `CONFIRMED`

2. **Both parties are notified**
   - Pickup location
   - Estimated time
   - Contact / chat enabled

### If driver **REJECTS**:
- Seat is released
- Booking status = `REJECTED`
- Passenger may choose another ride

---

## PHASE 6: Ride Execution

1. **Ride starts**
   - Driver starts trip
   - Status = `ACTIVE`

2. **Passenger pickup**
   - Passenger is picked up near the route

3. **Passenger drop-off**
   - Passenger alights near the drop-off point

---

## PHASE 7: Ride Completion

1. **Ride ends**
   - Status = `COMPLETED`

2. **Post-ride actions**
   - Ratings / feedback *(optional)*
   - Ride archived for records

---

# Updated Carpooling Booking Flow (Summary)

1. The **driver creates a ride** by setting a start location, destination, departure time, and available seats.
2. The **system generates the driver’s route** based on the start and destination.
3. The **passenger selects a pickup location and a drop-off location** (the passenger does not define a route).
4. The system shows available driver rides **only if**:
   - The pickup point is near the driver’s route  
   - The drop-off point is near the same route  
   - The pickup comes before the drop-off along the route  
   - The ride has available seats and compatible time
5. The **passenger selects a ride** and sends a booking request.
6. The **driver accepts or rejects** the request:
   - If accepted: the seat count is reduced and the booking is confirmed
   - If rejected: the seat is released and the passenger can choose another ride
7. Once confirmed, **both parties receive the ride details**, and the carpooling trip proceeds as scheduled.
