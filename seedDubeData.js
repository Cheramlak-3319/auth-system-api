const mongoose = require("mongoose");
const DubeMerchant = require("../src/models/DubeMerchant");
const DubeCustomer = require("../src/models/DubeCustomer");
const DubeProject = require("../src/models/DubeProject");
const DubeSupplier = require("../src/models/DubeSupplier");
const DubeInvoice = require("../src/models/DubeInvoice");

const seedDubeData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/helloopass",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("🗑️  Clearing existing DUBE data...");
    await DubeMerchant.deleteMany({});
    await DubeCustomer.deleteMany({});
    await DubeProject.deleteMany({});
    await DubeSupplier.deleteMany({});
    await DubeInvoice.deleteMany({});

    console.log("🌱 Seeding DUBE data...");

    // Seed Projects
    const projects = [
      {
        projectName: "Palladium",
        countryCode: "ET",
        countryName: "Ethiopia",
        creditDisbursementWallet: "1000000001",
        earningWallet: "1000000002",
        settlementBank: "Commercial Bank of Ethiopia",
        settlementAccount: "1000123456",
        mobile: "251911111111",
        dialCode: "251",
        active: true,
      },
      {
        projectName: "Leapfrog",
        countryCode: "KE",
        countryName: "Kenya",
        creditDisbursementWallet: "2000000001",
        earningWallet: "2000000002",
        settlementBank: "Equity Bank",
        settlementAccount: "2000123456",
        mobile: "254722222222",
        dialCode: "254",
        active: true,
      },
    ];

    await DubeProject.insertMany(projects);
    console.log(`✅ Seeded ${projects.length} projects`);

    // Seed Merchants
    const merchants = [];
    for (let i = 1; i <= 20; i++) {
      merchants.push({
        userid: (100000 + i).toString(),
        fullname: `Merchant ${i}`,
        businessName: `Business ${i}`,
        mobile: `2519${10000000 + i}`,
        dialCode: "251",
        countryCode: "ET",
        createdon: new Date(Date.now() - i * 86400000), // Different dates
        project: "Palladium",
        initialdeposit: 1000 * i,
        bnpl: 500 * i,
        active: i % 10 !== 0 ? "1" : "0", // Every 10th merchant inactive
        lastTrxnDate: new Date(),
        language: i % 2 === 0 ? "en" : "am",
        wallets: [
          {
            name: `300000000${i}`,
            wallettype: "MERCHANT_AVAILABLE",
            balance: 10000 * i,
            bnpl: 5000 * i,
          },
          {
            name: `400000000${i}`,
            wallettype: "MERCHANT_CREDIT",
            balance: 5000 * i,
            bnpl: 2500 * i,
          },
          {
            name: `500000000${i}`,
            wallettype: "MERCHANT_EARNING",
            balance: 2000 * i,
            bnpl: 1000 * i,
          },
        ],
        foodCategory:
          i % 3 === 0 ? "grains" : i % 3 === 1 ? "vegetables" : "fruits",
      });
    }

    await DubeMerchant.insertMany(merchants);
    console.log(`✅ Seeded ${merchants.length} merchants`);

    // Seed Customers
    const customers = [];
    for (let i = 1; i <= 50; i++) {
      const merchantIndex = Math.floor(i / 3) + 1;
      customers.push({
        userid: (200000 + i).toString(),
        fullname: `Customer ${i}`,
        mobile: `2519${20000000 + i}`,
        dialCode: "251",
        countryCode: "ET",
        creditwallet: `600000000${i}`,
        purchasewallet: `700000000${i}`,
        purchasebalance: 100 * i,
        creditbalance: 200 * i,
        createdon: new Date(Date.now() - i * 43200000), // Different dates
        createdby: `2519${10000000 + merchantIndex}`,
        merchantName: `Merchant ${merchantIndex}`,
        merchantUserId: (100000 + merchantIndex).toString(),
        active: i % 20 !== 0 ? "1" : "0", // Every 20th customer inactive
        bnpl: 100 * i,
        gifts:
          i % 5 === 0
            ? [
                {
                  giftWallet: `800000000${i}`,
                  giftedBy: `Sponsor ${i}`,
                  giftBalance: 50,
                  label: `Gift ${i}`,
                  theme: "Birthday",
                  sponsorName: `Sponsor Company ${i}`,
                  sponsorPhone: `2519${30000000 + i}`,
                },
              ]
            : [],
      });
    }

    await DubeCustomer.insertMany(customers);
    console.log(`✅ Seeded ${customers.length} customers`);

    // Seed Suppliers
    const suppliers = [];
    for (let i = 1; i <= 10; i++) {
      suppliers.push({
        name: `Supplier ${i}`,
        wallet: `900000000${i}`,
        walletBalance: 100000 * i,
        pendingWalletBalance: 10000 * i,
        mobile: `2519${40000000 + i}`,
        dialCode: "251",
        countryCode: "ET",
        userId: (300000 + i).toString(),
        status: "1",
        project: "Palladium",
      });
    }

    await DubeSupplier.insertMany(suppliers);
    console.log(`✅ Seeded ${suppliers.length} suppliers`);

    // Seed Invoices
    const invoices = [];
    for (let i = 1; i <= 100; i++) {
      const merchantIndex = (i % 20) + 1;
      const customerIndex = (i % 50) + 1;
      const amount = Math.floor(Math.random() * 10000) + 100;
      const transactionDate = new Date(Date.now() - i * 3600000);
      const dueDate = new Date(transactionDate.getTime() + 30 * 86400000);

      invoices.push({
        transactionId: `WFPWP${Date.now()}${i}`,
        merchantName: `Merchant ${merchantIndex}`,
        merchantUserId: (100000 + merchantIndex).toString(),
        merchantMobile: `2519${10000000 + merchantIndex}`,
        customerName: `Customer ${customerIndex}`,
        customerMobile: `2519${20000000 + customerIndex}`,
        amount: amount,
        transactionDate: transactionDate,
        transactionStatus: i % 10 === 0 ? "FAILED" : "PROCESSED",
        dueDate: dueDate,
        overdue: new Date() > dueDate,
        repayed: i % 4 === 0 ? amount * 0.5 : 0,
        remainingAmount: i % 4 === 0 ? amount * 0.5 : amount,
        wallet: `300000000${merchantIndex}`,
        countryCode: "ET",
        project: "Palladium",
      });
    }

    await DubeInvoice.insertMany(invoices);
    console.log(`✅ Seeded ${invoices.length} invoices`);

    console.log("🎉 DUBE data seeding completed successfully!");

    // Display summary
    const [
      merchantCount,
      customerCount,
      invoiceCount,
      supplierCount,
      projectCount,
    ] = await Promise.all([
      DubeMerchant.countDocuments(),
      DubeCustomer.countDocuments(),
      DubeInvoice.countDocuments(),
      DubeSupplier.countDocuments(),
      DubeProject.countDocuments(),
    ]);

    console.log("\n📊 DUBE Database Summary:");
    console.log(`   Merchants: ${merchantCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Invoices: ${invoiceCount}`);
    console.log(`   Suppliers: ${supplierCount}`);
    console.log(`   Projects: ${projectCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding DUBE data:", error);
    process.exit(1);
  }
};

seedDubeData();
