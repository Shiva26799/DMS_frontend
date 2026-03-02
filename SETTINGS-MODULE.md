# Settings Module Documentation

## Overview
The Settings module has been successfully added to the LOVOL DMS system. This module provides centralized management for company configuration, user administration, and warehouse locations.

## Module Structure

### 1. Company Information Management
Manage essential company details and branding:

**Fields:**
- **GSTIN** - Goods and Services Tax Identification Number
- **PAN** - Permanent Account Number
- **Address** - Complete company address with formatting
- **Website** - Company website URL
- **Contact** - Primary contact phone number
- **Email** - Primary company email
- **Logo Upload** - Company logo with preview (supports PNG/SVG, max 2MB)

**Features:**
- Logo preview with upload functionality
- Form validation for all fields
- Save changes with confirmation toast
- Professional card-based layout

### 2. User Management
Complete CRUD operations for system users:

**User Fields:**
- Full Name
- Email Address
- Phone Number
- Role (with predefined options)
- Status (Active/Inactive)
- Last Login timestamp

**Available Roles:**
- Super Admin
- Regional Manager
- Dealer
- Accounts Team
- Service Team
- Warehouse Manager

**Features:**
- Add new users with dialog form
- Edit existing users
- Delete users with confirmation
- Status badges for active/inactive users
- Table view with sortable columns
- Form validation (all fields required)
- Real-time updates with toast notifications

### 3. Warehouse Management
Manage warehouse locations and administrators:

**Warehouse Information:**
- Warehouse Name
- Address (multi-line)
- City
- State
- Pincode

**Administrator Information:**
- Admin Name
- Admin Contact Number
- Admin Email

**Features:**
- Add new warehouses with comprehensive form
- Edit existing warehouse details
- Delete warehouses
- Card-based layout for better visualization
- Status indicators for each warehouse
- Dedicated admin section for each location
- Form validation (all fields required)
- Toast notifications for all actions

## Navigation
The Settings module is accessible via:
- **Sidebar Menu**: "Settings" option at the bottom of the navigation
- **Route**: `/settings`
- **Icon**: Gear/Settings icon

## User Interface
The module follows the existing DMS design system:
- **Color Scheme**: Deep blue primary (#2563EB), green success, red danger
- **Layout**: Fixed sidebar, top header, card-based content
- **Components**: Shadcn UI components for consistency
- **Tabs**: Three tabs for organized access to different settings sections
- **Dialogs**: Modal forms for add/edit operations
- **Responsive**: Fully responsive design for all screen sizes

## Technical Implementation

### File Location
- **Page Component**: `/src/app/pages/Settings.tsx`
- **Route Definition**: `/src/app/routes.tsx`
- **Navigation**: `/src/app/components/Sidebar.tsx`

### Dependencies Used
- React hooks (useState)
- React Router (navigation)
- Lucide React (icons)
- Shadcn UI components:
  - Button, Card, Input, Label
  - Tabs, Table, Dialog
  - Select, Textarea
  - StatusBadge (custom)
- Sonner (toast notifications)

### State Management
- Local component state using React hooks
- Mock data initialized with realistic Indian company/user data
- Form state management for dialogs
- Edit mode detection for CRUD operations

## Mock Data

### Sample Company Information
- GSTIN: 29ABCDE1234F1Z5
- PAN: ABCDE1234F
- Location: Faridabad, Haryana
- Website: https://www.lovol.com

### Sample Users (4 pre-loaded)
- Rajesh Kumar (Super Admin)
- Priya Sharma (Regional Manager)
- Amit Patel (Warehouse Manager)
- Sunita Reddy (Accounts Team)

### Sample Warehouses (3 pre-loaded)
- Central Warehouse - Delhi
- Regional Warehouse - Mumbai
- Regional Warehouse - Bangalore

## Features & Functionality

### Toast Notifications
All user actions trigger appropriate toast notifications:
- ✅ Success messages for saves, updates, deletions
- ⚠️ Error handling (ready for backend integration)
- ℹ️ Information messages for user guidance

### Form Validation
- Required field validation
- Disabled submit buttons until all required fields are filled
- Email format validation
- Phone number format guidance
- URL format validation for website

### User Experience
- Clean, intuitive tab-based navigation
- Consistent action buttons (Edit/Delete)
- Dialog-based forms for non-intrusive editing
- Cancel functionality to discard changes
- Visual feedback for all actions
- Professional status badges

## Integration Points

### Ready for Backend Integration
The module is designed to easily integrate with backend APIs:
- Replace local state with API calls
- Add loading states
- Implement error handling
- Add data persistence
- Integrate with authentication system
- Add role-based permissions

### Suggested Backend Endpoints
```
Company Info:
- GET    /api/settings/company
- PUT    /api/settings/company
- POST   /api/settings/company/logo

Users:
- GET    /api/users
- POST   /api/users
- PUT    /api/users/:id
- DELETE /api/users/:id

Warehouses:
- GET    /api/warehouses
- POST   /api/warehouses
- PUT    /api/warehouses/:id
- DELETE /api/warehouses/:id
```

## Role-Based Access Control (Future)
When implementing RBAC, consider these permissions:

**Super Admin:**
- Full access to all settings
- Can manage all users and warehouses
- Can update company information

**Regional Manager:**
- View company information
- View warehouses in their region
- Limited user management

**Warehouse Manager:**
- View company information
- View/edit their assigned warehouse only
- No user management access

**Other Roles:**
- Read-only access to company information
- No access to user/warehouse management

## Testing Checklist
- ✅ All tabs accessible and functional
- ✅ Add/Edit/Delete operations work correctly
- ✅ Form validation prevents invalid submissions
- ✅ Toast notifications appear for all actions
- ✅ Logo upload with preview works
- ✅ Cancel buttons properly discard changes
- ✅ All required fields are marked and validated
- ✅ Navigation from sidebar works
- ✅ Responsive design on all screen sizes
- ✅ No console errors

## Future Enhancements
1. **Backend Integration**: Connect to real API endpoints
2. **Role Permissions**: Implement granular access control
3. **Audit Logging**: Track all changes to settings
4. **Image Management**: Cloud storage for company logo
5. **Email Notifications**: Send emails on user creation/modification
6. **Password Management**: Add password reset functionality
7. **Two-Factor Authentication**: Add 2FA settings
8. **API Key Management**: Manage third-party integrations
9. **Backup/Restore**: Settings backup and restore functionality
10. **Activity History**: Show recent changes and who made them

## Conclusion
The Settings module is now fully operational and seamlessly integrated with the existing LOVOL DMS system, providing a professional and user-friendly interface for managing critical system configurations.
