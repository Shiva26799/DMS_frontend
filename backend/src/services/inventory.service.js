import { Inventory } from "../models/inventory.model.js";
import { Order } from "../models/order.model.js";

/**
 * Deducts stock for all products in an order from the specified source (Warehouse or Own Stock).
 * @param {string} orderId - The ID of the order being processed.
 * @param {import('mongoose').ClientSession} [session] - Optional Mongoose session for transaction support.
 */
export const deductStockFromOrder = async (orderId, session = null) => {
    try {
        const sessionOpts = session ? { session } : {};
        const order = await Order.findById(orderId).populate("products.productId").session(session);
        if (!order) throw new Error("Order not found");

        const { orderSource, warehouseId, dealerId, products } = order;
        
        console.log(`[DeductStock] Starting deduction for Order: ${orderId}. Source: ${orderSource}, Warehouse: ${warehouseId}, Dealer: ${dealerId}`);

        let ownerType, ownerId;
        if (orderSource === "Warehouse") {
            ownerType = "Warehouse";
            ownerId = warehouseId;
        } else {
            // align with createOrder logic: if buyerType is "User", it's likely a Distributor
            ownerType = order.buyerType === "User" ? "Distributor" : "Dealer";
            ownerId = dealerId;
        }
 
        if (!ownerId) {
            console.error(`[DeductStock] Error: No ${ownerType} ID associated with order ${orderId}`);
            throw new Error(`Inventory deduction failed: No ${ownerType} ID associated with order.`);
        }

        const deductionResults = [];

        for (const item of products) {
            const { productId, quantity } = item;
            const pId = productId._id || productId;
            const pName = productId.name || productId;
            
            console.log(`[DeductStock] Processing product: ${pName} (${pId}) quantity: ${quantity} for ${ownerType}: ${ownerId}`);

            // Find inventory record
            let inventory = await Inventory.findOne({ 
                productId: pId, 
                ownerType, 
                ownerId 
            }).session(session);
 
            if (!inventory) {
                console.warn(`[DeductStock] No inventory record found for ${pName} at ${ownerType} ${ownerId}`);
                throw new Error(`Insufficient stock: No inventory record found for product ${pName} at ${ownerType}.`);
            }
 
            console.log(`[DeductStock] Found inventory record. Current quantity: ${inventory.quantity}`);

            if (inventory.quantity < quantity) {
                console.warn(`[DeductStock] Insufficient stock for ${pName}. Required: ${quantity}, Available: ${inventory.quantity}`);
                throw new Error(`Insufficient stock for ${pName}: Required ${quantity}, Available ${inventory.quantity}.`);
            }
 
            // Perform subtraction
            inventory.quantity -= quantity;
            await inventory.save(sessionOpts);
            
            console.log(`[DeductStock] Successfully deducted ${quantity}. New quantity: ${inventory.quantity}`);

            deductionResults.push({
                productId,
                deducted: quantity,
                remaining: inventory.quantity
            });
        }

        return { success: true, results: deductionResults };
    } catch (error) {
        console.error("Stock deduction error:", error);
        throw error;
    }
};

/**
 * Restores stock for all products in an order back to the specified source.
 * @param {string} orderId - The ID of the order being processed.
 * @param {import('mongoose').ClientSession} [session] - Optional Mongoose session for transaction support.
 */
export const restoreStockForOrder = async (orderId, session = null) => {
    try {
        const sessionOpts = session ? { session } : {};
        const order = await Order.findById(orderId).populate("products.productId").session(session);
        if (!order) throw new Error("Order not found");

        const { orderSource, warehouseId, dealerId, products } = order;
        
        console.log(`[RestoreStock] Starting restoration for Order: ${orderId}. Source: ${orderSource}, Warehouse: ${warehouseId}, Dealer: ${dealerId}`);

        let ownerType, ownerId;
        if (orderSource === "Warehouse") {
            ownerType = "Warehouse";
            ownerId = warehouseId;
        } else {
            ownerType = order.buyerType === "User" ? "Distributor" : "Dealer";
            ownerId = dealerId;
        }

        if (!ownerId) {
            console.error(`[RestoreStock] Error: No ${ownerType} ID associated with order ${orderId}`);
            return { success: false, message: "No source ID found" };
        }

        const restorationResults = [];

        for (const item of products) {
            const { productId, quantity } = item;
            const pId = productId._id || productId;
            const pName = productId.name || productId;

            // Find inventory record
            let inventory = await Inventory.findOne({ 
                productId: pId, 
                ownerType, 
                ownerId 
            }).session(session);

            if (inventory) {
                inventory.quantity += quantity;
                await inventory.save(sessionOpts);
                console.log(`[RestoreStock] Restored ${quantity} for ${pName}. New quantity: ${inventory.quantity}`);
                
                restorationResults.push({
                    productId: pId,
                    restored: quantity,
                    newTotal: inventory.quantity
                });
            } else {
                // If inventory record was deleted, recreate it
                console.warn(`[RestoreStock] Re-creating inventory record for ${pName} at ${ownerType} ${ownerId}`);
                const newInv = new Inventory({
                    productId: pId,
                    ownerType,
                    ownerId,
                    quantity: quantity
                });
                await newInv.save(sessionOpts);
                restorationResults.push({
                    productId: pId,
                    restored: quantity,
                    newTotal: quantity
                });
            }
        }

        return { success: true, results: restorationResults };
    } catch (error) {
        console.error("Stock restoration error:", error);
        throw error;
    }
};
