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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#282E3A]">Bestelvoorbeeld</DialogTitle>
          <DialogDescription className="text-[#282E3A]/60">
            Controleer je bestelling voordat je verstuurt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Info */}
          <div className="bg-[#F5F7DD] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#282E3A]/60">Locatie:</span>
              <span className="font-semibold text-[#282E3A]">{orderData.locatie}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#282E3A]/60">Datum:</span>
              <span className="font-semibold text-[#282E3A]">
                {new Date(orderData.datum).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Products Table */}
          <div className="border border-[#1B7867]/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1B7867]/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#282E3A]/80 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#282E3A]/80 uppercase tracking-wider">
                    Voorraad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B7867]/5">
                {orderData.producten.map((product, index) => (
                  <tr key={index} className="even:bg-[#1B7867]/[0.02]">
                    <td className="px-4 py-3 text-sm text-[#282E3A]/90">{product.naam}</td>
                    <td className="px-4 py-3 text-sm text-center font-mono text-[#282E3A]/80">
                      {product.voorraad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-[#1B7867]/5 to-[#1B7867]/10 rounded-lg p-4 border-2 border-[#1B7867]/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#282E3A]">Totaal producten</span>
              <span className="text-3xl font-bold text-[#1B7867]">{totalProducts}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 border-2 border-[#1B7867] text-[#1B7867] hover:bg-[#1B7867]/5"
            >
              <Printer className="mr-2 h-4 w-4" />
              Printen
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-[#1B7867] hover:bg-[#0d5a4c] text-white"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
