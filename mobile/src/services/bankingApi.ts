import { readAccessToken, removeAccessToken } from './auth';
import type { Account, BankingData, Customer, Movement, Notification, Transfer, TransferRequest } from '@/types/banking';

const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const requestTimeoutMs = 10000;

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('Configura EXPO_PUBLIC_API_URL en mobile/.env.');
  const token = await readAccessToken();
  let response: Response;
  let body: { detail?: string; title?: string; traceId?: string };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    body = await response.json().catch(() => ({})) as { detail?: string; title?: string; traceId?: string };
  } catch {
    if (controller.signal.aborted) {
      throw new Error('El servicio tardó demasiado en responder. Comprueba que la API esté activa y accesible desde el celular.');
    }
    throw new Error('No se pudo conectar con el servicio. Revisa la URL de la API y tu conexión.');
  } finally {
    clearTimeout(timeout);
  }

  const requestId = response.headers.get('X-Request-Id') ?? body.traceId;
  if (!response.ok) {
    if (response.status === 401) await removeAccessToken();
    const fallback = response.status === 401
      ? 'La sesión terminó. Inicia sesión de nuevo.'
      : response.status === 403
        ? 'No tienes permiso para realizar esta acción.'
        : response.status === 429
          ? 'Se alcanzó el límite de solicitudes. Espera un momento.'
          : body.detail ?? body.title ?? 'No se pudo completar la solicitud.';
    throw new ApiError(`${fallback}${requestId ? ` (Referencia: ${requestId})` : ''}`, response.status, requestId);
  }
  return body as T;
}

export async function loadBankingData(): Promise<BankingData> {
  const [customer, accounts, movements, transfers, notifications] = await Promise.all([
    requestApi<Customer>('/api/customer'),
    requestApi<Account[]>('/api/accounts'),
    requestApi<Movement[]>('/api/movements'),
    requestApi<Transfer[]>('/api/transfers'),
    requestApi<Notification[]>('/api/notifications'),
  ]);
  return { customer, accounts, movements, transfers, notifications };
}

export function sendTransfer(body: TransferRequest) {
  return requestApi<{ id: string; status: string; duplicate?: boolean }>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
