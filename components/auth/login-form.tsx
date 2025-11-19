"use client";

import { signIn } from "next-auth/react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

// Додаємо optional code для 2FA
const FormSchema = LoginSchema.extend({
    code: z.string().optional(),
});

export const LoginForm = () => {
    const searchParams = useSearchParams();
    const callbackFromQuery = searchParams.get("callbackUrl");
    const callbackUrl = callbackFromQuery || "/vault";

    const urlError =
        searchParams.get("error") === "OAuthAccountNotLinked"
            ? "Email already in use with different provider!"
            : "";

    //  ⬇️ краще стартувати з undefined, а не з порожнього рядка
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState<string | undefined>(undefined);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { email: "", password: "", code: "" },
    });

    const handleSubmit = (values: z.infer<typeof FormSchema>) => {
        setError(undefined);
        setSuccess(undefined);

        startTransition(async () => {
            try {
                const twoFactorCode = values.code?.trim() || undefined;

                const res = await signIn("credentials", {
                    redirect: false,
                    email: values.email,
                    password: values.password,
                    twoFactorCode,
                    callbackUrl,
                });

                console.log("[LOGIN FORM] signIn result:", res);

                // Якщо взагалі нічого не повернулось — щось пішло дуже не так
                if (!res) {
                    setError("Something went wrong");
                    return;
                }

                // ✅ Успішний логін
                if (res.ok && !res.error) {
                    const target = res.url || callbackUrl || "/";
                    window.location.href = target;
                    return;
                }

                // 🟡 Випадок, коли перший запит каже "треба 2FA"
                // (authorize повернув pending2FA, а signIn не дав помилки)
                if (!res.error && !showTwoFactor) {
                    setShowTwoFactor(true);
                    return;
                }

                // 🔴 Помилка логіну
                if (res.error) {
                    if (res.error === "CredentialsSignin") {
                        setError("Invalid email or password");
                    } else {
                        setError(res.error);
                    }
                    // На будь-яку помилку вимикаємо 2FA-екран, щоб юзер міг спробувати ще раз
                    setShowTwoFactor(false);
                    return;
                }

                // fallback
                setError("Something went wrong");
            } catch (e) {
                console.error("[LOGIN FORM] signIn error:", e);
                setError("Something went wrong");
            }
        });
    };

    return (
        <CardWrapper
            headerLabel="Welcome back"
            backButtonLabel="Don't have an account?"
            backButtonHref="/auth/register"
            showSocial={false} // соц. логін ти вже відключив
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        {showTwoFactor && (
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Two Factor Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="123456"
                                                inputMode="numeric"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {!showTwoFactor && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                    placeholder="john.doe@example.com"
                                                    type="email"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                    placeholder="******"
                                                    type="password"
                                                />
                                            </FormControl>
                                            <Button
                                                size="sm"
                                                variant="link"
                                                asChild
                                                className="px-0 font-normal"
                                            >
                                                <Link href="/auth/reset">Forgot password?</Link>
                                            </Button>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                    </div>

                    <FormError message={error || urlError} />
                    <FormSuccess message={success} />

                    <Button disabled={isPending} type="submit" className="w-full">
                        {showTwoFactor ? "Confirm" : "Login"}
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    );
};
