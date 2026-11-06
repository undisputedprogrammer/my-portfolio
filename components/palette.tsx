"use client";
import { useEffect, useState } from "react";
export function usePalette() {
 const [palette,setPalette]=useState({accent:"",secondary:""});
 useEffect(()=>{const update=()=>{const css=getComputedStyle(document.documentElement);const accent=css.getPropertyValue('--accent').trim(),secondary=css.getPropertyValue('--accent-2').trim();setPalette(p=>p.accent===accent&&p.secondary===secondary?p:{accent,secondary});};update();const timer=setInterval(update,500);return()=>clearInterval(timer);},[]);
 return palette;
}
export function PaletteMetadata(){const p=usePalette();useEffect(()=>{if(!p.accent)return;const hex=p.accent.replace('#','');if(/^[0-9a-f]{6}$/i.test(hex))document.documentElement.style.setProperty('--accent-rgb',[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)).join(', '));let meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta);}meta.content=p.accent;const icon=document.querySelector<HTMLLinkElement>('link[rel="icon"]');if(icon)icon.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0A0A0B"/><path d="M13 44V20l12 16 12-16v24M43 44l8-24" stroke="${p.accent}" fill="none" stroke-width="4"/></svg>`);},[p]);return null;}
