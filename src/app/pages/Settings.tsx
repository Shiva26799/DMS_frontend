import { useState } from "react";
import { Save, Upload, Building2, Users, Warehouse, Trash2, Edit, Plus } from "lucide-react";
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
  DialogTrigger,
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

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

interface WarehouseData {
  id: string;
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
  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    address: "123, Industrial Area, Sector 10, Faridabad, Haryana - 121001",
    website: "https://www.lovol.com",
    contact: "+91-129-4150000",
    email: "info@lovol.com",
    logo: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@lovol.com",
      phone: "+91-9876543210",
      role: "Super Admin",
      status: "Active",
      lastLogin: "2024-03-02 10:30 AM",
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya.sharma@lovol.com",
      phone: "+91-9876543211",
      role: "Regional Manager",
      status: "Active",
      lastLogin: "2024-03-02 09:15 AM",
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit.patel@lovol.com",
      phone: "+91-9876543212",
      role: "Warehouse Manager",
      status: "Active",
      lastLogin: "2024-03-01 05:45 PM",
    },
    {
      id: "4",
      name: "Sunita Reddy",
      email: "sunita.reddy@lovol.com",
      phone: "+91-9876543213",
      role: "Accounts Team",
      status: "Inactive",
      lastLogin: "2024-02-28 11:20 AM",
    },
  ]);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  // Warehouse Management State
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([
    {
      id: "1",
      name: "Central Warehouse - Delhi",
      address: "Plot No. 45, Industrial Area",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      adminName: "Vikram Singh",
      adminContact: "+91-9876543220",
      adminEmail: "vikram.singh@lovol.com",
      status: "Active",
    },
    {
      id: "2",
      name: "Regional Warehouse - Mumbai",
      address: "Godown No. 12, MIDC Area",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      adminName: "Deepak Joshi",
      adminContact: "+91-9876543221",
      adminEmail: "deepak.joshi@lovol.com",
      status: "Active",
    },
    {
      id: "3",
      name: "Regional Warehouse - Bangalore",
      address: "Site No. 78, Electronic City",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560100",
      adminName: "Suresh Kumar",
      adminContact: "+91-9876543222",
      adminEmail: "suresh.kumar@lovol.com",
      status: "Active",
    },
  ]);

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

  // Company Information Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyInfo({ ...companyInfo, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompanyInfo = () => {
    toast.success("Company information saved successfully");
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
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        role: "",
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...userForm }
            : u
        )
      );
      toast.success("User updated successfully");
    } else {
      // Add new user
      const newUser: User = {
        id: String(users.length + 1),
        ...userForm,
        status: "Active",
        lastLogin: "Never",
      };
      setUsers([...users, newUser]);
      toast.success("User added successfully");
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("User deleted successfully");
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

  const handleSaveWarehouse = () => {
    if (editingWarehouse) {
      // Update existing warehouse
      setWarehouses(
        warehouses.map((w) =>
          w.id === editingWarehouse.id
            ? { ...w, ...warehouseForm }
            : w
        )
      );
      toast.success("Warehouse updated successfully");
    } else {
      // Add new warehouse
      const newWarehouse: WarehouseData = {
        id: String(warehouses.length + 1),
        ...warehouseForm,
        status: "Active",
      };
      setWarehouses([...warehouses, newWarehouse]);
      toast.success("Warehouse added successfully");
    }
    setIsWarehouseDialogOpen(false);
    setEditingWarehouse(null);
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    setWarehouses(warehouses.filter((w) => w.id !== warehouseId));
    toast.success("Warehouse deleted successfully");
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Company Information
              </h2>
              <Button
                onClick={handleSaveCompanyInfo}
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

              {/* GSTIN */}
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={companyInfo.gstin}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, gstin: e.target.value })
                  }
                  placeholder="Enter GSTIN"
                  className="mt-1"
                />
              </div>

              {/* PAN */}
              <div>
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={companyInfo.pan}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, pan: e.target.value })
                  }
                  placeholder="Enter PAN"
                  className="mt-1"
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
                  value={companyInfo.contact}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, contact: e.target.value })
                  }
                  placeholder="+91-XXX-XXXXXXX"
                  className="mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, email: e.target.value })
                  }
                  placeholder="info@example.com"
                  className="mt-1"
                />
              </div>
            </div>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{user.role}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
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
                            onClick={() => handleDeleteUser(user.id)}
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
                <Card key={warehouse.id} className="p-5 hover:shadow-md transition-shadow">
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
                        onClick={() => handleDeleteWarehouse(warehouse.id)}
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
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Regional Manager">Regional Manager</SelectItem>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                  <SelectItem value="Accounts Team">Accounts Team</SelectItem>
                  <SelectItem value="Service Team">Service Team</SelectItem>
                  <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={!userForm.name || !userForm.email || !userForm.phone || !userForm.role}
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
    </div>
  );
}
