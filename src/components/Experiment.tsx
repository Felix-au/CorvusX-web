import { useState, useEffect, useRef } from "react";
import ParticleCanvas from "./ParticleCanvas";
import { type AppSettings, DEFAULT_SETTINGS } from "../types";
import Navbar from "./Navbar";
import lightLogo from "../assets/light.png";
import darkLogo from "../assets/dark.png";

export default function Experiment() {
  const [theme, setTheme] = useState<"black" | "white">(() => {
    const saved = localStorage.getItem("corvusx-theme");
    return saved === "light" ? "white" : "black";
  });
  const [activeSection, setActiveSection] = useState(0);
  const isProgrammaticScrollRef = useRef(false);

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    theme: theme,
  };

  // Sync theme to localStorage
  useEffect(() => {
    localStorage.setItem("corvusx-theme", theme === "white" ? "light" : "dark");
  }, [theme]);

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

  // Track scroll position to update active dot indicator and handle JS-based mobile snapping
  useEffect(() => {
    let isMobile = window.innerWidth <= 768;
    let scrollTimeout: number | null = null;
    let lastScrollTop = window.scrollY;
    let isTouching = false;
    let startSection = Math.round(window.scrollY / window.innerHeight);

    const triggerSnapCheck = () => {
      if (isTouching) return; // Don't snap while user is touching the screen
      if (isProgrammaticScrollRef.current) return;

      const currentScrollTop = window.scrollY;
      const sectionHeight = window.innerHeight;
      
      if (currentScrollTop % sectionHeight === 0) return;

      const rawIndex = currentScrollTop / sectionHeight;
      const baseIndex = Math.floor(rawIndex);
      const fraction = rawIndex - baseIndex;
      
      const delta = currentScrollTop - lastScrollTop;
      const scrollingDown = delta > 0;

      let targetIndex = baseIndex;
      if (scrollingDown) {
        // Snaps to next section if scrolled down by more than 20% (0.20)
        targetIndex = fraction > 0.20 ? baseIndex + 1 : baseIndex;
        // Limit to at most one slide forward from starting slide
        targetIndex = Math.min(startSection + 1, targetIndex);
      } else {
        // Snaps to previous section if scrolled up by more than 20% (fraction < 0.80)
        targetIndex = fraction < 0.80 ? baseIndex : baseIndex + 1;
        // Limit to at most one slide backward from starting slide
        targetIndex = Math.max(startSection - 1, targetIndex);
      }

      targetIndex = Math.max(0, Math.min(10, targetIndex));

      window.scrollTo({
        top: targetIndex * sectionHeight,
        behavior: "smooth"
      });

      lastScrollTop = targetIndex * sectionHeight;
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      const N = 10; // shapes count - 1 (11 shapes total)
      const index = Math.min(Math.round(ratio * N), N);
      setActiveSection(index);

      isMobile = window.innerWidth <= 768;
      if (!isMobile) return;

      // Lock the starting section of the scroll gesture when scrolling begins
      if (scrollTimeout === null) {
        startSection = Math.round(scrollTop / window.innerHeight);
      }

      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }

      scrollTimeout = window.setTimeout(triggerSnapCheck, 100);
      lastScrollTop = scrollTop;
    };

    const handleTouchStart = () => {
      isTouching = true;
      // Record starting section on touch start
      startSection = Math.round(window.scrollY / window.innerHeight);
    };

    const handleTouchEnd = () => {
      isTouching = false;
      // Start snap timer immediately after releasing touch
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      scrollTimeout = window.setTimeout(triggerSnapCheck, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    
    // Run once initially to capture load state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, []);

  const scrollToSection = (index: number) => {
    isProgrammaticScrollRef.current = true;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (index / 10) * scrollHeight;
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });

    // Reset programmatic scroll flag after transition finishes (~800ms)
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);
  };

  const shapesMetadata = [
    "Synaptic Brain",
    "Cosmic Scattered",
    "DNA Double Helix",
    "Structured Octahedron",
    "Geometric Cube",
    "Flowing Torus",
    "Torus Trefoil Knot",
    "Astroid Star",
    "Email Envelope",
    "Holistic Sphere",
    "Innovating Lightbulb",
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
                <div className="hero-content">
                  <div className="badge-wrapper">
                    <span className="badge-dot" />
                    <span>Undetectable AI</span>
                  </div>
                  <img src={theme === "black" ? darkLogo : lightLogo} className="hero-logo" alt="CorvusX Logo" width="380" height="320" />
                  <p className="hero-subtext">
                    CorvusX delivers solutions discreetly, helping you think clearly, solve optimally & perform with absolute confidence.
                  </p>
                </div>
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
        <div className="footer-left" />
        <div className="footer-center">
          © 2026 CorvusX. All rights reserved.
        </div>
        <div className="footer-right">
          <a
            href="https://github.com/Felix-au/CorvusX-Intelligence-in-the-Shadows"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
