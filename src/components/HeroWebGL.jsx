import { useEffect, useRef } from 'react';

const vertex = `attribute vec2 aPosition; void main(){ gl_Position=vec4(aPosition,0.0,1.0); }`;
const fragment = `precision highp float;
uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
float curveX(vec2 p,float offset,float bend,float phase){
  float t=uTime*.035;
  return p.y*.64+offset+sin(p.y*1.55+phase+t)*bend+sin(p.y*3.1-phase-t*.7)*.035;
}
float band(vec2 p,float offset,float width,float bend,float phase){
  float d=abs(p.x-curveX(p,offset,bend,phase));
  return 1.0-smoothstep(width,width+.055,d);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  vec2 p=uv-.5; p.x*=uResolution.x/uResolution.y;
  p.x+=uMouse.x*.025; p.y+=uMouse.y*.016;
  float n=noise(uv*2.4+uTime*.012);
  vec3 col=mix(vec3(.018,.004,.028),vec3(.105,.012,.145),smoothstep(.12,.85,uv.y));
  col+=vec3(.30,.015,.22)*exp(-length((uv-vec2(.90,.88))*vec2(1.0,1.45))*2.15);
  col+=vec3(.20,.025,.34)*exp(-length((uv-vec2(.63,.52))*vec2(1.2,1.1))*2.0);
  col+=vec3(.07,.008,.12)*n;

  float d1=abs(p.x-curveX(p,-.46,.12,.3));
  float d2=abs(p.x-curveX(p,-.08,.095,1.8));
  float d3=abs(p.x-curveX(p,.34,.075,3.1));
  float d4=abs(p.x-curveX(p,-.78,.15,4.4));
  float r1=band(p,-.46,.27,.12,.3);
  float r2=band(p,-.08,.17,.095,1.8);
  float r3=band(p,.34,.22,.075,3.1);
  float r4=band(p,-.78,.34,.15,4.4);

  vec3 c1=mix(vec3(.25,.08,.38),vec3(1.0,.22,.50),smoothstep(-.35,.45,uv.y));
  vec3 c2=mix(vec3(.20,.22,.60),vec3(.75,.20,.72),uv.x);
  vec3 c3=mix(vec3(.12,.24,.58),vec3(.82,.16,.48),uv.y);
  float edge1=exp(-d1*.0)*0.0 + smoothstep(.27,.12,d1)-smoothstep(.12,.025,d1);
  float edge2=smoothstep(.17,.07,d2)-smoothstep(.07,.018,d2);
  float edge3=smoothstep(.22,.09,d3)-smoothstep(.09,.02,d3);
  float inner1=smoothstep(.24,.03,d1)*(0.72+.28*sin(uv.y*7.0+uTime*.12));
  float inner2=smoothstep(.14,.025,d2)*(0.72+.28*sin(uv.x*6.0-uTime*.1));
  float inner3=smoothstep(.19,.03,d3);

  col=mix(col,col+c1*.42,r4*.42);
  col=mix(col,col+c1*.72,r1*.68);
  col=mix(col,col+c2*.62,r2*.64);
  col=mix(col,col+c3*.58,r3*.60);
  col+=vec3(1.0,.50,.70)*edge1*.34+vec3(.28,.45,1.0)*edge1*.20;
  col+=vec3(1.0,.35,.65)*edge2*.30+vec3(.25,.48,1.0)*edge2*.22;
  col+=vec3(.35,.50,1.0)*edge3*.35+vec3(1.0,.26,.62)*edge3*.14;
  col+=vec3(.52,.18,.75)*inner1*.10+vec3(.22,.35,.95)*inner2*.12+vec3(1.0,.18,.52)*inner3*.08;
  col*=.82+.18*smoothstep(.92,.15,length(p));
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
