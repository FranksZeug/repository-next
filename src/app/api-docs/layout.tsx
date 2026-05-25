import "./api-docs.css";

export default function ApiDocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="api-docs-page">{children}</div>;
}
