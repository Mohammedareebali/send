export class PrismaClient {
  [key: string]: any
}


export function Prisma() {}



export namespace Prisma {
  // Original exports
  export type RunGetPayload<T> = any
  export interface RunWhereInput {}
  export const sql: any = undefined
  export const join: any = undefined
  export const empty: any = undefined
  export const raw: any = undefined

  // Newly added exports
  export type JsonObject = any
  export type TransactionClient = PrismaClient
}
