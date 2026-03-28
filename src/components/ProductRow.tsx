import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Product {
  name: string;
  targetStock: number;
  currentStock: number;
}

interface ProductRowProps {
  product: Product;
  onUpdateStock: (value: number) => void;
  refillAmount: number;
  isFirst: boolean;
  onEnter: () => void;
  index: number;
  onRemove?: () => void;
}

export const ProductRow = ({ product, onUpdateStock, refillAmount, isFirst, onEnter, index, onRemove }: ProductRowProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <tr className="even:bg-muted/15 hover:bg-muted/30 transition-colors border-b border-foreground/5">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-sm sm:text-base text-foreground font-normal">{product.name}</span>
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-center">
        <span className="font-mono text-sm sm:text-base text-foreground/80 tabular-nums">{product.targetStock}</span>
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            value={product.currentStock}
            onChange={(e) => onUpdateStock(Math.max(0, parseInt(e.target.value) || 0))}
            onKeyDown={handleKeyDown}
            data-index={index}
            className="w-20 sm:w-24 text-center text-sm sm:text-base h-9 sm:h-10 px-3 border border-primary/20 focus:border-primary focus:ring-primary/20 rounded-lg bg-muted/40"
            autoFocus={isFirst}
          />
        </div>
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-center">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <span className="inline-flex items-center justify-center min-w-[48px] sm:min-w-[56px] h-8 sm:h-9 px-3 rounded-lg bg-primary/10 font-mono text-base sm:text-lg font-bold text-primary tabular-nums">
            {refillAmount}
          </span>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
