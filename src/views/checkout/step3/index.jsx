import { SHIPPING_FEE_VND } from '@/constants/constants';
import { ACCOUNT, CHECKOUT_STEP_1 } from '@/constants/routes';
import { Form, Formik } from 'formik';
import { displayActionMessage } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory } from 'react-router-dom';
import { clearBasket } from '@/redux/actions/basketActions';
import { setPaymentDetails } from '@/redux/actions/checkoutActions';
import { resetCheckout } from '@/redux/actions/checkoutActions';
import firebase from '@/services/firebase';
import * as Yup from 'yup';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';
import CODPayment from './CODPayment';
import CreditPayment from './CreditPayment';
import PayPalPayment from './PayPalPayment';
import Total from './Total';

const FormSchema = Yup.object().shape({
  name: Yup.string().when('type', {
    is: 'credit',
    then: (schema) => schema
      .min(4, 'Name should be at least 4 characters.')
      .required('Name is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  cardnumber: Yup.string().when('type', {
    is: 'credit',
    then: (schema) => schema
      .min(13, 'Card number should be 13-19 digits long')
      .max(19, 'Card number should only be 13-19 digits long')
      .required('Card number is required.'),
    otherwise: (schema) => schema.notRequired()
  }),
  expiry: Yup.string().when('type', {
    is: 'credit',
    then: (schema) => schema.required('Credit card expiry is required.'),
    otherwise: (schema) => schema.notRequired()
  }),
  ccv: Yup.string().when('type', {
    is: 'credit',
    then: (schema) => schema
      .min(3, 'CCV length should be 3-4 digit')
      .max(4, 'CCV length should only be 3-4 digit')
      .required('CCV is required.'),
    otherwise: (schema) => schema.notRequired()
  }),
  type: Yup.string().required('Please select paymend mode')
});

const Payment = ({
  basket, profile, shipping, payment, subtotal
}) => {
  useDocumentTitle('Check Out Final Step | LORDMEN');
  useScrollTop();
  const dispatch = useDispatch();
  const history = useHistory();
  const userId = useSelector((store) => store.auth.id);

  const initFormikValues = {
    name: payment.name || '',
    cardnumber: payment.cardnumber || '',
    expiry: payment.expiry || '',
    ccv: payment.ccv || '',
    type: payment.type || 'paypal'
  };

  const onConfirm = async (values) => {
    const { cardnumber, ccv, ...rest } = values;
    const shippingFee = shipping.isInternational ? SHIPPING_FEE_VND : 0;

    dispatch(setPaymentDetails({ ...rest }));

    if (values.type === 'cod') {
      const order = {
        userId,
        customer: {
          fullname: shipping.fullname || profile.fullname || '',
          email: shipping.email || profile.email || '',
          address: shipping.address || profile.address || '',
          mobile: shipping.mobile || profile.mobile || {}
        },
        items: basket.map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || '',
          selectedColor: item.selectedColor || ''
        })),
        shipping: {
          isInternational: shipping.isInternational,
          shippingFee
        },
        payment: {
          type: values.type,
          label: 'Cash on Delivery'
        },
        pricing: {
          subtotal,
          shippingFee,
          total: subtotal + shippingFee
        },
        status: 'pending',
        createdAt: new Date().getTime()
      };

      try {
        await firebase.saveOrder(order);
        history.push(`${ACCOUNT}?tab=2`);
        dispatch(clearBasket());
        dispatch(resetCheckout());
        displayActionMessage('COD order saved successfully.', 'success');
      } catch (error) {
        displayActionMessage(error?.message || 'Failed to save COD order.', 'error');
      }
      return;
    }

    displayActionMessage(`Selected payment method: ${values.type.toUpperCase()}`, 'info');
  };

  if (!shipping || !shipping.isDone) {
    return <Redirect to={CHECKOUT_STEP_1} />;
  }
  return (
    <div className="checkout">
      <StepTracker current={3} />
      <Formik
        initialValues={initFormikValues}
        validateOnChange
        validationSchema={FormSchema}
        onSubmit={onConfirm}
      >
        {() => (
          <Form className="checkout-step-3">
            <CreditPayment />
            <PayPalPayment />
            <CODPayment />
            <Total
              isInternational={shipping.isInternational}
              subtotal={subtotal}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};

Payment.propTypes = {
  basket: PropType.arrayOf(PropType.object).isRequired,
  profile: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object
  }).isRequired,
  shipping: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object,
    isDone: PropType.bool,
    isInternational: PropType.bool
  }).isRequired,
  payment: PropType.shape({
    name: PropType.string,
    cardnumber: PropType.string,
    expiry: PropType.string,
    ccv: PropType.string,
    type: PropType.string
  }).isRequired,
  subtotal: PropType.number.isRequired
};

export default withCheckout(Payment);
