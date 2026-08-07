import type { Metadata } from "next";
import { KioskScanner } from "./kiosk";

export const metadata: Metadata = {
  title: "Photo Booth — Join the queue",
  description: "Scan your graduation pass to join the photo booth queue.",
};

// Public tablet screen — never serve a cached queue position.
export const dynamic = "force-dynamic";

/**
 * Self-service kiosk for the photo booth entrance.
 *
 * Runs signed out on a tablet. A graduate scans their own pass and gets a
 * token; their hub token is the credential, so the kiosk needs no login and
 * cannot be used to look anyone else up.
 */
export default function BoothKioskPage() {
  return <KioskScanner />;
}
