import { Input } from "@/components/ui/input";

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
}

export const ProductRow = ({ product, onUpdateStock, refillAmount, isFirst, onEnter, index }: ProductRowProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <tr className="even:bg-[#1B7867]/[0.02]">
      <td className="px-4 py-4 sm:px-6 sm:py-4">
        <span className="text-sm text-[#282E3A]/90 font-medium">{product.name}</span>
      </td>
      <td className="px-3 py-4 sm:px-5 sm:py-4 text-center">
        <span className="font-mono text-sm text-[#282E3A]/80 tabular-nums">{product.targetStock}</span>
      </td>
      <td className="px-3 py-4 sm:px-5 sm:py-4">
        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            value={product.currentStock}
            onChange={(e) => onUpdateStock(Math.max(0, parseInt(e.target.value) || 0))}
            onKeyDown={handleKeyDown}
            data-index={index}
            className="w-16 text-center text-sm h-9 border-[#1B7867]/20 focus:border-[#1B7867] focus:ring-[#1B7867]/20"
            autoFocus={isFirst}
          />
        </div>
      </td>
      <td className="px-3 py-4 sm:px-5 sm:py-4 text-center">
        <span className="font-mono text-base font-semibold text-[#1B7867] tabular-nums">{refillAmount}</span>
      </td>
    </tr>
  );
};
