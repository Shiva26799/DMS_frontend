import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: ["Super Admin", "Distributor", "Dealer", "Warehouse Admin"],
    },
    permissions: {
      leads: {
        view: { type: mongoose.Schema.Types.Mixed, default: true }, // Boolean or String (e.g. "Own only")
        create: { type: Boolean, default: true },
        edit: { type: mongoose.Schema.Types.Mixed, default: true },
        delete: { type: Boolean, default: false },
        assignToDealers: { type: Boolean, default: false },
        updateStatus: { type: mongoose.Schema.Types.Mixed, default: true },
        addActivities: { type: Boolean, default: true },
        convertToOrder: { type: mongoose.Schema.Types.Mixed, default: true },
      },
      dealers: {
        view: { type: mongoose.Schema.Types.Mixed, default: true }, // "Full", "Region", "Self"
        onboard: { type: Boolean, default: false },
        approveKYC: { type: Boolean, default: false },
        editProfiles: { type: Boolean, default: false },
        deactivate: { type: Boolean, default: false },
      },
      orders: {
        view: { type: mongoose.Schema.Types.Mixed, default: true }, // "Full", "Region", "Own only"
        create: { type: Boolean, default: true },
        uploadDocs: { type: mongoose.Schema.Types.Mixed, default: true }, // "All", "Creator only"
        updateDelivery: { type: mongoose.Schema.Types.Mixed, default: true },
        cancel: { type: mongoose.Schema.Types.Mixed, default: true },
        approvePayment: { type: Boolean, default: false },
        uploadLovolInvoice: { type: Boolean, default: false },
        requestDocs: { type: Boolean, default: false },
        statusOverride: { type: Boolean, default: false },
      },
      inventory: {
        viewOwn: { type: Boolean, default: true },
        viewWarehouses: { type: Boolean, default: true },
        viewSubordinates: { type: Boolean, default: false }, // For Distributors
        manage: { type: Boolean, default: false },
      },
      customers: {
        view: { type: mongoose.Schema.Types.Mixed, default: true },
        edit: { type: mongoose.Schema.Types.Mixed, default: true },
        delete: { type: Boolean, default: false },
      },
      products: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const RolePermission = mongoose.models.RolePermission || mongoose.model("RolePermission", rolePermissionSchema);
