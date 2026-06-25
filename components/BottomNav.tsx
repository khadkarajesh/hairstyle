"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/session/latest", label: "Home",    icon: "square"   },
  { href: "/history",        label: "History", icon: "circle-o" },
  { href: "/profile",        label: "Profile", icon: "circle"   },
];

function Icon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#a78bfa" : "#6b6485";
  if (type === "square")   return <span style={{ width:18, height:18, borderRadius:6, background:color, display:"block" }} />;
  if (type === "circle-o") return <span style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${color}`, display:"block" }} />;
  return <span style={{ width:18, height:18, borderRadius:"50%", background:color, display:"block" }} />;
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
          ? path === "/history"
          : path.startsWith("/session");
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
