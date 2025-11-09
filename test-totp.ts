// test-totp.ts
import { authenticator } from "otplib";

// Defaults: { step:30, digits:6, algorithm:'sha1' }
authenticator.options = { step: 30, window: 1 }; // window=1 accepts prev/next 30s code

const base32Secret = process.env.TOTP_SECRET!; // same string you stored / encoded in QR
const codeFromApp = process.argv[2];           // pass a code to test

const isValid = authenticator.check(codeFromApp, base32Secret);
console.log({ isValid, expected: authenticator.generate(base32Secret) });
