import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTextColorForBg } from "@/lib/personeel-utils";

const PRESETS = [
  "#4ea24a", "#d9363e", "#e58a1b", "#f4c93c",
  "#6fa8dc", "#e64bb6", "#26a69a", "#b0bec5",
  "#fcd34d", "#86efac", "#93c5fd", "#fca5a5",
];

interface ColorPickerModalProps {
  open: boolean;
  initialColor: string;
  onClose: () => void;
  onSelect: (color: string) => void;
}

export function ColorPickerModal({ open, initialColor, onClose, onSelect }: ColorPickerModalProps) {
  const [color, setColor] = useState(initialColor);
  const textColor = getTextColorForBg(color);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kies een kleur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setColor(p)}
                className={`h-12 rounded-[10px] border-2 transition-all ${color.toLowerCase() === p.toLowerCase() ? "border-foreground scale-105" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: p }}
                aria-label={`Kleur ${p}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="color-hex">Hex-code</Label>
            <Input
              id="color-hex"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="font-mono"
            />
          </div>
          <div
            className="h-16 rounded-[14px] flex items-center justify-center font-medium"
            style={{ backgroundColor: color, color: textColor }}
          >
            Voorbeeld
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => { onSelect(color); onClose(); }}>Kies kleur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
