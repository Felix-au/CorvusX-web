import { useState, useEffect } from "react";
import ParticleCanvas from "./ParticleCanvas";
import SettingsPanel from "./SettingsPanel";
import { type AppSettings, DEFAULT_SETTINGS } from "../types";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Experiment() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  // Sync settings (theme and scroll snapping) to HTML root classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-white", settings.theme === "white");
    root.classList.toggle("scroll-snap", settings.scrollSnapEnabled);
    root.setAttribute("data-theme", settings.theme === "white" ? "light" : "dark");

    // Clean up classes when component unmounts
    return () => {
      root.classList.remove("theme-white");
      root.classList.remove("scroll-snap");
      root.removeAttribute("data-theme");
    };
  }, [settings.theme, settings.scrollSnapEnabled]);

  // Track scroll position to update active dot indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      
      const N = 10; // shapes count - 1 (11 shapes total)
      const index = Math.min(Math.round(ratio * N), N);
      setActiveSection(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once initially to capture load state
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (index / 10) * scrollHeight;
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  const shapesMetadata = [
    "Synaptic Brain",
    "Innovating Lightbulb",
    "DNA Double Helix",
    "Structured Octahedron",
    "Geometric Cube",
    "Flowing Torus",
    "Torus Trefoil Knot",
    "Astroid Star",
    "Email Envelope",
    "Holistic Sphere",
    "Cosmic Scattered",
  ];

  return (
    <div className="experiment-route">
      {/* Background Interactive Canvas */}
      <ParticleCanvas settings={settings} />

      {/* Scroll Indicators Sidebar */}
      <div className="scroll-indicator-bar">
        {shapesMetadata.map((shapeName, index) => (
          <div
            key={index}
            className={`scroll-dot ${activeSection === index ? "active" : ""}`}
            onClick={() => scrollToSection(index)}
            title={`Scroll to ${shapeName}`}
          />
        ))}
      </div>

      {/* Floating Settings Gear Toggle */}
      <button className="settings-toggle-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ width: "24px", height: "24px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      {/* Floating Settings panel overlay */}
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(false)}
      />

      {/* Empty snap target sections (keeps scroll snap functionality and enables fall-through clicks) */}
      {Array.from({ length: 11 }).map((_, index) => {
        if (index === 0) {
          return (
            <section key={index} className="section first-slide-container">
              <Navbar />
              <div className="hero-experiment-wrapper">
                <div className="badge-wrapper">
                  <span className="badge-dot" />
                  Stealth AI · Always On Top · Invisible to Screen Recorders
                </div>
                <h1>
                  Intelligence<br />
                  <span className="gradient-text">in the Shadows</span>
                </h1>
                <p className="hero-subtext">
                  A premium, invisible overlay that sits silently above every app — providing real-time AI reasoning,
                  screenshot analysis, voice intelligence, and ghost typing during your most critical moments.
                </p>
                <div className="hero-actions">
                  <a href="#download" className="btn-primary" id="hero-download-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download for Windows
                  </a>
                </div>
                <p className="hero-meta">
                  Free · Open Source · Gemini + OmniKey Powered
                </p>
              </div>
              <Footer />
            </section>
          );
        }
        return (
          <section key={index} className="section" style={{ pointerEvents: "none" }} />
        );
      })}
    </div>
  );
}
