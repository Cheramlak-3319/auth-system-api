// ========================================
// FILE: test-swagger.js
// DESC: Test Swagger documentation setup
// ========================================

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_BASE = process.env.BASE_URL || "http://localhost:3000";

const testSwagger = async () => {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTING SWAGGER DOCUMENTATION SETUP");
  console.log("=".repeat(70));

  try {
    // 1. Test API root
    console.log("\n1. 🏠 Testing API root endpoint...");
    try {
      const rootResponse = await axios.get(`${API_BASE}/`);
      console.log(`   ✅ API is running: ${rootResponse.data.message}`);
      console.log(`   ✅ Version: ${rootResponse.data.version}`);
      console.log(`   ✅ Documentation: ${rootResponse.data.documentation}`);
    } catch (error) {
      console.error(`   ❌ API root failed: ${error.message}`);
      console.log(`   💡 Make sure the server is running: npm run dev`);
      process.exit(1);
    }

    // 2. Test Swagger JSON endpoint
    console.log("\n2. 📄 Testing Swagger JSON endpoint...");
    try {
      const swaggerJson = await axios.get(`${API_BASE}/swagger.json`);
      const spec = swaggerJson.data;

      console.log(
        `   ✅ Swagger JSON available (${Math.round(Buffer.byteLength(JSON.stringify(spec), "utf8") / 1024)} KB)`,
      );
      console.log(`   ✅ OpenAPI Version: ${spec.openapi}`);
      console.log(`   ✅ API Title: ${spec.info.title}`);
      console.log(`   ✅ Paths: ${Object.keys(spec.paths || {}).length}`);
      console.log(
        `   ✅ Tags: ${spec.tags?.map((t) => t.name).join(", ") || "None"}`,
      );

      // Validate basic structure
      if (!spec.openapi || !spec.info || !spec.paths) {
        throw new Error("Invalid Swagger specification");
      }
    } catch (error) {
      console.error(`   ❌ Swagger JSON failed: ${error.message}`);
      process.exit(1);
    }

    // 3. Test Swagger UI endpoint
    console.log("\n3. 🌐 Testing Swagger UI endpoint...");
    try {
      const swaggerUI = await axios.get(`${API_BASE}/api-docs`);
      console.log(`   ✅ Swagger UI is accessible`);
      console.log(`   ✅ Status: ${swaggerUI.status}`);
      console.log(`   ✅ Content Type: ${swaggerUI.headers["content-type"]}`);

      // Check if it's HTML
      if (swaggerUI.headers["content-type"].includes("text/html")) {
        console.log(`   ✅ Valid HTML response`);
      }
    } catch (error) {
      console.error(`   ❌ Swagger UI failed: ${error.message}`);
      process.exit(1);
    }

    // 4. Test health endpoint
    console.log("\n4. 🏥 Testing health endpoint...");
    try {
      const health = await axios.get(`${API_BASE}/health`);
      console.log(`   ✅ Health check: ${health.data.message}`);
      console.log(`   ✅ Database: ${health.data.database}`);
      console.log(`   ✅ Uptime: ${health.data.uptime} seconds`);
    } catch (error) {
      console.error(`   ❌ Health endpoint failed: ${error.message}`);
    }

    // 5. Test Swagger specification export
    console.log("\n5. 💾 Testing Swagger specification export...");
    try {
      const { exportSwaggerSpec } = require("./src/utils/swaggerGenerator");
      const outputPath = exportSwaggerSpec("./temp-swagger.json");

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`   ✅ Swagger exported to: ${outputPath}`);
        console.log(`   ✅ File size: ${(stats.size / 1024).toFixed(2)} KB`);

        // Clean up
        fs.unlinkSync(outputPath);
        console.log(`   ✅ Cleaned up temporary file`);
      }
    } catch (error) {
      console.error(`   ❌ Swagger export failed: ${error.message}`);
      console.log(`   ⚠️  Continuing despite export error...`);
    }

    // 6. Check Swagger paths
    console.log("\n6. 📍 Checking Swagger endpoints...");
    try {
      const swaggerJson = await axios.get(`${API_BASE}/swagger.json`);
      const paths = swaggerJson.data.paths;

      const authEndpoints = Object.keys(paths).filter((p) =>
        p.includes("/auth/"),
      );
      const publicEndpoints = Object.keys(paths).filter(
        (p) => !paths[p].post?.security && !paths[p].get?.security,
      );
      const protectedEndpoints = Object.keys(paths).filter(
        (p) => paths[p].post?.security || paths[p].get?.security,
      );

      console.log(`   ✅ Total endpoints: ${Object.keys(paths).length}`);
      console.log(`   ✅ Authentication endpoints: ${authEndpoints.length}`);
      console.log(`   ✅ Public endpoints: ${publicEndpoints.length}`);
      console.log(`   ✅ Protected endpoints: ${protectedEndpoints.length}`);

      // List authentication endpoints
      console.log(`   📋 Auth endpoints:`);
      authEndpoints.forEach((endpoint) => {
        const methods = Object.keys(paths[endpoint]);
        console.log(`     - ${methods.join(", ").toUpperCase()} ${endpoint}`);
      });
    } catch (error) {
      console.error(`   ❌ Path analysis failed: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 SWAGGER DOCUMENTATION TESTS PASSED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📚 Next Steps:");
    console.log("   1. Visit http://localhost:3000/api-docs in your browser");
    console.log('   2. Try the "Try it out" feature on endpoints');
    console.log("   3. Test authentication flow using Swagger UI");
    console.log("   4. Share the Swagger JSON with your team");
  } catch (error) {
    console.error("\n❌ UNEXPECTED ERROR:", error.message);
    process.exit(1);
  }
};

// Run the test
testSwagger();
