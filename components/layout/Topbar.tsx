import { logout } from "@/app/(auth)/login/actions";
import styles from "./topbar.module.css";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        {actions}
        <form action={logout}>
          <button type="submit" className={styles.iconBtn} title="Sair">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
