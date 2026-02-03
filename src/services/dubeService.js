const DubeMerchant = require("../models/DubeMerchant");
const DubeCustomer = require("../models/DubeCustomer");
const DubeInvoice = require("../models/DubeInvoice");
const DubeProject = require("../models/DubeProject");
const DubeSupplier = require("../models/DubeSupplier");
const DubeReceipt = require("../models/DubeReceipt");

class DubeService {
  /**
   * Merchant Services
   */

  static async createMerchant(data, userId) {
    // Generate 6-digit user ID
    const userid = Math.floor(100000 + Math.random() * 900000).toString();

    const merchant = new DubeMerchant({
      ...data,
      userid,
      createdBy: userId,
      wallets: [
        {
          name: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          wallettype: "MERCHANT_CREDIT",
          balance: 0,
          bnpl: 0,
        },
        {
          name: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          wallettype: "MERCHANT_EARNING",
          balance: 0,
          bnpl: 0,
        },
        {
          name: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          wallettype: "MERCHANT_AVAILABLE",
          balance: 0,
          bnpl: 0,
        },
      ],
    });

    return await merchant.save();
  }

  static async updateMerchant(userid, data, userId) {
    return await DubeMerchant.findOneAndUpdate(
      { userid },
      {
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  static async deactivateMerchant(userid, userId) {
    return await DubeMerchant.findOneAndUpdate(
      { userid },
      {
        active: "0",
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Customer Services
   */

  static async createCustomer(data, userId) {
    // Generate 6-digit user ID
    const userid = Math.floor(100000 + Math.random() * 900000).toString();

    const customer = new DubeCustomer({
      ...data,
      userid,
      creditwallet: Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString(),
      purchasewallet: Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString(),
      createdBy: userId,
    });

    return await customer.save();
  }

  static async linkCustomerToMerchant(customerId, merchantUserId, userId) {
    const merchant = await DubeMerchant.findOne({ userid: merchantUserId });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    return await DubeCustomer.findOneAndUpdate(
      { userid: customerId },
      {
        merchantName: merchant.fullname,
        merchantUserId: merchant.userid,
        createdby: merchant.mobile,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Invoice Services
   */

  static async createInvoice(data, userId) {
    // Generate transaction ID
    const transactionId = `WFPWP${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = new DubeInvoice({
      ...data,
      transactionId,
      createdBy: userId,
      remainingAmount: data.amount,
    });

    return await invoice.save();
  }

  static async addRepayment(transactionId, repaymentData, userId) {
    const invoice = await DubeInvoice.findOne({ transactionId });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Generate repayment transaction ID
    const repaymentId = `DWCR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    invoice.repayment.push({
      transactionId: repaymentId,
      amount: repaymentData.amount,
      repaymentDate: new Date(),
      status: "PROCESSED",
    });

    return await invoice.save();
  }

  /**
   * Project Services
   */

  static async createProject(data, userId) {
    // Check if project already exists
    const existingProject = await DubeProject.findOne({
      projectName: data.projectName,
      countryCode: data.countryCode,
    });

    if (existingProject) {
      throw new Error("Project already exists for this country");
    }

    const project = new DubeProject({
      ...data,
      createdBy: userId,
    });

    return await project.save();
  }

  static async updateProject(projectId, data, userId) {
    return await DubeProject.findByIdAndUpdate(
      projectId,
      {
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Supplier Services
   */

  static async createSupplier(data, userId) {
    const supplier = new DubeSupplier({
      ...data,
      createdBy: userId,
    });

    return await supplier.save();
  }

  static async updateSupplierBalance(wallet, amount, type = "credit", userId) {
    const supplier = await DubeSupplier.findOne({ wallet });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (type === "credit") {
      supplier.walletBalance += amount;
    } else if (type === "debit") {
      if (supplier.walletBalance < amount) {
        throw new Error("Insufficient balance");
      }
      supplier.walletBalance -= amount;
    }

    supplier.updatedBy = userId;
    supplier.updatedAt = new Date();

    return await supplier.save();
  }

  /**
   * Receipt Services
   */

  static async createReceipt(data, userId) {
    // Generate unique ID
    const id = require("crypto").randomBytes(16).toString("hex");

    const receipt = new DubeReceipt({
      ...data,
      id,
      uploadedBy: userId,
      receiptFilename: data.filename || `receipt_${Date.now()}.jpg`,
    });

    return await receipt.save();
  }

  static async updateReceiptStatus(receiptId, status, userId) {
    return await DubeReceipt.findOneAndUpdate(
      { id: receiptId },
      {
        status,
        processedBy: userId,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Analytics Services
   */

  static async getDashboardStats(startDate, endDate) {
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      activeMerchants,
      activeCustomers,
      totalMerchants,
      totalCustomers,
      totalSuppliers,
      invoiceStats,
      totalInvoices,
      totalProjects,
    ] = await Promise.all([
      DubeMerchant.countDocuments({ ...dateFilter, active: "1" }),
      DubeCustomer.countDocuments({ ...dateFilter, active: "1" }),
      DubeMerchant.countDocuments(dateFilter),
      DubeCustomer.countDocuments(dateFilter),
      DubeSupplier.countDocuments(dateFilter),
      DubeInvoice.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            avgAmount: { $avg: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      DubeInvoice.countDocuments(dateFilter),
      DubeProject.countDocuments({ ...dateFilter, active: true }),
    ]);

    const invoiceData = invoiceStats[0] || {
      totalAmount: 0,
      avgAmount: 0,
      count: 0,
    };

    return {
      activeMerchants,
      activeCustomers,
      totalMerchants,
      totalCustomers,
      totalSuppliers,
      totalProjects,
      totalInvoices,
      totalInvoiceAmount: invoiceData.totalAmount,
      averageInvoiceAmount: invoiceData.avgAmount,
      invoiceCount: invoiceData.count,
    };
  }

  static async getCountryStats(countryCode) {
    const filter = { countryCode };

    const [merchants, customers, suppliers, invoices, projects] =
      await Promise.all([
        DubeMerchant.countDocuments({ ...filter, active: "1" }),
        DubeCustomer.countDocuments({ ...filter, active: "1" }),
        DubeSupplier.countDocuments({ ...filter, status: "1" }),
        DubeInvoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
        DubeProject.countDocuments({ ...filter, active: true }),
      ]);

    const invoiceData = invoices[0] || { totalAmount: 0, count: 0 };

    return {
      countryCode,
      activeMerchants: merchants,
      activeCustomers: customers,
      activeSuppliers: suppliers,
      activeProjects: projects,
      totalInvoiceAmount: invoiceData.totalAmount,
      totalInvoices: invoiceData.count,
    };
  }

  /**
   * Search Services
   */

  static async searchMerchants(query, filters = {}) {
    const searchFilter = {
      ...filters,
      $or: [
        { userid: { $regex: query, $options: "i" } },
        { fullname: { $regex: query, $options: "i" } },
        { businessName: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } },
      ],
    };

    return await DubeMerchant.find(searchFilter)
      .sort({ createdon: -1 })
      .limit(50)
      .select("-__v -createdBy -updatedBy")
      .lean();
  }

  static async searchCustomers(query, filters = {}) {
    const searchFilter = {
      ...filters,
      $or: [
        { userid: { $regex: query, $options: "i" } },
        { fullname: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } },
        { creditwallet: { $regex: query, $options: "i" } },
      ],
    };

    return await DubeCustomer.find(searchFilter)
      .sort({ createdon: -1 })
      .limit(50)
      .select("-__v -createdBy -updatedBy")
      .lean();
  }

  static async searchInvoices(query, filters = {}) {
    const searchFilter = {
      ...filters,
      $or: [
        { transactionId: { $regex: query, $options: "i" } },
        { merchantName: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
        { merchantMobile: { $regex: query, $options: "i" } },
        { customerMobile: { $regex: query, $options: "i" } },
      ],
    };

    return await DubeInvoice.find(searchFilter)
      .sort({ transactionDate: -1 })
      .limit(50)
      .select("-__v -createdBy")
      .lean();
  }
}

module.exports = DubeService;
