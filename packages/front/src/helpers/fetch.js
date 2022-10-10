export const get = async (url, type = 'json') => {
  const response = await fetch(url);
  return response[type]();
};
