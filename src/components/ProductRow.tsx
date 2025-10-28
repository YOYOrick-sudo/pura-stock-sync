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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center px-4 py-2 border-b border-border last:border-0 even:bg-muted/10">
      {/* Product Name */}
      <div className="text-sm font-medium text-foreground">{name}</div>
      
      {/* Iron Stock */}
      <div className="flex justify-between md:justify-end items-center">
        <span className="text-xs text-muted-foreground md:hidden">IJzer:</span>
        <span className="font-mono text-sm text-foreground tabular-nums">{ironStock}</span>
      </div>
      
      {/* Current Stock Input */}
      <div className="flex justify-between md:justify-end items-center">
        <span className="text-xs text-muted-foreground md:hidden">Huidig:</span>
        <div className="w-16">
          <Input
            type="number"
            min="0"
            value={currentStock}
            onChange={(e) => onStockChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-right"
          />
        </div>
      </div>
      
      {/* To Refill */}
      <div className="flex justify-between md:justify-end items-center">
        <span className="text-xs text-muted-foreground md:hidden">Vullen:</span>
        <span className="font-mono text-base font-semibold text-primary tabular-nums">{toRefill}</span>
      </div>
    </div>
  );
};

export default ProductRow;
