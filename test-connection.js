// test-connection.js
const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response Body:", JSON.parse(data));
    console.log("\n✅ Server is running correctly!");
    process.exit(0);
  });
});

req.on("error", (error) => {
  console.error("❌ Error connecting to server:", error.message);
  console.log("Make sure the server is running with: npm run dev");
  process.exit(1);
});

req.end();
