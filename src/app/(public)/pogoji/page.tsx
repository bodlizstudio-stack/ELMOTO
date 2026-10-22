import { LegalDocument, legalMetadata } from "@/components/legal-document";

export const metadata = legalMetadata("Splošni pogoji poslovanja", "Osnutek splošnih pogojev EL-MOTO.", "/pogoji");

export default function Page() {
  return <LegalDocument slug="pogoji" description="Splošni pogoji" />;
}
