import { signOut } from "@/auth";
import { PendingSubmit } from "./pending-screen";
import AccountProfileControls from "./account-profile-controls";
import ProfileAvatar from "./profile-avatar";
import styles from "./account-profile.module.css";

export function AccountProfileHeading({ admin = false }: { admin?: boolean }) {
  return <header className={styles.header}>
    <h1>My profile.</h1>
    <p>{admin ? "Manage your account and notifications." : "Your account details, all in one place."}</p>
  </header>;
}

export default function AccountProfile({ user, role, children, showHeading = true, canChangePassword = false, googleProfile, signInMethod }: {
  user: { name: string; email: string };
  role: "Teacher" | "Administrator";
  children?: React.ReactNode;
  showHeading?: boolean;
  canChangePassword?: boolean;
  googleProfile?: { name: string | null; email: string | null; image: string | null } | null;
  signInMethod?: "Google" | "Email and password";
}) {
  const initial = (user.name.trim() || role).charAt(0).toUpperCase();

  return <div className={children || role === "Teacher" ? styles.profileWithPreferences : styles.profile} data-teacher-profile={role === "Teacher" ? "" : undefined}>
    {showHeading && <AccountProfileHeading />}
    <div className={styles.profileCards}>
      <section className={styles.card} aria-labelledby="account-heading">
        <div className={styles.identity}>
          <ProfileAvatar image={googleProfile?.image} initial={initial} />
          <div>
            <div className={styles.identityName}>
              <h2 id="account-heading">{user.name}</h2>
            </div>
            <p>{role} · <span className={styles.identityEmail}>{user.email}</span></p>
          </div>
        </div>
        {role === "Teacher" && <dl className={styles.details}>
          <div><dt>Sign-in method</dt><dd>{signInMethod}</dd></div>
          {googleProfile?.name && <div><dt>Google profile name</dt><dd>{googleProfile.name}</dd></div>}
          {googleProfile?.email && googleProfile.email !== user.email && <div><dt>Google email</dt><dd>{googleProfile.email}</dd></div>}
        </dl>}
        <AccountProfileControls name={user.name} canChangePassword={canChangePassword} compact />
      </section>
      {children}
    </div>
    <form className={styles.signOutForm} action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <PendingSubmit className={styles.signOut} pendingLabel="Signing out…">Sign out</PendingSubmit>
    </form>
  </div>;
}
