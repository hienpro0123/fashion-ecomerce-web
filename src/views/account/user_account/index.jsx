/* eslint-disable react/no-multi-comp */
import { LoadingOutlined } from '@ant-design/icons';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { lazy, Suspense } from 'react';
import UserTab from '../components/UserTab';

const UserAccountTab = lazy(() => import('../components/UserAccountTab'));
const UserWishListTab = lazy(() => import('../components/UserWishListTab'));
const UserOrdersTab = lazy(() => import('../components/UserOrdersTab'));

const Loader = () => (
  <div className="loader" style={{ minHeight: '80vh' }}>
    <LoadingOutlined />
    <h6>Loading ... </h6>
  </div>
);

const UserAccount = ({ location }) => {
  useScrollTop();
  useDocumentTitle('My Account | LORDMEN');
  const params = new URLSearchParams(location.search);
  const requestedTab = Number(params.get('tab'));
  const activeTab = [0, 1, 2].includes(requestedTab) ? requestedTab : undefined;

  return (
    <UserTab defaultActiveTab={activeTab}>
      <div index={0} label="Account">
        <Suspense fallback={<Loader />}>
          <UserAccountTab />
        </Suspense>
      </div>
      <div index={1} label="My Wish List">
        <Suspense fallback={<Loader />}>
          <UserWishListTab />
        </Suspense>
      </div>
      <div index={2} label="My Orders">
        <Suspense fallback={<Loader />}>
          <UserOrdersTab />
        </Suspense>
      </div>
    </UserTab>
  );
};

UserAccount.propTypes = {
  location: PropType.shape({
    search: PropType.string
  }).isRequired
};

export default UserAccount;
