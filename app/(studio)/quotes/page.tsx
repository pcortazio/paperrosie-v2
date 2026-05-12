import Topbar from "@/components/layout/Topbar";
import QuotesView from "./QuotesView";

export const metadata = { title: "Orçamentos — Paper Rosie Studio" };

export default function QuotesPage() {
  return (
    <>
      <Topbar title="Orçamentos" />
      <QuotesView />
    </>
  );
}
