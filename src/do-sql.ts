import type { Db } from "./db";

/** Db adapter over Durable Object SQLite storage (synchronous API). */
export function durableObjectDb(storage: DurableObjectStorage): Db {
  const sql = storage.sql;
  const stmt = (text: string) => ({
    all: (...params: unknown[]) => sql.exec(text, ...(params as SqlStorageValue[])).toArray(),
    get: (...params: unknown[]) => sql.exec(text, ...(params as SqlStorageValue[])).toArray()[0] ?? null,
    run: (...params: unknown[]) => {
      const cur = sql.exec(text, ...(params as SqlStorageValue[]));
      cur.toArray();
      const lastInsertRowid = Number(sql.exec("SELECT last_insert_rowid() AS id").one().id);
      return { changes: cur.rowsWritten, lastInsertRowid };
    },
  });
  return {
    query: stmt,
    prepare: stmt,
    run: (text, ...params) => {
      sql.exec(text, ...(params as SqlStorageValue[])).toArray();
    },
    exec: (text) => {
      sql.exec(text).toArray();
    },
    transaction: <A extends unknown[], R>(fn: (...args: A) => R) =>
      (...args: A): R => storage.transactionSync(() => fn(...args)),
  };
}
