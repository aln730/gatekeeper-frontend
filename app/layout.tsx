import type { Metadata } from "next";
import Providers from "@/components/Providers";
import AppNavbar from "@/components/AppNavbar";
import { ToastContainer } from "react-toastify";
import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Gatekeeper",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppNavbar />
          <main>{children}</main>
          <ToastContainer position="bottom-right" theme="colored" />
        </Providers>
      </body>
    </html>
  );
}
