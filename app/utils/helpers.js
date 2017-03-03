export const flattenObject = (object) => {
  let result = '';
  Object.keys(object).forEach((key) => {
    result += `${key}=${object[key]}&`;
  });
  return result
};
