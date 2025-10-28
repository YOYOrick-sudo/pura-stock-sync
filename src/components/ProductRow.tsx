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
    <>
      {/* Mobile View */}
      <div className="md:hidden px-4 py-3 border-b border-gray-100 last:border-0 even:bg-muted/5">
        <div className="text-base font-medium text-foreground/90 mb-3">{name}</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs font-bold text-muted-foreground/70 mb-1 uppercase tracking-wide">Ijzer</div>
            <div className="font-mono text-base text-foreground/80 tabular-nums">{ironStock}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-muted-foreground/70 mb-1 uppercase tracking-wide">Huidig</div>
            <Input
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => onStockChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center h-10"
            />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-muted-foreground/70 mb-1 uppercase tracking-wide">Vullen</div>
            <div className="font-mono text-lg font-semibold text-primary tabular-nums">{toRefill}</div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:grid grid-cols-4 gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0 even:bg-muted/5">
        <div className="text-sm font-medium text-foreground/90">{name}</div>
        <div className="text-right">
          <span className="font-mono text-sm text-foreground/80 tabular-nums">{ironStock}</span>
        </div>
        <div className="flex justify-end">
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
        <div className="text-right">
          <span className="font-mono text-base font-medium text-primary tabular-nums">{toRefill}</span>
        </div>
      </div>
    </>
  );
};

export default ProductRow;
