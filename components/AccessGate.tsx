"use client";

import { useState } from "react";
import { Container, Button } from "react-bootstrap";
import { apiFetch } from "@/lib/api";

export default function AccessGate({
  endpoint,
  token,
  onGranted,
}: {
  endpoint: string;
  token: string;
  onGranted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  async function requestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setGateError(null);
    try {
      await apiFetch(endpoint, token, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      onGranted();
    } catch {
      setGateError("Could not verify access. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 480 }}>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Access Reason Required</h5>
          <p className="text-muted">
            Viewing this page requires a stated reason.
          </p>
          <form onSubmit={requestAccess}>
            <div className="mb-3">
              <label className="form-label">Reason:</label>
              <textarea
                className="form-control"
                rows={4}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ resize: "none" }}
              />
            </div>
            {gateError && <div className="text-danger mb-3">{gateError}</div>}
            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={submitting}>
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
}
