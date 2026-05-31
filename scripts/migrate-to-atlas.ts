import path from "path";
import dotenv from "dotenv";
import mongoose, { Connection } from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sourceUri = process.env.SOURCE_MONGODB_URI || process.env.MONGODB_URI;
const targetUri = process.env.ATLAS_MONGODB_URI;

if (!sourceUri) {
  throw new Error("Please define SOURCE_MONGODB_URI or MONGODB_URI for the local database.");
}

if (!targetUri) {
  throw new Error("Please define ATLAS_MONGODB_URI for the Atlas database.");
}

async function connect(uri: string): Promise<Connection> {
  const connection = mongoose.createConnection(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  return connection.asPromise();
}

async function copyCollection(source: Connection, target: Connection, name: string) {
  const sourceDb = source.db;
  const targetDb = target.db;

  if (!sourceDb || !targetDb) {
    throw new Error("Database connections were not initialized correctly.");
  }

  if (name.startsWith("system.")) {
    console.log(`Skipping system collection: ${name}`);
    return;
  }

  const sourceCollection = sourceDb.collection(name);
  const targetCollection = targetDb.collection(name);

  const documents = await sourceCollection.find({}).toArray();
  const indexes = await sourceCollection.indexes();

  await targetCollection.drop().catch(() => undefined);

  if (documents.length > 0) {
    await targetCollection.insertMany(documents, { ordered: false });
  } else {
    await targetDb.createCollection(name).catch(() => undefined);
  }

  for (const index of indexes) {
    if (index.name === "_id_") {
      continue;
    }

    const { key, v, ns, ...options } = index as Record<string, unknown> & {
      key: Record<string, 1 | -1 | "text" | "2dsphere" | "2d">;
      name?: string;
    };

    delete (options as Record<string, unknown>).name;
    delete (options as Record<string, unknown>).background;

    await targetCollection.createIndex(key, options as Parameters<typeof targetCollection.createIndex>[1]);
  }

  console.log(`Copied ${documents.length} documents from ${name}`);
}

async function main() {
  console.log("Connecting to source database...");
  const source = await connect(sourceUri!);

  console.log("Connecting to Atlas database...");
  const target = await connect(targetUri!);

  const sourceDb = source.db;
  const targetDb = target.db;

  if (!sourceDb || !targetDb) {
    throw new Error("Database connections were not initialized correctly.");
  }

  try {
    const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();

    for (const collection of collections) {
      await copyCollection(source, target, collection.name);
    }

    console.log("Atlas migration completed successfully.");
  } finally {
    await source.close().catch(() => undefined);
    await target.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("Atlas migration failed:", error);
  process.exit(1);
});