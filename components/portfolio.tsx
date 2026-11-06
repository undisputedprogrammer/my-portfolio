"use client";

import { useEffect, useState, type ReactNode } from "react";
import { content as c } from "@/data/content";
import { CustomCursor, MouseProvider, TerminalDemo, TiltCard } from "./interactions";
import { NetworkGraph } from "./network-graph";
import { LaptopBase } from "./laptop-base";
import { HeroDiagram } from "./hero-diagram";
import { ProfileCard } from "./profile-card";
import { PaletteMetadata } from "./palette";
import { Arrow, Download, Mark } from "./icons";
import { BackgroundGrid, MotionProvider, MotionToggle, ParallaxLayer, Reveal, ScrollProgress, SectionDivider } from "./motion-system";

export function SectionHeading({ label, title, description }: { label: string; title: string; description?: string }) {
  return <Reveal className="section-heading"><p className="eyebrow"><span className="tiny-cross">+</span>{label}</p><h2>{title}</h2>{description && <p className="section-description">{description}</p>}<SectionDivider/></Reveal>;
}

export function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return <Reveal as="section" id={id} className={`section ${className}`} content={false} aria-label={c.nav.find(item => item.id === id)?.label}><Reveal className="section-inner" content={id === "contact"}>{children}</Reveal></Reveal>;
}

function Navigation() {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState("hero");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const update = () => {
      setShown(window.scrollY > 100);
      let current = "hero";
      for (const item of c.nav) {
        if ((document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) <= window.innerHeight * .45) current = item.id;
      }
      setActive(current);
    };
    update(); window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, []);
  return <>
    <ScrollProgress/>
    <header className={`sticky-nav ${shown ? "is-visible" : ""}`} inert={!shown}>
      <a className="brand" href="#hero" aria-label={`${c.name} — ${c.ui.backTop}`}><Mark /><span>{c.ui.brand}</span></a>
      <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="primary-nav" aria-label={menu ? c.ui.closeMenu : c.ui.openMenu}><span /><span /></button>
      <nav id="primary-nav" className={menu ? "menu-open" : ""} aria-label={c.ui.navigation}>{c.nav.slice(1).map(item => <a key={item.id} href={`#${item.id}`} onClick={() => setMenu(false)} aria-current={active === item.id ? "location" : undefined} className={active === item.id ? "active" : ""}>{item.label}</a>)}</nav>
    </header>
    <nav className="section-rail" aria-label={c.ui.index}>{c.nav.map((item, i) => <a key={item.id} href={`#${item.id}`} aria-label={item.label} aria-current={active === item.id ? "location" : undefined} className={active === item.id ? "active" : ""}><span className="rail-label">{item.label}</span><span className="rail-mark" /><span className="rail-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span></a>)}</nav>
  </>;
}

function Hero() {
  return <Reveal as="section" id="hero" className="section hero-section" content={false} aria-labelledby="hero-title">
    <Reveal className="hero-topbar"><a className="brand" href="#hero"><Mark /><span>{c.ui.brand}</span></a><span className="eyebrow edition">{c.ui.edition}</span><a className="top-contact" href="#contact">{c.nav[6].label}<Arrow diagonal /></a></Reveal>
    <Reveal className="hero-screen" content={false}><div className="screen-topline"><div className="window-dots"><i /><i /><i /></div><span>{c.hero.screenTitle}</span><span className="screen-status"><i className="status-dot" />{c.hero.screenStatus}</span></div>
      <div className="hero-content"><Reveal className="hero-copy"><p className="eyebrow"><span className="status-dot" />{c.hero.eyebrow}</p><h1 id="hero-title">{c.name.split(" ")[0]}<br/><span>{c.name.split(" ").slice(1).join(" ")}<span className="name-period">.</span></span></h1><p className="hero-role"><span>{c.hero.rolePrefix}</span> {c.role}</p><p className="hero-description">{c.hero.description}</p><div className="hero-actions"><a className="button button-primary" href="#projects">{c.hero.primaryAction}<Arrow /></a><a className="button button-secondary" href={c.ui.resumePath} download={c.ui.resumeName}><Download />{c.hero.secondaryAction}</a></div><div className="hero-location"><span className="location-pin" />{c.location}</div></Reveal><HeroDiagram/></div>
      <div className="screen-footer"><span>{c.hero.specialty}</span><span><i className="status-dot" />{c.ui.status}</span></div>
    <LaptopBase/></Reveal>
    <Reveal className="hero-bottom"><div className="hero-stats">{c.hero.stats.map(stat=><div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><a className="scroll-cue" href="#about"><span>{c.ui.scroll}</span><span className="scroll-mouse"><i /></span></a></Reveal>
  </Reveal>;
}

function About() {
  return <Section id="about"><SectionHeading label={c.about.label} title={c.about.title}/><div className="about-grid"><aside className="about-portrait"><ProfileCard/></aside><Reveal className="about-story"><h3>{c.about.lead}</h3>{c.about.paragraphs.map(p=><p key={p}>{p}</p>)}<Reveal className="education"><span className="eyebrow">{c.about.educationLabel}</span><strong>{c.about.education}</strong><span>{c.about.school}</span><small>{c.about.period}<span>{c.about.grade}</span></small></Reveal></Reveal><div className="focus-list"><p className="eyebrow">{c.about.approachLabel}</p>{c.about.focus.map((f,i)=><Reveal className="focus-item" key={f.number} delay={i * .08}><span className="focus-number">{f.number}</span><div><h3>{f.title}</h3><p>{f.text}</p></div><Arrow diagonal /></Reveal>)}</div></div></Section>;
}

function Skills() {
  return <Section id="skills"><SectionHeading label={c.skills.label} title={c.skills.title}/><div className="skills-layout"><Reveal className="skills-intro"><h3>{c.skills.subtitle}</h3><p>{c.skills.description}</p><NetworkGraph/></Reveal><div className="skill-groups">{c.skills.groups.map((group,i)=><Reveal className="skill-group" key={group.label} delay={i * .08}><p className="eyebrow">{group.label}</p><div className="tags">{group.items.map(item=><span key={item}>{item}</span>)}</div></Reveal>)}</div></div></Section>;
}

function ProjectVisual({ kind }: { kind: string }) {
  return <div className={`project-visual visual-${kind}`} aria-hidden="true"><svg viewBox="0 0 400 160" fill="none"><g stroke="currentColor" strokeWidth="1"><path d="M0 80h80l40-40h160l40 40h80M0 100h65l40 40h190l40-40h65" opacity=".2" />{kind === "ai" ? <><circle cx="200" cy="80" r="36"/><circle cx="200" cy="80" r="55" strokeDasharray="2 9"/><path d="M80 40h55l29 24M80 120h55l29-24m72-32 29-24h55m-84 56 29 24h55M183 66l34 28m-34 0 34-28M200 44v72M164 80h72"/>{[[80,40],[80,120],[320,40],[320,120]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="currentColor"/>)}</> : kind === "booking" ? <><rect x="115" y="30" width="170" height="110" rx="4"/><path d="M115 60h170M150 20v20m100-20v20"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${137+i*29} 79h14v14h-14Zm0 28h14v14h-14Z`} opacity={i===2 ? 1 : .3}/>)}</> : kind === "rental" ? <><path d="m140 75 60-45 60 45v60H140Zm40 60V95h40v40M125 85l75-57 75 57"/><circle cx="285" cy="65" r="17"/><path d="m275 65 7 7 13-14"/></> : <><path d="m100 100 95-35 100 35-100-8Zm95-35V40m-65 0h130M195 93v30m-42 0h84M280 82l25-40 12 43"/><path d="M110 140h180" strokeDasharray="3 7"/><circle cx="195" cy="80" r="63" strokeDasharray="1 7" opacity=".4"/></>}</g></svg></div>;
}

function Projects() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <Section id="projects" className="projects-section"><SectionHeading label={c.projects.label} title={c.projects.title} description={c.projects.description}/><ParallaxLayer className="projects-grid">{c.projects.items.map((project,i)=><TiltCard className={`project-card ${i===0 ? "featured-project" : ""}`} key={project.id} revealDelay={i * .08}><ProjectVisual kind={project.visual}/><div className="project-content"><div className="project-meta"><span>{project.category}</span><span>/{project.number}</span></div><h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p><p className="project-description">{project.description}</p><div className="tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div><button className="text-button" aria-expanded={expanded === project.id} aria-controls={`notes-${project.id}`} onClick={()=>setExpanded(expanded===project.id ? null : project.id)}>{expanded===project.id ? c.ui.readLess : c.ui.readMore}<Arrow diagonal={expanded!==project.id}/></button><div id={`notes-${project.id}`} hidden={expanded!==project.id} className="project-notes"><ul>{project.notes.map(note=><li key={note}>{note}</li>)}</ul></div></div></TiltCard>)}</ParallaxLayer><Reveal className="additional-projects"><p className="eyebrow">{c.ui.moreProjects}</p><div>{c.projects.additional.map(p=><span key={p}>{p}</span>)}</div></Reveal></Section>;
}

function Experience() {
  return <Section id="experience"><SectionHeading label={c.experience.label} title={c.experience.title} description={c.experience.description}/><div className="timeline">{c.experience.items.map((job,i)=><Reveal as="article" className="timeline-item" key={job.company} delay={i * .08}><div className="timeline-node">{String(i+1).padStart(2,"0")}</div><div className="job-heading"><p className="eyebrow">{job.period}</p><h3>{job.role}</h3><p className="job-company">{job.company}</p><div className="tags">{job.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div><ul className="job-points">{job.bullets.map(b=><li key={b}>{b}</li>)}</ul></Reveal>)}</div></Section>;
}

function Terminal() {
  return <Section id="terminal"><SectionHeading label={c.terminal.label} title={c.terminal.title}/><div className="terminal-layout"><Reveal className="terminal-intro"><p>{c.terminal.description}</p><div className="terminal-steps">{c.terminal.steps.map(s=><p key={s}>{s}</p>)}</div></Reveal><TerminalDemo/></div></Section>;
}

function Contact() {
  return <Section id="contact" className="contact-section"><p className="eyebrow"><span className="tiny-cross">+</span>{c.contact.label}</p><Reveal className="contact-heading"><h2>{c.contact.title}<br/><span>{c.contact.titleAccent}</span></h2><div className="contact-symbol" aria-hidden="true"><Arrow diagonal/></div></Reveal><p className="contact-description">{c.contact.description}</p><a className="contact-email" href={`mailto:${c.contact.email}`}><span>{c.contact.email}</span><Arrow diagonal/></a><Reveal className="contact-grid"><a href={c.contact.phoneHref}><span className="eyebrow">{c.contact.phoneLabel}</span><strong>{c.contact.phone}</strong><Arrow diagonal/></a><a href={c.contact.linkedin} target="_blank" rel="noopener noreferrer"><span className="eyebrow">{c.contact.linkedinLabel}</span><strong>{c.contact.linkedinText}</strong><Arrow diagonal/></a><div><span className="eyebrow">{c.contact.locationLabel}</span><strong>{c.location}</strong></div></Reveal><a className="button button-secondary" href={c.ui.resumePath} download={c.ui.resumeName}><Download/>{c.contact.downloadLabel}<small>{c.ui.resumeHint}</small></a><footer><div className="footer-brand"><Mark/><span>{c.ui.copyright}</span></div><p>{c.contact.footer}</p><MotionToggle/><a href="#hero" className="back-top" aria-label={c.ui.backTop}><Arrow/></a></footer></Section>;
}

export default function Portfolio() {
  return <MotionProvider><MouseProvider><PaletteMetadata/><CustomCursor/><a className="skip-link" href="#main-content">{c.ui.skip}</a><BackgroundGrid/><div className="noise-overlay" aria-hidden="true"/><Navigation/><main id="main-content" tabIndex={-1}><Hero/><About/><Skills/><Projects/><Experience/><Terminal/><Contact/></main></MouseProvider></MotionProvider>;
}






