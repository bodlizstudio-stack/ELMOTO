import { LegalDocument, legalMetadata } from "@/components/legal-document";

export const metadata = legalMetadata("Politika piškotkov", "Osnutek politike piškotkov EL-MOTO.", "/piskotki");

export default function Page() {
  return <LegalDocument slug="piskotki" description="Politika piškotkov" />;
}
