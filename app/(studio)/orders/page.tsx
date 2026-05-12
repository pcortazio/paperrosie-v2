import Topbar from "@/components/layout/Topbar";
import OrdersView from "./OrdersView";

export const metadata = { title: "Pedidos — Paper Rosie Studio" };

export default function OrdersPage() {
  return (
    <>
      <Topbar title="Pedidos" />
      <OrdersView />
    </>
  );
}
