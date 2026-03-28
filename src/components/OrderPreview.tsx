import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface OrderData {
  locatie: string;
  datum: string;
  producten: Array<{
    naam: string;
    voorraad: number;
  }>;
}

interface OrderPreviewProps {
  open: boolean;
  onClose: () => void;
  orderData: OrderData;
}

export const OrderPreview = ({ open, onClose, orderData }: OrderPreviewProps) => {
  const handlePrint = () => {
    window.print();
  };

  const totalProducts = orderData.producten.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: 'hsl(var(--card))',
        borderRadius: '20px',
        border: '1px solid rgba(197, 197, 202, 0.5)',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Bestelvoorbeeld</DialogTitle>
          <DialogDescription className="text-foreground/60">
            Controleer je bestelling voordat je verstuurt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Info */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/60">Locatie:</span>
              <span className="font-semibold text-foreground">{orderData.locatie}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/60">Datum:</span>
              <span className="font-semibold text-foreground">
                {new Date(orderData.datum).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Products Table */}
          <div className="border border-primary/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    Voorraad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {orderData.producten.map((product, index) => (
                  <tr key={index} className="even:bg-primary/[0.02]">
                    <td className="px-4 py-3 text-sm text-foreground/90">{product.naam}</td>
                    <td className="px-4 py-3 text-sm text-center font-mono text-foreground/80">
                      {product.voorraad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border-2 border-primary/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Totaal producten</span>
              <span className="text-3xl font-bold text-primary">{totalProducts}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 border-2 border-primary text-primary hover:bg-primary/5"
            >
              <Printer className="mr-2 h-4 w-4" />
              Printen
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary-hover text-white"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
