import type { Account, BankingData, Customer, Movement, Notification, Transfer, TransferRequest } from '../types/banking';
import { clearAccessToken, getAccessToken } from './auth';

type ApiProblem = {
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export class AuthenticationRequiredError extends Error {}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function describeApiError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const code = error.code ? ` · ${error.code}` : '';
    const trace = error.traceId ? ` · Referencia: ${error.traceId}` : '';
    return `HTTP ${error.status}${code}: ${error.message}${trace}`;
  }
  return error instanceof Error ? error.message : 'No se pudo completar la solicitud.';
}

async function requestDetailed<T>(path: string, init?: RequestInit): Promise<{ data: T; status: number; requestId?: string }> {
  const accessToken = getAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => ({})) as ApiProblem & Record<string, unknown>;
  const requestId = response.headers.get('X-Request-Id') ?? body.traceId;
  if (response.status === 401) {
    clearAccessToken();
    throw new AuthenticationRequiredError(`HTTP 401: ${body.detail ?? 'Tu sesión terminó. Inicia sesión para continuar.'}${requestId ? ` · Referencia: ${requestId}` : ''}`);
  }
  if (!response.ok) {
    const fieldErrors = body.errors ? Object.values(body.errors).flat() : [];
    throw new ApiRequestError(
      fieldErrors.join(' ') || body.detail || body.title || 'No se pudo completar la solicitud.',
      response.status,
      body.code,
      requestId,
    );
  }

  return { data: body as T, status: response.status, requestId };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await requestDetailed<T>(path, init)).data;
}

export async function loadBankingData(): Promise<BankingData> {
  const [customer, accounts, movements, transfers, notifications] = await Promise.all([
    request<Customer>('/api/customer'), request<Account[]>('/api/accounts'),
    request<Movement[]>('/api/movements'), request<Transfer[]>('/api/transfers'),
    request<Notification[]>('/api/notifications'),
  ]);
  return { customer, accounts, movements, transfers, notifications };
}

export const createTransfer = (body: TransferRequest) => requestDetailed<{ id: string; status: string; duplicate?: boolean }>(
  '/api/transfers',
  { method: 'POST', body: JSON.stringify(body) },
);
