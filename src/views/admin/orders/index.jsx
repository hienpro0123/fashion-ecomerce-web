import { displayActionMessage } from '@/helpers/utils';
import OrdersList from '@/components/common/OrdersList';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import firebase from '@/services/firebase';
import React, { useEffect, useState } from 'react';

const Orders = () => {
  useDocumentTitle('Orders | Admin');
  useScrollTop();
  const [orders, setOrders] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const updateLocalStatus = (orderId, status) => {
    setOrders((prevState) => prevState.map((order) => (
      order.id === orderId ? { ...order, status } : order
    )));
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await firebase.updateOrderStatus(orderId, status);
      updateLocalStatus(orderId, status);
      displayActionMessage('Order status updated successfully.', 'success');
    } catch (error) {
      displayActionMessage(error?.message || 'Failed to update order status.', 'error');
    }
  };

  useEffect(() => {
    let isMounted = true;

    firebase.getOrders()
      .then((snapshot) => {
        if (!isMounted) return;

        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setOrders([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <OrdersList
      emptyMessage="No orders found."
      isLoading={isLoading}
      onUpdateStatus={handleUpdateStatus}
      orders={orders}
      role="admin"
      showCustomer
      title="Orders"
    />
  );
};

export default Orders;
