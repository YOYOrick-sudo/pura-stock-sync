import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { devError } from "@/lib/devLog";

interface OrderItem {
  /** Snapshot-naam vanuit het artikel (of vrije tekst bij een extra product). */
  product_name: string;
  quantity: number;
  /** Snapshot-eenheid vanuit het artikel. */
  unit: string;
  artikel_id?: string | null;
  eenheid_id?: string | null;
}

interface CreateOrderData {
  from_location: string;
  to_location: string;
  delivery_date: string;
  items: OrderItem[];
  notes?: string;
}

export const useSendInternalOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Insert order with status 'approved' and approved_by set
      const { data: order, error: orderError } = await supabase
        .from('internal_orders')
        .insert([{
          from_location: orderData.from_location,
          to_location: orderData.to_location,
          delivery_date: orderData.delivery_date,
          notes: orderData.notes || null,
          requested_by: user.id,
          status: 'approved',
          approved_by: user.id,
          order_number: '', // Will be set by trigger
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const itemsToInsert = orderData.items.map(item => ({
        order_id: order.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        artikel_id: item.artikel_id ?? null,
        eenheid_id: item.eenheid_id ?? null,
      }));

      const { error: itemsError } = await supabase
        .from('internal_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['received-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pending-orders'] });
      toast({
        title: 'Bestelling verzonden',
        description: 'De bestelling is succesvol aangemaakt en goedgekeurd',
      });
    },
    onError: (error: any) => {
      devError('Error sending order:', error);
      toast({
        title: 'Fout bij versturen bestelling',
        description: error.message || 'Er is iets misgegaan bij het versturen van de bestelling',
        variant: 'destructive',
      });
    },
  });
};

export const useSentOrders = (userLocation: string) => {
  return useQuery({
    queryKey: ['sent-orders', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_orders')
        .select(`
          *,
          internal_order_items (
            id,
            product_name,
            quantity,
            unit,
            artikel_id,
            eenheid_id
          )
        `)
        .eq('from_location', userLocation)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userLocation,
  });
};

export const useReceivedOrders = (userLocation: string) => {
  return useQuery({
    queryKey: ['received-orders', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_orders')
        .select(`
          *,
          internal_order_items (
            id,
            product_name,
            quantity,
            unit,
            artikel_id,
            eenheid_id
          )
        `)
        .eq('to_location', userLocation)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userLocation,
  });
};

/** Ontvangende vestiging werkt de status van een binnengekomen bestelling bij. */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      receiverNotes,
    }: { orderId: string; status: string; receiverNotes?: string | null }) => {
      const patch: Record<string, unknown> = { status };
      if (receiverNotes !== undefined) patch.receiver_notes = receiverNotes || null;
      if (status === 'delivered' || status === 'partially_delivered') {
        patch.received_at = new Date().toISOString();
      }
      const { error } = await supabase.from('internal_orders').update(patch).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['received-orders'] });
      queryClient.invalidateQueries({ queryKey: ['midsland-orders'] });
      toast({ title: 'Bestelling bijgewerkt' });
    },
    onError: (error: any) => {
      devError('Error updating order status:', error);
      toast({
        title: 'Bijwerken mislukt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
