import { Dealer } from "../models/dealer.model.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const getDealers = async (req, res) => {
    try {
        const user = req.user;
        const permission = req.permissionValue || "Own"; // Fallback to safe default

        let query = {};

        // Safe ID extraction
        const userId = user._id?._id || user._id;
        const userDealerId = user.dealerId ? (user.dealerId._id || user.dealerId) : null;

        if (permission === "Own") {
            if (user.role === "Dealer") {
                query._id = userDealerId;
            } else {
                query.distributorId = userId; // Fallback for Dist/Admin if set to Own
            }
        } else if (permission === "Region") {
            // Distributors see their own dealers
            query.distributorId = userId;
        } else if (permission === "Full") {
            // No filter for full access
            query = {};
        }

        const dealers = await Dealer.find(query)
            .populate("distributorId", "name")
            .sort({ companyName: 1 });

        res.json(dealers);
    } catch (error) {
        console.error("Fetch dealers error:", error);
        res.status(500).json({ message: "Failed to fetch dealers" });
    }
};

export const onboardDealer = async (req, res) => {
    try {
        const dealerData = { ...req.body };

        // Always build kycDocuments array from uploaded files (even if sent as separate fields)
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            dealerData.kycDocuments = req.files.map(file => ({
                name: file.fieldname,
                url: file.location,
                uploadedAt: new Date()
            }));
        } else {
            dealerData.kycDocuments = [];
        }

        // Automatically assign distributorId if created by a Distributor
        dealerData.metadata = {
            DealerName: dealerData.companyName,
            DistributorName: req.user.role === "Distributor" ? req.user.name : undefined
        };

        if (req.user.role === "Distributor") {
            dealerData.distributorId = req.user._id?._id || req.user._id;
        } else if (req.user.role === "Super Admin" && dealerData.distributorId) {
            // If Admin is onboarding and selected a distributor, try to get their name
            const dist = await User.findById(dealerData.distributorId);
            if (dist) {
                dealerData.metadata.DistributorName = dist.name;
            }
        }

        // Check for existing dealer or user with this email
        const [existingDealer, existingUser] = await Promise.all([
            Dealer.findOne({ email: dealerData.email }),
            User.findOne({ email: dealerData.email })
        ]);

        if (existingDealer || existingUser) {
            return res.status(400).json({
                message: "A user with this email already exists.",
                error: "DUPLICATE_EMAIL"
            });
        }

        const dealer = new Dealer(dealerData);
        await dealer.save();
        
        // Populate before returning so frontend has the distributor name immediately
        const populatedDealer = await Dealer.findById(dealer._id).populate("distributorId", "name");
        res.status(201).json(populatedDealer);
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

        const dealer = await Dealer.findById(req.params.id);
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });

        if (dealer.status === "Approved") {
            return res.status(400).json({ message: "Dealer is already approved." });
        }

        // Check if a User with this email already exists
        const existingUser = await User.findOne({ email: dealer.email });
        if (existingUser) {
            return res.status(400).json({
                message: "A user with this dealer's email already exists.",
                error: "DUPLICATE_EMAIL"
            });
        }

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

        // Update dealer status only after user creation succeeds
        dealer.status = "Approved";
        await dealer.save();

        res.json(dealer);
    } catch (error) {
        console.error("Dealer approval error:", error);
        res.status(500).json({
            message: "Failed to approve dealer",
            error: error instanceof Error ? error.message : "Inner Server Error"
        });
    }
}

export const updateDealer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const dealer = await Dealer.findByIdAndUpdate(id, updates, { new: true }).populate("distributorId", "name");
        if (!dealer) return res.status(404).json({ message: "Dealer not found" });

        res.json(dealer);
    } catch (error) {
        console.error("Update dealer error:", error);
        res.status(500).json({ message: "Failed to update dealer" });
    }
};

export const getAssignees = async (req, res) => {
    try {
        const user = req.user;
        let assignees = [];

        if (user.role === "Super Admin") {
            // Fetch all approved dealers
            const dealers = await Dealer.find({ status: "Approved" }).select("_id companyName").sort({ companyName: 1 });
            // Fetch all distributors
            const distributors = await User.find({ role: "Distributor" }).select("_id name").sort({ name: 1 });

            assignees = [
                ...distributors.map(d => ({ _id: d._id, name: d.name, type: "Distributor" })),
                ...dealers.map(d => ({ _id: d._id, name: d.companyName, type: "Dealer" }))
            ];
        } else if (user.role === "Distributor") {
            // Fetch dealers under this distributor
            const userId = user._id?._id || user._id;
            const dealers = await Dealer.find({ distributorId: userId, status: "Approved" }).select("_id companyName").sort({ companyName: 1 });
            
            assignees = [
                { _id: userId, name: `${user.name} (Myself)`, type: "Distributor" },
                ...dealers.map(d => ({ _id: d._id, name: d.companyName, type: "Dealer" }))
            ];
        }

        res.json(assignees);
    } catch (error) {
        console.error("Fetch assignees error:", error);
        res.status(500).json({ message: "Failed to fetch assignees" });
    }
};
