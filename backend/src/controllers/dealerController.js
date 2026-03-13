import { Dealer } from "../models/Dealer.js";

export const getDealers = async (req, res) => {
    try {
        const dealers = await Dealer.find().sort({ companyName: 1 });
        res.json(dealers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dealers" });
    }
};

export const onboardDealer = async (req, res) => {
    try {
        const dealer = new Dealer(req.body);
        await dealer.save();
        res.status(201).json(dealer);
    } catch (error) {
        res.status(400).json({ message: "Failed to onboard dealer", error });
    }
};

export const approveDealer = async (req, res) => {
    try {
        const payload = req.body;
        const dealer = await Dealer.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });
        res.json(dealer);
    } catch (error) {
        res.status(400).json({ message: "Failed to approve dealer" });
    }
}
