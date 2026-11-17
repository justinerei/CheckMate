import { signOut } from "@/auth";
import { PendingSubmit } from "./pending-screen";
import AccountProfileControls from "./account-profile-controls";
import styles from "./account-profile.module.css";

export function AccountProfileHeading({ admin = false }: { admin?: boolean }) {
  return <header className={styles.header}>
    <h1>My profile.</h1>
    <p>{admin ? "Manage your account and notifications." : "Your account details, all in one place."}</p>
  </header>;
}

export default function AccountProfile({ user, role, children, showHeading = true, canChangePassword = false }: {
  user: { name: string; email: string };
  role: "Teacher" | "Administrator";
  children?: React.ReactNode;
  showHeading?: boolean;
  canChangePassword?: boolean;
}) {
  const initial = (user.name.trim() || role).charAt(0).toUpperCase();

  return <div className={children ? styles.profileWithPreferences : styles.profile}>
    {showHeading && <AccountProfileHeading />}
    <div className={styles.profileCards}>
      <section className={styles.card} aria-labelledby="account-heading">
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">{initial}</span>
          <div>
            <div className={styles.identityName}>
              <h2 id="account-heading">{user.name}</h2>
            </div>
            <p>{role === "Administrator" ? <>{role} · <span className={styles.identityEmail}>{user.email}</span></> : `${role} account`}</p>
          </div>
        </div>
        {role !== "Administrator" && <dl className={styles.details}>
          <div><dt>Account name</dt><dd>{user.name}</dd></div>
          <div><dt>Email address</dt><dd>{user.email}</dd></div>
          <div><dt>Account type</dt><dd>{role}</dd></div>
        </dl>}
        <AccountProfileControls name={user.name} canChangePassword={canChangePassword} compact={role === "Administrator"} />
      </section>
      {children}
    </div>
    <form className={styles.signOutForm} action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out</PendingSubmit>
    </form>
  </div>;
}
