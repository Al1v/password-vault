// app/api/auth/session-check/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json(
                { valid: false, message: 'No active session' },
                { status: 401 }
            );
        }

        // Check if session is expired (you might need to adjust this based on your JWT setup)
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiry = (session as any).exp || 0;

        if (tokenExpiry && now >= tokenExpiry) {
            return NextResponse.json(
                { valid: false, message: 'Session expired' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            valid: true,
            expires: tokenExpiry ? new Date(tokenExpiry * 1000).toISOString() : null,
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            }
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { valid: false, message: 'Session validation failed' },
            { status: 500 }
        );
    }
}