import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Package, Calendar, FileText, Loader2, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
      <div style={{
        backgroundColor: '#F6F7DD',
        border: '1px solid rgba(197, 197, 202, 0.5)',
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#1B7867' }}></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(197, 197, 202, 0.5)',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: '#C5C5CA' }} />
            <p style={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              color: '#73747B'
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
                statusStyle = { backgroundColor: '#F6F7DD', color: '#282E3A' };
              } else if (order.status === 'approved') {
                statusStyle = { backgroundColor: '#D1FAE5', color: '#1B7867' };
              } else if (order.status === 'rejected') {
                statusStyle = { backgroundColor: '#FEE2E2', color: '#DC2626' };
              } else if (order.status === 'delivered') {
                statusStyle = { backgroundColor: '#DBEAFE', color: '#2563EB' };
              }

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(197, 197, 202, 0.5)',
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
                              backgroundColor: '#1B7867',
                              boxShadow: '0 0 0 2px rgba(27, 120, 103, 0.1)',
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
                            <Calendar className="h-4 w-4" style={{ color: '#73747B' }} />
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              color: '#73747B'
                            }}>
                              Aangemaakt: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: nl })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package className="h-4 w-4" style={{ color: '#73747B' }} />
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              color: '#73747B'
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
                            color: '#73747B'
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
                            <ChevronUp className="h-5 w-5" style={{ color: '#1B7867' }} />
                          ) : (
                            <ChevronDown className="h-5 w-5" style={{ color: '#73747B' }} />
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
                      borderTop: '1px solid rgba(197, 197, 202, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px'
                    }}>
                      {/* Order Notes */}
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
                            <FileText className="h-4 w-4" style={{ color: '#1B7867' }} />
                            Opmerkingen
                          </h4>
                          <p style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#73747B',
                            padding: '16px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid rgba(197, 197, 202, 0.3)',
                            borderRadius: '16px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Product List */}
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
                          <Package className="h-4 w-4" style={{ color: '#1B7867' }} />
                          Producten
                        </h4>
                        <div style={{ 
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(197, 197, 202, 0.5)',
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
                                  borderBottom: index < order.internal_order_items.length - 1 ? '1px solid rgba(197, 197, 202, 0.3)' : 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEFFF1';
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
                                  color: '#1B7867',
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
                              color: '#73747B'
                            }}>
                              Geen producten gevonden
                            </div>
                          )}
                        </div>
                      </div>
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
