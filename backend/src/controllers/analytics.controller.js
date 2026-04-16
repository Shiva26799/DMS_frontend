import { Order } from "../models/order.model.js";
import { Dealer } from "../models/dealer.model.js";
import { WarrantyClaim as Warranty } from "../models/warranty.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Lead } from "../models/lead.model.js";
import mongoose from "mongoose";

const getAuthScope = async (user) => {
    if (user.role === "Super Admin") return {};
    if (user.role === "Dealer") {
        const userDealerId = user.dealerId?._id || user.dealerId;
        return { dealerId: userDealerId };
    }
    if (user.role === "Distributor") {
        const userId = user._id?._id || user._id;
        const dealers = await Dealer.find({ distributorId: userId });
        const dealerIds = dealers.map(d => d._id);
        return {
            $or: [
                { dealerId: { $in: dealerIds } },
                { dealerId: userId },
                { assignedDistributorId: userId }
            ]
        };
    }
    return { _id: null };
};

export const getOverviewStats = async (req, res) => {
    try {
        const scope = await getAuthScope(req.user);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyOrders = await Order.countDocuments({ ...scope, createdAt: { $gte: startOfMonth } });
        const pendingApprovals = await Order.countDocuments({ ...scope, currentStage: { $in: ["Order Approval", "Payment Verification"] } });
        const inProgressOrders = await Order.countDocuments({ ...scope, currentStage: { $nin: ["Closure", "Cancelled", "PO Upload"] } });
        const openWarranties = await Warranty.countDocuments({ ...scope, status: { $ne: "Closed" } });

        const revenueStats = await Order.aggregate([
            { $match: scope },
            { $group: { _id: null, total: { $sum: "$totalValue" } } }
        ]);
        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

        res.json({ monthlyOrders, pendingApprovals, inProgressOrders, openWarranties, totalRevenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSalesTrend = async (req, res) => {
    try {
        const scope = await getAuthScope(req.user);
        const months = 6;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        const stats = await Order.aggregate([
            { $match: { ...scope, createdAt: { $gte: startDate } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalValue" } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formattedData = [];
        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const monthName = d.toLocaleString('default', { month: 'short' });
            const match = stats.find(s => s._id.month === m && s._id.year === y);
            formattedData.push({
                month: monthName,
                revenue: match ? (match.revenue / 10000000).toFixed(2) : 0,
                target: (20 + Math.random() * 10).toFixed(0)
            });
        }
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRegionalPerformance = async (req, res) => {
    try {
        const user = req.user;
        let matchStage = {};
        if (user.role === "Dealer") matchStage = { dealerId: user.dealerId?._id || user.dealerId };
        else if (user.role === "Distributor") {
            const userId = user._id?._id || user._id;
            const dealers = await Dealer.find({ distributorId: userId });
            matchStage = { dealerId: { $in: dealers.map(d => d._id) } };
        }

        const stats = await Order.aggregate([
            { $match: matchStage },
            { $lookup: { from: "dealers", localField: "dealerId", foreignField: "_id", as: "dealer" } },
            { $unwind: "$dealer" },
            { $group: { _id: "$dealer.region", revenue: { $sum: "$totalValue" }, orders: { $count: {} } } },
            { $sort: { revenue: -1 } }
        ]);

        res.json(stats.map(s => ({ region: s._id, revenue: (s.revenue / 10000000).toFixed(2), orders: s.orders })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDealerRankings = async (req, res) => {
    try {
        const user = req.user;
        if (user.role === "Dealer") return res.json([]);
        let matchStage = {};
        if (user.role === "Distributor") {
            const userId = user._id?._id || user._id;
            const dealers = await Dealer.find({ distributorId: userId });
            matchStage = { dealerId: { $in: dealers.map(d => d._id) } };
        }

        const rankings = await Order.aggregate([
            { $match: matchStage },
            { $lookup: { from: "dealers", localField: "dealerId", foreignField: "_id", as: "dealer" } },
            { $unwind: "$dealer" },
            { $group: { _id: "$dealerId", companyName: { $first: "$dealer.companyName" }, revenue: { $sum: "$totalValue" }, score: { $first: "$dealer.performanceScore" } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        res.json(rankings.map((r, i) => ({ rank: i + 1, dealer: r.companyName, revenue: (r.revenue / 10000000).toFixed(2), score: r.score || 0 })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductMix = async (req, res) => {
    try {
        const scope = await getAuthScope(req.user);
        const stats = await Order.aggregate([
            { $match: scope },
            { $unwind: "$products" },
            { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "productInfo" } },
            { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$productInfo.category", value: { $sum: 1 } } }
        ]);

        const total = stats.reduce((acc, curr) => acc + curr.value, 0);
        const colors = ["#2563eb", "#16a34a", "#f97316", "#a855f7", "#ef4444"];
        res.json(stats.map((s, i) => ({ name: s._id || "Other", value: total > 0 ? Math.round((s.value / total) * 100) : 0, color: colors[i % colors.length] })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getInventoryStats = async (req, res) => {
    try {
        const user = req.user;
        let matchStage = {};
        if (user.role === "Dealer") {
            const userDealerId = user.dealerId?._id || user.dealerId;
            matchStage = { ownerId: userDealerId, ownerType: "Dealer" };
        }
        else if (user.role === "Distributor") {
            const userId = user._id?._id || user._id;
            const dealers = await Dealer.find({ distributorId: userId });
            matchStage = { $or: [{ ownerId: { $in: dealers.map(d => d._id) } }, { ownerId: userId }] };
        }

        const stats = await Inventory.aggregate([
            { $match: matchStage },
            { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { product: "$product.name", sku: "$product.sku", available: { $subtract: ["$quantity", "$reservedQuantity"] }, minStockLevel: { $ifNull: ["$minStockLevel", 5] }, inStock: "$quantity", reserved: "$reservedQuantity" } },
            {
                $addFields: {
                    status: {
                        $cond: { if: { $lte: ["$available", 0] }, then: "Critical", else: { $cond: { if: { $lte: ["$available", "$minStockLevel"] }, then: "Low", else: "Normal" } } }
                    }
                }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWarrantyStats = async (req, res) => {
    try {
        const scope = await getAuthScope(req.user);
        const months = 6;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        const stats = await Warranty.aggregate([
            { $match: { ...scope, createdAt: { $gte: startDate } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, claims: { $count: {} } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formattedData = [];
        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
            const m = d.getMonth() + 1;
            const monthName = d.toLocaleString('default', { month: 'short' });
            const match = stats.find(s => s._id.month === m);
            formattedData.push({ month: monthName, claims: match ? match.claims : 0, cost: 0 });
        }
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeadAnalytics = async (req, res) => {
    try {
        const scope = await getAuthScope(req.user);
        const { range = "6" } = req.query;
        const months = parseInt(range);
        const now = new Date();
        const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const sourceStats = await Lead.aggregate([
            { $match: { ...scope, createdAt: { $gte: rangeStart } } },
            { $group: { _id: "$source", value: { $sum: 1 } } }
        ]);

        const conversionStats = await Lead.aggregate([
            { $match: { ...scope, createdAt: { $gte: yearStart } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                        stage: "$stage"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for frontend
        const colors = ["#2563eb", "#16a34a", "#f97316", "#ef4444"];
        const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const formattedSources = sourceStats.map((s, i) => ({
            name: s._id || "Other",
            value: s.value,
            color: colors[i % colors.length]
        }));

        // Group conversion stats by month - Show full calendar year (Jan-Dec)
        const conversionMap = {};
        const currentYear = now.getFullYear();
        for (let i = 0; i < 12; i++) {
            const key = `${monthsNames[i]} ${currentYear}`;
            conversionMap[key] = { month: monthsNames[i], leads: 0, customers: 0 };
        }

        conversionStats.forEach(stat => {
            // Only include stats from the current year
            if (stat._id.year === currentYear) {
                const key = `${monthsNames[stat._id.month - 1]} ${stat._id.year}`;
                if (conversionMap[key]) {
                    if (stat._id.stage === "Lead") conversionMap[key].leads += stat.count;
                    if (stat._id.stage === "Customer") conversionMap[key].customers += stat.count;
                }
            }
        });

        const formattedConversion = Object.values(conversionMap);

        res.json({ sources: formattedSources, conversion: formattedConversion });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
