import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ArrowRight, Package, Loader2, ChevronDown } from 'lucide-react';
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
        return { bg: '#F0FDF4', color: '#10B981', label: 'Afgeleverd' };
      case 'in_transit':
        return { bg: '#E6F4F1', color: '#1B7867', label: 'Onderweg' };
      case 'approved':
        return { bg: '#E6F4F1', color: '#1B7867', label: 'Goedgekeurd' };
      case 'cancelled':
        return { bg: '#FEF5F5', color: '#E64D4D', label: 'Geannuleerd' };
      default:
        return { bg: '#FFF8F0', color: '#FF9800', label: 'In afwachting' };
    }
  };

  const renderOrderCard = (order: any) => {
    const isExpanded = expandedOrders.has(order.id);
    const statusInfo = getStatusInfo(order.status);

    return (
      <div
        key={order.id}
        style={{
          backgroundColor: '#F6F7DD',
          borderRadius: '20px',
          border: '1px solid rgba(197, 197, 202, 0.5)',
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
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#282E3A',
                  letterSpacing: '0.5px',
                }}>
                  {order.order_number}
                </h3>
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
                color: '#73747B',
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
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                fontFamily: 'Inter, sans-serif',
              }}>
                <p style={{ fontSize: '12px', color: '#73747B' }}>
                  📅 {new Date(order.delivery_date).toLocaleDateString('nl-NL')}
                </p>
                <span style={{ fontSize: '12px', color: '#73747B' }}>•</span>
                <p style={{ fontSize: '12px', color: '#73747B' }}>
                  {order.internal_order_items?.length || 0} producten
                </p>
              </div>
            </div>

            <ChevronDown
              size={20}
              style={{
                color: '#73747B',
                marginLeft: '16px',
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        </button>

        {isExpanded && order.internal_order_items && order.internal_order_items.length > 0 && (
          <div style={{
            padding: '0 20px 20px 20px',
            borderTop: '1px solid rgba(197, 197, 202, 0.3)',
            paddingTop: '16px',
            fontFamily: 'Inter, sans-serif',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#282E3A',
            }}>
              Producten:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {order.internal_order_items.map((item: any) => (
                <p key={item.id} style={{
                  fontSize: '13px',
                  color: '#73747B',
                  paddingLeft: '12px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    color: '#1B7867',
                  }}>•</span>
                  {item.product_name} - {item.quantity} {item.unit}
                </p>
              ))}
            </div>
            {order.notes && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(197, 197, 202, 0.2)' }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#282E3A',
                }}>
                  Opmerkingen:
                </p>
                <p style={{ fontSize: '13px', color: '#73747B' }}>
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        fontFamily: 'Inter, sans-serif',
      }}>
        {loading ? (
          <div style={{
            backgroundColor: '#F6F7DD',
            borderRadius: '20px',
            border: '1px solid rgba(197, 197, 202, 0.5)',
            padding: '48px',
            textAlign: 'center',
          }}>
            <Loader2 size={32} style={{
              color: '#1B7867',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{
              color: '#73747B',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Gebruikersgegevens laden...
            </p>
          </div>
        ) : (
          <>
            {/* Tab Buttons */}
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
                  backgroundColor: activeTab === 'new' ? '#1B7867' : '#FEFFF1',
                  color: activeTab === 'new' ? '#FFFFFF' : '#282E3A',
                  border: activeTab === 'new' ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'new') {
                    e.currentTarget.style.backgroundColor = '#F6F7DD';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'new') {
                    e.currentTarget.style.backgroundColor = '#FEFFF1';
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
                  backgroundColor: activeTab === 'sent' ? '#1B7867' : '#FEFFF1',
                  color: activeTab === 'sent' ? '#FFFFFF' : '#282E3A',
                  border: activeTab === 'sent' ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'sent') {
                    e.currentTarget.style.backgroundColor = '#F6F7DD';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'sent') {
                    e.currentTarget.style.backgroundColor = '#FEFFF1';
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
                  backgroundColor: activeTab === 'sent' ? 'rgba(255, 255, 255, 0.2)' : '#F6F7DD',
                  color: activeTab === 'sent' ? '#FFFFFF' : '#1B7867',
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
                  backgroundColor: activeTab === 'received' ? '#1B7867' : '#FEFFF1',
                  color: activeTab === 'received' ? '#FFFFFF' : '#282E3A',
                  border: activeTab === 'received' ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'received') {
                    e.currentTarget.style.backgroundColor = '#F6F7DD';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'received') {
                    e.currentTarget.style.backgroundColor = '#FEFFF1';
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
                  backgroundColor: activeTab === 'received' ? 'rgba(255, 255, 255, 0.2)' : '#F6F7DD',
                  color: activeTab === 'received' ? '#FFFFFF' : '#1B7867',
                }}>
                  {receivedOrders.length}
                </span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'new' && (
              <div>
                <OrderDashboard />
              </div>
            )}

            {activeTab === 'sent' && (
              <div>
                {loadingSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: '120px',
                          backgroundColor: '#F6F7DD',
                          borderRadius: '20px',
                          border: '1px solid rgba(197, 197, 202, 0.5)',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                    ))}
                  </div>
                ) : sentOrders.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Geen verzonden bestellingen"
                    description="Maak een nieuwe bestelling om te beginnen"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sentOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'received' && (
              <div>
                {loadingReceived ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: '120px',
                          backgroundColor: '#F6F7DD',
                          borderRadius: '20px',
                          border: '1px solid rgba(197, 197, 202, 0.5)',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                    ))}
                  </div>
                ) : receivedOrders.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Geen ontvangen bestellingen"
                    description="Wacht op bestellingen van andere locaties"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {receivedOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
