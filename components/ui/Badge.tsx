import styles from "./badge.module.css";

type BadgeColor = "green" | "amber" | "red" | "blue" | "purple" | "gray";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

export default function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[color]}`}>{label}</span>
  );
}
