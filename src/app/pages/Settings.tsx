import { useState, useEffect } from "react";
import { Save, Upload, Building2, Users, Warehouse, Trash2, Edit, Plus, Loader2 } from "lucide-react";
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
import { StatusBadge } from "../components/StatusBadge";
import { toast } from "sonner";
import { apiClient } from "../api/client";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  lastLogin: string;
  dealerId?: string;
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
  status: "Active" | "Inactive";
}

export function Settings() {
  const [loading, setLoading] = useState(true);

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

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    dealerId: "",
  });

  // Warehouse Management State
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
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
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    Promise.all([
      apiClient.get("settings/company"),
      apiClient.get("settings/users"),
      apiClient.get("settings/warehouses"),
      apiClient.get("dealers")
    ])
      .then(([companyRes, usersRes, warehousesRes, dealersRes]) => {
        if (companyRes.data) {
          setCompanyInfo(companyRes.data);
          if (companyRes.data.logoUrl) {
            setLogoPreview(companyRes.data.logoUrl);
          }
        }
        if (usersRes.data) setUsers(usersRes.data);
        if (warehousesRes.data) setWarehouses(warehousesRes.data);
        if (dealersRes.data) setDealers(dealersRes.data);
      })
      .catch((err) => {
        toast.error("Failed to load settings data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Company Information Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to S3 via backend
      try {
        const formData = new FormData();
        formData.append("logo", file);

        const res = await apiClient.put("settings/company/logo", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Logo uploaded successfully");
        setCompanyInfo({ ...companyInfo, logoUrl: res.data.logoUrl });
      } catch (error) {
        toast.error("Failed to upload logo to server");
        // Revert preview on failure
        setLogoPreview(companyInfo.logoUrl || null);
      }
    }
  };

  const handleSaveCompanyInfo = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    try {
      await apiClient.put("settings/company", companyInfo);
      toast.success("Company information saved successfully");
    } catch (error) {
      toast.error("Failed to save company information");
    }
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
        dealerId: user.dealerId || "",
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        dealerId: "",
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const payload = { ...userForm };
        if (!payload.dealerId) payload.dealerId = null as any; // Allow clearing dealerId

        const res = await apiClient.put(`settings/users/${editingUser._id}`, payload);
        setUsers(users.map((u) => (u._id === editingUser._id ? res.data : u)));
        toast.success("User updated successfully");
      } else {
        // Add new user
        if (!userForm.password) {
          toast.error("Password is required for new users");
          return;
        }

        const payload: any = { ...userForm };
        if (!payload.dealerId) delete payload.dealerId;

        const res = await apiClient.post("settings/users", payload);
        setUsers([...users, res.data]);
        toast.success("User added successfully");
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error("Failed to save user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.delete(`settings/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Warehouse Management Handlers
  const handleOpenWarehouseDialog = (warehouse?: WarehouseData) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setWarehouseForm({
        name: warehouse.name,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
        adminName: warehouse.adminName,
        adminContact: warehouse.adminContact,
        adminEmail: warehouse.adminEmail,
        status: warehouse.status,
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
        status: "Active",
      });
    }
    setIsWarehouseDialogOpen(true);
  };

  const handleSaveWarehouse = async () => {
    try {
      if (editingWarehouse) {
        // Update existing warehouse
        const res = await apiClient.put(`settings/warehouses/${editingWarehouse._id}`, warehouseForm);
        setWarehouses(warehouses.map((w) => (w._id === editingWarehouse._id ? res.data : w)));
        toast.success("Warehouse updated successfully");
      } else {
        // Add new warehouse
        const res = await apiClient.post("settings/warehouses", warehouseForm);
        setWarehouses([...warehouses, res.data]);
        toast.success("Warehouse added successfully");
      }
      setIsWarehouseDialogOpen(false);
      setEditingWarehouse(null);
    } catch (error) {
      toast.error("Failed to save warehouse");
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await apiClient.delete(`settings/warehouses/${warehouseId}`);
      setWarehouses(warehouses.filter((w) => w._id !== warehouseId));
      toast.success("Warehouse deleted successfully");
    } catch (error) {
      toast.error("Failed to delete warehouse");
    }
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
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
                  <Input
                    id="name"
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    className="mt-1"
                  />
                </div>


                {/* GSTIN */}
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
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
                </div>

                {/* PAN */}
                <div>
                  <Label htmlFor="pan">PAN</Label>
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
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
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
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website">Website</Label>
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
                </div>

                {/* Contact */}
                <div>
                  <Label htmlFor="contact">Contact Number</Label>
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
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
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
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{user.role}</span>
                        {user.role === "Dealer" && user.dealerId && (
                          <div className="text-xs text-blue-600">
                            {dealers.find(d => d._id === user.dealerId)?.companyName || "Unknown Dealer"}
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
                            onClick={() => handleOpenUserDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              {warehouses.map((warehouse) => (
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
                          <StatusBadge status={warehouse.status} />
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
                        onClick={() => handleOpenWarehouseDialog(warehouse)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWarehouse(warehouse._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                  <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userForm.role === "Dealer" && (
              <div>
                <Label htmlFor="user-dealer">Associate Dealer *</Label>
                <Select
                  value={userForm.dealerId}
                  onValueChange={(value) =>
                    setUserForm({ ...userForm, dealerId: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.map((dealer) => (
                      <SelectItem key={dealer._id} value={dealer._id}>
                        {dealer.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                !userForm.role ||
                (userForm.role === "Dealer" && !userForm.dealerId)
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

                {editingWarehouse && (
                  <div>
                    <Label htmlFor="wh-status">Status</Label>
                    <Select
                      value={warehouseForm.status}
                      onValueChange={(value: "Active" | "Inactive") =>
                        setWarehouseForm({ ...warehouseForm, status: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
    </div>
  );
}
