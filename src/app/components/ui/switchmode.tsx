"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Switch = () => {
  const [isDark, setIsDark] = useState(false);

  // Initialiser l'état du thème au chargement
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(initialDark);

    // Appliquer le thème initial
    if (initialDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Gérer le changement de thème
  const toggleTheme = () => {
    setIsDark((prevDark) => {
      const newDark = !prevDark;

      // Mettre à jour localStorage et les classes CSS
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }

      return newDark;
    });
  };

  return (
    <StyledWrapper>
      <label
        htmlFor="themeToggle"
        className="themeToggle st-sunMoonThemeToggleBtn"
      >
        <input
          type="checkbox"
          id="themeToggle"
          className="themeToggleInput"
          checked={isDark}
          onChange={toggleTheme}
        />
        <svg
          width={24}
          height={24}
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="none"
        >
          <mask id="moon-mask">
            <rect x={0} y={0} width={20} height={20} fill="white" />
            <circle cx={11} cy={3} r={8} fill="black" />
          </mask>
          <circle
            className="sunMoon"
            cx={10}
            cy={10}
            r={8}
            mask="url(#moon-mask)"
          />
          <g>
            <circle className="sunRay sunRay1" cx={18} cy={10} r="1.5" />
            <circle className="sunRay sunRay2" cx={14} cy="16.928" r="1.5" />
            <circle className="sunRay sunRay3" cx={6} cy="16.928" r="1.5" />
            <circle className="sunRay sunRay4" cx={2} cy={10} r="1.5" />
            <circle className="sunRay sunRay5" cx={6} cy="3.1718" r="1.5" />
            <circle className="sunRay sunRay6" cx={14} cy="3.1718" r="1.5" />
          </g>
        </svg>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  height: 100%;

  /* Taille et positionnement ajustés */
  .themeToggle {
    color: var(--foreground);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: 0 4px;
  }

  .dark .themeToggle {
    color: var(--primary);
  }

  .st-sunMoonThemeToggleBtn {
    position: relative;
    cursor: pointer;
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  .st-sunMoonThemeToggleBtn .themeToggleInput {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    cursor: pointer;
  }

  .st-sunMoonThemeToggleBtn svg {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.4s ease;
    transform: rotate(40deg);
  }

  .st-sunMoonThemeToggleBtn svg .sunMoon {
    transform-origin: center center;
    transition: inherit;
    transform: scale(1);
    fill: var(--foreground);
  }

  .dark .st-sunMoonThemeToggleBtn svg .sunMoon {
    fill: #f9f3ec; /* Couleur plus claire en mode sombre */
  }

  .st-sunMoonThemeToggleBtn svg .sunRay {
    transform-origin: center center;
    transform: scale(0);
    fill: var(--primary);
  }

  .st-sunMoonThemeToggleBtn svg mask > circle {
    transition: transform 0.64s cubic-bezier(0.41, 0.64, 0.32, 1.575);
    transform: translate(0px, 0px);
  }

  .st-sunMoonThemeToggleBtn svg .sunRay2 {
    animation-delay: 0.05s !important;
  }

  .st-sunMoonThemeToggleBtn svg .sunRay3 {
    animation-delay: 0.1s !important;
  }

  .st-sunMoonThemeToggleBtn svg .sunRay4 {
    animation-delay: 0.17s !important;
  }

  .st-sunMoonThemeToggleBtn svg .sunRay5 {
    animation-delay: 0.25s !important;
  }

  .st-sunMoonThemeToggleBtn svg .sunRay6 {
    animation-delay: 0.29s !important;
  }

  .st-sunMoonThemeToggleBtn .themeToggleInput:checked + svg {
    transform: rotate(90deg);
  }

  .st-sunMoonThemeToggleBtn .themeToggleInput:checked + svg mask > circle {
    transform: translate(16px, -3px);
  }

  .st-sunMoonThemeToggleBtn .themeToggleInput:checked + svg .sunMoon {
    transform: scale(0.55);
  }

  .st-sunMoonThemeToggleBtn .themeToggleInput:checked + svg .sunRay {
    animation: showRay1832 0.4s ease 0s 1 forwards;
  }

  @keyframes showRay1832 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Transition d'appui pour le mobile */
  .st-sunMoonThemeToggleBtn:active {
    transform: scale(0.9);
  }

  /* Zone de touche agrandie pour mobile */
  @media (max-width: 768px) {
    .themeToggle {
      width: 32px; /* Plus grand sur mobile */
      height: 32px;
      margin: 0 8px;
    }

    .st-sunMoonThemeToggleBtn::after {
      content: "";
      position: absolute;
      top: -8px;
      left: -8px;
      right: -8px;
      bottom: -8px;
      border-radius: 50%;
    }
  }

  /* Effet de surbrillance au survol */
  .st-sunMoonThemeToggleBtn:hover {
    opacity: 0.9;
  }

  .st-sunMoonThemeToggleBtn:hover svg {
    filter: drop-shadow(0 0 2px var(--primary));
  }
`;

export default Switch;
