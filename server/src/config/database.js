import mongoose from 'mongoose';
import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';

// Backup original resolution functions
const originalResolveSrv = dnsPromises.resolveSrv;
const originalResolveTxt = dnsPromises.resolveTxt;

// Custom resolver pointed to public DNS servers (Google + Cloudflare)
const fallbackResolver = new dnsPromises.Resolver();
fallbackResolver.setServers(['8.8.8.8', '1.1.1.1']);

dnsPromises.resolveSrv = async function(hostname) {
  try {
    return await originalResolveSrv.call(this, hostname);
  } catch (err) {
    console.warn(`[DNS Fallback] Standard SRV resolution failed for ${hostname}: ${err.message}. Retrying with public DNS...`);
    try {
      return await fallbackResolver.resolveSrv(hostname);
    } catch (fallbackErr) {
      console.error(`[DNS Fallback] Public DNS SRV resolution also failed: ${fallbackErr.message}`);
      throw err;
    }
  }
};

dnsPromises.resolveTxt = async function(hostname) {
  try {
    return await originalResolveTxt.call(this, hostname);
  } catch (err) {
    console.warn(`[DNS Fallback] Standard TXT resolution failed for ${hostname}: ${err.message}. Retrying with public DNS...`);
    try {
      return await fallbackResolver.resolveTxt(hostname);
    } catch (fallbackErr) {
      console.error(`[DNS Fallback] Public DNS TXT resolution also failed: ${fallbackErr.message}`);
      throw err;
    }
  }
};

// Patch callback-based resolution just in case
const originalCallbackResolveSrv = dns.resolveSrv;
const originalCallbackResolveTxt = dns.resolveTxt;

dns.resolveSrv = function(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opt = typeof options === 'function' ? undefined : options;

  originalCallbackResolveSrv(hostname, opt, (err, addresses) => {
    if (err) {
      fallbackResolver.resolveSrv(hostname)
        .then(res => cb(null, res))
        .catch(() => cb(err, null));
    } else {
      cb(null, addresses);
    }
  });
};

dns.resolveTxt = function(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opt = typeof options === 'function' ? undefined : options;

  originalCallbackResolveTxt(hostname, opt, (err, addresses) => {
    if (err) {
      fallbackResolver.resolveTxt(hostname)
        .then(res => cb(null, res))
        .catch(() => cb(err, null));
    } else {
      cb(null, addresses);
    }
  });
};

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  const primaryUri = normalizeMongoUri(process.env.MONGODB_URI);
  const fallbackUri = 'mongodb://127.0.0.1:27017/ai_venture_studio';

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
      console.log('Active Store: Using MongoDB Atlas');
      return;
    } catch (err) {
      console.warn('Primary MongoDB Atlas connection failed:', err.message, '- attempting fallback.');
    }
  }

  try {
    await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Active Store: Using local mongod');
    return;
  } catch (_err) {
    console.warn('MongoDB cloud Atlas and local mongod unavailable - using persistent MemoryStore database.');
    console.log('Active Store: Using local MemoryStore fallback');
  }
}

function normalizeMongoUri(uri) {
  if (!uri?.startsWith('mongodb://') && !uri?.startsWith('mongodb+srv://')) return uri;

  const schemeEnd = uri.indexOf('://') + 3;
  const pathStart = uri.indexOf('/', schemeEnd);
  const authorityEnd = pathStart === -1 ? uri.length : pathStart;
  const authority = uri.slice(schemeEnd, authorityEnd);
  const atIndex = authority.lastIndexOf('@');

  if (atIndex === -1) return uri;

  const auth = authority.slice(0, atIndex);
  const hosts = authority.slice(atIndex + 1);
  const colonIndex = auth.indexOf(':');

  if (colonIndex === -1) return uri;

  const username = auth.slice(0, colonIndex);
  const password = auth.slice(colonIndex + 1);
  const encodedAuth = `${encodeCredential(username)}:${encodeCredential(password)}`;

  return `${uri.slice(0, schemeEnd)}${encodedAuth}@${hosts}${pathStart === -1 ? '' : uri.slice(pathStart)}`;
}

function encodeCredential(value) {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch (_error) {
    return encodeURIComponent(value);
  }
}
