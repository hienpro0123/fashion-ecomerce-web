import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '@/redux/actions/authActions';

const ForgotPassword = () => {
  const { authStatus, isAuthenticating } = useSelector((state) => ({
    isAuthenticating: state.app.isAuthenticating,
    authStatus: state.app.authStatus
  }));
  const dispatch = useDispatch();
  const field = useRef({});

  useScrollTop();
  useDocumentTitle('Forgot Password | LORDMEN');

  const onEmailChange = (e) => {
    field.current = { email: e.target.value, error: '' };
  };

  const onSubmitEmail = () => {
    if (!!field.current.email && !field.current.error) {
      dispatch(resetPassword(field.current.email));
    }
  };

  return (
    <div className="forgot_password">
      {authStatus?.message && (
        <h5 className={`text-center ${authStatus?.success ? 'toast-success' : 'toast-error'}`}>
          {authStatus.message}
        </h5>
      )}
      <h2>Forgot Your Password?</h2>
      <p>Enter your email address and we will send you a password reset email.</p>
      <br />
      <input
        required
        className="input-form"
        maxLength={40}
        onChange={onEmailChange}
        placeholder="Enter your email"
        readOnly={isAuthenticating || authStatus?.success}
        type="email"
        style={{ width: '100%' }}
      />
      <br />
      <br />
      <button
        className="button w-100-mobile"
        disabled={isAuthenticating || authStatus?.success}
        onClick={onSubmitEmail}
        type="button"
      >
        {isAuthenticating ? <LoadingOutlined /> : <CheckOutlined />}
        &nbsp;
        {isAuthenticating ? 'Sending Password Reset Email' : 'Send Password Reset Email'}
      </button>
    </div>
  );
};

export default ForgotPassword;
