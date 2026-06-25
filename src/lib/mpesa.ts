/**
 * M-Pesa Daraja API client.
 *
 * Sandbox base URL: https://sandbox.safaricom.co.ke
 * Production base URL: https://api.safaricom.co.ke
 *
 * Required env vars (see .env.example):
 *   MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
 *   MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
 *
 * Docs: https://developer.safaricom.co.ke/Documentation
 */

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Fetches (and caches) an OAuth access token from Daraja. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "M-Pesa credentials are not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your environment."
    );
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get M-Pesa access token: ${res.status} ${body}`);
  }

  const data = await res.json();
  // expires_in is in seconds (usually 3599); refresh a minute early.
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in ?? 3599) - 60) * 1000,
  };

  return cachedToken.token;
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function getPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("MPESA_SHORTCODE and MPESA_PASSKEY must be set.");
  }
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export interface StkPushParams {
  /** Phone number in 2547XXXXXXXX format (no +, no leading 0) */
  phone: string;
  /** Amount in KES, whole shillings */
  amount: number;
  /** Our internal order number, shown to the customer as the account reference */
  accountReference: string;
  /** Short description shown on the STK prompt, e.g. "Savanna & Sole order" */
  description: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Initiates an STK Push (Lipa Na M-Pesa Online) prompt on the customer's phone.
 * The actual payment result arrives asynchronously at MPESA_CALLBACK_URL.
 */
export async function initiateStkPush(params: StkPushParams): Promise<StkPushResponse> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const shortcode = process.env.MPESA_SHORTCODE;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!callbackUrl) {
    throw new Error("MPESA_CALLBACK_URL must be set to a publicly reachable HTTPS URL.");
  }

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: params.phone,
    PartyB: shortcode,
    PhoneNumber: params.phone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.description.slice(0, 13),
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.errorCode) {
    throw new Error(data.errorMessage || data.ResponseDescription || "STK push failed");
  }

  return data as StkPushResponse;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResultCode: string;
  ResultDesc: string;
}

/** Polls Daraja for the status of a previously-initiated STK push. */
export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResponse> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const shortcode = process.env.MPESA_SHORTCODE;

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  return data as StkQueryResponse;
}

/**
 * Shape of the callback Daraja POSTs to MPESA_CALLBACK_URL once the customer
 * has entered their PIN (or cancelled / timed out).
 */
export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

export interface ParsedMpesaCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

/** Extracts the useful fields out of Daraja's verbose callback payload. */
export function parseMpesaCallback(body: MpesaCallbackBody): ParsedMpesaCallback {
  const cb = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    amount: get("Amount") as number | undefined,
    mpesaReceiptNumber: get("MpesaReceiptNumber") as string | undefined,
    transactionDate: get("TransactionDate")?.toString(),
    phoneNumber: get("PhoneNumber")?.toString(),
  };
}
