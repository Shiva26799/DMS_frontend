# 🔧 Development Setup Checklist

Use this checklist to ensure your LOVOL DMS system is ready to run locally.

## ✅ Pre-Installation Checklist

### 1. System Requirements

- [ ] Node.js v18.0.0 or higher installed
  ```bash
  node --version
  # Should show: v18.x.x or higher
  ```

- [ ] pnpm package manager installed
  ```bash
  pnpm --version
  # Should show: 8.x.x or higher
  # If not installed: npm install -g pnpm
  ```

### 2. File Structure Verification

Verify all critical files exist:

- [ ] `/index.html` - HTML entry point
- [ ] `/src/main.tsx` - React entry point
- [ ] `/src/app/App.tsx` - Root component
- [ ] `/src/app/routes.tsx` - Route configuration
- [ ] `/package.json` - Dependencies list
- [ ] `/vite.config.ts` - Vite configuration

### 3. Core Components

- [ ] `/src/app/components/Layout.tsx`
- [ ] `/src/app/components/Sidebar.tsx`
- [ ] `/src/app/components/Header.tsx`
- [ ] `/src/app/components/KPICard.tsx`
- [ ] `/src/app/components/StatusBadge.tsx`

### 4. Page Components

- [ ] ExecutiveDashboard.tsx
- [ ] LeadManagement.tsx & LeadDetail.tsx
- [ ] DealerManagement.tsx & DealerDetail.tsx
- [ ] ProductCatalogue.tsx & ProductDetail.tsx
- [ ] InventoryManagement.tsx
- [ ] OrderManagement.tsx & OrderDetail.tsx
- [ ] WarrantyManagement.tsx & WarrantyDetail.tsx
- [ ] MaintenanceManagement.tsx
- [ ] Reports.tsx

### 5. Data Files

- [ ] `/src/app/data/mockData.ts` - Contains all mock data and TypeScript interfaces

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
pnpm install
```

**Expected Output:**
```
Progress: resolved XXX, reused XXX, downloaded XX, added XXX
Done in XXs
```

**If you see errors:**
- Try: `pnpm store prune` then `pnpm install` again
- Or delete `node_modules` and `pnpm-lock.yaml`, then reinstall

### Step 2: Verify Installation

Check that `node_modules` folder was created:
```bash
ls node_modules
# Should show many folders (react, vite, etc.)
```

### Step 3: Start Development Server

```bash
pnpm run dev
```

**Expected Output:**
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 4: Open Browser

Navigate to: `http://localhost:5173`

**Expected Result:** 
✅ LOVOL DMS Executive Dashboard loads with:
- Left sidebar with navigation
- Top header with search and notifications
- 6 KPI cards
- Charts and data tables

---

## 🐛 Troubleshooting Guide

### Issue 1: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

Then retry: `pnpm install`

---

### Issue 2: "Port 5173 is already in use"

**Solution A:** Let Vite use the next available port (it does this automatically)

**Solution B:** Specify a different port:
```bash
pnpm run dev -- --port 3000
```

---

### Issue 3: Blank page or white screen

**Check 1:** Browser console (Press F12)
- Look for errors in the Console tab
- Common error: "Failed to fetch module"

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Clear browser cache
3. Restart dev server: `pnpm run dev`
4. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Check 2:** Terminal output
- Look for compilation errors
- Fix any TypeScript or import errors

---

### Issue 4: "Cannot find module" errors

**Possible causes:**
1. Dependencies not installed correctly
2. Import paths are incorrect
3. File doesn't exist

**Solution:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Restart dev server
pnpm run dev
```

---

### Issue 5: TypeScript errors

**Common TypeScript errors and fixes:**

**Error:** `Cannot find module './components/XYZ'`
**Fix:** Check the import path matches the actual file location

**Error:** `Type 'X' is not assignable to type 'Y'`
**Fix:** Check the type definitions in `/src/app/data/mockData.ts`

**Quick bypass for development:**
Add `// @ts-ignore` above the problematic line (temporary solution only)

---

### Issue 6: Styles not loading properly

**Check:**
1. Is `/src/styles/index.css` being imported in `main.tsx`?
2. Are Tailwind classes working?

**Solution:**
```bash
# Restart dev server
# Tailwind v4 auto-detects changes, but restart helps
pnpm run dev
```

---

### Issue 7: "React is not defined"

**Solution:**
React 18+ doesn't require explicit import. But if you see this error:

```tsx
// Add at top of file if needed
import React from 'react';
```

---

### Issue 8: Routes not working (404 errors)

**Check:**
1. Is React Router configured in `/src/app/routes.tsx`?
2. Is `RouterProvider` in `/src/app/App.tsx`?

**Test navigation:**
- Click sidebar links
- URLs should change
- Pages should load

---

### Issue 9: Charts not displaying

**Check:**
1. Recharts library is installed
2. Data is being passed to charts
3. Browser console for errors

**Quick test:**
```typescript
// In ExecutiveDashboard.tsx
console.log('Sales Data:', salesData);
```

---

### Issue 10: Slow performance or lag

**Possible causes:**
1. Too many console.log statements
2. Browser extensions interfering
3. Large data sets

**Solutions:**
- Remove console.log statements
- Disable browser extensions temporarily
- Use production build for better performance:
  ```bash
  pnpm run build
  pnpm run preview
  ```

---

## 📊 Verification Tests

### Test 1: Navigation
- [ ] Click each sidebar item
- [ ] All pages load without errors
- [ ] URLs update correctly

### Test 2: Data Display
- [ ] Dashboard shows KPI cards
- [ ] Tables display data
- [ ] Charts render properly

### Test 3: Filtering & Search
- [ ] Lead Management filters work
- [ ] Order Management search works
- [ ] Filters update the displayed data

### Test 4: Detail Pages
- [ ] Click an order → Order detail page opens
- [ ] Click a lead → Lead detail page opens
- [ ] Click a dealer → Dealer detail page opens

### Test 5: Responsive Design
- [ ] Resize browser window
- [ ] Layout adjusts properly
- [ ] Sidebar remains functional

---

## 🔍 Build Verification

### Test Production Build

```bash
# Create production build
pnpm run build

# Should complete without errors
# Output: dist/ folder created

# Preview production build
pnpm run preview

# Open: http://localhost:4173
```

**Expected:** Production build runs faster and smoother than dev mode

---

## 📝 Common Development Tasks

### Modify Mock Data
1. Open `/src/app/data/mockData.ts`
2. Edit the data arrays (mockLeads, mockOrders, etc.)
3. Save file
4. Hot reload updates automatically

### Add a New Page
1. Create component in `/src/app/pages/NewPage.tsx`
2. Add route in `/src/app/routes.tsx`
3. Add link in `/src/app/components/Sidebar.tsx`
4. Test navigation

### Change Colors/Styles
1. Edit `/src/styles/theme.css` for theme colors
2. Modify Tailwind classes in components
3. Use consistent color system (blue, green, orange, red)

---

## 🎯 Ready to Deploy?

### Pre-deployment Checklist
- [ ] All pages load without errors
- [ ] No console errors in browser
- [ ] Production build completes successfully
- [ ] All features work in preview mode
- [ ] Mock data is appropriate for demo
- [ ] README and documentation are updated

---

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the full README.md** for detailed documentation
2. **Review the code** in `/src/app/pages/` for examples
3. **Check browser console** for detailed error messages
4. **Search error messages** online for common solutions

---

## ✨ Success Indicators

You know everything is working when:

✅ Dev server starts without errors
✅ Browser shows the dashboard with data
✅ Navigation works smoothly
✅ All 8 modules are accessible
✅ Detail pages open correctly
✅ Filters and search work
✅ Charts and tables display data
✅ No errors in browser console

**If all above are ✅, you're ready to develop! 🚀**

---

**Last Updated:** February 27, 2026
**System Version:** 0.0.1
