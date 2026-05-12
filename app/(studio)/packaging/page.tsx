import Topbar from "@/components/layout/Topbar";
import PackagingView from "./PackagingView";

export const metadata = { title: "Embalagens — Paper Rosie Studio" };

export default function PackagingPage() {
  return (
    <>
      <Topbar title="Embalagens" />
      <PackagingView />
    </>
  );
}
