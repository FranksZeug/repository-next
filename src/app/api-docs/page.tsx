import type { Metadata } from "next";
import ApiDocsClient from "@/components/ApiDocsClient";

export const metadata: Metadata = {
  title: "API-Dokumentation – IAB DataHub",
  description: "OpenAPI / Swagger UI für die IAB DataHub File Upload API",
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
