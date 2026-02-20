import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { _prismaInstance: PrismaClient | undefined }

function getInstance(): PrismaClient {
  if (!globalForPrisma._prismaInstance) {
    globalForPrisma._prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma._prismaInstance
}

// Proxy-based lazy singleton: PrismaClient is never instantiated at module load
// time — only when the first actual database call is made.
export const prisma = new Proxy({} as unknown as PrismaClient, {
  get(_: unknown, prop: string | symbol) {
    const instance = getInstance()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? (value as Function).bind(instance) : value
  },
}) as PrismaClient
