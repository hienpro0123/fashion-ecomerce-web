/* eslint-disable jsx-a11y/label-has-associated-control */
import { useFormikContext } from 'formik';
import React from 'react';

const CODPayment = () => {
  const { values, setValues } = useFormikContext();

  return (
    <div className={`checkout-fieldset-collapse ${values.type === 'cod' ? 'is-selected-payment' : ''}`}>
      <div className="checkout-field margin-0">
        <div className="checkout-checkbox-field">
          <input
            checked={values.type === 'cod'}
            id="modeCOD"
            name="type"
            onChange={(e) => {
              if (e.target.checked) {
                setValues({ ...values, type: 'cod' });
              }
            }}
            type="radio"
          />
          <label
            className="d-flex w-100"
            htmlFor="modeCOD"
          >
            <div className="d-flex-grow-1 margin-left-s">
              <h4 className="margin-0">Cash on Delivery (COD)</h4>
              <span className="text-subtle d-block margin-top-s">
                Pay with cash when your order is delivered.
              </span>
            </div>
            <div className="payment-img payment-img-cod" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default CODPayment;
