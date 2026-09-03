import Image from "next/image";

export default function PageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black" aria-label="Loading page">
      <Image src="/loading.gif" alt="Loading" width={320} height={180} priority />
    </main>
  );
}
