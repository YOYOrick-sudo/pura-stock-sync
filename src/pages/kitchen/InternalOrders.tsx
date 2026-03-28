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
        return { bg: 'hsl(var(--secondary))', color: 'hsl(var(--primary))', label: 'Onderweg' };
      case 'approved':
        return { bg: 'hsl(var(--secondary))', color: 'hsl(var(--primary))', label: 'Goedgekeurd' };
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
        className="bg-card rounded-lg border border-border overflow-hidden transition-all"
      >
        <button
          onClick={() => toggleOrder(order.id)}
          className="w-full text-left p-5 bg-transparent border-none cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {isNewest && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(27,120,103,0.1)] flex-shrink-0" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground tracking-wide">
                    {order.order_number}
                  </h3>
                </div>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium"
                  style={{
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.color,
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>

              <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mb-2">
                {order.from_location} <ArrowRight size={14} /> {order.to_location}
              </p>

              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{'\uD83D\uDCC5'} {new Date(order.delivery_date).toLocaleDateString('nl-NL')}</span>
                <span>{'\uD83D\uDC64'} {order.requested_by}</span>
              </div>
            </div>

            <ChevronDown
              size={20}
              className={`text-muted-foreground transition-transform ml-3 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 border-t border-border/30">
            <div className="mt-4">
              <h4 className="text-[13px] font-semibold text-foreground mb-3">
                Producten:
              </h4>
              <div className="flex flex-col gap-2">
                {order.internal_order_items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center px-3 py-2.5 bg-card rounded-sm border border-border/30 text-[13px]"
                  >
                    <span className="text-foreground font-medium">{item.product_name}</span>
                    <span className="text-primary font-semibold">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="mt-3">
                  <h4 className="text-[13px] font-semibold text-foreground mb-2">
                    Notities:
                  </h4>
                  <p className="text-[13px] text-muted-foreground px-3 py-2.5 bg-card rounded-sm border border-border/30">
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Receiver Feedback */}
              {order.receiver_notes && (
                <div className="mt-3">
                  <h4 className="text-[13px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-500" />
                    Ontvangst feedback:
                  </h4>
                  <p className="text-[13px] text-muted-foreground px-3 py-2.5 bg-amber-50 rounded-sm border border-amber-600/30 whitespace-pre-wrap">
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
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-muted rounded-lg border border-border p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Loader2 size={48} className="animate-spin text-primary mb-4" />
              <p className="text-base text-muted-foreground">
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
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-muted rounded-lg border border-border p-6 shadow-sm">
          {/* Tab buttons */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {(['new', 'sent', 'received'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels = { new: 'Nieuwe bestelling', sent: 'Verzonden', received: 'Ontvangen' };
              const counts = { new: null, sent: sentOrders.length, received: receivedOrders.length };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`min-w-[160px] flex items-center justify-center text-sm font-medium py-2.5 px-5 rounded-lg cursor-pointer transition-all gap-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-none'
                      : 'bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm'
                  }`}
                >
                  {labels[tab]}
                  {counts[tab] !== null && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-sm text-xs font-semibold ${
                      isActive
                        ? 'bg-white/20 text-primary-foreground'
                        : 'bg-muted text-primary'
                    }`}>
                      {counts[tab]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'new' && (
            <OrderDashboard />
          )}

          {activeTab === 'sent' && (
            <div>
              {loadingSent ? (
                <div className="flex items-center justify-center py-12 px-6">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : sentOrders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Geen verzonden bestellingen"
                  description="Er zijn nog geen bestellingen verzonden"
                />
              ) : (
                <div className="grid gap-3">
                  {sentOrders.map((order, index) => renderOrderCard(order, index))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div>
              {loadingReceived ? (
                <div className="flex items-center justify-center py-12 px-6">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : receivedOrders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Geen ontvangen bestellingen"
                  description="Er zijn nog geen bestellingen ontvangen"
                />
              ) : (
                <div className="grid gap-3">
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
