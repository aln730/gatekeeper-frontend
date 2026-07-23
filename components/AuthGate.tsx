"use client";

import { Container, Spinner } from "react-bootstrap";
import { useSession, signIn } from "next-auth/react";
import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";
import { useEffect } from "react";

export default function AuthGate({ children }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      signIn(AUTH_PROVIDER_ID);
    },
  });

  const sessionError = session?.error;
  useEffect(() => {
    if (sessionError === REFRESH_TOKEN_ERROR) signIn(AUTH_PROVIDER_ID);
  }, [sessionError]);

  if (status === "loading") {
    return (
      <Container className="py-5 d-flex justify-content-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!session?.groups?.includes("rtp")) {
    return (
      <Container className="py-5 text-center text-muted">
        <h4>Access Denied</h4>
        <p>You must be an RTP to view this page.</p>
      </Container>
    );
  }

  return children;
}