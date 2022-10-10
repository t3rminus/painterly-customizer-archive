export const createSortArray = (str) =>
  str.split(',').reduce((obj, val, idx) => {
    obj[val] = idx;
    return obj;
  }, {});