"use client";

import { useSession, signOut } from "next-auth/react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";

export default function AppNavbar() {
  const { data: session } = useSession();
  const username = session?.username;

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/doors">Gatekeeper</Navbar.Brand>
        {username && (
          <NavDropdown
            align="end"
            title={
              <span className="d-inline-flex align-items-center text-white">
                <img
                  src={`https://profiles.csh.rit.edu/image/${username}`}
                  alt={username}
                  width={28}
                  height={28}
                  style={{ borderRadius: "50%", objectFit: "cover", marginRight: "0.5rem" }}
                />
                {session?.user?.name ?? username}
              </span>
            }
          >
            <NavDropdown.Item onClick={() => signOut()}>
              Sign out
            </NavDropdown.Item>
          </NavDropdown>
        )}
      </Container>
    </Navbar>
  );
}
