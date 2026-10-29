module.exports = {
  parse: (str) => {
    if (!str) return {};
    const cleanStr = str.startsWith('?') ? str.slice(1) : str;
    const params = new URLSearchParams(cleanStr);
    const result = {};
    for (const [k, v] of params.entries()) {
      result[k] = v;
    }
    return result;
  },
  stringifyUrl: ({ url, query }) => {
    const params = new URLSearchParams();
    for (const key in query) {
      if (query[key] !== undefined && query[key] !== null) {
        params.set(key, query[key]);
      }
    }
    const q = params.toString();
    return q ? `${url}?${q}` : url;
  },
  stringify: (obj) => {
    const params = new URLSearchParams(obj);
    return params.toString();
  },
};
