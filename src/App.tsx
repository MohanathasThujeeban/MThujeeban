import React, { useEffect, useState } from 'react';
import { director } from './engine/director';
import { frameLoader } from './engine/frames';
import { Stage } from './components/Stage';
import { Chrome } from './components/Chrome';

// Scenes
import { HeroBack, HeroSection } from './scenes/Hero';
import { AboutBack, AboutSection } from './scenes/About';
import { WorkBack, WorkSection } from './scenes/Work';
import { JourneyBack, JourneySection } from './scenes/Journey';
import { SkillsBack, SkillsFrontLayer, SkillsSection } from './scenes/Skills';
import { AwardsSection } from './scenes/Awards';
import { ContactBack, ContactSection } from './scenes/Contact';

export const App: React.FC = () => {
  const [, setIntroReady] = useState(false);

  useEffect(() => {
    // Initialize scroll director and frame streaming loader
    director.init();
    frameLoader.init();
  }, []);

  return (
    <div className="portfolio-app-root">
      {/* LAYER 0 (z0): Fixed Back Layer (pointer-events: none) */}
      <div className="layer-back" aria-hidden="true">
        <HeroBack />
        <AboutBack />
        <WorkBack />
        <JourneyBack />
        <SkillsBack />
        <ContactBack />
      </div>

      {/* LAYER 1 (z1): Fixed Stage Canvas (Video Frame Render) */}
      <Stage />

      {/* LAYER 2 (z2): Fixed Front Layer (Front orbit chips) */}
      <div className="layer-front" aria-hidden="true">
        <SkillsFrontLayer />
      </div>

      {/* LAYER 3 (z3): Main Scroll Container with Sticky Sections */}
      <main className="portfolio-main">
        <HeroSection />
        <AboutSection />
        <WorkSection />
        <JourneySection />
        <SkillsSection />
        <AwardsSection />
        <ContactSection />
      </main>

      {/* LAYER 50 & 90+ (z50, z90+): Chrome (HUD, Rail, Preloader, Cursor) */}
      <Chrome onIntroComplete={() => setIntroReady(true)} />
    </div>
  );
};

export default App;
