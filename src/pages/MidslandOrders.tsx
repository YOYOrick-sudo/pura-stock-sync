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
      <div style={{
        backgroundColor: '#FFF7ED',
        border: '1px solid #D5D8E0',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
      }}>

        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '48px 0' 
          }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E27726' }}></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D5D8E0',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: '#C1C5CF' }} />
            <p style={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              color: '#636878'
            }}>Nog geen bestellingen</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order, index) => {
              const isExpanded = expandedOrder === order.id;
              const isNewest = index === 0;
              const statusLabel = statusLabels[order.status as keyof typeof statusLabels] || order.status;
              
              let statusStyle = {};
              if (order.status === 'pending') {
                statusStyle = { backgroundColor: '#FFF7ED', color: '#282E3A' };
              } else if (order.status === 'approved') {
                statusStyle = { backgroundColor: '#D1FAE5', color: '#E27726' };
              } else if (order.status === 'rejected') {
                statusStyle = { backgroundColor: '#FEE2E2', color: '#DC2626' };
              } else if (order.status === 'delivered') {
                statusStyle = { backgroundColor: '#DBEAFE', color: '#2563EB' };
              } else if (order.status === 'partially_delivered') {
                statusStyle = { backgroundColor: '#FEF3C7', color: '#D97706' };
              }

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5D8E0',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  {/* Header - Always Visible */}
                  <div onClick={() => toggleOrder(order.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          {isNewest && (
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#E27726',
                              boxShadow: '0 0 0 2px rgba(226, 119, 38, 0.1)',
                              flexShrink: 0
                            }} />
                          )}
                          <h3 style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#282E3A'
                          }}>
                            {order.order_number}
                          </h3>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                            ...statusStyle
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar className="h-4 w-4" style={{ color: '#636878' }} />
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              color: '#636878'
                            }}>
                              Aangemaakt: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package className="h-4 w-4" style={{ color: '#636878' }} />
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              color: '#636878'
                            }}>
                              Leverdatum: {format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#636878'
                          }}>
                            {order.internal_order_items?.length || 0} product
                            {(order.internal_order_items?.length || 0) !== 1 ? 'en' : ''}
                          </p>
                        </div>
                        <div style={{ 
                          padding: '8px',
                          borderRadius: '50%',
                          transition: 'background-color 0.2s'
                        }}>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" style={{ color: '#E27726' }} />
                          ) : (
                            <ChevronDown className="h-5 w-5" style={{ color: '#636878' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ 
                      marginTop: '24px', 
                      paddingTop: '24px', 
                      borderTop: '1px solid #D5D8E0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px'
                    }}>
                      {order.notes && (
                        <div>
                          <h4 style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <FileText className="h-4 w-4" style={{ color: '#E27726' }} />
                            Opmerkingen
                          </h4>
                          <p style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#636878',
                            padding: '16px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #EAECF0',
                            borderRadius: '16px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {order.notes}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#282E3A',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Package className="h-4 w-4" style={{ color: '#E27726' }} />
                          Producten
                        </h4>
                        <div style={{ 
                          backgroundColor: '#FFFFFF',
                           border: '1px solid #D5D8E0',
                          borderRadius: '16px',
                          overflow: 'hidden'
                        }}>
                          {order.internal_order_items && order.internal_order_items.length > 0 ? (
                            order.internal_order_items.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto',
                                  alignItems: 'center',
                                  padding: '16px 20px',
                                  borderBottom: index < order.internal_order_items.length - 1 ? '1px solid #EAECF0' : 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FFF7ED';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span style={{ 
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: '#282E3A'
                                }}>
                                  {item.product_name}
                                </span>
                                <span style={{ 
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#E27726',
                                  textAlign: 'right',
                                  minWidth: '80px'
                                }}>
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div style={{ 
                              padding: '20px', 
                              textAlign: 'center',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              color: '#636878'
                            }}>
                              Geen producten gevonden
                            </div>
                          )}
                        </div>
                      </div>

                      {order.receiver_notes && (
                        <div>
                          <h4 style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <AlertCircle className="h-4 w-4" style={{ color: '#D97706' }} />
                            Ontvangst feedback
                          </h4>
                          <p style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#636878',
                            padding: '16px',
                            backgroundColor: '#FEF3C7',
                            border: '1px solid rgba(217, 119, 6, 0.3)',
                            borderRadius: '16px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {order.receiver_notes}
                          </p>
                        </div>
                      )}

                      {order.status === 'approved' && (
                        <div style={{ 
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #D5D8E0'
                        }}>
                          {showFeedbackFor === order.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <textarea
                                value={feedbackText[order.id] || ''}
                                onChange={(e) => setFeedbackText({ ...feedbackText, [order.id]: e.target.value })}
                                placeholder="Wat ontbreekt? (bijv. 'Brie was op')"
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  padding: '12px',
                                  borderRadius: '16px',
                                  border: '1px solid #D5D8E0',
                                  backgroundColor: '#FFFFFF',
                                  color: '#282E3A',
                                  minHeight: '80px',
                                  resize: 'vertical',
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => submitPartialDelivery(order.id)}
                                  disabled={updateOrderMutation.isPending}
                                  style={{
                                    flex: 1,
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    padding: '12px 20px',
                                    borderRadius: '20px',
                                    backgroundColor: '#D97706',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: updateOrderMutation.isPending ? 'not-allowed' : 'pointer',
                                    opacity: updateOrderMutation.isPending ? 0.5 : 1,
                                  }}
                                >
                                  {updateOrderMutation.isPending ? 'Bezig...' : 'Feedback versturen'}
                                </button>
                                <button
                                  onClick={() => setShowFeedbackFor(null)}
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    padding: '12px 20px',
                                    borderRadius: '20px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#636878',
                                    border: '1px solid #D5D8E0',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Annuleren
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFullyReceived(order.id);
                                }}
                                disabled={updateOrderMutation.isPending}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  padding: '12px 20px',
                                  borderRadius: '20px',
                                  backgroundColor: '#E27726',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  cursor: updateOrderMutation.isPending ? 'not-allowed' : 'pointer',
                                  opacity: updateOrderMutation.isPending ? 0.5 : 1,
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!updateOrderMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#C9630E';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#E27726';
                                }}
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
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  padding: '12px 20px',
                                  borderRadius: '20px',
                                  backgroundColor: '#FFFFFF',
                                  color: '#D97706',
                                  border: '1px solid #D97706',
                                  cursor: updateOrderMutation.isPending ? 'not-allowed' : 'pointer',
                                  opacity: updateOrderMutation.isPending ? 0.5 : 1,
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!updateOrderMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#FEF3C7';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
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
