"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Container, Row, Col, Table, Spinner, Button } from "react-bootstrap";
import Icon from "@mdi/react";
import {
  mdiMagnify,
  mdiHistory,
  mdiCheckCircle,
  mdiCloseCircle,
  mdiEyeOutline,
} from "@mdi/js";
import { apiFetch } from "@/lib/api";

import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";
import { useSession, signIn } from "next-auth/react";
import type DateRangePicker from "vanillajs-datepicker/DateRangePicker";
import "vanillajs-datepicker/css/datepicker-bs5.css";
import AuthGate from "@/components/AuthGate";
import AccessGate from "@/components/AccessGate";

interface LogEntry {
  _id: string;
  timestamp: string;
  door: string;
  doorName: string | null;
  username: string | null;
  name: string | null;
  doorsId: string;
  keyId: string;
  uid?: string | null;
  granted: boolean;
  accessType: "oidc" | "mobile" | "physical";
}

interface LogsResponse {
  logs: LogEntry[];
  cursor: string | null;
}

const DATE_FORMAT = "mm/dd/yyyy";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDateForPicker(d: Date): string {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function defaultSinceDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return formatDateForPicker(d);
}

function defaultUntilDate(): string {
  return formatDateForPicker(new Date());
}

function toIso(dateStr: string, endOfDay = false): string | undefined {
  if (!dateStr) return undefined;
  const [month, day, year] = dateStr.split("/").map(Number);
  if (!month || !day || !year) return undefined;
  const d = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
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

function fetchAccessType(entry: LogEntry) {
  switch (entry.accessType) {
    case "oidc":
      return "Remote Access";
    case "mobile":
      return (
        <div>
          <div>Mobile Key</div>
          <div style={{ fontSize: "0.70rem" }}>({entry.keyId})</div>
        </div>
      );
    case "physical":
      return (
        <div>
          <div>Physical Key</div>
          <div style={{ fontSize: "0.70rem" }}>({entry.keyId})</div>
        </div>
      );
    default:
      return <span>-</span>;
  }
}

async function fetchLogs(
  token: string,
  cursor?: string,
  since?: string,
  until?: string,
  search?: string,
  door?: string,
  granted?: string
): Promise<LogsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (since) params.set("since", since);
  if (until) params.set("until", until);
  if (search) params.set("search", search);
  if (door && door !== "all") params.set("door", door);
  if (granted && granted !== "all") params.set("granted", granted);
  return apiFetch(`/admin/logs?${params}`, token) as Promise<LogsResponse>;
}

async function fetchDoors(token: string): Promise<string[]> {
  return apiFetch(`/admin/logs/doors`, token) as Promise<string[]>;
}

function LogsPageInner() {
  const { data: session } = useSession();
  const [granted, setGranted] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [doors, setDoors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [grantFilter, setGrantFilter] = useState<"all" | "granted" | "denied">(
    "all"
  );
  const [doorFilter, setDoorFilter] = useState("all");
  const [sinceDate, setSinceDate] = useState(defaultSinceDate());
  const [untilDate, setUntilDate] = useState(defaultUntilDate());
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const token = session?.accessToken ?? "";
  const sessionError = session?.error;
  const rangeElRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const rangepickerRef = useRef<DateRangePicker | null>(null);

  // debounce search input -> search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!granted || !rangeElRef.current) return;

    let cancelled = false;

    function handleChange() {
      const rangepicker = rangepickerRef.current;
      if (!rangepicker) return;
      const dates = rangepicker.getDates(DATE_FORMAT);
      const start = dates[0] as string | undefined;
      const end = dates[1] as string | undefined;
      if (start) setSinceDate(start);
      if (end) setUntilDate(end);
    }

    import("vanillajs-datepicker/DateRangePicker").then(
      ({ default: DateRangePickerCtor }) => {
        if (cancelled || !rangeElRef.current) return;

        const rangepicker = new DateRangePickerCtor(rangeElRef.current, {
          format: DATE_FORMAT,
          buttonClass: "btn",
          autohide: true,
        });
        rangepickerRef.current = rangepicker;
        rangeElRef.current.addEventListener("changeDate", handleChange);

        if (startInputRef.current) startInputRef.current.value = sinceDate;
        if (endInputRef.current) endInputRef.current.value = untilDate;
        rangepicker.setDates(sinceDate, untilDate);
      }
    );

    return () => {
      cancelled = true;
      rangeElRef.current?.removeEventListener("changeDate", handleChange);
      rangepickerRef.current?.destroy();
      rangepickerRef.current = null;
    };
  }, [granted]);

  useEffect(() => {
    if (sessionError === REFRESH_TOKEN_ERROR) signIn(AUTH_PROVIDER_ID);
  }, [sessionError]);

  useEffect(() => {
    if (!granted || !token) return;
    fetchDoors(token)
      .then(setDoors)
      .catch((e) => console.error(e));
  }, [granted, token]);

  const loadPage = useCallback(
    async (idx: number, cursor: string | null, silent = false) => {
      if (!token) return;
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const since = toIso(sinceDate, false);
        const until = toIso(untilDate, true);
        const data = await fetchLogs(
          token,
          cursor ?? undefined,
          since,
          until,
          search,
          doorFilter,
          grantFilter
        );
        setLogs(data.logs);
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
        console.error("Failed to load logs");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, sinceDate, untilDate, search, doorFilter, grantFilter]
  );

  // reset to page 0 and refetch whenever any filter changes
  useEffect(() => {
    if (!granted) return;
    setCursorStack([null]);
    setPageIndex(0);
    setNextCursor(null);
    loadPage(0, null);
  }, [loadPage, granted]);

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

  if (!granted) {
    return (
      <AccessGate
        endpoint="/admin/logs/access"
        token={token}
        onGranted={() => setGranted(true)}
      />
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4 align-items-center">
        <Col xs="auto">
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => loadPage(pageIndex, cursorStack[pageIndex], true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Icon path={mdiEyeOutline} size={1.5} />
            )}
          </Button>
        </Col>
      </Row>

      <div className="row mb-3 align-items-center">
        <div className="col-12 col-md-4 mb-2 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">
              <Icon path={mdiMagnify} size={0.75} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search door, username, or name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-2 mb-2 mb-md-0">
          <select
            className="form-select"
            value={grantFilter}
            onChange={(e) =>
              setGrantFilter(e.target.value as typeof grantFilter)
            }
          >
            <option value="all">All results</option>
            <option value="granted">Granted only</option>
            <option value="denied">Denied only</option>
          </select>
        </div>
        <div className="col-6 col-md-2 mb-2 mb-md-0">
          <select
            className="form-select"
            value={doorFilter}
            onChange={(e) => setDoorFilter(e.target.value)}
          >
            <option value="all">All doors</option>
            {doors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4 mb-2 mb-md-0">
          <div id="logs-date-range" ref={rangeElRef} className="input-group">
            <span className="input-group-text">Since:</span>
            <input
              type="text"
              className="form-control bg-body-tertiary"
              name="start"
              ref={startInputRef}
            />
            <span className="input-group-text">Until:</span>
            <input
              type="text"
              className="form-control bg-body-tertiary"
              name="end"
              ref={endInputRef}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>
            <Icon path={mdiHistory} size={0.85} className="me-2" />
            Logs
          </span>
        </div>
        <div className="card-body py-2 border-bottom">
          <PaginationControls />
        </div>

        {loading ? (
          <div className="card-body d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3 text-muted">Loading</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            <Icon
              path={mdiHistory}
              size={2}
              className="mb-3 opacity-25 d-block mx-auto"
            />
            <p className="mb-0">No log entries match your filters.</p>
            {(search || grantFilter !== "all" || doorFilter !== "all") && (
              <button
                className="btn btn-link btn-sm mt-2"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setGrantFilter("all");
                  setDoorFilter("all");
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
                  <th style={{ width: "22%" }}>Door</th>
                  <th style={{ width: "22%" }}>Username</th>
                  <th style={{ width: "18%" }}>Name</th>
                  <th style={{ width: "16%" }}>Access method</th>
                  <th style={{ width: "12%" }}>Access</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry._id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td>{entry.doorName ?? <span>{entry.door}</span>}</td>
                    <td>{entry.username ?? <span>unknown</span>}</td>
                    <td>{entry.name ?? <span>-</span>}</td>
                    <td>{fetchAccessType(entry)}</td>
                    <td>
                      <span
                        className={`badge rounded-pill ${entry.granted ? "text-bg-success" : "text-bg-danger"}`}
                      >
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

export default function LogsPage() {
  return (
    <AuthGate>
      <LogsPageInner />
    </AuthGate>
  );
}
