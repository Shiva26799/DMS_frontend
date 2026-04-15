# 🚀 Quick Start Guide - LOVOL DMS

Get the LOVOL Distribution Management System running locally in 3 simple steps!

## Prerequisites Check

Make sure you have these installed:

```bash
# Check Node.js version (need v18+)
node --version

# Check if pnpm is installed
pnpm --version
```

If you don't have pnpm:
```bash
npm install -g pnpm
```

## Step 1: Install Dependencies

Open your terminal in the project folder and run:

```bash
pnpm install
```

⏱️ This will take 1-2 minutes to download all packages.

## Step 2: Start Development Server

```bash
pnpm run dev
```

You should see output like:
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:5173
```

🎉 **You should now see the LOVOL DMS Executive Dashboard!**

## What You'll See

The application includes:

### 📊 Executive Dashboard (Home)
- KPI cards showing key metrics
- Sales trend charts
- Inventory status
- Recent orders
- Low stock alerts

### 🔍 Navigation

Use the left sidebar to explore:
- **Lead Management** - View and manage customer leads
- **Dealer Management** - Manage dealer network
- **Products & Inventory** - Product catalog and stock levels
- **Order Management** - Track orders through 9-stage workflow
- **Warranty Management** - Handle warranty claims
- **Maintenance** - Schedule preventive maintenance
- **Reports** - View analytics and reports

### 🎨 Features to Try

1. **Click on any order** in the dashboard to see order details
2. **Switch between Table and Kanban** views in Lead Management
3. **Filter and search** data in any module
4. **Check dealer credit limits** in Dealer Management
5. **View inventory** across multiple locations
6. **Track warranty claims** with status progression

## Troubleshooting

### Port 5173 is busy?

Vite will automatically use the next available port. Check the terminal output for the actual URL.

Or specify a custom port:
```bash
pnpm run dev -- --port 3000
```

### Dependencies won't install?

Clear cache and try again:
```bash
pnpm store prune
pnpm install
```

### Page is blank or showing errors?

1. Make sure the dev server is still running
2. Check the browser console for errors (F12)
3. Try refreshing the page (Ctrl+R or Cmd+R)

## Default Data

The system comes with **mock data** including:
- ✅ 5 sample leads
- ✅ 5 dealers across regions
- ✅ 5 products (3 harvesters + 2 spare parts)
- ✅ 5 orders at different stages
- ✅ 5 warranty claims
- ✅ Multiple maintenance records

## Common Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Clean install (if having issues)
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## File Structure Overview

```
lovol-dms/
├── src/
│   ├── app/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components (modules)
│   │   ├── data/         # Mock data
│   │   └── routes.tsx    # Navigation routes
│   └── styles/          # CSS files
├── index.html           # Entry HTML
├── package.json         # Dependencies
└── README.md           # Full documentation
```

## Next Steps

1. ✅ Explore all 8 modules via the sidebar
2. ✅ Check out the detail pages (click on items in tables)
3. ✅ Try filtering and searching in different modules
4. ✅ Review the mock data in `/src/app/data/mockData.ts`
5. ✅ Read the full README.md for customization options

## Need Help?

- 📖 Check the main **README.md** for detailed documentation
- 🔧 Review the code in `/src/app/pages/` to understand each module
- 💡 Modify mock data in `/src/app/data/mockData.ts` to test with your data

---

**Happy coding! 🚀**

The LOVOL DMS system is now ready for development and customization.
