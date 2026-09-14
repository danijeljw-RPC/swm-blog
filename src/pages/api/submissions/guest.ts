import type { APIRoute } from "astro";
import { handleSubmission } from "../../../lib/submissions/endpoint";
export const prerender = false;
export const POST: APIRoute = ({ request }) => handleSubmission(request, "guest");
