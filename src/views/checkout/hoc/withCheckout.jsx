/* eslint-disable no-nested-ternary */
import { SHIPPING_FEE_VND } from '@/constants/constants';
import { SIGNIN } from '@/constants/routes';
import { calculateTotal } from '@/helpers/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

const withCheckout = (Component) => withRouter((props) => {
  const state = useSelector((store) => ({
    isAuth: !!store.auth.id && !!store.auth.role,
    basket: store.basket,
    shipping: store.checkout.shipping,
    payment: store.checkout.payment,
    profile: store.profile
  }));

  const shippingFee = state.shipping.isInternational ? SHIPPING_FEE_VND : 0;
  const subtotal = calculateTotal(state.basket.map((product) => product.price * product.quantity));

  if (!state.isAuth) {
    return <Redirect to={SIGNIN} />;
  } if (state.basket.length === 0) {
    return <Redirect to="/" />;
  } if (state.isAuth && state.basket.length !== 0) {
    return (
      <Component
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        basket={state.basket}
        payment={state.payment}
        profile={state.profile}
        shipping={state.shipping}
        shippingFee={shippingFee}
        subtotal={subtotal}
      />
    );
  }
  return null;
});

export default withCheckout;
