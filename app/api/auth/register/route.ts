import { NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";

import {
    generateVerificationToken,
} from "@/lib/tokens";

import {
    sendVerificationEmail,
} from "@/lib/mail";

type RegisterResult = {
    error?: string;
    success?: string;
};

export async function POST(req: Request): Promise<Response> {
    try {
        const body = await req.json();
        const parsed = RegisterSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json<RegisterResult>(
                { error: "Invalid fields!" },
                { status: 400 },
            );
        }

        const { email, password, name } = parsed.data;

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json<RegisterResult>(
                { error: "Email already in use!" },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        return NextResponse.json<RegisterResult>({
            success: "created",
        });
    } catch (error) {
        console.error("[REGISTER] error:", error);

        return NextResponse.json<RegisterResult>(
            { error: "Something went wrong!" },
            { status: 500 },
        );
    }
}
