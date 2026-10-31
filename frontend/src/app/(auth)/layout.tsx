import type { ReactNode } from "react";

import styles from "@/components/auth.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
