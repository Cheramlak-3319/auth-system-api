const DubeMerchant = require("../models/DubeMerchant");
const DubeCustomer = require("../models/DubeCustomer");
const DubeInvoice = require("../models/DubeInvoice");
const DubeProject = require("../models/DubeProject");
const DubeSupplier = require("../models/DubeSupplier");
const DubeReceipt = require("../models/DubeReceipt");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

/**
 * Dube International Controller
 * Handles all DUBE-related operations
 */

class DubeController {
  /**
   * Get Merchant List
   * GET /dube/international/getmerchantlist.php
   */
  async getMerchantList(req, res) {
    try {
      const {
        limit = 10,
        Page = 1,
        userId,
        mobile,
        project,
        countryCode,
        active = "1",
      } = req.query;

      const filter = {};

      if (userId) filter.userid = userId;
      if (mobile) {
        // Remove country code if present
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter.mobile = { $regex: cleanMobile };
      }
      if (project) {
        if (project.includes("Standard")) {
          filter.project = "Palladium";
        } else {
          filter.project = project;
        }
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();
      if (active) filter.active = active;

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      // Get total count
      const totalCount = await DubeMerchant.countDocuments(filter);

      // Get merchants with pagination
      const merchants = await DubeMerchant.find(filter)
        .sort({ createdon: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v -createdBy -updatedBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: merchants,
      });
    } catch (error) {
      console.error("Get merchant list error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Customer List
   * GET /dube/international/getcustomerlist.php
   */
  async getCustomerList(req, res) {
    try {
      const { limit = 10, Page = 1, mobile, countryCode } = req.query;

      const filter = {};

      if (mobile) {
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter.mobile = { $regex: cleanMobile };
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      const totalCount = await DubeCustomer.countDocuments(filter);

      const customers = await DubeCustomer.find(filter)
        .sort({ createdon: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v -createdBy -updatedBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: customers,
      });
    } catch (error) {
      console.error("Get customer list error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get All Invoices
   * GET /dube/international/getallinvoices.php
   */
  async getAllInvoices(req, res) {
    try {
      const { wallet, start, end, limit = 10, offset = 0 } = req.query;

      const filter = {};

      if (wallet) filter.wallet = wallet;

      // Date range filter
      if (start || end) {
        filter.transactionDate = {};
        if (start) filter.transactionDate.$gte = new Date(start);
        if (end) filter.transactionDate.$lte = new Date(end);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      const totalCount = await DubeInvoice.countDocuments(filter);

      const invoices = await DubeInvoice.find(filter)
        .sort({ transactionDate: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select("-__v -createdBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: invoices,
      });
    } catch (error) {
      console.error("Get all invoices error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Repayment History List
   * GET /dube/international/getrepaymenthistorylist.php
   */
  async getRepaymentHistoryList(req, res) {
    try {
      const { limit = 10, Page = 1, mobile, countryCode } = req.query;

      const filter = {};

      if (mobile) {
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter["repayment.transactionId"] = { $regex: cleanMobile };
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      // Find invoices that have repayments
      const invoicesWithRepayments = await DubeInvoice.find({
        ...filter,
        repayment: { $exists: true, $not: { $size: 0 } },
      })
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Format response to match OpenAPI spec
      const repaymentHistory = invoicesWithRepayments.flatMap((invoice) =>
        invoice.repayment.map((rep) => ({
          transactionList: rep.transactionId || invoice.transactionId,
          transactionID: rep.transactionId,
          paidFrom: invoice.wallet || "",
          payerName: invoice.customerName,
          payerMobile: invoice.customerMobile,
          payerUserId: invoice.merchantUserId,
          repaidAmount: rep.amount.toString(),
          repaymentStatus: rep.status,
          repaymentDate: rep.repaymentDate,
          invoice: [
            {
              transactionId: invoice.transactionId,
              wallettype: "MERCHANT_CREDIT",
              amount: rep.amount,
              transactionDate: rep.repaymentDate,
            },
          ],
        })),
      );

      return res.status(200).json({
        error: false,
        totalCount: repaymentHistory.length.toString(),
        message: repaymentHistory,
      });
    } catch (error) {
      console.error("Get repayment history error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Top-Up History
   * GET /dube/gettopuphistory.php
   */
  async getTopUpHistory(req, res) {
    try {
      const { wallet, start, end, limit = 10, offset = 0 } = req.query;

      const filter = { transactionStatus: "PROCESSED" };

      if (wallet) filter.wallet = wallet;

      if (start || end) {
        filter.transactionDate = {};
        if (start) filter.transactionDate.$gte = new Date(start);
        if (end) filter.transactionDate.$lte = new Date(end);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      // This would typically query a separate TopUpHistory model
      // For now, we'll return sample data as per OpenAPI spec
      const sampleData = [
        {
          name: "nana Market",
          mobile: "251900000000",
          walletType: "MERCHANT_AVAILABLE",
          userId: "123456",
          transactionID: "DWT1020304050600000",
          financialInstitution: "Bank of Abyssinia",
          amount: "10.00",
          invoiceID: "1739874588-2162574953",
          InvoiceReference: "202502181329491891797258803220481",
          tracenumber:
            "https://app.ethiomobilemoney.et:2121/ammwebpay/#/?transactionNo=202502123456789091797258803220481",
          transactionStatus: "PROCESSED",
          transactionDate: "2024-11-15 14:46:27",
          transactionData: {
            from: "+251912345678",
            fromname: "Hello Marketplace",
            fromaccount: "000012334421",
            to: "0109091",
            toname: "AMASIS B",
            toaccount: "3109191",
            amount: 5,
            fee: 0.99,
            currency: "ETB",
            description: "HelloDube Wallet Refill 5190614578",
            statusdetail: "REGULAR_TRANSFER",
            statuscomment: null,
            url: "https://bill.mamapays.com/U2diMlZjN2ItYTZGWS1odzFmLWVPV2otYll0Um90Y1FLZGc4/pay",
            tracenumber: "1739874588-2162574953",
            invoiceid: "5KE23BJDN1F9IMG107J6EOFYWQ7XLEOL",
            id: "LIO000044776089ETH",
            date: "2025-02-11T11:32:56Z",
            processdate: "2025-02-11T11:32:56Z",
            status: "PROCESSED",
            system: "Bank of Abyssinia",
          },
        },
      ];

      return res.status(200).json({
        error: false,
        message: sampleData,
      });
    } catch (error) {
      console.error("Get top-up history error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Project List
   * GET /dube/international/getprojectlist.php
   */
  async getProjectList(req, res) {
    try {
      const { limit = 10, Page = 1, countryCode } = req.query;

      const filter = { active: true };

      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      const totalCount = await DubeProject.countDocuments(filter);

      const projects = await DubeProject.find(filter)
        .sort({ projectName: 1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v -createdBy -updatedBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: projects,
      });
    } catch (error) {
      console.error("Get project list error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Supplier List
   * GET /dube/international/getsupplierlist.php
   */
  async getSupplierList(req, res) {
    try {
      const { limit = 10, mobile, countryCode, offset = 0 } = req.query;

      const filter = { status: "1" };

      if (mobile) {
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter.mobile = { $regex: cleanMobile };
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      const totalCount = await DubeSupplier.countDocuments(filter);

      const suppliers = await DubeSupplier.find(filter)
        .sort({ name: 1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select("-__v -createdBy -updatedBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: suppliers,
      });
    } catch (error) {
      console.error("Get supplier list error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Receipt List
   * GET /dube/international/getreceiptlist.php
   */
  async getReceiptList(req, res) {
    try {
      const { limit = 10, countryCode, page = 1 } = req.query;

      const filter = {};

      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const totalCount = await DubeReceipt.countDocuments(filter);

      const receipts = await DubeReceipt.find(filter)
        .sort({ uploadedOn: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v -uploadedBy -processedBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: receipts,
      });
    } catch (error) {
      console.error("Get receipt list error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get All Customers
   * GET /dube/getallcustomers.php
   */
  async getAllCustomers(req, res) {
    try {
      const { limit = 10, Page = 1, mobile, countryCode } = req.query;

      const filter = {};

      if (mobile) {
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter.mobile = { $regex: cleanMobile };
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      const totalCount = await DubeCustomer.countDocuments(filter);

      const customers = await DubeCustomer.find(filter)
        .sort({ createdon: -1 })
        .skip(skip)
        .limit(limitNum)
        .select(
          "userid fullname mobile creditwallet creditbalance purchasewallet purchasebalance createdon active gifts",
        )
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: customers,
      });
    } catch (error) {
      console.error("Get all customers error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Open Invoices
   * GET /dube/getopeninvoices.php
   */
  async getOpenInvoices(req, res) {
    try {
      const { wallet, start, end, limit = 10, offset = 0 } = req.query;

      const filter = {
        transactionStatus: { $nin: ["PROCESSED", "CANCELLED"] },
      };

      if (wallet) filter.wallet = wallet;

      if (start || end) {
        filter.transactionDate = {};
        if (start) filter.transactionDate.$gte = new Date(start);
        if (end) filter.transactionDate.$lte = new Date(end);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      const totalCount = await DubeInvoice.countDocuments(filter);

      const invoices = await DubeInvoice.find(filter)
        .sort({ transactionDate: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select(
          "transactionID amount customerCreditWallet customerName customerMobile transactionDate dueDate overdue",
        )
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: invoices,
      });
    } catch (error) {
      console.error("Get open invoices error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Totals (Dashboard Statistics)
   * GET /dube/international/gettotals.php
   */
  async getTotals(req, res) {
    try {
      const { start, end } = req.query;

      const dateFilter = {};
      if (start || end) {
        dateFilter.createdon = {};
        if (start) dateFilter.createdon.$gte = new Date(start);
        if (end) dateFilter.createdon.$lte = new Date(end);
      }

      // Run parallel queries for better performance
      const [
        numberOfActiveMerchants,
        numberOfActiveCustomers,
        totalNumberOfMerchants,
        totalNumberOfSuppliers,
        totalNumberOfCustomers,
        totalInvoiceAmount,
        totalNumberOfInvoices,
      ] = await Promise.all([
        DubeMerchant.countDocuments({ ...dateFilter, active: "1" }),
        DubeCustomer.countDocuments({ ...dateFilter, active: "1" }),
        DubeMerchant.countDocuments(dateFilter),
        DubeSupplier.countDocuments(dateFilter),
        DubeCustomer.countDocuments(dateFilter),
        DubeInvoice.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        DubeInvoice.countDocuments(dateFilter),
      ]);

      const totals = [
        {
          numberOfActiveMerchants: numberOfActiveMerchants.toString(),
          numberOfActiveCustomers: numberOfActiveCustomers.toString(),
          totalNumberOfMerchants: totalNumberOfMerchants.toString(),
          totalNumberOfSuppliers: totalNumberOfSuppliers.toString(),
          totalNumberOfCustomers: totalNumberOfCustomers.toString(),
          totalInvoiceAmount: totalInvoiceAmount[0]?.total || 0,
          totalNumberOfInvoices: totalNumberOfInvoices.toString(),
        },
      ];

      return res.status(200).json({
        error: false,
        message: totals,
      });
    } catch (error) {
      console.error("Get totals error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Totals Leapfrog
   * GET /dube/international/gettotalsleapfrog.php
   */
  async getTotalsLeapfrog(req, res) {
    try {
      const { start, end } = req.query;

      // This would typically query leapfrog-specific data
      // For now, return sample data
      const leapfrogTotals = [
        {
          numberOfActiveSalesAgents: "82",
          numberOfActiveRetailers: "77056",
          totalInvoiceAmount: "2796",
          totalNumberOfInvoices: "77059",
          totalCreditAmountSalesAgents: "635",
          totalNumberOfCreditSalesAgents: "36307",
          totalCreditAmountRetailers: "537",
          totalNumberOfCreditRetailers: "137",
          totalRepayedAmount: 69255702.57,
          totalNumberOfRepayment: "234669",
          totalUnpaidInvoicesAmount: "234669",
          totalNumberOfUnpaidInvoices: 234669,
          totalOverdueInvoicesAmount: 234669,
          totalNumberOfOverdueInvoices: 234669,
        },
      ];

      return res.status(200).json({
        error: false,
        message: leapfrogTotals,
      });
    } catch (error) {
      console.error("Get leapfrog totals error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Register a new Project
   * POST /dube/international/registerproject.php
   */
  async registerProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: true,
          message: errors.array()[0].msg,
        });
      }

      const {
        projectName,
        countryCode,
        mobile,
        settlementAccount,
        settlementBank,
      } = req.body;

      // Check if project already exists
      const existingProject = await DubeProject.findOne({ projectName });
      if (existingProject) {
        return res.status(400).json({
          error: true,
          message: "Project already exists",
        });
      }

      // Country code to country name mapping
      const countryNames = {
        ET: "Ethiopia",
        KE: "Kenya",
        SN: "Senegal",
        UG: "Uganda",
        TZ: "Tanzania",
        RW: "Rwanda",
        BI: "Burundi",
      };

      const newProject = new DubeProject({
        projectName,
        countryCode: countryCode.toUpperCase(),
        countryName: countryNames[countryCode.toUpperCase()] || countryCode,
        mobile,
        settlementAccount,
        settlementBank,
        creditDisbursementWallet: Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString(),
        earningWallet: Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString(),
        createdBy: req.user.userId,
      });

      await newProject.save();

      return res.status(201).json({
        error: false,
        message: "Project created successfully.",
      });
    } catch (error) {
      console.error("Register project error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Project already exists",
        });
      }
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Register a new Supplier
   * POST /dube/international/registersupplier.php
   */
  async registerSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: true,
          message: errors.array()[0].msg,
        });
      }

      const { fullname, project, mobile, dialCode } = req.body;

      // Extract country code from dial code
      const dialCodeToCountry = {
        251: "ET",
        254: "KE",
        221: "SN",
        256: "UG",
        255: "TZ",
        250: "RW",
        257: "BI",
      };

      const countryCode = dialCodeToCountry[dialCode] || "ET";

      // Check if supplier already exists
      const existingSupplier = await DubeSupplier.findOne({ mobile });
      if (existingSupplier) {
        return res.status(400).json({
          error: true,
          message: "Supplier already exists",
        });
      }

      const newSupplier = new DubeSupplier({
        name: fullname,
        wallet: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        walletBalance: 0,
        pendingWalletBalance: 0,
        mobile,
        dialCode,
        countryCode,
        project,
        userId: Math.floor(100000 + Math.random() * 900000).toString(),
        createdBy: req.user.userId,
      });

      await newSupplier.save();

      return res.status(201).json({
        error: false,
        message: "Supplier registered successfully.",
      });
    } catch (error) {
      console.error("Register supplier error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Supplier already exists",
        });
      }
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Register Supplier Product
   * POST /dube/international/registersupplierproduct.php
   */
  async registerSupplierProduct(req, res) {
    try {
      const {
        supplierName,
        supplierId,
        supplierPhone,
        productReference,
        productName,
        price,
        requireReceipt,
        wallet,
        encodedFile,
        filename,
        taxPercentage = "0",
        incrementPercent = "0",
      } = req.body;

      // Validate required fields
      if (!supplierName || !supplierId || !productName || !price) {
        return res.status(400).json({
          error: true,
          message: "Missing required fields",
        });
      }

      // In a real implementation, you would:
      // 1. Validate supplier exists
      // 2. Process the encoded file (base64 image)
      // 3. Create product record
      // 4. Store product image

      return res.status(201).json({
        error: false,
        message: "Supplier product registered successfully.",
      });
    } catch (error) {
      console.error("Register supplier product error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Change Phone Number
   * POST /dube/international/changephonenumber.php
   */
  async changePhoneNumber(req, res) {
    try {
      const { userId, toMobile, dialCode } = req.body;

      if (!userId || !toMobile || !dialCode) {
        return res.status(400).json({
          error: true,
          message: "Missing required fields",
        });
      }

      // Find and update both merchant and customer records
      const [merchantUpdate, customerUpdate] = await Promise.all([
        DubeMerchant.findOneAndUpdate(
          { userid: userId },
          {
            mobile: toMobile,
            dialCode: dialCode,
          },
          { new: true },
        ),
        DubeCustomer.findOneAndUpdate(
          { userid: userId },
          {
            mobile: toMobile,
            dialCode: dialCode,
          },
          { new: true },
        ),
      ]);

      if (!merchantUpdate && !customerUpdate) {
        return res.status(404).json({
          error: true,
          message: "User not found",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Phone number updated successfully.",
      });
    } catch (error) {
      console.error("Change phone number error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Change User Name
   * POST /dube/changename.php
   */
  async changeName(req, res) {
    try {
      const { userId, fullName } = req.body;

      if (!userId || !fullName) {
        return res.status(400).json({
          error: true,
          message: "Missing required fields",
        });
      }

      // Update both merchant and customer records
      const [merchantUpdate, customerUpdate] = await Promise.all([
        DubeMerchant.findOneAndUpdate(
          { userid: userId },
          { fullname: fullName },
          { new: true },
        ),
        DubeCustomer.findOneAndUpdate(
          { userid: userId },
          { fullname: fullName },
          { new: true },
        ),
      ]);

      if (!merchantUpdate && !customerUpdate) {
        return res.status(404).json({
          error: true,
          message: "User not found",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Full name updated successfully.",
      });
    } catch (error) {
      console.error("Change name error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Update Receipt Status
   * POST /dube/international/updatereceiptstatus.php
   */
  async updateReceiptStatus(req, res) {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({
          error: true,
          message: "Missing required fields",
        });
      }

      const receipt = await DubeReceipt.findOneAndUpdate(
        { id },
        {
          status,
          processedBy: req.user.userId,
          processedAt: new Date(),
        },
        { new: true },
      );

      if (!receipt) {
        return res.status(404).json({
          error: true,
          message: "Receipt not found",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Receipt status updated successfully.",
      });
    } catch (error) {
      console.error("Update receipt status error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Customer Self Registration
   * POST /dube/international/customerselfregistration.php
   */
  async customerSelfRegistration(req, res) {
    try {
      const { mobile, fullName, dialCode } = req.body;

      if (!mobile || !fullName || !dialCode) {
        return res.status(400).json({
          error: true,
          message: "Missing required fields",
        });
      }

      // Check if customer already exists
      const existingCustomer = await DubeCustomer.findOne({ mobile });
      if (existingCustomer) {
        return res.status(400).json({
          error: true,
          message: "Customer already registered",
        });
      }

      // Extract country code from dial code
      const dialCodeToCountry = {
        251: "ET",
        254: "KE",
        221: "SN",
        256: "UG",
        255: "TZ",
        250: "RW",
        257: "BI",
      };

      const countryCode = dialCodeToCountry[dialCode] || "ET";

      const newCustomer = new DubeCustomer({
        userid: Math.floor(100000 + Math.random() * 900000).toString(),
        fullname: fullName,
        mobile,
        dialCode,
        countryCode,
        creditwallet: Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString(),
        purchasewallet: Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString(),
        active: "1",
      });

      await newCustomer.save();

      return res.status(201).json({
        error: false,
        message: "User registered successfully.",
      });
    } catch (error) {
      console.error("Customer self registration error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Customer already registered",
        });
      }
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get All Invoices (Alternative endpoint)
   * GET /dube/getallinvoices.php
   */
  async getAllInvoicesAlt(req, res) {
    try {
      const { wallet, start, end, limit = 100, offset = 0 } = req.query;

      const filter = {};

      if (wallet) filter.wallet = wallet;

      if (start || end) {
        filter.transactionDate = {};
        if (start) filter.transactionDate.$gte = new Date(start);
        if (end) filter.transactionDate.$lte = new Date(end);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      const totalCount = await DubeInvoice.countDocuments(filter);

      const invoices = await DubeInvoice.find(filter)
        .sort({ transactionDate: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select("-__v -createdBy")
        .lean();

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: invoices,
      });
    } catch (error) {
      console.error("Get all invoices (alt) error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Totals (Dashboard)
   * GET /dube/gettotals.php
   */
  async getTotalsDashboard(req, res) {
    try {
      const { start, end } = req.query;

      const dateFilter = {};
      if (start || end) {
        dateFilter.createdon = {};
        if (start) dateFilter.createdon.$gte = new Date(start);
        if (end) dateFilter.createdon.$lte = new Date(end);
      }

      const [
        numberOfActiveMerchants,
        numberOfActiveCustomers,
        totalNumberOfMerchants,
        totalNumberOfCustomers,
        totalInvoiceAmount,
        totalNumberOfInvoices,
      ] = await Promise.all([
        DubeMerchant.countDocuments({ ...dateFilter, active: "1" }),
        DubeCustomer.countDocuments({ ...dateFilter, active: "1" }),
        DubeMerchant.countDocuments(dateFilter),
        DubeCustomer.countDocuments(dateFilter),
        DubeInvoice.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        DubeInvoice.countDocuments(dateFilter),
      ]);

      const totals = [
        {
          numberOfActiveMerchants: numberOfActiveMerchants.toString(),
          numberOfActiveCustomers: numberOfActiveCustomers,
          totalNumberOfMerchants: totalNumberOfMerchants.toString(),
          totalNumberOfCustomers: totalNumberOfCustomers.toString(),
          totalInvoiceAmount: totalInvoiceAmount[0]?.total || 0,
          totalNumberOfInvoices: totalNumberOfInvoices.toString(),
        },
      ];

      return res.status(200).json({
        error: false,
        message: totals,
      });
    } catch (error) {
      console.error("Get dashboard totals error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Cash In and Out Totals
   * GET /dube/getcashinandouttotals.php
   */
  async getCashInAndOutTotals(req, res) {
    try {
      // This would typically query transaction data
      // For now, return sample data
      const cashTotals = [
        {
          totalCashInAmount: "255763017067.2603",
          totalNumberOfCashIns: "363",
          totalCashoutAmount: "36307",
          totalNumberOfCashouts: "7590",
          totalCreditAmount: "4661786",
          totalNumberOfCredit: "914",
        },
      ];

      return res.status(200).json({
        error: false,
        message: cashTotals,
      });
    } catch (error) {
      console.error("Get cash in/out totals error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Invoices and Repayments
   * GET /dube/getinvoicesandrepayments.php
   */
  async getInvoicesAndRepayments(req, res) {
    try {
      // This would typically query invoice and repayment data
      // For now, return sample data
      const invoiceRepaymentData = [
        {
          totalRepayedAmount: "296556.1291",
          totalRepayedNumber: "895",
          totalToBePaidAmount: "174157.80000000005",
          totalToBePaidNumber: "247",
          totalOverdueAmount: "172935.15000000002",
          totalOverdueNumber: "241",
          totalInvoiceAmount: "732",
          totalInvoiceNumber: "4165736.7399999998",
        },
      ];

      return res.status(200).json({
        error: false,
        message: invoiceRepaymentData,
      });
    } catch (error) {
      console.error("Get invoices and repayments error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Repayment History List (Alternative)
   * GET /dube/getrepaymenthistorylist.php
   */
  async getRepaymentHistoryListAlt(req, res) {
    try {
      const { limit = 10, Page = 1, mobile, countryCode } = req.query;

      const filter = {};

      if (mobile) {
        const cleanMobile = mobile.replace(/[^\d]/g, "");
        filter["repayment.transactionId"] = { $regex: cleanMobile };
      }
      if (countryCode) filter.countryCode = countryCode.toUpperCase();

      const page = parseInt(Page);
      const limitNum = parseInt(limit);
      const skip = (page - 1) * limitNum;

      const invoicesWithRepayments = await DubeInvoice.find({
        ...filter,
        repayment: { $exists: true, $not: { $size: 0 } },
      })
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const repaymentHistory = invoicesWithRepayments.flatMap((invoice) =>
        invoice.repayment.map((rep) => ({
          transactionList: rep.transactionId || invoice.transactionId,
          transactionID: rep.transactionId,
          paidFrom: invoice.wallet || "",
          payerName: invoice.customerName,
          payerMobile: invoice.customerMobile,
          repaidAmount: rep.amount.toString(),
          repaymentStatus: rep.status,
          repaymentDate: rep.repaymentDate,
          wallets: [
            {
              name: "1190073738",
              wallettype: "MERCHANT_CREDIT",
              balance: "2000000",
              bnpl: "2000000",
            },
            {
              name: "1451013738",
              wallettype: "MERCHANT_AVAILABLE",
              balance: "1500000",
              bnpl: "1500000",
            },
            {
              name: "4197613738",
              wallettype: "MERCHANT_EARNING",
              balance: "1500000",
              bnpl: "1500000",
            },
          ],
          foodCategory: "desert",
        })),
      );

      return res.status(200).json({
        error: false,
        totalCount: repaymentHistory.length.toString(),
        message: repaymentHistory,
      });
    } catch (error) {
      console.error("Get repayment history (alt) error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Customer Credit History (POST)
   * POST /dube/getcustomercredithistory.php
   */
  async getCustomerCreditHistory(req, res) {
    try {
      const { wallet, start, end, limit = 10, offset = 0 } = req.body;

      if (!wallet) {
        return res.status(400).json({
          error: true,
          message: "Wallet is required",
        });
      }

      const filter = { wallet };

      if (start || end) {
        filter.transactionDate = {};
        if (start) filter.transactionDate.$gte = new Date(start);
        if (end) filter.transactionDate.$lte = new Date(end);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      // This would typically query credit history
      // For now, return sample data
      const creditHistory = [
        {
          transactionId: "DW12345678AbC1234",
          senderName: "HelloDube",
          senderMobile: "251900000000",
          creditAmount: "9733",
          transactionStatus: "PROCESSED",
          transactionDate: "2024-11-15 14:46:27",
        },
      ];

      return res.status(200).json({
        error: false,
        totalCount: "1",
        message: creditHistory,
      });
    } catch (error) {
      console.error("Get customer credit history error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Payment History (POST)
   * POST /dube/getpaymenthistory.php
   */
  async getPaymentHistory(req, res) {
    try {
      const { wallet, start, end, limit = 10, offset = 0 } = req.body;

      if (!wallet) {
        return res.status(400).json({
          error: true,
          message: "Wallet is required",
        });
      }

      // This would typically query payment history
      // For now, return sample data
      const paymentHistory = [
        {
          transactionId: "DW12345678AbC1234",
          payerName: "HelloDube",
          payerMobile: "251900000000",
          paidAmount: "200000",
          receivedAmount: "19000",
          transactionStatus: "PROCESSED",
          transactionDate: "2024-11-15 14:46:27",
          remark: "invoice",
        },
      ];

      return res.status(200).json({
        error: false,
        totalCount: "1",
        message: paymentHistory,
      });
    } catch (error) {
      console.error("Get payment history error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Single Cashout History
   * POST /dube/getcashouthistory.php
   */
  async getCashoutHistory(req, res) {
    try {
      const { wallet, id } = req.body;

      if (!wallet || !id) {
        return res.status(400).json({
          error: true,
          message: "Wallet and ID are required",
        });
      }

      // This would typically query cashout history
      // For now, return sample data
      const cashoutHistory = {
        wallet: "2299401133",
        name: "hello shop",
        mobile: "251900000000",
        bank: "Bank of Abyssinia",
        accountNumber: "1234567890",
        amount: "10.00",
        status: "PROCESSED",
        requestDate: "2024-11-15 14:46:27",
        transactionDate: {
          error: false,
          message: "Successfully Transfered.",
        },
      };

      return res.status(200).json({
        error: false,
        message: cashoutHistory,
      });
    } catch (error) {
      console.error("Get cashout history error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * Get Customer List of Merchant
   * POST /dube/getcustomerlistofmerchant.php
   */
  async getCustomerListOfMerchant(req, res) {
    try {
      const { mobile } = req.body;

      if (!mobile) {
        return res.status(400).json({
          error: true,
          message: "Mobile number is required",
        });
      }

      // Find merchant by mobile
      const merchant = await DubeMerchant.findOne({ mobile });
      if (!merchant) {
        return res.status(404).json({
          error: true,
          message: "Merchant not found",
        });
      }

      // Find customers created by this merchant
      const customers = await DubeCustomer.find({
        merchantMobile: mobile,
        active: "1",
      })
        .select(
          "userid walletType fullname mobile wallet balance initialDeposit createdOn bnplBalance creditPayment creditRepayment",
        )
        .lean();

      return res.status(200).json({
        error: false,
        message: customers,
      });
    } catch (error) {
      console.error("Get customer list of merchant error:", error);
      return res.status(500).json({
        error: true,
        message: "An internal server error occurred.",
      });
    }
  }
}

module.exports = new DubeController();
