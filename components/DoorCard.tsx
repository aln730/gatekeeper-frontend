"use client";

import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Icon from "@mdi/react";
import { mdiDoor, mdiLockOpenOutline } from "@mdi/js";
import { DOOR_ACCESS_DENIED_MESSAGES, DEFAULT_NO_ACCESS } from "@/lib/constants";

function formatHeartbeat(lastHeartbeat: number): string {
  if (!lastHeartbeat) return "Never";
  const minutes = Math.floor((Date.now() - lastHeartbeat) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export type Door = { id: string; name: string; access: boolean };
export type DoorStatus = { guess: "online" | "offline"; lastHeartbeat: number };

interface DoorCardProps {
  door: Door;
  status: DoorStatus | undefined;
  onUnlock: (doorId: string) => void;
  loading?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  online: "#4CAF50",
  offline: "#e51c23",
  unknown: "#9e9e9e",
};


export default function DoorCard({
  door,
  status,
  onUnlock,
  loading = false,
}: DoorCardProps) {
  const guess = status?.guess ?? "unknown";
  const color = STATUS_COLOR[guess] ?? STATUS_COLOR.unknown;

  return (
    <Card>
      <Card.Body className="d-flex align-items-center">
        <div className="flex-grow-1">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Last seen: {formatHeartbeat(status?.lastHeartbeat ?? 0)}</Tooltip>}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                  cursor: "default",
                  marginRight: "0.25rem",
                }}
              />
            </OverlayTrigger>
            <Icon path={mdiDoor} size={1} />
            {door.name}
          </h5>
          {!door.access && (
            <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.875rem" }}>
              {DOOR_ACCESS_DENIED_MESSAGES[door.name] ?? DEFAULT_NO_ACCESS}
            </p>
          )}
        </div>
        {door.access && (
          <Button
            variant="primary"
            className="ms-3 flex-shrink-0"
            onClick={() => onUnlock(door.id)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-1" />
                Unlocking...
              </>
            ) : (
              <><Icon path={mdiLockOpenOutline} size={0.75} className="me-1" />Unlock</>
            )}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
