import { Dealer } from "../models/dealer.model.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const getDealers = async (req, res) => {
    try {
        res.json(await Dealer.find().sort({ companyName: 1 }));
    } catch (error) {
        res.status(500).json({ message: "Error fetching dealers" });
    }
};

export const getDealerById = async (req, res) => {
    try {
        const dealer = await Dealer.findById(req.params.id);
        dealer ? res.json(dealer) : res.status(404).json({ message: "Dealer not found" });
    } catch (error) {
        res.status(500).json({ message: "Error fetching dealer" });
    }
};

export const onboardDealer = async (req, res) => {
    try {
        res.status(201).json(await new Dealer(req.body).save());
    } catch (error) {
        res.status(400).json({ message: "Onboarding failed", error });
    }
};

export const approveDealer = async (req, res) => {
    try {
        const { status, password } = req.body;
        const dealer = await Dealer.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });

        if (status === "Approved") {
            const existingUser = await User.findOne({ email: dealer.email });
            if (!existingUser && password) {
                await new User({
                    name: dealer.ownerName,
                    email: dealer.email,
                    password: await bcrypt.hash(password, 10),
                    phone: dealer.contact,
                    role: "Dealer",
                    dealerId: dealer._id
                }).save();
            }
        }
        res.json(dealer);
    } catch (error) {
        res.status(400).json({ message: "Approval failed", error: error.message });
    }
}
