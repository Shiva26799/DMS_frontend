import { useState, useEffect } from "react";
import { Save, Upload, Building2, Users, Warehouse, Trash2, Edit, Plus, Loader2, ShieldCheck, Check, X, Info, ClipboardList, Package2 } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/AuthContext";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { StatusBadge } from "../components/StatusBadge";
import { toast } from "sonner";
import {
  useCompanyInfo,
  useUpdateCompanyInfo,
  useUpdateCompanyLogo,
  useUsers,
  useAddUser,
  useUpdateUser,
  useDeleteUser,
  useSettingsWarehouses,
  useAddWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  usePermissions,
  useUpdatePermissions
} from "../hooks/useSettings";
import { useDealers } from "../hooks/useDealers";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  lastLogin: string;
  dealerId?: string;
  assignedWarehouses?: string[];
  dealerViewWarehouses?: string[];
}

interface Dealer {
  _id: string;
  companyName: string;
  ownerName: string;
  email: string;
}

interface WarehouseData {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  adminName: string;
  adminContact: string;
  adminEmail: string;
}

export function Settings() {
  const { data: companyData, isLoading: isCompanyLoading } = useCompanyInfo();
  const { data: usersData = [], isLoading: isUsersLoading } = useUsers();
  const { data: warehousesData = [], isLoading: isWarehousesLoading } = useSettingsWarehouses();
  const { data: dealers = [], isLoading: isDealersLoading } = useDealers();
  const { data: permissionsData = [], isLoading: isPermissionsLoading } = usePermissions();

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "Super Admin";

  const updateCompanyMutation = useUpdateCompanyInfo();
  const updateLogoMutation = useUpdateCompanyLogo();
  const addUserMutation = useAddUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const addWarehouseMutation = useAddWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();
  const updatePermissionsMutation = useUpdatePermissions();

  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    gstin: "",
    pan: "",
    address: "",
    website: "",
    contact: "",
    email: "",
    logoUrl: "",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Sync company info when data is fetched
  useEffect(() => {
    if (companyData) {
      setCompanyInfo(companyData);
      if (companyData.logoUrl) {
        setLogoPreview(companyData.logoUrl);
      }
    }
  }, [companyData]);

  // User Management State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    assignedWarehouses: [] as string[],
    dealerViewWarehouses: [] as string[],
  });

  // Warehouse Management State
  // Mapping Dialog State (New)
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [mappingUser, setMappingUser] = useState<User | null>(null);
  const [mappingFormData, setMappingFormData] = useState({
    assignedWarehouses: [] as string[],
    dealerViewWarehouses: [] as string[],
  });

  const handleOpenMappingDialog = (user: User) => {
    setMappingUser(user);
    setMappingFormData({
      assignedWarehouses: user.assignedWarehouses || [],
      dealerViewWarehouses: user.dealerViewWarehouses || [],
    });
    setIsMappingDialogOpen(true);
  };

  const handleSaveMapping = () => {
    if (mappingUser) {
      updateUserMutation.mutate({
        id: mappingUser._id,
        data: {
          assignedWarehouses: mappingFormData.assignedWarehouses,
          dealerViewWarehouses: mappingFormData.dealerViewWarehouses,
        }
      }, {
        onSuccess: () => {
          setIsMappingDialogOpen(false);
          setMappingUser(null);
        }
      });
    }
  };

  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    adminName: "",
    adminContact: "",
    adminEmail: "",
  });

  // Permissions State
  const [localPermissions, setLocalPermissions] = useState<any[]>([]);

  useEffect(() => {
    if (permissionsData.length > 0) {
      setLocalPermissions(permissionsData);
    }
  }, [permissionsData]);

  const loading = isCompanyLoading || isUsersLoading || isWarehousesLoading || isDealersLoading || isPermissionsLoading;

  // Company Information Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("logo", file);

      updateLogoMutation.mutate(formData, {
        onError: () => {
          setLogoPreview(companyInfo.logoUrl || null);
        }
      });
    }
  };

  const handleSaveCompanyInfo = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    updateCompanyMutation.mutate(companyInfo);
  };

  // User Management Handlers
  const handleOpenUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: "", // Keep password empty when editing
        assignedWarehouses: user.assignedWarehouses || [],
        dealerViewWarehouses: user.dealerViewWarehouses || [],
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        assignedWarehouses: [],
        dealerViewWarehouses: [],
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      const payload: any = { ...userForm };

      updateUserMutation.mutate({ id: editingUser._id, data: payload }, {
        onSuccess: () => {
          setIsUserDialogOpen(false);
          setEditingUser(null);
        }
      });
    } else {
      if (!userForm.password) {
        toast.error("Password is required for new users");
        return;
      }
      const payload: any = { ...userForm };

      addUserMutation.mutate(payload, {
        onSuccess: () => {
          setIsUserDialogOpen(false);
          setEditingUser(null);
        }
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Warehouse Management Handlers
  const handleOpenWarehouseDialog = (warehouse?: WarehouseData) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setWarehouseForm({
        name: warehouse.name || "",
        address: warehouse.address || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        pincode: warehouse.pincode || "",
        adminName: warehouse.adminName || "",
        adminContact: warehouse.adminContact || "",
        adminEmail: warehouse.adminEmail || "",
      });
    } else {
      setEditingWarehouse(null);
      setWarehouseForm({
        name: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        adminName: "",
        adminContact: "",
        adminEmail: "",
      });
    }
    setIsWarehouseDialogOpen(true);
  };

  const handleSaveWarehouse = async () => {
    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse._id, data: warehouseForm }, {
        onSuccess: () => {
          setIsWarehouseDialogOpen(false);
          setEditingWarehouse(null);
        }
      });
    } else {
      addWarehouseMutation.mutate(warehouseForm, {
        onSuccess: () => {
          setIsWarehouseDialogOpen(false);
          setEditingWarehouse(null);
        }
      });
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (window.confirm("Are you sure you want to delete this warehouse?")) {
      deleteWarehouseMutation.mutate(warehouseId);
    }
  };

  const handleTogglePermission = (role: string, module: string, actionKey: string) => {
    setLocalPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role) {
          const updatedPermissions = { ...p.permissions };
          const modulePerms = { ...updatedPermissions[module] };
          modulePerms[actionKey] = !modulePerms[actionKey];
          updatedPermissions[module] = modulePerms;
          return { ...p, permissions: updatedPermissions };
        }
        return p;
      })
    );
  };

  const handleSavePermissions = () => {
    // Save for each role but only show toast for the last one
    localPermissions.forEach((p, index) => {
      const isLast = index === localPermissions.length - 1;
      updatePermissionsMutation.mutate({ 
        role: p.role, 
        permissions: p.permissions, 
        quiet: !isLast 
      });
    });
  };

  const renderPermissionCell = (role: string, module: string, actionKey: string) => {
    // Super Admin always has full access regardless of data
    if (role === "Super Admin") return renderIcon(true);
    
    const roleData = localPermissions.find((p) => p.role === role);
    const val = roleData?.permissions?.[module]?.[actionKey];

    if (isSuperAdmin && role !== "Super Admin") {
      return (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={!!val}
            onChange={() => handleTogglePermission(role, module, actionKey)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      );
    }

    return renderIcon(val);
  };

  const leadPermissions = [
    { label: "View Leads", key: "view", module: "leads" },
    { label: "Create New Leads", key: "create", module: "leads" },
    { label: "Edit Lead Details", key: "edit", module: "leads" },
    { label: "Assign Leads to Dealers", key: "assignToDealers", module: "leads" },
    { label: "Update Lead Status", key: "updateStatus", module: "leads" },
    { label: "Add Follow-up / Activities", key: "addActivities", module: "leads" },
    { label: "Convert Lead to Order", key: "convertToOrder", module: "leads" },
    { label: "Delete Lead Records", key: "delete", module: "leads" },
  ];

  const dealerPermissions = [
    { label: "View Dealer Network", key: "view", module: "dealers" },
    { label: "Onboard New Dealers", key: "onboard", module: "dealers" },
    { label: "Approve Dealer KYC", key: "approveKYC", module: "dealers" },
    { label: "Edit Dealer Profiles", key: "editProfiles", module: "dealers" },
    { label: "Deactivate Dealer Account", key: "deactivate", module: "dealers" },
  ];

  const orderPermissions = [
    { label: "View Orders", key: "view", module: "orders" },
    { label: "Create New Orders", key: "create", module: "orders" },
    { label: "Upload/Edit Order Documents", key: "uploadDocs", module: "orders" },
    { label: "Update Delivery Status", key: "updateDelivery", module: "orders" },
    { label: "Cancel Orders", key: "cancel", module: "orders" },
    { label: "Approve Payments & Orders", key: "approvePayment", module: "orders" },
    { label: "Upload Lovol Invoices", key: "uploadLovolInvoice", module: "orders" },
    { label: "Request Documents", key: "requestDocs", module: "orders" },
    { label: "Status Override", key: "statusOverride", module: "orders" },
  ];

  const inventoryPermissions = [
    { label: "View Own Stock", key: "viewOwn", module: "inventory" },
    { label: "View Warehouse Stock", key: "viewWarehouses", module: "inventory" },
    { label: "View Subordinate Stock", key: "viewSubordinates", module: "inventory" },
    { label: "Manage Inventory (Adjust)", key: "manage", module: "inventory" },
  ];

  const renderIcon = (val: boolean | string) => {
    if (val === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (val === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
    return <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{val}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSaveCompanyInfo}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Company Information
                </h2>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <Label>Company Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: PNG or SVG, max 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="name">Company Name</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="name"
                      value={companyInfo.name}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, name: e.target.value })
                      }
                      placeholder="Enter company name"
                      className="mt-1"
                    />
                  )}
                </div>



                {/* GSTIN */}
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="gstin"
                      value={companyInfo.gstin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        if (value.length <= 15) {
                          setCompanyInfo({ ...companyInfo, gstin: value });
                        }
                      }}
                      placeholder="Enter 15-digit GSTIN"
                      className="mt-1"
                      maxLength={15}
                    />
                  )}
                </div>

                {/* PAN */}
                <div>
                  <Label htmlFor="pan">PAN</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="pan"
                      value={companyInfo.pan}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        if (value.length <= 10) {
                          setCompanyInfo({ ...companyInfo, pan: value });
                        }
                      }}
                      placeholder="Enter 10-digit PAN"
                      className="mt-1"
                      maxLength={10}
                    />
                  )}
                </div>


                {/* Address */}
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-24 w-full mt-1" />
                  ) : (
                    <Textarea
                      id="address"
                      value={companyInfo.address}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, address: e.target.value })
                      }
                      placeholder="Enter company address"
                      className="mt-1"
                      rows={3}
                    />
                  )}
                </div>


                {/* Website */}
                <div>
                  <Label htmlFor="website">Website</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="website"
                      type="url"
                      pattern="https?://.+"
                      title="Include http:// or https://"
                      value={companyInfo.website}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, website: e.target.value })
                      }
                      placeholder="https://www.example.com"
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Contact */}
                <div>
                  <Label htmlFor="contact">Contact Number</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="contact"
                      type="tel"
                      value={companyInfo.contact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setCompanyInfo({ ...companyInfo, contact: value });
                      }}
                      placeholder="e.g. 9876543210"
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  {isCompanyLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                  ) : (
                    <Input
                      id="email"
                      type="email"
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Enter a valid email address"
                      value={companyInfo.email}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, email: e.target.value })
                      }
                      placeholder="info@example.com"
                      className="mt-1"
                    />
                  )}
                </div>

              </div>
            </form>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  User Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage system users and their roles
                </p>
              </div>
              <Button
                onClick={() => handleOpenUserDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    usersData.map((user: User) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{user.role}</span>
                          {user.role === "Dealer" && user.dealerId && (
                            <div className="text-xs text-blue-600">
                              {dealers.find((d: any) => d._id === user.dealerId)?.companyName || "Unknown Dealer"}
                            </div>
                          )}
                          {user.role === "Distributor" && (
                            <div className="text-xs text-blue-600">
                              Region-based permissions
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteUserMutation.isPending}
                              onClick={() => handleOpenUserDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteUserMutation.isPending}
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Warehouse Management Tab */}
        <TabsContent value="warehouses" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Warehouse Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage warehouse locations and administrators
                </p>
              </div>
              <Button
                onClick={() => handleOpenWarehouseDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Warehouse
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isWarehousesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                warehousesData.map((warehouse: WarehouseData) => (
                  <Card key={warehouse._id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                             <h3 className="font-semibold text-gray-900">
                               {warehouse.name}
                             </h3>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Warehouse Details */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Location Details
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-900">{warehouse.address}</p>
                              <p className="text-gray-600">
                                {warehouse.city}, {warehouse.state} - {warehouse.pincode}
                              </p>
                            </div>
                          </div>

                          {/* Admin Details */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                              Administrator
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-900 font-medium">
                                {warehouse.adminName}
                              </p>
                              <p className="text-gray-600">{warehouse.adminContact}</p>
                              <p className="text-gray-600">{warehouse.adminEmail}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteWarehouseMutation.isPending}
                          onClick={() => handleOpenWarehouseDialog(warehouse)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteWarehouseMutation.isPending}
                          onClick={() => handleDeleteWarehouse(warehouse._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleteWarehouseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Role Permissions Overview
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review and manage the access rights for each system role
                </p>
              </div>
              {isSuperAdmin ? (
                <Button 
                  onClick={handleSavePermissions}
                  disabled={updatePermissionsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Info className="w-3 h-3" />
                  Read-only Overview
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Lead Management Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Lead Management</h3>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[300px]">Permission Unit</TableHead>
                        <TableHead className="text-center">Super Admin</TableHead>
                        <TableHead className="text-center">Distributor</TableHead>
                        <TableHead className="text-center">Dealer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadPermissions.map((perm, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-gray-700">{perm.label}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Super Admin", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Distributor", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Dealer", perm.module, perm.key)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Dealer Management Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Dealer Management</h3>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[300px]">Permission Unit</TableHead>
                        <TableHead className="text-center">Super Admin</TableHead>
                        <TableHead className="text-center">Distributor</TableHead>
                        <TableHead className="text-center">Dealer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealerPermissions.map((perm, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-gray-700">{perm.label}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Super Admin", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Distributor", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Dealer", perm.module, perm.key)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Management Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Order Management</h3>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[300px]">Permission Unit</TableHead>
                        <TableHead className="text-center">Super Admin</TableHead>
                        <TableHead className="text-center">Distributor</TableHead>
                        <TableHead className="text-center">Dealer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderPermissions.map((perm, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-gray-700">{perm.label}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Super Admin", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Distributor", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Dealer", perm.module, perm.key)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Inventory Management Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Inventory Management</h3>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[300px]">Permission Unit</TableHead>
                        <TableHead className="text-center">Super Admin</TableHead>
                        <TableHead className="text-center">Distributor</TableHead>
                        <TableHead className="text-center">Dealer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryPermissions.map((perm, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-gray-700">{perm.label}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Super Admin", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Distributor", perm.module, perm.key)}</TableCell>
                          <TableCell className="text-center">{renderPermissionCell("Dealer", perm.module, perm.key)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Distributor Warehouse Mapping Overview (New) */}
              {isSuperAdmin && (
                <div className="mt-8 border-t pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Distributor Warehouse Mapping</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Overview of active warehouse assignments for each distributor. To modify, use the User Management tab.
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Distributor Name</TableHead>
                          <TableHead>Assigned Warehouses (Own View)</TableHead>
                          <TableHead>Dealer Visibility Set</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData
                          .filter((u: any) => u.role === "Distributor")
                          .map((u: any) => (
                            <TableRow key={u._id}>
                              <TableCell className="font-medium">{u.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {u.assignedWarehouses?.length > 0 ? (
                                    u.assignedWarehouses.map((whId: string) => {
                                      const wh = warehousesData.find((w: any) => w._id === whId);
                                      return (
                                        <span key={whId} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                                          {wh?.name || "Unknown"}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">No warehouses assigned</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {u.dealerViewWarehouses?.length > 0 ? (
                                    u.dealerViewWarehouses.map((whId: string) => {
                                      const wh = warehousesData.find((w: any) => w._id === whId);
                                      return (
                                        <span key={whId} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                                          {wh?.name || "Unknown"}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">No visibility range set</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleOpenMappingDialog(u)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" />
                                  Edit Mapping
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {usersData.filter((u: any) => u.role === "Distributor").length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500 text-sm">
                              No distributors found in the system.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 italic text-sm text-gray-500">
                Note: Standard users (Distributors and Dealers) only have visibility into data they are owners of or are assigned to within their specific region/cluster.
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information and role"
                : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="user-name">Full Name *</Label>
              <Input
                id="user-name"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="user-phone">Phone Number *</Label>
              <Input
                id="user-phone"
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
                placeholder="+91-XXXXXXXXXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="user-role">Role *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) =>
                  setUserForm({ ...userForm, role: value })
                }
                disabled={editingUser?.role === "Dealer"}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  {editingUser?.role === "Dealer" && (
                    <SelectItem value="Dealer">Dealer</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user-password">
                {editingUser ? "New Password (Leave blank to keep current)" : "Password *"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder={editingUser ? "••••••••" : "Enter password"}
                className="mt-1"
              />
            </div>

            {userForm.role === "Distributor" && (
              <div className="space-y-4 border-t pt-4 mt-2">
                <h4 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                  <Warehouse className="w-4 h-4" /> Warehouse Visibility Mapping
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                    Assigned Warehouses (Distributor View)
                  </Label>
                  <p className="text-[10px] text-gray-400 -mt-1">Select which warehouses this distributor can personally monitor.</p>
                  <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50">
                    {warehousesData.map((wh: any) => (
                      <div key={wh._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`wh-assign-${wh._id}`}
                          checked={userForm.assignedWarehouses.includes(wh._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setUserForm(prev => ({
                              ...prev,
                              assignedWarehouses: checked
                                ? [...prev.assignedWarehouses, wh._id]
                                : prev.assignedWarehouses.filter(id => id !== wh._id)
                            }))
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                        />
                        <label htmlFor={`wh-assign-${wh._id}`} className="text-xs truncate" title={wh.name}>
                          {wh.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                    Dealer View Set (Subordinate View)
                  </Label>
                  <p className="text-[10px] text-gray-400 -mt-1">Select the subset of warehouses visible to all dealers under this distributor.</p>
                  <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50">
                    {warehousesData.map((wh: any) => (
                      <div key={wh._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`wh-dealer-${wh._id}`}
                          checked={userForm.dealerViewWarehouses.includes(wh._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setUserForm(prev => ({
                              ...prev,
                              dealerViewWarehouses: checked
                                ? [...prev.dealerViewWarehouses, wh._id]
                                : prev.dealerViewWarehouses.filter(id => id !== wh._id)
                            }))
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                        />
                        <label htmlFor={`wh-dealer-${wh._id}`} className="text-xs truncate" title={wh.name}>
                          {wh.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                !userForm.name ||
                !userForm.email ||
                !userForm.phone ||
                !userForm.role
              }
            >
              {editingUser ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? "Update warehouse information"
                : "Add a new warehouse location"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Warehouse Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Warehouse Information
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wh-name">Warehouse Name *</Label>
                  <Input
                    id="wh-name"
                    value={warehouseForm.name}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, name: e.target.value })
                    }
                    placeholder="e.g., Central Warehouse - Delhi"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="wh-address">Address *</Label>
                  <Textarea
                    id="wh-address"
                    value={warehouseForm.address}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, address: e.target.value })
                    }
                    placeholder="Enter warehouse address"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wh-city">City *</Label>
                    <Input
                      id="wh-city"
                      value={warehouseForm.city}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, city: e.target.value })
                      }
                      placeholder="Enter city"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wh-state">State *</Label>
                    <Input
                      id="wh-state"
                      value={warehouseForm.state}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, state: e.target.value })
                      }
                      placeholder="Enter state"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="wh-pincode">Pincode *</Label>
                  <Input
                    id="wh-pincode"
                    value={warehouseForm.pincode}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, pincode: e.target.value })
                    }
                    placeholder="Enter pincode"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Administrator Information */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">
                Administrator Information
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Admin Name *</Label>
                  <Input
                    id="admin-name"
                    value={warehouseForm.adminName}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, adminName: e.target.value })
                    }
                    placeholder="Enter admin name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-contact">Admin Contact *</Label>
                  <Input
                    id="admin-contact"
                    value={warehouseForm.adminContact}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, adminContact: e.target.value })
                    }
                    placeholder="+91-XXXXXXXXXX"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-email">Admin Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={warehouseForm.adminEmail}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, adminEmail: e.target.value })
                    }
                    placeholder="admin@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWarehouseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWarehouse}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                !warehouseForm.name ||
                !warehouseForm.address ||
                !warehouseForm.city ||
                !warehouseForm.state ||
                !warehouseForm.pincode ||
                !warehouseForm.adminName ||
                !warehouseForm.adminContact ||
                !warehouseForm.adminEmail
              }
            >
              {editingWarehouse ? "Update Warehouse" : "Add Warehouse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Visibility Mapping Dialog (Interactive) */}
      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Warehouse Visibility</DialogTitle>
            <DialogDescription>
              Assign warehouses to <strong>{mappingUser?.name}</strong> and define which ones are visible to their dealer network.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Distributor's own visibility */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Distributor's Warehouse View</h4>
              <p className="text-xs text-gray-500">Select warehouses this distributor can monitor directly.</p>
              <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                {warehousesData.map((wh: any) => (
                  <div key={wh._id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`own-${wh._id}`} 
                      checked={mappingFormData.assignedWarehouses.includes(wh._id)}
                      onCheckedChange={(checked) => {
                        const current = [...mappingFormData.assignedWarehouses];
                        if (checked) {
                          setMappingFormData({ ...mappingFormData, assignedWarehouses: [...current, wh._id] });
                        } else {
                          setMappingFormData({ ...mappingFormData, assignedWarehouses: current.filter(id => id !== wh._id) });
                        }
                      }}
                    />
                    <label htmlFor={`own-${wh._id}`} className="text-sm font-medium leading-none cursor-pointer">
                      {wh.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Dealers' visibility set */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Dealer Visibility Range</h4>
              <p className="text-xs text-gray-500">Define which warehouses subordinates (dealers) of this distributor can see.</p>
              <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                {warehousesData.map((wh: any) => (
                  <div key={wh._id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dealer-${wh._id}`} 
                      checked={mappingFormData.dealerViewWarehouses.includes(wh._id)}
                      onCheckedChange={(checked) => {
                        const current = [...mappingFormData.dealerViewWarehouses];
                        if (checked) {
                          setMappingFormData({ ...mappingFormData, dealerViewWarehouses: [...current, wh._id] });
                        } else {
                          setMappingFormData({ ...mappingFormData, dealerViewWarehouses: current.filter(id => id !== wh._id) });
                        }
                      }}
                    />
                    <label htmlFor={`dealer-${wh._id}`} className="text-sm font-medium leading-none cursor-pointer text-blue-600">
                      {wh.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMapping} className="bg-blue-600 hover:bg-blue-700">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
