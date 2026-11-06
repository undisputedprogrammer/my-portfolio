export function Arrow({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Download() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Mark() {
  return <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 28V12l9 11 9-11v16m5 0 5-16" stroke="currentColor" strokeWidth="2" /><path d="M2 7V2h6m24 0h6v5M2 33v5h6m24 0h6v-5" stroke="currentColor" opacity=".4" /></svg>;
}
