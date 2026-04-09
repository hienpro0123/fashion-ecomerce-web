import { CHECKOUT_STEP_1 } from '@/constants/routes';
import { Form, Formik } from 'formik';
import { displayActionMessage } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { setPaymentDetails } from '@/redux/actions/checkoutActions';
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

const Payment = ({ shipping, payment, subtotal }) => {
  useDocumentTitle('Check Out Final Step | LORDMEN');
  useScrollTop();
  const dispatch = useDispatch();

  const initFormikValues = {
    name: payment.name || '',
    cardnumber: payment.cardnumber || '',
    expiry: payment.expiry || '',
    ccv: payment.ccv || '',
    type: payment.type || 'paypal'
  };

  const onConfirm = (values) => {
    const { cardnumber, ccv, ...rest } = values;

    dispatch(setPaymentDetails({ ...rest }));
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
  shipping: PropType.shape({
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
