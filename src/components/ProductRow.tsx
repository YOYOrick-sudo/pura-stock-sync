import { Input } from "@/components/ui/input";

interface ProductRowProps {
  name: string;
  ironStock: number;
  currentStock: number;
  onStockChange: (value: number) => void;
}

const ProductRow = ({ name, ironStock, currentStock, onStockChange }: ProductRowProps) => {
  const toRefill = Math.max(ironStock - currentStock, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-center py-4 md:py-3 border-b border-border/20 last:border-0">
      {/* Product Name */}
      <div className="font-medium text-foreground text-base md:text-sm">{name}</div>
      
      {/* Iron Stock */}
      <div className="flex justify-between md:justify-center items-center">
        <span className="text-xs text-muted-foreground md:hidden">IJzer voorraad:</span>
        <span className="font-mono text-foreground">{ironStock}</span>
      </div>
      
      {/* Current Stock Input */}
      <div className="flex justify-between md:justify-center items-center">
        <span className="text-xs text-muted-foreground md:hidden">Huidige voorraad:</span>
        <div className="w-20">
          <Input
            type="number"
            min="0"
            value={currentStock}
            onChange={(e) => onStockChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-center font-mono h-9"
          />
        </div>
      </div>
      
      {/* To Refill */}
      <div className="flex justify-between md:justify-center items-center">
        <span className="text-xs text-muted-foreground md:hidden">Aan te vullen:</span>
        <span className="font-mono font-semibold text-secondary text-lg md:text-base">{toRefill}</span>
      </div>
    </div>
  );
};

export default ProductRow;
