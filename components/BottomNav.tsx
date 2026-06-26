"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/session/latest", label: "Home",    icon: "home"    },
  { href: "/history",        label: "History", icon: "history" },
  { href: "/profile",        label: "Profile", icon: "profile" },
];

function Icon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#a78bfa" : "#6b6485";
  if (type === "home") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 8.5L10 2.5L17 8.5V17H13V12H7V17H3V8.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={active ? color : "none"} fillOpacity={active ? 0.15 : 0} />
    </svg>
  );
  if (type === "history") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.6" />
      <path d="M10 6V10L13 12" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke={color} strokeWidth="1.6" fill={active ? color : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav() {
  const path = usePathname();
  return (
    <div style={{
      position:"fixed", left:0, right:0, bottom:0, height:66,
      background:"rgba(13,11,21,.92)", backdropFilter:"blur(12px)",
      borderTop:"1px solid #2a2540",
      display:"flex", alignItems:"center", justifyContent:"space-around",
      paddingBottom:6, zIndex:50,
    }}>
      {NAV.map(item => {
        const active = item.label === "Profile"
          ? path === "/profile"
          : item.label === "History"
          ? path === "/history" || path === "/new-session"
          : path.startsWith("/session") || path === "/upload" || path === "/guide";
        return (
          <Link key={item.href} href={item.href} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            color: active ? "#a78bfa" : "#6b6485",
            textDecoration:"none",
          }}>
            <Icon type={item.icon} active={active} />
            <span style={{ fontSize:10, fontWeight: active ? 700 : 600 }}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
