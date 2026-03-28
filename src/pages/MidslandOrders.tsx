import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Package, Calendar, FileText, Loader2, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';

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
  receiver_notes: string | null;
  received_at: string | null;
  internal_order_items: InternalOrderItem[];
}

const statusLabels = {
  pending: 'In afwachting',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
  delivered: 'Geleverd',
  partially_delivered: 'Deels geleverd',
};

export default function MidslandOrders() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<{ [key: string]: string }>({});
  const [showFeedbackFor, setShowFeedbackFor] = useState<string | null>(null);
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

  // Mutation to update order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      receiverNotes
    }: {
      orderId: string;
      status: string;
      receiverNotes?: string
    }) => {
      const { error } = await supabase
        .from('internal_orders')
        .update({
          status,
          receiver_notes: receiverNotes || null,
          received_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midsland-orders'] });
      toast.success('Bestelling status bijgewerkt');
      setShowFeedbackFor(null);
      setFeedbackText({});
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast.error('Fout bij bijwerken van bestelling');
    },
  });

  const handleFullyReceived = (orderId: string) => {
    updateOrderMutation.mutate({ orderId, status: 'delivered' });
  };

  const handlePartiallyReceived = (orderId: string) => {
    setShowFeedbackFor(orderId);
  };

  const submitPartialDelivery = (orderId: string) => {
    const feedback = feedbackText[orderId]?.trim();
    if (!feedback) {
      toast.error('Voer feedback in voor deels geleverde bestelling');
      return;
    }
    updateOrderMutation.mutate({
      orderId,
      status: 'partially_delivered',
      receiverNotes: feedback
    });
  };

  return (
    <SidebarLayout>
      <div className="bg-muted border border-border rounded-lg p-8 shadow-sm">

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base text-muted-foreground">Nog geen bestellingen</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, index) => {
              const isExpanded = expandedOrder === order.id;
              const isNewest = index === 0;
              const statusLabel = statusLabels[order.status as keyof typeof statusLabels] || order.status;

              let statusClasses = '';
              if (order.status === 'pending') {
                statusClasses = 'bg-muted text-foreground';
              } else if (order.status === 'approved') {
                statusClasses = 'bg-secondary text-primary';
              } else if (order.status === 'rejected') {
                statusClasses = 'bg-red-100 text-destructive';
              } else if (order.status === 'delivered') {
                statusClasses = 'bg-blue-100 text-blue-600';
              } else if (order.status === 'partially_delivered') {
                statusClasses = 'bg-amber-100 text-amber-600';
              }

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm cursor-pointer transition-shadow hover:shadow-md"
                >
                  {/* Header - Always Visible */}
                  <div onClick={() => toggleOrder(order.id)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {isNewest && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(27,120,103,0.1)] flex-shrink-0" />
                          )}
                          <h3 className="text-lg font-semibold text-foreground">
                            {order.order_number}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-[13px] font-medium ${statusClasses}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Aangemaakt: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
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
                        <div className="p-2 rounded-full transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-primary" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-border flex flex-col gap-6">
                      {/* Order Notes */}
                      {order.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Opmerkingen
                          </h4>
                          <p className="text-sm text-muted-foreground p-4 bg-card border border-border/30 rounded-md whitespace-pre-wrap">
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Product List */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          Producten
                        </h4>
                        <div className="bg-card border border-border rounded-md overflow-hidden">
                          {order.internal_order_items && order.internal_order_items.length > 0 ? (
                            order.internal_order_items.map((item, index) => (
                              <div
                                key={item.id}
                                className={`grid grid-cols-[1fr_auto] items-center px-5 py-4 transition-colors hover:bg-muted ${index < order.internal_order_items.length - 1 ? 'border-b border-border/30' : ''}`}
                              >
                                <span className="text-sm font-medium text-foreground">
                                  {item.product_name}
                                </span>
                                <span className="text-sm font-semibold text-primary text-right min-w-[80px]">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-5 text-center text-sm text-muted-foreground">
                              Geen producten gevonden
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Receiver Feedback (if exists) */}
                      {order.receiver_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Ontvangst feedback
                          </h4>
                          <p className="text-sm text-muted-foreground p-4 bg-amber-50 border border-amber-200/30 rounded-md whitespace-pre-wrap">
                            {order.receiver_notes}
                          </p>
                        </div>
                      )}

                      {/* Receive buttons for approved orders */}
                      {order.status === 'approved' && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {showFeedbackFor === order.id ? (
                            <div className="flex flex-col gap-3">
                              <textarea
                                value={feedbackText[order.id] || ''}
                                onChange={(e) => setFeedbackText({ ...feedbackText, [order.id]: e.target.value })}
                                placeholder="Wat ontbreekt? (bijv. 'Brie was op')"
                                className="text-sm p-3 rounded-md border border-border bg-card text-foreground min-h-[80px] resize-y"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => submitPartialDelivery(order.id)}
                                  disabled={updateOrderMutation.isPending}
                                  className="flex-1 text-sm font-medium py-3 px-5 rounded-lg bg-amber-500 text-white border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updateOrderMutation.isPending ? 'Bezig...' : 'Feedback versturen'}
                                </button>
                                <button
                                  onClick={() => setShowFeedbackFor(null)}
                                  className="text-sm font-medium py-3 px-5 rounded-lg bg-card text-muted-foreground border border-border cursor-pointer"
                                >
                                  Annuleren
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFullyReceived(order.id);
                                }}
                                disabled={updateOrderMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 px-5 rounded-lg bg-primary text-white border-none cursor-pointer transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Compleet
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePartiallyReceived(order.id);
                                }}
                                disabled={updateOrderMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 px-5 rounded-lg bg-card text-amber-500 border border-amber-500 cursor-pointer transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <AlertCircle className="h-4 w-4" />
                                Incompleet
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
