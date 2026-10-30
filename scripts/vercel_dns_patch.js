const dns = require('dns');

// Live reachable Vercel Anycast IPs on this network:
const HEALTHY_VERCEL_IPS = ['76.76.21.9', '76.76.21.61', '76.76.21.98', '76.76.21.142'];

const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'api.vercel.com' || (typeof hostname === 'string' && hostname.endsWith('.vercel.app'))) {
    if (options && options.all) {
      return callback(null, HEALTHY_VERCEL_IPS.map(ip => ({ address: ip, family: 4 })));
    }
    return callback(null, HEALTHY_VERCEL_IPS[0], 4);
  }
  return originalLookup(hostname, options, callback);
};
