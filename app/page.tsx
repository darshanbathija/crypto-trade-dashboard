'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Crypto Trade Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
      </div>
    </main>
  );
}
