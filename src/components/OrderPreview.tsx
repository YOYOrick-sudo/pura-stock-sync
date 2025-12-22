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
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-polar-text-primary">Bestelvoorbeeld</DialogTitle>
          <DialogDescription className="text-polar-text-secondary">
            Controleer je bestelling voordat je verstuurt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Info */}
          <div className="bg-polar-background rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-polar-text-tertiary">Locatie:</span>
              <span className="font-semibold text-polar-text-primary">{orderData.locatie}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-polar-text-tertiary">Datum:</span>
              <span className="font-semibold text-polar-text-primary">
                {new Date(orderData.datum).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Products Table */}
          <div className="border border-polar-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-polar-brand-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-polar-text-secondary uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-polar-text-secondary uppercase tracking-wider">
                    Voorraad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-border">
                {orderData.producten.map((product, index) => (
                  <tr key={index} className="even:bg-polar-background">
                    <td className="px-4 py-3 text-sm text-polar-text-primary">{product.naam}</td>
                    <td className="px-4 py-3 text-sm text-center font-mono text-polar-text-secondary">
                      {product.voorraad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="bg-polar-brand-light rounded-lg p-4 border-2 border-polar-brand/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-polar-text-primary">Totaal producten</span>
              <span className="text-3xl font-bold text-polar-brand">{totalProducts}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" />
              Printen
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
