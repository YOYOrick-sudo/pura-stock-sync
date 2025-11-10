import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package, Loader2, ChevronDown } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useSentOrders, useReceivedOrders } from '@/hooks/useInternalOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import OrderDashboard from '@/components/OrderDashboard';

export default function InternalOrders() {
  const { userLocation, loading } = useUserLocation();
  const { data: sentOrders = [], isLoading: loadingSent } = useSentOrders(userLocation);
  const { data: receivedOrders = [], isLoading: loadingReceived } = useReceivedOrders(userLocation);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
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
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Interne bestellingen</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        {loading ? (
          <Card className="p-6 bg-white shadow-sm">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Gebruikersgegevens laden...</p>
            </div>
          </Card>
        ) : (
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
              <OrderDashboard />
            </TabsContent>

            {/* Sent Orders Tab */}
            <TabsContent value="sent" className="space-y-4">
              {loadingSent ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : sentOrders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Geen verzonden bestellingen"
                  description="Maak een nieuwe bestelling om te beginnen"
                />
              ) : (
                sentOrders.map((order) => (
                  <Collapsible key={order.id} open={expandedOrders.has(order.id)} onOpenChange={() => toggleOrder(order.id)}>
                    <Card className={cn(
                      "bg-white shadow-sm border-l-4 transition-all hover:shadow-md",
                      getStatusColor(order.status).replace('bg-', 'border-').split(' ')[0]
                    )}>
                      <CollapsibleTrigger className="w-full text-left p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-mono font-bold text-sm text-foreground">{order.order_number}</h3>
                              <Badge className={cn("text-xs", getStatusColor(order.status))}>
                                {order.status === 'approved' ? 'Goedgekeurd' : order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              {order.from_location} <ArrowRight className="h-3 w-3" /> {order.to_location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                📅 {new Date(order.delivery_date).toLocaleDateString('nl-NL')}
                              </p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                {order.internal_order_items?.length || 0} producten
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform ml-2 mt-1 flex-shrink-0",
                            expandedOrders.has(order.id) && "rotate-180"
                          )} />
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        {order.internal_order_items && order.internal_order_items.length > 0 && (
                          <div className="px-3 pb-3 pt-2 border-t">
                            <p className="text-xs font-semibold mb-2 text-foreground">Producten:</p>
                            <div className="space-y-1">
                              {order.internal_order_items.map((item: any) => (
                                <p key={item.id} className="text-xs text-muted-foreground">
                                  • {item.product_name} - {item.quantity} {item.unit}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </TabsContent>

            {/* Received Orders Tab */}
            <TabsContent value="received" className="space-y-4">
              {loadingReceived ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : receivedOrders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Geen ontvangen bestellingen"
                  description="Wacht op bestellingen van andere locaties"
                />
              ) : (
                receivedOrders.map((order) => (
                  <Collapsible key={order.id} open={expandedOrders.has(order.id)} onOpenChange={() => toggleOrder(order.id)}>
                    <Card className={cn(
                      "bg-white shadow-sm border-l-4 transition-all hover:shadow-md",
                      getStatusColor(order.status).replace('bg-', 'border-').split(' ')[0]
                    )}>
                      <CollapsibleTrigger className="w-full text-left p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-mono font-bold text-sm text-foreground">{order.order_number}</h3>
                              <Badge className={cn("text-xs", getStatusColor(order.status))}>
                                {order.status === 'approved' ? 'Goedgekeurd' : order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              {order.from_location} <ArrowRight className="h-3 w-3" /> {order.to_location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                📅 {new Date(order.delivery_date).toLocaleDateString('nl-NL')}
                              </p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                {order.internal_order_items?.length || 0} producten
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform ml-2 mt-1 flex-shrink-0",
                            expandedOrders.has(order.id) && "rotate-180"
                          )} />
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        {order.internal_order_items && order.internal_order_items.length > 0 && (
                          <div className="px-3 pb-2 pt-2 border-t">
                            <p className="text-xs font-semibold mb-2 text-foreground">Producten:</p>
                            <div className="space-y-1">
                              {order.internal_order_items.map((item: any) => (
                                <p key={item.id} className="text-xs text-muted-foreground">
                                  • {item.product_name} - {item.quantity} {item.unit}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.notes && (
                          <div className="px-3 pb-3 pt-2 border-t">
                            <p className="text-xs font-semibold mb-1 text-foreground">📝 Notities:</p>
                            <p className="text-xs text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SidebarLayout>
  );
}
