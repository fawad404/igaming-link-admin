import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

global._mongoosePromise ??= null;

export async function connectDB() {
  // Already connected — fastest path
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose
      .connect(MONGODB_URI)
      .catch((err) => {
        global._mongoosePromise = null; // allow retry on next request
        throw err;
      });
  }

  await global._mongoosePromise;
  return mongoose;
}
