"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function AppNavbar() {
  const { data: session } = useSession();
  const username = session?.username as string | undefined;
  const displayName = session?.user?.name ?? username;
  const idToken = session?.idToken;
  const [collapsed, setCollapsed] = useState(true);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-lg">
        <a href="/home" className="navbar-brand fs-4">
          <Image
            className="object-fit-contain ms-2 me-2"
            height={32}
            width={32}
            src="https://assets.csh.rit.edu/pubsite/csh_logo_square.svg"
            alt="CSH"
          />
          Gatekeeper
        </a>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse${collapsed ? "" : " show"}`}
          id="navbar-lg-1"
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a href="/home" className="nav-link px-2">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a href="/audit" className="nav-link px-2">
                Activity
              </a>
            </li>
            <li className="nav-item">
              <a href="/doors" className="nav-link px-2">
                Doors
              </a>
            </li>
          </ul>

          {username && (
            <ul className="navbar-nav ms-auto">
              <UserDropdown
                username={username}
                displayName={displayName}
                idToken={idToken}
              />
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}

function UserDropdown({
  username,
  displayName,
  idToken,
}: {
  username: string;
  displayName?: string | null;
  idToken?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className={`nav-item dropdown text-end${open ? " show" : ""}`}>
      <a
        href="#"
        className="d-block nav-link dropdown-toggle text-decoration-none"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
      >
        <Image
          src={`https://profiles.csh.rit.edu/image/${username}`}
          alt={username}
          width={32}
          height={32}
          className="rounded-circle"
          style={{ objectFit: "cover" }}
        />{" "}
        {displayName ?? username}
      </a>
      <ul
        className={`dropdown-menu dropdown-menu-end text-small${open ? " show" : ""}`}
      >
        <li>
          <a
            className="dropdown-item"
            href={`https://profiles.csh.rit.edu/user/${username}`}
            target="_blank"
            rel="noreferrer"
          >
            Profile
          </a>
        </li>
        <li>
          <a
            className="dropdown-item"
            href={`https://members.csh.rit.edu/`}
            target="_blank"
            rel="noreferrer"
          >
            Members
          </a>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <a
            className="dropdown-item"
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              await signOut({ redirect: false });
              const url = new URL(
                "https://sso.csh.rit.edu/auth/realms/csh/protocol/openid-connect/logout"
              );
              if (idToken) {
                url.searchParams.set("id_token_hint", idToken);
              }
              window.location.href = url.toString();
            }}
          >
            Sign out
          </a>
        </li>
      </ul>
    </li>
  );
}
