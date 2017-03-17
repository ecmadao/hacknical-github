const SPLIT_NUM = 20;

/**
 * split array by max array length
 *
 * @example
 * get -> [1, 2, 3, 4, 5, 6, 7], 3
 * return -> [[1, 2, 3], [4, 5, 6], [7]]
 */

export const splitArray = (array, max = SPLIT_NUM) => {
  const arrayLength = array.length;
  if (arrayLength <= max) {
    return [array];
  }
  const loop = Math.floor(arrayLength / max) + 1;
  return new Array(loop).fill(0).map((i, index) => {
    return array.slice(index * max, (index + 1) * max)
  });
};

/**
 * split array by max array length
 *
 * @example
 * get -> [[1, 2, 3], [4, 5, 6], [7]]
 * return -> [1, 2, 3, 4, 5, 6, 7]
 */

export const flatArray = (arraies) => {
  let result = [];
  arraies.forEach(array => result = result.concat(array));
  return result;
};

export const flattenObject = (object) => {
  let result = '';
  Object.keys(object).forEach((key) => {
    result += `${key}=${object[key]}&`;
  });
  return result
};
