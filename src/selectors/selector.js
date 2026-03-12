/* eslint-disable no-plusplus */
/* eslint-disable no-else-return */
export const selectFilter = (products, filter) => {
  if (!products || products.length === 0) return [];

  // helper to normalize strings for case‑ and accent‑insensitive comparison
  const normalize = (str) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD') // decompose accents
      .replace(/\p{Diacritic}/gu, '');
  };

  const normKeyword = normalize(filter.keyword || '');

  return products
    .filter((product) => {
      const isInRange = filter.maxPrice
        ? product.price >= filter.minPrice && product.price <= filter.maxPrice
        : true;

      // prepare normalized fields
      const name = normalize(product.name);
      const description = normalize(product.description);
      let keywordsList = [];
      if (product.keywords) {
        keywordsList = Array.isArray(product.keywords)
          ? product.keywords.map(normalize)
          : [normalize(product.keywords)];
      }

      // if keyword is empty, any product should match the text criteria
      const matchText = !normKeyword
        ? true
        :
            name.includes(normKeyword) ||
            description.includes(normKeyword) ||
            keywordsList.some((k) => k.includes(normKeyword));

      const matchBrand = product.brand
        ? normalize(product.brand).includes(normalize(filter.brand || ''))
        : true;

      return matchText && matchBrand && isInRange;
    })
    .sort((a, b) => {
      if (filter.sortBy === 'name-desc') {
        return a.name < b.name ? 1 : -1;
      } else if (filter.sortBy === 'name-asc') {
        return a.name > b.name ? 1 : -1;
      } else if (filter.sortBy === 'price-desc') {
        return a.price < b.price ? 1 : -1;
      }

      return a.price > b.price ? 1 : -1;
    });
};

// Select product with highest price
export const selectMax = (products) => {
  if (!products || products.length === 0) return 0;

  let high = products[0];

  for (let i = 0; i < products.length; i++) {
    if (products[i].price > high.price) {
      high = products[i];
    }
  }

  return Math.floor(high.price);
};

// Select product with lowest price
export const selectMin = (products) => {
  if (!products || products.length === 0) return 0;
  let low = products[0];

  for (let i = 0; i < products.length; i++) {
    if (products[i].price < low.price) {
      low = products[i];
    }
  }

  return Math.floor(low.price);
};
