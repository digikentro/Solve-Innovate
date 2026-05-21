const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * POST JSON to an n8n webhook URL from the browser.
 * Uses application/json (may trigger a CORS preflight; the n8n host must answer OPTIONS).
 */
export function postN8nWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<Response> {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}
