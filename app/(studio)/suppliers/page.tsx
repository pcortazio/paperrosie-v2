import Topbar from "@/components/layout/Topbar";
import SuppliersView from "./SuppliersView";

export const metadata = { title: "Fornecedores — Paper Rosie Studio" };

export default function SuppliersPage() {
  return (
    <>
      <Topbar title="Fornecedores" />
      <SuppliersView />
    </>
  );
}
