import { Suspense } from "react";
import { ConsentContent } from "./consent-content";

function ConsentLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<ConsentLoadingFallback />}>
      <ConsentContent />
    </Suspense>
  );
}
