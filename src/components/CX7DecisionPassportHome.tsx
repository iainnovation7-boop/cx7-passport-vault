import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import homeArt from "@/assets/cx7-decision-passport-home-green.png";
import { homePanels, homeLanguages, type HomeLanguage } from "@/components/cx7/home-panels";
import { homeV5ProofDetails } from "@/components/cx7/home-v5";
import "./cx7-decision-passport.css";

type Panel = keyof typeof homePanels;
const panelOrder: Panel[] = ["platform", "passport", "gate", "proof"];

export default function CX7DecisionPassportHome() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Panel>("platform");
  const [language, setLanguage] = useState<HomeLanguage>("en");
  const copy = homeLanguages[language];
  const panels = copy.panels;
  const panel = panels[active];
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("cx7-home-language");
      if (saved === "en" || saved === "pt-BR") setLanguage(saved);
    } catch { /* Language selection still works when storage is unavailable. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    return () => { document.documentElement.lang = "en"; };
  }, [language]);
  const selectLanguage = (value: HomeLanguage) => {
    setLanguage(value);
    try { window.localStorage.setItem("cx7-home-language", value); } catch { /* Optional preference storage. */ }
  };
  const nextPanel = panelOrder[panelOrder.indexOf(active) + 1];
  const open = (key: Panel) => {
    setActive(key);
    dialog.current?.showModal();
    dialog.current?.scrollTo({ top: 0 });
  };
  return (
    <div className="cx7-approved-home relative notranslate" lang={language} translate="no">
      <div role="group" aria-label={copy.language} className="absolute left-3 top-1 z-10 flex items-center">
        {(["en", "pt-BR"] as const).map((value) => <Button key={value} variant="ghost" size="sm" aria-pressed={language === value} onClick={() => selectLanguage(value)} className={language === value ? "min-h-11 text-gold" : "min-h-11 text-muted-foreground"}>{value === "en" ? "EN" : "PT-BR"}</Button>)}
      </div>
      <nav aria-label={copy.navigation} className="absolute right-3 top-1 z-10">
        <Link to="/reconciliation" className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold">{copy.reconciliation}</Link>
      </nav>
      <main className="cx7-ready-stage" aria-label="CX7 Decision Passport">
        <img className="cx7-ready-art" src={homeArt} width={1122} height={1402} alt={copy.imageAlt} />
        <Button variant="ghost" className="cx7-ready-hotspot cx7-ready-core" aria-label={copy.start} onClick={() => open("platform")}>
          <span className="cx7-ready-start" aria-hidden="true">
            <span className="cx7-ready-start-dot" />
            <span className="cx7-ready-start-word">{copy.start}</span>
          </span>
        </Button>
        {(["platform", "passport", "gate", "proof"] as const).map((key) => (
          <Button key={key} variant="ghost" className={`cx7-ready-hotspot cx7-ready-${key}`} aria-label={`${copy.open} ${panels[key].kicker.slice(5)}`} onClick={() => open(key)} />
        ))}
      </main>
      <dialog ref={dialog} className="cx7-ready-modal" aria-labelledby="cx7-panel-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
        <Button variant="ghost" size="icon" className="cx7-ready-close" aria-label={copy.close} onClick={() => dialog.current?.close()}>×</Button>
        <>
          <p className="cx7-ready-kicker">{panel.kicker}</p>
          <h2 id="cx7-panel-title">{panel.title}</h2>
          <p className="cx7-ready-subtitle">{panel.subtitle}</p>
          <div className="cx7-ready-grid">{panel.metrics.map(([label, value]) => <div className="cx7-ready-metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
          <p className="cx7-ready-note">{panel.note}</p>
          {active === "proof" && <dl className="cx7-real-block space-y-4">
            {homeV5ProofDetails.map(([label, value, url], index) => <div key={label} className="min-w-0">
              <dt className="cx7-ready-note">{copy.proofLabels[index]}</dt>
              <dd className="m-0 break-all font-mono text-xs leading-relaxed">
                {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4" aria-label={`${copy.proofLabels[index]}: ${value} — ${copy.explorer}`}>{value}</a> : value}
              </dd>
            </div>)}
          </dl>}
          <Button variant="ghost" className="cx7-ready-cta" onClick={() => nextPanel ? open(nextPanel) : dialog.current?.close()}>
            {nextPanel ? `${panels[nextPanel].kicker.slice(5)} →` : copy.close}
          </Button>
        </>
      </dialog>
    </div>
  );
}