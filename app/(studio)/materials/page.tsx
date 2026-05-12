import Topbar from "@/components/layout/Topbar";
import MaterialsView from "./MaterialsView";

export const metadata = { title: "Materiais — Paper Rosie Studio" };

export default function MaterialsPage() {
  return (
    <>
      <Topbar title="Materiais" />
      <MaterialsView />
    </>
  );
}
