import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ArrowRight, Package, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useSentOrders, useReceivedOrders } from '@/hooks/useInternalOrders';
import OrderDashboard from '@/components/OrderDashboard';

export default function InternalOrders() {
  const { userLocation, loading } = useUserLocation();
  const { data: sentOrders = [], isLoading: loadingSent } = useSentOrders(userLocation);
  const { data: receivedOrders = [], isLoading: loadingReceived } = useReceivedOrders(userLocation);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'new' | 'sent' | 'received'>('new');

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))', label: 'Afgeleverd' };
      case 'partially_delivered':
        return { bg: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))', label: 'Deels geleverd' };
      case 'in_transit':
        return { bg: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', label: 'Onderweg' };
      case 'approved':
        return { bg: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', label: 'Goedgekeurd' };
      case 'cancelled':
        return { bg: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', label: 'Geannuleerd' };
      default:
        return { bg: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))', label: 'In afwachting' };
    }
  };

  const renderOrderCard = (order: any, index: number) => {
    const isExpanded = expandedOrders.has(order.id);
    const isNewest = index === 0;
    const statusInfo = getStatusInfo(order.status);

    return (
      <div
        key={order.id}
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border))',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
      >
        <button
          onClick={() => toggleOrder(order.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isNewest && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(var(--primary))',
                      boxShadow: '0 0 0 2px hsl(var(--primary) / 0.1)',
                      flexShrink: 0
                    }} />
                  )}
                  <h3 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                    letterSpacing: '0.5px',
                  }}>
                    {order.order_number}
                  </h3>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.color,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {statusInfo.label}
                </span>
              </div>
              
              <p style={{
                fontSize: '13px',
                color: 'hsl(var(--muted-foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {order.from_location} <ArrowRight size={14} /> {order.to_location}
              </p>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'Inter, sans-serif',
              }}>
                <span>📅 {new Date(order.delivery_date).toLocaleDateString('nl-NL')}</span>
                <span>👤 {order.requested_by}</span>
              </div>
            </div>
            
            <ChevronDown
              size={20}
              style={{
                color: 'hsl(var(--muted-foreground))',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                marginLeft: '12px',
              }}
            />
          </div>
        </button>

        {isExpanded && (
          <div style={{
            padding: '0 20px 20px 20px',
            borderTop: '1px solid hsl(var(--border))',
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ marginTop: '16px' }}>
              <h4 style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                marginBottom: '12px',
                fontFamily: 'Inter, sans-serif',
              }}>
                Producten:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.internal_order_items?.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{item.product_name}</span>
                    <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              
              {order.notes && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Notities:
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: 'hsl(var(--muted-foreground))',
                    padding: '10px 12px',
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Receiver Feedback */}
              {order.receiver_notes && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <AlertCircle size={14} style={{ color: 'hsl(var(--warning))' }} />
                    Ontvangst feedback:
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: 'hsl(var(--muted-foreground))',
                    padding: '10px 12px',
                    backgroundColor: 'hsl(var(--warning) / 0.1)',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--warning) / 0.3)',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {order.receiver_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'hsl(var(--muted))',
            borderRadius: '20px',
            border: '1px solid hsl(var(--border))',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              fontFamily: 'Inter, sans-serif',
            }}>
              <Loader2 size={48} className="animate-spin" style={{ color: 'hsl(var(--primary))', marginBottom: '16px' }} />
              <p style={{
                fontSize: '16px',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'Inter, sans-serif',
              }}>
                Locatie wordt geladen...
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'hsl(var(--muted))',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border))',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        }}>
          {/* Tab buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 20px',
                backgroundColor: activeTab === 'new' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                color: activeTab === 'new' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                border: activeTab === 'new' ? 'none' : '1px solid hsl(var(--border))',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'new') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'new') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Nieuwe bestelling
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              style={{
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 20px',
                backgroundColor: activeTab === 'sent' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                color: activeTab === 'sent' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                border: activeTab === 'sent' ? 'none' : '1px solid hsl(var(--border))',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'sent') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'sent') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Verzonden
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px',
                height: '24px',
                padding: '0 6px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: activeTab === 'sent' ? 'hsl(var(--primary-foreground) / 0.2)' : 'hsl(var(--secondary))',
                color: activeTab === 'sent' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
              }}>
                {sentOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('received')}
              style={{
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 20px',
                backgroundColor: activeTab === 'received' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                color: activeTab === 'received' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                border: activeTab === 'received' ? 'none' : '1px solid hsl(var(--border))',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'received') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'received') {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Ontvangen
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px',
                height: '24px',
                padding: '0 6px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: activeTab === 'received' ? 'hsl(var(--primary-foreground) / 0.2)' : 'hsl(var(--secondary))',
                color: activeTab === 'received' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
              }}>
                {receivedOrders.length}
              </span>
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'new' && (
            <OrderDashboard />
          )}

          {activeTab === 'sent' && (
            <div>
              {loadingSent ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                </div>
              ) : sentOrders.length === 0 ? (
                <EmptyState 
                  icon={Package}
                  title="Geen verzonden bestellingen"
                  description="Er zijn nog geen bestellingen verzonden"
                />
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '12px',
                }}>
                  {sentOrders.map((order, index) => renderOrderCard(order, index))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Link
                  to="/midsland-bestellingen"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: 'hsl(var(--primary))',
                    textDecoration: 'underline',
                  }}
                >
                  Bestellingen behandelen (goedkeuren en leveren)
                </Link>
              </div>

              {loadingReceived ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                </div>
              ) : receivedOrders.length === 0 ? (
                <EmptyState 
                  icon={Package}
                  title="Geen ontvangen bestellingen"
                  description="Er zijn nog geen bestellingen ontvangen"
                />
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '12px',
                }}>
                  {receivedOrders.map((order, index) => renderOrderCard(order, index))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
