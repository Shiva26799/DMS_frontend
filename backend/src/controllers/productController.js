import { Product } from "../models/Product.js";

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("warehouseId").sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "Admin") {
            return res.status(403).json({ message: "Only Admins can add products." });
        }

        const { name, sku, partNumber, category, description, price, stockAvailable, warrantyPeriod, specifications, warehouseId, reorderLevel } = req.body;

        if (!name || !category) {
            return res.status(400).json({ message: "Name and Category are required." });
        }

        if (category === "Harvester" && !sku) {
            return res.status(400).json({ message: "SKU is required for Harvesters." });
        }

        if (category === "Spare Part" && !partNumber) {
            return res.status(400).json({ message: "Part Number is required for Spare Parts." });
        }

        if (sku) {
            const existingProduct = await Product.findOne({ sku });
            if (existingProduct) {
                return res.status(400).json({ message: "A product with this SKU already exists" });
            }
        }

        let parsedSpecs = {};
        if (specifications) {
            try {
                parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
            } catch {
                // If parsing fails, ignore specs
            }
        }

        const productData = {
            name,
            sku: sku || undefined,
            partNumber: partNumber || undefined,
            category,
            description: description || "-",
            price: price ? Number(price) : 0,
            stockAvailable: stockAvailable ? Number(stockAvailable) : 0,
            warrantyPeriod: warrantyPeriod || "-",
            specifications: parsedSpecs,
            warehouseId: warehouseId || undefined,
            reorderLevel: reorderLevel ? Number(reorderLevel) : 5,
        };

        if (req.file) {
            productData.imageUrl = req.file.location;
        }

        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(400).json({ message: "Failed to create product", error: error instanceof Error ? error.message : error });
    }
};

export const bulkCreateProducts = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "Admin") {
            return res.status(403).json({ message: "Only Admins can add products." });
        }

        const productsData = req.body;
        if (!Array.isArray(productsData)) {
            return res.status(400).json({ message: "Expected an array of products" });
        }

        // 1. Use all products from the input list directly
        const itemsToProcess = productsData;

        // 2. Prepare items for insertion
        const newProducts = itemsToProcess.map(p => ({
            ...p,
            description: p.description || "-",
            price: p.price ? Number(p.price) : 0,
            stockAvailable: p.stockAvailable ? Number(p.stockAvailable) : 0,
            warrantyPeriod: p.warrantyPeriod || "-",
            sku: p.sku || undefined,
            partNumber: p.partNumber || undefined,
            warehouseId: p.warehouseId || undefined,
            reorderLevel: p.reorderLevel ? Number(p.reorderLevel) : 5
        }));

        const skippedCount = 0; // Deduplication removed

        if (newProducts.length === 0) {
            return res.status(200).json({
                message: "No new products to add.",
                added: 0,
                skipped: skippedCount
            });
        }

        const result = await Product.insertMany(newProducts);
        res.status(201).json({
            message: `Import complete.`,
            added: result.length,
            skipped: skippedCount
        });
    } catch (error) {
        console.error("Error bulk creating products:", error);
        res.status(400).json({ message: "Failed to bulk create products", error: error instanceof Error ? error.message : error });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { name, sku, category, description, price, stockAvailable, warrantyPeriod, specifications, warehouseId, reorderLevel } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (sku) updateData.sku = sku;
        if (category) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (price) updateData.price = Number(price);
        if (stockAvailable !== undefined) updateData.stockAvailable = Number(stockAvailable);
        if (warrantyPeriod !== undefined) updateData.warrantyPeriod = warrantyPeriod;
        if (warehouseId !== undefined) updateData.warehouseId = warehouseId;
        if (reorderLevel !== undefined) {
            const level = Number(reorderLevel);
            updateData.reorderLevel = level < 1 ? 1 : level;
        }

        if (specifications) {
            try {
                updateData.specifications = JSON.parse(specifications);
            } catch { /* ignore */ }
        }

        if (req.file) {
            updateData.imageUrl = req.file.location;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(400).json({ message: "Failed to update product", error: error instanceof Error ? error.message : error });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "Admin") {
            return res.status(403).json({ message: "Only Admins can delete products." });
        }

        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch product" });
    }
};
