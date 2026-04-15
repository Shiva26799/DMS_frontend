import mongoose from "mongoose";
import { Inventory } from "../models/inventory.model.js";
import { User } from "../models/user.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { Product } from "../models/product.model.js";

/**
 * Get the current user's own inventory
 */
export const getOwnInventory = async (req, res) => {
    try {
        const { role, _id, dealerId: userDealerId, managedWarehouseId } = req.user;
        let ownerId = _id;
        let ownerType = role;

        const { dealerId: requestedDealerId, page = 1, limit = 10, search, category, status } = req.query;

        if ((role === "Super Admin" || role === "Distributor") && requestedDealerId) {
            const entity = await User.findById(requestedDealerId);
            if (entity) {
                ownerId = entity._id;
                ownerType = entity.role;
            } else {
                ownerId = requestedDealerId;
                ownerType = "Dealer";
            }
        } else if (role === "Dealer") {
            ownerId = userDealerId;
        } else if (role === "Warehouse Admin") {
            ownerId = managedWarehouseId;
            ownerType = "Warehouse";
        }

        const query = { ownerId, ownerType };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const inventory = await Inventory.find(query)
            .populate({
                path: "productId",
                match: {
                    $and: [
                        search ? {
                            $or: [
                                { name: { $regex: search, $options: "i" } },
                                { sku: { $regex: search, $options: "i" } },
                                { partNumber: { $regex: search, $options: "i" } }
                            ]
                        } : {},
                        category && category !== "all" ? { category } : {}
                    ]
                }
            })
            .sort({ updatedAt: -1 });

        // Filter out items where productId didn't match the search/category
        let filteredInventory = inventory.filter(item => item.productId);

        // Filter by status if requested
        if (status && status !== "all") {
            filteredInventory = filteredInventory.filter(item => {
                const qty = item.quantity || 0;
                const reorder = item.productId.reorderLevel || 5;
                if (status === "critical") return qty > 0 && qty <= reorder;
                if (status === "out of stock") return qty === 0;
                if (status === "normal") return qty > reorder;
                return true;
            });
        }

        const totalItems = filteredInventory.length;
        const paginatedData = filteredInventory.slice(skip, skip + limitNum);

        // Stats for cards (from all items matching criteria, not just the page)
        const totalValue = filteredInventory.reduce((acc, item) => acc + (item.quantity * (item.productId?.price || 0)), 0);
        const lowStockCount = filteredInventory.filter(item => item.quantity <= (item.productId?.reorderLevel || 5)).length;

        res.json({
            data: paginatedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limitNum),
                totalItems,
                limit: limitNum
            },
            stats: {
                totalItems,
                totalValue,
                lowStockCount
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
            const dealer = await Dealer.findById(dealerId).populate("distributorId");
            if (dealer && dealer.distributorId) {
                allowedWarehouseIds = (dealer.distributorId.dealerViewWarehouses?.length > 0)
                    ? dealer.distributorId.dealerViewWarehouses
                    : (dealer.distributorId.assignedWarehouses || []);
            }
        } else if (role === "Warehouse Admin") {
            allowedWarehouseIds = [req.user.managedWarehouseId];
        }

        const { warehouseId, page = 1, limit = 10, search, category, status } = req.query;
        let baseQuery = { ownerType: "Warehouse" };

        if (warehouseId && warehouseId !== "all") {
            // Strict check: requested warehouseId must be in allowedWarehouseIds
            const isAllowed = allowedWarehouseIds.some(id => String(id) === String(warehouseId));
            if (isAllowed) {
                baseQuery.ownerId = warehouseId;
            } else {
                // Security breach attempt or error: restrict to allowedWarehouses
                baseQuery.ownerId = { $in: allowedWarehouseIds };
            }
        } else {
            baseQuery.ownerId = { $in: allowedWarehouseIds };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const inventory = await Inventory.find(baseQuery)
            .populate({
                path: "productId",
                match: {
                    $and: [
                        search ? {
                            $or: [
                                { name: { $regex: search, $options: "i" } },
                                { sku: { $regex: search, $options: "i" } },
                                { partNumber: { $regex: search, $options: "i" } }
                            ]
                        } : {},
                        category && category !== "all" ? { category } : {}
                    ]
                }
            })
            .populate("ownerId")
            .sort({ updatedAt: -1 });

        let filteredInventory = inventory.filter(item => item.productId);

        if (status && status !== "all") {
            filteredInventory = filteredInventory.filter(item => {
                const qty = item.quantity || 0;
                const reorder = item.productId.reorderLevel || 5;
                if (status === "critical") return qty > 0 && qty <= reorder;
                if (status === "out of stock") return qty === 0;
                if (status === "normal") return qty > reorder;
                return true;
            });
        }

        const totalItems = filteredInventory.length;
        const paginatedData = filteredInventory.slice(skip, skip + limitNum);

        const totalValue = filteredInventory.reduce((acc, item) => acc + (item.quantity * (item.productId?.price || 0)), 0);
        const lowStockCount = filteredInventory.filter(item => item.quantity <= (item.productId?.reorderLevel || 5)).length;

        res.json({
            data: paginatedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limitNum),
                totalItems,
                limit: limitNum
            },
            stats: {
                totalItems,
                totalValue,
                lowStockCount
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

        const { dealerId, ownerType: requestedOwnerType, page = 1, limit = 10, search, category, status } = req.query;

        let baseQuery = {};
        if (req.user.role === "Distributor") {
            const dealers = await Dealer.find({ distributorId: req.user._id });
            const dealerIds = dealers.map(d => d._id);
            
            if (dealerId && dealerId !== "all") {
                if (dealerIds.some(id => String(id) === String(dealerId))) {
                    baseQuery = { ownerType: "Dealer", ownerId: dealerId };
                } else {
                    return res.status(403).json({ message: "You do not have access to this dealer's inventory" });
                }
            } else {
                baseQuery = { ownerType: "Dealer", ownerId: { $in: dealerIds } };
            }
        } else {
            if (dealerId && dealerId !== "all") {
                baseQuery = { ownerId: dealerId };
            } else if (requestedOwnerType === "Dealer" || requestedOwnerType === "Distributor") {
                baseQuery = { ownerType: requestedOwnerType };
            } else {
                baseQuery = { ownerType: { $in: ["Dealer", "Distributor"] } };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const inventory = await Inventory.find(baseQuery)
            .populate({
                path: "productId",
                match: {
                    $and: [
                        search ? {
                            $or: [
                                { name: { $regex: search, $options: "i" } },
                                { sku: { $regex: search, $options: "i" } },
                                { partNumber: { $regex: search, $options: "i" } }
                            ]
                        } : {},
                        category && category !== "all" ? { category } : {}
                    ]
                }
            })
            .populate("ownerId")
            .sort({ updatedAt: -1 });

        let filteredInventory = inventory.filter(item => item.productId);

        if (status && status !== "all") {
            filteredInventory = filteredInventory.filter(item => {
                const qty = item.quantity || 0;
                const reorder = item.productId.reorderLevel || 5;
                if (status === "critical") return qty > 0 && qty <= reorder;
                if (status === "out of stock") return qty === 0;
                if (status === "normal") return qty > reorder;
                return true;
            });
        }

        const totalItems = filteredInventory.length;
        const paginatedData = filteredInventory.slice(skip, skip + limitNum);

        const totalValue = filteredInventory.reduce((acc, item) => acc + (item.quantity * (item.productId?.price || 0)), 0);
        const lowStockCount = filteredInventory.filter(item => item.quantity <= (item.productId?.reorderLevel || 5)).length;

        res.json({
            data: paginatedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limitNum),
                totalItems,
                limit: limitNum
            },
            stats: {
                totalItems,
                totalValue,
                lowStockCount
            }
        });
    } catch (error) {
        console.error("Error fetching subordinate inventory:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Bulk update stock
 */
export const bulkUpdateStock = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const items = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];
        const errors = [];

        for (const item of items) {
            let { productId, ownerType, ownerId, quantity, type, binLocation, minStockLevel } = item;

            try {
                // If productId is not provided, try to find it via SKU or Part Number
                if (!productId && (item.sku || item.partNumber)) {
                    const orConditions = [];
                    if (item.sku) orConditions.push({ sku: item.sku });
                    if (item.partNumber) orConditions.push({ partNumber: item.partNumber });

                    const product = await Product.findOne({ $or: orConditions }).session(session);
                    if (product) {
                        productId = product._id;
                    } else {
                        errors.push({
                            identifier: item.sku || item.partNumber,
                            message: "Product not found"
                        });
                        continue;
                    }
                }

                if (!productId) {
                    errors.push({ message: "Product ID or identifier (SKU/Part Number) is required" });
                    continue;
                }

                // Permission check
                if (req.user.role === "Dealer") {
                    if (ownerType === "Warehouse") {
                        if (type !== "subtract") {
                            errors.push({ productId, message: "Dealers can only subtract from Warehouse stock" });
                            continue;
                        }
                    } else if (ownerType === "Dealer") {
                        if (!ownerId || String(ownerId) === String(req.user._id)) {
                            ownerId = req.user.dealerId;
                        }
                        if (String(ownerId) !== String(req.user.dealerId)) {
                            errors.push({ productId, message: "You can only manage your own shop inventory" });
                            continue;
                        }
                    }
                } else if (req.user.role === "Distributor") {
                    if (ownerType !== "Distributor" || String(ownerId) !== String(req.user._id)) {
                        errors.push({ productId, message: "Distributors can only manage their own distribution inventory" });
                        continue;
                    }
                } else if (req.user.role === "Warehouse Admin") {
                    if (ownerType !== "Warehouse" || String(ownerId) !== String(req.user.managedWarehouseId)) {
                        errors.push({ productId, message: "Warehouse Admins can only manage their assigned warehouse" });
                        continue;
                    }
                }

                let inventory = await Inventory.findOne({ productId, ownerType, ownerId }).session(session);

                if (!inventory) {
                    if (type === "subtract") {
                        errors.push({ productId, message: "No stock record found to subtract from" });
                        continue;
                    }
                    inventory = new Inventory({ productId, ownerType, ownerId, quantity: 0 });
                }

                if (type === "add") {
                    inventory.quantity += Number(quantity);
                } else if (type === "subtract") {
                    if (inventory.quantity < quantity) {
                        errors.push({ productId, message: "Insufficient stock" });
                        continue;
                    }
                    inventory.quantity -= Number(quantity);
                } else if (type === "set") {
                    inventory.quantity = Number(quantity);
                }

                if (binLocation !== undefined) inventory.binLocation = binLocation;
                if (minStockLevel !== undefined) inventory.minStockLevel = minStockLevel;

                await inventory.save({ session });
                results.push(inventory);
            } catch (err) {
                errors.push({ productId, message: err.message });
            }
        }

        // If there were any errors in the batch, abort the entire transaction
        if (errors.length > 0) {
            await session.abortTransaction();
            return res.status(400).json({ 
                message: "Bulk update rolled back due to errors", 
                success: 0, 
                failed: errors.length, 
                results: [], 
                errors 
            });
        }

        await session.commitTransaction();
        res.json({ success: results.length, failed: 0, results, errors: [] });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in bulk update stock (transaction rolled back):", error);
        res.status(500).json({ message: "Server error during bulk update" });
    } finally {
        session.endSession();
    }
};

/**
 * Manually update stock (Single item wrapper for backward compatibility or simple calls)
 */
export const updateStock = async (req, res) => {
    return bulkUpdateStock(req, res);
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
                if (distributor) {
                    // FALLBACK: If explicit visibility set is empty, show all warehouses assigned to their distributor
                    const warehouseIds = (distributor.dealerViewWarehouses?.length > 0)
                        ? distributor.dealerViewWarehouses
                        : (distributor.assignedWarehouses || []);

                    if (warehouseIds.length > 0) {
                        warehouses = await Warehouse.find({ _id: { $in: warehouseIds } });
                    }
                }
            }
        }

        res.json(warehouses);
    } catch (error) {
        console.error("Error fetching visible warehouses:", error);
        res.status(500).json({ message: "Failed to fetch warehouses" });
    }
};
