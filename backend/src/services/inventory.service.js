import { Inventory } from "../models/inventory.model.js";
import { Order } from "../models/order.model.js";

/**
 * Deducts stock for all products in an order from the specified source (Warehouse or Own Stock).
 * @param {string} orderId - The ID of the order being processed.
 */
export const deductStockFromOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate("products.productId");
        if (!order) throw new Error("Order not found");

        const { orderSource, warehouseId, dealerId, products } = order;
        
        // Determine ownerType and ownerId for inventory deduction
        let ownerType, ownerId;
        if (orderSource === "Warehouse") {
            ownerType = "Warehouse";
            ownerId = warehouseId;
        } else {
            ownerType = "Dealer";
            ownerId = dealerId;
        }

        if (!ownerId) {
            throw new Error(`Inventory deduction failed: No ${ownerType} ID associated with order.`);
        }

        const deductionResults = [];

        for (const item of products) {
            const { productId, quantity } = item;
            
            // Find inventory record
            let inventory = await Inventory.findOne({ 
                productId: productId._id || productId, 
                ownerType, 
                ownerId 
            });

            if (!inventory) {
                // For "Own Stock", if no record exists, it's an error. 
                // For "Warehouse", it's definitely an error.
                throw new Error(`Insufficient stock: No inventory record found for product ${productId.name || productId} at ${ownerType}.`);
            }

            if (inventory.quantity < quantity) {
                throw new Error(`Insufficient stock for ${productId.name || productId}: Required ${quantity}, Available ${inventory.quantity}.`);
            }

            // Perform subtraction
            inventory.quantity -= quantity;
            await inventory.save();
            
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
