import { PrismaClient } from '@prisma/client'

declare global {
  // évite les doublons lors du rechargement en dev
  // @ts-ignore
  var prisma: PrismaClient
}

export const prisma = global.prisma
  // @ts-ignore
  ?? new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  global.prisma = prisma
}
