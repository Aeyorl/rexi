import { useEffect, useRef } from 'react';

const vertex = `attribute vec2 aPosition; void main(){ gl_Position=vec4(aPosition,0.0,1.0); }`;
const fragment = `precision highp float;
uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
float ribbon(vec2 p,float offset,float width,float speed,float bend){
  float drift=sin(p.y*2.1+uTime*speed+offset)*bend+sin(p.y*5.0-uTime*speed*.7)*.012;
  float line=abs(p.x-(p.y*.58+offset+drift));
  return smoothstep(width,0.0,line)*smoothstep(-.3,1.0,p.y)*smoothstep(1.25,-.15,p.y);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution; vec2 p=uv-.5; p.x*=uResolution.x/uResolution.y;
  p.x+=uMouse.x*.012; p.y+=uMouse.y*.008;
  vec3 col=vec3(.018,.006,.027);
  float glow=exp(-length((uv-vec2(.88,.95))*vec2(1.0,1.7))*3.1);
  col+=vec3(.38,.015,.25)*glow*.48;
  col+=vec3(.11,.015,.22)*noise(uv*3.0+uTime*.025)*.13;
  float r1=ribbon(p,-.48,.095,.18,.045), r2=ribbon(p,-.12,.052,.12,.035), r3=ribbon(p,.25,.075,.10,.025);
  float edge1=smoothstep(.07,.0,abs(p.x-(p.y*.58-.48+sin(p.y*2.1+uTime*.18-.48)*.045)));
  vec3 glass=vec3(.50,.19,.72)*r1+vec3(.98,.26,.54)*r2+vec3(.25,.31,.98)*r3;
  col+=glass*.52;
  col+=vec3(.95,.50,.69)*pow(r1,2.8)*.18;
  col+=vec3(.18,.40,1.0)*pow(edge1,4.0)*.16;
  col+=vec3(.22,.02,.25)*ribbon(p,-.70,.16,.07,.02)*.18;
  float vignette=smoothstep(.9,.18,length(p)); col*=.72+.28*vignette;
  gl_FragColor=vec4(col,1.0);
}`;

export default function HeroWebGL() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return undefined;
    const compile = (type, source) => { const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader); return shader; };
    const program=gl.createProgram(); gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program); gl.useProgram(program);
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'aPosition'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const time=gl.getUniformLocation(program,'uTime'), resolution=gl.getUniformLocation(program,'uResolution'), mouse=gl.getUniformLocation(program,'uMouse');
    let frame=0, start=performance.now(), pointerX=0, pointerY=0;
    const resize=()=>{ const rect=canvas.parentElement.getBoundingClientRect(); const dpr=Math.min(window.devicePixelRatio||1,1.75); canvas.width=Math.max(1,rect.width*dpr); canvas.height=Math.max(1,rect.height*dpr); canvas.style.width=`${rect.width}px`; canvas.style.height=`${rect.height}px`; gl.viewport(0,0,canvas.width,canvas.height); };
    const move=(event)=>{ const rect=canvas.getBoundingClientRect(); pointerX=(event.clientX-rect.left)/rect.width-.5; pointerY=(event.clientY-rect.top)/rect.height-.5; };
    const draw=(now)=>{ gl.uniform1f(time,reduced?0:(now-start)/1000); gl.uniform2f(resolution,canvas.width,canvas.height); gl.uniform2f(mouse,pointerX,pointerY); gl.drawArrays(gl.TRIANGLES,0,6); if(!reduced) frame=requestAnimationFrame(draw); };
    const observer=new ResizeObserver(resize); observer.observe(canvas.parentElement); resize(); canvas.parentElement.addEventListener('pointermove',move,{passive:true}); draw(performance.now());
    return ()=>{ cancelAnimationFrame(frame); observer.disconnect(); canvas.parentElement.removeEventListener('pointermove',move); gl.deleteBuffer(buffer); gl.deleteProgram(program); };
  }, []);
  return <canvas ref={ref} className="hero-webgl" aria-hidden="true" />;
}
