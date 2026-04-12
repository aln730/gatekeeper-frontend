"use client";

import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

export type Door = { id: string; name: string };
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
  const color = STATUS_COLOR[guess];

  return (
    <Card>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-center mb-3">
          {door.name}
          <span
            title={guess}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
        </Card.Title>
        <Button
          variant="primary"
          onClick={() => onUnlock(door.id)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-1" />
              Unlocking...
            </>
          ) : (
            "Unlock"
          )}
        </Button>
      </Card.Body>
    </Card>
  );
}
