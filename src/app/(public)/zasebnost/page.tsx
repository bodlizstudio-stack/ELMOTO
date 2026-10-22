import { LegalDocument, legalMetadata } from "@/components/legal-document";

export const metadata = legalMetadata(
  "Politika zasebnosti",
  "Osnutek politike zasebnosti EL-MOTO o obdelavi podatkov iz obrazcev.",
  "/zasebnost",
);

export default function Page() {
  return <LegalDocument slug="zasebnost" description="Politika zasebnosti" />;
}
