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
    <div className="grid grid-cols-4 gap-4 items-center p-4 bg-card rounded-xl shadow-soft hover:shadow-medium transition-shadow">
      <div className="font-medium text-foreground">{name}</div>
      <div className="text-center text-muted-foreground">{ironStock}</div>
      <div className="flex justify-center">
        <Input
          type="number"
          min="0"
          value={currentStock}
          onChange={(e) => onStockChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 text-center"
        />
      </div>
      <div className="text-center font-semibold text-primary">{toRefill}</div>
    </div>
  );
};

export default ProductRow;
