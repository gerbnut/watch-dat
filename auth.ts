import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if ((account?.provider === 'google' || account?.provider === 'apple') && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        })
        if (existingUser && account) {
          // Link the OAuth account to the existing user if not already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token as string | undefined,
                token_type: account.token_type as string | undefined,
                id_token: account.id_token as string | undefined,
                refresh_token: account.refresh_token as string | undefined,
                scope: account.scope as string | undefined,
                expires_at: account.expires_at as number | undefined,
              },
            })
          }
          // Override the user id so the JWT callback gets the right user
          user.id = existingUser.id
        }
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { username: true, displayName: true, avatar: true },
        })
        token.username = dbUser?.username
        token.displayName = dbUser?.displayName
        token.needsUsername = !dbUser?.username
        const av = dbUser?.avatar as string | null
        token.avatar = av?.startsWith('data:') ? null : av
      }
      if (token.needsUsername) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true },
        })
        if (dbUser?.username) {
          token.needsUsername = false
          token.username = dbUser.username
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = (token.username as string) ?? null
        session.user.displayName = (token.displayName as string) ?? null
        session.user.image = token.avatar as string | null
        session.user.needsUsername = token.needsUsername as boolean
      }
      return session
    },
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [Apple({
          clientId: process.env.APPLE_ID,
          clientSecret: process.env.APPLE_SECRET,
        })]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatar: true,
            password: true,
          },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        }
      },
    }),
  ],
})
