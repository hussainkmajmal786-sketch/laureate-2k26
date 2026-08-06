import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now Serving — Laureate 2K26",
  description: "Live photo booth queue board for the holding area.",
};

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
