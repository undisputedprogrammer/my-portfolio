"use client";
import Image from 'next/image';
import { Reveal, GlitchText } from './motion-system';
import { TiltCard } from './interactions';
export function ProfileCard(){return <Reveal className="profile-reveal"><TiltCard className="profile-card"><div className="profile-photo"><Image src="/profile-portrait.jpg" alt="Portrait of Muhammed Ali, backend software engineer" width={1024} height={1536} sizes="(max-width: 767px) 85vw, 300px" style={{objectPosition:"center 40%"}}/><div className="profile-scanlines"/><div className="profile-sweep"/></div><span className="profile-corner tl"/><span className="profile-corner tr"/><span className="profile-corner bl"/><span className="profile-corner br"/><p className="profile-caption"><GlitchText text="ID // MUHAMMED ALI — BACKEND ENGINEER"/></p></TiltCard></Reveal>}
