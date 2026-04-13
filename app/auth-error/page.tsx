"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Unknown";
  const description = params.get("error_description");
  const message = AUTH_ERROR_MESSAGES[error] ?? `An authentication error occurred (${error}).`;

  return (
    <Container className="mt-5" style={{ maxWidth: 480 }}>
      <h4>Sign-in failed</h4>
      <p className="text-muted">{message}</p>
      {description && (
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          <code>{description}</code>
        </p>
      )}
      <Button variant="primary" href="/signin">
        Try again
      </Button>
    </Container>
  );
}

function AuthErrorFallback() {
  return (
    <Container className="mt-5" style={{ maxWidth: 480 }}>
      <h4>Sign-in failed</h4>
      <p className="text-muted">An authentication error occurred.</p>
    </Container>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
