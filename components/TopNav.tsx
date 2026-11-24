"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { BookOpenCheck, ClipboardCheck, Home, LogIn, LogOut, Sparkles } from "lucide-react";

const links = [{ href: "/", label: "หน้าหลัก", icon: Home }, { href: "/learn", label: "เรียน + Recall", icon: BookOpenCheck }, { href: "/quiz", label: "ทำข้อสอบ", icon: ClipboardCheck }];

export function TopNav() {
  const pathname = usePathname(); const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <header className="topbar"><div className="nav-inner"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>MSC Exam Lab</span></Link><nav className="main-nav">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={mounted && pathname === href ? "nav-link active" : "nav-link"}><Icon size={16} /> {label}</Link>)}</nav><div className="account-area">{session?.user ? <button className="account-button" onClick={() => signOut({ callbackUrl: "/" })} title="ออกจากระบบ">{session.user.image ? <img src={session.user.image} alt="" className="avatar" /> : <span className="avatar fallback">{session.user.name?.[0] ?? "U"}</span>}<span className="account-name">{session.user.name?.split(" ")[0] ?? "บัญชีของฉัน"}</span><LogOut size={15} /></button> : <button className="signin-button" onClick={() => signIn("google", { callbackUrl: pathname || "/" })}><LogIn size={15} /> เข้าสู่ระบบ Google</button>}</div></div></header>;
}
