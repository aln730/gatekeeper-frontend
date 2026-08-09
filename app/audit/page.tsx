"use client";

import { useState, useCallback, useEffect } from "react";
import { Container, Table } from "react-bootstrap";
import Icon from "@mdi/react";
import { mdiMagnify, mdiHistory } from "@mdi/js";
import { apiFetch } from "@/lib/api";
import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";
import { useSession, signIn } from "next-auth/react";
import AuthGate from "@/components/AuthGate";

interface AuditEntry {
  _id: string;
  timestamp: string;
  username: string;
  name: string;
  action: string;
  reason: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  cursor: string | null;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

async function fetchAuditEntries(
  token: string,
  cursor?: string,
  search?: string
): Promise<AuditResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search) params.set("search", search);
  return apiFetch(`/admin/audit?${params}`, token) as Promise<AuditResponse>;
}

function AuditPageInner() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const token = session?.accessToken ?? "";
  const sessionError = session?.error;

  useEffect(() => {
    if (sessionError === REFRESH_TOKEN_ERROR) signIn(AUTH_PROVIDER_ID);
  }, [sessionError]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadPage = useCallback(
    async (idx: number, cursor: string | null) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchAuditEntries(
          token,
          cursor ?? undefined,
          search
        );
        setEntries(data.entries);
        setNextCursor(data.cursor);
        setPageIndex(idx);
        setCursorStack((prev) => {
          if (idx + 1 < prev.length) return prev;
          if (!data.cursor) return prev;
          const next = [...prev];
          next[idx + 1] = data.cursor;
          return next;
        });
      } catch (err) {
        console.error("Failed to load audit entries");
      } finally {
        setLoading(false);
      }
    },
    [token, search]
  );

  useEffect(() => {
    setCursorStack([null]);
    setPageIndex(0);
    setNextCursor(null);
    loadPage(0, null);
  }, [loadPage]);

  const hasPrev = pageIndex > 0;
  const hasNext = nextCursor !== null;

  const goPrev = () =>
    hasPrev && loadPage(pageIndex - 1, cursorStack[pageIndex - 1]);
  const goNext = () => {
    if (!hasNext) return;
    const nextIdx = pageIndex + 1;
    loadPage(nextIdx, cursorStack[nextIdx] ?? nextCursor);
  };

  const PaginationControls = () => (
    <ul className="pagination pagination-sm justify-content-center mb-0">
      <li className={`page-item ${!hasPrev ? "disabled" : ""}`}>
        <a
          className="page-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goPrev();
          }}
        >
          Prev
        </a>
      </li>
      <li className={`page-item ${!hasNext ? "disabled" : ""}`}>
        <a
          className="page-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goNext();
          }}
        >
          Next
        </a>
      </li>
    </ul>
  );

  return (
    <Container fluid className="py-4">
      <div className="row mb-3 align-items-center">
        <div className="col-12 col-md-4 mb-2 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">
              <Icon path={mdiMagnify} size={0.75} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search username, name, or reason…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>
            <Icon path={mdiHistory} size={0.85} className="me-2" />
            Audit Logs
          </span>
        </div>
        <div className="card-body py-2 border-bottom">
          <PaginationControls />
        </div>

        {loading ? (
          <div className="card-body d-flex justify-content-center align-items-center py-5">
            <span className="text-muted">Loading</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            <Icon
              path={mdiHistory}
              size={2}
              className="mb-3 opacity-25 d-block mx-auto"
            />
            <p className="mb-0">No entries match your filters.</p>
            {search && (
              <button
                className="btn btn-link btn-sm mt-2"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <Table
              hover
              size="sm"
              className="mb-0"
              style={{ fontSize: "0.875rem" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "16%" }}>Timestamp</th>
                  <th style={{ width: "14%" }}>Username</th>
                  <th style={{ width: "20%" }}>Name</th>
                  <th style={{ width: "24%" }}>Action</th>
                  <th style={{ width: "26%" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td>{entry.username}</td>
                    <td>{entry.name}</td>
                    <td>
                      <span>{entry.action}</span>
                    </td>
                    <td>{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        <div
          className="card-footer d-grid align-items-center"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          <small className="text-muted">Page {pageIndex + 1} &nbsp;</small>
          <div className="justify-self-center">
            <PaginationControls />
          </div>
          <div />
        </div>
      </div>
    </Container>
  );
}

export default function AuditPage() {
  return (
    <AuthGate>
      <AuditPageInner />
    </AuthGate>
  );
}
