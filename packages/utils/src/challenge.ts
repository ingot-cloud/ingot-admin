export const CHALLENGE_REQUIRED_CODE = "CHALLENGE_REQUIRED";
export const MAX_CHALLENGE_RETRIES = 2;

export interface ChallengeRequiredData {
  vcType: string;
  checkPath: string;
  scope: string;
  scopeParam: string;
  passTokenParam: string;
}

interface ChallengeErrorBody {
  code?: string;
  msg?: string;
  message?: string;
  data?: Partial<ChallengeRequiredData>;
}

let challengeSolver: ((data: ChallengeRequiredData) => Promise<string>) | undefined;
const scopeTokenPromises = new Map<string, Promise<string>>();
let challengeQueue: Promise<void> = Promise.resolve();

export function bindChallengeSolver(
  solver: (data: ChallengeRequiredData) => Promise<string>,
): void {
  challengeSolver = solver;
}

export function unbindChallengeSolver(
  solver: (data: ChallengeRequiredData) => Promise<string>,
): void {
  if (challengeSolver === solver) {
    challengeSolver = undefined;
  }
}

export function parseChallengeRequired(
  status?: number,
  body?: unknown,
): ChallengeRequiredData | null {
  if (status !== 412 || !body || typeof body !== "object") {
    return null;
  }
  const payload = body as ChallengeErrorBody;
  if (payload.code !== CHALLENGE_REQUIRED_CODE) {
    return null;
  }
  const data = payload.data;
  if (!data) {
    return null;
  }
  const { vcType, checkPath, scope, scopeParam, passTokenParam } = data;
  if (!vcType || !checkPath || !scope || !scopeParam || !passTokenParam) {
    return null;
  }
  return { vcType, checkPath, scope, scopeParam, passTokenParam };
}

export function isCaptchaRequestUrl(url?: string): boolean {
  if (!url) {
    return false;
  }
  const path = url.split("?")[0];
  return /\/vc(?:\/|$)/.test(path);
}

export function toFrontendCaptchaPath(gatewayPath: string): string {
  const path = gatewayPath.startsWith("/") ? gatewayPath : `/${gatewayPath}`;
  if (path.startsWith("/api/")) {
    return path;
  }
  return `/api${path}`;
}

export function buildCaptchaGetPath(vcType: string): string {
  return toFrontendCaptchaPath(`/vc/${vcType}`);
}

export function buildCaptchaCheckPath(checkPath: string): string {
  return toFrontendCaptchaPath(checkPath);
}

export function buildChallengeHeaders(
  data: ChallengeRequiredData,
  passToken: string,
): Record<string, string> {
  return {
    [data.passTokenParam]: passToken,
    [data.scopeParam]: data.scope,
  };
}

export function readPassToken(
  payload: Record<string, unknown> | undefined,
  passTokenParam: string,
): string | undefined {
  if (!payload) {
    return undefined;
  }
  const value = payload[passTokenParam];
  return typeof value === "string" && value ? value : undefined;
}

export function nextChallengeRetryCount(current?: number): number {
  return (current ?? 0) + 1;
}

export function isChallengeRetryExceeded(
  count: number,
  max = MAX_CHALLENGE_RETRIES,
): boolean {
  return count > max;
}

export async function obtainChallengePassToken(data: ChallengeRequiredData): Promise<string> {
  const existing = scopeTokenPromises.get(data.scope);
  if (existing) {
    return existing;
  }
  if (!challengeSolver) {
    throw new Error("安全验证组件未就绪");
  }
  const solver = challengeSolver;
  const tokenPromise = challengeQueue.then(() => solver(data));
  scopeTokenPromises.set(data.scope, tokenPromise);
  challengeQueue = tokenPromise.then(
    () => undefined,
    () => undefined,
  );
  try {
    return await tokenPromise;
  } finally {
    if (scopeTokenPromises.get(data.scope) === tokenPromise) {
      scopeTokenPromises.delete(data.scope);
    }
  }
}

export async function runGatewayChallenge<T>(input: {
  status?: number;
  body?: unknown;
  url?: string;
  skip?: boolean;
  retryCount?: number;
  retry: (headers: Record<string, string>, nextCount: number) => Promise<T>;
}): Promise<T | undefined> {
  if (input.skip || isCaptchaRequestUrl(input.url)) {
    return undefined;
  }
  const data = parseChallengeRequired(input.status, input.body);
  if (!data) {
    return undefined;
  }
  const nextCount = nextChallengeRetryCount(input.retryCount);
  if (isChallengeRetryExceeded(nextCount)) {
    throw new Error("安全验证次数过多");
  }
  const token = await obtainChallengePassToken(data);
  return input.retry(buildChallengeHeaders(data, token), nextCount);
}
