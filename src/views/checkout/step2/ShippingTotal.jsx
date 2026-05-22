import { SHIPPING_FEE_VND } from '@/constants/constants';
import { useFormikContext } from 'formik';
import { displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';

const ShippingTotal = ({ subtotal }) => {
  const { values } = useFormikContext();
  const shippingFee = values.isInternational ? SHIPPING_FEE_VND : 0;

  return (
    <div className="checkout-total d-flex-end padding-right-m">
      <table>
        <tbody>
          <tr>
            <td>
              <span className="d-block margin-0 padding-right-s text-right">
                International Shipping: &nbsp;
              </span>
            </td>
            <td>
              <h4 className="basket-total-amount text-subtle text-right margin-0 ">
                {displayMoney(shippingFee)}
              </h4>
            </td>
          </tr>
          <tr>
            <td>
              <span className="d-block margin-0 padding-right-s text-right">
                Subtotal: &nbsp;
              </span>
            </td>
            <td>
              <h4 className="basket-total-amount text-subtle text-right margin-0">
                {displayMoney(subtotal)}
              </h4>
            </td>
          </tr>
          <tr>
            <td>
              <span className="d-block margin-0 padding-right-s text-right">
                Total: &nbsp;
              </span>
            </td>
            <td>
              <h2 className="basket-total-amount text-right">
                {displayMoney(subtotal + shippingFee)}
              </h2>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

ShippingTotal.propTypes = {
  subtotal: PropType.number.isRequired
};

export default ShippingTotal;