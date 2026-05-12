import Topbar from "@/components/layout/Topbar";
import DashboardView from "./DashboardView";

export const metadata = { title: "Início — Paper Rosie Studio" };

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Início" />
      <DashboardView />
    </>
  );
}
