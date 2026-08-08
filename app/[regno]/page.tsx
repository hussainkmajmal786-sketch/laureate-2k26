import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * The printed pass carries a register number, so /KGR22CS019 has to land
 * on the same page /hub/<token> does.
 *
 * This sits at the root of the route tree, which means it would happily
 * swallow /settings, /photos and every other console path if it matched
 * loosely. It only ever matches the register-number shape - letters,
 * two year digits, a two-letter branch, three digits - and anything else
 * falls through to a 404 so real routes keep working.
 */
const REG_NO = /^[A-Za-z]{2,6}\d{2}[A-Za-z]{2}\d{3}$/;

export default async function RegNoShortcut({
  params,
}: {
  params: Promise<{ regno: string }>;
}) {
  const { regno } = await params;
  const candidate = decodeURIComponent(regno).trim();

  if (!REG_NO.test(candidate)) notFound();

  const supabase = await createClient();
  const { data: token } = await supabase.rpc("hub_token_for_reg_no", {
    p_reg_no: candidate.toUpperCase(),
  });

  if (!token) notFound();

  redirect(`/hub/${token}`);
}
