import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PartySizeStepProps {
  selectedSize: number | null;
  onSelectSize: (size: number) => void;
  onBack: () => void;
}

const PartySizeStep = ({ selectedSize, onSelectSize, onBack }: PartySizeStepProps) => {
  const sizes = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-bold font-heading text-center mb-2">
        Party Size
      </h2>
      <p className="text-center text-muted-foreground mb-8">
        How many people will be joining?
      </p>

      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-8">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelectSize(size)}
            className={cn(
              "aspect-square rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5",
              selectedSize === size
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            )}
          >
            <Users className="h-6 w-6" />
            <span className="font-bold">{size}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default PartySizeStep;
