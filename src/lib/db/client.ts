// Thin Postgres data-access layer with the same shape as the Appwrite
// Databases API the app used (minus the database id argument), so call sites
// barely change:
//   db.listDocuments(COLLECTION, [Query.equal(...), Query.limit(10)]) -> { documents, total }
//   db.getDocument(COLLECTION, id)                    -> doc (DbError 404 when missing)
//   db.createDocument(COLLECTION, id, data)           -> doc (DbError 409 on id/unique clash)
//   db.updateDocument(COLLECTION, id, partial)        -> doc (404 missing, 409 unique clash)
//   db.deleteDocument(COLLECTION, id)                 -> void (404 missing)
// Documents come back as { $id, $createdAt, $updatedAt, ...camelCaseFields },
// timestamps as ISO strings, absent values as null.
import type { PoolClient, QueryResultRow } from "pg"
import collectionsJson from "./collections.json"
import { getPool } from "./pool"
import { DbError, type DbQuery } from "./query"

type ColType = "text" | "int" | "float" | "bool" | "timestamptz" | "text[]"
type Collection = { table: string; fields: Record<string, [string, ColType]> }
const COLLECTIONS = collectionsJson as unknown as Record<string, Collection>

// Loosely typed like Appwrite's Models.Document so existing call sites keep compiling.
export type Doc = { $id: string; $createdAt: string; $updatedAt: string; [k: string]: any }
export type DocumentList<T> = { total: number; documents: T[] }

const DEFAULT_LIMIT = 25 // Appwrite's default page size
const MAX_LIMIT = 5000

function coll(name: string): Collection {
  const c = COLLECTIONS[name]
  if (!c) throw new Error(`Unknown collection: ${name}`)
  return c
}

function col(c: Collection, field: string): [string, ColType] {
  const f = c.fields[field]
  if (!f) throw new Error(`Unknown field "${field}" on ${c.table}`)
  return f
}

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`

function toDb(type: ColType, value: unknown): unknown {
  if (value === undefined || value === null) return null
  switch (type) {
    case "timestamptz":
      if (value === "") return null // Appwrite apps cleared datetimes with ""
      if (value instanceof Date) return value.toISOString()
      return String(value)
    case "int":
      return Math.trunc(Number(value))
    case "float":
      return Number(value)
    case "bool":
      return Boolean(value)
    case "text[]":
      return Array.isArray(value) ? value.map(String) : [String(value)]
    default:
      return typeof value === "string" ? value : String(value)
  }
}

function fromRow(c: Collection, row: QueryResultRow): Doc {
  const doc: Record<string, unknown> = {}
  for (const [field, [column, type]] of Object.entries(c.fields)) {
    let v = row[column]
    if (v instanceof Date) v = v.toISOString()
    if (v === undefined) v = null
    if (type === "text[]" && v === null) v = []
    doc[field] = v
  }
  return doc as Doc
}

/** Build column/value lists from a partial document, ignoring Appwrite system keys. */
function columnsFor(c: Collection, data: Record<string, unknown>, opts: { allowSystem: boolean }) {
  const cols = new Map<string, unknown>()
  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (field === "$id" || field === "$permissions" || field === "$collectionId" || field === "$databaseId") continue
    if ((field === "$createdAt" || field === "$updatedAt") && !opts.allowSystem) continue
    const [column, type] = col(c, field)
    // An app-level createdAt shares the created_at column with $createdAt; the app value wins.
    if (field === "$createdAt" && cols.has(column)) continue
    cols.set(column, toDb(type, value))
  }
  return cols
}

function pgCode(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : undefined
}

type Runner = { query: PoolClient["query"] }

function makeDb(runner: () => Runner) {
  return {
    async listDocuments<T = Doc>(collection: string, queries: DbQuery[] = []): Promise<DocumentList<T>> {
      const c = coll(collection)
      const where: string[] = []
      const params: unknown[] = []
      const order: string[] = []
      let limit = DEFAULT_LIMIT
      let offset = 0
      let cursor: string | null = null
      const p = (v: unknown) => {
        params.push(v)
        return `$${params.length}`
      }
      for (const qq of queries) {
        switch (qq.op) {
          case "equal": {
            const [column, type] = col(c, qq.field)
            const values = Array.isArray(qq.value) ? qq.value : [qq.value]
            if (values.length === 0) {
              where.push("false")
            } else if (type === "text[]") {
              where.push(`${q(column)} && ${p(values.map(String))}::text[]`)
            } else {
              const cast = type === "timestamptz" ? "timestamptz" : type === "int" ? "int" : type === "float" ? "float8" : type === "bool" ? "bool" : "text"
              where.push(`${q(column)} = ANY(${p(values.map((v) => toDb(type, v)))}::${cast}[])`)
            }
            break
          }
          case "greaterThanEqual":
          case "lessThanEqual":
          case "greaterThan":
          case "lessThan": {
            const [column, type] = col(c, qq.field)
            const sym = { greaterThanEqual: ">=", lessThanEqual: "<=", greaterThan: ">", lessThan: "<" }[qq.op]
            where.push(`${q(column)} ${sym} ${p(toDb(type, qq.value))}`)
            break
          }
          case "orderAsc":
          case "orderDesc":
            order.push(`${q(col(c, qq.field)[0])} ${qq.op === "orderAsc" ? "ASC" : "DESC"}`)
            break
          case "limit":
            limit = Math.max(0, Math.min(MAX_LIMIT, Math.trunc(qq.value)))
            break
          case "offset":
            offset = Math.max(0, Math.trunc(qq.value))
            break
          case "cursorAfter":
            cursor = qq.value
            break
          case "select":
            break
        }
      }
      const filter = where.length ? `WHERE ${where.join(" AND ")}` : ""
      const table = q(c.table)
      // total = all matches ignoring limit/offset/cursor (as Appwrite reports it).
      const countSql = `SELECT count(*)::int AS n FROM ${table} ${filter}`
      let pageFilter = filter
      if (cursor !== null) {
        if (order.length) throw new Error("cursorAfter is only supported with the default ordering")
        const cond = `(created_at, id) > (SELECT created_at, id FROM ${table} WHERE id = ${p(cursor)})`
        pageFilter = filter ? `${filter} AND ${cond}` : `WHERE ${cond}`
      }
      const orderBy = `ORDER BY ${[...order, "created_at ASC", "id ASC"].join(", ")}`
      const r = runner()
      const pageSql = `SELECT * FROM ${table} ${pageFilter} ${orderBy} LIMIT ${limit} OFFSET ${offset}`
      const countParams = cursor !== null ? params.slice(0, -1) : params
      const [rows, count] = await Promise.all([r.query(pageSql, params), r.query(countSql, countParams)])
      return { total: count.rows[0]?.n ?? 0, documents: rows.rows.map((row) => fromRow(c, row) as T) }
    },

    async getDocument<T = Doc>(collection: string, id: string): Promise<T> {
      const c = coll(collection)
      const res = await runner().query(`SELECT * FROM ${q(c.table)} WHERE id = $1`, [id])
      if (!res.rows[0]) throw new DbError(404, `Document ${id} not found in ${collection}`)
      return fromRow(c, res.rows[0]) as T
    },

    /** Insert; DbError 409 when the id or a unique column (e.g. reference) already exists. */
    async createDocument<T = Doc>(collection: string, id: string, data: Record<string, unknown>): Promise<T> {
      const c = coll(collection)
      const cols = columnsFor(c, data, { allowSystem: true })
      const names = ["id", ...cols.keys()]
      const values = [id, ...cols.values()]
      const sql = `INSERT INTO ${q(c.table)} (${names.map(q).join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) ON CONFLICT DO NOTHING RETURNING *`
      const res = await runner().query(sql, values)
      if (!res.rows[0]) throw new DbError(409, `Document with the same id or unique key already exists in ${collection}`)
      return fromRow(c, res.rows[0]) as T
    },

    async updateDocument<T = Doc>(collection: string, id: string, data: Record<string, unknown> = {}): Promise<T> {
      const c = coll(collection)
      const cols = columnsFor(c, data, { allowSystem: false })
      const sets = [...cols.keys()].map((k, i) => `${q(k)} = $${i + 2}`)
      sets.push("updated_at = now()")
      try {
        const res = await runner().query(`UPDATE ${q(c.table)} SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, [id, ...cols.values()])
        if (!res.rows[0]) throw new DbError(404, `Document ${id} not found in ${collection}`)
        return fromRow(c, res.rows[0]) as T
      } catch (e) {
        if (pgCode(e) === "23505") throw new DbError(409, `Unique constraint violated in ${collection}`)
        throw e
      }
    },

    async deleteDocument(collection: string, id: string): Promise<void> {
      const c = coll(collection)
      const res = await runner().query(`DELETE FROM ${q(c.table)} WHERE id = $1`, [id])
      if (!res.rowCount) throw new DbError(404, `Document ${id} not found in ${collection}`)
    },

    /** Atomically add/remove a value in a text[] field (used for likes). */
    async toggleArrayValue<T = Doc>(collection: string, id: string, field: string, value: string, present: boolean): Promise<T> {
      const c = coll(collection)
      const [column, type] = col(c, field)
      if (type !== "text[]") throw new Error(`${field} is not an array field`)
      const expr = present
        ? `CASE WHEN $2 = ANY(${q(column)}) THEN ${q(column)} ELSE array_append(${q(column)}, $2) END`
        : `array_remove(${q(column)}, $2)`
      const res = await runner().query(`UPDATE ${q(c.table)} SET ${q(column)} = ${expr}, updated_at = now() WHERE id = $1 RETURNING *`, [id, value])
      if (!res.rows[0]) throw new DbError(404, `Document ${id} not found in ${collection}`)
      return fromRow(c, res.rows[0]) as T
    },
  }
}

export type Db = ReturnType<typeof makeDb>

/** Shared database handle (uses the lazily-created pool). */
export const db: Db = makeDb(() => getPool())

/** Raw SQL escape hatch. */
export async function sql<R extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<R>(text, params)
}
