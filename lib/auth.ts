import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import "@/lib/models/Role";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();
        } catch (err) {
          console.error("[auth] DB connection failed:", err);
          throw new Error("Database unavailable. Please try again.");
        }

        const user = await User.findOne({ email: credentials.email, isActive: true })
          .populate("role")
          .lean();

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        const roleDoc = user.role as unknown as { name: string; permissions: string[] } | null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: roleDoc?.name ?? "viewer",
          permissions: roleDoc?.permissions ?? [],
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.permissions = token.permissions ?? [];
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
