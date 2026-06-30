import { useState, useEffect } from "react";
import ParticleCanvas from "./ParticleCanvas";
import { type AppSettings, DEFAULT_SETTINGS } from "../types";
import Navbar from "./Navbar";
import lightLogo from "../assets/light.png";
import darkLogo from "../assets/dark.png";

export default function Experiment() {
  const [theme, setTheme] = useState<"black" | "white">("black");
  const [activeSection, setActiveSection] = useState(0);

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    theme: theme,
  };

  // Sync settings (theme and scroll snapping) to HTML root classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-white", theme === "white");
    root.classList.toggle("scroll-snap", DEFAULT_SETTINGS.scrollSnapEnabled);
    root.setAttribute("data-theme", theme === "white" ? "light" : "dark");

    // Clean up classes when component unmounts
    return () => {
      root.classList.remove("theme-white");
      root.classList.remove("scroll-snap");
      root.removeAttribute("data-theme");
    };
  }, [theme]);

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
      <div className={`scroll-indicator-bar ${activeSection === 0 ? "first-slide" : ""}`}>
        {shapesMetadata.map((shapeName, index) => (
          <div
            key={index}
            className={`scroll-dot ${activeSection === index ? "active" : ""}`}
            onClick={() => scrollToSection(index)}
            title={`Scroll to ${shapeName}`}
          />
        ))}
      </div>

      {/* Empty snap target sections (keeps scroll snap functionality and enables fall-through clicks) */}
      {Array.from({ length: 11 }).map((_, index) => {
        if (index === 0) {
          return (
            <section key={index} className="section first-slide-container">
              <Navbar isDark={theme === "black"} onThemeToggle={(dark) => setTheme(dark ? "black" : "white")} />
              <div className="hero-experiment-wrapper">
                <img src={theme === "black" ? darkLogo : lightLogo} className="hero-logo" alt="CorvusX Logo" />
              </div>
            </section>
          );
        }
        return (
          <section key={index} className="section" style={{ pointerEvents: "none" }} />
        );
      })}

      {/* Persistent Footer */}
      <footer className="persistent-footer">
        © 2026 CorvusX. All rights reserved.
      </footer>
    </div>
  );
}
