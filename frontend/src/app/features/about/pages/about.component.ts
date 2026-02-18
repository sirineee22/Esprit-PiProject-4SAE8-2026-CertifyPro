import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-premium-wrapper">
      <div class="header-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
      <div class="grain-overlay"></div>
      
      <!-- Section 1: Dark Hero Block -->
      <section class="hero-block-dark">
        <header class="about-header">
          <div class="container-custom">
            <span class="site-badge-dark">Certified Excellence</span>
            <h1 class="hero-title-dark">Building Trust in the <br><span class="text-gradient-gold">Digital Workforce</span></h1>
            <p class="subtitle-dark">CertifyPro is a secure ecosystem designed to elevate professional credentials through transparency and innovation. We empower individuals and organizations with a resilient, decentralized framework for credential management and verification.</p>
          </div>
        </header>
      </section>

      <!-- Section 2: Light Gray Block with Elevated Cards -->
      <section class="section-mission-vision">
        <div class="container-custom">
          <div class="mission-vision-grid">
            <div class="card-elevated-premium">
              <div class="card-icon-styled">
                <i class="bi bi-shield-check"></i>
              </div>
              <h3>Our Mission</h3>
              <p>To empower professionals with secure, instantly verifiable certifications. We protect your achievements with the highest level of cryptographic integrity, ensuring that every milestone is recognized and respected globally without the need for manual validation.</p>
            </div>

            <div class="card-elevated-premium">
              <div class="card-icon-styled">
                <i class="bi bi-lightning-charge-fill"></i>
              </div>
              <h3>Our Vision</h3>
              <p>A world where every skill is universally trusted. We bridge the gap between dedication and opportunity through a transparent digital infrastructure that serves as the gold standard for professional trust and borderless career progression.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: White Split Block -->
      <section class="section-advantage-split">
        <div class="container-custom">
          <div class="split-layout">
            <div class="split-content">
              <h2 class="section-title-dark">Why CertifyPro?</h2>
              <p class="section-desc">Our platform is built on four core pillars that define the next generation of professional credentialing, ensuring maximum trust, efficiency, and scalability for the modern workforce.</p>
              
              <div class="advantage-list">
                <div class="adv-item">
                  <i class="bi bi-shield-lock-fill"></i>
                  <div>
                    <h4>Immutable Security</h4>
                    <p>Advanced multi-layered encryption ensures every credential is tamper-proof and protected against unauthorized alterations or fraud.</p>
                  </div>
                </div>
                <div class="adv-item">
                  <i class="bi bi-lightning-fill"></i>
                  <div>
                    <h4>Instant Verification</h4>
                    <p>Eliminate manual checks with our proprietary one-click protocol, allowing employers to verify authenticity in real-time across any device.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="split-visual">
              <div class="visual-box">
                <div class="visual-glow"></div>
                <i class="bi bi-mortarboard-fill visual-icon-main"></i>
                <div class="visual-label">CERTIFYPRO </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Simple Light Expertise Block -->
      <section class="section-expertise-simple">
        <div class="container-custom text-center">
          <div class="expertise-header-simple">
            <h2 class="section-title-dark">The Experts Behind the Platform</h2>
            <p class="section-desc">A unified team of engineers, educators, and industry leaders dedicated to the future of professional trust and digital identity.</p>
          </div>

          <div class="expertise-grid-simple">
            <div class="expertise-card-simple">
              <div class="icon-box-gold-simple">
                <i class="bi bi-journal-check"></i>
              </div>
              <h4>Pedagogical Design</h4>
              <p>Ensuring our certification standards reflect real-world industry competencies through rigorous academic and professional alignment.</p>
            </div>
            <div class="expertise-card-simple">
              <div class="icon-box-gold-simple">
                <i class="bi bi-database-lock"></i>
              </div>
              <h4>Secure Engineering</h4>
              <p>Building resilient, high-performance systems for global data integrity, focused on zero-trust architecture and scalable security models.</p>
            </div>
            <div class="expertise-card-simple">
              <div class="icon-box-gold-simple">
                <i class="bi bi-stars"></i>
              </div>
              <h4>Trust Standards</h4>
              <p>Innovating at the frontier of digital identity and decentralized verification, working with global partners to set the standard for trust.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e3a5f;
      --primary-dark: #0b1f3b;
      --ocean-blue: #0f172a;
      --accent-gold: hsl(38, 92%, 50%);
      --accent-orange: #e67e00;
      --bg-cream: #fdfbf7;
      --bg-warm: #faf8f5;
      --bg-light: #f5f4f0;
      --text-white: #ffffff;
      --text-muted: #64748b;
      --shadow-premium: 0 20px 50px rgba(0, 0, 0, 0.08), 0 10px 20px rgba(0, 0, 0, 0.04);
    }

    .about-premium-wrapper {
      overflow-x: hidden;
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg-cream);
    }

    .container-custom {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .text-center { text-align: center; }

    /* --- SECTION 1: HERO (warm gradient + soft shapes) --- */
    .hero-block-dark {
      background: linear-gradient(180deg, #ffffff 0%, var(--bg-cream) 45%, var(--bg-warm) 100%);
      padding: 10rem 0 4rem;
      position: relative;
      overflow: hidden;
    }

    .header-bg-shapes {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .header-bg-shapes .shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
    }

    .header-bg-shapes .shape-1 {
      width: 400px;
      height: 400px;
      background: rgba(30, 58, 95, 0.06);
      top: -120px;
      right: -80px;
    }

    .header-bg-shapes .shape-2 {
      width: 300px;
      height: 300px;
      background: rgba(230, 126, 0, 0.05);
      bottom: -60px;
      left: -60px;
    }

    .header-bg-shapes .shape-3 {
      width: 200px;
      height: 200px;
      background: rgba(30, 58, 95, 0.04);
      top: 40%;
      left: 20%;
    }

    .grain-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    .about-header { text-align: center; position: relative; z-index: 10; }

    .site-badge-dark {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: rgba(230, 126, 0, 0.12);
      border: 1px solid rgba(230, 126, 0, 0.25);
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 0.75rem;
    }

    .hero-title-dark {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 950;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin-bottom: 0.75rem;
      color: var(--primary-dark);
    }

    .text-gradient-gold {
      color: #1e3a5f;
    }

    .subtitle-dark {
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.55;
    }

    /* --- SECTION 2: MISSION & VISION --- */
    .section-mission-vision {
      padding: 5rem 0 6rem;
      background: linear-gradient(180deg, var(--bg-warm) 0%, var(--bg-cream) 100%);
      position: relative;
    }

    .mission-vision-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 3rem;
    }

    .card-elevated-premium {
      background: white;
      border-radius: 24px;
      padding: 3rem 2.5rem;
      box-shadow: 0 10px 40px rgba(30, 58, 95, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(30, 58, 95, 0.06);
      transition: transform 0.35s ease, box-shadow 0.35s ease;
      position: relative;
      overflow: hidden;
    }

    .card-elevated-premium::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, var(--accent-orange), var(--accent-gold));
      border-radius: 4px 0 0 4px;
      opacity: 0.8;
    }

    .card-elevated-premium:hover {
      transform: translateY(-8px);
      box-shadow: 0 24px 56px rgba(30, 58, 95, 0.1), 0 8px 20px rgba(0, 0, 0, 0.05);
    }

    .card-icon-styled {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, rgba(230, 126, 0, 0.1), rgba(251, 191, 36, 0.15));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--accent-gold);
      margin-bottom: 2rem;
    }

    .card-elevated-premium h3 { font-size: 1.75rem; font-weight: 850; margin-bottom: 1.25rem; color: var(--primary-dark); }
    .card-elevated-premium p { color: var(--text-muted); line-height: 1.8; font-size: 1.1rem; margin: 0; }

    /* --- SECTION 3: SPLIT ADVANTAGE --- */
    .section-advantage-split {
      padding: 6rem 0;
      background: white;
      border-top: 1px solid rgba(30, 58, 95, 0.06);
      border-bottom: 1px solid rgba(30, 58, 95, 0.06);
    }

    .split-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 6rem;
      align-items: center;
    }

    .section-title-dark {
      font-size: 2.75rem;
      font-weight: 900;
      color: var(--primary-dark);
      margin-bottom: 0.75rem;
      padding-bottom: 1rem;
      position: relative;
    }

    .section-title-dark::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 60px;
      height: 4px;
      background: var(--accent-orange);
      border-radius: 2px;
    }

    .section-desc { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 3.5rem; line-height: 1.6; }

    .advantage-list { display: grid; gap: 2.5rem; }
    .adv-item {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      padding: 1.25rem;
      border-radius: 16px;
      background: var(--bg-cream);
      border: 1px solid rgba(30, 58, 95, 0.05);
      transition: background 0.25s ease;
    }
    .adv-item:hover { background: rgba(230, 126, 0, 0.04); }
    .adv-item i { font-size: 1.75rem; color: var(--accent-orange); margin-top: 0.25rem; flex-shrink: 0; }
    .adv-item h4 { font-size: 1.35rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem; }
    .adv-item p { color: var(--text-muted); line-height: 1.6; margin: 0; }

    .split-visual { position: relative; }
    .visual-box {
      aspect-ratio: 1;
      background: linear-gradient(145deg, var(--primary) 0%, var(--ocean-blue) 100%);
      border-radius: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      box-shadow: 20px 40px 80px rgba(30, 58, 95, 0.2);
    }

    .visual-icon-main { font-size: 5rem; color: var(--accent-gold); z-index: 10; margin-bottom: 1rem; }
    .visual-label { color: rgba(255, 255, 255, 0.4); font-family: monospace; font-size: 0.8rem; z-index: 10; }
    .visual-glow {
      position: absolute;
      width: 150%;
      height: 150%;
      background: radial-gradient(circle, rgba(230, 126, 0, 0.15) 0%, transparent 60%);
      animation: rotate 10s linear infinite;
    }

    /* --- SECTION 4: SIMPLE EXPERTISE --- */
    .section-expertise-simple {
      background: linear-gradient(180deg, var(--bg-cream) 0%, var(--bg-warm) 100%);
      padding: 6rem 0 8rem;
    }

    .expertise-header-simple { margin-bottom: 4rem; text-align: center; }
    .expertise-header-simple .section-title-dark::after { left: 50%; transform: translateX(-50%); }

    .expertise-grid-simple {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2.5rem;
    }

    .expertise-card-simple {
      background: white;
      padding: 3rem 2.5rem;
      border-radius: 24px;
      border: 1px solid rgba(30, 58, 95, 0.06);
      box-shadow: 0 10px 30px rgba(30, 58, 95, 0.04);
      transition: all 0.3s ease;
      text-align: center;
    }

    .expertise-card-simple:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 50px rgba(30, 58, 95, 0.08);
      border-color: rgba(230, 126, 0, 0.12);
    }

    .icon-box-gold-simple {
      width: 70px;
      height: 70px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(230, 126, 0, 0.12), rgba(251, 191, 36, 0.15));
      color: var(--accent-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 2rem;
    }

    .expertise-card-simple h4 { font-size: 1.35rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 1rem; }
    .expertise-card-simple p { color: var(--text-muted); line-height: 1.7; font-size: 1rem; margin: 0; }

    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes float-misty {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(40px, -20px) scale(1.05); }
      100% { transform: translate(-30px, 30px) scale(0.95); }
    }

    @media (max-width: 991px) {
      .split-layout { grid-template-columns: 1fr; text-align: center; gap: 4rem; }
      .section-mission-vision { padding-bottom: 5rem; }
      .hero-block-dark { padding: 8rem 0 10rem; }
      .split-visual { order: -1; }
    }
  `]
})
export class AboutComponent { }
