"use client";

import { usePalette } from "./palette";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Group, Mesh, Points } from "three";
import { useMousePosition } from "./interactions";

function Wireframe() {
  const palette = usePalette();
  const group = useRef<Group>(null);
  const inner = useRef<Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += .002 * Math.min(delta * 60, 2);
    group.current.rotation.x = .33 + Math.sin(clock.elapsedTime * .23) * .12;
    group.current.position.y = Math.sin(clock.elapsedTime * .55) * .09;
    if (inner.current) inner.current.rotation.z -= delta * .05;
  });
  return <group ref={group} rotation={[.35,.65,.1]}>
    <mesh><boxGeometry args={[2.1,2.1,2.1]}/><meshBasicMaterial color={palette.accent} transparent opacity={.025} depthWrite={false}/><Edges color={palette.accent} threshold={15} transparent opacity={.7}/></mesh>
    <mesh ref={inner} rotation={[.65,.5,.3]}><octahedronGeometry args={[1.12,0]}/><meshBasicMaterial color={palette.secondary} wireframe transparent opacity={.8}/></mesh>
    <mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[1.8,.003,3,70]}/><meshBasicMaterial color={palette.accent} transparent opacity={.15}/></mesh>
  </group>;
}

function Particles({ count }: { count: number }) {
  const palette = usePalette();
  const points = useRef<Points>(null);
  const mouse = useMousePosition();
  const { viewport, size, gl } = useThree();
  const bounds = useRef<DOMRect | null>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3), original = new Float32Array(count * 3);
    // Deterministic coordinates prevent hydration noise and keep the field repeatable.
    let seed = 6041;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i=0;i<count;i++) {
      original[i*3] = (random()-.5)*7.5; original[i*3+1]=(random()-.5)*7.5; original[i*3+2]=(random()-.5)*2-1;
    }
    positions.set(original);
    const geometry = new BufferGeometry(); geometry.setAttribute("position",new BufferAttribute(positions,3));
    return { positions, original, geometry };
  }, [count]);
  useEffect(() => {
    const update = () => { bounds.current = gl.domElement.getBoundingClientRect(); };
    update(); window.addEventListener("scroll",update,{passive:true}); window.addEventListener("resize",update);
    return () => {window.removeEventListener("scroll",update);window.removeEventListener("resize",update);};
  }, [gl, size]);
  useEffect(()=>()=>data.geometry.dispose(),[data]);
  useFrame(({clock},delta)=>{
    if(!points.current) return;
    const rect=bounds.current;
    const mx=rect ? ((mouse.x.get()-rect.left)/rect.width-.5)*viewport.width : 100;
    const my=rect ? -((mouse.y.get()-rect.top)/rect.height-.5)*viewport.height : 100;
    const radius=150/size.width*viewport.width;
    const forceEnabled=mouse.fine && mouse.visible;
    for(let i=0;i<count;i++) {
      const base=i*3;
      let tx=data.original[base]+Math.sin(clock.elapsedTime*.13+i)*.12;
      let ty=data.original[base+1]+Math.cos(clock.elapsedTime*.1+i)*.14;
      const dx=tx-mx,dy=ty-my,distance=Math.hypot(dx,dy);
      if(forceEnabled && distance<radius && distance>.001){const force=(1-distance/radius)*.45;tx+=dx/distance*force;ty+=dy/distance*force;}
      data.positions[base]+=(tx-data.positions[base])*Math.min(delta*3,1);
      data.positions[base+1]+=(ty-data.positions[base+1])*Math.min(delta*3,1);
    }
    data.geometry.attributes.position.needsUpdate=true;
  });
  return <points ref={points} geometry={data.geometry}><pointsMaterial color={palette.accent} size={.018} transparent opacity={.48} depthWrite={false} sizeAttenuation/></points>;
}

function Lifecycle({ onReady }: { onReady: (ready: boolean) => void }) {
  const {gl}=useThree();
  useEffect(()=>{
    onReady(true);
    const lost=()=>onReady(false), restored=()=>onReady(true);
    gl.domElement.addEventListener("webglcontextlost",lost);gl.domElement.addEventListener("webglcontextrestored",restored);
    return ()=>{gl.domElement.removeEventListener("webglcontextlost",lost);gl.domElement.removeEventListener("webglcontextrestored",restored);};
  },[gl,onReady]);
  return null;
}

export default function WireframeScene({active,mobile,onReady}:{active:boolean;mobile:boolean;onReady:(ready:boolean)=>void}) {
  return <Canvas dpr={[1,1.5]} camera={{position:[0,0,6],fov:45}} gl={{alpha:true,antialias:false,powerPreference:"low-power"}} frameloop={active ? "always" : "never"} fallback={null} style={{pointerEvents:"none"}}><Lifecycle onReady={onReady}/><Wireframe/><Particles count={mobile ? 32 : 90}/></Canvas>;
}
