import { SignOutError } from "../../errors.js";
/**
 * Destroys the session.
 * If the session strategy is database,
 * The session is also deleted from the database.
 * In any case, the session cookie is cleared and
 * {@link EventCallbacks.signOut} is emitted.
 */
export async function signOut(cookies, sessionStore, options) {
    const { jwt, events, callbackUrl: redirect, logger, session } = options;
    const sessionToken = sessionStore.value;
    if (!sessionToken)
        return { redirect, cookies };
    try {
        if (session.strategy === "jwt") {
            const salt = options.cookies.sessionToken.name;
            const token = await jwt.decode({ ...jwt, token: sessionToken, salt });
            await events.signOut?.({ token });
        }
        else {
            const session = await options.adapter?.deleteSession(sessionToken);
            await events.signOut?.({ session });
        }
    }
    catch (e) {
        logger.error(new SignOutError(e));
    }
    cookies.push(...sessionStore.clean());
    return { redirect, cookies };
}
