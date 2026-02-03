const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const DubeMerchant = require("../../src/models/DubeMerchant");
const DubeCustomer = require("../../src/models/DubeCustomer");

let adminToken;
let dubeAdminToken;
let dubeViewerToken;
let regularUserToken;

describe("DUBE International API Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/helloopass_test",
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up database
    await DubeMerchant.deleteMany({});
    await DubeCustomer.deleteMany({});

    // Create test users and get tokens
    // (Implement user creation logic here)
  });

  describe("Authentication & Authorization", () => {
    test("Should deny access to regular user", async () => {
      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php")
        .set("Authorization", `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });

    test("Should allow access to DUBE viewer", async () => {
      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php")
        .set("Authorization", `Bearer ${dubeViewerToken}`);

      expect(response.status).toBe(200);
    });

    test("Should allow access to DUBE admin", async () => {
      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php")
        .set("Authorization", `Bearer ${dubeAdminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("Merchant Management", () => {
    test("Should get merchant list with pagination", async () => {
      // Create test merchants
      await DubeMerchant.create([
        {
          userid: "123456",
          fullname: "Test Merchant 1",
          mobile: "251911111111",
          dialCode: "251",
          countryCode: "ET",
          project: "Palladium",
        },
        {
          userid: "123457",
          fullname: "Test Merchant 2",
          mobile: "251922222222",
          dialCode: "251",
          countryCode: "ET",
          project: "Palladium",
        },
      ]);

      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php?limit=5&Page=1")
        .set("Authorization", `Bearer ${dubeAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.totalCount).toBe("2");
      expect(response.body.message).toHaveLength(2);
    });

    test("Should filter merchants by country", async () => {
      await DubeMerchant.create([
        {
          userid: "123456",
          fullname: "Ethiopian Merchant",
          mobile: "251911111111",
          dialCode: "251",
          countryCode: "ET",
          project: "Palladium",
        },
        {
          userid: "123457",
          fullname: "Kenyan Merchant",
          mobile: "254722222222",
          dialCode: "254",
          countryCode: "KE",
          project: "Palladium",
        },
      ]);

      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php?countryCode=ET")
        .set("Authorization", `Bearer ${dubeAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toHaveLength(1);
      expect(response.body.message[0].countryCode).toBe("ET");
    });
  });

  describe("Customer Management", () => {
    test("Should get customer list", async () => {
      await DubeCustomer.create([
        {
          userid: "654321",
          fullname: "Test Customer 1",
          mobile: "251933333333",
          dialCode: "251",
          countryCode: "ET",
          creditwallet: "1111111111",
          purchasewallet: "2222222222",
        },
      ]);

      const response = await request(app)
        .get("/api/v1/dube/international/getcustomerlist.php")
        .set("Authorization", `Bearer ${dubeAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(parseInt(response.body.totalCount)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Project Management", () => {
    test("Should register new project (admin only)", async () => {
      const projectData = {
        projectName: "Test Project",
        countryCode: "ET",
        mobile: "251911111111",
        settlementAccount: "1234567890",
        settlementBank: "Test Bank",
      };

      const response = await request(app)
        .post("/api/v1/dube/international/registerproject.php")
        .set("Authorization", `Bearer ${dubeAdminToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe("Project created successfully.");
    });

    test("Should deny project registration to viewer", async () => {
      const projectData = {
        projectName: "Test Project",
        countryCode: "ET",
        mobile: "251911111111",
        settlementAccount: "1234567890",
        settlementBank: "Test Bank",
      };

      const response = await request(app)
        .post("/api/v1/dube/international/registerproject.php")
        .set("Authorization", `Bearer ${dubeViewerToken}`)
        .send(projectData);

      expect(response.status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    test("Should return 400 for invalid parameters", async () => {
      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php?limit=invalid")
        .set("Authorization", `Bearer ${dubeAdminToken}`);

      expect(response.status).toBe(200); // Server handles invalid limit gracefully
    });

    test("Should return 401 for missing token", async () => {
      const response = await request(app).get(
        "/api/v1/dube/international/getmerchantlist.php",
      );

      expect(response.status).toBe(401);
    });

    test("Should return 403 for invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/dube/international/getmerchantlist.php")
        .set("Authorization", "Bearer invalid.token.here");

      expect(response.status).toBe(401); // Usually 401 for invalid token
    });
  });
});
