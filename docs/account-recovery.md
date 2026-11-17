# Account recovery

Classroom uses Better Auth’s one-time password-reset links. A visitor opens `/forgot-password`, submits an email address, and always receives the same confirmation message to prevent account enumeration. The server sends the link only through the configured transactional mail transport; reset tokens expire after 30 minutes.

Set `RESEND_API_KEY` and `EMAIL_FROM` in every production environment. The server-side mail transport calls Resend over HTTPS; neither credential is sent to a browser. If either is missing in production, mail delivery fails closed rather than pretending recovery succeeded. Development uses `EMAIL_MODE=local` by default. It stores messages in a process-local development mailbox; open `http://localhost:3000/api/dev/email-inbox`, copy the verification link from the returned message, and open it in the browser. The mailbox is unavailable in production and is cleared when the dev server restarts. Development never prints recipient addresses, tokens, or links to server logs.

Email verification is required by default. For a temporary deployment without a
configured mail sender, set `REQUIRE_EMAIL_VERIFICATION=false`. This also disables
verification delivery on sign-up. Remove the override or set it to `true` before
relying on verified email ownership.

To use a real provider locally, set `EMAIL_MODE=resend`, `RESEND_API_KEY`, and `EMAIL_FROM`. The sender must be verified with Resend. Better Auth returns a forbidden response for sign-in while `emailVerified` is false. Sign-in does not synchronously call the mail provider; use the resend-verification action on the sign-in form or `POST /api/auth/send-verification-email` with `{ "email": "user@example.test", "callbackURL": "/app" }`. Provider requests have an eight-second timeout.

Resetting a password revokes every active session. Better Auth’s Prisma adapter is configured for transactions, so token consumption, session revocation, and password replacement succeed or fail together. Users who cannot access their inbox must contact the class administrator or support; staff must verify the account holder through an out-of-band policy before initiating a recovery workflow.

