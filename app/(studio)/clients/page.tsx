import Topbar from "@/components/layout/Topbar";
import ClientsView from "./ClientsView";

export const metadata = { title: "Clientes — Paper Rosie Studio" };

export default function ClientsPage() {
  return (
    <>
      <Topbar title="Clientes" />
      <ClientsView />
    </>
  );
}
