import { LegalDocument, legalMetadata } from "@/components/legal-document";

export const metadata = legalMetadata("Podatki o podjetju", "Podatki o podjetju EL-MOTO, Špruha 33, Trzin.", "/podjetje");

export default function Page() {
  return <LegalDocument slug="podjetje" description="Podatki o podjetju" />;
}
