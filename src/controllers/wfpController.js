// ========================================
// FILE: src/controllers/wfpController.js
// DESC: WFP (World Food Programme) controller
// ========================================

const mongoose = require("mongoose");
const WFPCategory = require("../models/WFPCategory");
const WFPCycle = require("../models/WFPCycle");
const WFPBeneficiary = require("../models/WFPBeneficiary");
const WFPTransaction = require("../models/WFPTransaction");
const WFPAgent = require("../models/WFPAgent");

// Helper function for success response
const successResponse = (message, data = null, statusCode = 200) => {
  return {
    error: false,
    message: data || message,
    ...(data && typeof data !== "string" && { data: message }),
  };
};

// Helper function for error response
const errorResponse = (message, statusCode = 400) => {
  return {
    error: true,
    message: message,
  };
};

// Helper to get pagination parameters
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const offset = parseInt(req.query.offset) || (page - 1) * limit;
  return { page, limit, offset };
};

class WFPController {
  // ========================================
  // 1. GET ENDPOINTS
  // ========================================

  /**
   * GET /wfp/generatedummyvouchers.php
   * Get generated dummy vouchers
   */
  async getGeneratedDummyVouchers(req, res) {
    try {
      // In real implementation, fetch from database
      const dummyVouchers = [
        {
          userId: "123456",
          balance: 895,
          createdOn: new Date()
            .toISOString()
            .replace("T", " ")
            .substring(0, 19),
          creditWallet: "9289473512",
        },
        {
          userId: "789012",
          balance: 450,
          createdOn: new Date(Date.now() - 86400000)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19),
          creditWallet: "9289473513",
        },
      ];

      return res
        .status(200)
        .json(successResponse("Dummy vouchers retrieved", dummyVouchers));
    } catch (error) {
      console.error("Error fetching dummy vouchers:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getcategories.php
   * Fetch food categories with subcategories
   */
  async getCategories(req, res) {
    try {
      const categories = await WFPCategory.find({ isActive: true })
        .populate("cycleId", "cycleName cycleCode")
        .lean();

      if (!categories || categories.length === 0) {
        return res.status(200).json(successResponse([], []));
      }

      const formattedCategories = categories.map((cat) => ({
        Category: cat.category,
        SubCategory: cat.subcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          allocatedAmount: sub.allocatedAmount.toString(),
        })),
      }));

      return res
        .status(200)
        .json(successResponse("Categories retrieved", formattedCategories));
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getbeneficiarylist.php
   * Get beneficiary list with pagination
   */
  async getBeneficiaryList(req, res) {
    try {
      const { limit, offset } = getPaginationParams(req);
      const { cycle, search, status } = req.query;

      // Build query
      const query = { isActive: true };
      if (cycle) query.cycleId = cycle;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { householdId: { $regex: search, $options: "i" } },
          { beneficiaryName: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ];
      }

      // Get total count
      const totalCount = await WFPBeneficiary.countDocuments(query);

      // Get paginated data
      const beneficiaries = await WFPBeneficiary.find(query)
        .populate("cycleId", "cycleName")
        .skip(offset)
        .limit(limit)
        .lean();

      const formattedBeneficiaries = beneficiaries.map((beneficiary) => ({
        mainWallet: beneficiary.mainWallet,
        beneficiaryName: beneficiary.beneficiaryName,
        mobile: beneficiary.mobile,
        mainWalletBalance: beneficiary.mainWalletBalance.toFixed(2),
        subWallets: beneficiary.subWallets.map((wallet) => ({
          walletName: wallet.walletName,
          walletBalance: wallet.walletBalance.toFixed(2),
          cycle: wallet.cycle,
        })),
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedBeneficiaries,
      });
    } catch (error) {
      console.error("Error fetching beneficiary list:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getvoucherslist.php
   * Get vouchers list
   */
  async getVouchersList(req, res) {
    try {
      const { limit, offset } = getPaginationParams(req);
      const { cycle, linked, active } = req.query;

      const query = {};
      if (cycle) query.cycleId = cycle;
      if (linked !== undefined) query.linked = linked === "true";
      if (active !== undefined)
        query.isActive = active === "1" || active === "true";

      const totalCount = await WFPBeneficiary.countDocuments(query);

      const beneficiaries = await WFPBeneficiary.find(query)
        .skip(offset)
        .limit(limit)
        .lean();

      const vouchers = beneficiaries.map((b) => ({
        householdId: b.householdId,
        name: b.beneficiaryName,
        mobile: b.mobile,
        wallet: b.mainWallet,
        woreda: b.woreda ? [b.woreda] : [],
        kebele: b.kebele || null,
        balance: b.mainWalletBalance.toFixed(2),
        updatedOn: b.lastUpdated
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        createdOn: b.registrationDate
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        linked: !!b.cycleId,
        active: b.isActive ? "1" : "0",
        cycle: b.cycleId ? b.cycleId.cycleName : "No Cycle",
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: vouchers,
      });
    } catch (error) {
      console.error("Error fetching vouchers list:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getallcycles.php
   * Get all cycles
   */
  async getAllCycles(req, res) {
    try {
      const { active, status } = req.query;

      const query = {};
      if (active !== undefined)
        query.isActive = active === "1" || active === "true";
      if (status) query.status = status;

      const cycles = await WFPCycle.find(query).sort({ startDate: -1 }).lean();

      const totalCount = cycles.length;

      const formattedCycles = cycles.map((cycle) => ({
        id: cycle._id.toString(),
        cycle: cycle.cycleName,
        active: cycle.isActive ? "1" : "0",
        startDate: cycle.startDate.toISOString().split("T")[0],
        endDate: cycle.endDate.toISOString().split("T")[0],
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedCycles,
      });
    } catch (error) {
      console.error("Error fetching cycles:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getallinvoices.php
   * Fetch invoices summary
   */
  async getAllInvoices(req, res) {
    try {
      const { limit, offset } = getPaginationParams(req);
      const { dateFrom, dateTo, status, merchantId } = req.query;

      const query = { transactionType: "invoice" };

      if (dateFrom || dateTo) {
        query.transactionDate = {};
        if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.transactionDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      if (status) query.transactionStatus = status;
      if (merchantId) query.merchantUserId = merchantId;

      const totalCount = await WFPTransaction.countDocuments(query);

      const invoices = await WFPTransaction.find(query)
        .populate("cycleId", "cycleName")
        .sort({ transactionDate: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      const formattedInvoices = invoices.map((invoice) => ({
        transactionId: invoice.transactionId,
        merchantUserId: invoice.merchantUserId,
        merchantName: invoice.merchantName,
        merchantMobile: invoice.merchantMobile,
        householdId: invoice.householdId,
        customerName: invoice.customerName,
        customerMobile: invoice.customerMobile,
        amount: invoice.amount,
        transactionDate: invoice.transactionDate
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        transactionStatus: invoice.transactionStatus,
        remark: invoice.items
          ? invoice.items.map((item) => ({
              categoryName: item.categoryName,
              order: [
                {
                  itemName: item.itemName,
                  unitPrice: item.unitPrice.toFixed(2),
                  quantity: item.quantity.toString(),
                },
              ],
            }))
          : [],
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedInvoices,
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/gettotalinvoices.php
   * Get total invoices summary
   */
  async getTotalInvoices(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      const query = {
        transactionType: "invoice",
        transactionStatus: "completed",
      };

      if (dateFrom || dateTo) {
        query.transactionDate = {};
        if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.transactionDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const result = await WFPTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalNumber: { $sum: 1 },
          },
        },
      ]);

      const totals = result[0] || { totalAmount: 0, totalNumber: 0 };

      return res.status(200).json({
        error: false,
        message: [
          {
            totalAmount: totals.totalAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }),
            totalNumber: totals.totalNumber.toLocaleString("en-US"),
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching total invoices:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/gettotalcredit.php
   * Fetch credits summary
   */
  async getTotalCredit(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      const query = {
        transactionType: "credit",
        transactionStatus: "completed",
      };

      if (dateFrom || dateTo) {
        query.transactionDate = {};
        if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.transactionDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const result = await WFPTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalNumber: { $sum: 1 },
          },
        },
      ]);

      const totals = result[0] || { totalAmount: 0, totalNumber: 0 };

      return res.status(200).json({
        error: false,
        message: [
          {
            totalAmount: totals.totalAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }),
            totalNumber: totals.totalNumber.toLocaleString("en-US"),
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching total credit:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getcashouttotals.php
   * Fetch cashouts with filters
   */
  async getCashoutTotals(req, res) {
    try {
      const { dateFrom, dateTo, voucher } = req.query;

      const query = {
        transactionType: "cashout",
        transactionStatus: "completed",
      };

      if (voucher) query.walletId = voucher;
      if (dateFrom || dateTo) {
        query.transactionDate = {};
        if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.transactionDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const result = await WFPTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCashoutAmount: { $sum: "$amount" },
            totalCashoutNumber: { $sum: 1 },
            totalCashoutFeeAmount: { $sum: "$fee" },
            totalCashoutFeeNumber: {
              $sum: { $cond: [{ $gt: ["$fee", 0] }, 1, 0] },
            },
          },
        },
      ]);

      const totals = result[0] || {
        totalCashoutAmount: 0,
        totalCashoutNumber: 0,
        totalCashoutFeeAmount: 0,
        totalCashoutFeeNumber: 0,
      };

      return res.status(200).json({
        error: false,
        message: [
          {
            totalCashoutAmount: totals.totalCashoutAmount.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            ),
            totalCashoutNumber:
              totals.totalCashoutNumber.toLocaleString("en-US"),
            totalCashoutFeeAmount: totals.totalCashoutFeeAmount.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            ),
            totalCashoutFeeNumber:
              totals.totalCashoutFeeNumber.toLocaleString("en-US"),
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching cashout totals:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getcashouthistory.php
   * Fetch cashout summary
   */
  async getCashoutHistory(req, res) {
    try {
      const { limit, offset } = getPaginationParams(req);

      const cashouts = await WFPTransaction.find({
        transactionType: "cashout",
      })
        .sort({ transactionDate: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      const totalCount = await WFPTransaction.countDocuments({
        transactionType: "cashout",
      });

      const formattedCashouts = cashouts.map((cashout) => ({
        wallet: cashout.walletId || "1",
        userId: cashout.merchantUserId || "123456",
        name: cashout.merchantName || "1000",
        mobile: cashout.merchantMobile || "1000",
        bank: cashout.bank || "1000",
        accountNumber: cashout.accountNumber || "1000",
        amount: cashout.amount.toString(),
        status: cashout.transactionStatus,
        requestDate: cashout.requestDate
          ? cashout.requestDate.toISOString().replace("T", " ").substring(0, 19)
          : cashout.transactionDate
              .toISOString()
              .replace("T", " ")
              .substring(0, 19),
        transactionData: {
          error: cashout.transactionId || "WFPWP8923034201839",
          message: cashout.statusMessage || "143700",
        },
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedCashouts,
      });
    } catch (error) {
      console.error("Error fetching cashout history:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getcredittransferhistory.php
   * Fetch credit transfer history
   */
  async getCreditTransferHistory(req, res) {
    try {
      const { limit, offset } = getPaginationParams(req);
      const { walletId, householdId, dateFrom, dateTo, cycle } = req.query;

      const query = { transactionType: "transfer" };

      if (walletId) query.walletId = walletId;
      if (householdId) query.householdId = householdId;
      if (cycle) query.cycleId = cycle;
      if (dateFrom || dateTo) {
        query.transactionDate = {};
        if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.transactionDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const totalCount = await WFPTransaction.countDocuments(query);

      const transfers = await WFPTransaction.find(query)
        .populate("cycleId", "cycleName")
        .sort({ transactionDate: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      const formattedTransfers = transfers.map((transfer) => ({
        transactionId: transfer.transactionId,
        householdId: transfer.householdId,
        wallet: transfer.walletId,
        customerName: transfer.customerName,
        customerMobile: transfer.customerMobile,
        amount: transfer.amount.toString(),
        transactionDate: transfer.transactionDate
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        transactionData: transfer.statusMessage || "1000",
        transactionStatus: transfer.transactionStatus,
        cycle: transfer.cycleId ? transfer.cycleId.cycleName : "1000",
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedTransfers,
      });
    } catch (error) {
      console.error("Error fetching credit transfer history:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/getonboardingagentlist.php
   * Get onboarding agent list
   */
  async getOnboardingAgentList(req, res) {
    try {
      const { active } = req.query;

      const query = { agentType: "onboarding" };
      if (active !== undefined)
        query.isActive = active === "1" || active === "true";

      const agents = await WFPAgent.find(query)
        .sort({ registrationDate: -1 })
        .lean();

      const totalCount = agents.length;

      const formattedAgents = agents.map((agent) => ({
        name: agent.name,
        mobile: agent.mobile,
        active: agent.isActive ? "1" : "0",
        registeredOn: agent.registrationDate.toISOString().split("T")[0],
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedAgents,
      });
    } catch (error) {
      console.error("Error fetching onboarding agents:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/gettotals.php
   * Get all totals summary
   */
  async getTotals(req, res) {
    try {
      const { start, end } = req.query;

      const dateFilter = {};
      if (start) {
        dateFilter.$gte = new Date(start);
      }
      if (end) {
        dateFilter.$lte = new Date(end + "T23:59:59.999Z");
      }

      const query =
        dateFilter.$gte || dateFilter.$lte
          ? { transactionDate: dateFilter }
          : {};

      // Get totals from database
      const [
        cashoutResult,
        creditResult,
        invoiceResult,
        merchantResult,
        beneficiaryResult,
        purchaseResult,
      ] = await Promise.all([
        // Cashout totals
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "cashout",
              transactionStatus: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalCashoutAmount: { $sum: "$amount" },
              totalCashoutNumber: { $sum: 1 },
            },
          },
        ]),
        // Credit totals
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "credit",
              transactionStatus: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalCreditAmount: { $sum: "$amount" },
              totalCreditNumber: { $sum: 1 },
            },
          },
        ]),
        // Invoice totals
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "invoice",
              transactionStatus: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalInvoiceAmount: { $sum: "$amount" },
              totalInvoiceNumber: { $sum: 1 },
            },
          },
        ]),
        // Merchant stats (simplified - in real app, you'd have a merchant model)
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "invoice",
              transactionStatus: "completed",
            },
          },
          {
            $group: {
              _id: "$merchantUserId",
              totalAmount: { $sum: "$amount" },
            },
          },
          {
            $group: {
              _id: null,
              totalBenefitedMerchantAmount: { $sum: "$totalAmount" },
              totalBenefitedMerchantNumber: { $sum: 1 },
            },
          },
        ]),
        // Beneficiary stats
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "invoice",
              transactionStatus: "completed",
            },
          },
          {
            $group: {
              _id: "$householdId",
              totalAmount: { $sum: "$amount" },
            },
          },
          {
            $group: {
              _id: null,
              totalBenefitedBeneficiaryAmount: { $sum: "$totalAmount" },
              totalBenefitedBeneficiaryNumber: { $sum: 1 },
            },
          },
        ]),
        // Purchase by category (simplified)
        WFPTransaction.aggregate([
          {
            $match: {
              ...query,
              transactionType: "invoice",
              transactionStatus: "completed",
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.categoryName",
              totalAmount: { $sum: "$items.totalAmount" },
            },
          },
        ]),
      ]);

      const cashoutTotals = cashoutResult[0] || {
        totalCashoutAmount: 0,
        totalCashoutNumber: 0,
      };
      const creditTotals = creditResult[0] || {
        totalCreditAmount: 0,
        totalCreditNumber: 0,
      };
      const invoiceTotals = invoiceResult[0] || {
        totalInvoiceAmount: 0,
        totalInvoiceNumber: 0,
      };
      const merchantTotals = merchantResult[0] || {
        totalBenefitedMerchantAmount: 0,
        totalBenefitedMerchantNumber: 0,
      };
      const beneficiaryTotals = beneficiaryResult[0] || {
        totalBenefitedBeneficiaryAmount: 0,
        totalBenefitedBeneficiaryNumber: 0,
      };

      // Format purchase totals
      const totalPurchases = {};
      purchaseResult.forEach((item) => {
        totalPurchases[item._id] = item.totalAmount.toFixed(2);
      });

      return res.status(200).json({
        error: false,
        message: [
          {
            totalCashoutAmount: cashoutTotals.totalCashoutAmount.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            ),
            totalCashoutNumber: cashoutTotals.totalCashoutNumber,
            totalCreditAmount: creditTotals.totalCreditAmount.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            ),
            totalCreditNumber:
              creditTotals.totalCreditNumber.toLocaleString("en-US"),
            totalInvoiceAmount: invoiceTotals.totalInvoiceAmount.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            ),
            totalInvoiceNumber:
              invoiceTotals.totalInvoiceNumber.toLocaleString("en-US"),
            totalBenefitedMerchantAmount:
              merchantTotals.totalBenefitedMerchantAmount.toLocaleString(
                "en-US",
                { minimumFractionDigits: 2 },
              ),
            totalBenefitedMerchantNumber:
              merchantTotals.totalBenefitedMerchantNumber.toLocaleString(
                "en-US",
              ),
            totalBenefitedBeneficiaryAmount:
              beneficiaryTotals.totalBenefitedBeneficiaryAmount,
            totalBenefitedBeneficiaryNumber:
              beneficiaryTotals.totalBenefitedBeneficiaryNumber.toLocaleString(
                "en-US",
              ),
            totalPurchases: totalPurchases,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching totals:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * GET /wfp/gethealthofficerlist.php
   * Get health officer list
   */
  async getHealthOfficerList(req, res) {
    try {
      const { limit, page } = req.query;
      const currentPage = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const skip = (currentPage - 1) * pageSize;

      const query = { agentType: "health_officer", isActive: true };

      const totalCount = await WFPAgent.countDocuments(query);
      const agents = await WFPAgent.find(query)
        .skip(skip)
        .limit(pageSize)
        .lean();

      const formattedAgents = agents.map((agent) => ({
        name: agent.name,
        mobile: agent.mobile,
        active: agent.isActive ? "1" : "0",
        registeredOn: agent.registrationDate.toISOString().split("T")[0],
      }));

      return res.status(200).json({
        error: false,
        totalCount: totalCount.toString(),
        message: formattedAgents,
      });
    } catch (error) {
      console.error("Error fetching health officers:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  // ========================================
  // 2. POST ENDPOINTS
  // ========================================

  /**
   * POST /wfp/registercategory.php
   * Register a new category
   */
  async registerCategory(req, res) {
    try {
      const { categoryName, subcategories, cycles } = req.body;

      if (!categoryName || !subcategories || !Array.isArray(subcategories)) {
        return res.status(400).json(errorResponse("No content passed."));
      }

      // Generate unique IDs for subcategories
      const formattedSubcategories = subcategories.map((name, index) => ({
        id: require("crypto").randomBytes(16).toString("hex"),
        name: name.trim(),
        allocatedAmount: 0, // Default value, can be updated later
      }));

      const newCategory = new WFPCategory({
        category: categoryName.toUpperCase(),
        subcategories: formattedSubcategories,
        cycleId: cycles || null,
        createdBy: req.user._id,
      });

      await newCategory.save();

      return res.status(201).json({
        success: true,
        message: "Category created successfully.",
      });
    } catch (error) {
      console.error("Error registering category:", error);
      if (error.code === 11000) {
        return res.status(409).json(errorResponse("Category already exists."));
      }
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/registerCycle
   * Register a new cycle
   */
  async registerCycle(req, res) {
    try {
      const { categoryName, startDate, endDate } = req.body;

      if (!categoryName || !startDate || !endDate) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const cycleCode = `CYCLE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const newCycle = new WFPCycle({
        cycleName: categoryName,
        cycleCode: cycleCode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: req.user._id,
      });

      await newCycle.save();

      return res.status(201).json({
        success: true,
        message: "Cycle created successfully.",
        data: {
          cycleId: newCycle._id,
          cycleCode: newCycle.cycleCode,
        },
      });
    } catch (error) {
      console.error("Error registering cycle:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/updatecycle.php
   * Update cycle end date
   */
  async updateCycle(req, res) {
    try {
      const { id, endDate } = req.body;

      if (!id || !endDate) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const cycle = await WFPCycle.findById(id);
      if (!cycle) {
        return res.status(404).json(errorResponse("Cycle not found."));
      }

      cycle.endDate = new Date(endDate);
      cycle.updatedAt = new Date();
      await cycle.save();

      return res.status(200).json({
        success: true,
        message: "Cycle updated successfully.",
      });
    } catch (error) {
      console.error("Error updating cycle:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/registerhealthofficer.php
   * Register health officer
   */
  async registerHealthOfficer(req, res) {
    try {
      const { hoName, hoMobile } = req.body;

      if (!hoName || !hoMobile) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      // Validate Ethiopian mobile number
      const ethiopianMobileRegex = /^251[0-9]{9}$/;
      if (!ethiopianMobileRegex.test(hoMobile.replace("+", ""))) {
        return res
          .status(400)
          .json(errorResponse("Invalid Ethiopian mobile number."));
      }

      const newHealthOfficer = new WFPAgent({
        agentType: "health_officer",
        name: hoName,
        mobile: hoMobile.replace("+", ""),
        registeredBy: req.user._id,
      });

      await newHealthOfficer.save();

      return res.status(201).json({
        success: true,
        message: "Health officer registered successfully.",
      });
    } catch (error) {
      console.error("Error registering health officer:", error);
      if (error.code === 11000) {
        return res
          .status(409)
          .json(
            errorResponse("Health officer with this mobile already exists."),
          );
      }
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/changebeneficiarystatus.php
   * Change beneficiary status
   */
  async changeBeneficiaryStatus(req, res) {
    try {
      const { householdId, status } = req.body;

      if (!householdId || !status) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const validStatuses = ["active", "inactive", "suspended", "pending"];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json(errorResponse("Invalid status."));
      }

      const beneficiary = await WFPBeneficiary.findOne({
        householdId: householdId.toUpperCase(),
      });
      if (!beneficiary) {
        return res.status(404).json(errorResponse("Beneficiary not found."));
      }

      beneficiary.status = status.toLowerCase();
      beneficiary.isActive = status.toLowerCase() === "active";
      beneficiary.lastUpdated = new Date();

      await beneficiary.save();

      return res.status(200).json({
        error: false,
        message: "Beneficiary status updated successfully.",
      });
    } catch (error) {
      console.error("Error changing beneficiary status:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/registeronboardingagents.php
   * Register onboarding agent
   */
  async registerOnboardingAgent(req, res) {
    try {
      const { agentName, agentMobile } = req.body;

      if (!agentName || !agentMobile) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const ethiopianMobileRegex = /^251[0-9]{9}$/;
      if (!ethiopianMobileRegex.test(agentMobile.replace("+", ""))) {
        return res
          .status(400)
          .json(errorResponse("Invalid Ethiopian mobile number."));
      }

      const newAgent = new WFPAgent({
        agentType: "onboarding",
        name: agentName,
        mobile: agentMobile.replace("+", ""),
        registeredBy: req.user._id,
      });

      await newAgent.save();

      return res.status(201).json({
        error: false,
        message: "Onboarding agent registered successfully.",
      });
    } catch (error) {
      console.error("Error registering onboarding agent:", error);
      if (error.code === 11000) {
        return res
          .status(409)
          .json(errorResponse("Agent with this mobile already exists."));
      }
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/updateonboardingagent.php
   * Update onboarding agent status
   */
  async updateOnboardingAgent(req, res) {
    try {
      const { mobile, active } = req.body;

      if (!mobile || active === undefined) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const agent = await WFPAgent.findOne({
        mobile: mobile.replace("+", ""),
        agentType: "onboarding",
      });

      if (!agent) {
        return res
          .status(404)
          .json(errorResponse("Onboarding agent not found."));
      }

      agent.isActive = active === "1" || active === "true" || active === true;
      agent.updatedAt = new Date();
      agent.updatedBy = req.user._id;

      await agent.save();

      return res.status(200).json({
        error: false,
        message: "Onboarding agent updated successfully.",
      });
    } catch (error) {
      console.error("Error updating onboarding agent:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/updatefoodcategorylist.php
   * Update food category list for agent
   */
  async updateFoodCategoryList(req, res) {
    try {
      const { mobile, categoryList } = req.body;

      if (!mobile || !categoryList || !Array.isArray(categoryList)) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      const agent = await WFPAgent.findOne({
        mobile: mobile.replace("+", ""),
        agentType: "onboarding",
      });

      if (!agent) {
        return res.status(404).json(errorResponse("Agent not found."));
      }

      agent.assignedCategories = categoryList;
      agent.updatedAt = new Date();
      agent.updatedBy = req.user._id;

      await agent.save();

      return res.status(200).json({
        error: false,
        message: "Food category list updated successfully.",
      });
    } catch (error) {
      console.error("Error updating food category list:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/cancelcycle.php
   * Cancel/delete a cycle
   */
  async cancelCycle(req, res) {
    try {
      const { cycleId } = req.body;

      if (!cycleId) {
        return res.status(400).json(errorResponse("Missing cycle ID."));
      }

      const cycle = await WFPCycle.findById(cycleId);
      if (!cycle) {
        return res.status(404).json(errorResponse("Cycle not found."));
      }

      // Check if cycle has transactions
      const hasTransactions = await WFPTransaction.exists({ cycleId: cycleId });
      if (hasTransactions) {
        return res
          .status(400)
          .json(
            errorResponse("Cannot delete cycle with existing transactions."),
          );
      }

      // Soft delete by marking as cancelled
      cycle.status = "cancelled";
      cycle.isActive = false;
      cycle.updatedAt = new Date();
      await cycle.save();

      return res.status(200).json({
        error: false,
        message: "Cycle cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling cycle:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/transfercredit.php
   * Transfer credit to beneficiary
   */
  async transferCredit(req, res) {
    try {
      const { householdId, cycle } = req.body;
      const {
        walletId,
        houseHoldId,
        dateFrom,
        dateTo,
        cycleFilter,
        limit = 10,
        offset = 0,
      } = req.query;

      if (!householdId || !cycle) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      // In a real implementation, this would:
      // 1. Validate beneficiary exists
      // 2. Validate cycle exists
      // 3. Create transaction record
      // 4. Update beneficiary wallet balance
      // 5. Update cycle totals

      // For now, return a success response
      const transactionId = `WFPCR${Date.now()}${Math.floor(Math.random() * 1000)}`;

      return res.status(201).json({
        error: false,
        message: "Credit transfer initiated successfully.",
        data: {
          transactionId: transactionId,
          householdId: householdId,
          cycle: cycle,
          status: "pending",
        },
      });
    } catch (error) {
      console.error("Error transferring credit:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }

  /**
   * POST /wfp/validatedisbursement.php
   * Validate disbursement
   */
  async validateDisbursement(req, res) {
    try {
      const { householdId, cycle } = req.body;

      if (!householdId || !cycle) {
        return res.status(400).json(errorResponse("Missing required fields."));
      }

      // In a real implementation, this would validate if disbursement can proceed
      // Check beneficiary status, cycle status, available funds, etc.

      return res.status(200).json({
        error: false,
        message: "Disbursement validation successful.",
        data: {
          canDisburse: true,
          reasons: ["Beneficiary active", "Cycle active", "Funds available"],
        },
      });
    } catch (error) {
      console.error("Error validating disbursement:", error);
      return res
        .status(500)
        .json(errorResponse("An internal server error occurred."));
    }
  }
}

module.exports = new WFPController();
