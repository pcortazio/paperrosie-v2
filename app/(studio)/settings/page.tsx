import Topbar from "@/components/layout/Topbar";
import SettingsView from "./SettingsView";

export const metadata = { title: "Configurações — Paper Rosie Studio" };

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Configurações" />
      <SettingsView />
    </>
  );
}
