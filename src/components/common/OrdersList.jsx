import { ImageLoader } from '@/components/common';
import { displayDate, displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';

const OrdersList = ({
  emptyMessage,
  isLoading,
  onUpdateStatus,
  orders,
  role,
  showCustomer,
  title
}) => {
  const getStatusTone = (status) => {
    switch (status) {
      case 'confirmed':
        return { background: '#eef7ee', color: '#2f7a39', border: '#cfe8d2' };
      case 'delivered':
        return { background: '#edf6ff', color: '#1f5ea8', border: '#cddff7' };
      case 'cancelled':
        return { background: '#fff1f1', color: '#b03d3d', border: '#f0caca' };
      default:
        return { background: '#f6f6f6', color: '#666', border: '#e1e1e1' };
    }
  };

  const renderActions = (order) => {
    if (!onUpdateStatus) return null;

    if (role === 'user' && order.status === 'pending') {
      return (
        <button
          className="button button-border button-border-gray button-small"
          onClick={() => onUpdateStatus(order.id, 'cancelled')}
          type="button"
        >
          Cancel Order
        </button>
      );
    }

    if (role === 'admin') {
      return (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {order.status === 'pending' && (
            <button
              className="button button-small"
              onClick={() => onUpdateStatus(order.id, 'confirmed')}
              type="button"
            >
              Confirm Order
            </button>
          )}
          {order.status === 'confirmed' && (
            <button
              className="button button-small"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
              type="button"
            >
              Mark as Delivered
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="loader" style={{ minHeight: '80vh', alignItems: 'stretch' }}>
      <h3>{title}</h3>
      {isLoading && <span className="text-subtle">Loading orders...</span>}
      {!isLoading && orders.length === 0 && (
        <strong><span className="text-subtle">{emptyMessage}</span></strong>
      )}
      {!isLoading && orders.length > 0 && (
        <div style={{ width: '100%', display: 'grid', gap: '1rem' }}>
          {orders.map((order) => {
            const statusTone = getStatusTone(order.status || 'pending');

            return (
              <div
                key={order.id}
                style={{
                  border: '1px solid #e1e1e1',
                  background: '#fff',
                  padding: '1.25rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <h4 className="my-0">Order #{order.id.slice(0, 8)}</h4>
                    <span className="text-subtle d-block margin-top-s">
                      {displayDate(order.createdAt)}
                    </span>
                    {showCustomer && (
                      <>
                        <span className="text-subtle d-block margin-top-s">
                          Customer: {order.customer?.fullname || 'Unknown'}
                        </span>
                        <span className="text-subtle d-block margin-top-s">
                          Email: {order.customer?.email || 'N/A'}
                        </span>
                      </>
                    )}
                    <span className="text-subtle d-block margin-top-s">
                      Payment: {order.payment?.label || order.payment?.type || 'N/A'}
                    </span>
                    <div className="margin-top-s">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.35rem 0.75rem',
                          border: `1px solid ${statusTone.border}`,
                          background: statusTone.background,
                          color: statusTone.color,
                          textTransform: 'capitalize',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        {order.status || 'pending'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '160px' }}>
                    <span className="text-subtle d-block">Total</span>
                    <h4 className="my-0 margin-top-s">{displayMoney(order.pricing?.total || 0)}</h4>
                    <div className="margin-top-s">
                      {renderActions(order)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {(order.items || []).map((item) => (
                    <div
                      key={`${order.id}_${item.id}_${item.selectedSize || 'default'}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.875rem',
                        border: '1px solid #eaeaea',
                        background: '#fafafa'
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '84px',
                          height: '84px',
                          flexShrink: 0,
                          overflow: 'hidden',
                          background: '#fff',
                          border: '1px solid #eee'
                        }}
                      >
                        <ImageLoader
                          alt={item.name}
                          className="basket-item-img"
                          src={item.image}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 className="margin-0" style={{ lineHeight: 1.4 }}>
                          {item.name}
                        </h5>
                        <div
                          className="text-subtle margin-top-s"
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: {displayMoney(item.price)}</span>
                          {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

OrdersList.defaultProps = {
  onUpdateStatus: undefined,
  role: 'user',
  showCustomer: false
};

OrdersList.propTypes = {
  emptyMessage: PropType.string.isRequired,
  isLoading: PropType.bool.isRequired,
  onUpdateStatus: PropType.func,
  orders: PropType.arrayOf(PropType.object).isRequired,
  role: PropType.oneOf(['user', 'admin']),
  showCustomer: PropType.bool,
  title: PropType.string.isRequired
};

export default OrdersList;
