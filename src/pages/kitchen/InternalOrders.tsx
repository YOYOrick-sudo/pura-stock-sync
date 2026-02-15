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
      if (newSet.has(orderId)) { newSet.delete(orderId); } else { newSet.add(orderId); }
      return newSet;
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE8', color: '#15803D', label: 'Afgeleverd' };
      case 'partially_delivered':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Deels geleverd' };
      case 'in_transit':
        return { bg: '#DBEAFE', color: '#1D4ED8', label: 'Onderweg' };
      case 'approved':
        return { bg: '#FFF7ED', color: '#A5500D', label: 'Goedgekeurd' };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'Geannuleerd' };
      default:
        return { bg: '#FFF7ED', color: '#E27726', label: 'In afwachting' };
    }
  };

  const renderOrderCard = (order: any, index: number) => {
    const isExpanded = expandedOrders.has(order.id);
    const isNewest = index === 0;
    const statusInfo = getStatusInfo(order.status);

    return (
      <div key={order.id} style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #D5D8E0',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}>
        <button onClick={() => toggleOrder(order.id)} style={{
          width: '100%', textAlign: 'left', padding: '20px',
          backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isNewest && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E27726', flexShrink: 0 }} />
                  )}
                  <h3 style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#282E3A' }}>
                    {order.order_number}
                  </h3>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                  borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
                  backgroundColor: statusInfo.bg, color: statusInfo.color, fontFamily: 'Inter, sans-serif',
                }}>
                  {statusInfo.label}
                </span>
              </div>
              
              <p style={{ fontSize: '13px', color: '#636878', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                {order.from_location} <ArrowRight size={14} /> {order.to_location}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#636878', fontFamily: 'Inter, sans-serif' }}>
                <span>{new Date(order.delivery_date).toLocaleDateString('nl-NL')}</span>
                <span>{order.requested_by}</span>
              </div>
            </div>
            
            <ChevronDown size={20} style={{
              color: '#8D93A0', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease', marginLeft: '12px',
            }} />
          </div>
        </button>

        {isExpanded && (
          <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #EAECF0', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#636878', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producten:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.internal_order_items?.map((item: any) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', backgroundColor: '#F8F9FA', borderRadius: '14px',
                    border: '1px solid #EAECF0', fontSize: '13px',
                  }}>
                    <span style={{ color: '#303542', fontWeight: 500 }}>{item.product_name}</span>
                    <span style={{ color: '#E27726', fontWeight: 600, fontFamily: "'Geist Mono', monospace", fontSize: '12px' }}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              
              {order.notes && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#636878', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notities:</h4>
                  <p style={{ fontSize: '13px', color: '#636878', padding: '10px 12px', backgroundColor: '#F8F9FA', borderRadius: '14px', border: '1px solid #EAECF0' }}>
                    {order.notes}
                  </p>
                </div>
              )}

              {order.receiver_notes && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#636878', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} style={{ color: '#B45309' }} />
                    Ontvangst feedback:
                  </h4>
                  <p style={{ fontSize: '13px', color: '#636878', padding: '10px 12px', backgroundColor: '#FEF3C7', borderRadius: '14px', border: '1px solid rgba(217, 119, 6, 0.3)', whiteSpace: 'pre-wrap' }}>
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #D5D8E0',
            padding: '24px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#E27726', marginBottom: '16px' }} />
              <p style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif' }}>Locatie wordt geladen...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #D5D8E0',
          padding: '24px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Segmented control */}
          <div style={{
            display: 'inline-flex', backgroundColor: '#F8F9FA', border: '1px solid #EAECF0',
            borderRadius: '16px', padding: '3px', marginBottom: '24px',
          }}>
            {[
              { key: 'new' as const, label: 'Nieuwe bestelling', count: undefined },
              { key: 'sent' as const, label: 'Verzonden', count: sentOrders.length },
              { key: 'received' as const, label: 'Ontvangen', count: receivedOrders.length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 500,
                padding: '8px 16px',
                backgroundColor: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.key ? '#1A1F28' : '#4A4F5E',
                border: 'none', borderRadius: '13px', cursor: 'pointer',
                transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '20px', height: '20px', padding: '0 6px',
                    borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                    backgroundColor: activeTab === tab.key ? '#E27726' : 'rgba(0,0,0,0.06)',
                    color: activeTab === tab.key ? '#FFFFFF' : '#636878',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'new' && <OrderDashboard />}

          {activeTab === 'sent' && (
            <div>
              {loadingSent ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#E27726' }} />
                </div>
              ) : sentOrders.length === 0 ? (
                <EmptyState icon={Package} title="Geen verzonden bestellingen" description="Er zijn nog geen bestellingen verzonden" />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {sentOrders.map((order, index) => renderOrderCard(order, index))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div>
              {loadingReceived ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#E27726' }} />
                </div>
              ) : receivedOrders.length === 0 ? (
                <EmptyState icon={Package} title="Geen ontvangen bestellingen" description="Er zijn nog geen bestellingen ontvangen" />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
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
