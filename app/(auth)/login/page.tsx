"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { Character, HomeIcon, Logo } from "@/assets";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <>
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        {/* Left panel — hidden on small screens, shown on lg+ */}
        <div className="hidden lg:flex w-full h-screen bg-primary flex-col justify-center items-center px-20 relative">
          <Image
            width={1000}
            height={1000}
            alt="Character"
            src={Character}
            className="w-auto h-130 object-contain z-20"
          />
          <div className="z-30 text-white max-w-xs">
            <h2 className="text-3xl font-bold text-center mb-2">
              Welcome Back!
            </h2>
            <p className="text-sm opacity-90 text-center">
              Manage your content efficiently and keep your website up-to-date.
            </p>
          </div>
        </div>

        {/* Right panel — full width on mobile, half on lg+ */}
        <div className="w-full min-h-screen lg:h-screen bg-white flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 gap-2 relative py-12 lg:py-0">
          <Link
            href={`https://igaminglink.vercel.app`}
            target="_blank"
            className="absolute right-6 top-6 sm:right-8 sm:top-8 size-10 sm:size-12 rounded-full flex justify-center items-center bg-primary"
          >
            <HomeIcon />
          </Link>

          <div className="text-center flex flex-col justify-center items-center gap-2">
            <Image
              width={100}
              height={100}
              src={Logo}
              alt="iGaming Log"
              className="w-auto h-16 sm:h-20 object-contain"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              iGamingLink Admin
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage your content
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full max-w-[500px] mt-2"
          >
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              className="bg-gray-100 border-gray-200 text-text-main placeholder:text-slate-500"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="bg-gray-100 border-gray-200 text-text-main placeholder:text-slate-500"
            />

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={loading}
              className="mt-2 w-full py-3"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}


// "use client";

// import { useState, FormEvent } from "react";
// import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { Input } from "@/components/ui/Input";
// import { Button } from "@/components/ui/Button";
// import Image from "next/image";
// import { Character, HomeIcon, Logo } from "@/assets";
// import Link from "next/link";

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(e: FormEvent) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const result = await signIn("credentials", {
//       email,
//       password,
//       redirect: false,
//     });

//     setLoading(false);

//     if (result?.ok) {
//       router.push("/admin/dashboard");
//     } else {
//       setError("Invalid email or password.");
//     }
//   }

//   return (
//     <>
//       <div className="w-full h-screen flex justify-betwee">
//         <div className="w-full h-full bg-primary flex flex-col justify-center items-center px-20 relative">
//           <Image
//             width={1000}
//             height={1000}
//             alt="Character"
//             src={Character}
//             className="w-auto h-130 object-contain z-20"
//           />
//           <div className="z-30 text-white max-w-xs">
//             <h2 className="text-3xl font-bold text-center mb-2">
//               Welcome Back!
//             </h2>
//             <p className="text-sm opacity-90 text-center">
//               Manage your content efficiently and keep your website up-to-date.
//             </p>
//           </div>
//         </div>
//         <div className="w-full h-full bg-white flex flex-col justify-center items-center px-20 gap-2 relative">
//           <Link
//             href={`https://igaminglink.vercel.app`}
//             target="_blank"
//             className="absolute right-8 top-8 size-12 rounded-full flex justify-center items-center bg-primary"
//           >
//             <HomeIcon />
//           </Link>
//           <div className="text-center flex flex-col justify-center items-center gap-2">
//             <Image
//               width={100}
//               height={100}
//               src={Logo}
//               alt="iGaming Log"
//               className="w-auto h-20 object-contain"
//             />
//             <h1 className="text-2xl font-bold text-primary">
//               iGamingLink Admin
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Sign in to manage your content
//             </p>
//           </div>
//           <form
//             onSubmit={handleSubmit}
//             className="flex flex-col gap-4 w-full max-w-[500px]"
//           >
//             <Input
//               label="Email address"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Enter your email address"
//               required
//               autoComplete="email"
//               className="bg-gray-100 border-gray-200 text-text-main placeholder:text-slate-500"
//             />
//             <Input
//               label="Password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter your password"
//               required
//               autoComplete="current-password"
//               className="bg-gray-100 border-gray-200 text-text-main placeholder:text-slate-500"
//             />

//             {error && (
//               <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
//                 {error}
//               </p>
//             )}

//             <Button
//               type="submit"
//               loading={loading}
//               className="mt-2 w-full py-3"
//             >
//               Sign in
//             </Button>
//           </form>
//         </div>
//       </div>

//     </>
//   );
// }
