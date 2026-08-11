/**
 * Shared helper for every lib/api/* service function.
 *
 * Every service function is written with the exact async signature a real
 * backend call would have and always goes through `simulateNetwork()` for
 * latency. When a real backend exists, only the body of each function in
 * this directory needs to change (fixture read -> `fetch`) — call sites in
 * stores/components never change.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface SimulateOptions {
  /** min-max latency window in ms */
  latency?: [number, number];
  /** 0-1 chance of throwing an ApiError, for exercising error states */
  errorRate?: number;
  errorMessage?: string;
}

export async function simulateNetwork<T>(
  result: T | (() => T),
  options: SimulateOptions = {},
): Promise<T> {
  const { latency = [250, 650], errorRate = 0, errorMessage } = options;
  const ms = latency[0] + Math.random() * (latency[1] - latency[0]);
  await new Promise((resolve) => setTimeout(resolve, ms));

  if (errorRate > 0 && Math.random() < errorRate) {
    throw new ApiError(
      errorMessage ?? "Something went wrong while processing your request.",
      "SIMULATED_FAILURE",
    );
  }

  return typeof result === "function" ? (result as () => T)() : result;
}

/** Longer, staged delay for AI-generation style operations (report/playbook/etc). */
export async function simulateGeneration<T>(
  result: T | (() => T),
  options: SimulateOptions = {},
): Promise<T> {
  return simulateNetwork(result, { latency: [1400, 2600], ...options });
}
