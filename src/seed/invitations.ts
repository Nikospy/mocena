// Dane pokazowe S-16: jedno potwierdzone zaproszenie Ewy na rozmowę oceniającą, w przeszłości względem dnia pokazu (9.12.2024).
// Piotr nie ma zaproszeń: przy przystanku 1 przewodnika juror wysyła je sam.
import { seedEvent } from "../events";

export function seedInvitations(): void {
  const id = seedEvent(
    "invitation_sent",
    "cycle-ewa",
    "marek",
    { kind: "assessment", date: "2024-12-04", time: "14:00", place: "pokój 214", note: "" },
    "2024-12-02",
  );
  seedEvent("invitation_confirmed", "cycle-ewa", "ewa", { invitation_id: id, kind: "assessment" }, "2024-12-03");
}
