const mysql = require("mysql2/promise");

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "corosa_db",
  });

  try {
    console.log("=== CHECKING DATABASE ===\n");

    // Check if trips exist
    const [trips] = await connection.execute(`
      SELECT 
        t.trip_id,
        t.driver_id,
        t.start_lat,
        t.start_long,
        t.end_lat,
        t.end_long,
        t.available_seats,
        t.ride_status,
        t.created_at,
        u.first_name,
        u.last_name,
        u.mobile_number,
        v.vehicle_model,
        v.seat_capacity
      FROM trips t
      LEFT JOIN driver d ON t.driver_id = d.driver_id
      LEFT JOIN users u ON d.user_id = u.user_id
      LEFT JOIN vehicle v ON d.driver_id = v.driver_id
      ORDER BY t.created_at DESC
    `);

    console.log("Total trips in database:", trips.length);
    console.log("\nAll trips:");
    trips.forEach((trip, index) => {
      console.log(`\n${index + 1}. Trip ID: ${trip.trip_id}`);
      console.log(`   Driver: ${trip.first_name} ${trip.last_name} (${trip.driver_id})`);
      console.log(`   Status: ${trip.ride_status}`);
      console.log(`   Available seats: ${trip.available_seats}`);
      console.log(`   Route: (${trip.start_lat}, ${trip.start_long}) -> (${trip.end_lat}, ${trip.end_long})`);
    });

    // Check available rides (what passengers will see)
    const [availableRides] = await connection.execute(`
      SELECT 
        t.trip_id,
        t.driver_id,
        t.ride_status,
        t.available_seats
      FROM trips t
      WHERE (t.ride_status = 'available' OR t.ride_status = 'pending') 
        AND t.available_seats > 0
    `);

    console.log("\n\n=== RIDES AVAILABLE FOR PASSENGERS ===");
    console.log("Count:", availableRides.length);
    console.log(JSON.stringify(availableRides, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

checkDatabase();
