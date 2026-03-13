import { CompanyInfo } from "../models/CompanyInfo.js";
import { User } from "../models/User.js";
import { Warehouse } from "../models/Warehouse.js";
import bcrypt from "bcryptjs";

// COMPANY INFO
export const getCompanyInfo = async (req, res) => {
    try {
        let company = await CompanyInfo.findOne();
        if (!company) {
            return res.json(null);
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch company info" });
    }
};

export const updateCompanyInfo = async (req, res) => {
    try {
        const company = await CompanyInfo.findOneAndUpdate({}, req.body, { returnDocument: 'after', upsert: true });
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Failed to update company info" });
    }
};

export const uploadCompanyLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No logo file provided" });
        }

        const s3Url = req.file.location;

        const company = await CompanyInfo.findOneAndUpdate(
            {},
            { logoUrl: s3Url },
            { returnDocument: 'after', upsert: true }
        );

        res.json({ message: "Logo uploaded successfully", logoUrl: s3Url, company });
    } catch (error) {
        console.error("Logo upload error:", error);
        res.status(500).json({ message: "Failed to upload logo" });
    }
};

// USERS MANAGEMENT
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

export const createUser = async (req, res) => {
    try {
        const userData = { ...req.body };
        if (userData.dealerId === "") delete userData.dealerId;

        const pwd = userData.password || "password123";
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const user = new User({ ...userData, password: hashedPassword });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: "Failed to create user", error });
    }
};

export const updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.dealerId === "") updateData.dealerId = null;

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password; // Don't overwrite if empty
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: "Failed to update user", error });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete user", error });
    }
};

// WAREHOUSE MANAGEMENT
export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find();
        res.json(warehouses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch warehouses" });
    }
};

export const createWarehouse = async (req, res) => {
    try {
        const warehouse = new Warehouse(req.body);
        await warehouse.save();
        res.status(201).json(warehouse);
    } catch (error) {
        res.status(400).json({ message: "Failed to create warehouse", error });
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
        await Warehouse.findByIdAndDelete(req.params.id);
        res.json({ message: "Warehouse deleted" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete warehouse", error });
    }
};
