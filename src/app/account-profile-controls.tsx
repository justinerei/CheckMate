"use client";

import { useState } from "react";
import AccountProfileEdit from "./account-profile-edit";
import AccountPasswordForm from "./account-password-form";
import styles from "./account-profile.module.css";

export default function AccountProfileControls({ name, canChangePassword }: { name: string; canChangePassword: boolean }) {
  const [mode, setMode] = useState<"name" | "password" | null>(null);
  const [message, setMessage] = useState("");

  function close(message = "") {
    setMessage(message);
    setMode(null);
  }

  function open(mode: "name" | "password") {
    setMessage("");
    setMode(mode);
  }

  return <div className={styles.editor}>
    {mode === "name" ? <AccountProfileEdit name={name} onClose={close} />
      : mode === "password" ? <AccountPasswordForm onClose={close} />
        : <div className={styles.profileActions}>
          <button type="button" className={styles.editButton} onClick={() => open("name")}>Edit profile</button>
          {canChangePassword && <button type="button" className={styles.editButton} onClick={() => open("password")}>Change password</button>}
        </div>}
    {message && <p className={styles.editMessage} role="status">{message}</p>}
  </div>;
}
