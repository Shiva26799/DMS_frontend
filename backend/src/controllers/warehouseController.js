import { Warehouse } from "../models/Warehouse.js";

export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ name: 1 });
        res.json(warehouses);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        res.status(500).json({ message: "Failed to fetch warehouses" });
    }
};

export const createWarehouse = async (req, res) => {
    try {
        const warehouse = new Warehouse(req.body);
        await warehouse.save();
        res.status(201).json(warehouse);
    } catch (error) {
        console.error("Error creating warehouse:", error);
        res.status(400).json({ message: "Failed to create warehouse", error: error.message });
    }
};
