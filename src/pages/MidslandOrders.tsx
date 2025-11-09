import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Package, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface InternalOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

interface InternalOrder {
  id: string;
  order_number: string;
  status: string;
  from_location: string;
  to_location: string;
  delivery_date: string;
  created_at: string;
  notes: string | null;
  internal_order_items: InternalOrderItem[];
}

const statusColors = {
  pending: 'bg-orange-100 text-orange-800 border-orange-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  delivered: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusLabels = {
  pending: 'In afwachting',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
  delivered: 'Geleverd',
};

export default function MidslandOrders() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['midsland-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_orders')
        .select(`
          *,
          internal_order_items(*)
        `)
        .eq('from_location', 'West')
        .eq('to_location', 'Midsland')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InternalOrder[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('midsland-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_orders',
          filter: 'to_location=eq.Midsland'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['midsland-orders'] });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-6 pt-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-[#1B7867]" />
          <h1 className="text-3xl font-bold text-foreground">
            Bestellingen van West
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B7867] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Bestellingen laden...</p>
            </div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nog geen bestellingen</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusColor = statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
              const statusLabel = statusLabels[order.status as keyof typeof statusLabels] || order.status;

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden border-l-4 border-l-[#1B7867] transition-all duration-200 hover:shadow-md"
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {order.order_number}
                          </h3>
                          <Badge
                            className={statusColor}
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Aangemaakt: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Package className="h-4 w-4" />
                            <span>
                              Leverdatum: {format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {order.internal_order_items?.length || 0} product
                            {(order.internal_order_items?.length || 0) !== 1 ? 'en' : ''}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[#1B7867]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50/50 p-6 space-y-4">
                      {/* Order Notes */}
                      {order.notes && (
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-[#1B7867] mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground mb-1">Opmerkingen</p>
                              <p className="text-sm text-muted-foreground">{order.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Product List */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#1B7867]" />
                          Producten
                        </h4>
                        <div className="bg-white rounded-lg border divide-y">
                          {order.internal_order_items && order.internal_order_items.length > 0 ? (
                            order.internal_order_items.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-sm font-medium text-foreground">
                                  {item.product_name}
                                </span>
                                <span className="text-sm text-muted-foreground font-medium">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Geen producten gevonden
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
