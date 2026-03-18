import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
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
      try {
        if (account?.provider === 'google' && user.email) {
          console.log('[auth] Google sign-in attempt', { email: user.email, provider: account.provider })
          return true
        }
        return true
      } catch (err) {
        console.error('[auth] signIn callback error', err)
        return false
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          console.log('[auth] jwt callback: initial sign-in', { userId: user.id, email: user.email })
          // Look up username from DB since Google users won't have it on the user object
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
        // Re-check on subsequent calls — once username is set, clear the flag
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
      } catch (err) {
        console.error('[auth] jwt callback error', err)
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
