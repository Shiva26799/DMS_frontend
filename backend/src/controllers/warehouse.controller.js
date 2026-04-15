import { Warehouse } from "../models/warehouse.model.js";
import { User } from "../models/user.model.js";
import { Inventory } from "../models/inventory.model.js";
import bcrypt from "bcryptjs";

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
        const { adminName, adminEmail, adminContact, adminPassword, ...warehouseData } = req.body;

        // 1. Create the warehouse first
        const warehouse = new Warehouse({
            ...warehouseData,
            adminName,
            adminEmail,
            adminContact
        });

        // 2. Hash password if provided, or use default
        const hashedPassword = await bcrypt.hash(adminPassword || "Lovol@123", 10);

        // 3. Create/Update User
        let user = await User.findOne({ email: adminEmail });
        if (user) {
            user.role = "Warehouse Admin";
            user.managedWarehouseId = warehouse._id;
            user.name = adminName;
            user.phone = adminContact;
            if (adminPassword) user.password = hashedPassword;
            await user.save();
        } else {
            user = new User({
                name: adminName,
                email: adminEmail,
                phone: adminContact,
                password: hashedPassword,
                role: "Warehouse Admin",
                managedWarehouseId: warehouse._id
            });
            await user.save();
        }

        // 4. Link User back to Warehouse
        warehouse.adminUserId = user._id;
        await warehouse.save();

        res.status(201).json(warehouse);
    } catch (error) {
        console.error("Error creating warehouse:", error);
        res.status(400).json({ message: "Failed to create warehouse", error: error.message });
    }
};
export const updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
        res.json(warehouse);
    } catch (error) {
        res.status(400).json({ message: "Failed to update warehouse", error });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findById(id);
        
        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found" });
        }

        // 1. Delete associated Warehouse Admin user
        if (warehouse.adminUserId) {
            await User.findByIdAndDelete(warehouse.adminUserId);
        } else if (warehouse.adminEmail) {
            // Backup check: Delete by email if userId not stored correctly
            await User.findOneAndDelete({ email: warehouse.adminEmail, role: "Warehouse Admin" });
        }

        // 2. Delete all inventory records for this warehouse
        await Inventory.deleteMany({ ownerId: id, ownerType: "Warehouse" });

        // 3. Remove this warehouse from all distributors' mapping lists
        await User.updateMany(
            { 
                $or: [
                    { assignedWarehouses: id },
                    { dealerViewWarehouses: id }
                ]
            },
            {
                $pull: {
                    assignedWarehouses: id,
                    dealerViewWarehouses: id
                }
            }
        );

        // 4. Delete the warehouse itself
        await Warehouse.findByIdAndDelete(id);

        res.json({ message: "Warehouse and all associated data (Admin, Inventory, Assignments) deleted successfully" });
    } catch (error) {
        console.error("Error deleting warehouse:", error);
        res.status(400).json({ message: "Failed to delete warehouse", error: error.message });
    }
};
