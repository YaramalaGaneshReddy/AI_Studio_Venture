import mongoose from 'mongoose';

export async function connectDatabase() {
  const primaryUri = normalizeMongoUri(process.env.MONGODB_URI);
  const fallbackUri = 'mongodb://127.0.0.1:27017/ai_venture_studio';

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
      console.log('MongoDB connected (Atlas)');
      return;
    } catch (err) {
      console.warn('Primary MongoDB Atlas connection failed:', err.message, '- attempting local fallback.');
    }
  }

  try {
    await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected (Local mongod)');
    return;
  } catch (_err) {
    console.warn('Local mongod not running - starting in-memory database...');
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log('MongoDB connected (In-Memory Database Ready)');
  } catch (err) {
    console.error('All MongoDB connection options failed:', err.message);
    throw err;
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
