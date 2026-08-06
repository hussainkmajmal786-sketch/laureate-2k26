import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now Serving — Laureate 2K26",
  description: "Live photo booth queue board for the holding area.",
};

/**
 * The board is always dark regardless of the app theme — a bright screen in a
 * dim hall washes out at distance.
 */
export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark">{children}</div>;
}
