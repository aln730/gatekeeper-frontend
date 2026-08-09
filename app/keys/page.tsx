"use client";

import { useState, useCallback, useEffect } from "react";
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import Icon from "@mdi/react";
import {
  mdiMagnify,
  mdiKeyVariant,
  mdiTrashCanOutline,
  mdiAccountKey,
} from "@mdi/js";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import AuthGate from "@/components/AuthGate";
import AccessGate from "@/components/AccessGate";

interface UserInfo {
  id: string;
  username: string;
  disabled: boolean;
  groups: string[];
}

interface Key {
  _id: string;
  uid?: string;
  enabled: boolean;
  doorsId?: string;
  drinkId?: string;
  memberProjectsId?: string;
}

function parseCn(dn: string): string | null {
  const match = dn.match(/^cn=([^,]+),cn=groups,cn=accounts/i);
  return match ? match[1] : null;
}

function KeysPageInner() {
  const { data: session } = useSession();

  const [granted, setGranted] = useState(false);
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [keys, setKeys] = useState<Key[]>([]);
  const [mutating, setMutating] = useState(false);

  const token = session?.accessToken ?? "";

  const lookup = useCallback(async () => {
    if (!token || !username) return;
    setUser(null);
    setKeys([]);
    try {
      const userRes = (await apiFetch(
        `/admin/users/uuid-by-uid/${username}`,
        token
      )) as UserInfo;
      setUser({ ...userRes, username: username });

      try {
        const keysRes = (await apiFetch(
          `/admin/keys/by-user?userId=${userRes.id}`,
          token
        )) as Key[];
        setKeys(keysRes);
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, username]);

  async function toggleKey(keyId: string, enabled: boolean) {
    if (!token) return;
    setMutating(true);
    try {
      await apiFetch(`/admin/keys/${keyId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ enabled, username: user?.username }),
      });
      setKeys((prev) =>
        prev.map((k) => (k._id === keyId ? { ...k, enabled } : k))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setMutating(false);
    }
  }

  async function removeKey(keyId: string) {
    if (!token) return;
    setMutating(true);
    try {
      await apiFetch(`/admin/keys/${keyId}`, token, {
        method: "DELETE",
        body: JSON.stringify({ username: user?.username }),
      });
      setKeys((prev) => prev.filter((k) => k._id !== keyId));
    } catch (e) {
      console.error(e);
    } finally {
      setMutating(false);
    }
  }

  async function confirmAndRemoveKey(keyId: string) {
    const result = await Swal.fire({
      title: "Delete this key?",
      theme: "bootstrap-5",
      icon: "warning",
      text: `This will permanently remove this key from ${user?.username}. This can't be undone.`,
      showCloseButton: true,
      showCancelButton: true,
      reverseButtons: true,
      customClass: {
        cancelButton: "btn btn-primary",
        confirmButton: "btn btn-danger",
      },
    });
    if (result.isConfirmed) {
      await removeKey(keyId);
    }
  }

  if (!granted) {
    return (
      <AccessGate
        endpoint="/admin/keys/access"
        token={token}
        onGranted={() => setGranted(true)}
      />
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="row mb-3 align-items-center">
        <div className="col-12 col-md-5 mb-2 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">
              <Icon path={mdiMagnify} size={0.75} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Username…"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
          </div>
        </div>
      </div>

      {user && (
        <>
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>
                <Icon path={mdiAccountKey} size={0.85} className="me-2" />
                Groups
              </span>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-1">
                {user.groups.filter((g) => parseCn(g)).length === 0 ? (
                  <span className="text-muted small">No groups</span>
                ) : (
                  user.groups.map((g) => {
                    const label = parseCn(g);
                    if (!label) return null;
                    return (
                      <span key={g} className="badge text-bg-light">
                        {label}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>
                <Icon path={mdiKeyVariant} size={0.75} className="me-2" />
                Keys
              </span>
            </div>

            {keys.length === 0 ? (
              <div className="card-body text-center py-5 text-muted">
                <p className="mb-0">No keys registered</p>
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
                      <th style={{ width: "20%" }}>UID</th>
                      <th style={{ width: "25%" }}>KeyId</th>
                      <th style={{ width: "20%" }}>Realms</th>
                      <th style={{ width: "25%" }} className="text-center">
                        Status
                      </th>
                      <th style={{ width: "25%" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k._id}>
                        <td>{k.uid ?? <span>Mobile key</span>}</td>
                        <td>{k._id}</td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {Object.keys(k)
                              .filter(
                                (r) =>
                                  r.endsWith("Id") &&
                                  !["_id", "userId"].includes(r) &&
                                  k[r as keyof Key]
                              ) //this will be huge for debugging new realms
                              .map((r) => (
                                <div
                                  key={r}
                                  className="d-flex gap-2 align-items-center"
                                >
                                  <span className="badge text-bg-primary text-white">
                                    {r}: {k[r as keyof Key] as string}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge rounded-pill ${k.enabled ? "text-bg-success" : "text-bg-danger"}`}
                          >
                            {k.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button
                              variant={k.enabled ? "danger" : "success"}
                              size="sm"
                              onClick={() => toggleKey(k._id, !k.enabled)}
                              disabled={mutating}
                            >
                              {k.enabled ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => confirmAndRemoveKey(k._id)}
                              disabled={mutating}
                            >
                              <Icon path={mdiTrashCanOutline} size={0.65} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </Container>
  );
}

export default function KeysPage() {
  return (
    <AuthGate>
      <KeysPageInner />
    </AuthGate>
  );
}
