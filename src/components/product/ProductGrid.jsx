import { useBasket } from '@/hooks';
import PropType from 'prop-types';
import React from 'react';
import ProductItem from './ProductItem';

const SKELETON_KEYS = [
  'product-skeleton-1',
  'product-skeleton-2',
  'product-skeleton-3',
  'product-skeleton-4',
  'product-skeleton-5',
  'product-skeleton-6',
  'product-skeleton-7',
  'product-skeleton-8',
  'product-skeleton-9',
  'product-skeleton-10',
  'product-skeleton-11',
  'product-skeleton-12'
];

const ProductGrid = ({ products }) => {
  const { addToBasket, isItemOnBasket } = useBasket();

  return (
    <div className="product-grid">
      {products.length === 0 ? SKELETON_KEYS.map((key) => (
        <ProductItem
          key={key}
          product={{}}
        />
      )) : products.map((product) => (
        <ProductItem
          key={product.id}
          isItemOnBasket={isItemOnBasket}
          addToBasket={addToBasket}
          product={product}
        />
      ))}
    </div>
  );
};

ProductGrid.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  products: PropType.array.isRequired
};

export default ProductGrid;
