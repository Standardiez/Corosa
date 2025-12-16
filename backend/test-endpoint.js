const http = require("http");

// Test if backend is running and endpoint exists
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/bookings",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const payload = JSON.stringify({
  passenger_id: 1,
  trip_id: 1,
  start_lat: 16.402,
  start_long: 120.596,
  end_lat: 16.408,
  end_long: 120.597,
  payment_type: "cash",
  total_cost: 50,
});

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", data);

    try {
      const json = JSON.parse(data);
      console.log(
        "\n✅ Backend is working! Endpoint responds with valid JSON."
      );
      console.log("Response data:", json);
    } catch (e) {
      console.error("\n❌ Backend returned invalid JSON:");
      console.error(data.substring(0, 200));
    }
  });
});

req.on("error", (e) => {
  console.error("\n❌ Cannot connect to backend:");
  console.error(e.message);
  console.error("\nPlease make sure the backend server is running:");
  console.error("  cd c:\\wamp64\\www\\Corosa\\backend");
  console.error("  node server.js");
});

console.log("Testing POST /api/bookings endpoint...\n");
req.write(payload);
req.end();
