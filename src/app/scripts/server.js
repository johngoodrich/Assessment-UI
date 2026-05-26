/**
 * Helper to fetch JSON from the backend APIs
 */
export async function fetchConfig(endpoint) {
    const response = await fetch(endpoint);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // Check if we received HTML (likely the SPA fallback index.html) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        console.error(`[ERROR] Received HTML instead of JSON from ${endpoint}.
                          This suggests the API route was not found on the backend.`);
        throw new Error("Received HTML instead of JSON. Check if backend routes are registered and the server has been restarted.");
    }

    return await response.json();
}
