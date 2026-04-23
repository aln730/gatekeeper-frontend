"use client";

import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Table, Spinner, Button } from "react-bootstrap";
import Icon from "@mdi/react";
import { mdiMagnify, mdiRefresh, mdiHistory, mdiCheckCircle, mdiCloseCircle } from "@mdi/js";
import { apiFetch } from "@/lib/api";

import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";
import { useSession, signIn } from "next-auth/react";

interface LogEntry {
  _id: string;
  timestamp: string;
  door: string;
  doorName: string | null;
  username: string | null;
  name: string | null;
  doorsId: string;
  keyId: string;
  granted: boolean;
}

interface LogsResponse {
  logs: LogEntry[];
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

async function fetchLogs(token: string, cursor?: string): Promise<LogsResponse> {
  const path = cursor
    ? `/admin/logs?cursor=${encodeURIComponent(cursor)}` : "/admin/logs";
  return apiFetch(path, token) as Promise<LogsResponse>;
}

export default function LogsPage() {
  const { data: session } = useSession();
  const [logs,        setLogs]        = useState<LogEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [grantFilter, setGrantFilter] = useState<"all" | "granted" | "denied">("all");
  const [doorFilter,  setDoorFilter]  = useState("all");
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [pageIndex,   setPageIndex]   = useState(0);
  const token = session?.accessToken ?? "";
    const sessionError = session?.error;

    useEffect(() => {
    if (sessionError === REFRESH_TOKEN_ERROR) {
        signIn(AUTH_PROVIDER_ID);
    }
    }, [sessionError]);
  const loadPage = useCallback(async (idx: number, cursor: string | null, silent = false) => {
    if (!token) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchLogs(token, cursor ?? undefined);
      setLogs(data.logs);
      setPageIndex(idx);
      setCursorStack((prev) => {
        if (idx + 1 < prev.length) return prev;
        if (!data.cursor) return prev;
        const next = [...prev];
        next[idx + 1] = data.cursor;
        return next;
      });
    } catch (err: any) {
        console.error("Failed to load logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadPage(0, null); }, [loadPage]);

  const uniqueDoors = Array.from(new Set(logs.map((l) => l.doorName ?? l.door))).sort();

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      (l.doorName ?? l.door).toLowerCase().includes(q) ||
      (l.username ?? "").toLowerCase().includes(q) ||
      (l.name ?? "").toLowerCase().includes(q);
    const matchGrant =
      grantFilter === "all" ||
      (grantFilter === "granted" && l.granted) ||
      (grantFilter === "denied" && !l.granted);
    const matchDoor =
      doorFilter === "all" || (l.doorName ?? l.door) === doorFilter;
    return matchSearch && matchGrant && matchDoor;
  });

  return (
    <Container fluid className="py-4">

      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">
            Access Logs
          </h2>
          <p className="text-muted mb-0 mt-1">
            Big Brother is watching
          </p>
        </Col>

        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => loadPage(pageIndex, cursorStack[pageIndex], true)}
            disabled={refreshing}
          >
            {refreshing
              ? <Spinner animation="border" size="sm" />
              : <Icon path={mdiRefresh} size={1.5} />}
          </Button>
        </Col>
      </Row>

      <div className="row mb-3 align-items-center">
        <div className="col-12 col-md-5 mb-2 mb-md-0">
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text" id="search-addon">
                <Icon path={mdiMagnify} size={0.75} />
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Search door, username, or display name…"
              aria-describedby="search-addon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-3 mb-2 mb-md-0">
          <select
            className="form-control"
            value={grantFilter}
            onChange={(e) => setGrantFilter(e.target.value as typeof grantFilter)}
          >
            <option value="all">All results</option>
            <option value="granted">Granted only</option>
            <option value="denied">Denied only</option>
          </select>
        </div>
        <div className="col-6 col-md-3 mb-2 mb-md-0">
          <select
            className="form-control"
            value={doorFilter}
            onChange={(e) => setDoorFilter(e.target.value)}
          >
            <option value="all">All doors</option>
            {uniqueDoors.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {(search || grantFilter !== "all" || doorFilter !== "all") && (
          <div className="col-auto">
            <button
              className="btn btn-outline-primary"
              onClick={() => { setSearch(""); setGrantFilter("all"); setDoorFilter("all"); }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>
            <Icon path={mdiHistory} size={0.85} className="me-2" />
            Events
          </span>
        </div>

        {loading ? (
          <div className="card-body d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3 text-muted">Loading</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            <Icon path={mdiHistory} size={2} className="mb-3 opacity-25 d-block mx-auto" />
            <p className="mb-0">No log entries match your filters.</p>
            {(search || grantFilter !== "all" || doorFilter !== "all") && (
              <button
                className="btn btn-link btn-sm mt-2"
                onClick={() => { setSearch(""); setGrantFilter("all"); setDoorFilter("all"); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0" style={{ fontSize: "0.875rem" }}>
                <thead>
                  <tr>
                    <th style={{ width: "16%" }}>Timestamp</th>
                    <th style={{ width: "22%" }}>Door</th>
                    <th style={{ width: "22%" }}>Username</th>
                    <th style={{ width: "18%" }}>Name</th>  
                    <th style={{ width: "10%" }}>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr
                      key={entry._id}
                      className={entry.granted ? "table-success" : "table-danger"}
                    >
                      <td className="font-monospace" style={{ whiteSpace: "nowrap" }}>
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="fw-medium">
                        {entry.doorName ?? (
                          <span className="font-monospace text-muted">{entry.door}</span>
                        )}
                      </td>
                      <td className="font-monospace">
                        {entry.username ?? (
                          <span className="fst-italic text-muted">unknown</span>
                        )}
                      </td>
                      <td>
                        {entry.name ?? (
                          <span className="fst-italic text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-pill ${entry.granted ? "badge-success" : "badge-danger"}`}>
                          <Icon
                            path={entry.granted ? mdiCheckCircle : mdiCloseCircle}
                            size={0.55}
                            className="me-1"
                          />
                          {entry.granted ? "Granted" : "Denied"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
        )}
      </div>
    </Container>
  );
}
