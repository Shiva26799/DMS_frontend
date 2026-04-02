import { Dealer } from "../models/dealer.model.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const getDealers = async (req, res) => {
    try {
        const query = {};

        // Filter dealers by distributor if the user is a Distributor
        if (req.user.role === "Distributor") {
            query.distributorId = req.user._id;
        }

        const dealers = await Dealer.find(query).sort({ companyName: 1 });
        res.json(dealers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dealers" });
    }
};

export const onboardDealer = async (req, res) => {
    try {
        const dealerData = { ...req.body };

        // Automatically assign distributorId if created by a Distributor
        if (req.user.role === "Distributor") {
            dealerData.distributorId = req.user._id;
        }

        const dealer = new Dealer(dealerData);
        await dealer.save();
        res.status(201).json(dealer);
    } catch (error) {
        res.status(400).json({ message: "Failed to onboard dealer", error });
    }
};

export const approveDealer = async (req, res) => {
    try {
        if (req.user.role !== "Super Admin") {
            return res.status(403).json({ message: "Only Super Admins can approve dealers." });
        }

        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: "Password is required for dealer approval." });
        }

        const dealer = await Dealer.findByIdAndUpdate(req.params.id, { status: "Approved" }, { returnDocument: 'after' });
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });

        // Create a User account for the dealer
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: dealer.companyName,
            email: dealer.email,
            password: hashedPassword,
            phone: dealer.contact,
            role: "Dealer",
            dealerId: dealer._id
        });
        await newUser.save();

        res.json(dealer);
    } catch (error) {
        res.status(400).json({ message: "Failed to approve dealer" });
    }
}
