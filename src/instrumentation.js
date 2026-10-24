export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Agent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(
    new Agent({
      connect: { timeout: 30_000 },
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: 2_000,
      keepAliveTimeout: 60_000,
      keepAliveMaxTimeout: 10 * 60_000,
    })
  );
}
