import { RolePermission } from "../models/rolePermission.model.js";

/**
 * Get all role permissions
 */
export const getPermissions = async (req, res) => {
  try {
    let permissions = await RolePermission.find();
    
    // If no permissions exist, seed them
    if (permissions.length === 0) {
      permissions = await seedInitialPermissions();
    } else {
      // Check if Warehouse Admin is missing specifically
      const hasWHAdmin = permissions.some(p => p.role === "Warehouse Admin");
      if (!hasWHAdmin) {
        const whAdminPerms = {
          role: "Warehouse Admin",
          permissions: {
            leads: { view: false, create: false, edit: false, delete: false, assignToDealers: false, updateStatus: false, addActivities: false, convertToOrder: false },
            dealers: { view: false, onboard: false, approveKYC: false, editProfiles: false, deactivate: false },
            orders: { view: "Own only", create: false, uploadDocs: false, updateDelivery: true, cancel: false, approvePayment: false, uploadLovolInvoice: false, requestDocs: false, statusOverride: false },
            inventory: { viewOwn: true, viewWarehouses: false, viewSubordinates: false, manage: true },
            products: { view: true }
          }
        };
        await RolePermission.create(whAdminPerms);
        permissions = await RolePermission.find();
      }
    }
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Error fetching permissions" });
  }
};

/**
 * Update permissions for a specific role
 */
export const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    const updated = await RolePermission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error(`Error updating permissions for ${req.params.role}:`, error);
    res.status(500).json({ message: `Error updating permissions for ${req.params.role}` });
  }
};

/**
 * Seeds initial permissions if database is empty
 */
const seedInitialPermissions = async () => {
  const initialData = [
    {
      role: "Super Admin",
      permissions: {
        leads: { view: true, create: true, edit: true, delete: true, assignToDealers: true, updateStatus: true, addActivities: true, convertToOrder: true },
        dealers: { view: "Full", onboard: true, approveKYC: true, editProfiles: true, deactivate: true },
        orders: { view: "Full", create: true, uploadDocs: true, updateDelivery: true, cancel: true, approvePayment: true, uploadLovolInvoice: true, requestDocs: true, statusOverride: true }
      }
    },
    {
      role: "Distributor",
      permissions: {
        leads: { view: true, create: true, edit: true, delete: false, assignToDealers: true, updateStatus: true, addActivities: true, convertToOrder: true },
        dealers: { view: "Region", onboard: true, approveKYC: false, editProfiles: true, deactivate: false },
        orders: { view: "Region", create: true, uploadDocs: "Creator only", updateDelivery: "Creator only", cancel: "Creator only", approvePayment: false, uploadLovolInvoice: false, requestDocs: false, statusOverride: false }
      }
    },
    {
      role: "Dealer",
      permissions: {
        leads: { view: "Own only", create: true, edit: "Own only", delete: false, assignToDealers: false, updateStatus: "Own only", addActivities: true, convertToOrder: "Own only" },
        dealers: { view: "Self", onboard: false, approveKYC: false, editProfiles: false, deactivate: false },
        orders: { view: "Own only", create: true, uploadDocs: "Creator only", updateDelivery: "Creator only", cancel: "Creator only", approvePayment: false, uploadLovolInvoice: false, requestDocs: false, statusOverride: false }
      }
    },
    {
      role: "Warehouse Admin",
      permissions: {
        leads: { view: false, create: false, edit: false, delete: false, assignToDealers: false, updateStatus: false, addActivities: false, convertToOrder: false },
        dealers: { view: false, onboard: false, approveKYC: false, editProfiles: false, deactivate: false },
        orders: { view: "Own only", create: false, uploadDocs: false, updateDelivery: true, cancel: false, approvePayment: false, uploadLovolInvoice: false, requestDocs: false, statusOverride: false },
        inventory: { viewOwn: true, viewWarehouses: false, viewSubordinates: false, manage: true },
        products: { view: true }
      }
    }
  ];

  await RolePermission.insertMany(initialData);
  return RolePermission.find();
};
