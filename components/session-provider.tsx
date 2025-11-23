
'use client';

import { useSessionChecker } from '@/hooks/use-session-checker';

interface SessionProviderProps {
    children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    useSessionChecker();

    return <>{children}</>;
}