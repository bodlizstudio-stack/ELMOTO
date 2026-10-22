import { LegalDocument, legalMetadata } from "@/components/legal-document";

export const metadata = legalMetadata(
  "Pogoji najema",
  "Osnutek pogojev najema motorjev EL-MOTO. Uradni postanejo šele po potrditvi.",
  "/pogoji-najema",
);

export default function Page() {
  return <LegalDocument slug="pogoji-najema" description="Pogoji najema" />;
}
