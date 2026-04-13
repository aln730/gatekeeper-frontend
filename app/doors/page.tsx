"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import { apiFetch } from "@/lib/api";
import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";
import DoorCard, { type Door, type DoorStatus } from "@/components/DoorCard";

export default function DoorsPage() {
  const { data: session } = useSession({ required: true });
  const token = session?.accessToken ?? "";
  const sessionError = session?.error;

  useEffect(() => {
    if (sessionError === REFRESH_TOKEN_ERROR) {
      signIn(AUTH_PROVIDER_ID);
    }
  }, [sessionError]);

  const [doors, setDoors] = useState<Door[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DoorStatus>>({});
  const [loadingDoors, setLoadingDoors] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<Record<string, boolean>>({});

  // Stable ref so fetchStatuses doesn't change identity on token refresh
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const fetchingRef = useRef(false);
  const fetchStatuses = useCallback(async (doorList: Door[]) => {
    const t = tokenRef.current;
    if (!t || doorList.length === 0 || fetchingRef.current) return;
    fetchingRef.current = true;
    let results;
    try {
      results = await Promise.allSettled(
        doorList.map((d) => apiFetch(`/doors/${d.id}/status`, t))
      );
    } finally {
      fetchingRef.current = false;
    }
    setStatuses((prev) => {
      const next = { ...prev };
      let changed = false;
      doorList.forEach((d, i) => {
        const r = results[i];
        if (r.status === "fulfilled" && r.value) {
          const s = r.value as DoorStatus;
          if (prev[d.id]?.guess !== s.guess || prev[d.id]?.lastHeartbeat !== s.lastHeartbeat) {
            next[d.id] = s;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, []); // stable — reads token from ref

  const hasFetchedDoors = useRef(false);
  useEffect(() => {
    if (!token || hasFetchedDoors.current) return;
    hasFetchedDoors.current = true;
    apiFetch("/doors/", token)
      .then((data) => {
        const list = (data as { doors: Door[] }).doors;
        setDoors(list);
        setLoadingDoors(false);
      })
      .catch((e: unknown) => {
        setFetchError(e instanceof Error ? e.message : "Failed to load doors");
        setLoadingDoors(false);
      });
  }, [token, fetchStatuses]);

  useEffect(() => {
    if (doors.length === 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start() {
      fetchStatuses(doors);
      intervalId = setInterval(() => fetchStatuses(doors), 30_000);
    }

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.visibilityState === "visible") {
      start();
    }

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [doors, fetchStatuses]);

  const accessible = useMemo(() => doors.filter((d) => d.access), [doors]);
  const inaccessible = useMemo(() => doors.filter((d) => !d.access), [doors]);

  const handleUnlock = async (doorId: string) => {
    setUnlocking((prev) => ({ ...prev, [doorId]: true }));
    try {
      await apiFetch(`/doors/${doorId}/unlock`, token, { method: "POST" });
      toast.success("Door unlocked!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Unlock failed: ${msg}`);
    } finally {
      setUnlocking((prev) => ({ ...prev, [doorId]: false }));
    }
  };

  if (loadingDoors) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (fetchError) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          <strong>Failed to load doors:</strong> {fetchError}
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Doors</h2>
      <Row>
        {accessible.map((door) => (
          <Col md={6} className="mb-3" key={door.id}>
            <DoorCard
              door={door}
              status={statuses[door.id]}
              onUnlock={handleUnlock}
              loading={unlocking[door.id] ?? false}
            />
          </Col>
        ))}
      </Row>
      {inaccessible.length > 0 && (
        <>
          <h5 className="mt-3 mb-3 text-muted">No Access</h5>
          <Row>
            {inaccessible.map((door) => (
              <Col md={6} className="mb-3" key={door.id}>
                <DoorCard
                  door={door}
                  status={statuses[door.id]}
                  onUnlock={handleUnlock}
                  loading={false}
                />
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
}
