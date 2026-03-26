import { SignInButton } from "@/components/signin-button";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-zinc-500">Continue to your account</p>
        </div>
        <SignInButton />
      </div>
    </div>
  );
}
