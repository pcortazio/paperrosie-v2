import Topbar from "@/components/layout/Topbar";
import ProductsView from "./ProductsView";

export const metadata = { title: "Produtos — Paper Rosie Studio" };

export default function ProductsPage() {
  return (
    <>
      <Topbar title="Produtos" />
      <ProductsView />
    </>
  );
}
