import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import homeArt from "@/assets/cx7-decision-passport-home-green.png";
import { homePanels } from "@/components/cx7/home-panels";
import { LiveScenario } from "@/components/cx7/LiveScenario";
import "./cx7-decision-passport.css";

type Panel = keyof typeof homePanels | "scenario";

export default function CX7DecisionPassportHome() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Panel>("scenario");
  const [openCount, setOpenCount] = useState(0);
  const panel = active === "scenario" ? null : homePanels[active];
  const open = (key: Panel) => {
    setActive(key);
    setOpenCount((n) => n + 1);
    dialog.current?.showModal();
  };
  return (
    <div className="cx7-approved-home relative">
      <nav aria-label="Home navigation" className="absolute right-3 top-1 z-10">
        <Link to="/reconciliation" className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold">Reconciliação</Link>
      </nav>
      <main className="cx7-ready-stage" aria-label="CX7 Decision Passport">
        <img className="cx7-ready-art" src={homeArt} width={1122} height={1402} alt="IA Innovation — CX7 Decision Passport — Governed authority for autonomous systems" />
        <Button variant="ghost" className="cx7-ready-hotspot cx7-ready-core" aria-label="Open CX7 Decision Passport live scenario" onClick={() => open("scenario")}>
          <span className="cx7-ready-start" aria-hidden="true">
            <span className="cx7-ready-start-dot" />
            <span className="cx7-ready-start-word">START</span>
          </span>
        </Button>
        {(["platform", "passport", "gate", "proof"] as const).map((key) => (
          <Button key={key} variant="ghost" className={`cx7-ready-hotspot cx7-ready-${key}`} aria-label={`Open ${homePanels[key].kicker.slice(5)}`} onClick={() => open(key)} />
        ))}
      </main>
      <dialog ref={dialog} className="cx7-ready-modal" aria-labelledby="cx7-panel-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
        <Button variant="ghost" size="icon" className="cx7-ready-close" aria-label="Close" onClick={() => dialog.current?.close()}>×</Button>
        {panel ? <>
          <p className="cx7-ready-kicker">{panel.kicker}</p>
          <h2 id="cx7-panel-title">{panel.title}</h2>
          <p className="cx7-ready-subtitle">{panel.subtitle}</p>
          <div className="cx7-ready-grid">{panel.metrics.map(([label, value]) => <div className="cx7-ready-metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
          <p className="cx7-ready-note">{panel.note}</p>
        </> : <LiveScenario key={openCount} />}
      </dialog>
    </div>
  );
}