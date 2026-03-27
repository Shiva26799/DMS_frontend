// Mock data for the DMS system

// Warehouse interface
export interface Warehouse {
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

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  product: string;
  source: "Web" | "Dealer";
  dealer?: string;
  region: string;
  status: "New" | "Assigned" | "Discussion" | "Negotiation" | "Won" | "Lost";
  assignedDate: string;
  value: number;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  dealerName: string;
  type: "Individual" | "Corporate";
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: string;
  status: "Active" | "Inactive";
}

export interface Dealer {
  _id: string;
  companyName: string;
  ownerName: string;
  code: string;
  region: string;
  city: string;
  address: string;
  pincode: string;
  contact: string;
  email: string;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  outstandingAmount: number;
  performance: number;
  status: "Pending" | "Approved" | "Rejected";
  joinedDate: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: "Harvester" | "Spare Part";
  model: string;
  price: number;
  warrantyPeriod: string;
  serviceSchedule: string;
  stockAvailable: number;
  description: string;
  specifications: Record<string, string>;
}

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: "Harvester" | "Spare Part";
  warehouseId: string;
  warehouseName: string;
  available: number;
  reserved: number;
  reorderLevel: number;
  status: "Normal" | "Low" | "Critical" | "Out of Stock";
}

export interface Order {
  id: string;
  orderNumber: string;
  dealer: string;
  dealerId: string;
  product: string;
  quantity: number;
  totalValue: number;
  orderDate: string;
  paymentStatus: "Paid" | "Unpaid" | "Partial" | "Pending";
  deliveryStatus: string;
  currentStage: string;
  stageProgress: number;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  productSerial: string;
  productName: string;
  dealer: string;
  purchaseDate: string;
  issueDescription: string;
  status: "Submitted" | "Under Review" | "Approved" | "Dispatch" | "Installed" | "Closed" | "Rejected";
  submittedDate: string;
  warrantyValid: boolean;
}

export interface MaintenanceRecord {
  id: string;
  productSerial: string;
  productName: string;
  dealer: string;
  serviceType: "3-Month" | "6-Month" | "500-Hour" | "1000-Hour";
  dueDate: string;
  status: "Upcoming" | "Overdue" | "Completed";
  lastServiceDate?: string;
}

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: "L001",
    customerName: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    product: "LOVOL HP-2000 Harvester",
    source: "Web",
    region: "Punjab",
    status: "New",
    assignedDate: "2026-02-25",
    value: 1850000,
    notes: "Interested in demo",
  },
  {
    id: "L002",
    customerName: "Amit Singh",
    phone: "+91 98765 43211",
    email: "amit.singh@email.com",
    product: "LOVOL HP-3000 Harvester",
    source: "Dealer",
    dealer: "Punjab Agro Solutions",
    region: "Punjab",
    status: "Discussion",
    assignedDate: "2026-02-20",
    value: 2350000,
    notes: "Follow-up scheduled for next week",
  },
  {
    id: "L003",
    customerName: "Suresh Patel",
    phone: "+91 98765 43212",
    email: "suresh.patel@email.com",
    product: "LOVOL HP-2000 Harvester",
    source: "Web",
    region: "Haryana",
    status: "Negotiation",
    assignedDate: "2026-02-15",
    value: 1850000,
    notes: "Requested financing options",
  },
  {
    id: "L004",
    customerName: "Vikram Reddy",
    phone: "+91 98765 43213",
    email: "vikram.reddy@email.com",
    product: "LOVOL HP-4000 Harvester",
    source: "Dealer",
    dealer: "South India Equipment",
    region: "Andhra Pradesh",
    status: "Won",
    assignedDate: "2026-02-10",
    value: 2850000,
    notes: "Order placed, processing payment",
  },
  {
    id: "L005",
    customerName: "Manoj Gupta",
    phone: "+91 98765 43214",
    email: "manoj.gupta@email.com",
    product: "LOVOL HP-2000 Harvester",
    source: "Web",
    region: "Uttar Pradesh",
    status: "Assigned",
    assignedDate: "2026-02-23",
    value: 1850000,
    notes: "Assigned to dealer for follow-up",
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: "C001",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    region: "Punjab",
    dealerName: "Punjab Agro Solutions",
    type: "Individual",
    totalPurchases: 2,
    totalSpent: 3700000,
    lastPurchaseDate: "2026-02-20",
    status: "Active",
  },
  {
    id: "C002",
    name: "Vikram Reddy",
    phone: "+91 98765 43213",
    email: "vikram.reddy@email.com",
    region: "Andhra Pradesh",
    dealerName: "South India Equipment",
    type: "Individual",
    totalPurchases: 1,
    totalSpent: 2850000,
    lastPurchaseDate: "2026-02-10",
    status: "Active",
  },
  {
    id: "C003",
    name: "Suresh Patel",
    phone: "+91 98765 43212",
    email: "suresh.patel@email.com",
    region: "Haryana",
    dealerName: "Haryana Farm Tech",
    type: "Individual",
    totalPurchases: 0,
    totalSpent: 0,
    lastPurchaseDate: "N/A",
    status: "Active",
  },
  {
    id: "C004",
    name: "Maharashtra Agro Solutions",
    phone: "+91 98765 00005",
    email: "contact@maharashtraagri.com",
    region: "Maharashtra",
    dealerName: "Maharashtra Agri Solutions",
    type: "Corporate",
    totalPurchases: 5,
    totalSpent: 12500000,
    lastPurchaseDate: "2026-03-15",
    status: "Active",
  },
  {
    id: "C005",
    name: "Amit Singh",
    phone: "+91 98765 43211",
    email: "amit.singh@email.com",
    region: "Punjab",
    dealerName: "Punjab Agro Solutions",
    type: "Individual",
    totalPurchases: 1,
    totalSpent: 2350000,
    lastPurchaseDate: "2026-02-28",
    status: "Active",
  },
];

// Mock Dealers
export const mockDealers: Dealer[] = [
  {
    _id: "D001",
    companyName: "Punjab Agro Solutions",
    ownerName: "Harpreet Singh",
    code: "DLR-PB-001",
    region: "Punjab",
    city: "Ludhiana",
    address: "123, Agro Lane, Industrial Area",
    pincode: "141001",
    contact: "+91 98765 00001",
    email: "contact@punjabagro.com",
    gstin: "03AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    creditLimit: 5000000,
    outstandingAmount: 2300000,
    performance: 92,
    status: "Approved",
    joinedDate: "2024-03-15",
    totalOrders: 45,
    totalRevenue: 8500000,
  },
  {
    _id: "D002",
    companyName: "South India Equipment",
    ownerName: "Ravi Kumar",
    code: "DLR-AP-002",
    region: "Andhra Pradesh",
    city: "Vijayawada",
    address: "45, Marine Drive, Tech Park",
    pincode: "520001",
    contact: "+91 98765 00002",
    email: "contact@southindiaequip.com",
    gstin: "37AAAAA0000A1Z5",
    pan: "BBBBB1111B",
    creditLimit: 7000000,
    outstandingAmount: 3500000,
    performance: 88,
    status: "Approved",
    joinedDate: "2024-01-20",
    totalOrders: 62,
    totalRevenue: 12500000,
  },
  {
    _id: "D003",
    companyName: "Haryana Farm Tech",
    ownerName: "Sunil Sharma",
    code: "DLR-HR-003",
    region: "Haryana",
    city: "Karnal",
    address: "89, Grain Market, Sector 12",
    pincode: "132001",
    contact: "+91 98765 00003",
    email: "contact@haryanafarm.com",
    gstin: "06AAAAA0000A1Z5",
    pan: "CCCCC2222C",
    creditLimit: 4000000,
    outstandingAmount: 1800000,
    performance: 85,
    status: "Approved",
    joinedDate: "2024-06-10",
    totalOrders: 38,
    totalRevenue: 6800000,
  },
  {
    _id: "D004",
    companyName: "UP Machinery Hub",
    ownerName: "Ajay Verma",
    code: "DLR-UP-004",
    region: "Uttar Pradesh",
    city: "Meerut",
    address: "Shop 12, Highway Plaza",
    pincode: "250001",
    contact: "+91 98765 00004",
    email: "contact@upmachinery.com",
    gstin: "09AAAAA0000A1Z5",
    pan: "DDDDD3333D",
    creditLimit: 6000000,
    outstandingAmount: 5500000,
    performance: 75,
    status: "Approved",
    joinedDate: "2023-11-05",
    totalOrders: 52,
    totalRevenue: 9500000,
  },
  {
    _id: "D005",
    companyName: "Maharashtra Agri Solutions",
    ownerName: "Prakash Jadhav",
    code: "DLR-MH-005",
    region: "Maharashtra",
    city: "Nashik",
    address: "Vineyard Street, Near Station",
    pincode: "422001",
    contact: "+91 98765 00005",
    email: "contact@maharashtraagri.com",
    gstin: "27AAAAA0000A1Z5",
    pan: "EEEEE4444E",
    creditLimit: 5500000,
    outstandingAmount: 1200000,
    performance: 95,
    status: "Approved",
    joinedDate: "2024-02-28",
    totalOrders: 48,
    totalRevenue: 8900000,
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: "P001",
    sku: "HP-2000",
    name: "LOVOL HP-2000 Harvester",
    category: "Harvester",
    model: "HP-2000",
    price: 1850000,
    warrantyPeriod: "12 Months",
    serviceSchedule: "Every 3 months or 500 hours",
    stockAvailable: 15,
    description: "Compact harvester suitable for small to medium farms",
    specifications: {
      "Engine Power": "120 HP",
      "Cutting Width": "4.2m",
      "Fuel Tank": "180L",
      "Weight": "3500 kg",
    },
  },
  {
    id: "P002",
    sku: "HP-3000",
    name: "LOVOL HP-3000 Harvester",
    category: "Harvester",
    model: "HP-3000",
    price: 2350000,
    warrantyPeriod: "12 Months",
    serviceSchedule: "Every 3 months or 500 hours",
    stockAvailable: 8,
    description: "Mid-range harvester with advanced features",
    specifications: {
      "Engine Power": "150 HP",
      "Cutting Width": "5.0m",
      "Fuel Tank": "220L",
      "Weight": "4200 kg",
    },
  },
  {
    id: "P003",
    sku: "HP-4000",
    name: "LOVOL HP-4000 Harvester",
    category: "Harvester",
    model: "HP-4000",
    price: 2850000,
    warrantyPeriod: "18 Months",
    serviceSchedule: "Every 3 months or 500 hours",
    stockAvailable: 5,
    description: "Premium harvester for large-scale operations",
    specifications: {
      "Engine Power": "180 HP",
      "Cutting Width": "5.8m",
      "Fuel Tank": "250L",
      "Weight": "4800 kg",
    },
  },
  {
    id: "P004",
    sku: "SP-ENG-001",
    name: "Engine Oil Filter",
    category: "Spare Part",
    model: "Universal",
    price: 850,
    warrantyPeriod: "3 Months",
    serviceSchedule: "Replace every service",
    stockAvailable: 150,
    description: "High-quality engine oil filter",
    specifications: {
      Compatibility: "All LOVOL models",
      Material: "Synthetic fiber",
    },
  },
  {
    id: "P005",
    sku: "SP-BLD-002",
    name: "Cutting Blade Set",
    category: "Spare Part",
    model: "HP Series",
    price: 12500,
    warrantyPeriod: "6 Months",
    serviceSchedule: "Replace when worn",
    stockAvailable: 80,
    description: "Premium cutting blade set",
    specifications: {
      Compatibility: "HP-2000, HP-3000, HP-4000",
      Material: "Hardened steel",
      "Blade Count": "8 pieces",
    },
  },
];

// Mock Inventory
export const mockInventory: InventoryItem[] = [
  {
    id: "INV001",
    sku: "HP-2000",
    productName: "LOVOL HP-2000 Harvester",
    category: "Harvester",
    warehouseId: "W001",
    warehouseName: "Main Factory - Delhi",
    available: 15,
    reserved: 3,
    reorderLevel: 10,
    status: "Normal",
  },
  {
    id: "INV002",
    sku: "HP-3000",
    productName: "LOVOL HP-3000 Harvester",
    category: "Harvester",
    warehouseId: "W001",
    warehouseName: "Main Factory - Delhi",
    available: 8,
    reserved: 2,
    reorderLevel: 8,
    status: "Low",
  },
  {
    id: "INV003",
    sku: "HP-4000",
    productName: "LOVOL HP-4000 Harvester",
    category: "Harvester",
    warehouseId: "W001",
    warehouseName: "Main Factory - Delhi",
    available: 5,
    reserved: 1,
    reorderLevel: 6,
    status: "Critical",
  },
  {
    id: "INV004",
    sku: "HP-2000",
    productName: "LOVOL HP-2000 Harvester",
    category: "Harvester",
    warehouseId: "W002",
    warehouseName: "Punjab Regional Hub",
    available: 4,
    reserved: 1,
    reorderLevel: 3,
    status: "Normal",
  },
  {
    id: "INV005",
    sku: "SP-ENG-001",
    productName: "Engine Oil Filter",
    category: "Spare Part",
    warehouseId: "W001",
    warehouseName: "Main Factory - Delhi",
    available: 150,
    reserved: 20,
    reorderLevel: 50,
    status: "Normal",
  },
  {
    id: "INV006",
    sku: "SP-BLD-002",
    productName: "Cutting Blade Set",
    category: "Spare Part",
    warehouseId: "W001",
    warehouseName: "Main Factory - Delhi",
    available: 80,
    reserved: 15,
    reorderLevel: 30,
    status: "Normal",
  },
  {
    id: "INV007",
    sku: "SP-ENG-001",
    productName: "Engine Oil Filter",
    category: "Spare Part",
    warehouseId: "W002",
    warehouseName: "Haryana Regional Hub",
    available: 25,
    reserved: 5,
    reorderLevel: 20,
    status: "Normal",
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: "ORD001",
    orderNumber: "ORD-2026-001",
    dealer: "Punjab Agro Solutions",
    dealerId: "D001",
    product: "LOVOL HP-2000 Harvester (x2)",
    quantity: 2,
    totalValue: 3700000,
    orderDate: "2026-02-20",
    paymentStatus: "Paid",
    deliveryStatus: "In Transit",
    currentStage: "Delivery Tracking",
    stageProgress: 60,
  },
  {
    id: "ORD002",
    orderNumber: "ORD-2026-002",
    dealer: "South India Equipment",
    dealerId: "D002",
    product: "LOVOL HP-4000 Harvester (x1)",
    quantity: 1,
    totalValue: 2850000,
    orderDate: "2026-02-22",
    paymentStatus: "Pending",
    deliveryStatus: "Awaiting Payment",
    currentStage: "Payment Verification",
    stageProgress: 30,
  },
  {
    id: "ORD003",
    orderNumber: "ORD-2026-003",
    dealer: "Haryana Farm Tech",
    dealerId: "D003",
    product: "LOVOL HP-3000 Harvester (x1)",
    quantity: 1,
    totalValue: 2350000,
    orderDate: "2026-02-18",
    paymentStatus: "Paid",
    deliveryStatus: "Delivered",
    currentStage: "Installation Status",
    stageProgress: 80,
  },
  {
    id: "ORD004",
    orderNumber: "ORD-2026-004",
    dealer: "UP Machinery Hub",
    dealerId: "D004",
    product: "LOVOL HP-2000 Harvester (x3)",
    quantity: 3,
    totalValue: 5550000,
    orderDate: "2026-02-25",
    paymentStatus: "Partial",
    deliveryStatus: "Processing",
    currentStage: "Order Approval",
    stageProgress: 40,
  },
  {
    id: "ORD005",
    orderNumber: "ORD-2026-005",
    dealer: "Maharashtra Agri Solutions",
    dealerId: "D005",
    product: "LOVOL HP-3000 Harvester (x2)",
    quantity: 2,
    totalValue: 4700000,
    orderDate: "2026-02-15",
    paymentStatus: "Paid",
    deliveryStatus: "Completed",
    currentStage: "Order Closure",
    stageProgress: 100,
  },
];

// Mock Warranty Claims
export const mockWarrantyClaims: WarrantyClaim[] = [
  {
    id: "WC001",
    claimNumber: "WC-2026-001",
    productSerial: "HP2000-2025-1234",
    productName: "LOVOL HP-2000 Harvester",
    dealer: "Punjab Agro Solutions",
    purchaseDate: "2025-08-15",
    issueDescription: "Engine overheating issue during operation",
    status: "Under Review",
    submittedDate: "2026-02-24",
    warrantyValid: true,
  },
  {
    id: "WC002",
    claimNumber: "WC-2026-002",
    productSerial: "HP3000-2025-5678",
    productName: "LOVOL HP-3000 Harvester",
    dealer: "South India Equipment",
    purchaseDate: "2025-09-20",
    issueDescription: "Hydraulic system malfunction",
    status: "Approved",
    submittedDate: "2026-02-20",
    warrantyValid: true,
  },
  {
    id: "WC003",
    claimNumber: "WC-2026-003",
    productSerial: "HP2000-2025-9012",
    productName: "LOVOL HP-2000 Harvester",
    dealer: "Haryana Farm Tech",
    purchaseDate: "2025-07-10",
    issueDescription: "Cutting blade assembly wear",
    status: "Dispatch",
    submittedDate: "2026-02-18",
    warrantyValid: true,
  },
  {
    id: "WC004",
    claimNumber: "WC-2026-004",
    productSerial: "HP4000-2024-3456",
    productName: "LOVOL HP-4000 Harvester",
    dealer: "UP Machinery Hub",
    purchaseDate: "2024-12-05",
    issueDescription: "Electrical system failure",
    status: "Submitted",
    submittedDate: "2026-02-26",
    warrantyValid: true,
  },
  {
    id: "WC005",
    claimNumber: "WC-2026-005",
    productSerial: "HP3000-2025-7890",
    productName: "LOVOL HP-3000 Harvester",
    dealer: "Maharashtra Agri Solutions",
    purchaseDate: "2025-10-15",
    issueDescription: "Fuel system leak",
    status: "Closed",
    submittedDate: "2026-02-10",
    warrantyValid: true,
  },
];

// Mock Maintenance Records
export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: "M001",
    productSerial: "HP2000-2025-1234",
    productName: "LOVOL HP-2000 Harvester",
    dealer: "Punjab Agro Solutions",
    serviceType: "3-Month",
    dueDate: "2026-03-05",
    status: "Upcoming",
    lastServiceDate: "2025-12-05",
  },
  {
    id: "M002",
    productSerial: "HP3000-2025-5678",
    productName: "LOVOL HP-3000 Harvester",
    dealer: "South India Equipment",
    serviceType: "500-Hour",
    dueDate: "2026-03-10",
    status: "Upcoming",
    lastServiceDate: "2025-11-20",
  },
  {
    id: "M003",
    productSerial: "HP4000-2024-3456",
    productName: "LOVOL HP-4000 Harvester",
    dealer: "UP Machinery Hub",
    serviceType: "6-Month",
    dueDate: "2026-02-25",
    status: "Overdue",
    lastServiceDate: "2025-08-25",
  },
  {
    id: "M004",
    productSerial: "HP2000-2025-9012",
    productName: "LOVOL HP-2000 Harvester",
    dealer: "Haryana Farm Tech",
    serviceType: "3-Month",
    dueDate: "2026-01-15",
    status: "Completed",
    lastServiceDate: "2026-01-12",
  },
  {
    id: "M005",
    productSerial: "HP3000-2025-7890",
    productName: "LOVOL HP-3000 Harvester",
    dealer: "Maharashtra Agri Solutions",
    serviceType: "1000-Hour",
    dueDate: "2026-03-20",
    status: "Upcoming",
    lastServiceDate: "2025-09-15",
  },
];

// Mock Warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: "W001",
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
    id: "W002",
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
    id: "W003",
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
  {
    id: "W004",
    name: "Punjab Regional Hub",
    address: "Plot No. 23, Industrial Zone",
    city: "Ludhiana",
    state: "Punjab",
    pincode: "141001",
    adminName: "Gurpreet Singh",
    adminContact: "+91-9876543223",
    adminEmail: "gurpreet.singh@lovol.com",
    status: "Active",
  },
  {
    id: "W005",
    name: "Haryana Regional Hub",
    address: "Plot No. 67, HSIIDC Area",
    city: "Karnal",
    state: "Haryana",
    pincode: "132001",
    adminName: "Rohit Sharma",
    adminContact: "+91-9876543224",
    adminEmail: "rohit.sharma@lovol.com",
    status: "Active",
  },
];