import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata = { title: "Login — Paper Rosie Studio" };

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoName}>Paper Rosie</span>
          <span className={styles.logoSub}>Studio</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
