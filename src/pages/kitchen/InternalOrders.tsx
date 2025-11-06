import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Package, X } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit: string;
}

export default function InternalOrders() {
  useInactivityTimeout();
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({ product_name: '', quantity: 1, unit: 'stuks' });

  // TODO: Replace with actual data from useInternalOrders hook
  const sentOrders: any[] = [];
  const receivedOrders: any[] = [];

  const addOrderItem = () => {
    if (!newItem.product_name || newItem.quantity <= 0) return;
    setOrderItems([...orderItems, newItem]);
    setNewItem({ product_name: '', quantity: 1, unit: 'stuks' });
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-600';
      case 'in_transit':
        return 'bg-purple-100 text-purple-600';
      case 'approved':
        return 'bg-blue-100 text-blue-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-yellow-100 text-yellow-600';
    }
  };

  return (
    <KitchenLayout title="Interne bestellingen" subtitle="Bestel tussen locaties">
      <Tabs defaultValue="new" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white">
          <TabsTrigger value="new">Nieuwe bestelling</TabsTrigger>
          <TabsTrigger value="sent">
            Verzonden ({sentOrders.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Ontvangen ({receivedOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* New Order Tab */}
        <TabsContent value="new" className="space-y-6">
          <Card className="p-6 bg-white shadow-sm">
            <h3 className="font-heading font-bold text-lg mb-4 text-foreground">Nieuwe bestelling maken</h3>
            
            <div className="space-y-4">
              {/* Location Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Van locatie</Label>
                  <Input value="West" disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Naar locatie</Label>
                  <Select defaultValue="Midsland">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Midsland">Midsland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <Label>Gewenste leverdatum</Label>
                <Input type="date" />
              </div>

              {/* Product Items */}
              <div>
                <Label className="mb-2 block">Producten</Label>
                {orderItems.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                        <span className="flex-1 text-sm">{item.product_name}</span>
                        <span className="text-sm text-muted-foreground">{item.quantity} {item.unit}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder="Product naam"
                    value={newItem.product_name}
                    onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                    className="col-span-6"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                  <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stuks">stuks</SelectItem>
                      <SelectItem value="bakken">bakken</SelectItem>
                      <SelectItem value="porties">porties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOrderItem}
                  className="mt-2 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Product toevoegen
                </Button>
              </div>

              {/* Submit */}
              <Button className="w-full bg-primary hover:bg-primary-hover">
                <ArrowRight className="h-4 w-4 mr-2" />
                Verstuur bestelling
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Sent Orders Tab */}
        <TabsContent value="sent" className="space-y-4">
          {sentOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Geen verzonden bestellingen"
              description="Maak een nieuwe bestelling om te beginnen"
            />
          ) : (
            sentOrders.map((order) => (
              <Card key={order.id} className={`p-4 bg-white shadow-sm border-l-4 ${getStatusColor(order.status).replace('bg-', 'border-').split(' ')[0]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-mono font-bold text-foreground">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      {order.from_location} <ArrowRight className="h-3 w-3" /> {order.to_location}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leverdatum: {new Date(order.delivery_date).toLocaleDateString('nl-NL')}
                </p>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Received Orders Tab */}
        <TabsContent value="received" className="space-y-4">
          {receivedOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Geen ontvangen bestellingen"
              description="Wacht op bestellingen van andere locaties"
            />
          ) : (
            receivedOrders.map((order) => (
              <Card key={order.id} className={`p-4 bg-white shadow-sm border-l-4 ${getStatusColor(order.status).replace('bg-', 'border-').split(' ')[0]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-mono font-bold text-foreground">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      {order.from_location} <ArrowRight className="h-3 w-3" /> {order.to_location}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                {order.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary-hover">
                      Goedkeuren
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Afwijzen
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </KitchenLayout>
  );
}
