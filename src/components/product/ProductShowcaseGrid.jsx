/* eslint-disable react/forbid-prop-types */
import { FeaturedProduct } from '@/components/product';
import PropType from 'prop-types';
import React from 'react';

const SKELETON_KEYS = ['showcase-skeleton-1', 'showcase-skeleton-2', 'showcase-skeleton-3', 'showcase-skeleton-4'];

const ProductShowcase = ({ products, skeletonCount }) => (
  <div className="product-display-grid">
    {(products.length === 0) ? SKELETON_KEYS.slice(0, skeletonCount).map((key) => (
      <FeaturedProduct
        key={key}
        product={{}}
      />
    )) : products.map((product) => (
      <FeaturedProduct
        key={product.id}
        product={product}
      />
    ))}
  </div>
);

ProductShowcase.defaultProps = {
  skeletonCount: 4
};

ProductShowcase.propTypes = {
  products: PropType.array.isRequired,
  skeletonCount: PropType.number
};

export default ProductShowcase;
