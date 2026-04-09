import { Inventory } from "../models/inventory.model.js";
import { User } from "../models/user.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Warehouse } from "../models/warehouse.model.js";

/**
 * Get the current user's own inventory
 */
export const getOwnInventory = async (req, res) => {
    try {
        const { role, _id, dealerId } = req.user;
        let ownerId = _id;
        let ownerType = role;

        if (role === "Dealer") {
            if (!dealerId) {
                return res.status(400).json({ message: "Dealer profile not found for this user" });
            }
            ownerId = dealerId;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { ownerId, ownerType };

        const result = await Inventory.aggregate([
            { $match: query },
            {
                $facet: {
                    metadata: [
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        { $unwind: "$product" },
                        {
                            $group: {
                                _id: null,
                                totalItems: { $sum: 1 },
                                totalValue: { $sum: { $multiply: ["$quantity", "$product.price"] } },
                                lowStockCount: {
                                    $sum: {
                                        $cond: [
                                            { $lte: ["$quantity", { $ifNull: ["$product.reorderLevel", 5] }] },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    data: [
                        { $sort: { updatedAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "productId"
                            }
                        },
                        { $unwind: "$productId" }
                    ]
                }
            }
        ]);

        const inventory = result[0].data;
        const stats = result[0].metadata[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 };
        const total = stats.totalItems;

        res.json({
            data: inventory,
            stats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching own inventory:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get warehouse inventory based on visibility rules
 */
export const getWarehouseInventory = async (req, res) => {
    try {
        const { role, assignedWarehouses, dealerId } = req.user;
        let allowedWarehouseIds = [];

        if (role === "Super Admin") {
            const warehouses = await Warehouse.find({});
            allowedWarehouseIds = warehouses.map(w => w._id);
        } else if (role === "Distributor") {
            allowedWarehouseIds = assignedWarehouses || [];
        } else if (role === "Dealer") {
            // Find parent distributor and get their dealerViewWarehouses
            const dealer = await Dealer.findById(dealerId).populate("distributorId", "dealerViewWarehouses");
            if (dealer && dealer.distributorId) {
                allowedWarehouseIds = dealer.distributorId.dealerViewWarehouses || [];
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            ownerType: "Warehouse",
            ownerId: { $in: allowedWarehouseIds }
        };

        const result = await Inventory.aggregate([
            { $match: query },
            {
                $facet: {
                    metadata: [
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        { $unwind: "$product" },
                        {
                            $group: {
                                _id: null,
                                totalItems: { $sum: 1 },
                                totalValue: { $sum: { $multiply: ["$quantity", "$product.price"] } },
                                lowStockCount: {
                                    $sum: {
                                        $cond: [
                                            { $lte: ["$quantity", { $ifNull: ["$product.reorderLevel", 5] }] },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    data: [
                        { $sort: { updatedAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "productId"
                            }
                        },
                        { $unwind: "$productId" },
                        {
                            $lookup: {
                                from: "warehouses",
                                localField: "ownerId",
                                foreignField: "_id",
                                as: "ownerId"
                            }
                        },
                        { $unwind: "$ownerId" }
                    ]
                }
            }
        ]);

        const inventory = result[0].data;
        const stats = result[0].metadata[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 };
        const total = stats.totalItems;

        res.json({
            data: inventory,
            stats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching warehouse inventory:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get inventory of subordinate dealers (For Distributors)
 */
export const getSubordinateDealerInventory = async (req, res) => {
    try {
        if (req.user.role !== "Distributor" && req.user.role !== "Super Admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        let query = {};
        if (req.user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: req.user._id });
            const dealerIds = dealers.map(d => d._id);
            query = { ownerType: "Dealer", ownerId: { $in: dealerIds } };
        } else {
            query = { ownerType: "Dealer" };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const result = await Inventory.aggregate([
            { $match: query },
            {
                $facet: {
                    metadata: [
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        { $unwind: "$product" },
                        {
                            $group: {
                                _id: null,
                                totalItems: { $sum: 1 },
                                totalValue: { $sum: { $multiply: ["$quantity", "$product.price"] } },
                                lowStockCount: {
                                    $sum: {
                                        $cond: [
                                            { $lte: ["$quantity", { $ifNull: ["$product.reorderLevel", 5] }] },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    data: [
                        { $sort: { updatedAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "products",
                                localField: "productId",
                                foreignField: "_id",
                                as: "productId"
                            }
                        },
                        { $unwind: "$productId" },
                        {
                            $lookup: {
                                from: "dealers",
                                localField: "ownerId",
                                foreignField: "_id",
                                as: "ownerId"
                            }
                        },
                        { $unwind: "$ownerId" }
                    ]
                }
            }
        ]);

        const inventory = result[0].data;
        const stats = result[0].metadata[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 };
        const total = stats.totalItems;

        res.json({
            data: inventory,
            stats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching subordinate inventory:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Manually update stock (Admin/Distributor with manage permission)
 */
export const updateStock = async (req, res) => {
    try {
        const { productId, ownerType, ownerId, quantity, type } = req.body; // type: 'add', 'subtract', 'set'

        // Basic permission check (refined later with RBAC)
        if (req.user.role === "Dealer" && type !== "subtract") {
            return res.status(403).json({ message: "Dealers can only record usage/sales (subtract)" });
        }

        let inventory = await Inventory.findOne({ productId, ownerType, ownerId });

        if (!inventory) {
            if (type === "subtract") return res.status(400).json({ message: "No stock record found to subtract from" });
            inventory = new Inventory({ productId, ownerType, ownerId, quantity: 0 });
        }

        if (type === "add") {
            inventory.quantity += Number(quantity);
        } else if (type === "subtract") {
            if (inventory.quantity < quantity) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
            inventory.quantity -= Number(quantity);
        } else if (type === "set") {
            inventory.quantity = Number(quantity);
        }

        await inventory.save();
        res.json(inventory);
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get list of visible warehouses for the current user
export const getVisibleWarehouses = async (req, res) => {
    try {
        const { role, id } = req.user;
        let warehouses = [];

        if (role === 'Super Admin') {
            warehouses = await Warehouse.find({});
        } else if (role === 'Distributor') {
            const user = await User.findById(id);
            if (user?.assignedWarehouses?.length > 0) {
                warehouses = await Warehouse.find({ _id: { $in: user.assignedWarehouses } });
            }
        } else if (role === 'Dealer') {
            const dealer = await Dealer.findById(req.user.dealerId);
            if (dealer?.distributorId) {
                const distributor = await User.findById(dealer.distributorId);
                if (distributor?.dealerViewWarehouses?.length > 0) {
                    warehouses = await Warehouse.find({ _id: { $in: distributor.dealerViewWarehouses } });
                }
            }
        }

        res.json(warehouses);
    } catch (error) {
        console.error("Error fetching visible warehouses:", error);
        res.status(500).json({ message: "Failed to fetch warehouses" });
    }
};
