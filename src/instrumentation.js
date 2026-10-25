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

  if (process.env.NODE_ENV === "production" && process.env.WARM_FREE_LIBRARY !== "0") {
    setTimeout(async () => {
      const [{ FREE_TOPICS }, { fetchFreeBooks }] = await Promise.all([
        import("@/lib/freeTopics"),
        import("@/lib/openlibrary"),
      ]);
      for (const { value } of FREE_TOPICS) {
        await fetchFreeBooks({ topic: value, page: 0 }).catch(() => {});
      }
    }, 5000);
  }
}
