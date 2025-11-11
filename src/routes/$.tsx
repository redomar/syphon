// Catch-all route for unmatched URLs (like Chrome DevTools requests)
export async function loader() {
  // Return 404 without logging noise
  throw new Response(null, { status: 404, statusText: "Not Found" });
}

export default function CatchAll() {
  return null;
}
