import Topbar from "@/components/layout/Topbar";
import PurchasesView from "./PurchasesView";

export const metadata = { title: "Compras — Paper Rosie Studio" };

export default function PurchasesPage() {
  return (
    <>
      <Topbar title="Compras" />
      <PurchasesView />
    </>
  );
}
