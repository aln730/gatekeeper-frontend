"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function AppNavbar() {
  const { data: session } = useSession();
  const username = session?.username as string | undefined;
  const displayName = session?.user?.name ?? username;

  const [collapsed, setCollapsed] = useState(true);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">

        <a className="navbar-brand" href="/doors">
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

        <div className={`collapse navbar-collapse${collapsed ? "" : " show"}`}>

          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <a className="nav-link" href="/doors">Doors</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/logs">Logs</a>
            </li>
          </ul>

          {username && (
            <ul className="nav navbar-nav ml-auto">
              <UserDropdown username={username} displayName={displayName} />
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
}: {
  username: string;
  displayName?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className={`nav-item navbar-user dropdown${open ? " show" : ""}`}>
      <a
        className="nav-link dropdown-toggle"
        href="#"
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        aria-expanded={open}
      >
        <img
          src={`https://profiles.csh.rit.edu/image/${username}`}
          alt={username}
          width={28}
          height={28}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
        {displayName ?? username}
        <span className="caret" />
      </a>

      <div className={`dropdown-menu dropdown-menu-right${open ? " show" : ""}`}>
        <a
          className="dropdown-item"
          href={`https://profiles.csh.rit.edu/user/${username}`}
          target="_blank"
          rel="noreferrer"
        >
          Profile
        </a>
        <div className="dropdown-divider" />
        <a
          className="dropdown-item"
          href="#"
          onClick={(e) => { e.preventDefault(); signOut(); }}
        >
          Sign out
        </a>
      </div>
    </li>
  );
}