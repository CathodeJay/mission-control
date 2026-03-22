import { redirect } from "next/navigation";

// Activity has been replaced by the Journal feature.
// Redirect anyone visiting /activity to /journal.
export default function ActivityPage() {
  redirect("/journal");
}
