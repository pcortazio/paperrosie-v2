import Topbar from "@/components/layout/Topbar";
import InventoryView from "./InventoryView";

export const metadata = { title: "Inventário — Paper Rosie Studio" };

export default function InventoryPage() {
  return (
    <>
      <Topbar title="Inventário" />
      <InventoryView />
    </>
  );
}
