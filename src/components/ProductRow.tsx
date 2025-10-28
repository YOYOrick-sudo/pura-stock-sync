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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 items-center p-5 bg-card rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 hover:scale-[1.01] border border-border/50">
      <div className="font-heading font-bold text-foreground text-lg md:text-base">{name}</div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1 md:hidden">IJzer voorraad</div>
        <div className="font-mono text-foreground font-semibold text-lg">{ironStock}</div>
      </div>
      <div className="flex justify-center">
        <div className="w-full md:w-24">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1 md:hidden">Huidige voorraad</div>
          <Input
            type="number"
            min="0"
            value={currentStock}
            onChange={(e) => onStockChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-center font-mono text-lg font-semibold focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1 md:hidden">Aan te vullen</div>
        <div className="font-mono font-bold text-secondary text-2xl md:text-xl">{toRefill}</div>
      </div>
    </div>
  );
};

export default ProductRow;
