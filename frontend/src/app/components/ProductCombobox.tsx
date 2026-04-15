import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronsUpDown, Loader2, X, Search } from "lucide-react"
import InfiniteScroll from "react-infinite-scroll-component"
import { cn } from "../components/ui/utils"
import { Badge } from "../components/ui/badge"
import { apiClient } from "../api/client"
import { useDebounce } from "../hooks/useDebounce"

interface Product {
  id: string;
  _id?: string;
  name: string;
  sku?: string;
  partNumber?: string;
  category?: string;
  price: number;
}

interface ProductComboboxProps {
  onSelect: (selected: Product | Product[] | null) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  warehouseId?: string;
  ownerType?: "Warehouse" | "Dealer" | "Own Stock";
  dealerId?: string;
  disabled?: boolean;
}

export function ProductCombobox({ 
  onSelect, 
  multiple = false,
  placeholder = "Select product...", 
  className,
  warehouseId,
  ownerType,
  dealerId,
  disabled = false
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([])
  const [singleValue, setSingleValue] = React.useState<Product | null>(null)
  const [search, setSearch] = React.useState("")
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0, maxHeight: 300 })
  const debouncedSearch = useDebounce(search, 300)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Fetch when search changes or opened
  React.useEffect(() => {
    if (open && !disabled) {
      setPage(1)
      setProducts([])
      setHasMore(true)
      fetchProducts(1, debouncedSearch, true)
    }
  }, [debouncedSearch, open, disabled])

  // Position tracking
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 20 // 20px padding from screen edge
      const maxHeight = Math.max(160, Math.min(300, spaceBelow)) // Min 160px, Max 300px
      
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight
      })
    }
  }

  React.useEffect(() => {
    if (open) {
      updateCoords()
      window.addEventListener("scroll", updateCoords, true)
      window.addEventListener("resize", updateCoords)
    }
    return () => {
       window.removeEventListener("scroll", updateCoords, true)
       window.removeEventListener("resize", updateCoords)
    }
  }, [open])

  // Outside click to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        const portalContent = document.getElementById("product-dropdown-portal")
        if (portalContent && portalContent.contains(target)) return
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchProducts = async (pageNum: number, searchStr: string, isNewSearch: boolean) => {
    if ((isLoading && !isNewSearch) || disabled) return
    
    // Safety check: if fulfillment is Warehouse, must have warehouseId
    if (ownerType === "Warehouse" && !warehouseId) {
      setProducts([]);
      setTotalProducts(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true)
    try {
      let endpoint = `products?search=${searchStr}&page=${pageNum}&limit=20&_t=${Date.now()}`;
      
      // If warehouse or own stock is specified, use inventory endpoints
      if (ownerType === "Warehouse" && warehouseId) {
        endpoint = `inventory/warehouse?warehouseId=${warehouseId}&search=${searchStr}&page=${pageNum}&limit=20`;
      } else if (ownerType === "Dealer" || ownerType === "Own Stock") {
        const dId = dealerId || "";
        endpoint = `inventory/own?dealerId=${dId}&search=${searchStr}&page=${pageNum}&limit=20`;
      }

      const res = await apiClient.get(endpoint)
      
      let mappedProducts: Product[] = [];
      const responseData = res.data;
      
      // Handle different response formats (Array for Inventory, Object for Products)
      if (Array.isArray(responseData)) {
        // Simple array structure (Inventory)
        mappedProducts = responseData.map((item: any) => ({
          ...(item.productId || {}),
          id: item.productId?._id || item.productId?.id,
          stock: item.quantity
        })).filter(p => !!p.id);
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // Paginated object structure (Inventory or Products)
        mappedProducts = responseData.data.map((item: any) => {
          const product = item.productId || item.product || item;
          return {
            ...product,
            id: product._id || product.id,
            stock: item.quantity
          };
        }).filter((p: any) => !!p.id);
      } else if (responseData?.products && Array.isArray(responseData.products)) {
        // Standard products structure
        mappedProducts = responseData.products.map((p: any) => ({
          ...p,
          id: p._id || p.id,
        })).filter((p: any) => !!p.id);
      }
      
      setProducts(prev => isNewSearch ? mappedProducts : [...prev, ...mappedProducts])
      
      // Pagination handling
      let totalPages = 1;
      let total = 0;
      
      if (responseData?.pagination) {
        totalPages = responseData.pagination.pages || responseData.pagination.totalPages || 1;
        total = responseData.pagination.total || 0;
      } else if (responseData?.totalPages) {
        totalPages = responseData.totalPages;
        total = responseData.total || 0;
      } else if (Array.isArray(responseData)) {
        totalPages = 1;
        total = responseData.length;
      }
      
      setTotalProducts(total);
      setHasMore(pageNum < totalPages)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchProducts(nextPage, debouncedSearch, false)
    }
  }

  const handleSelect = (product: Product) => {
    if (multiple) {
      const isSelected = selectedProducts.some(p => p.id === product.id)
      const newSelection = isSelected 
        ? selectedProducts.filter(p => p.id !== product.id)
        : [...selectedProducts, product]
      
      setSelectedProducts(newSelection)
      onSelect(newSelection)
      setSearch("") 
      inputRef.current?.focus()
    } else {
      setSingleValue(product)
      onSelect(product)
      setSearch(product.name)
      setOpen(false)
    }
  }

  const removeTag = (e: React.MouseEvent, productId: string) => {
    console.log(`[DEBUG] removeTag called for product: ${productId}`)
    e.preventDefault()
    e.stopPropagation()
    const newSelection = selectedProducts.filter(p => p.id !== productId)
    setSelectedProducts(newSelection)
    onSelect(newSelection)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const dropdownList = open && (
    <div 
      id="product-dropdown-portal"
      className="fixed bg-white border shadow-2xl rounded-md overflow-hidden z-[10000] pointer-events-auto flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ 
        top: coords.top, 
        left: coords.left, 
        width: coords.width,
        maxHeight: `${coords.maxHeight}px`
      }}
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b text-[10px] font-medium text-gray-500 uppercase tracking-wider">
        <span>Products Found: {totalProducts}</span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
      </div>
      <div id="scrollableDiv" className="flex flex-col w-full overflow-auto overscroll-contain" style={{ height: coords.maxHeight }}>
        <InfiniteScroll
          dataLength={products.length}
          next={handleNext}
          hasMore={hasMore}
          loader={
            <div className="py-4 flex flex-col items-center justify-center text-xs text-blue-600 font-medium gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more products...
            </div>
          }
          scrollableTarget="scrollableDiv"
          scrollThreshold={0.9}
        >
          {products.length === 0 && !isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No products found.
            </div>
          ) : (
            <div className="py-1">
              {products.map((product) => {
                const isSelected = multiple 
                  ? selectedProducts.some(p => p.id === product.id)
                  : singleValue?.id === product.id

                return (
                  <div
                    key={product.id}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center px-4 py-3 text-sm outline-none hover:bg-blue-50 hover:text-blue-900 transition-colors border-b border-gray-50 last:border-0",
                      isSelected && "bg-blue-50 text-blue-900 font-medium"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(product)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-blue-600 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col items-start overflow-hidden text-left flex-1">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate font-medium">{product.name}</span>
                        {(product as any).stock !== undefined && (
                          <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200">
                            { (product as any).stock } in stock
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 truncate w-full uppercase tracking-wider">
                        {product.sku || product.partNumber || "No SKU"}
                        {product.category ? ` • ${product.category}` : ""}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </InfiniteScroll>
      </div>
    </div>
  )

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className={cn(
          "flex min-h-[44px] w-full items-center gap-2 rounded-md border border-input bg-white p-2 text-sm ring-offset-background transition-all shadow-sm",
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
          open && !disabled && "ring-2 ring-blue-500 border-blue-500 shadow-md"
        )}
        onClick={() => {
          if (disabled) return
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {multiple && selectedProducts.map(p => (
            <Badge 
              key={p.id} 
              variant="secondary" 
              className="py-1 px-2.5 flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors animate-in fade-in zoom-in-95 duration-200"
            >
              {p.name}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-blue-200 transition-colors p-0.5"
                onClick={(e) => removeTag(e, p.id)}
              >
                <X className="h-3 w-3 text-blue-600" />
                <span className="sr-only">Remove {p.name}</span>
              </button>
            </Badge>
          ))}
          
          <div className="relative flex-1 min-w-[120px]">
            {!multiple && !singleValue && <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />}
            
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-400 h-7"
              placeholder={multiple ? (selectedProducts.length === 0 ? placeholder : "") : (singleValue ? "" : placeholder)}
              value={search}
              onChange={(e) => {
                if (disabled) return
                setSearch(e.target.value)
                setOpen(true)
              }}
              onFocus={() => !disabled && setOpen(true)}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && search === "" && multiple && selectedProducts.length > 0) {
                  const last = selectedProducts[selectedProducts.length - 1]
                  removeTag(e as any, last.id)
                }
              }}
            />
            {!multiple && singleValue && !search && (
               <div className="absolute inset-0 pointer-events-none flex items-center">
                  <span className="text-gray-900">{singleValue.name}</span>
               </div>
            )}
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40 hover:opacity-100 transition-opacity" />
      </div>

      {open && createPortal(dropdownList, document.body)}
    </div>
  )
}
