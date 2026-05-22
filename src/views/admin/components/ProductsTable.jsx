/* eslint-disable react/forbid-prop-types */
import PropType from 'prop-types';
import React from 'react';
import ProductItem from './ProductItem';

const SKELETON_KEYS = [
  'admin-product-skeleton-1',
  'admin-product-skeleton-2',
  'admin-product-skeleton-3',
  'admin-product-skeleton-4',
  'admin-product-skeleton-5',
  'admin-product-skeleton-6',
  'admin-product-skeleton-7',
  'admin-product-skeleton-8',
  'admin-product-skeleton-9',
  'admin-product-skeleton-10'
];

const ProductsTable = ({ filteredProducts }) => (
  <div>
    {filteredProducts.length > 0 && (
      <div className="grid grid-product grid-count-6">
        <div className="grid-col" />
        <div className="grid-col">
          <h5>Name</h5>
        </div>
        <div className="grid-col">
          <h5>Brand</h5>
        </div>
        <div className="grid-col">
          <h5>Price</h5>
        </div>
        <div className="grid-col">
          <h5>Date Added</h5>
        </div>
        <div className="grid-col">
          <h5>Qty</h5>
        </div>
      </div>
    )}
    {filteredProducts.length === 0 ? SKELETON_KEYS.map((key) => (
      <ProductItem
        key={key}
        product={{}}
      />
    )) : filteredProducts.map((product) => (
      <ProductItem
        key={product.id}
        product={product}
      />
    ))}
  </div>
);

ProductsTable.propTypes = {
  filteredProducts: PropType.array.isRequired
};

export default ProductsTable;
