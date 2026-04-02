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
}

export function ProductCombobox({ 
  onSelect, 
  multiple = false,
  placeholder = "Select product...", 
  className 
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([])
  const [singleValue, setSingleValue] = React.useState<Product | null>(null)
  const [search, setSearch] = React.useState("")
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 })
  const debouncedSearch = useDebounce(search, 300)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Fetch when search changes or opened
  React.useEffect(() => {
    if (open) {
      setPage(1)
      setProducts([])
      setHasMore(true)
      fetchProducts(1, debouncedSearch, true)
    }
  }, [debouncedSearch, open])

  // Position tracking
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
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
    if (isLoading && !isNewSearch) return
    setIsLoading(true)
    try {
      const res = await apiClient.get(`products?search=${searchStr}&page=${pageNum}&limit=20&_t=${Date.now()}`)
      const data = res.data?.products || []
      const mappedProducts = data.map((p: any) => ({
        ...p,
        id: p._id,
      }))
      
      setProducts(prev => isNewSearch ? mappedProducts : [...prev, ...mappedProducts])
      setHasMore(pageNum < (res.data?.totalPages || 0))
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
      className="fixed bg-white border shadow-2xl rounded-md overflow-hidden z-[10000] pointer-events-auto flex flex-col"
      style={{ 
        top: coords.top + 4, 
        left: coords.left, 
        width: coords.width,
        maxHeight: "300px" 
      }}
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div id="scrollableDiv" className="flex flex-col w-full h-[300px] overflow-auto overscroll-contain">
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
                    <div className="flex flex-col items-start overflow-hidden text-left">
                      <span className="truncate w-full font-medium">{product.name}</span>
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
          "flex min-h-[44px] w-full items-center gap-2 rounded-md border border-input bg-white p-2 text-sm ring-offset-background cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm",
          open && "ring-2 ring-blue-500 border-blue-500 shadow-md"
        )}
        onClick={() => {
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
                setSearch(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
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
