'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useSessionChecker() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch('/api/auth/session-check', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Session invalid');
                }

                const data = await response.json();

                if (!data.valid) {
                    // Session is expired or invalid
                    await signOut({ redirect: false });
                    router.push('/auth/login?message=Session expired');
                    return;
                }

                if (data.expires) {
                    const expiresAt = new Date(data.expires).getTime();
                    const now = Date.now();
                    const timeUntilExpiry = expiresAt - now;

                    // Schedule next check 1 minute before expiry, but at least 30 seconds from now
                    const checkInterval = Math.max(30000, timeUntilExpiry - 60000);

                    setTimeout(checkSession, checkInterval);
                }
            } catch (error) {
                console.error('Session check failed:', error);
                await signOut({ redirect: false });
                router.push('/auth/login?message=Session expired');
            }
        };

        // Initial check after component mounts
        const timer = setTimeout(checkSession, 5000); // Check 5 seconds after mount

        // Set up periodic checks every 5 minutes as fallback
        const interval = setInterval(checkSession, 5 * 60 * 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [router]);
}