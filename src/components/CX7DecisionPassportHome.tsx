import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import homeArt from "@/assets/cx7-decision-passport-home.png.asset.json";
import { homePanels, scenarioEvents } from "@/components/cx7/home-panels";
import "./cx7-decision-passport.css";

type Panel = keyof typeof homePanels | "scenario";

export default function CX7DecisionPassportHome() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Panel>("scenario");
  const [step, setStep] = useState(0);
  const panel = active === "scenario" ? null : homePanels[active];
  const open = (key: Panel) => {
    setActive(key);
    setStep(0);
    dialog.current?.showModal();
  };
  return (
    <div className="cx7-approved-home">
      <main className="cx7-ready-stage" aria-label="CX7 Decision Passport">
        <img className="cx7-ready-art" src={homeArt.url} width={1229} height={1536} alt="IA Innovation — Governança Cognitiva e Decisão — CX7 Decision Passport" />
        <Button variant="ghost" className="cx7-ready-hotspot cx7-ready-core" aria-label="Open CX7 Decision Passport live scenario" onClick={() => open("scenario")} />
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
        </> : <>
          <p className="cx7-ready-kicker">Live scenario · visual prototype</p>
          <h2 id="cx7-panel-title">Watch authority respond to reality.</h2>
          <p className="cx7-ready-subtitle">Decision Passport → Premise Monitor → Execution Gate → Solana Proof</p>
          <div className="cx7-ready-status-row"><span className="cx7-ready-status" aria-live="polite">{step > 0 ? scenarioEvents[step - 1]?.[2] : "VALID NOW"}</span><span className="cx7-ready-status">Human governed</span><span className="cx7-ready-status">Premise-bound</span></div>
          <div className="cx7-ready-timeline"><div className="cx7-ready-event"><time>14:02</time><b>Passport Issued</b></div>{scenarioEvents.slice(0, step).map(([time, label]) => <div className="cx7-ready-event" key={label}><time>{time}</time><b>{label}</b></div>)}</div>
          <Button variant="ghost" className="cx7-ready-cta" onClick={() => setStep(step >= scenarioEvents.length ? 0 : step + 1)}>{step >= scenarioEvents.length ? "Restart scenario ↻" : "Trigger premise change →"}</Button>
          <p className="cx7-ready-note">Visual front-end demonstration only. No Solana transaction is claimed until the backend integration is implemented.</p>
        </>}
      </dialog>
    </div>
  );
}