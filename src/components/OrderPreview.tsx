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
        borderRadius: '24px',
        border: '1px solid #D5D8E0',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#1A1F28]" style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>Bestelvoorbeeld</DialogTitle>
          <DialogDescription className="text-[#636878]">
            Controleer je bestelling voordat je verstuurt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Info */}
          <div style={{ backgroundColor: '#F8F9FA', borderRadius: '14px', padding: '16px' }} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#636878]">Locatie:</span>
              <span className="font-semibold text-[#303542]">{orderData.locatie}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#636878]">Datum:</span>
              <span className="font-semibold text-[#303542]">
                {new Date(orderData.datum).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Products Table */}
          <div style={{ border: '1px solid #D5D8E0', borderRadius: '20px', overflow: 'hidden' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#F8F9FA' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #D5D8E0' }}>
                    Product
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #D5D8E0' }}>
                    Voorraad
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData.producten.map((product, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #EAECF0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#303542' }}>{product.naam}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'center', fontFamily: "'Geist Mono', monospace", fontWeight: 500, color: '#282E3A' }}>
                      {product.voorraad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div style={{ backgroundColor: 'rgba(226,119,38,0.06)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(226,119,38,0.15)' }}>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#303542' }}>Totaal producten</span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#E27726', fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.03em' }}>{totalProducts}</span>
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
