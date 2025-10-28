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
    <tr className="even:bg-[#F5F7DD]/20">
      <td className="px-6 py-5">
        <span className="text-base text-[#282E3A] font-normal">{product.name}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-mono text-base text-[#282E3A]/80 tabular-nums">{product.targetStock}</span>
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            value={product.currentStock}
            onChange={(e) => onUpdateStock(Math.max(0, parseInt(e.target.value) || 0))}
            onKeyDown={handleKeyDown}
            data-index={index}
            className="w-32 text-center text-base h-12 border-[#1B7867]/20 focus:border-[#1B7867] focus:ring-[#1B7867]/20 rounded-xl bg-white"
            autoFocus={isFirst}
          />
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center min-w-[60px] h-10 px-4 rounded-xl bg-[#1B7867]/10 font-mono text-lg font-bold text-[#1B7867] tabular-nums">
            {refillAmount}
          </span>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 ml-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
