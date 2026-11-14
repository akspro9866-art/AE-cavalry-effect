#!/usr/bin/env node
// VERSION 0.11.0 (mock bridge)
import{pathToFileURL as lr}from"node:url";import ir from"node:http";import hn from"node:vm";import Ze from"node:path";import Q from"node:fs";import{createHash as Xt}from"node:crypto";import te from"node:fs";import it from"node:os";import ne from"node:path";var v=n=>({kind:"number",default:n}),se=(n,e)=>({kind:"point",default:[n,e]}),ve=n=>({kind:"color",default:n}),X=(n="")=>({kind:"string",default:n}),re=(n=!1)=>({kind:"bool",default:n}),V={kind:"any"},P={is3d:re(!1),blendMode:X("normal"),masks:V,clippingMode:V,deformers:V,drawOnTopOfParent:re(!1),excludeFromLayout:re(!1),featherAmount:v(0),featherMasks:V,filters:V,posterizeFrameRate:v(0),frozen:re(!1),guideLayer:re(!1),hidden:re(!1),layoutFrame:v(0),forceLottieBake:re(!1),webExport:re(!1),motionBlur:re(!1),multiStroke:re(!1),posterizeTimeOffset:v(0),opacity:v(1),pivot:se(0,0),position:se(0,0),posterizeTime:v(0),rotation:v(0),scale:se(100,100),skew:v(0),stroke:V,matteMode:V,trackMattes:V,name:X(),id:X()},fe={generator:V,"generator.dimensions":se(100,100),"generator.radius":se(50,50),"generator.cornerRadius":v(0),"generator.tlRadius":v(0),"generator.trRadius":v(0),"generator.brRadius":v(0),"generator.blRadius":v(0),"generator.chamfer":v(0),"generator.divisions":v(0),"generator.radiusTop":v(0),"generator.radiusBottom":v(0),"generator.vectorize":re(!1),"generator.expression":X(),radius:se(50,50),material:V,"material.materialColor":ve("#ffffff"),"material.alpha":v(1),"material.colorShaders":V,"material.shader":V,"stroke.strokeColor":ve("#ffffff"),"stroke.width":v(1),strokeColor:ve("#ffffff"),strokeWidth:v(1)},vn={text:X(),font:X("Inter"),fontSize:v(24),letterSpacing:v(0),wordSpacing:v(0),lineSpacing:v(1.2),paragraphSpacing:v(0),textBoxSize:se(0,0),horizontalAlignment:X("left"),autoName:re(!0),style:V,pathTravel:v(0),pathPush:v(0),pathLoop:re(!1),material:V,"material.materialColor":ve("#ffffff")},tt={compNode:{visual:!1,attributes:{resolution:se(1920,1080),"resolution.x":v(1920),"resolution.y":v(1080),fps:v(24),backgroundColor:ve("#000000"),startFrame:v(0),endFrame:v(215)}},basicShape:{visual:!0,attributes:{...P,...fe}},ellipseShape:{visual:!0,attributes:{...P,...fe}},rectangleShape:{visual:!0,attributes:{...P,...fe}},polygonShape:{visual:!0,attributes:{...P,...fe}},starShape:{visual:!0,attributes:{...P,...fe}},editableShape:{visual:!0,attributes:{...P,inputPath:X(),fillRule:V,...fe}},textShape:{visual:!0,attributes:{...P,...vn}},group:{visual:!0,attributes:{...P,groupMode:V}},image:{visual:!0,attributes:{...P,assetPath:X()}},preComp:{visual:!0,attributes:{...P}},duplicator:{visual:!1,attributes:{distribution:X("linear"),count:v(2),size:se(100,100),staggerOffset:v(0),generator:V}},falloff:{visual:!1,attributes:{...P,falloffType:X("linear"),influence:v(1),radius:v(100),size:se(100,100),strength:v(100),shapeType:v(0),position:se(0,0)}},stagger:{visual:!1,attributes:{...P,delayFrames:v(4),staggerType:X("temporal"),offset:v(4)}},noise:{visual:!1,attributes:{...P,frequency:v(1),timeScale:v(1),seed:v(0),amplitude:v(1),strength:v(10),"generator.frequency":v(1),"generator.seed":v(0),falloffs:V}},oscillator:{visual:!1,attributes:{...P,frequency:v(1),amplitude:v(1),phase:v(0),waveType:X("sine")}},subMesh:{visual:!1,attributes:{...P,subMeshLevel:v(0),levelMode:v(0),timeOffset:v(0),falloffs:V}},travel:{visual:!1,attributes:{...P,travel:v(0),start:v(0),end:v(100)}},bevel:{visual:!1,attributes:{...P,bevelRadius:v(4),cornerRadius:v(4)}},boolean:{visual:!1,attributes:{...P,booleanMode:X("union")}},pathfinder:{visual:!1,attributes:{...P,pathfinderMode:X("union")}},blurFilter:{visual:!1,attributes:{...P,blurRadius:v(4)}},gaussianBlurFilter:{visual:!1,attributes:{...P,blurRadius:v(4)}},dropShadowFilter:{visual:!1,attributes:{...P,shadowRadius:v(4),shadowOffsetX:v(0),shadowOffsetY:v(4),shadowColor:ve("#000000"),shadowOpacity:v(.5)}},innerShadowFilter:{visual:!1,attributes:{...P,shadowRadius:v(4)}},grainFilter:{visual:!1,attributes:{...P,grainAmount:v(.2)}},backgroundBlurFilter:{visual:!1,attributes:{...P,blurRadius:v(4)}},connectShape:{visual:!1,attributes:{...P,targetMode:V,maxConnections:v(10),curve:re(!1)}},meshDistribution:{visual:!1,attributes:{...P,distribution:X("linear")}},null:{visual:!1,attributes:{...P}},camera:{visual:!1,attributes:{...P}},javaScriptShape:{visual:!0,attributes:{...P,...fe,expression:X(),"generator.expression":X()}},javaScriptUtility:{visual:!1,attributes:{...P,expression:X(),output:v(0)}},javaScriptModifier:{visual:!1,attributes:{...P,expression:X(),output:v(0)}},javaScriptDeformer:{visual:!1,attributes:{...P,expression:X(),falloffs:V}},javaScriptEmitter:{visual:!1,attributes:{...P,expression:X()}},skslShader:{visual:!1,attributes:{...P,code:X(),shaderCode:X(),uniforms:V}},skslFilter:{visual:!1,attributes:{...P,code:X(),shaderCode:X(),uniforms:V}},renderQueueItem:{visual:!1,attributes:{...P,selected:re(!0),preRenderExpression:X(),postRenderExpression:X(),renderSetupExpression:X()}},linearGradient:{visual:!1,attributes:{...P,stops:V,angle:v(0),start:se(-100,0),end:se(100,0),generator:V}},value:{visual:!1,attributes:{...P,value:v(0)}},value2:{visual:!1,attributes:{...P,value:se(0,0)}},valueBlend:{visual:!1,attributes:{...P,a:V,b:V,weight:v(50)}},transformConstraint:{visual:!1,attributes:{...P,weight:v(100),target:V}},align:{visual:!1,attributes:{...P,x:v(0),y:v(0),alignX:v(0),alignY:v(0)}},spring:{visual:!1,attributes:{...P,stiffness:v(200),damping:v(20),mass:v(1)}},stringGenerator:{visual:!1,attributes:{...P,number:v(0),precision:v(0),prefix:X(),suffix:X(),"generator.number":v(0),"generator.precision":v(0),"generator.prefix":X(),"generator.suffix":X()}}},xn={visual:!1,attributes:{}};function je(n){return tt[n]??xn}function me(n,e){if(e.startsWith("array.")||e.startsWith("dynamic.")||e.startsWith("uniforms."))return!0;let t=je(n);if(e in t.attributes)return!0;let r=e.lastIndexOf(".");if(r>0){let a=e.slice(0,r);if(a in t.attributes||me(n,a))return!0}return!1}function nt(n,e){return me(n,e)||e==="id"||e==="deformers"||e==="generator"||e==="masks"||e==="filters"||e==="falloffs"||e==="material.shader"||e==="material.colorShaders"||e==="transform"}import kn from"node:zlib";function Yt(n){if(n&&typeof n=="object"){let t=n;return[Number(t.r)||0,Number(t.g)||0,Number(t.b)||0,t.a==null?255:Number(t.a)||255]}if(typeof n!="string")return[255,255,255,255];let e=n.replace("#","");return e.length===3?[parseInt(e[0]+e[0],16),parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),255]:e.length>=6?[parseInt(e.slice(0,2),16)||0,parseInt(e.slice(2,4),16)||0,parseInt(e.slice(4,6),16)||0,e.length>=8&&parseInt(e.slice(6,8),16)||255]:[255,255,255,255]}function wn(n,e,t){switch(n){case"multiply":return e*t/255;case"screen":return 255-(255-e)*(255-t)/255;case"add":case"linearDodge":return Math.min(255,e+t);default:return t}}function Sn(n,e){let r=String(e.attrs.get("generator")??"rectangleShape").includes("ellipse")?"ellipse":"rect",a=n.getAttr(e,"generator.dimensions"),s=Array.isArray(a)?a:[100,100],i=n.worldTransform(e.id),o=n.getAttr(e,"pivot"),l=Array.isArray(o)?o:[0,0],u=n.getAttr(e,"position"),p=Array.isArray(u)?u:[0,0];return{kind:r,w:Math.max(1,Number(s[0])||100),h:Math.max(1,Number(s[1])||100),cx:Number(p[0])||0,cy:Number(p[1])||0,rotation:i.rotation,scaleX:i.scaleX,scaleY:i.scaleY,pivotX:Number(l[0])||0,pivotY:Number(l[1])||0}}function An(n,e){let t=String(n.getAttr(e,"text")??""),r=Number(n.getAttr(e,"fontSize"))||24,a=n.getAttr(e,"textBoxSize"),s=Array.isArray(a)&&Number(a[0])>0?a:[t.length*r*.55,r*1.2],i=n.worldTransform(e.id),o=n.getAttr(e,"pivot"),l=Array.isArray(o)?o:[0,0],u=n.getAttr(e,"position"),p=Array.isArray(u)?u:[0,0];return{kind:"rect",w:Math.max(1,Number(s[0])),h:Math.max(1,Number(s[1])),cx:Number(p[0])||0,cy:Number(p[1])||0,rotation:i.rotation,scaleX:i.scaleX,scaleY:i.scaleY,pivotX:Number(l[0])||0,pivotY:Number(l[1])||0}}function at(n,e,t,r,a){let s=n.comps.get(e),i=Math.max(1,Math.round(r)),o=Math.max(1,Math.round(a)),l=Buffer.alloc(i*o*4),u=Yt(s?.bgColor??"#000000");for(let k=0;k<i*o;k++)l[k*4]=u[0],l[k*4+1]=u[1],l[k*4+2]=u[2],l[k*4+3]=255;if(!s)return{width:i,height:o,rgba:l};let p=i/s.width,y=1/p;for(let k of s.layerIds){let g=n.layers.get(k);if(!g||n.getAttr(g,"hidden")===!0)continue;let b=g.type==="textShape",O=g.type==="basicShape"||g.type==="editableShape"||g.type==="rectangleShape"||g.type==="ellipseShape";if(!b&&!O)continue;let x=b?An(n,g):Sn(n,g);if(!x)continue;let A=Yt(n.getAttr(g,"material.materialColor")),T=Number(n.getAttr(g,"material.alpha")),U=Number(n.getAttr(g,"opacity")),R=Math.max(0,Math.min(1,(Number.isFinite(T)?T:1)*(Number.isFinite(U)?U:1)));if(R<=0)continue;let w=String(n.getAttr(g,"blendMode")??"normal"),F=x.w/2*x.scaleX,M=x.h/2*x.scaleY,L=-x.rotation*Math.PI/180,C=Math.cos(L),Y=Math.sin(L),j=x.cx-(x.pivotX*x.scaleX*Math.cos(x.rotation*Math.PI/180)-x.pivotY*x.scaleY*Math.sin(x.rotation*Math.PI/180)),$=x.cy-(x.pivotX*x.scaleX*Math.sin(x.rotation*Math.PI/180)+x.pivotY*x.scaleY*Math.cos(x.rotation*Math.PI/180)),J=Math.abs(F*C)+Math.abs(M*Y),ue=Math.abs(F*Y)+Math.abs(M*C),c=Math.max(0,Math.floor((j-J)*p+i/2)),m=Math.min(i-1,Math.ceil((j+J)*p+i/2)),d=Math.max(0,Math.floor(o/2-($+ue)*p)),S=Math.min(o-1,Math.ceil(o/2-($-ue)*p));for(let I=d;I<=S;I++)for(let h=c;h<=m;h++){let f=(h+.5-i/2)*y,E=(o/2-(I+.5))*y,_=f-j,B=E-$,q=_*C-B*Y,H=_*Y+B*C,K;if(x.kind==="ellipse"){let Z=q/Math.max(F,1e-6),oe=H/Math.max(M,1e-6);K=Z*Z+oe*oe<=1}else K=Math.abs(q)<=F&&Math.abs(H)<=M;if(!K)continue;let z=(I*i+h)*4,G=R*255,W=l[z+3],D=G+W/255*(255-G);if(D!==0){for(let Z=0;Z<3;Z++){let oe=l[z+Z],ze=w==="normal"?A[Z]:wn(w,oe,A[Z]);l[z+Z]=Math.round((ze*G+oe*(W/255)*(255-G))/(D||1))}l[z+3]=Math.round(D)}}}return{width:i,height:o,rgba:l}}var Cn=(()=>{let n=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let r=0;r<8;r++)t=t&1?3988292384^t>>>1:t>>>1;n[e]=t>>>0}return n})();function En(n){let e=4294967295;for(let t=0;t<n.length;t++)e=Cn[(e^n[t])&255]^e>>>8;return(e^4294967295)>>>0}function rt(n,e){let t=Buffer.alloc(4);t.writeUInt32BE(e.length,0);let r=Buffer.from(n,"ascii"),a=Buffer.alloc(4);return a.writeUInt32BE(En(Buffer.concat([r,e])),0),Buffer.concat([t,r,e,a])}function pe(n,e,t){let r=Buffer.from([137,80,78,71,13,10,26,10]),a=Buffer.alloc(13);a.writeUInt32BE(e,0),a.writeUInt32BE(t,4),a[8]=8,a[9]=6;let s=e*4,i=Buffer.alloc((s+1)*t);for(let l=0;l<t;l++)i[l*(s+1)]=0,n.copy(i,l*(s+1)+1,l*s,(l+1)*s);let o=kn.deflateSync(i,{level:6});return Buffer.concat([r,rt("IHDR",a),rt("IDAT",o),rt("IEND",Buffer.alloc(0))])}function ce(n){throw new Error(`mock api: ${n}`)}var xe=class{scene;options;lastFrames=[];#n=null;constructor(e,t={}){this.scene=e,this.options=t,e.createComp()}create(e,t,r){return this.scene.createLayer(String(e),t?String(t):void 0).id}primitive(e,t){let r=this.scene.createLayer("basicShape",t);return this.scene.setAttr(r,"generator",`${e}Shape`),r.id}convertSVGToLayers(e){let t;try{t=te.readFileSync(this.#t(e),"utf8")}catch{ce(`convertSVGToLayers: cannot read '${e}'`)}let r=/viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)/i.exec(t),a=/<svg[^>]*?\bwidth\s*=\s*["']\s*([\d.]+)/i.exec(t),s=/<svg[^>]*?\bheight\s*=\s*["']\s*([\d.]+)/i.exec(t),i=r?[Number(r[3])||100,Number(r[4])||100]:[Number(a?.[1])||100,Number(s?.[1])||100],o=[],l=[...t.matchAll(/<path\b[^>]*?\bd\s*=\s*["']([^"']+)["']/gi)],u=l.length?l:[{1:""}];for(let p of u){let y=this.scene.createLayer("editableShape",ne.basename(e,ne.extname(e)));this.scene.setAttr(y,"inputPath",String(p[1])),this.scene.setAttr(y,"generator.dimensions",i),o.push(y.id)}return o}setGenerator(e,t,r){let a=this.#e(e);t!=="generator"&&ce(`setGenerator supports the 'generator' attribute, got '${t}'`),this.scene.setAttr(a,"generator",r)}set(e,t){let r=this.#e(e);for(let[a,s]of Object.entries(t??{})){this.scene.setAttr(r,a,s);let i=a.replace(/^(array|dynamic|uniforms)\./,"");if(r.dynamicAttrs?.has(i)||r.dynamicAttrs?.has(a))for(let o of[i,`array.${i}`,`dynamic.${i}`,`uniforms.${i}`])r.attrs.set(o,s);if((r.type==="skslShader"||r.type==="skslFilter")&&(a==="code"||a==="shaderCode")&&typeof s=="string")for(let o of s.matchAll(/\buniform\s+(?:float|int|bool|half\d*|vec\d+|float\d+|mat\d+|shader)\s+([A-Za-z_]\w*)\s*;/g)){let l=o[1];this.addDynamicAttribute(r.id,"double",l)}}this.#r(r)}#r(e){if(e.type!=="compNode")return;let t=this.scene.comps.get(e.id);if(!t)return;let r=this.scene.getAttr(e,"resolution");Array.isArray(r)&&r.length>=2&&(t.width=Math.max(1,Math.round(Number(r[0])||t.width)),t.height=Math.max(1,Math.round(Number(r[1])||t.height)));let a=this.scene.getAttr(e,"fps");Number.isFinite(Number(a))&&Number(a)>0&&(t.fps=Number(a));let s=this.scene.getAttr(e,"backgroundColor");typeof s=="string"&&s&&(t.bgColor=s);let i=this.scene.getAttr(e,"endFrame");Number.isFinite(Number(i))&&(t.endFrame=Math.max(1,Math.round(Number(i))),e.outFrame=t.endFrame)}get(e,t){let r=this.#e(e);return this.scene.getAttr(r,String(t))}addDynamic(e,t,r,a){return this.addDynamicAttribute(e,t,r,a)}addDynamicAttribute(e,t,r,a){let s=this.#e(e),i=new Set(["double","float","int","integer","bool","boolean","color","string","point","point2d","number"]),o=String(t??"double"),l=String(r??"param"),u=i.has(o.toLowerCase())&&!i.has(l.toLowerCase()),p=u?o:l,y=u?l:o,k=y.replace(/^(array|dynamic|uniforms)\./,"");s.dynamicAttrs||(s.dynamicAttrs=new Map);let g=a!==void 0&&!(typeof a=="boolean"&&p!=="bool"&&p!=="boolean")?a:p==="color"?"#ffffff":p==="string"?"":p==="point"||p==="point2d"?[0,0]:p==="bool"||p==="boolean"?!1:0;for(let N of[k,`array.${k}`,`dynamic.${k}`,`uniforms.${k}`])s.dynamicAttrs.set(N,{type:p,name:k,defaultValue:g}),s.attrs.has(N)||s.attrs.set(N,g);return y.includes(".")?y:`dynamic.${k}`}connect(e,t,r,a,s){let i=this.#e(e),o=this.#e(r),l=i.dynamicAttrs?.has(String(t))===!0,u=o.dynamicAttrs?.has(String(a))===!0;!l&&!nt(i.type,String(t))&&this.scene.warn(`connect: unknown source attribute ${i.id}.${t}`),!u&&!me(o.type,String(a))&&!nt(o.type,String(a))&&this.scene.warn(`connect: unknown target attribute ${o.id}.${a}`),this.scene.connect(i.id,String(t),o.id,String(a),s===!0)}parent(e,t){this.scene.parent(String(e),String(t))}unParent(e){this.scene.parent(String(e),null)}getParent(e){return this.#e(e).parentId}rename(e,t){this.#e(e).name=String(t)}duplicate(e,t){let r=this.#e(e),a=this.scene.createLayer(r.type,r.name);for(let[s,i]of r.attrs)a.attrs.set(s,i);for(let[s,i]of r.keyframes)a.keyframes.set(s,i.map(o=>({...o})));return a.inFrame=r.inFrame,a.outFrame=r.outFrame,a.id}deleteLayer(e){let t=this.#e(e);for(let r of this.scene.comps.values()){let a=r.layerIds.indexOf(t.id);a>=0&&r.layerIds.splice(a,1)}this.scene.layers.delete(t.id)}keyframe(e,t,r){return this.scene.keyframe(String(e),t,r??{})[0]??""}magicEasing(e,t,r,a,s){this.scene.magicEasing(String(e),String(t),r,a,s)}modifyKeyframe(e,t){let r=this.#e(e);for(let[a,s]of Object.entries(t??{})){let i=r.keyframes.get(a);i||ce(`modifyKeyframe: '${a}' is not animated on ${r.id}`);let o=Math.round(Number(s.frame)),l=i.find(u=>u.frame===o);l||ce(`modifyKeyframe: no keyframe at frame ${o} on ${r.id}.${a}`),"newFrame"in s&&s.newFrame!=null&&(l.frame=Math.round(Number(s.newFrame))),"newValue"in s&&s.newValue!=null&&(l.value=s.newValue),"type"in s&&s.type!=null&&(l.type=Number(s.type)),i.sort((u,p)=>u.frame-p.frame)}}modifyKeyframeTangent(e,t){let r=this.#e(e);for(let[a,s]of Object.entries(t??{})){let i=r.keyframes.get(a);i||ce(`modifyKeyframeTangent: '${a}' is not animated on ${r.id}`);let o=Math.round(Number(s.frame)),l=i.find(y=>y.frame===o);l||ce(`modifyKeyframeTangent: no keyframe at frame ${o} on ${r.id}.${a}`),l.type=0;let u=s.inHandle!==!1,p=s.outHandle!==!1;if(l.magicEase=void 0,"angle"in s&&s.angle!=null){let y=Number(s.angle);u&&(l.inAngle=y),p&&(l.outAngle=y)}if("weight"in s&&s.weight!=null){let y=Math.max(0,Number(s.weight));u&&(l.inWeight=y),p&&(l.outWeight=y)}if("angleLocked"in s&&(l.magicEase=void 0),"xValue"in s&&s.xValue!=null){let y=Math.abs(Number(s.xValue)-l.frame);u&&(l.inWeight=y),p&&(l.outWeight=y)}}}setKeyframeVelocity(e,t){let r=this.#e(e);for(let[a,s]of Object.entries(t??{})){let i=r.keyframes.get(a);i||ce(`setKeyframeVelocity: '${a}' is not animated on ${r.id}`);let o=Math.round(Number(s.frame)),l=i.find(u=>u.frame===o);l||ce(`setKeyframeVelocity: no keyframe at frame ${o} on ${r.id}.${a}`),l.velocity={...s}}}clearKeyframeVelocity(e,t){let r=this.#e(e);for(let[a,s]of Object.entries(t??{})){let i=r.keyframes.get(a);if(!i)continue;let o=i.find(l=>l.frame===Math.round(Number(s.frame)));o&&delete o.velocity}}deleteKeyframe(e,t,r){let s=this.#e(e).keyframes.get(String(t));if(!s)return;let i=Math.round(r),o=s.findIndex(l=>l.frame===i);o>=0&&s.splice(o,1)}deleteAnimation(e,t){this.#e(e).keyframes.delete(String(t))}getKeyframeTimes(e,t){return(this.#e(e).keyframes.get(String(t))??[]).map(a=>a.frame)}getKeyframeIdsForAttribute(e,t){let r=this.#e(e);return(r.keyframes.get(String(t))??[]).map(a=>`${r.id}:${t}:${a.frame}`)}getAnimatedAttributes(e){return[...this.#e(e).keyframes.keys()]}getAttributes(e){let t=this.#e(e),r=["name","id","position","position.x","position.y","scale","scale.x","scale.y","rotation","opacity","pivot","hidden"];return[...new Set([...r,...t.attrs.keys(),...t.keyframes.keys()])]}getAttributeDefinition(e,t){let r=this.#e(e);return r.dynamicAttrs?.has(String(t))?{name:String(t),type:r.dynamicAttrs.get(String(t)).type}:me(r.type,String(t))?{name:String(t),type:"attribute"}:null}getSelection(e){return[...this.scene.selection]}select(e){this.scene.selection=e.map(String)}getActiveComp(){return this.scene.activeComp()?.id??""}setActiveComp(e){let t=this.scene.comps.get(String(e));t||ce(`setActiveComp: no comp '${e}'`),this.scene.activeCompId=t.id}createComp(e,t,r,a,s){return this.scene.createComp(e,t,r,a,s).id}getCompLayers(e,t){return this.scene.compLayers(e===!0,t?String(t):void 0)}getAllLayerTypes(e){return[...new Set([...this.scene.layers.values()].map(t=>t.type))]}getLayerType(e){return this.#e(e).type}getNiceName(e){let t=this.#e(e);return t.name&&t.name!==t.type?t.name:t.id}getFrame(){return this.scene.frame}setFrame(e){this.scene.frame=Math.round(Number(e))}getInFrame(e){return this.#e(e).inFrame}getOutFrame(e){return this.#e(e).outFrame}setInFrame(e,t){this.#e(e).inFrame=Math.round(Number(t))}setOutFrame(e,t){this.#e(e).outFrame=Math.round(Number(t))}offsetLayerTime(e,t){let r=this.#e(e);r.inFrame+=Math.round(t),r.outFrame+=Math.round(t)}getBoundingBox(e,t){let r=this.scene.boundingBox(String(e));return r?{x:r.x,y:r.y,width:r.width,height:r.height,centre:r.centre,left:r.left,right:r.right,top:r.top,bottom:r.bottom,world:t!==!1}:null}getChildren(e){let t=String(e);return[...this.scene.layers.values()].filter(r=>r.parentId===t).map(r=>r.id)}getRenderQueueItems(){let e=[...this.scene.layers.values()].filter(r=>r.type==="renderQueueItem").map(r=>r.id);if(e.length>0)return e;let t=this.scene.createLayer("renderQueueItem","Render Queue Item 1");return this.scene.setAttr(t,"selected",!0),[t.id]}addRenderQueueItem(e){let t=this.scene.createLayer("renderQueueItem","Render Queue Item");return this.scene.setAttr(t,"selected",!0),t.id}getJsLogPath(){return ne.join(this.getAppDataFolder(),"logs","js_log.txt")}appendJsLog(e){if(!e.length)return;let t=e.map(r=>`[${String(r.level).toUpperCase()}] ${r.text}`).join(`
`)+`
`;for(let r of[this.getJsLogPath(),ne.join(this.getAppDataFolder(),"js_log.txt")])try{te.mkdirSync(ne.dirname(r),{recursive:!0}),te.appendFileSync(r,t,"utf8")}catch{}}getSelectionBoundingBox(){let e=1/0,t=1/0,r=-1/0,a=-1/0;for(let s of this.scene.selection){let i=this.scene.boundingBox(s);i&&(e=Math.min(e,i.x),t=Math.min(t,i.y),r=Math.max(r,i.x+i.width),a=Math.max(a,i.y+i.height))}return e===1/0?null:{x:e,y:t,width:r-e,height:a-t}}getPivotPosition(e){let t=this.#e(e),r=this.scene.worldTransform(t.id);return{x:r.x,y:r.y}}centrePivot(e){this.#e(e).attrs.set("pivot",[0,0])}getInConnectedAttributes(e){return this.scene.inConnectedAttributes(String(e))}getInConnection(e,t){return this.scene.inConnection(String(e),String(t))[0]??""}getOutConnections(e,t){return this.scene.outConnections(String(e),String(t)).map(r=>`${r.dstId}.${r.dstAttr}`)}getOutConnectedAttributes(e){let t=String(e);return[...new Set(this.scene.connections.filter(r=>r.srcId===t).map(r=>r.srcAttr))]}reorder(e,t){let r=this.scene.activeComp(),a=this.#e(e);if(!r)return;let s=r.layerIds.indexOf(a.id),i=r.layerIds.indexOf(String(t));s<0||i<0||r.layerIds.splice(i,0,r.layerIds.splice(s,1)[0])}startUndoGroup(e){this.scene.startUndoGroup(String(e))}endUndoGroup(){this.scene.endUndoGroup()}startUndo(e="Scene Execution"){this.scene.startUndoGroup(String(e))}endUndo(){this.scene.endUndoGroup()}renderPNGFrame(e,t=100){let r=this.scene.activeComp();r||ce("renderPNGFrame: no active comp");let a=Math.max(1,Math.min(400,Number(t)||100))/100,s=Math.max(1,Math.round(r.width*a)),i=Math.max(1,Math.round(r.height*a)),l=this.options.render?.(this.scene,r.id,this.scene.frame,s,i)?.rgba??Buffer.alloc(s*i*4);if(this.lastFrames.push({frame:this.scene.frame,width:s,height:i,rgba:l}),this.lastFrames.length>64&&this.lastFrames.shift(),e){let u=/\.[A-Za-z0-9]+$/.test(e)?e:`${e}.png`;te.mkdirSync(ne.dirname(u),{recursive:!0}),te.writeFileSync(`${u}.rgba`,l),te.writeFileSync(u,pe(l,s,i))}return!0}writeToFile(e,t,r){let a=this.#t(e);return te.mkdirSync(ne.dirname(a),{recursive:!0}),te.writeFileSync(a,String(t)),!0}readFromFile(e){return te.readFileSync(this.#t(e),"utf8")}filePathExists(e){return te.existsSync(this.#t(e))}getFileSize(e){try{return te.statSync(this.#t(e)).size}catch{return 0}}makeFolder(e){return te.mkdirSync(this.#t(e),{recursive:!0}),!0}getFolderFromPath(e){return ne.dirname(String(e))}getHomeFolder(){return this.options.homeFolder??ne.join(it.tmpdir(),"stallion-mock-home")}getTempFolder(){return ne.join(it.tmpdir(),"stallion-mock-tmp")}getAppDataFolder(){return ne.join(this.getHomeFolder(),"AppData")}getSceneFilePath(){return this.#n??"mock://scene.cv"}getCavalryVersion(){return"2.8.0-mock"}sceneHasUnsavedChanges(){return!1}saveSceneAs(e){let t=this.#t(e);return te.existsSync(t)?!1:(te.mkdirSync(ne.dirname(t),{recursive:!0}),te.writeFileSync(t,this.scene.checkpointSnapshot()),this.#n=t,!0)}openScene(e,t){let r=this.#t(e),a;try{a=te.readFileSync(r,"utf8")}catch{return!1}try{this.scene.restoreCheckpoint(a)}catch{return!1}return this.#n=r,!0}layerExists(e){return this.scene.layer(e)!==null}#e(e){let t=this.scene.layer(e);return t||ce(`no layer '${e}'`),t}#t(e){let t=ne.resolve(String(e)),r=ne.resolve(this.getHomeFolder()),a=ne.resolve(it.tmpdir());return t.startsWith(r)||t.startsWith(a)?t:ne.join(r,"files",t.replace(/^([A-Za-z]:)?[\\/]+/,""))}};var Gt={None:[0,0,1,1],SlowIn:[.42,0,1,1],SlowOut:[0,0,.58,1],SlowInSlowOut:[.42,0,.58,1],VerySlowIn:[.76,0,1,1],VerySlowOut:[0,0,.24,1],VerySlowInVerySlowOut:[.76,0,.24,1],SpringIn:[.64,0,.78,.4],SpringOut:[.22,1.4,.36,1],SpringInSpringOut:[.5,1.4,.5,.4],AnticipateIn:[.36,0,.66,-.56],OvershootOut:[.34,1.56,.64,1],AnticipateInOvershootOut:[.5,-.4,.5,1.4],BounceOut:[.34,1.56,.64,1]},In={QuarticIn:"SlowIn",QuarticOut:"SlowOut",QuarticInOut:"SlowInSlowOut",CubicIn:"SlowIn",CubicOut:"SlowOut",CubicInOut:"SlowInSlowOut",ExpoIn:"VerySlowIn",ExpoOut:"VerySlowOut",ExpoInOut:"VerySlowInVerySlowOut",BackIn:"AnticipateIn",BackOut:"OvershootOut",BackInOut:"AnticipateInOvershootOut",Linear:"None"};function Fn(n,e){let[,t,,r]=n,a=1-e;return 3*a*a*e*t+3*a*e*e*r+e*e*e}function Nn(n,e){let[t,,r]=n,a=1-e;return 3*a*a*e*t+3*a*e*e*r+e*e*e}function Rn(n,e){let t=In[n],r=Gt[t??n]??Gt.SlowInSlowOut,a=0,s=1,i=e;for(let o=0;o<24;o++)i=(a+s)/2,Nn(r,i)<e?a=i:s=i;return Fn(r,i)}function ke(n,e,t){return n+(e-n)*t}function ae(n){if(Array.isArray(n)&&n.length>=2)return[Number(n[0])||0,Number(n[1])||0];if(n&&typeof n=="object"){let e=n;if("x"in e&&"y"in e)return[Number(e.x)||0,Number(e.y)||0]}return null}function st(n){let e=2166136261,t=461845907;for(let a=0;a<n.length;a++){let s=n.charCodeAt(a);e=Math.imul((e^s&255)>>>0,16777619)>>>0,t=Math.imul((t^s>>>8&255)>>>0,16777619)>>>0}let r=a=>{let s="";for(let i=28;i>=0;i-=4)s+=(a>>>i&15).toString(16);return s};return r(e)+r(t)}var we=class n{comps=new Map;layers=new Map;connections=[];selection=[];activeCompId=null;frame=0;diagnostics=[];lastUndo=null;strictSchema;counters=new Map;undoDepth=0;undoCreated=[];compCounter=0;constructor(e={}){this.strictSchema=e.strictSchema!==!1}diag(e,t){this.diagnostics.push({level:e,text:t})}warn(e){this.diag("warn",e)}nextId(e){let t=(this.counters.get(e)??0)+1;return this.counters.set(e,t),`${e}#${t}`}ensureComp(){return this.activeCompId&&this.comps.has(this.activeCompId)?this.comps.get(this.activeCompId):this.createComp()}createComp(e=1920,t=1080,r=24,a=215,s="#000000"){this.compCounter+=1;let i={id:`compNode#${this.compCounter}`,name:`Comp ${this.compCounter}`,fps:r,width:Math.max(1,Math.round(e)),height:Math.max(1,Math.round(t)),startFrame:0,endFrame:Math.max(1,Math.round(a)),bgColor:s,layerIds:[]};return this.comps.set(i.id,i),this.layers.set(i.id,{id:i.id,type:"compNode",name:i.name,parentId:null,attrs:new Map,keyframes:new Map,deformerIds:[],inFrame:i.startFrame,outFrame:i.endFrame}),this.activeCompId||(this.activeCompId=i.id),i}activeComp(){return this.activeCompId?this.comps.get(this.activeCompId)??null:null}createLayer(e,t){let r=this.ensureComp();e in tt||this.warn(`create: unknown node type '${e}' \u2014 created as generic node`);let s={id:this.nextId(e),type:e,name:t??`${e}`,parentId:null,attrs:new Map,keyframes:new Map,dynamicAttrs:new Map,deformerIds:[],shaderIds:[],filterIds:[],inFrame:0,outFrame:r.endFrame};return this.layers.set(s.id,s),r.layerIds.push(s.id),this.undoDepth>0&&this.undoCreated.push(s.id),s}layer(e){return this.layers.get(String(e))??null}compLayers(e,t){let r=t?this.comps.get(t):this.activeComp();return r?r.layerIds.filter(a=>{let s=this.layers.get(a);return s?e?s.parentId===null:!0:!1}):[]}static attrKind(e,t){return je(e).attributes[t]??null}setAttr(e,t,r){if(!(e.dynamicAttrs?.has(t)===!0)&&!me(e.type,t)){let i=`set: unknown attribute path '${t}' on ${e.type}`;if(this.strictSchema)return this.warn(i+" (not applied)"),!1;this.warn(i+" (applied anyway)")}if(e.keyframes.has(t)&&e.keyframes.get(t).length>0)return this.keyframe(e.id,this.frame,{[t]:r}),!0;let s=/^(.*)\.(x|y)$/.exec(t);if(s){let i=s[1],o=ae(e.attrs.get(i)??n.attrKind(e.type,i)?.default);if(o){let l=[o[0],o[1]];return l[s[2]==="x"?0:1]=Number(r)||0,e.attrs.set(i,l),!0}}return e.attrs.set(t,r),!0}getAttr(e,t,r){let a=`${e.id}.${t}`;if(!r?.has(a)){let l=this.connections.find(u=>u.dstId===e.id&&u.dstAttr===t);if(l){let u=this.layer(l.srcId);if(u){let p=new Set(r);if(p.add(a),l.srcAttr!=="id"){let y=this.getAttr(u,l.srcAttr,p);if(y!==void 0)return y}else if(u.type==="value"||u.type==="value2"){let y=this.getAttr(u,"value",p);if(y!==void 0)return y}else if(u.type==="valueBlend"){let y=this.getAttr(u,"a",p),k=this.getAttr(u,"b",p),g=Number(this.getAttr(u,"weight",p)),N=Number.isFinite(g)?Math.max(0,Math.min(1,g/100)):.5;if(typeof y=="number"&&typeof k=="number")return ke(y,k,N);let b=ae(y),O=ae(k);if(b&&O)return[ke(b[0],O[0],N),ke(b[1],O[1],N)]}}}}if(e.keyframes.has(t)&&e.keyframes.get(t).length>0)return this.evaluate(e,t,this.frame);let s=this.evaluateCompoundPoint(e,t);if(s)return s;if(e.attrs.has(t))return e.attrs.get(t);if(e.dynamicAttrs?.has(t)){let l=e.dynamicAttrs.get(t);if(l.defaultValue!==void 0)return l.defaultValue}let i=/^(.*)\.(x|y)$/.exec(t);if(i){let l=this.getAttr(e,i[1],r),u=ae(l);if(u)return u[i[2]==="x"?0:1]}let o=n.attrKind(e.type,t);return o?o.default:void 0}evaluateCompoundPoint(e,t){if(!(e.keyframes.has(`${t}.x`)||e.keyframes.has(`${t}.y`)))return null;let a=n.attrKind(e.type,t),s=ae(e.attrs.get(t)??a?.default)??[0,0],i=e.keyframes.get(`${t}.x`),o=e.keyframes.get(`${t}.y`),l=i&&i.length?this.evaluate(e,`${t}.x`,this.frame):s[0],u=o&&o.length?this.evaluate(e,`${t}.y`,this.frame):s[1];return[Number(l)||0,Number(u)||0]}evaluate(e,t,r){let a=e.keyframes.get(t);if(!a||a.length===0)return this.getStaticValue(e,t);let s=a;if(r<=s[0].frame)return s[0].value;if(r>=s[s.length-1].frame)return s[s.length-1].value;let i=0;for(let g=0;g<s.length-1;g++)if(r>=s[g].frame&&r<=s[g+1].frame){i=g;break}let o=s[i],l=s[i+1],u=o.value,p=l.value;if(typeof u!="number"||typeof p!="number"){let g=ae(u),N=ae(p);if(!g||!N)return r-o.frame<=l.frame-r?u:p;let b=l.frame-o.frame||1,O=(r-o.frame)/b,x=n.segmentWeight(o,l,O);return[ke(g[0],N[0],x),ke(g[1],N[1],x)]}let y=l.frame-o.frame||1,k=(r-o.frame)/y;return ke(u,p,n.segmentWeight(o,l,k))}static segmentWeight(e,t,r){if(e.type===2)return 0;if(e.type===1)return r;if(e.magicEase)return Rn(e.magicEase,r);let a=Math.max(t.frame-e.frame,1e-6),s=Math.min(Math.max(e.outWeight??a/3,0),a),i=Math.min(Math.max(t.inWeight??a/3,0),a),o=Math.tan(((e.outAngle??0)%360+360)%360*(Math.PI/180)),l=Math.tan(((t.inAngle??0)%360+360)%360*(Math.PI/180)),u=s/a,p=o*s/a,y=1-i/a,k=1-l*i/a,g=0,N=1,b=r;for(let A=0;A<24;A++){b=(g+N)/2;let T=1-b;3*T*T*b*u+3*T*b*b*y+b*b*b<r?g=b:N=b}let O=1-b;return 3*O*O*b*p+3*O*b*b*k+b*b*b}getStaticValue(e,t){if(e.attrs.has(t))return e.attrs.get(t);let r=/^(.*)\.(x|y)$/.exec(t);if(r){let a=ae(this.getStaticValue(e,r[1]));if(a)return a[r[2]==="x"?0:1]}return n.attrKind(e.type,t)?.default}keyframe(e,t,r){let a=this.layer(e);if(!a)return this.warn(`keyframe: no layer '${e}'`),[];let s=[];for(let[i,o]of Object.entries(r)){let l=a.keyframes.get(i)??[],u=Math.round(t),p=l.find(y=>y.frame===u);p?p.value=o:l.push({frame:u,value:o,type:1}),l.sort((y,k)=>y.frame-k.frame),a.keyframes.set(i,l),s.push(`${a.id}:${i}:${u}`)}return s}magicEasing(e,t,r,a,s){let i=this.layer(e);if(!i)return;let o=i.keyframes.get(t)??[],l=Math.round(r),u=o.find(p=>p.frame===l);if(!u){this.warn(`magicEasing: no keyframe at frame ${l} on ${i.id}.${t}`);return}u.magicEase=a,u.type=0}connect(e,t,r,a,s=!1){let i=this.layer(e),o=this.layer(r);if(!i||!o){this.warn(`connect: missing endpoint ${i?r:e}`);return}let l=this.connections.find(p=>p.dstId===o.id&&p.dstAttr===a);if(l&&!s){this.warn(`connect: ${o.id}.${a} already connected from ${l.srcId}.${l.srcAttr} (use force)`);return}l&&this.connections.splice(this.connections.indexOf(l),1),this.connections.push({srcId:i.id,srcAttr:t,dstId:o.id,dstAttr:a}),/^(deformers)\.?/.exec(a)&&!o.deformerIds.includes(i.id)&&o.deformerIds.push(i.id),/^material\.(shader|colorShaders)\b/.test(a)&&(o.shaderIds||(o.shaderIds=[]),o.shaderIds.includes(i.id)||o.shaderIds.push(i.id)),/^filters\b/.test(a)&&(o.filterIds||(o.filterIds=[]),o.filterIds.includes(i.id)||o.filterIds.push(i.id))}inConnectedAttributes(e){return[...new Set(this.connections.filter(t=>t.dstId===e).map(t=>t.dstAttr))]}inConnection(e,t){return this.connections.filter(r=>r.dstId===e&&r.dstAttr===t).map(r=>`${r.srcId}.${r.srcAttr}`)}outConnections(e,t){return this.connections.filter(r=>r.srcId===e&&r.srcAttr===t).map(r=>({dstId:r.dstId,dstAttr:r.dstAttr}))}parent(e,t){let r=this.layer(e);if(!r)return;if(t===null){r.parentId=null;return}let a=this.layer(t);if(!a){this.warn(`parent: no layer '${t}'`);return}e!==t&&(r.parentId=a.id)}worldTransform(e){let t=this.layer(e);if(!t)return{x:0,y:0,scaleX:1,scaleY:1,rotation:0};let r=ae(this.getAttr(t,"position"))??[0,0],a=ae(this.getAttr(t,"scale"))??[100,100],s=b=>Math.abs(b)>0&&Math.abs(b)<=10?b:b/100,i=s(a[0]),o=s(a[1]),l=Number(this.getAttr(t,"rotation"))||0;if(!t.parentId)return{x:r[0],y:r[1],scaleX:i,scaleY:o,rotation:l};let u=this.worldTransform(t.parentId),p=u.rotation*Math.PI/180,y=Math.cos(p),k=Math.sin(p),g=r[0]*u.scaleX,N=r[1]*u.scaleY;return{x:u.x+g*y-N*k,y:u.y+g*k+N*y,scaleX:u.scaleX*i,scaleY:u.scaleY*o,rotation:u.rotation+l}}boundingBox(e){let t=this.layer(e);if(!t||!je(t.type).visual)return null;let s=t.attrs.has("generator.dimensions")||t.keyframes.has("generator.dimensions")||t.keyframes.has("generator.dimensions.x")||t.keyframes.has("generator.dimensions.y")?ae(this.getAttr(t,"generator.dimensions"))??this.visualSize(t):this.visualSize(t),i=this.worldTransform(e),o=Math.abs(s[0]*i.scaleX),l=Math.abs(s[1]*i.scaleY),u=i.rotation*Math.PI/180,p=Math.abs(Math.cos(u)),y=Math.abs(Math.sin(u)),k=o*p+l*y,g=o*y+l*p,N=ae(this.getAttr(t,"pivot"))??[0,0],b=i.x-N[0]*i.scaleX,O=i.y-N[1]*i.scaleY,x=b-k/2,A=b+k/2,T=O-g/2,U=O+g/2;return{x,y:T,width:k,height:g,centre:{x:b,y:O},left:x,right:A,top:T,bottom:U}}visualSize(e){let t=ae(this.getAttr(e,"textBoxSize"));if(e.type==="textShape"){let a=String(this.getAttr(e,"text")??""),s=Number(this.getAttr(e,"fontSize"))||24;return t&&t[0]>0&&t[1]>0?t:[Math.max(1,a.length)*s*.55,s*1.2]}if(e.attrs.has("generator.radius")||e.attrs.has("radius")){let a=e.attrs.has("generator.radius")?"generator.radius":"radius",s=this.getAttr(e,a);if(typeof s=="number"&&Number.isFinite(s)&&s>0)return[s*2,s*2];let i=ae(s);if(i&&(i[0]>0||i[1]>0))return[Math.abs(i[0])*2,Math.abs(i[1])*2]}let r=ae(this.getAttr(e,"generator.dimensions"));return r&&r[0]>0&&r[1]>0?r:t&&t[0]>0&&t[1]>0?t:[100,100]}startUndoGroup(e){this.undoDepth+=1,this.undoDepth===1&&(this.undoCreated=[],this.lastUndo={name:e,createdLayerIds:[]})}endUndoGroup(){this.undoDepth!==0&&(this.undoDepth-=1,this.undoDepth===0&&this.lastUndo&&(this.lastUndo.createdLayerIds=[...this.undoCreated],this.undoCreated=[]))}checkpointSnapshot(){return JSON.stringify({comps:[...this.comps.values()],layers:[...this.layers.values()].map(e=>({...e,attrs:[...e.attrs.entries()],keyframes:[...e.keyframes.entries()]})),connections:this.connections,selection:this.selection,activeCompId:this.activeCompId,frame:this.frame,lastUndo:this.lastUndo,counters:[...this.counters.entries()],compCounter:this.compCounter})}restoreCheckpoint(e){let t=JSON.parse(e);if(!Array.isArray(t.comps)||!Array.isArray(t.layers))throw new Error("invalid scene checkpoint");this.comps=new Map(t.comps.map(r=>[r.id,r])),this.layers=new Map(t.layers.map(r=>[r.id,{...r,attrs:new Map(r.attrs),keyframes:new Map(r.keyframes),dynamicAttrs:new Map,shaderIds:r.shaderIds??[],filterIds:r.filterIds??[]}])),this.connections=t.connections,this.selection=t.selection,this.activeCompId=t.activeCompId,this.frame=t.frame,this.lastUndo=t.lastUndo,this.counters=new Map(t.counters),this.compCounter=t.compCounter,this.undoDepth=0,this.undoCreated=[]}facts(){let e=[];for(let r of this.comps.values())for(let a of r.layerIds){let s=this.layers.get(a);if(!s)continue;let i=0;for(let o of s.keyframes.values())i+=o.length;e.push({id:s.id,type:s.type,keyframes:i})}e.sort((r,a)=>r.id<a.id?-1:r.id>a.id?1:0);let t=this.connections.map(r=>`${r.dstId}<-${r.dstAttr}`).sort();return{layers:e,connections:t}}sceneStateHash(){let e=this.facts().layers.map(t=>`${t.id}:${t.type}@k=${t.keyframes}`);return st(`nodes(${e.join(";")})conn(${this.facts().connections.join(";")})`)}};var $e="state",ot="layers",Ne="snapshot",Re="snapshot-batch",Mn=["subMesh","align","duplicator","stagger","falloff","noise","noiseDeformer","oscillator","valueBehavior","javascriptDeformer","round","offsetPath","trimPath"];var Tn=["position.x","position.y","scale.x","scale.y","rotation","opacity"],ee={BAD_REQUEST:"STALLION_BAD_REQUEST",MISSING_SEQ:"STALLION_MISSING_SEQ",EXEC_FAILED:"STALLION_EXEC_FAILED",NO_COMP:"STALLION_NO_ACTIVE_COMP",NO_FRAME:"STALLION_NO_FRAME",BAD_LAYER:"STALLION_UNKNOWN_LAYER",UNKNOWN_SNAPSHOT:"STALLION_UNKNOWN_SNAPSHOT",RENDER_FAILED:"STALLION_RENDER_FAILED",UNAUTHORISED:"STALLION_UNAUTHORISED"};function ie(n,e,t,r={}){let a={ok:!1,kind:n,error:t,code:e};return r.seq!==void 0&&(a.seq=r.seq),r.mgCall&&(a.mgCall=r.mgCall),r.layerId&&(a.layerId=r.layerId),r.attrPath&&(a.attrPath=r.attrPath),r.stack&&(a.stack=String(r.stack).slice(0,2e3)),a}function he(n,e,t,r){let a=Number(n);return Number.isFinite(a)?Math.min(r,Math.max(t,Math.round(a))):e}function lt(n,e){let r=(Array.isArray(e.attrs)?e.attrs:[]).map(a=>typeof a=="string"?a.trim():"").filter(Boolean).slice(0,40);return{kind:n,seq:e.seq,compId:typeof e.compId=="string"?e.compId.trim():"",frame:Number.isFinite(Number(e.frame))?he(e.frame,0,-1e9,1e9):null,restoreFrame:null,offset:he(e.offset,0,0,1e9),limit:he(e.limit,200,1,1e3),attrs:r.length?r:[...Tn],includeAttributes:e.attributes===!0,budgetMs:he(e.budgetMs,120,5,5e3)}}function Vt(n,e){return((typeof n=="string"?n.trim():"")||e).replace(/[\\/:*?"<>|]/g,"_").slice(0,80)}function ct(n){let e=Number(n.frame??n.t);if(!Number.isFinite(e))return{error:"snapshot requires a numeric `frame` (or `t`).",code:ee.NO_FRAME};let t=Number(n.scale??n.resolutionScale),r=Vt(n.fileName,`snapshot-${String(Math.round(e)).padStart(6,"0")}`);return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",frame:he(e,0,-1e9,1e9),restoreFrame:null,scale:Number.isFinite(t)&&t>0?he(t,100,1,400):100,outDir:typeof n.outDir=="string"?n.outDir.trim().replace(/\\/g,"/"):"",fileName:r}}}function ut(n){let e=Array.isArray(n.frames)?n.frames:[],t=new Set,r=[];for(let o of e){let l=Math.round(Number(o));if(!(!Number.isFinite(l)||Math.abs(l)>1e9||t.has(l))&&(t.add(l),r.push(l),r.length>=64))break}if(!r.length)return{error:"snapshot-batch requires a non-empty numeric `frames` array (1..64).",code:ee.NO_FRAME};r.sort((o,l)=>o-l);let a=Number(n.scale??n.resolutionScale),s=Array.isArray(n.layerIds)?n.layerIds.map(o=>typeof o=="string"?o.trim():"").filter(Boolean).slice(0,200):[],i=Array.isArray(n.attrs)?n.attrs.map(o=>typeof o=="string"?o.trim():"").filter(Boolean).slice(0,16):[];return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",frames:r,restoreFrame:null,scale:Number.isFinite(a)&&a>0?he(a,100,1,400):100,outDir:typeof n.outDir=="string"?n.outDir.trim().replace(/\\/g,"/"):"",fileName:Vt(n.fileName,"snapshot-batch"),layerIds:s,attrs:i,includeHidden:n.includeHidden===!0}}}function dt(n){return`/* cavalry-mcp:atomic */ (function () {
var __rb = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
// getBoundingBox(id, true) is documented as {x, y, width, height, centre, left, right,
// top}. Reading width/height rather than w/h is what the shipped receipt code already
// does against a live 2.8 host; the array and w/h fallbacks stay so one odd layer type
// cannot blank out a box.
var __box = function (bb) {
	if (!bb || typeof bb !== 'object') return null;
	var arr = Array.isArray(bb);
	var w = arr ? bb[2] : (bb.width === undefined ? bb.w : bb.width);
	var h = arr ? bb[3] : (bb.height === undefined ? bb.h : bb.height);
	return { x: __num(arr ? bb[0] : bb.x, 0), y: __num(arr ? bb[1] : bb.y, 0), width: __num(w, 0), height: __num(h, 0) };
};
// A measured box is only useful to a calibration loop if the pivot and the
// centre are explicit. pivotX/Y are the pivot's offset *inside* the box, so a
// caller never has to guess whether the box or the pivot is top-left based.
var __pivotInBox = function (box, pivot) {
	if (!box || !pivot) return box;
	return {
		x: box.x, y: box.y, width: box.width, height: box.height,
		pivotX: __num(pivot.x, 0) - box.x,
		pivotY: __num(pivot.y, 0) - box.y,
		centre: { x: box.x + box.width / 2, y: box.y + box.height / 2 }
	};
};
var __started = Date.now();
var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __rb.compId || __prevComp;
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__rb.compId && __rb.compId !== __prevComp) { __read(function () { api.setActiveComp(__rb.compId); }); }
// An empty scene and a scene with no comp open are different states, and collapsing
// them into total:0 forces the caller to guess. Say which one it is.
if (!__compId) {
	return { ok: false, kind: __rb.kind, seq: __rb.seq, error: 'No active comp to read back.', code: 'STALLION_NO_ACTIVE_COMP' };
}

var __slug = function (text) {
	return String(text == null ? '' : text)
		.replace(/[^A-Za-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase()
		.slice(0, 48);
};

var __ids = __read(function () { return api.getCompLayers(false); }) || [];
var __top = __read(function () { return api.getCompLayers(true); }) || [];
var __topSet = {};
for (var t = 0; t < __top.length; t++) __topSet[__top[t]] = true;

// One parent walk builds the child map and the deformer classification without
// a getChildren call per layer (not every 2.8 build exposes it, and the walk is
// already bounded by the readback limit).
var __deformerTypes = ${JSON.stringify(Mn)};
var __deformerSet = {};
for (var d0 = 0; d0 < __deformerTypes.length; d0++) __deformerSet[__deformerTypes[d0]] = true;
var __deformerType = function (type) {
	var raw = String(type == null ? '' : type);
	if (__deformerSet[raw]) return true;
	var lower = raw.toLowerCase();
	for (var d1 = 0; d1 < __deformerTypes.length; d1++) {
		if (__deformerTypes[d1].toLowerCase() === lower) return true;
	}
	return lower.indexOf('deformer') >= 0;
};
var __children = {};
for (var c0 = 0; c0 < __ids.length; c0++) {
	var __childParent = __read(function () { return api.getParent(__ids[c0]); });
	if (__childParent) {
		if (!__children[__childParent]) __children[__childParent] = [];
		__children[__childParent].push(__ids[c0]);
	}
}

// Depth from the comp root, so a hierarchy can be rebuilt without a second pass.
var __depth = {};
var depthOf = function (id) {
	if (__depth[id] !== undefined) return __depth[id];
	var guard = 0, d = 0, cur = id;
	while (guard++ < 32) {
		var p = __read(function () { return api.getParent(cur); });
		if (!p || p === cur) break;
		cur = p; d++;
	}
	__depth[id] = d;
	return d;
};

// Step the playhead once, then read every layer at that instant. Values are the
// evaluated ones \u2014 a connected or animated attribute reports what is on screen at
// __rb.frame, not its static default.
var __frame = __rb.frame === null ? __prevFrame : __rb.frame;
if (__frame !== __prevFrame) __read(function () { api.setFrame(__frame); });

var __names = {};
var __total = __ids.length;
var __out = [];
var __truncated = false;
var __nextOffset = -1;
var __index = {};
for (var i = 0; i < __total; i++) __index[__ids[i]] = i;

for (var k = __rb.offset; k < __total; k++) {
	if (Date.now() - __started > __rb.budgetMs) { __truncated = true; __nextOffset = k; break; }
	if (__out.length >= __rb.limit) { __truncated = true; __nextOffset = k; break; }
	var id = __ids[k];
	var type = __read(function () { return api.getLayerType(id); });
	var name = __read(function () { return api.getNiceName(id); });
	__names[id] = name;
	var parent = __read(function () { return api.getParent(id); });
	if (parent && __names[parent] === undefined) {
		__names[parent] = __read(function () { return api.getNiceName(parent); });
	}
	var chain = [];
	var cur = id, guard = 0;
	while (guard++ < 16 && cur) { chain.unshift(__slug(__names[cur] || cur) + '#' + (__index[cur] === undefined ? '?' : __index[cur])); var up = __read(function () { return api.getParent(cur); }); if (!up || up === cur) break; cur = up; }
	// semanticId is index-qualified so it is unique and reproducible from the scene
	// alone. Dropping the suffix would collide as soon as two layers share a label, and
	// resolving collisions by scanning every preceding layer is O(n^2) across the comp \u2014
	// on Cavalry's single thread that is precisely the freeze the budget exists to
	// prevent. semanticSlug carries the bare name for callers that want to group.
	var base = __slug(name || type);
	var semantic = (base || 'layer') + '_' + k;

	var entry = {
		id: id,
		ref: type + '#' + k,
		semanticId: semantic,
		semanticSlug: base,
		type: type,
		name: name,
		path: chain,
		depth: depthOf(id),
		topLevel: __topSet[id] === true,
		parent: parent || null,
		parentName: parent ? (__names[parent] || null) : null,
		hidden: false,
		visible: true,
		inFrame: __read(function () { return api.getInFrame(id); }),
		outFrame: __read(function () { return api.getOutFrame(id); }),
		boundingBox: null,
		worldBoundingBox: null,
		compBoundingBox: null,
		pivot: null,
		deformers: [],
		childCount: __children[id] ? __children[id].length : 0,
		attrs: {},
		connected: [],
		unreadable: []
	};
	var hidden = __read(function () { return api.get(id, 'hidden'); });
	entry.hidden = hidden === true || hidden === 1 || hidden === 'true';
	entry.visible = !entry.hidden;
	if (entry.visible) {
		// A layer outside its in/out range is not visible at this frame even when
		// the hidden flag is false. Report that as visibility, not as a box of 0.
		var __if = entry.inFrame, __of = entry.outFrame;
		if (typeof __if === 'number' && typeof __of === 'number' && (__frame < __if || __frame > __of)) entry.visible = false;
	}
	var pv = __read(function () { return api.getPivotPosition(id); });
	if (pv) entry.pivot = { x: __num(Array.isArray(pv) ? pv[0] : pv.x, 0), y: __num(Array.isArray(pv) ? pv[1] : pv.y, 0) };
	var worldBox = __pivotInBox(__box(__read(function () { return api.getBoundingBox(id, true); })), entry.pivot);
	var compBox = __pivotInBox(__box(__read(function () { return api.getBoundingBox(id, false); })), entry.pivot);
	if (worldBox) entry.worldBoundingBox = worldBox;
	if (compBox) entry.compBoundingBox = compBox;
	// The legacy boundingBox field keeps its historical meaning (world space) so
	// existing callers do not change behaviour; the two explicit fields are the
	// new contract for calibration and perceptual diffing.
	if (worldBox) entry.boundingBox = worldBox;
	else if (compBox) entry.boundingBox = compBox;
	var kids = __children[id] || [];
	for (var kd = 0; kd < kids.length && entry.deformers.length < 16; kd++) {
		var kidType = __read(function () { return api.getLayerType(kids[kd]); });
		if (!__deformerType(kidType)) continue;
		entry.deformers.push({
			id: kids[kd],
			type: kidType,
			name: __read(function () { return api.getNiceName(kids[kd]); }),
			visible: __read(function () { var h = api.get(kids[kd], 'hidden'); return !(h === true || h === 1 || h === 'true'); }) !== false
		});
	}

	var want = __rb.attrs;
	if (__rb.includeAttributes) {
		var declared = __read(function () { return api.getAttributes(id); });
		if (Array.isArray(declared) && declared.length) {
			want = declared.slice(0, 40);
			entry.attributeNames = declared;
		}
	}
	for (var a = 0; a < want.length; a++) {
		var path = want[a];
		var value = __read(function () { return api.get(id, path); });
		// Driven? An attribute fed by a behaviour node or another layer reports the
		// upstream ref here, so a caller can tell a procedural rig from a baked value
		// without a second round trip. This is what refclone keys its tier decisions on.
		var drivenBy = __read(function () { return api.getInConnection(id, path); });
		if (drivenBy) entry.connected.push({ attrPath: path, from: String(drivenBy) });
		if (value === null || value === undefined) { entry.unreadable.push(path); continue; }
		if (Array.isArray(value)) entry.attrs[path] = value.map(function (v) { return __num(v, v); });
		else if (typeof value === 'object') entry.attrs[path] = { x: __num(value.x, value.x), y: __num(value.y, value.y) };
		else entry.attrs[path] = typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string' ? value : String(value);
	}
	var outs = [];
	for (var o = 0; o < want.length && outs.length < 16; o++) {
		var list = __read(function () { return api.getOutConnections(id, want[o]); });
		if (Array.isArray(list) && list.length) outs.push({ attrPath: want[o], to: list.map(String) });
	}
	if (outs.length) entry.outConnections = outs;
	__out.push(entry);
}

if (__rb.frame !== null && __frame !== __prevFrame) { __read(function () { api.setFrame(__prevFrame); }); }
if (__rb.compId && __prevComp && __rb.compId !== __prevComp) { __read(function () { api.setActiveComp(__prevComp); }); }

return {
	ok: true,
	kind: __rb.kind,
	seq: __rb.seq,
	compId: __compId,
	frame: __frame,
	total: __total,
	offset: __rb.offset,
	returned: __out.length,
	truncated: __truncated,
	nextOffset: __nextOffset,
	elapsedMs: Date.now() - __started,
	layers: __out
};
})()`}function pt(n){return`/* cavalry-mcp:atomic */ (function () {
var __sn = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __box = function (bb) {
	if (!bb || typeof bb !== 'object') return null;
	var arr = Array.isArray(bb);
	var w = arr ? bb[2] : (bb.width === undefined ? bb.w : bb.width);
	var h = arr ? bb[3] : (bb.height === undefined ? bb.h : bb.height);
	return { x: __num(arr ? bb[0] : bb.x, 0), y: __num(arr ? bb[1] : bb.y, 0), width: __num(w, 0), height: __num(h, 0) };
};
var __prevComp = __read(function () { return api.getActiveComp(); });
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__sn.compId && __sn.compId !== __prevComp) { __read(function () { api.setActiveComp(__sn.compId); }); }
var __dir = __sn.outDir || (api.getHomeFolder() + '/.stallion/snapshots');
var __target = __dir + '/' + __sn.fileName;
var __ok = true, __error = null, __code = null;
if (!(__sn.compId || __prevComp)) { __ok = false; __error = 'No active comp to render.'; __code = 'STALLION_NO_ACTIVE_COMP'; }
try { if (__ok && __sn.frame !== __prevFrame) api.setFrame(__sn.frame); } catch (e) { __ok = false; __error = String(e && e.message ? e.message : e); __code = 'STALLION_RENDER_FAILED'; }
if (__ok) {
	try { api.renderPNGFrame(__target, __sn.scale); } catch (e2) { __ok = false; __error = String(e2 && e2.message ? e2.message : e2); __code = 'STALLION_RENDER_FAILED'; }
}
var __renderedAt = Date.now();
// Verify the artifact in the same call that produced it: size and existence read back
// straight after renderPNGFrame returns. Without this a caller has to poll the disk to
// learn whether the frame is real, and cannot tell this render from a stale file.
var __bytes = __ok ? __read(function () { return api.getFileSize(__target + '.png'); }) : null;
var __exists = __bytes === null ? __read(function () { return api.filePathExists(__target + '.png'); }) : __bytes > 0;
if (__ok && __bytes !== null && !(__bytes > 0)) { __ok = false; __error = 'renderPNGFrame produced a zero-byte file at ' + __target + '.png'; __code = 'STALLION_RENDER_FAILED'; }
// Deterministic frame digest. Cavalry's script host has no crypto module and cannot
// read the PNG it just wrote back as bytes, so hashing the *file* is not available
// here; what is available \u2014 and what actually answers "which frame is this" \u2014 is a
// digest of the evaluated scene at that frame. Two renders of the same comp at the
// same frame produce the same value, and any change to geometry on that frame changes
// it. Callers that need a content hash of the bytes compute it after reading the file
// over localhost, and the mock bridge fills contentHash in directly.
// Bounded to 64 layers: this is a fingerprint, not a full walk, and it must not eat
// the slice's whole budget.
var __dig = function (str) {
	var hi = 0x811c9dc5, lo = 0x1b873593;
	for (var p = 0; p < str.length; p++) {
		hi ^= str.charCodeAt(p); hi = Math.imul(hi, 0x01000193) >>> 0;
		lo ^= str.charCodeAt(str.length - 1 - p); lo = Math.imul(lo, 0x01000193) >>> 0;
	}
	return ('00000000' + hi.toString(16)).slice(-8) + ('00000000' + lo.toString(16)).slice(-8);
};
var __frameHash = null;
if (__ok) {
	var __sigIds = (__read(function () { return api.getCompLayers(true); }) || []).slice(0, 64);
	var __sig = '';
	for (var q = 0; q < __sigIds.length; q++) {
		var __sid = __sigIds[q];
		var __sbb = __box(__read(function () { return api.getBoundingBox(__sid, true); }));
		__sig += __sid + '|';
		if (__sbb) __sig += [__sbb.x, __sbb.y, __sbb.width, __sbb.height].join(',');
		__sig += ';';
	}
	__frameHash = __dig(String(__sn.frame) + '#' + String(__sn.compId || __prevComp) + '#' + __sig);
}
if (__sn.frame !== __prevFrame) { __read(function () { api.setFrame(__prevFrame); }); }
if (__sn.compId && __prevComp && __sn.compId !== __prevComp) { __read(function () { api.setActiveComp(__prevComp); }); }
return {
	ok: __ok,
	kind: 'snapshot',
	seq: __sn.seq,
	compId: String(__sn.compId || __prevComp),
	frame: __sn.frame,
	file: __target + '.png',
	fileName: __sn.fileName,
	scale: __sn.scale,
	renderedAt: __renderedAt,
	renderedAtIso: new Date(__renderedAt).toISOString(),
	restoredFrame: __prevFrame,
	exists: __exists === true,
	sizeBytes: __bytes === null ? null : Number(__bytes),
	frameHash: __frameHash,
	error: __error,
	code: __code
};
})()`}function ft(n){return`/* cavalry-mcp:atomic */ (function () {
var __sb = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __pad = function (n) { var s = String(n); while (s.length < 6) { s = '0' + s; } return s; };
var __box = function (bb) {
	if (!bb || typeof bb !== 'object') return null;
	var arr = Array.isArray(bb);
	var w = arr ? bb[2] : (bb.width === undefined ? bb.w : bb.width);
	var h = arr ? bb[3] : (bb.height === undefined ? bb.h : bb.height);
	return { x: __num(arr ? bb[0] : bb.x, 0), y: __num(arr ? bb[1] : bb.y, 0), width: __num(w, 0), height: __num(h, 0) };
};
var __dig = function (str) {
	var hi = 0x811c9dc5, lo = 0x1b873593;
	for (var p = 0; p < str.length; p++) {
		hi ^= str.charCodeAt(p); hi = Math.imul(hi, 0x01000193) >>> 0;
		lo ^= str.charCodeAt(str.length - 1 - p); lo = Math.imul(lo, 0x01000193) >>> 0;
	}
	return ('00000000' + hi.toString(16)).slice(-8) + ('00000000' + lo.toString(16)).slice(-8);
};
var __prevComp = __read(function () { return api.getActiveComp(); });
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__sb.compId && __sb.compId !== __prevComp) { __read(function () { api.setActiveComp(__sb.compId); }); }
var __compId = __sb.compId || __prevComp;
if (!__compId) {
	return { ok: false, kind: 'snapshot-batch', seq: __sb.seq, error: 'No active comp to render.', code: 'STALLION_NO_ACTIVE_COMP', frames: [] };
}
var __dir = __sb.outDir || (api.getHomeFolder() + '/.stallion/snapshots');
var __all = __read(function () { return api.getCompLayers(false); }) || [];
var __index = {};
for (var ai = 0; ai < __all.length; ai++) __index[__all[ai]] = ai;
var __ids = __sb.layerIds && __sb.layerIds.length ? __sb.layerIds : (__read(function () { return api.getCompLayers(false); }) || []).slice(0, 200);
var __started = Date.now();
var __frames = [];
var __errors = [];
for (var f = 0; f < __sb.frames.length; f++) {
	var __frame = __sb.frames[f];
	var __stem = __dir + '/' + __sb.fileName + '-' + __pad(__frame);
	var __file = __stem + '.png';
	var __entry = { frame: __frame, file: __file, exists: false, sizeBytes: null, renderedAt: null, frameHash: null, layers: [], error: null, code: null };
	__read(function () { api.setFrame(__frame); });
	try {
		api.renderPNGFrame(__stem, __sb.scale);
		__entry.renderedAt = Date.now();
	} catch (e) {
		__entry.error = String(e && e.message ? e.message : e);
		__entry.code = 'STALLION_RENDER_FAILED';
	}
	var __bytes = __read(function () { return api.getFileSize(__file); });
	__entry.sizeBytes = __bytes === null ? null : Number(__bytes);
	__entry.exists = __bytes === null ? __read(function () { return api.filePathExists(__file); }) === true : Number(__bytes) > 0;
	if (!__entry.error && !__entry.exists) {
		__entry.error = 'renderPNGFrame produced no readable file at ' + __file;
		__entry.code = 'STALLION_RENDER_FAILED';
	}
	var __sig = '';
	for (var l = 0; l < __ids.length; l++) {
		var __id = __ids[l];
		var __pivot = __read(function () { return api.getPivotPosition(__id); });
		var __p = __pivot ? { x: __num(Array.isArray(__pivot) ? __pivot[0] : __pivot.x, 0), y: __num(Array.isArray(__pivot) ? __pivot[1] : __pivot.y, 0) } : null;
		var __world = __box(__read(function () { return api.getBoundingBox(__id, true); }));
		var __hidden = __read(function () { return api.get(__id, 'hidden'); });
		var __visible = !(__hidden === true || __hidden === 1 || __hidden === 'true');
		if (__visible) {
			var __in = __read(function () { return api.getInFrame(__id); });
			var __out = __read(function () { return api.getOutFrame(__id); });
			if (typeof __in === 'number' && typeof __out === 'number' && (__frame < __in || __frame > __out)) __visible = false;
		}
		var __bbox = null;
		if (__world) {
			__bbox = {
				x: __world.x, y: __world.y, width: __world.width, height: __world.height,
				pivotX: __p ? __p.x - __world.x : __world.width / 2,
				pivotY: __p ? __p.y - __world.y : __world.height / 2,
				centre: { x: __world.x + __world.width / 2, y: __world.y + __world.height / 2 }
			};
		}
		var __layer = {
			id: __id,
			ref: __read(function () { return api.getLayerType(__id); }) + '#' + (__index[__id] === undefined ? '?' : __index[__id]),
			type: __read(function () { return api.getLayerType(__id); }),
			name: __read(function () { return api.getNiceName(__id); }),
			visible: __visible,
			bbox: __bbox
		};
		if (__sb.attrs && __sb.attrs.length) {
			var __attrs = {};
			for (var a = 0; a < __sb.attrs.length; a++) {
				var __v = __read(function () { return api.get(__id, __sb.attrs[a]); });
				if (__v !== undefined && __v !== null) __attrs[__sb.attrs[a]] = __v;
			}
			__layer.attrs = __attrs;
		}
		if (!__sb.includeHidden && !__visible) continue;
		__sig += __id + '|' + (__bbox ? [__bbox.x, __bbox.y, __bbox.width, __bbox.height].join(',') : '') + ';';
		__entry.layers.push(__layer);
	}
	__entry.frameHash = __dig(String(__frame) + '#' + String(__compId) + '#' + __sig);
	__frames.push(__entry);
	if (__entry.error) __errors.push({ frame: __frame, error: __entry.error, code: __entry.code });
}
if (__sb.frames.length) __read(function () { api.setFrame(__prevFrame); });
if (__sb.compId && __prevComp && __sb.compId !== __prevComp) { __read(function () { api.setActiveComp(__prevComp); }); }
return {
	ok: __errors.length === 0,
	kind: 'snapshot-batch',
	seq: __sb.seq,
	compId: String(__compId),
	frames: __frames,
	errors: __errors,
	requested: __sb.frames.length,
	rendered: __frames.length - __errors.length,
	scale: __sb.scale,
	restoredFrame: __prevFrame,
	elapsedMs: Date.now() - __started
};
})()`}var de="batch-step";function On(n,e,t,r){let a=Number(n);return Number.isFinite(a)?Math.min(r,Math.max(t,Math.round(a))):e}function mt(n){let e=typeof n.script=="string"?n.script:"";if(e.length>512e3)return{error:{code:"STALLION_BAD_REQUEST",error:"batch-step script exceeds 512000 characters."}};let t=n.dslManifest;if(t!=null&&(typeof t!="object"||Array.isArray(t)))return{error:{code:"STALLION_BAD_REQUEST",error:"batch-step dslManifest must be a JSON object (see _mg manifest schema)."}};if(!e&&t==null)return{error:{code:"STALLION_BAD_REQUEST",error:"batch-step requires `script` (JS body) or `dslManifest` (object) \u2014 or both."}};let r=Array.isArray(n.sampleFrames)?n.sampleFrames:[],a=new Set,s=[];for(let l of r){let u=Math.round(Number(l));if(!(!Number.isFinite(u)||Math.abs(u)>1e9||a.has(u))&&(a.add(u),s.push(u),s.length>=64))break}let i=Array.isArray(n.queryLayers)?n.queryLayers.map(l=>typeof l=="string"?l.trim():"").filter(Boolean).slice(0,200):[],o=Number(n.scale);return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",script:e,dslManifest:t??null,frames:s,restoreFrame:null,queryLayers:i,renderFrames:n.renderFrames===!0,renderOutputDir:typeof n.renderOutputDir=="string"?n.renderOutputDir.trim().replace(/\\/g,"/"):"",dirtyAttributesOnly:n.dirtyAttributesOnly!==!1,scale:Number.isFinite(o)&&o>0?On(o,100,1,400):100}}}function ht(n,e,t){return`var __bs = ${JSON.stringify({...n,script:""})};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __global = typeof globalThis !== 'undefined' ? globalThis : this;
var __bsStart = Date.now();

// _mg/_rb + the manifest interpreter. The startup preload defines
// globalThis._mg in this context; if that never happened (isolated script
// contexts) the vendored source is evaluated here instead. Either way the
// helpers are reachable as __mgEnv.mg / __mgEnv.applyManifest, and user code
// receives them as parameters \u2014 no global write is required for this run.
//
// The two branches deliberately live in SEPARATE function scopes. The vendored
// runtime source declares a const _mg binding; if its text sat in this
// function's own scope, the preload branch would return before that
// declaration ever ran and the manifest interpreter \u2014 which closes over _mg \u2014
// would then hit a permanently-uninitialized binding: "Cannot access '_mg'
// before initialization". That was exactly the live-host failure the mock
// never caught, because the mock's sandbox has no preloaded global _mg and
// always took the fallback branch.
var __mgEnv = (function () {
  var pre = null;
  try {
    if (__global._mg && typeof __global._mg.shape === 'function') {
      pre = { mg: __global._mg, rb: __global._rb || null };
    }
  } catch (e) { pre = null; }
  if (pre) {
    // Preloaded host: bind the names the manifest interpreter expects in this
    // scope and evaluate only the interpreter. The runtime source below is
    // never reached on this branch.
    var _mg = pre.mg;
    var _rb = pre.rb;
    ${t}
    return { mg: _mg, rb: _rb, applyManifest: __mgApplyManifest };
  }
  return (function () {
    ${e}
    ${t}
    try { __global._mg = _mg; __global._rb = _rb; } catch (e) {}
    return { mg: _mg, rb: _rb, applyManifest: __mgApplyManifest };
  })();
})();

var __scriptResult = null;
var __scriptError = null;
var __manifestResult = null;
var __userResult;
try {
  if (__bs.dslManifest) {
    __manifestResult = __mgEnv.applyManifest(__bs.dslManifest);
  }
} catch (e0) {
  __scriptError = 'dslManifest: ' + String(e0 && e0.message ? e0.message : e0);
}
if (!__scriptError && ${n.script?"true":"false"}) {
  try {
    __userResult = (function (_mg, _rb) {
      ${n.script}
    })(__mgEnv.mg, __mgEnv.rb);
  } catch (e1) {
    __scriptError = 'script: ' + String(e1 && e1.message ? e1.message : e1);
  }
}
if (typeof __userResult === 'undefined' && __manifestResult !== null) __scriptResult = __manifestResult;
else if (typeof __userResult !== 'undefined') __scriptResult = __userResult;

// TSV helpers. One line per visible layer:
//   id\\ttype\\tparent\\tname\\tx,y,w,h\\tanimAttrs\\tconnections
// Cell values escape tabs/newlines so the sheet stays line-per-layer.
var __tsvCell = function (value) {
  return String(value == null ? '' : value).replace(/[\\t\\n\\r]+/g, ' ');
};
var __tsvHeader = 'id\\ttype\\tparent\\tname\\tx,y,w,h\\tanimAttrs\\tconnections';
var __tsvRows = [];

var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __bs.compId || __prevComp;
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__bs.compId && __bs.compId !== __prevComp) { __read(function () { api.setActiveComp(__bs.compId); }); }
if (!__compId) {
  __result = {
    ok: false, kind: 'batch-step', seq: __bs.seq,
    error: 'No active comp to step through.', code: 'STALLION_NO_ACTIVE_COMP',
    executionTimeMs: Date.now() - __bsStart,
    frames: {}, compactDomTsv: __tsvHeader
  };
} else {
var __allLayers = __read(function () { return api.getCompLayers(false); }) || [];
var __topLayers = __read(function () { return api.getCompLayers(true); }) || [];
var __topSet = {};
for (var t0 = 0; t0 < __topLayers.length; t0++) __topSet[__topLayers[t0]] = true;
var __index = {};
for (var i0 = 0; i0 < __allLayers.length; i0++) __index[__allLayers[i0]] = i0;
var __ids = __bs.queryLayers && __bs.queryLayers.length ? __bs.queryLayers : __allLayers.slice(0, 200);

var __frames = {};
var __renderErrors = [];
var __renderDir = __bs.renderOutputDir || (__read(function () { return api.getHomeFolder(); }) + '/.stallion/batch-step');
if (__bs.renderFrames) {
  var __folder = __read(function () { return api.getFolderFromPath(__renderDir); });
  if (__folder && typeof api.makeFolder === 'function') __read(function () { return api.makeFolder(__folder); });
}

for (var f = 0; f < __bs.frames.length; f++) {
  var __frame = __bs.frames[f];
  __read(function () { api.setFrame(__frame); });
  var __geometries = [];
  for (var l = 0; l < __ids.length; l++) {
    var __id = __ids[l];
    var __type = __read(function () { return api.getLayerType(__id); });
    var __bb = __read(function () { return api.getBoundingBox(__id, true); });
    if (!__bb) continue;
    var __bx = __num(__bb.x, 0), __by = __num(__bb.y, 0);
    var __bw = __num(__bb.width, 0), __bh = __num(__bb.height, 0);
    var __geo = {
      layerId: String(__id),
      name: String(__read(function () { return api.getNiceName(__id); }) || __id),
      type: String(__type || ''),
      bbox: { x: __bx, y: __by, width: __bw, height: __bh, cx: __bx + __bw / 2, cy: __by + __bh / 2 },
      rotation: __num(__read(function () { return api.get(__id, 'rotation'); }), 0),
      opacity: __num(__read(function () { return api.get(__id, 'opacity'); }), 100)
    };
    __geometries.push(__geo);
    if (__bs.dirtyAttributesOnly) {
      var __dirty = [];
      var __animated = __read(function () { return api.getAnimatedAttributes(__id); }) || [];
      for (var a0 = 0; a0 < __animated.length && __dirty.length < 16; a0++) __dirty.push(__animated[a0]);
      var __connectedAttrs = __read(function () { return api.getInConnectedAttributes(__id); }) || [];
      for (var a1 = 0; a1 < __connectedAttrs.length && __dirty.length < 24; a1++) {
        if (__dirty.indexOf(__connectedAttrs[a1]) < 0) __dirty.push(__connectedAttrs[a1]);
      }
      var __attrCells = [];
      for (var a2 = 0; a2 < __dirty.length; a2++) {
        var __val = __read(function () { return api.get(__id, __dirty[a2]); });
        if (__val === null || __val === undefined) continue;
        var __text = Array.isArray(__val) ? __val.join(',') : String(__val);
        __attrCells.push(__dirty[a2] + '=' + __text);
      }
      var __conns = [];
      for (var a3 = 0; a3 < __dirty.length && __conns.length < 8; a3++) {
        var __src = __read(function () { return api.getInConnection(__id, __dirty[a3]); });
        if (__src === null || __src === undefined || __src === '') continue;
        __conns.push(__dirty[a3] + '<-' + String(__src));
      }
      __tsvRows.push([
        String(__id), __tsvCell(__type), __tsvCell(__read(function () { var p = api.getParent(__id); return p || ''; })),
        __tsvCell(__geo.name),
        [Math.round(__bx * 100) / 100, Math.round(__by * 100) / 100, Math.round(__bw * 100) / 100, Math.round(__bh * 100) / 100].join(','),
        __attrCells.join(';'),
        __conns.join(';')
      ].join('\\t'));
    }
  }
  var __entry = { geometries: __geometries };
  if (__bs.renderFrames) {
    var __stem = __renderDir + '/frame_' + __frame;
    try {
      api.renderPNGFrame(__stem, __bs.scale);
      __entry.renderedPngPath = __stem + '.png';
    } catch (e2) {
      __entry.renderError = String(e2 && e2.message ? e2.message : e2);
      __renderErrors.push({ frame: __frame, error: __entry.renderError });
    }
  }
  __frames[String(__frame)] = __entry;
}

if (__bs.frames.length) { __read(function () { api.setFrame(__prevFrame); }); }
if (__bs.compId && __prevComp && __bs.compId !== __prevComp) { __read(function () { api.setActiveComp(__prevComp); }); }

// Non-dirty mode still emits the full (bounded) layer list once, at the last
// sampled frame \u2014 the TSV is a scene sheet, not a per-frame log.
if (!__bs.dirtyAttributesOnly && __tsvRows.length === 0) {
  __read(function () { if (__bs.frames.length) api.setFrame(__bs.frames[__bs.frames.length - 1]); });
  for (var l2 = 0; l2 < __ids.length && __tsvRows.length < 200; l2++) {
    (function (__id) {
      var __type = __read(function () { return api.getLayerType(__id); });
      var __bb = __read(function () { return api.getBoundingBox(__id, true); });
      if (!__bb) return;
      var __attrs = __read(function () { return api.getAnimatedAttributes(__id); }) || [];
      var __attrCells = [];
      for (var b0 = 0; b0 < __attrs.length && __attrCells.length < 16; b0++) {
        var __val = __read(function () { return api.get(__id, __attrs[b0]); });
        if (__val === null || __val === undefined) continue;
        __attrCells.push(__attrs[b0] + '=' + (Array.isArray(__val) ? __val.join(',') : String(__val)));
      }
      __tsvRows.push([
        String(__id), __tsvCell(__type), __tsvCell(__read(function () { var p = api.getParent(__id); return p || ''; })),
        __tsvCell(__read(function () { return api.getNiceName(__id); }) || __id),
        [__num(__bb.x, 0), __num(__bb.y, 0), __num(__bb.width, 0), __num(__bb.height, 0)].map(function (n) { return Math.round(n * 100) / 100; }).join(','),
        __attrCells.join(';'), ''
      ].join('\\t'));
    })(__ids[l2]);
  }
  if (__bs.frames.length) { __read(function () { api.setFrame(__prevFrame); }); }
}

var __out = {
  ok: __scriptError === null,
  kind: 'batch-step',
  seq: __bs.seq,
  compId: String(__compId),
  executionTimeMs: Date.now() - __bsStart,
  scriptResult: __scriptResult,
  manifestResult: __manifestResult,
  frames: __frames,
  compactDomTsv: __tsvRows.length ? (__tsvHeader + '\\n' + __tsvRows.join('\\n')) : __tsvHeader,
  sampledFrames: __bs.frames.length,
  rendered: __bs.renderFrames ? (__bs.frames.length - __renderErrors.length) : 0,
  restoredFrame: __prevFrame
};
if (__scriptError) { __out.error = __scriptError; __out.code = 'STALLION_SCRIPT_FAILED'; }
if (__renderErrors.length) __out.renderErrors = __renderErrors;
__result = __out;
}`}var Se="batch_inspect";function _t(n){let e=Array.isArray(n.frames)?n.frames:[],t=new Set,r=[];for(let i of e){let o=Math.round(Number(i));if(!(!Number.isFinite(o)||Math.abs(o)>1e9||t.has(o))&&(t.add(o),r.push(o),r.length>=64))break}if(!r.length)return{error:{code:"STALLION_BAD_REQUEST",error:"batch_inspect requires a non-empty numeric `frames` array (1..64)."}};r.sort((i,o)=>i-o);let a=Array.isArray(n.layerIds)?n.layerIds.map(i=>typeof i=="string"?i.trim():"").filter(Boolean).slice(0,200):[],s=Array.isArray(n.attributes)?n.attributes.map(i=>typeof i=="string"?i.trim():"").filter(Boolean).slice(0,16):[];return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",frames:r,layerIds:a,attrs:s,includeHidden:n.includeHidden===!0}}}function gt(n){return`/* cavalry-mcp:atomic */ (function () {
var __bi = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __box = function (bb) {
	if (!bb || typeof bb !== 'object') return null;
	var arr = Array.isArray(bb);
	var w = arr ? bb[2] : (bb.width === undefined ? bb.w : bb.width);
	var h = arr ? bb[3] : (bb.height === undefined ? bb.h : bb.height);
	return { x: __num(arr ? bb[0] : bb.x, 0), y: __num(arr ? bb[1] : bb.y, 0), width: __num(w, 0), height: __num(h, 0) };
};
var __started = Date.now();
var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __bi.compId || __prevComp;
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__bi.compId && __bi.compId !== __prevComp) { __read(function () { return api.setActiveComp(__bi.compId); }); }
if (!__compId) {
	return { ok: false, kind: 'batch_inspect', seq: __bi.seq, error: 'No active comp to inspect.', code: 'STALLION_NO_ACTIVE_COMP' };
}
// Comp metadata rides the comp node itself; both spellings occur in the wild,
// so frameRate falls back to fps and a host that reports neither stays null
// rather than lying with a default.
var __compFrameRate = null;
var __fr = __read(function () { return api.get(__compId, 'frameRate'); });
if (__fr === null || __fr === undefined) __fr = __read(function () { return api.get(__compId, 'fps'); });
if (typeof __fr === 'number' && isFinite(__fr) && __fr > 0) __compFrameRate = __fr;
var __compResolution = null;
var __res = __read(function () { return api.get(__compId, 'resolution'); });
var __compW = null, __compH = null;
if (Array.isArray(__res) && __res.length >= 2) { __compW = Number(__res[0]); __compH = Number(__res[1]); }
else if (__res && typeof __res === 'object') { __compW = Number(__res.x); __compH = Number(__res.y); }
if (!(__compW > 0 && __compH > 0)) {
	__compW = __read(function () { return api.get(__compId, 'width'); });
	__compH = __read(function () { return api.get(__compId, 'height'); });
}
if (typeof __compW === 'number' && __compW > 0 && typeof __compH === 'number' && __compH > 0) {
	__compResolution = [__compW, __compH];
}
// Layer selection: the caller's list when given (ids the host does not know are
// skipped per frame and reported once), otherwise every layer in the comp.
var __all = __read(function () { return api.getCompLayers(false); }) || [];
var __index = {};
for (var ai = 0; ai < __all.length; ai++) __index[__all[ai]] = ai;
var __ids = __bi.layerIds && __bi.layerIds.length ? __bi.layerIds.slice(0, 200) : __all.slice(0, 200);
var __unknown = [];
for (var ui = 0; ui < __ids.length; ui++) {
	if (__bi.layerIds && __bi.layerIds.length && __index[__ids[ui]] === undefined) __unknown.push(__ids[ui]);
}
var __attrs = __bi.attrs && __bi.attrs.length ? __bi.attrs : ['position.x', 'position.y', 'scale.x', 'scale.y', 'rotation', 'opacity'];
var __timeline = {};
var __visibleCount = 0;
for (var f = 0; f < __bi.frames.length; f++) {
	var __frame = __bi.frames[f];
	__read(function () { return api.setFrame(__frame); });
	var __frameEntry = {};
	for (var l = 0; l < __ids.length; l++) {
		var __id = __ids[l];
		var __world = __box(__read(function () { return api.getBoundingBox(__id, true); }));
		var __hidden = __read(function () { return api.get(__id, 'hidden'); });
		var __visible = !(__hidden === true || __hidden === 1 || __hidden === 'true');
		if (__visible) {
			var __in = __read(function () { return api.getInFrame(__id); });
			var __out = __read(function () { return api.getOutFrame(__id); });
			if (typeof __in === 'number' && typeof __out === 'number' && (__frame < __in || __frame > __out)) __visible = false;
		}
		var __entry = null;
		if (__world) {
			__entry = {
				bbox: {
					x: __world.x, y: __world.y,
					w: __world.width, h: __world.height,
					cx: __world.x + __world.width / 2, cy: __world.y + __world.height / 2
				},
				attrs: {},
				visible: __visible
			};
			for (var a = 0; a < __attrs.length; a++) {
				var __path = __attrs[a];
				var __v = __read(function () { return api.get(__id, __path); });
				if (__v === null || __v === undefined) continue;
				if (Array.isArray(__v)) __entry.attrs[__path] = __v.map(function (item) { return __num(item, item); });
				else if (typeof __v === 'object') __entry.attrs[__path] = { x: __num(__v.x, __v.x), y: __num(__v.y, __v.y) };
				else __entry.attrs[__path] = typeof __v === 'number' || typeof __v === 'boolean' || typeof __v === 'string' ? __v : String(__v);
			}
			if (__visible) __visibleCount++;
		}
		// A layer with no box at this frame (not yet created, deleted, or fully
		// degenerate) is omitted from the frame's map \u2014 the solver treats an
		// absent key as "no measurement", not as a box at the origin.
		if (__entry !== null) __frameEntry[__id] = __entry;
	}
	__timeline[String(__frame)] = __frameEntry;
}
if (__bi.frames.length) { __read(function () { return api.setFrame(__prevFrame); }); }
if (__bi.compId && __prevComp && __bi.compId !== __prevComp) { __read(function () { return api.setActiveComp(__prevComp); }); }
var __envelope = {
	ok: true,
	kind: 'batch_inspect',
	seq: __bi.seq,
	compId: String(__compId),
	compFrameRate: __compFrameRate,
	compResolution: __compResolution,
	frames: __bi.frames,
	timeline: __timeline,
	visibleLayerFrames: __visibleCount,
	restoredFrame: __prevFrame,
	elapsedMs: Date.now() - __started
};
if (__unknown.length) __envelope.unknownLayerIds = __unknown;
return __envelope;
})()`}var Ae="export_comp_rig_overrides";var Pn=["stiffness","damping","mass","tension","friction","frequency","amplitude","phase","wobble","speed","rate","stagger","lagFrames","delayFrames","offsetFrames","holdFrames","count","rows","columns","spacing","gutter","color","colour","fontSize","tracking","leading","seed","min","max","offset"].join("|");function yt(n){let e=Array.isArray(n.layerIds)?n.layerIds.map(r=>typeof r=="string"?r.trim():"").filter(Boolean).slice(0,200):[],t=Array.isArray(n.attributes)?n.attributes.map(r=>typeof r=="string"?r.trim():"").filter(Boolean).slice(0,32):[];return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",layerIds:e,attributes:t}}}function bt(n){return`/* cavalry-mcp:atomic */ (function () {
var __ro = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __hex2 = function (n) { var s = Math.max(0, Math.min(255, Math.round(__num(n, 0)))).toString(16); return s.length < 2 ? '0' + s : s; };
var __color = function (v) {
	return v && typeof v === 'object' && typeof v.r === 'number' && typeof v.g === 'number' && typeof v.b === 'number'
		? '#' + __hex2(v.r) + __hex2(v.g) + __hex2(v.b)
		: null;
};
var __rigRe = new RegExp(${JSON.stringify(`(?:${Pn})`)}, 'i');
var __started = Date.now();
var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __ro.compId || __prevComp;
if (!__compId) {
	return { ok: false, kind: 'export_comp_rig_overrides', seq: __ro.seq, error: 'No active comp to export from.', code: 'STALLION_NO_ACTIVE_COMP' };
}
if (__ro.compId && __ro.compId !== __prevComp) { __read(function () { return api.setActiveComp(__ro.compId); }); }
var __frame = __num(__read(function () { return api.getFrame(); }), 0);
// Comp metadata mirrors BatchInspect's fallbacks so both readbacks agree with
// the host even when it spells the fields differently.
var __compFrameRate = null;
var __fr = __read(function () { return api.get(__compId, 'frameRate'); });
if (__fr === null || __fr === undefined) __fr = __read(function () { return api.get(__compId, 'fps'); });
if (typeof __fr === 'number' && isFinite(__fr) && __fr > 0) __compFrameRate = __fr;
var __compResolution = null;
var __res = __read(function () { return api.get(__compId, 'resolution'); });
var __compW = null, __compH = null;
if (Array.isArray(__res) && __res.length >= 2) { __compW = Number(__res[0]); __compH = Number(__res[1]); }
else if (__res && typeof __res === 'object') { __compW = Number(__res.x); __compH = Number(__res.y); }
if (!(__compW > 0 && __compH > 0)) {
	__compW = __read(function () { return api.get(__compId, 'width'); });
	__compH = __read(function () { return api.get(__compId, 'height'); });
}
if (typeof __compW === 'number' && __compW > 0 && typeof __compH === 'number' && __compH > 0) {
	__compResolution = [__compW, __compH];
}
var __compEndFrame = __read(function () { return api.get(__compId, 'endFrame'); });
if (typeof __compEndFrame !== 'number' || !isFinite(__compEndFrame)) {
	__compEndFrame = __read(function () { return api.getOutFrame(__compId); });
}
if (typeof __compEndFrame !== 'number' || !isFinite(__compEndFrame)) __compEndFrame = null;
var __ids = __ro.layerIds.length
	? __ro.layerIds.slice(0, 200)
	: (__read(function () { return api.getCompLayers(false); }) || []).slice(0, 200);
var __layers = [];
for (var i = 0; i < __ids.length; i++) {
	var __id = __ids[i];
	var __type = String(__read(function () { return api.getLayerType(__id); }) || '');
	if (!__type) continue;
	var __declared = __read(function () { return api.getAttributes(__id); }) || [];
	var __wanted = [];
	for (var d = 0; d < __declared.length && __wanted.length < 64; d++) {
		var __path = String(__declared[d]);
		// Host bookkeeping knobs that merely look procedural; never preset inputs.
		if (/posterize/i.test(__path)) continue;
		if (__ro.attributes.indexOf(__path) !== -1 || __rigRe.test(__path)) __wanted.push(__path);
	}
	var __attrs = {};
	for (var w = 0; w < __wanted.length; w++) {
		var __val = __read(function () { return api.get(__id, __wanted[w]); });
		if (__val === null || __val === undefined) continue;
		if (Array.isArray(__val)) __attrs[__wanted[w]] = __val.map(function (item) { return typeof item === 'number' ? item : String(item); });
		else if (__color(__val)) __attrs[__wanted[w]] = __color(__val);
		else if (typeof __val === 'object') __attrs[__wanted[w]] = { x: __num(__val.x, 0), y: __num(__val.y, 0) };
		else if (typeof __val === 'number' || typeof __val === 'boolean' || typeof __val === 'string') __attrs[__wanted[w]] = __val;
		else __attrs[__wanted[w]] = String(__val);
	}
	var __animated = (__read(function () { return api.getAnimatedAttributes(__id); }) || []).slice(0, 16);
	var __hidden = __read(function () { return api.get(__id, 'hidden'); });
	__layers.push({
		id: __id,
		name: String(__read(function () { return api.getNiceName(__id); }) || __id),
		type: __type,
		parent: __read(function () { return api.getParent(__id); }) || null,
		hidden: __hidden === true || __hidden === 1 || __hidden === 'true',
		attrs: __attrs,
		animated: __animated
	});
}
// Restore only the comp; the playhead was never moved by this readback.
if (__ro.compId && __prevComp && __ro.compId !== __prevComp) { __read(function () { return api.setActiveComp(__prevComp); }); }
return {
	ok: true,
	kind: 'export_comp_rig_overrides',
	seq: __ro.seq,
	compId: String(__compId),
	frame: __frame,
	compFrameRate: __compFrameRate,
	compResolution: __compResolution,
	compEndFrame: __compEndFrame,
	layers: __layers,
	layerCount: __layers.length,
	elapsedMs: Date.now() - __started
};
})()`}var Me="checkpoint",_e="rollback";function Wt(n,e){return((typeof n=="string"?n.trim():"")||e).replace(/[\\/:*?"<>|]/g,"_").slice(0,80)}function vt(n){let e=Array.isArray(n.layerIds)?n.layerIds.map(t=>typeof t=="string"?t.trim():"").filter(Boolean).slice(0,200):[];return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",snapshotId:Wt(n.snapshotId,`checkpoint-${Date.now().toString(36)}`),layerIds:e}}}function xt(n){let e=n.state;if(!e||typeof e!="object"||Array.isArray(e))return{error:{code:"STALLION_BAD_REQUEST",error:"rollback requires a `state` object (from checkpoint)."}};let t=e;return t.version!==1||!Array.isArray(t.layers)?{error:{code:"STALLION_BAD_REQUEST",error:"rollback state must be a version-1 checkpoint document with a `layers` array."}}:JSON.stringify(t).length>4e6?{error:{code:"STALLION_BAD_REQUEST",error:"rollback state exceeds 4000000 characters."}}:{job:{seq:n.seq,compId:typeof n.compId=="string"&&n.compId.trim()?n.compId.trim():String(t.compId??""),snapshotId:Wt(n.snapshotId,"rollback"),state:t}}}function kt(n){return`/* cavalry-mcp:atomic */ (function () {
var __cp = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
// Fast temp copy of the state document, next to the in-memory store the bridge
// keeps. The path is deterministic in the snapshotId, so a rollback that lost
// the in-memory entry (host restart) can still restore from disk.
var __writeFastCopy = function (snapshotId, state) {
	try {
		var __temp = String(api.getTempFolder()).replace(/\\\\/g, '/').replace(/\\/+$/, '');
		var __file = __temp + '/stallion-checkpoint-' + String(snapshotId).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) + '.cv';
		if (api.writeToFile(__file, JSON.stringify(state), true)) return __file;
	} catch (e) {}
	return null;
};
var __started = Date.now();
var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __cp.compId || __prevComp;
if (!__compId) {
	return { ok: false, kind: 'checkpoint', seq: __cp.seq, error: 'No active comp to checkpoint.', code: 'STALLION_NO_ACTIVE_COMP' };
}
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
var __ids = __cp.layerIds && __cp.layerIds.length
	? __cp.layerIds.slice(0, 200)
	: ((__read(function () { return api.getCompLayers(false); }) || []).slice(0, 200));
var __layers = [];
for (var i = 0; i < __ids.length; i++) {
	var __id = __ids[i];
	var __type = __read(function () { return api.getLayerType(__id); });
	if (!__type) continue;
	var __declared = __read(function () { return api.getAttributes(__id); }) || [];
	var __animated = __read(function () { return api.getAnimatedAttributes(__id); }) || [];
	var __attrs = {};
	for (var a = 0; a < __declared.length; a++) {
		var __path = __declared[a];
		var __v = __read(function () { return api.get(__id, __path); });
		if (__v === null || __v === undefined) continue;
		if (Array.isArray(__v)) __attrs[__path] = __v.map(function (item) { return typeof item === 'number' ? item : String(item); });
		else if (typeof __v === 'object') __attrs[__path] = { x: __num(__v.x, 0), y: __num(__v.y, 0) };
		else __attrs[__path] = typeof __v === 'number' || typeof __v === 'boolean' || typeof __v === 'string' ? __v : String(__v);
	}
	// Keyframes are captured by visiting each animated attribute's frame times
	// and reading the evaluated value there \u2014 the same values a rollback writes
	// back through api.keyframe.
	var __keyframes = {};
	var __animatedList = [];
	for (var an = 0; an < __animated.length && __animatedList.length < 16; an++) {
		var __apath = __animated[an];
		var __times = __read(function () { return api.getKeyframeTimes(__id, __apath); });
		if (!Array.isArray(__times) || !__times.length) continue;
		var __samples = [];
		for (var t = 0; t < __times.length && __samples.length < 64; t++) {
			var __kfFrame = __num(__times[t], NaN);
			if (!isFinite(__kfFrame)) continue;
			__read(function () { return api.setFrame(__kfFrame); });
			var __kv = __read(function () { return api.get(__id, __apath); });
			if (__kv === null || __kv === undefined) continue;
			if (Array.isArray(__kv)) __kv = __kv.map(function (item) { return typeof item === 'number' ? item : String(item); });
			else if (typeof __kv === 'object') __kv = { x: __num(__kv.x, 0), y: __num(__kv.y, 0) };
			else if (typeof __kv !== 'number' && typeof __kv !== 'boolean' && typeof __kv !== 'string') __kv = String(__kv);
			__samples.push({ frame: __kfFrame, value: __kv });
		}
		if (__samples.length) {
			__keyframes[__apath] = __samples;
			__animatedList.push(__apath);
		}
	}
	__read(function () { return api.setFrame(__prevFrame); });
	var __connections = [];
	var __connected = __read(function () { return api.getInConnectedAttributes(__id); }) || [];
	for (var c = 0; c < __connected.length && __connections.length < 16; c++) {
		var __cpath = __connected[c];
		var __from = __read(function () { return api.getInConnection(__id, __cpath); });
		if (__from) __connections.push({ attrPath: __cpath, from: String(__from) });
	}
	var __hidden = __read(function () { return api.get(__id, 'hidden'); });
	__layers.push({
		id: __id,
		type: __type,
		name: String(__read(function () { return api.getNiceName(__id); }) || __id),
		parent: __read(function () { return api.getParent(__id); }) || null,
		inFrame: typeof __read(function () { return api.getInFrame(__id); }) === 'number' ? __num(__read(function () { return api.getInFrame(__id); }), 0) : null,
		outFrame: typeof __read(function () { return api.getOutFrame(__id); }) === 'number' ? __num(__read(function () { return api.getOutFrame(__id); }), 0) : null,
		hidden: __hidden === true || __hidden === 1 || __hidden === 'true',
		attrs: __attrs,
		animated: __animatedList,
		keyframes: __keyframes,
		connections: __connections
	});
}
return {
	ok: true,
	kind: 'checkpoint',
	seq: __cp.seq,
	snapshotId: __cp.snapshotId,
	compId: String(__compId),
	frame: __prevFrame,
	state: { version: 1, compId: String(__compId), frame: __prevFrame, layers: __layers },
	layerCount: __layers.length,
	tmpFile: __writeFastCopy(__cp.snapshotId, { version: 1, compId: String(__compId), frame: __prevFrame, layers: __layers }),
	elapsedMs: Date.now() - __started
};
})()`}function wt(n){return`/* cavalry-mcp:atomic */ (function () {
var __rb = ${JSON.stringify({seq:n.seq,compId:n.compId,snapshotId:n.snapshotId,state:n.state})};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __started = Date.now();
var __prevComp = __read(function () { return api.getActiveComp(); });
var __compId = __rb.compId || __prevComp;
if (!__compId) {
	return { ok: false, kind: 'rollback', seq: __rb.seq, error: 'No active comp to roll back.', code: 'STALLION_NO_ACTIVE_COMP' };
}
if (__rb.compId && __rb.compId !== __prevComp) { __read(function () { return api.setActiveComp(__rb.compId); }); }
var __state = __rb.state;
var __recorded = {};
for (var r = 0; r < __state.layers.length; r++) __recorded[__state.layers[r].id] = __state.layers[r];
var __current = __read(function () { return api.getCompLayers(false); }) || [];
// 1. Layers the rejected mutation created (absent from the checkpoint) die.
var __deleted = [];
for (var d = 0; d < __current.length; d++) {
	if (__recorded[__current[d]] === undefined) {
		__read(function () { return api.deleteLayer(__current[d]); });
		__deleted.push(__current[d]);
	}
}
// 2. Layers the mutation deleted come back as their recorded type; attribute
//    re-application below then rebuilds their state. Cavalry assigns the new
//    id, so the report names both.
var __recreated = [];
var __idMap = {};
for (var rec = 0; rec < __state.layers.length; rec++) {
	var __layer = __state.layers[rec];
	var __exists = __read(function () { return api.getLayerType(__layer.id); });
	if (__exists) { __idMap[__layer.id] = __layer.id; continue; }
	var __newId = __read(function () { return api.create(__layer.type, __layer.name); });
	if (!__newId) continue;
	__idMap[__layer.id] = __newId;
	__recreated.push({ from: __layer.id, to: __newId });
}
// 3. Re-apply state onto every surviving layer (original or recreated id).
var __reapplied = [];
var __keyframesRestored = 0;
var __connectionsRestored = 0;
var __connectionsSkipped = 0;
for (var s = 0; s < __state.layers.length; s++) {
	var __entry = __state.layers[s];
	var __target = __idMap[__entry.id] || __entry.id;
	if (!__read(function () { return api.getLayerType(__target); })) continue;
	var __attrs = __entry.attrs || {};
	// api.set is dictionary-shaped on every host build, so the captured flat
	// record re-applies in one call per layer.
	__read(function () { return api.set(__target, __attrs); });
	// Animated attributes: wipe the mutation's keyframes, then write the
	// checkpointed ones back frame by frame.
	for (var ka = 0; ka < __entry.animated.length; ka++) {
		var __apath = __entry.animated[ka];
		__read(function () { return api.deleteAnimation(__target, __apath); });
		var __samples = __entry.keyframes[__apath] || [];
		for (var ks = 0; ks < __samples.length; ks++) {
			var __sample = __samples[ks];
			var __kfAttrs = {};
			__kfAttrs[__apath] = __sample.value;
			__read(function () { return api.keyframe(__target, __sample.frame, __kfAttrs); });
			__keyframesRestored++;
		}
		__reapplied.push(__target + ':' + __apath);
	}
	if (typeof __entry.inFrame === 'number') __read(function () { return api.setInFrame(__target, __entry.inFrame); });
	if (typeof __entry.outFrame === 'number') __read(function () { return api.setOutFrame(__target, __entry.outFrame); });
	__read(function () { return api.set(__target, { hidden: __entry.hidden === true }); });
	__read(function () { return api.rename(__target, __entry.name); });
}
// 4. Parenting (children before parents would orphan them; apply in reverse
//    declaration order so a parent's id maps exist by the time it is set) and
//    connections, best-effort: a 'from' reference that does not parse as
//    'id.attr' and does not map onto a known layer is counted, not failed.
for (var p = __state.layers.length - 1; p >= 0; p--) {
	var __pentry = __state.layers[p];
	var __ptarget = __idMap[__pentry.id] || __pentry.id;
	var __parent = __pentry.parent ? (__idMap[__pentry.parent] || __pentry.parent) : null;
	if (__parent) __read(function () { return api.parent(__ptarget, __parent); });
	else __read(function () { return api.unParent(__ptarget); });
}
for (var ce = 0; ce < __state.layers.length; ce++) {
	var __centry = __state.layers[ce];
	var __ctarget = __idMap[__centry.id] || __centry.id;
	var __conns = __centry.connections || [];
	for (var cn = 0; cn < __conns.length; cn++) {
		var __conn = __conns[cn];
		var __dot = String(__conn.from).lastIndexOf('.');
		var __srcId = __dot > 0 ? String(__conn.from).slice(0, __dot) : String(__conn.from);
		var __srcAttr = __dot > 0 ? String(__conn.from).slice(__dot + 1) : '';
		var __mapped = __idMap[__srcId];
		if (__mapped) __srcId = __mapped;
		var __srcOk = __read(function () { return api.getLayerType(__srcId); });
		if (__srcOk && __srcAttr) {
			__read(function () { return api.connect(__srcId, __srcAttr, __ctarget, __conn.attrPath, true); });
			__connectionsRestored++;
		} else {
			__connectionsSkipped++;
		}
	}
}
// 5. The exact instant.
__read(function () { return api.setFrame(__state.frame); });
return {
	ok: true,
	kind: 'rollback',
	seq: __rb.seq,
	snapshotId: __rb.snapshotId,
	compId: String(__compId),
	restoredFrame: __state.frame,
	layerCount: __state.layers.length,
	deleted: __deleted,
	recreated: __recreated,
	reappliedCount: __reapplied.length,
	keyframesRestored: __keyframesRestored,
	connectionsRestored: __connectionsRestored,
	connectionsSkipped: __connectionsSkipped,
	elapsedMs: Date.now() - __started
};
})()`}var Ce="render_frame_fast";function St(n,e){let t=Number(n.frame??n.t);if(!Number.isFinite(t))return{error:{code:"STALLION_NO_FRAME",error:"render_frame_fast requires a numeric `frame` (or `t`)."}};let r=Number(n.scaleFactor),a=Number(n.scale??n.resolutionScale),s=Number.isFinite(r)&&r>0?Math.min(1,Math.max(.1,r)):Number.isFinite(a)&&a>0?Math.min(1,Math.max(.1,a/100)):.5,i=(typeof n.fileName=="string"&&n.fileName.trim()?n.fileName.trim():`fast-${String(Math.round(t)).padStart(6,"0")}`).replace(/[\\/:*?"<>|]/g,"_").slice(0,80);return{job:{seq:n.seq,compId:typeof n.compId=="string"?n.compId.trim():"",frame:Math.round(t),restoreFrame:null,scale:Math.round(s*100),scaleFactor:s,outDir:(typeof n.outDir=="string"&&n.outDir.trim()?n.outDir.trim():e).replace(/\\/g,"/"),fileName:i,inline:n.inline!==!1}}}function At(n){return`/* cavalry-mcp:atomic */ (function () {
var __rf = ${JSON.stringify(n)};
var __read = function (fn) { try { return fn(); } catch (e) { return null; }; };
var __num = function (v, fallback) { var n = Number(v); return isFinite(n) ? n : fallback; };
var __box = function (bb) {
	if (!bb || typeof bb !== 'object') return null;
	var arr = Array.isArray(bb);
	var w = arr ? bb[2] : (bb.width === undefined ? bb.w : bb.width);
	var h = arr ? bb[3] : (bb.height === undefined ? bb.h : bb.height);
	return { x: __num(arr ? bb[0] : bb.x, 0), y: __num(arr ? bb[1] : bb.y, 0), width: __num(w, 0), height: __num(h, 0) };
};
var __prevComp = __read(function () { return api.getActiveComp(); });
var __prevFrame = __num(__read(function () { return api.getFrame(); }), 0);
if (__rf.compId && __rf.compId !== __prevComp) { __read(function () { return api.setActiveComp(__rf.compId); }); }
var __ok = true, __error = null, __code = null;
if (!(__rf.compId || __prevComp)) { __ok = false; __error = 'No active comp to render.'; __code = 'STALLION_NO_ACTIVE_COMP'; }
try { if (__ok && __rf.frame !== __prevFrame) api.setFrame(__rf.frame); } catch (e) { __ok = false; __error = String(e && e.message ? e.message : e); __code = 'STALLION_RENDER_FAILED'; }
var __target = __rf.outDir + '/' + __rf.fileName;
if (__ok) {
	try { api.renderPNGFrame(__target, __rf.scale); } catch (e2) { __ok = false; __error = String(e2 && e2.message ? e2.message : e2); __code = 'STALLION_RENDER_FAILED'; }
}
var __renderedAt = Date.now();
var __bytes = __ok ? __read(function () { return api.getFileSize(__target + '.png'); }) : null;
var __exists = __bytes === null ? __read(function () { return api.filePathExists(__target + '.png'); }) : __bytes > 0;
if (__ok && __bytes !== null && !(__bytes > 0)) { __ok = false; __error = 'renderPNGFrame produced a zero-byte file at ' + __target + '.png'; __code = 'STALLION_RENDER_FAILED'; }
// Deterministic frame digest (see Introspect.snapshotScript): geometry over
// the top layers at this frame, hashed FNV-1a style. The script host has no
// crypto; the Node bridge fills contentHash in from the file it reads back.
var __dig = function (str) {
	var hi = 0x811c9dc5, lo = 0x1b873593;
	for (var p = 0; p < str.length; p++) {
		hi ^= str.charCodeAt(p); hi = Math.imul(hi, 0x01000193) >>> 0;
		lo ^= str.charCodeAt(str.length - 1 - p); lo = Math.imul(lo, 0x01000193) >>> 0;
	}
	return ('00000000' + hi.toString(16)).slice(-8) + ('00000000' + lo.toString(16)).slice(-8);
};
var __frameHash = null;
if (__ok) {
	var __sigIds = (__read(function () { return api.getCompLayers(true); }) || []).slice(0, 64);
	var __sig = '';
	for (var q = 0; q < __sigIds.length; q++) {
		var __sid = __sigIds[q];
		var __sbb = __box(__read(function () { return api.getBoundingBox(__sid, true); }));
		__sig += __sid + '|';
		if (__sbb) __sig += [__sbb.x, __sbb.y, __sbb.width, __sbb.height].join(',');
		__sig += ';';
	}
	__frameHash = __dig(String(__rf.frame) + '#' + String(__rf.compId || __prevComp) + '#' + __sig);
}
if (__rf.frame !== __prevFrame) { __read(function () { return api.setFrame(__prevFrame); }); }
if (__rf.compId && __prevComp && __rf.compId !== __prevComp) { __read(function () { return api.setActiveComp(__prevComp); }); }
return {
	ok: __ok,
	kind: 'render_frame_fast',
	seq: __rf.seq,
	compId: String(__rf.compId || __prevComp),
	frame: __rf.frame,
	scaleFactor: __rf.scaleFactor,
	scale: __rf.scale,
	file: __target + '.png',
	fileName: __rf.fileName,
	inline: __rf.inline === true,
	renderedAt: __renderedAt,
	restoredFrame: __prevFrame,
	exists: __exists === true,
	sizeBytes: __bytes === null ? null : Number(__bytes),
	frameHash: __frameHash,
	error: __error,
	code: __code
};
})()`}import Ue from"node:vm";import{createHash as Ln}from"node:crypto";var Ee="determinism-check",Et=["forward","backward","shuffled","after-previous","after-other-width","after-sweep","fresh"],It=64,Ft=1e4,Nt=2e5,Bn=120,Dn=7,qn=480,Kt=5e3,zn=5e3,Jt=3e4,jn=12e4,$n=8,He=16;function Qt(n){let e=String(n??""),t=e.split(/\r?\n/),a=e.replace(/\/\*[\s\S]*?\*\//g,l=>l.replace(/[^\n]/g," ")).replace(/(^|[^:\\'"])\/\/[^\n]*/g,(l,u)=>u+" ".repeat(l.length-u.length)).replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g,'""').split(/\r?\n/),s=[],i=[[/\bMath\.random\s*\(/,"Math.random"],[/\bDate\.now\s*\(|\bnew\s+Date\s*\(/,"Date"],[/\bperformance\.now\s*\(/,"performance.now"],[/\bgetRandomValues\s*\(/,"crypto.getRandomValues"]];for(let l=0;l<a.length;l++)for(let[u,p]of i)u.test(a[l])&&s.push({rule:"nondeterministic_source",line:l+1,severity:"fail",snippet:(t[l]??"").trim().slice(0,120),message:`Line ${l+1} calls ${p}: a frame may depend only on (t, seed, width); take randomness from a seeded hash instead.`});let o=/\b(?:globalThis|window|self)\s*\.\s*[A-Za-z_$][\w$]*\s*(?:=(?!=)|\+\+|--|\+=|-=|\*=|\/=)/;for(let l=0;l<a.length;l++)o.test(a[l])&&s.push({rule:"frame_order_state",line:l+1,severity:"warn",snippet:(t[l]??"").trim().slice(0,120),message:`Line ${l+1} writes a global: state that survives a frame makes results depend on evaluation order. Keep every value a pure function of (t, seed, width).`});return{passed:!s.some(l=>l.severity==="fail"),violations:s}}function Mt(n){let e=typeof n.code=="string"?n.code:"";if(!e.trim())return{error:"determinism-check requires a non-empty `code` string: a function expression (t, seed, width) => value, or a script defining frame(t, seed, width).",code:ee.BAD_REQUEST};if(Buffer.byteLength(e,"utf8")>Nt)return{error:`determinism-check \`code\` exceeds ${Nt} bytes.`,code:ee.BAD_REQUEST};let t=Number(n.frameCount??Bn);if(!Number.isFinite(t)||t<1||t>Ft)return{error:`determinism-check \`frameCount\` must be 1..${Ft}.`,code:ee.BAD_REQUEST};let r=Math.round(t),a;if(n.frames!==void 0&&n.frames!==null){if(!Array.isArray(n.frames))return{error:"determinism-check `frames` must be an array of frame numbers.",code:ee.BAD_REQUEST};let u=n.frames.map(p=>Math.round(Number(p)));if(u.some(p=>!Number.isFinite(p)||p<0||p>1e6))return{error:"determinism-check `frames` entries must be finite frame numbers 0..1000000.",code:ee.BAD_REQUEST};if(a=[...new Set(u)].sort((p,y)=>p-y),!a.length||a.length>It)return{error:`determinism-check requires 1..${It} distinct probe frames.`,code:ee.BAD_REQUEST}}else a=[...new Set([0,Math.floor(r/4),Math.floor(r/2),Math.floor(3*r/4),r-1])].sort((u,p)=>u-p);let s=Number(n.seed??Dn),i=Number(n.width??qn);if(!Number.isFinite(s))return{error:"determinism-check `seed` must be a finite number.",code:ee.BAD_REQUEST};if(!Number.isFinite(i)||i<=0||i>1e5)return{error:"determinism-check `width` must be a positive number up to 100000.",code:ee.BAD_REQUEST};let o=Number(n.budgetMs??Jt),l=Number.isFinite(o)&&o>0?Math.min(jn,Math.round(o)):Jt;return{job:{seq:n.seq,code:e,frames:a,frameCount:r,seed:Math.round(s),width:Math.round(i),lint:n.lint!==!1,budgetMs:l}}}function Rt(n,e){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="number")return Number.isNaN(n)?"NaN":Number.isFinite(n)?Object.is(n,-0)?"-0":String(n):n>0?"Infinity":"-Infinity";if(typeof n=="bigint")return`${n}n`;if(typeof n=="function")return`function:${n.name||"anonymous"}`;if(typeof n=="symbol")return n.toString();if(typeof n!="object")return JSON.stringify(n);if(e.has(n))return"[circular]";e.add(n);let t;if(Array.isArray(n))t=`[${n.map(r=>Rt(r,e)).join(",")}]`;else{let r=n;t=`{${Object.keys(r).sort().map(a=>`${JSON.stringify(a)}:${Rt(r[a],e)}`).join(",")}}`}return e.delete(n),t}function Hn(n){return Ln("sha256").update(Rt(n,new WeakSet)).digest("hex").slice(0,16)}function Un(n,e){let t=e*2654435761>>>0,r=()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296,a=[...n];for(let s=a.length-1;s>0;s--){let i=Math.floor(r()*(s+1));[a[s],a[i]]=[a[i],a[s]]}return a}function Ct(n,e){let r={console:{log:(...i)=>e.push({level:"log",text:i.map(String).join(" ")}),info:(...i)=>e.push({level:"info",text:i.map(String).join(" ")}),warn:(...i)=>e.push({level:"warn",text:i.map(String).join(" ")}),error:(...i)=>e.push({level:"error",text:i.map(String).join(" ")})}},a=Ue.createContext(r),s=Ue.runInContext(n,a,{timeout:Kt});if(typeof s=="function")r.__frameFn=s;else if(typeof r.frame=="function"||typeof r.__frameFn=="function")Ue.runInContext('var __frameFn = typeof frame === "function" ? frame : __frameFn;',a,{timeout:Kt});else throw new Error("code must evaluate to a function (t, seed, width) => value, or define a global frame(t, seed, width) function");return{ctx:a,sandbox:r,entries:e}}function Tt(n){let e=Date.now(),t=n.lint?Qt(n.code):{passed:!0,violations:[]},r=[],a=[],s=new Map,i=0,o=!1,l=null,u=()=>Date.now()-e>n.budgetMs?(o=!0,!0):!1;try{let b=Ct(n.code,r)}catch(b){l=String(b?.message??b)}let p=(b,O,x)=>{i++;try{let A=Ue.runInContext(`__frameFn(${O}, ${n.seed}, ${x})`,b.ctx,{timeout:zn});return Hn(A)}catch(A){return a.length<He&&a.push({frame:O,order:"eval",error:String(A?.message??A)}),null}},y=(b,O,x)=>{if(x===null)return;let A=s.get(b)??{};A[O]=x,s.set(b,A)};if(!l)for(let b of Et){if(o)break;if(b==="fresh"){for(let A of n.frames){if(u())break;try{let T=Ct(n.code,r);y(A,b,p(T,A,n.width))}catch(T){a.length<He&&a.push({frame:A,order:b,error:String(T?.message??T)})}}continue}let O;try{O=Ct(n.code,r)}catch(A){a.length<He&&a.push({frame:null,order:b,error:String(A?.message??A)});continue}let x=b==="backward"?[...n.frames].reverse():b==="shuffled"?Un(n.frames,n.seed):n.frames;if(b==="after-sweep"){let A=Math.max(5,Math.ceil(n.frameCount/400));for(let T=0;T<n.frameCount&&!o&&!u();T+=A)p(O,T,n.width)}for(let A of x){if(u())break;b==="after-previous"&&A>0?p(O,A-1,n.width):b==="after-other-width"&&p(O,A,n.width*2),y(A,b,p(O,A,n.width))}}for(let b of r)b.level==="error"&&a.length<He&&a.push({frame:null,order:"console",error:b.text.slice(0,240)});let k=[],g=0;for(let b of n.frames){let O=s.get(b);if(!O||new Set(Object.values(O)).size<2||(g++,k.length>=$n))continue;let A=new Map;for(let[T,U]of Object.entries(O)){let R=A.get(U)??[];R.push(T),A.set(U,R)}k.push({frame:b,detail:[...A.values()].map(T=>T.join(" = ")).join("  vs  "),hashes:O})}return{deterministic:!l&&!o&&g===0&&a.length===0,orders:[...Et],probes:n.frames.length,frames:n.frames,frameCount:n.frameCount,seed:n.seed,width:n.width,evaluations:i,mismatchCount:g,mismatches:k,errors:a,setupError:l,truncated:o,lint:t,consoleDiagnostics:r.slice(0,64).map(b=>({level:b.level,text:b.text.slice(0,240)}))}}var Te=`
const _mg = {
  comp(w = 1920, h = 1080, fps = 60, endFrame = 180, bgColor = "#0B0C10") {
    const id = api.getActiveComp();
    api.set(id, { "resolution.x": w, "resolution.y": h, fps, backgroundColor: bgColor });
    // Cavalry 2.8: api.setOutFrame() resolves but does not update the comp;
    // the startFrame/endFrame attributes are the working route.
    api.set(id, { startFrame: 0, endFrame });
    try { api.setInFrame(id, 0); } catch (e) {}
    return id;
  },
  set(id, attrs) {
    return _rb.set(id, attrs);
  },
  shape(type, name, attrs = {}) {
    const spec = this.__splitAlias(attrs);
    const id = api.primitive(type, name);
    if (Object.keys(spec.attrs).length) _rb.set(id, spec.attrs);
    if (spec.alias != null) this.alias(id, spec.alias);
    return id;
  },
  layer(type, name, attrs = {}) {
    const spec = this.__splitAlias(attrs);
    const id = api.create(type, name);
    if (Object.keys(spec.attrs).length) _rb.set(id, spec.attrs);
    if (spec.alias != null) this.alias(id, spec.alias);
    return id;
  },
  /**
   * Register a stable, human-readable handle for a layer ("@hero_card"). The
   * registry lives on globalThis because Cavalry 2.8 has no cross-execution
   * store: a build script can alias the roots it created and a later refinement
   * script patches those exact layers without carrying opaque ids. Aliases are
   * slugged with the same rule as semantic ids, so "@Hero Card" and
   * "@hero_card" are the same handle.
   */
  alias(id, name) {
    const key = this.__aliasKey(name);
    if (!key) throw new Error("_mg.alias requires a non-empty name");
    const layerId = String(id);
    if (!layerId) throw new Error("_mg.alias requires a layer id");
    this.__aliasMap()[key] = layerId;
    return "@" + key;
  },
  /** Every registered alias as { "@handle": "layerId" }, for diagnostics. */
  aliases() {
    const map = this.__aliasMap();
    const out = {};
    const keys = Object.keys(map);
    for (let i = 0; i < keys.length; i++) out["@" + keys[i]] = map[keys[i]];
    return out;
  },
  __aliasKey(name) {
    const text = String(name == null ? "" : name).trim().replace(/^@+/, "");
    return text ? this.__slug(text) : "";
  },
  __aliasMap() {
    try {
      if (!globalThis.__mgAliases || typeof globalThis.__mgAliases !== "object") globalThis.__mgAliases = {};
      return globalThis.__mgAliases;
    } catch (e) {
      return {};
    }
  },
  /** Keep "alias" out of api.set: it is runtime metadata, not a Cavalry attr. */
  __splitAlias(attrs) {
    const source = attrs && typeof attrs === "object" ? attrs : {};
    const out = {};
    let alias = null;
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "alias") alias = source[keys[i]];
      else out[keys[i]] = source[keys[i]];
    }
    return { attrs: out, alias: alias };
  },
  text(str, size = 80, color = "#FFFFFF", extraAttrs = {}) {
    const theme = this.theme();
    const typography = theme && theme.typography ? theme.typography : null;
    let fontSize = Number(size) || 80;
    if (typography && Number(typography.scale) > 0) fontSize = fontSize * Number(typography.scale);
    const attrs = Object.assign({
      text: str,
      fontSize: fontSize,
      horizontalAlignment: 1,
      verticalAlignment: 1,
      "material.materialColor": color
    }, extraAttrs);
    if (typography && typography.font && attrs.font == null) {
      attrs.font = { font: typography.font, style: typography.style || "Regular" };
    }
    return _mg.layer("textShape", String(str).slice(0, 40) || "Text", attrs);
  },
  /**
   * Evaluated inputs of one attribute as "sourceId.sourceAttr" strings.
   * Cavalry 2.8 returns a single string from api.getInConnection and uses "" for
   * "nothing drives this"; some builds answer with a list. Normalising both here
   * keeps every idempotency check on one read path.
   */
  __inConnections(dstId, dstAttr) {
    let raw = null;
    try { raw = api.getInConnection(dstId, dstAttr); } catch (e) { return []; }
    if (raw == null || raw === "") return [];
    const list = Array.isArray(raw) ? raw : [raw];
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const value = list[i];
      if (value == null || value === "") continue;
      out.push(String(typeof value === "object" ? (value.id != null ? value.id + "." + (value.attr != null ? value.attr : "") : value.srcId || "") : value));
    }
    return out;
  },

  /** Layer type of an id, or "" when this build cannot answer. */
  __layerType(id) {
    if (id == null || id === "") return "";
    try { return String(api.getLayerType(id) || ""); } catch (e) { return ""; }
  },

  /** First modifier node of nodeType already driving attr on target, or null. */
  __findModifier(target, attr, nodeType) {
    const inputs = this.__inConnections(target, attr);
    for (let i = 0; i < inputs.length; i++) {
      const id = String(inputs[i]).split(".")[0];
      if (this.__layerType(id) === nodeType) return id;
    }
    return null;
  },

  /**
   * Idempotent connect. api.connect appends an input every time it is called, so
   * re-running a rig doubled its deformer, stagger or filter stack. The wire is
   * read back first: an attribute already driven by "srcId.srcAttr" is left
   * alone and reported as skipped.
   *
   *   wire(srcId, srcAttr, dstId, dstAttr)            // original positional form
   *   wire({ from, fromAttr, to, toAttr, force?, exclusive? })
   *
   * force re-wires over an existing input (passed as api.connect's fifth
   * argument, the same convention cavalry_batch uses). exclusive is opt-in and
   * refuses to add a second source where one already drives the attribute \u2014 the
   * default stays permissive because "deformers" and "filters" legitimately
   * carry several inputs.
   */
  wire(srcId, srcAttr, dstId, dstAttr, opts) {
    let from = srcId, fromAttr = srcAttr, to = dstId, toAttr = dstAttr;
    if (srcId && typeof srcId === "object") {
      const spec = srcId;
      from = spec.from != null ? spec.from : spec.srcId;
      fromAttr = spec.fromAttr != null ? spec.fromAttr : spec.srcAttr;
      to = spec.to != null ? spec.to : spec.dstId;
      toAttr = spec.toAttr != null ? spec.toAttr : spec.dstAttr;
      opts = spec;
    }
    opts = opts || {};
    const source = String(from) + "." + String(fromAttr);
    const sink = String(to) + "." + String(toAttr);
    const existing = this.__inConnections(to, toAttr);
    if (existing.indexOf(source) >= 0) {
      return { wired: false, skipped: "already-wired", source: source, target: sink, existing: existing };
    }
    if (opts.exclusive && existing.length && !opts.force) {
      throw new Error("_mg.wire: " + sink + " is already driven by " + existing[0] + "; pass force to replace it");
    }
    const result = opts.force ? api.connect(from, fromAttr, to, toAttr, true) : api.connect(from, fromAttr, to, toAttr);
    return { wired: true, source: source, target: sink, replaced: existing.slice(), result: result };
  },
  deform(targetId, deformerType, name, attrs = {}) {
    const id = _mg.layer(deformerType, name, attrs);
    _mg.wire(id, "id", targetId, "deformers");
    return id;
  },
  subMesh(textId, level = 1, staggerOffset = 8) {
    const subMeshId = _mg.layer("subMesh", "Text Segments", {
      levelMode: level,
      shapeTimeOffset: staggerOffset
    });
    const staggerId = _mg.layer("stagger", "Segment Stagger", { offset: staggerOffset });
    _mg.wire(staggerId, "id", subMeshId, "shapeTimeOffset");
    _mg.wire(subMeshId, "id", textId, "deformers");
    return { subMeshId, staggerId };
  },
  /**
   * Duplicator rig. Legacy positional form (shapeId, distType, count, size,
   * attrs) is unchanged. The object form emitted by refclone accepts
   * { base, count, distribution, size, attrs, stagger, falloff } where
   * distribution is "linear" | "grid" | "circle" | "point", stagger is
   * { type, lagFrames, offset } and falloff is { type, influence } \u2014 a
   * stagger node and a falloff node are created and wired when requested.
   */
  duplicator(shapeId, distType = "grid", count = [5, 5], size = [1200, 700], attrs = {}) {
    if (shapeId && typeof shapeId === "object") {
      const spec = shapeId;
      const base = spec.base != null ? spec.base : spec.shapeId;
      if (base == null) throw new Error("_mg.duplicator object form requires base");
      const dist = String(spec.distribution || "linear");
      const linear = dist.indexOf("linear") === 0 || dist === "circle" || dist === "point";
      const countArg = Array.isArray(spec.count) ? spec.count : (Number(spec.count) || 2);
      const dupId = _rb.dup(base, {
        distribution: linear ? "linear" : "grid",
        count: countArg,
        size: spec.size || [1200, 700],
        attrs: spec.attrs || {}
      });
      if (dist === "circle" || dist === "point") {
        try { this.set(dupId, { distribution: dist }); } catch (e) { console.warn("_mg.duplicator: distribution '" + dist + "' rejected: " + e); }
      }
      if (spec.falloff) {
        const cfg = typeof spec.falloff === "number" ? { influence: spec.falloff } : spec.falloff;
        const falloffId = this.layer("falloff", "Duplicator Falloff", { influence: Number(cfg.influence != null ? cfg.influence : 1) });
        try { api.connect(falloffId, "id", dupId, "deformers"); } catch (e) { console.warn("_mg.duplicator: falloff connect failed: " + e); }
      }
      if (spec.stagger) {
        const cfg = typeof spec.stagger === "number" ? { offset: spec.stagger } : spec.stagger;
        const staggerId = this.layer("stagger", "Duplicator Stagger", { offset: Math.round(Number(cfg.lagFrames != null ? cfg.lagFrames : (cfg.offset != null ? cfg.offset : 4))) });
        try { api.connect(staggerId, "id", dupId, "shapeTimeOffset"); } catch (e) { console.warn("_mg.duplicator: stagger connect failed: " + e); }
      }
      return dupId;
    }
    const linear = String(distType).indexOf("linear") === 0;
    const dupId = _rb.dup(shapeId, {
      distribution: linear ? "linear" : "grid",
      count,
      size,
      attrs: attrs || {}
    });
    return dupId;
  },
  /**
   * Keyframe writer. framesAndValues accepts plain [frame, value] pairs
   * (delegated to _rb.kf with the named magic easing, unchanged behaviour) or
   * weighted cubic B\xE9zier tuples [frame, value, { inWeight, inAngle,
   * outWeight, outAngle, interpolation? }] where the explicit handles are
   * written through api.modifyKeyframeTangent inside the same undo group.
   * Angles are Cavalry tangent angles (0 = flat); weights are in frames.
   */
  kf(id, attr, framesAndValues, magicEase = "SpringOut") {
    const hasHandles = framesAndValues.some((entry) => Array.isArray(entry) && entry.length > 2 && entry[2] && typeof entry[2] === "object");
    if (!hasHandles) return _rb.kf(id, attr, framesAndValues, magicEase);
    const ease = magicEase == null ? null : this.__easeName(magicEase);
    const written = [];
    for (let i = 0; i < framesAndValues.length; i++) {
      const entry = framesAndValues[i];
      if (!Array.isArray(entry) || entry.length < 2) throw new Error("_mg.kf expects [frame, value] or [frame, value, handles] tuples");
      const frame = Math.round(Number(entry[0]));
      const handles = entry.length > 2 && entry[2] && typeof entry[2] === "object" ? entry[2] : null;
      this.__kfWrite(id, attr, frame, entry[1], handles);
      if (!handles && ease && i < framesAndValues.length - 1) {
        try { api.magicEasing(id, attr, frame, ease); } catch (e) {}
      }
      written.push(frame);
    }
    return written;
  },

  /**
   * Clip-space handles for the magic-easing curves this build accepts. "Custom"
   * is deliberately absent: api.magicEasing only accepts a Custom keyframe with a
   * separate expression argument, so _mg.ease never sends that name.
   */
  EASE_CURVES: {
    None: [0, 0, 1, 1],
    SlowIn: [0.42, 0, 1, 1],
    SlowOut: [0, 0, 0.58, 1],
    SlowInSlowOut: [0.42, 0, 0.58, 1],
    VerySlowIn: [0.76, 0, 1, 1],
    VerySlowOut: [0, 0, 0.24, 1],
    VerySlowInVerySlowOut: [0.76, 0, 0.24, 1],
    SpringIn: [0.64, 0, 0.78, 0.4],
    SpringOut: [0.22, 1.4, 0.36, 1],
    SpringInSpringOut: [0.5, 1.4, 0.5, 0.4],
    AnticipateIn: [0.36, 0, 0.66, -0.56],
    OvershootOut: [0.34, 1.56, 0.64, 1],
    AnticipateInOvershootOut: [0.5, -0.4, 0.5, 1.4],
    BounceOut: [0.34, 1.56, 0.64, 1]
  },

  /** Friendly names emitted by refclone that Cavalry spells differently. */
  EASE_ALIASES: {
    QuarticIn: "SlowIn", QuarticOut: "SlowOut", QuarticInOut: "SlowInSlowOut",
    CubicIn: "SlowIn", CubicOut: "SlowOut", CubicInOut: "SlowInSlowOut",
    ExpoIn: "VerySlowIn", ExpoOut: "VerySlowOut", ExpoInOut: "VerySlowInVerySlowOut",
    BackIn: "AnticipateIn", BackOut: "OvershootOut", BackInOut: "AnticipateInOvershootOut",
    Linear: "None"
  },

  /** Normalize a requested easing to a name this Cavalry build accepts. */
  __easeName(name) {
    if (!name) return "SlowInSlowOut";
    const alias = this.EASE_ALIASES[name];
    if (alias) return alias;
    if (this.EASE_CURVES[name]) return name;
    return _rb.ease(name);
  },

  /** Closest supported curve to cubic-bezier handles, by RMS over 11 samples. */
  __nearestEase(handles) {
    if (!handles || handles.length !== 4) return "SlowInSlowOut";
    const bx = [Number(handles[0]) || 0, Number(handles[2]) || 0];
    const by = [Number(handles[1]) || 0, Number(handles[3]) || 0];
    const sample = (p, t) => {
      let lo = 0, hi = 1, x = t;
      for (let i = 0; i < 12; i++) {
        x = (lo + hi) / 2;
        const value = 3 * (1 - x) * (1 - x) * x * p[0] + 3 * (1 - x) * x * x * p[1] + x * x * x;
        if (value < t) lo = x; else hi = x;
      }
      return 3 * (1 - x) * (1 - x) * x * p[2] + 3 * (1 - x) * x * x * p[3] + x * x * x;
    };
    const curve = [bx[0], by[0], bx[1], by[1]];
    let best = "SlowInSlowOut";
    let bestScore = Infinity;
    const names = Object.keys(this.EASE_CURVES);
    for (let i = 0; i < names.length; i++) {
      const preset = this.EASE_CURVES[names[i]];
      let score = 0;
      for (let s = 0; s <= 10; s++) {
        const delta = sample(preset, s / 10) - sample(curve, s / 10);
        score += delta * delta;
      }
      if (score < bestScore) { bestScore = score; best = names[i]; }
    }
    return best;
  },

  /**
   * Rig-vocabulary normalizer. A refinement loop (refclone's Stage 4) speaks in
   * spring terms \u2014 stiffness, damping, overshoot, holdFrames, staggerOffset \u2014
   * while Cavalry 2.8 only exposes magic easings, keyframes and the oscillator /
   * stagger / falloff nodes. This maps one onto the other with the textbook
   * second-order model, in frames:
   *
   *   omega0 = sqrt(stiffness / mass)                 rad per frame
   *   zeta   = dampingRatio, or coefficient/(2\xB7sqrt(k\xB7m)), or derived from the
   *            requested overshoot through Os = e^(-zeta\xB7pi / sqrt(1 - zeta^2))
   *   x(t)   = rest + amplitude \xB7 e^(-zeta\xB7omega0\xB7t) \xB7 cos(omega_d\xB7t)
   *
   * cycles and decay are the same curve expressed across a window of
   * durationFrames, which is what modulate's sampler and api.magicEasing need.
   * Returns the descriptor only \u2014 it writes nothing, so it is safe to call from a
   * validator before any scene mutation.
   */
  rig(spec) {
    spec = spec || {};
    const num = function (value, fallback) { const n = Number(value); return isFinite(n) ? n : fallback; };
    const mass = Math.max(num(spec.mass, 1), 1e-6);
    const stiffness = Math.max(num(spec.stiffness, 100), 1e-6);
    const omega0 = Math.sqrt(stiffness / mass);
    let zeta = null;
    if (spec.dampingRatio != null) zeta = num(spec.dampingRatio, 0.5);
    else if (spec.damping != null) {
      const d = num(spec.damping, 0);
      // Values at or below 1 read as a damping ratio (the usual convention for
      // this knob); anything larger is a coefficient in force per frame.
      zeta = d <= 1 ? d : d / (2 * Math.sqrt(stiffness * mass));
    }
    let overshoot = spec.overshoot != null ? num(spec.overshoot, 0) : null;
    if (overshoot != null && overshoot > 0 && zeta == null) {
      const os = Math.min(Math.max(overshoot > 1 ? overshoot / 100 : overshoot, 1e-6), 0.999);
      const l = Math.log(os);
      zeta = -l / Math.sqrt(Math.PI * Math.PI + l * l);
    }
    if (zeta == null) zeta = 0.5;
    zeta = Math.max(0, Math.min(1.5, zeta));
    const omegaD = zeta < 1 ? omega0 * Math.sqrt(1 - zeta * zeta) : 0;
    const impliedOvershoot = zeta < 1 ? Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta)) : 0;
    return {
      mass: mass,
      stiffness: stiffness,
      dampingRatio: Math.round(zeta * 10000) / 10000,
      dampingCoefficient: Math.round(2 * zeta * omega0 * mass * 10000) / 10000,
      angularFrequency: Math.round(omega0 * 10000) / 10000,
      dampedFrequency: Math.round(omegaD * 10000) / 10000,
      cyclesPerFrame: Math.round((omegaD / (2 * Math.PI)) * 10000) / 10000,
      overshoot: Math.round(impliedOvershoot * 1000) / 1000,
      underdamped: zeta < 1,
      holdFrames: Math.max(0, Math.round(num(spec.holdFrames, 0))),
      staggerOffset: Math.max(1, Math.round(num(spec.staggerOffset != null ? spec.staggerOffset : spec.stagger, 4))),
      /** Magic-easing name that best matches this descriptor, from the accepted set. */
      easing: zeta >= 1 ? "SlowOut" : (impliedOvershoot >= 0.2 ? "OvershootOut" : "SpringOut")
    };
  },

  /**
   * Two boundary keyframes plus a supported magic-easing curve.
   *
   * spec = { inFrame, outFrame, from, to, magicEasing?, easing?, bezier?,
   *          holdFrames?, stiffness?, damping?, overshoot? }
   *   easing: { kind: "preset", name } or { kind: "bezier", handles }
   * A cubic-bezier without a matching preset resolves to the nearest accepted
   * Cavalry curve; "Custom" is never sent to api.magicEasing. holdFrames delays
   * the move; a rig name without an explicit easing is chosen from the spring
   * descriptor. attr may be "position" or "scale" to drive both axes.
   */
  ease(id, attr, spec) {
    spec = spec || {};
    const inFrame = Math.round(Number(spec.inFrame));
    const outFrame = Math.round(Number(spec.outFrame));
    if (!isFinite(inFrame) || !isFinite(outFrame) || inFrame === outFrame) {
      throw new Error("_mg.ease requires distinct integer inFrame and outFrame values");
    }
    const from = Number(spec.from);
    const to = Number(spec.to);
    if (!isFinite(from) || !isFinite(to)) throw new Error("_mg.ease requires finite from and to values");
    // holdFrames keeps the layer still before the move starts, so a stagger or a
    // beat offset is expressed in the timing rather than in the curve.
    const hold = Math.max(0, Math.round(Number(spec.holdFrames != null ? spec.holdFrames
      : (spec.easing && spec.easing.holdFrames != null ? spec.easing.holdFrames : (spec.rig && spec.rig.holdFrames) || 0))));
    const start = inFrame + hold;
    if (start === outFrame) throw new Error("_mg.ease: holdFrames moved the start onto outFrame");
    const easing = spec.easing || null;
    let name = spec.magicEasing || (easing && easing.kind === "preset" ? easing.name : null);
    const handles = spec.bezier || (easing && easing.kind === "bezier" ? easing.handles : null);
    const rigSpec = spec.rig || (name == null && handles == null
      && (spec.stiffness != null || spec.damping != null || spec.overshoot != null) ? spec : null);
    const resolved = name ? this.__easeName(name) : (rigSpec ? this.rig(rigSpec).easing : this.__nearestEase(handles));
    const attrs = attr === "position" || attr === "scale" ? [attr + ".x", attr + ".y"] : [attr];
    for (let i = 0; i < attrs.length; i++) {
      _rb.kf(id, attrs[i], [[start, from], [outFrame, to]], resolved);
    }
    return { id: id, attrs: attrs, easing: resolved, inFrame: start, outFrame: outFrame, holdFrames: hold };
  },

  /**
   * Deterministic staggered timing for a set of layers (or a group id, expanded
   * to its children). Each follower gets its own eased boundary keyframes offset
   * by delayFrames; no deformer wiring is guessed for arbitrary layer types.
   *
   * spec = { attr, from, to, inFrame, outFrame, delayFrames, easing?, magicEasing?, bezier? }
   */
  stagger(ids, spec) {
    spec = spec || {};
    let list = Array.isArray(ids) ? ids.slice() : [ids];
    if (list.length === 1) {
      let children = [];
      try { children = api.getChildren(list[0]) || []; } catch (e) { children = []; }
      if (children.length) list = children.slice();
    }
    if (list.length < 2) throw new Error("_mg.stagger needs at least two member layers");
    if (!spec.attr) throw new Error("_mg.stagger requires an attr (for example position.y)");
    const requested = spec.delayFrames != null ? spec.delayFrames : spec.staggerOffset;
    const delay = Math.round(Number(requested == null ? 4 : requested));
    if (!(delay >= 1)) throw new Error("_mg.stagger delayFrames must be at least 1");
    const inFrame = Math.round(Number(spec.inFrame));
    const outFrame = Math.round(Number(spec.outFrame));
    const applied = [];
    for (let i = 0; i < list.length; i++) {
      const offset = i * delay;
      this.ease(list[i], spec.attr, {
        inFrame: inFrame + offset, outFrame: outFrame + offset,
        from: spec.from, to: spec.to,
        magicEasing: spec.magicEasing, easing: spec.easing, bezier: spec.bezier
      });
      applied.push({ id: list[i], inFrame: inFrame + offset, outFrame: outFrame + offset });
    }
    return { ids: list, attr: spec.attr, delayFrames: delay, staggerOffset: delay, applied: applied };
  },

  /**
   * In-place delta / absolute adjustment for existing layers. Never creates,
   * duplicates or recreates layers, so the composition and playhead are kept.
   *
   * spec = {
   *   alias?: "@hero_card", target?: "<layerId>" | "<semanticId>" | "@alias",
   *   ids?: string[], semantic?: "<semanticId>" | "<slug>", semantics?: string[],
   *   attrs?: { "position.x": 120 }, delta?: { "position.x": 4 },
   *   multiply?: { "scale.x": 1.08 },
   *   frame?: 42, shiftKeyframes?, easing?, force?, diff?
   * }
   * delta is additive and multiply is multiplicative (read the current value,
   * apply delta, then multiply), so a convergence pass can correct a scale ratio
   * without first reading it into the script. Both are evaluated per target.
   * An alias resolves through the globalThis registry written by _mg.alias (and
   * the alias attribute accepted by shape/layer), so a later refinement pass can
   * address the exact layer a build created by stable handle instead of a live
   * id. Run the call inside the atomic wrapper (or _mg.undoGroup) and every
   * target lands in one Undo step; patch itself never creates a layer.
   * With frame, values are written through api.keyframe at that frame so an
   * animated attribute is corrected where the render failed, not at the playhead.
   * Static writes are compared against the evaluated attribute first: a layer that
   * already holds the requested value is reported under skipped and not written,
   * so re-applying the same spec is a no-op instead of a second pass of identical
   * keyframes. A frame-targeted write always lands, because Cavalry 2.8 has no
   * value-at-frame getter to compare against. diff:false or force:true writes
   * regardless; every target is reported so the caller can see what it addressed.
   */
  patch(spec) {
    const list = Array.isArray(spec) ? spec : [spec];
    const results = [];
    let index = null;
    const scene = () => { if (!index) index = this.__semanticIndex(); return index; };
    for (let i = 0; i < list.length; i++) {
      const entry = list[i] || {};
      const queries = [].concat(entry.semantics || [], entry.semantic != null ? [entry.semantic] : []);
      const resolved = [];
      for (let q = 0; q < queries.length; q++) {
        const hits = this.find(queries[q], scene());
        if (!hits.length) throw new Error("_mg.patch: no layer in the active comp matches " + queries[q]);
        for (let h = 0; h < hits.length; h++) if (resolved.indexOf(hits[h]) < 0) resolved.push(hits[h]);
      }
      let targets;
      if (entry.alias != null) {
        const handle = "@" + this.__aliasKey(entry.alias);
        const hits = this.find(handle, scene());
        if (!hits.length) throw new Error("_mg.patch: no layer matches alias " + handle);
        targets = hits;
      } else if (Array.isArray(entry.ids) && entry.ids.length) targets = entry.ids.slice();
      else if (entry.target != null) {
        const literal = String(entry.target);
        // "type#n" is a layer id, so it never needs a comp walk (the same
        // convention __patchTargets uses for explicit references).
        if (literal.indexOf("#") >= 0) targets = [literal];
        else {
          const hits = this.find(literal, scene());
          targets = hits.length ? hits : [literal];
        }
      } else targets = this.__patchTargets(entry);
      if (resolved.length) {
        const merged = targets.slice();
        for (let r = 0; r < resolved.length; r++) if (merged.indexOf(resolved[r]) < 0) merged.push(resolved[r]);
        targets = merged;
      }
      const frame = entry.frame == null ? null : Math.round(Number(entry.frame));
      const changes = [];
      const skipped = [];
      const compare = entry.force !== true && entry.diff !== false && frame == null;
      for (let t = 0; t < targets.length; t++) {
        const id = targets[t];
        const semanticId = index ? this.semantic(id, index) : null;
        const attrs = {};
        if (entry.attrs) {
          const keys = Object.keys(entry.attrs);
          for (let k = 0; k < keys.length; k++) attrs[keys[k]] = entry.attrs[keys[k]];
        }
        if (entry.delta) {
          const keys = Object.keys(entry.delta);
          for (let k = 0; k < keys.length; k++) {
            const current = Number(api.get(id, keys[k]));
            attrs[keys[k]] = (isFinite(current) ? current : 0) + Number(entry.delta[keys[k]] || 0);
          }
        }
        if (entry.multiply) {
          const keys = Object.keys(entry.multiply);
          for (let k = 0; k < keys.length; k++) {
            const factor = Number(entry.multiply[keys[k]]);
            if (!isFinite(factor)) throw new Error("_mg.patch: multiply requires a finite factor for " + keys[k]);
            const current = Number(api.get(id, keys[k]));
            const base = isFinite(current) ? current : 0;
            attrs[keys[k]] = (attrs[keys[k]] != null ? Number(attrs[keys[k]]) : base) * factor;
          }
        }
        const written = {};
        const keys = Object.keys(attrs);
        for (let k = 0; k < keys.length; k++) {
          const key = keys[k];
          if (compare && this.__sameValue(this.__readAttr(id, key), attrs[key])) {
            skipped.push({ id: id, semantic: semanticId, attr: key, value: attrs[key], reason: "unchanged" });
            continue;
          }
          written[key] = attrs[key];
        }
        if (Object.keys(written).length) {
          if (frame != null && isFinite(frame)) this.patchKeyframeSafe(id, written, frame);
          else this.set(id, written);
          changes.push({ id: id, semantic: semanticId, attrs: written, frame: frame });
        }
        if (entry.shiftKeyframes != null || entry.easing != null) {
          this.patchSelected({ ids: [id], shiftKeyframes: entry.shiftKeyframes, easing: entry.easing });
        }
      }
      const outcome = { patched: changes.length, changes: changes, skipped: skipped, targets: targets.slice() };
      if (queries.length) outcome.semantics = queries.slice();
      results.push(outcome);
    }
    return results.length === 1 ? results[0] : results;
  },

  /**
   * Build an editable vector layer from a VTracer SVG file (verified asset route)
   * or an inline path d (cavalry.Path + api.createEditable). Parent, position
   * and scale are applied to the created layer; the composition is untouched.
   *
   * spec = { path?, d?, name?, pos?: {x,y}, scale?,
   *          viewBox?, center?, scaleTo?, flipY?, report? }
   *
   * The inline route normalises the geometry through __svgParse before it reaches
   * Cavalry; the asset route hands the file to api.loadAsset, so the viewBox of an
   * imported SVG is whatever the asset's own reader does with it \u2014 scale and
   * position are still applied to the layer. report:true returns
   * { id, subpaths, commands, unsupported, bounds, ... } next to the layer id for
   * callers that need to check the artwork landed where they expected.
   */
  svg(parent, spec) {
    spec = spec || {};
    let id = null;
    let meta = null;
    if (spec.path) {
      const asset = api.loadAsset(String(spec.path), false);
      id = api.addAssetToComp(asset);
      meta = { route: "asset", normalized: false };
    } else if (spec.d != null) {
      if (typeof api.createEditable !== "function") {
        throw new Error("_mg.svg: this Cavalry build has no api.createEditable; pass spec.path so the verified SVG asset route can run");
      }
      const parsed = this.__svgParse(spec.d, spec);
      meta = parsed.meta;
      meta.route = "path";
      id = api.createEditable(parsed.path, spec.name || "Vector");
    } else {
      throw new Error("_mg.svg requires spec.path or spec.d");
    }
    if (spec.name) {
      try { api.rename(id, String(spec.name)); } catch (e) {}
    }
    if (parent != null && parent !== id) {
      try {
        if (String(parent) !== String(api.getActiveComp())) api.parent(id, parent);
      } catch (e) {}
    }
    if (spec.pos) this.set(id, { position: { x: Number(spec.pos.x) || 0, y: Number(spec.pos.y) || 0 } });
    if (spec.scale != null) this.set(id, { scale: Number(spec.scale) || 1 });
    if (spec.report) {
      const outcome = { id: id };
      const keys = Object.keys(meta);
      for (let k = 0; k < keys.length; k++) outcome[keys[k]] = meta[keys[k]];
      return outcome;
    }
    return id;
  },

  /** "minX minY w h" | {x,y,width,height} | [x,y,w,h] -> box or null. */
  __viewBox(value) {
    if (value == null || value === "") return null;
    if (typeof value === "string") {
      const parts = value.match(/-?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?/g) || [];
      if (parts.length < 4) return null;
      return { x: Number(parts[0]), y: Number(parts[1]), width: Number(parts[2]), height: Number(parts[3]) };
    }
    if (Array.isArray(value) && value.length >= 4) {
      return { x: Number(value[0]), y: Number(value[1]), width: Number(value[2]), height: Number(value[3]) };
    }
    if (typeof value === "object") {
      const box = {
        x: Number(value.x != null ? value.x : value.minX),
        y: Number(value.y != null ? value.y : value.minY),
        width: Number(value.width != null ? value.width : value.w),
        height: Number(value.height != null ? value.height : value.h)
      };
      if (!(isFinite(box.x) && isFinite(box.y) && isFinite(box.width) && isFinite(box.height))) return null;
      return box;
    }
    return null;
  },

  /**
   * Parse the SVG path subset VTracer and friends emit into a cavalry.Path, with
   * the normalisation vector art needs before it sits on a layer.
   *
   * opts = { viewBox?, center?, scaleTo?, flipY? }
   *
   *   viewBox  Cavalry anchors an editable at its own coordinate origin, so art
   *            from an SVG whose viewBox does not start at 0,0 would otherwise sit
   *            offset by that amount; the min corner is re-mapped to (0,0).
   *   center   anchors the control bounds on the layer origin instead, which is
   *            what a pivot-driven pop or rotation wants; it replaces the viewBox
   *            shift.
   *   scaleTo  fits the longest axis of the bounds to this many units.
   *   flipY    mirrors y, for SVG art (y grows down) landing in a comp whose y
   *            grows up. Opt-in, because which way is upright is the comp's call.
   *
   * Sub-paths are counted so compound shapes \u2014 counters, holes, multi-contour
   * logos \u2014 are visible to the caller, and commands this parser cannot express
   * (arcs, anything exotic) are reported under unsupported with their
   * parameters skipped whole, instead of leaking numbers into the next command as
   * stray line segments the way a silent drop used to.
   */
  __svgParse(d, opts) {
    opts = opts || {};
    if (typeof cavalry === "undefined" || typeof cavalry.Path !== "function") {
      throw new Error("_mg.svg: new cavalry.Path() is unavailable in this build; pass a .svg asset path instead");
    }
    const path = new cavalry.Path();
    if (typeof path.moveTo !== "function" || typeof path.lineTo !== "function") {
      throw new Error("_mg.svg: cavalry.Path has no moveTo/lineTo in this build; pass a .svg asset path instead");
    }
    const tokens = String(d).match(/[a-zA-Z]|-?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?/g) || [];
    let i = 0;
    let cmd = "M";
    let x = 0, y = 0, startX = 0, startY = 0;
    let lastCx = null, lastCy = null;
    let subpaths = 0;
    let skip = false;
    const ops = [];
    const unsupported = [];
    const limits = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const num = () => { const value = Number(tokens[i]); i += 1; return isFinite(value) ? value : 0; };
    const see = (px, py) => {
      if (px < limits.minX) limits.minX = px;
      if (px > limits.maxX) limits.maxX = px;
      if (py < limits.minY) limits.minY = py;
      if (py > limits.maxY) limits.maxY = py;
    };
    // Pass 1: resolve every command to absolute pen coordinates, so relative
    // runs, implicit repeats and reflected handles are all in one place before
    // any transform is applied.
    while (i < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[i])) {
        cmd = tokens[i];
        i++;
        skip = false;
        if (cmd === "Z" || cmd === "z") {
          ops.push({ c: "Z" });
          x = startX; y = startY;
          lastCx = null; lastCy = null;
          continue;
        }
        const probe = cmd.toUpperCase();
        if (probe !== "M" && probe !== "L" && probe !== "H" && probe !== "V"
          && probe !== "C" && probe !== "S" && probe !== "Q" && probe !== "T") {
          // Includes A/a (elliptical arcs) and anything else this build cannot
          // express: the command is reported and its numeric parameters skipped.
          unsupported.push(cmd);
          skip = true;
          continue;
        }
      }
      if (skip) { i++; continue; }
      const upper = cmd.toUpperCase();
      const rel = cmd !== upper;
      if (upper === "M" || upper === "L") {
        const nx = num(), ny = num();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        see(x, y);
        if (upper === "M") {
          subpaths += 1;
          startX = x; startY = y;
          ops.push({ c: "M", x: x, y: y });
          cmd = rel ? "l" : "L";
        } else ops.push({ c: "L", x: x, y: y });
        lastCx = null; lastCy = null;
      } else if (upper === "H") {
        const nx = num();
        x = rel ? x + nx : nx;
        see(x, y);
        ops.push({ c: "L", x: x, y: y });
        lastCx = null; lastCy = null;
      } else if (upper === "V") {
        const ny = num();
        y = rel ? y + ny : ny;
        see(x, y);
        ops.push({ c: "L", x: x, y: y });
        lastCx = null; lastCy = null;
      } else if (upper === "C" || upper === "S") {
        let x1, y1;
        if (upper === "S") {
          // Smooth cubic: the first handle mirrors the previous curve's second.
          x1 = lastCx == null ? x : 2 * x - lastCx;
          y1 = lastCy == null ? y : 2 * y - lastCy;
        } else {
          x1 = rel ? x + num() : num();
          y1 = rel ? y + num() : num();
        }
        const x2 = rel ? x + num() : num();
        const y2 = rel ? y + num() : num();
        const nx = rel ? x + num() : num();
        const ny = rel ? y + num() : num();
        ops.push({ c: "C", x1: x1, y1: y1, x2: x2, y2: y2, x: nx, y: ny });
        see(x1, y1); see(x2, y2); see(nx, ny);
        lastCx = x2; lastCy = y2;
        x = nx; y = ny;
      } else if (upper === "Q" || upper === "T") {
        let qx, qy;
        if (upper === "T") {
          qx = lastCx == null ? x : 2 * x - lastCx;
          qy = lastCy == null ? y : 2 * y - lastCy;
        } else {
          qx = rel ? x + num() : num();
          qy = rel ? y + num() : num();
        }
        const nx = rel ? x + num() : num();
        const ny = rel ? y + num() : num();
        ops.push({ c: "Q", qx: qx, qy: qy, x: nx, y: ny });
        see(qx, qy); see(nx, ny);
        lastCx = qx; lastCy = qy;
        x = nx; y = ny;
      } else {
        i++;
      }
    }
    const hasBounds = isFinite(limits.minX) && isFinite(limits.maxX);
    const box = this.__viewBox(opts.viewBox);
    let ox = box && isFinite(box.x) ? box.x : 0;
    let oy = box && isFinite(box.y) ? box.y : 0;
    if (opts.center && hasBounds) {
      ox = (limits.minX + limits.maxX) / 2;
      oy = (limits.minY + limits.maxY) / 2;
    }
    let scale = 1;
    if (opts.scaleTo != null && hasBounds) {
      const span = Math.max(limits.maxX - limits.minX, limits.maxY - limits.minY);
      if (span > 0 && Number(opts.scaleTo) > 0) scale = Number(opts.scaleTo) / span;
    }
    const flip = opts.flipY === true;
    const map = (px, py) => [(px - ox) * scale, (flip ? oy - py : py - oy) * scale];
    // Pass 2: hand the normalised geometry to Cavalry.
    for (let k = 0; k < ops.length; k++) {
      const op = ops[k];
      if (op.c === "Z") {
        if (typeof path.closePath === "function") path.closePath();
        else if (typeof path.close === "function") path.close();
      } else if (op.c === "M") {
        const p = map(op.x, op.y);
        path.moveTo(p[0], p[1]);
      } else if (op.c === "L") {
        const p = map(op.x, op.y);
        path.lineTo(p[0], p[1]);
      } else if (op.c === "C") {
        if (typeof path.curveTo !== "function") throw new Error("_mg.svg: cavalry.Path has no curveTo in this build");
        const a = map(op.x1, op.y1);
        const b = map(op.x2, op.y2);
        const p = map(op.x, op.y);
        path.curveTo(a[0], a[1], b[0], b[1], p[0], p[1]);
      } else if (op.c === "Q") {
        const a = map(op.qx, op.qy);
        const p = map(op.x, op.y);
        if (typeof path.quadTo === "function") path.quadTo(a[0], a[1], p[0], p[1]);
        else if (typeof path.curveTo === "function") path.curveTo(a[0], a[1], p[0], p[1], p[0], p[1]);
        else throw new Error("_mg.svg: cavalry.Path has no quadratic/curve support in this build");
      }
    }
    const bounds = hasBounds
      ? {
        x: (limits.minX - ox) * scale,
        y: (flip ? oy - limits.maxY : limits.minY - oy) * scale,
        width: (limits.maxX - limits.minX) * scale,
        height: (limits.maxY - limits.minY) * scale
      }
      : null;
    return {
      path: path,
      meta: {
        subpaths: subpaths,
        commands: ops.length,
        unsupported: unsupported,
        viewBox: box,
        center: opts.center === true,
        flipY: flip,
        scale: Math.round(scale * 1e6) / 1e6,
        bounds: bounds
      }
    };
  },

  /** Path only \u2014 kept so existing callers and presets see the previous shape. */
  __svgPath(d, opts) {
    return this.__svgParse(d, opts).path;
  },

  /** The currently applied theme, or null. */
  theme() {
    return _rb.theme();
  },

  ASTRYX_THEMES: {
    neutral: { bgSurface: "#0F1115", cardFill: "#181B20", textPrimary: "#F3F4F6", textMuted: "#9CA3AF", accentPrimary: "#3B82F6", strokeColor: "#262A32", cardCornerRadius: 12, layoutPadding: 24 },
    matcha: { bgSurface: "#0D1512", cardFill: "#14221C", textPrimary: "#ECFDF5", textMuted: "#86EFAC", accentPrimary: "#10B981", strokeColor: "#1F352B", cardCornerRadius: 14, layoutPadding: 24 },
    gothic: { bgSurface: "#09090B", cardFill: "#121216", textPrimary: "#FAFAFA", textMuted: "#A1A1AA", accentPrimary: "#8B5CF6", strokeColor: "#27272A", cardCornerRadius: 6, layoutPadding: 20 },
    butter: { bgSurface: "#18150E", cardFill: "#241F14", textPrimary: "#FEFCE8", textMuted: "#FDE047", accentPrimary: "#EAB308", strokeColor: "#362E1D", cardCornerRadius: 16, layoutPadding: 24 },
    stone: { bgSurface: "#141413", cardFill: "#1F1E1D", textPrimary: "#F5F5F4", textMuted: "#A8A29E", accentPrimary: "#EA580C", strokeColor: "#2E2C2A", cardCornerRadius: 8, layoutPadding: 24 },
    chocolate: { bgSurface: "#16110E", cardFill: "#231B16", textPrimary: "#FAF5F0", textMuted: "#D6C2B2", accentPrimary: "#D97706", strokeColor: "#362922", cardCornerRadius: 12, layoutPadding: 24 },
    y2k: { bgSurface: "#0A0D1A", cardFill: "#131930", textPrimary: "#E0F2FE", textMuted: "#7DD3FC", accentPrimary: "#EC4899", strokeColor: "#253159", cardCornerRadius: 20, layoutPadding: 28 }
  },

  applySceneTheme(themeName = "neutral") {
    const rawKey = typeof themeName === "string" ? themeName.trim().toLowerCase() : "neutral";
    const key = Object.prototype.hasOwnProperty.call(this.ASTRYX_THEMES, rawKey) ? rawKey : "neutral";
    const palette = this.ASTRYX_THEMES[key];
    const tokens = Object.assign({ themeName: key }, palette);
    try {
      Object.assign(this.theme, tokens);
    } catch (e) {}
    try {
      globalThis.__mgAstryxTheme = tokens;
    } catch (e) {}
    try {
      this.applyTheme({
        colors: {
          background: palette.bgSurface,
          surface: palette.cardFill,
          card: palette.cardFill,
          primary: palette.accentPrimary,
          accent: palette.accentPrimary,
          text: palette.textPrimary,
          muted: palette.textMuted,
          border: palette.strokeColor
        },
        radius: {
          md: palette.cardCornerRadius,
          scale: palette.cardCornerRadius / 12
        },
        apply: false
      });
      if (globalThis.__mgTheme && typeof globalThis.__mgTheme === "object") {
        Object.assign(globalThis.__mgTheme, tokens);
      }
    } catch (e) {}
    try {
      const comp = api.getActiveComp();
      if (comp) {
        _rb.set(comp, { backgroundColor: _rb.c(palette.bgSurface) });
      }
    } catch (e) {}
    return tokens;
  },

  /**
   * Bind a palette / typography / radius theme to the scene and every preset.
   *
   * tokens = {
   *   colors: { primary, secondary, accent, text, muted, background, ... },
   *   typography: { font, style, scale },
   *   radius: { scale, sm, md, lg, pill },
   *   palette?: false, apply?: false, target?: "selection"|"preset"|"comp"|ids,
   *   ids?: string[], recolor?: false, registerOnly?: true
   * }
   *
   * Forward binding is automatic: _rb.c maps the catalogue's design colours
   * through the theme, so every preset compiled after this call picks it up.
   * Passing targets (or calling with a selection / tracked preset) also retints
   * existing layers in place, with no rebuild. applyTheme(null) clears the theme.
   */
  applyTheme(tokens) {
    if (tokens === null || tokens === undefined) {
      let prev = null;
      try { prev = globalThis.__mgTheme || null; delete globalThis.__mgTheme; } catch (e) {}
      return { cleared: true, previous: prev };
    }
    if (typeof tokens !== "object") throw new Error("applyTheme: tokens must be an object");

    const prev = this.theme() || {};
    const prevColors = prev.colors || {};
    const colors = {};
    const prevKeys = Object.keys(prevColors);
    for (let i = 0; i < prevKeys.length; i++) colors[prevKeys[i]] = prevColors[prevKeys[i]];
    const provided = tokens.colors || tokens.paletteColors || {};
    const providedKeys = Object.keys(provided);
    for (let i = 0; i < providedKeys.length; i++) {
      if (provided[providedKeys[i]] != null) colors[providedKeys[i]] = provided[providedKeys[i]];
    }

    const typography = Object.assign({}, prev.typography || {}, tokens.typography || {});
    const radius = Object.assign({}, prev.radius || {}, tokens.radius || {});
    const prevTypeScale = prev.typography && Number(prev.typography.scale) > 0 ? Number(prev.typography.scale) : 1;
    const prevRadiusScale = prev.radius && Number(prev.radius.scale) > 0 ? Number(prev.radius.scale) : 1;
    const theme = {
      colors: colors,
      typography: typography,
      radius: radius,
      at: Date.now(),
      palette: prev.palette || null
    };

    // Register the palette so artists can pick the same swatches by hand.
    if (tokens.palette !== false && tokens.register !== false) {
      let paletteId = null;
      try { paletteId = api.getScenePalette(); } catch (e) {}
      if (paletteId) {
        const swatches = {};
        const roleKeys = Object.keys(colors);
        for (let i = 0; i < roleKeys.length; i++) {
          const role = roleKeys[i];
          const reuse = prev.palette && prev.palette.id === paletteId &&
            prev.palette.swatches && prev.palette.swatches[role] != null &&
            prevColors[role] === colors[role];
          if (reuse) {
            swatches[role] = prev.palette.swatches[role];
            continue;
          }
          try {
            swatches[role] = api.addSceneSwatch(_rb.rawColor(colors[role]), "theme/" + role);
          } catch (e) {}
        }
        theme.palette = { id: paletteId, swatches: swatches };
      }
    }
    try { globalThis.__mgTheme = theme; } catch (e) {}

    let targets = [];
    if (Array.isArray(tokens.ids) && tokens.ids.length) {
      targets = tokens.ids.slice();
    } else if (tokens.target === "comp") {
      try { targets = api.getCompLayers(true) || []; } catch (e) { targets = []; }
    } else if (typeof tokens.target === "string" && tokens.target.indexOf("#") >= 0) {
      targets = [tokens.target];
    } else {
      try { targets = this.__patchTargets({ target: tokens.target || "auto" }); } catch (e) { targets = []; }
    }

    const all = [];
    const seen = {};
    const walk = (id, depth) => {
      if (!id || seen[id] || depth > 8) return;
      seen[id] = true;
      all.push(id);
      let kids = null;
      try { kids = api.getChildren(id); } catch (e) { kids = null; }
      if (kids && kids.length) {
        for (let i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
      }
    };
    for (let i = 0; i < targets.length; i++) walk(targets[i], 0);

    const shouldApply = tokens.apply !== false && tokens.registerOnly !== true;
    let recolored = 0;
    let fonts = 0;
    let radii = 0;

    if (shouldApply) {
      const recolor = tokens.recolor !== false;
      const nextTypeScale = Number(typography.scale) > 0 ? Number(typography.scale) : 1;
      const fontRatio = prevTypeScale > 0 ? nextTypeScale / prevTypeScale : 1;
      const nextRadiusScale = Number(radius.scale) > 0 ? Number(radius.scale) : 1;
      const radiusRatio = prevRadiusScale > 0 ? nextRadiusScale / prevRadiusScale : 1;

      for (let i = 0; i < all.length; i++) {
        const id = all[i];
        let type = "";
        try { type = api.getLayerType(id) || ""; } catch (e) {}

        if (recolor) {
          let colorAttr = null;
          if (type === "basicShape" || type === "textShape") colorAttr = "material.materialColor";
          else if (type === "strokeMaterial") colorAttr = "strokeColor";
          else if (type === "glowFilter") colorAttr = "glowColor";
          if (colorAttr) {
            let current = null;
            try { current = api.get(id, colorAttr); } catch (e) { current = null; }
            if (current != null) {
              const mapped = _rb.themeColor(current);
              if (_rb.hex(mapped) !== _rb.hex(current)) {
                try {
                  _rb.set(id, _rb.one(colorAttr, mapped));
                  recolored += 1;
                } catch (e) {}
              }
            }
          }
        }

        if (type === "textShape") {
          if (typography.font) {
            try {
              _rb.set(id, { font: { font: typography.font, style: typography.style || "Regular" } });
              fonts += 1;
            } catch (e) {}
          }
          if (fontRatio !== 1) {
            try {
              const size = Number(api.get(id, "fontSize")) || 0;
              if (size) {
                _rb.set(id, { fontSize: size * fontRatio });
                fonts += 1;
              }
            } catch (e) {}
          }
        }

        if (type === "basicShape" && radiusRatio !== 1) {
          try {
            const r = Number(api.get(id, "generator.cornerRadius")) || 0;
            if (r) {
              _rb.set(id, { "generator.cornerRadius": r * radiusRatio });
              radii += 1;
            }
          } catch (e) {}
        }
      }
    }

    return {
      theme: { colors: colors, typography: typography, radius: radius },
      palette: theme.palette,
      targets: targets,
      recolored: recolored,
      fonts: fonts,
      radii: radii,
      applied: shouldApply
    };
  },

  /**
   * Attach a behaviour to an attribute without rebuilding the layer.
   *
   *   _mg.modulate(layerId, "position.y", "organicFloat")
   *   _mg.modulate(layerId, ["rotation", "opacity"], { type: "organicFloat", amplitude: 12 })
   *   _mg.modulate(layerId, "scale.x", { type: "spring", amplitude: 0.2, duration: 40 })
   *   _mg.modulate(duplicatorId, "shapeTimeOffset", { type: "staggerFalloff", offset: 3 })
   *
   * organicFloat creates a noise node (or oscillator when type is oscillator);
   * spring has no native node in Cavalry 2.8, so it bakes a damped cosine into
   * keyframes; staggerFalloff wires a falloff into a stagger on the target.
   *
   * Every branch is idempotent: a node of the requested type already driving that
   * attribute is retuned in place and reported under reused, and the wire is
   * skipped when it is already connected. Pass force to build a second node.
   * stiffness / dampingRatio / overshoot / holdFrames are taken through _mg.rig.
   */
  modulate(layerId, attrPath, config) {
    config = config == null ? {} : config;
    if (typeof config === "string") config = { type: config };
    if (typeof config !== "object") throw new Error("modulate: config must be an object or a preset name");
    const type = config.type || config.behavior || config.preset || "organicFloat";
    const num = (value, fallback) => {
      const n = Number(value);
      return isFinite(n) ? n : fallback;
    };

    let target = layerId;
    if (target && typeof target === "object") target = target.id || target.layerId;
    if (target == null || target === "" || target === "selection" || target === "auto" || target === "preset") {
      let sel = [];
      try { const current = api.getSelection(); if (current) for (let i = 0; i < current.length; i++) sel.push(current[i]); } catch (e) {}
      const roots = this.presetRoots();
      target = sel.length ? sel[0] : (roots && roots.ids && roots.ids.length ? roots.ids[0] : null);
    }
    if (!target) throw new Error("modulate: no target layer (pass a layer id or select one)");

    const expandAttr = (value) => {
      if (value == null || value === "") return [];
      if (Array.isArray(value)) {
        const out = [];
        for (let i = 0; i < value.length; i++) {
          const parts = expandAttr(value[i]);
          for (let p = 0; p < parts.length; p++) if (out.indexOf(parts[p]) < 0) out.push(parts[p]);
        }
        return out;
      }
      const name = String(value);
      if (name === "position") return ["position.x", "position.y"];
      if (name === "scale") return ["scale.x", "scale.y"];
      return [name];
    };
    const attrList = expandAttr(config.attr != null ? config.attr : attrPath);

    if (type === "spring") {
      if (!attrList.length) throw new Error("modulate: attrPath is required");
      if (attrList.length !== 1) throw new Error("modulate: spring needs one scalar attribute");
      const attr = attrList[0];
      /*
       * The equilibrium the spring settles on. api.get answers at the playhead,
       * so a derived rest is whatever an earlier write left under it \u2014 after a
       * sampled rig has been keyed once, re-reading the layer feeds the curve's
       * own value back in as its rest. That is the documented default (it keeps
       * every existing call site producing what it produced before), but a rig
       * that has to be reproducible across runs pins it with { rest: n }.
       */
      let rest = 0;
      let restSource = "layer";
      const restSpec = config.rest != null ? config.rest : config.settleTo;
      if (restSpec != null) {
        rest = Number(restSpec);
        restSource = "spec";
      } else {
        try { rest = Number(api.get(target, attr)); } catch (e) { rest = 0; }
      }
      if (!isFinite(rest)) rest = 0;
      const duration = Math.max(6, Math.round(config.duration == null ? 45 : Number(config.duration)));
      // stiffness / dampingRatio / overshoot are the rig vocabulary (see _mg.rig);
      // they are expressed through the same damped cosine, converted to the
      // normalised window this sampler integrates over. Bare damping / frequency
      // keep their native sampler meaning, so existing call sites are unchanged.
      const rigSpec = config.stiffness != null || config.dampingRatio != null || config.overshoot != null
        ? this.rig(config) : null;
      const hold = Math.max(0, Math.round(Number(config.holdFrames == null ? 0 : config.holdFrames)));
      const startFrame = Math.round(config.startFrame == null ? 0 : Number(config.startFrame)) + (rigSpec ? rigSpec.holdFrames : hold);
      const unit = /scale/i.test(attr);
      const fallbackAmplitude = unit ? 0.15 : (/opacity/i.test(attr) ? 20 : 40);
      const amplitude = Number(config.amplitude != null ? config.amplitude : (config.distance != null ? config.distance : fallbackAmplitude));
      let damping = config.damping == null ? 6 : Number(config.damping);
      let frequency = config.frequency == null ? 2.25 : Number(config.frequency);
      if (rigSpec) {
        damping = rigSpec.dampingRatio * rigSpec.angularFrequency * duration;
        frequency = rigSpec.cyclesPerFrame * duration;
      }
      let samples = Math.max(4, Math.min(24, Math.round(duration / 2)));
      if (samples > duration) samples = duration;
      // Nyquist: a sampled cosine needs at least two points per cycle. Cavalry
      // has no native spring node, so a rig stiffer than the sample budget can
      // hold is reported rather than silently turned into noise.
      const aliased = frequency * 2 > samples;
      const points = [];
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const decay = Math.exp(-damping * t);
        const value = rest + amplitude * decay * Math.cos(Math.PI * 2 * frequency * t);
        points.push([startFrame + Math.round(t * duration), Math.round(value * 1000) / 1000]);
      }
      points[samples][1] = rest;
      const times = points.map(function (p) { return p[0]; });
      /*
       * Two runs of the same rig always land on the same frame times, so the
       * window alone cannot prove the curve is unchanged: retuning stiffness
       * keeps the sample grid and replaces the values. Remember the exact spec
       * that produced the keys (same globalThis pattern __rememberPreset uses)
       * and skip only when both the spec and the window still match. Without a
       * remembered spec the safe move is to rewrite \u2014 keying frames that already
       * exist updates their values instead of duplicating keys.
       */
      const rigKey = String(target) + "|" + attr;
      const signature = [duration, samples, startFrame, rest, amplitude, damping, frequency].join("|");
      let cache = null;
      try {
        if (!globalThis.__mgSpringRigs) globalThis.__mgSpringRigs = {};
        cache = globalThis.__mgSpringRigs;
      } catch (e) { cache = null; }
      let already = null;
      try { already = (api.getKeyframeTimes(target, attr) || []).slice().sort(function (a, b) { return a - b; }); } catch (e) { already = null; }
      const sameWindow = !!already && already.length === times.length
        && times.every(function (frame, index) { return already[index] === frame; });
      if (!config.force && sameWindow && cache && cache[rigKey] === signature) {
        return {
          type: "spring",
          target: target,
          attrs: [attr],
          node: null,
          keyframes: points.length,
          duration: duration,
          rest: rest,
          restSource: restSource,
          amplitude: amplitude,
          cycles: Math.round(frequency * 100) / 100,
          aliased: aliased,
          skipped: "already-sampled",
          eased: "unchanged \u2014 the same sampled rig is already keyed on this attribute"
        };
      }
      _rb.kf(target, attr, points, "None");
      if (cache) cache[rigKey] = signature;
      return {
        type: "spring",
        target: target,
        attrs: [attr],
        node: null,
        keyframes: points.length,
        duration: duration,
        rest: rest,
        restSource: restSource,
        amplitude: amplitude,
        cycles: Math.round(frequency * 100) / 100,
        stiffness: rigSpec ? rigSpec.stiffness : null,
        dampingRatio: rigSpec ? rigSpec.dampingRatio : null,
        overshoot: rigSpec ? rigSpec.overshoot : null,
        aliased: aliased,
        retuned: sameWindow,
        eased: "sampled damped cosine (no native spring node in Cavalry 2.8)",
        applied: points.length
      };
    }

    if (type === "staggerFalloff") {
      if (!attrList.length) throw new Error("modulate: attrPath is required for staggerFalloff");
      const attr = attrList[0];
      const staggerCfg = config.stagger || {};
      const falloffCfg = config.falloff || {};
      const name = config.name || "Falloff";
      const offset = Number(config.offset != null ? config.offset : (staggerCfg.offset != null ? staggerCfg.offset : 4));
      const falloffAttrs = {
        size: falloffCfg.size || config.size || [800, 800],
        strength: falloffCfg.strength != null ? num(falloffCfg.strength, 100) : (config.falloffStrength != null ? num(config.falloffStrength, 100) : 100),
        shapeType: falloffCfg.shapeType != null ? falloffCfg.shapeType : (config.shapeType != null ? config.shapeType : 0),
        pathMode: falloffCfg.pathMode != null ? falloffCfg.pathMode : 0
      };
      if (falloffCfg.angles != null) falloffAttrs.angles = falloffCfg.angles;
      if (falloffCfg.repetitions != null) falloffAttrs.repetitions = falloffCfg.repetitions;
      if (falloffCfg.seed != null) falloffAttrs.seed = falloffCfg.seed;
      if (config.seed != null) falloffAttrs.seed = config.seed;
      const staggerAttrs = { offset: offset };
      if (staggerCfg.strength != null) staggerAttrs.strength = staggerCfg.strength;
      if (staggerCfg.minimum != null) staggerAttrs.minimum = staggerCfg.minimum;
      if (staggerCfg.maximum != null) staggerAttrs.maximum = staggerCfg.maximum;
      // Re-running the rig retunes the nodes that already drive the attribute
      // instead of stacking a second stagger/falloff pair on top of them.
      const reuse = !config.force;
      let stagger = reuse ? this.__findModifier(target, attr, "stagger") : null;
      const reused = { stagger: !!stagger, falloff: false };
      if (stagger) { try { _rb.set(stagger, staggerAttrs); } catch (e) {} }
      else stagger = _rb.layer("stagger", name + " Stagger", staggerAttrs);
      const own = String(this.__inConnections(stagger, "falloffs")[0] || "").split(".")[0];
      let falloff = reuse && own && this.__layerType(own) === "falloff" ? own : null;
      if (falloff) { reused.falloff = true; try { _rb.set(falloff, falloffAttrs); } catch (e) {} }
      else falloff = _rb.layer("falloff", name + " Falloff", falloffAttrs);
      _mg.wire(stagger, "id", target, attr);
      _mg.wire(falloff, "id", stagger, "falloffs");
      return {
        type: "staggerFalloff",
        target: target,
        attrs: [attr],
        falloff: falloff,
        stagger: stagger,
        offset: offset,
        reused: reused,
        created: (reused.stagger ? 0 : 1) + (reused.falloff ? 0 : 1),
        applied: 2
      };
    }

    if (type !== "organicFloat" && type !== "noise" && type !== "oscillator") {
      throw new Error("modulate: unknown type " + type);
    }
    if (!attrList.length) throw new Error("modulate: attrPath is required");

    const name = config.name || (type === "oscillator" ? "Oscillator" : "Float");
    const frequency = config.frequency == null ? 0.35 : Number(config.frequency);
    const timeScale = config.timeScale == null ? 1 : Number(config.timeScale);
    const nodes = [];
    let amplitudeUsed = 0;

    const reusedNodes = [];
    for (let i = 0; i < attrList.length; i++) {
      const attr = attrList[i];
      const unit = /scale|opacity/i.test(attr);
      const fallback = unit ? (/opacity/i.test(attr) ? 18 : 0.12) : 30;
      const amplitude = Number(config.amplitude != null ? config.amplitude : (config.strength != null ? config.strength : fallback));
      amplitudeUsed = amplitude;
      const nodeType = type === "oscillator" ? "oscillator" : "noise";
      let attrs;
      if (nodeType === "oscillator") {
        attrs = { strength: amplitude, frequency: frequency, timeScale: timeScale };
        if (config.trigType != null) attrs.trigType = config.trigType;
        if (config.waveType != null) attrs.waveType = config.waveType;
        if (config.offset != null) attrs.offset = config.offset;
        if (config.stagger != null) attrs.stagger = config.stagger;
      } else {
        attrs = {
          strength: amplitude,
          "generator.frequency": frequency,
          "generator.timeScale": timeScale,
          "generator.seed": (config.seed == null ? 7 : Number(config.seed)) + i
        };
        if (config.gain != null) attrs["generator.gain"] = config.gain;
        if (config.octaves != null) attrs["generator.octaves"] = config.octaves;
        if (config.lacunarity != null) attrs["generator.lacunarity"] = config.lacunarity;
        if (config.offset != null) attrs["generator.offset"] = config.offset;
        if (config.strengthToZero != null) attrs.strengthToZero = config.strengthToZero;
        if (config.useNormals != null) attrs.useNormals = config.useNormals;
      }
      // An oscillator or noise node already wired to this attribute is retuned in
      // place; only force builds a second one. Re-running a modulation must never
      // stack nodes \u2014 the visible result is the sum of every input.
      let node = config.force ? null : this.__findModifier(target, attr, nodeType);
      if (node) {
        try { _rb.set(node, attrs); reusedNodes.push(node); } catch (e) { node = null; }
      }
      if (!node) node = _rb.layer(nodeType, name + " " + attr, attrs);
      _mg.wire(node, "id", target, attr);
      nodes.push(node);
    }

    return {
      type: type,
      target: target,
      attrs: attrList,
      nodes: nodes,
      amplitude: amplitudeUsed,
      frequency: frequency,
      reused: reusedNodes,
      created: nodes.length - reusedNodes.length,
      applied: nodes.length
    };
  },

  /**
   * Native Connect Shape connector between two layers. Two mesh distributions
   * read the layers' pivots (the documented Source/Target input), so the wire
   * follows both layers when they are moved or animated.
   *
   * styleSpec = { color?, width?, dash?, curve?, targetMode?, count?,
   *               maxConnections?, distance?, name? }
   */
  connectDynamic(sourceId, targetId, styleSpec) {
    styleSpec = styleSpec || {};
    let source = sourceId;
    let target = targetId;
    if (source && typeof source === "object") source = source.id || source.layerId;
    if (target && typeof target === "object") target = target.id || target.layerId;
    if (!source || !target) throw new Error("connectDynamic: sourceId and targetId are required");

    const name = styleSpec.name || "Dynamic Connector";
    const makeMesh = (layerId, tag) => {
      const mesh = _rb.layer("meshDistribution", name + " " + tag, {
        count: Math.max(1, Math.round(Number(styleSpec.count == null ? 1 : styleSpec.count))),
        fill: styleSpec.fill !== false,
        scaleToFit: styleSpec.scaleToFit !== false,
        ignoreEmptySubMeshes: true
      });
      api.connect(layerId, "id", mesh, "inputShape");
      return mesh;
    };
    const sourceMesh = makeMesh(source, "Source");
    const targetMesh = makeMesh(target, "Target");

    const curve = styleSpec.curve === true || styleSpec.lineType === "bezier" || Number(styleSpec.lineType) === 2;
    let targetMode = 1;
    const mode = styleSpec.targetMode;
    if (mode === 0 || mode === "within" || mode === "range" || mode === "withinRange") targetMode = 0;
    else if (mode === 2 || mode === "index" || mode === "pointIndex") targetMode = 2;
    const connector = _rb.layer("connectShape", name, {
      lineType: curve ? 2 : 0,
      targetMode: targetMode,
      maxConnections: Math.max(1, Math.round(Number(styleSpec.maxConnections == null ? 1 : styleSpec.maxConnections))),
      maxPerPointConnections: Math.max(1, Math.round(Number(styleSpec.maxPerPointConnections == null ? 1 : styleSpec.maxPerPointConnections))),
      distance: Number(styleSpec.distance == null ? 100000 : styleSpec.distance),
      sortByDistance: true,
      ignoreTarget: false,
      autoBezierMode: 1,
      controlPointLengthBias: { x: 0.5, y: 0.5 }
    });
    api.connect(sourceMesh, "id", connector, "sourceGenerator");
    api.connect(targetMesh, "id", connector, "targetGenerator");
    _rb.stroke(connector, styleSpec.color || "@border", styleSpec.width == null ? 3 : Number(styleSpec.width), {
      capStyle: 1,
      dash: styleSpec.dash
    });

    const centre = (id) => {
      try {
        const bb = api.getBoundingBox(id, false);
        if (bb && bb.centre) return { x: Number(bb.centre.x) || 0, y: Number(bb.centre.y) || 0 };
      } catch (e) {}
      return { x: 0, y: 0 };
    };
    const a = centre(source);
    const b = centre(target);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      connector: connector,
      source: source,
      target: target,
      sourceMesh: sourceMesh,
      targetMesh: targetMesh,
      anchors: {
        source: a,
        target: b,
        length: Math.sqrt(dx * dx + dy * dy),
        angle: Math.atan2(dy, dx) * 180 / Math.PI
      },
      follows: true
    };
  },

  /**
   * Scene-memory registry of the roots each preset created. globalThis is the
   * only cross-execution store Cavalry 2.8 exposes (there is no api.readFile).
   */
  __rememberPreset(presetId, tracked) {
    try {
      const ids = [];
      const byKey = {};
      const keys = Object.keys(tracked || {});
      for (let i = 0; i < keys.length; i++) {
        const id = tracked[keys[i]];
        if (typeof id !== "string" || !id) continue;
        byKey[keys[i]] = id;
        if (ids.indexOf(id) < 0) ids.push(id);
      }
      globalThis.__mgPresetRoots = {
        preset: presetId,
        ids: ids,
        byKey: byKey,
        at: Date.now()
      };
    } catch (e) {}
    return tracked;
  },

  /**
   * Slug rule shared with Stallion's /state readback (Introspect.ts __slug):
   * non-alphanumerics collapse to "_", trimmed, lowercased, capped at 48 chars.
   * Both sides must agree, or a semantic id captured over HTTP cannot be
   * addressed inside a script.
   */
  __slug(text) {
    return String(text == null ? "" : text)
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase()
      .slice(0, 48);
  },

  __niceName(id) {
    if (id == null || id === "") return "";
    try { return String(api.getNiceName(id) || ""); } catch (e) { return ""; }
  },

  /**
   * Scene-derived index for one call: every comp layer in api.getCompLayers(false)
   * order, keyed by layer id, semantic id and slug. Rebuilt per call on purpose \u2014
   * caching it would go stale the moment a preset creates a layer, and the walk is
   * one read per layer rather than one per attribute.
   */
  __semanticIndex() {
    const index = { order: [], byId: {}, bySemantic: {}, bySlug: {} };
    let ids = [];
    try { ids = api.getCompLayers(false) || []; } catch (e) { ids = []; }
    for (let i = 0; i < ids.length; i++) {
      const id = String(ids[i]);
      const type = this.__layerType(id);
      const name = this.__niceName(id);
      const slug = this.__slug(name || type);
      const semantic = (slug || "layer") + "_" + i;
      const row = { id: id, index: i, name: name, type: type, slug: slug, semanticId: semantic };
      index.order.push(id);
      index.byId[id] = row;
      index.bySemantic[semantic] = id;
      if (!index.bySlug[slug]) index.bySlug[slug] = [];
      index.bySlug[slug].push(id);
    }
    return index;
  },

  /**
   * Deterministic semantic id for a layer \u2014 slug of its nice name plus its index
   * in the comp, e.g. beat_02_card_spring_3. Same scheme as the Stallion readback,
   * so the id a diff pass reads out of /state is the id a refinement patch writes
   * back to, without carrying opaque bridge ids between runs.
   */
  semantic(id, index) {
    const row = (index || this.__semanticIndex()).byId[String(id)];
    return row ? row.semanticId : null;
  },

  /** Every layer of the active comp as { id, semanticId, name, type }, in comp order. */
  semantics(limit) {
    const index = this.__semanticIndex();
    const cap = limit == null ? index.order.length : Math.max(0, Math.round(Number(limit)));
    const out = [];
    for (let i = 0; i < index.order.length && i < cap; i++) {
      const row = index.byId[index.order[i]];
      out.push({ id: row.id, semanticId: row.semanticId, name: row.name, type: row.type });
    }
    return out;
  },

  /**
   * Resolve a live layer id, an exact semantic id, an "@alias" handle, or a bare
   * slug (all layers that share it) to layer ids. Returns [] when nothing
   * matches so the caller decides whether that is an error. An alias handle is
   * resolved through the globalThis registry first and falls back to the first
   * comp-order layer whose slug matches when the alias was never registered.
   */
  find(query, index) {
    const target = index || this.__semanticIndex();
    const text = String(query == null ? "" : query).trim();
    if (!text) return [];
    if (text.charAt(0) === "@") {
      const key = this.__aliasKey(text);
      if (!key) return [];
      const registered = this.__aliasMap()[key];
      if (registered != null && target.byId[String(registered)]) return [String(registered)];
      const named = target.bySlug[key];
      return named && named.length ? [named[0]] : [];
    }
    if (target.byId[text]) return [text];
    if (target.bySemantic[text]) return [target.bySemantic[text]];
    const hits = target.bySlug[text] || target.bySlug[this.__slug(text)];
    return hits ? hits.slice() : [];
  },

  __readAttr(id, attr) {
    try { return api.get(id, attr); } catch (e) { return null; }
  },

  /**
   * Value equality good enough to prove a write is a no-op: numbers within a
   * relative 1e-6, exact strings and booleans, deep equality for arrays and
   * objects. A colour object and its hex spelling are deliberately *not* treated
   * as equal \u2014 anything the comparison cannot prove equal is written.
   */
  __sameValue(current, wanted) {
    if (current == null || wanted == null) return false;
    if (typeof wanted === "number") {
      const n = Number(current);
      if (!isFinite(n) || !isFinite(wanted)) return false;
      return Math.abs(n - wanted) <= 1e-6 * Math.max(1, Math.abs(wanted));
    }
    if (typeof wanted === "string") return (typeof current === "string" || typeof current === "number") && String(current) === wanted;
    if (typeof wanted === "boolean") return !!current === wanted;
    if (Array.isArray(wanted)) {
      if (!Array.isArray(current) || current.length !== wanted.length) return false;
      for (let i = 0; i < wanted.length; i++) if (!this.__sameValue(current[i], wanted[i])) return false;
      return true;
    }
    if (typeof wanted === "object") {
      if (typeof current !== "object" || Array.isArray(current)) return false;
      const keys = Object.keys(wanted);
      for (let i = 0; i < keys.length; i++) if (!this.__sameValue(current[keys[i]], wanted[keys[i]])) return false;
      return true;
    }
    return false;
  },

  presetRoots() {
    try {
      return globalThis.__mgPresetRoots || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Expand explicit ids, semantic ids, the live selection, or the last preset's
   * roots. semantic/semantics take precedence over the selection fallback so a
   * refinement pass can address the layer a diff was measured on rather than
   * whatever happens to be selected now.
   */
  __patchTargets(spec) {
    spec = spec || {};
    const queries = [].concat(spec.semantics || [], spec.semantic != null ? [spec.semantic] : []);
    if (queries.length) {
      const index = this.__semanticIndex();
      const hits = [];
      for (let q = 0; q < queries.length; q++) {
        const found = this.find(queries[q], index);
        if (!found.length) throw new Error("_mg: no layer in the active comp matches " + queries[q]);
        for (let f = 0; f < found.length; f++) if (hits.indexOf(found[f]) < 0) hits.push(found[f]);
      }
      return hits;
    }
    const tracked = this.presetRoots();
    let roots = [];
    if (Array.isArray(spec.ids) && spec.ids.length) {
      roots = spec.ids.slice();
    } else if (typeof spec.target === "string" && spec.target.indexOf("#") >= 0) {
      roots = [spec.target];
    } else if (spec.target === "preset") {
      roots = tracked && tracked.ids ? tracked.ids.slice() : [];
    } else {
      const sel = [];
      try {
        const current = api.getSelection();
        if (current) for (let i = 0; i < current.length; i++) sel.push(current[i]);
      } catch (e) {}
      roots = sel.length ? sel : (tracked && tracked.ids ? tracked.ids.slice() : []);
    }
    if (!roots.length) throw new Error("No layers selected and no preset roots tracked");
    return roots;
  },

  /**
   * Incrementally retune selected layers or the last preset's roots in place.
   * Never deletes or recreates nodes: colours/text/attrs are set directly,
   * keyframes are retimed with api.modifyKeyframe and easings with
   * api.magicEasing.
   *
   * spec = {
   *   target?: "selection" | "preset" | "<layerId>", ids?: string[],
   *   color?, fill?, stroke?, strokeColor?, glowColor?,
   *   text?: string | { "<id>"|"<niceName>"|"<trackedKey>": string },
   *   fontSize?, opacity?,
   *   duplicator?: { count?, size?, direction?, distribution? },
   *   attrs?: {...}, byType?: { textShape: {...}, duplicator: {...} },
   *   shiftKeyframes?: number | { frames, attrs? },
   *   easing?: string | { name, attrs?, frames? }
   * }
   */
  patchSelected(spec) {
    spec = spec || {};
    // Geometry deltas need a read-modify-write per layer; _mg.patch owns that
    // route and delegates styling back here.
    if (spec.delta) return this.patch(spec);
    const roots = this.__patchTargets(spec);
    const tracked = this.presetRoots() || { byKey: {} };
    const keyById = {};
    const byKey = tracked.byKey || {};
    const keyNames = Object.keys(byKey);
    for (let i = 0; i < keyNames.length; i++) keyById[byKey[keyNames[i]]] = keyNames[i];

    const all = [];
    const seen = {};
    const walk = (id, depth) => {
      if (!id || seen[id] || depth > 8) return;
      seen[id] = true;
      all.push(id);
      let kids = null;
      try { kids = api.getChildren(id); } catch (e) { kids = null; }
      if (kids && kids.length) {
        for (let i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
      }
    };
    for (let i = 0; i < roots.length; i++) walk(roots[i], 0);

    let changes = 0;
    const touched = {};
    const mark = (id) => { touched[id] = true; };
    const applySet = (id, attrs) => {
      try {
        _rb.set(id, attrs);
        changes += 1;
        mark(id);
        return true;
      } catch (e) {
        return false;
      }
    };
    const typeOf = (id) => {
      try { return api.getLayerType(id) || ""; } catch (e) { return ""; }
    };

    const fill = spec.fill != null ? spec.fill : spec.color;
    const strokeColor = spec.strokeColor != null ? spec.strokeColor : spec.stroke;
    const glowColor = spec.glowColor;

    for (let i = 0; i < all.length; i++) {
      const id = all[i];
      const type = typeOf(id);
      const isText = type === "textShape";

      if (fill != null && (type === "basicShape" || isText || spec.includeAll)) {
        applySet(id, { "material.materialColor": _rb.c(fill) });
      }
      if (strokeColor != null) applySet(id, { strokeColor: _rb.c(strokeColor) });
      if (glowColor != null) applySet(id, { glowColor: _rb.c(glowColor) });

      if (isText) {
        if (typeof spec.text === "string") {
          applySet(id, { text: spec.text });
        } else if (spec.text && typeof spec.text === "object") {
          const nice = (() => { try { return api.getNiceName(id); } catch (e) { return null; } })();
          const key = keyById[id];
          const next =
            spec.text[id] != null ? spec.text[id] :
            (nice != null && spec.text[nice] != null ? spec.text[nice] :
            (key != null && spec.text[key] != null ? spec.text[key] : null));
          if (next != null) applySet(id, { text: String(next) });
        }
        if (spec.fontSize != null) applySet(id, { fontSize: Number(spec.fontSize) });
      }

      if (spec.opacity != null) applySet(id, { opacity: Number(spec.opacity) });

      if (spec.duplicator && type === "duplicator") {
        const d = spec.duplicator;
        if (d.count != null) applySet(id, { "generator.count": d.count });
        if (d.size != null) applySet(id, { "generator.size": d.size });
        if (d.direction != null) applySet(id, { "generator.direction": d.direction });
        if (d.distribution) {
          try {
            api.setGenerator(id, "generator", d.distribution);
            changes += 1;
            mark(id);
          } catch (e) {}
        }
      }

      if (spec.byType && spec.byType[type]) applySet(id, spec.byType[type]);
      if (spec.attrs) applySet(id, spec.attrs);
    }

    const animatedAttrs = (id, cfg) => {
      if (cfg && Array.isArray(cfg.attrs) && cfg.attrs.length) return cfg.attrs;
      try { return api.getAnimatedAttributes(id) || []; } catch (e) { return []; }
    };

    if (spec.shiftKeyframes != null) {
      const cfg = typeof spec.shiftKeyframes === "number"
        ? { frames: spec.shiftKeyframes }
        : spec.shiftKeyframes;
      const offset = Number(cfg.frames) || 0;
      if (offset) {
        for (let i = 0; i < all.length; i++) {
          const id = all[i];
          const attrs = animatedAttrs(id, cfg);
          for (let a = 0; a < attrs.length; a++) {
            const attr = attrs[a];
            let times = [];
            try { times = api.getKeyframeTimes(id, attr) || []; } catch (e) { times = []; }
            times = times.slice().sort(offset > 0 ? (x, y) => y - x : (x, y) => x - y);
            for (let t = 0; t < times.length; t++) {
              const frame = Number(times[t]);
              try {
                const dict = {};
                dict[attr] = { frame: frame, newFrame: frame + offset };
                api.modifyKeyframe(id, dict);
                changes += 1;
                mark(id);
              } catch (e) {}
            }
          }
        }
      }
    }

    if (spec.easing != null) {
      const cfg = typeof spec.easing === "string" ? { name: spec.easing } : spec.easing;
      const ease = _rb.ease(cfg.name);
      for (let i = 0; i < all.length; i++) {
        const id = all[i];
        const attrs = animatedAttrs(id, cfg);
        for (let a = 0; a < attrs.length; a++) {
          const attr = attrs[a];
          let times = Array.isArray(cfg.frames) && cfg.frames.length ? cfg.frames.slice() : [];
          if (!times.length) {
            try { times = api.getKeyframeTimes(id, attr) || []; } catch (e) { times = []; }
          }
          for (let t = 0; t < times.length; t++) {
            try {
              api.magicEasing(id, attr, Number(times[t]), ease);
              changes += 1;
              mark(id);
            } catch (e) {}
          }
        }
      }
    }

    return {
      patched: Object.keys(touched).length,
      changes: changes,
      ids: all,
      preset: tracked.preset || null
    };
  },

  /**
   * Snap or pulse rigs onto audio-derived frame numbers. The frames array must
   * already be in comp frames (the CLI --audio-beats helper converts seconds at
   * the active comp's FPS).
   *
   * spec:
   *   function(frame, index)                 -> custom callback
   *   "pulse" | "flash" | "snap" | "stagger" -> built-in modes
   *   { type, ids?, target?, duration?, peak?, low?, attrs?, ease?, count?, offset? }
   */
  syncToFrames(frames, spec) {
    const list = [];
    for (let i = 0; i < (frames || []).length; i++) {
      const f = Math.round(Number(frames[i]));
      if (isFinite(f) && f >= 0 && list.indexOf(f) < 0) list.push(f);
    }
    list.sort((a, b) => a - b);
    if (!list.length) throw new Error("syncToFrames: no valid frames supplied");

    if (typeof spec === "function") {
      for (let i = 0; i < list.length; i++) spec(list[i], i);
      return { frames: list, mode: "callback", applied: list.length };
    }
    if (typeof spec === "string") spec = { type: spec };
    spec = spec || {};
    if (typeof spec.callback === "function") {
      for (let i = 0; i < list.length; i++) spec.callback(list[i], i);
      return { frames: list, mode: "callback", applied: list.length };
    }

    const mode = spec.type || spec.mode || "pulse";
    const targets = spec.ids && spec.ids.length
      ? spec.ids.slice()
      : (spec.target && String(spec.target).indexOf("#") >= 0
        ? [spec.target]
        : this.__patchTargets({ target: spec.target || "auto" }));
    const ease = spec.ease || "SlowOut";
    const duration = Math.max(2, Math.round(spec.duration == null ? 6 : Number(spec.duration)));
    let applied = 0;

    if (mode === "pulse" || mode === "flash" || mode === "bounce") {
      const opacity = mode === "flash";
      const attrs = spec.attrs && spec.attrs.length
        ? spec.attrs
        : (opacity ? ["opacity"] : ["scale.x", "scale.y"]);
      const peak = spec.peak == null ? (opacity ? 45 : 1.12) : Number(spec.peak);
      const rest = spec.rest == null ? (opacity ? 100 : 1) : Number(spec.rest);
      for (let t = 0; t < targets.length; t++) {
        const id = targets[t];
        for (let a = 0; a < attrs.length; a++) {
          const attr = attrs[a];
          for (let f = 0; f < list.length; f++) {
            const start = Math.max(0, list[f] - 1);
            _rb.kf(id, attr, [
              [start, rest],
              [list[f] + Math.round(duration / 2), peak],
              [list[f] + duration, rest]
            ], ease);
            applied += 1;
          }
        }
      }
      return { frames: list, mode: mode, targets: targets, applied: applied };
    }

    if (mode === "snap") {
      const cfgAttrs = spec.attrs && spec.attrs.length ? spec.attrs : null;
      for (let t = 0; t < targets.length; t++) {
        const id = targets[t];
        let attrs = cfgAttrs;
        if (!attrs) {
          try { attrs = api.getAnimatedAttributes(id) || []; } catch (e) { attrs = []; }
        }
        for (let a = 0; a < attrs.length; a++) {
          const attr = attrs[a];
          let times = [];
          try { times = api.getKeyframeTimes(id, attr) || []; } catch (e) { times = []; }
          for (let k = 0; k < times.length; k++) {
            const frame = Number(times[k]);
            let best = list[0];
            let bestDist = Math.abs(best - frame);
            for (let b = 1; b < list.length; b++) {
              const dist = Math.abs(list[b] - frame);
              if (dist < bestDist) { best = list[b]; bestDist = dist; }
            }
            if (best !== frame) {
              try {
                const dict = {};
                dict[attr] = { frame: frame, newFrame: best };
                api.modifyKeyframe(id, dict);
                applied += 1;
              } catch (e) {}
            }
          }
        }
      }
      return { frames: list, mode: "snap", targets: targets, applied: applied };
    }

    if (mode === "stagger") {
      let total = spec.count == null ? null : Number(spec.count);
      let offset = spec.offset == null ? 0 : Number(spec.offset);
      if (!offset && list.length > 1) offset = Math.round((list[list.length - 1] - list[0]) / (list.length - 1));
      for (let t = 0; t < targets.length; t++) {
        const id = targets[t];
        let type = "";
        try { type = api.getLayerType(id) || ""; } catch (e) {}
        if (type !== "duplicator") continue;
        const stagger = _rb.layer("stagger", "Beat Stagger", { offset: offset || 4 });
        try { api.connect(stagger, "id", id, "shapeTimeOffset"); } catch (e) {}
        applied += 1;
        let count = total;
        if (count == null) {
          try {
            const current = api.get(id, "generator.count");
            count = Array.isArray(current) ? Number(current[0]) * Number(current[1]) : Number(current);
          } catch (e) { count = 0; }
        }
        if (count > 0) {
          const step = count > list.length ? Math.floor(count / list.length) : 1;
          for (let f = 0; f < list.length; f++) {
            const value = count <= list.length ? f + 1 : Math.min(count, (f + 1) * step);
            _rb.kf(id, "generator.count", [[list[f], value]], "None");
            applied += 1;
          }
        }
      }
      return { frames: list, mode: "stagger", targets: targets, applied: applied };
    }

    throw new Error("syncToFrames: unknown mode " + mode);
  },

  /**
   * Write one keyframe, optionally with explicit weighted cubic B\xE9zier
   * handles. Plain writes are a bare api.keyframe at exactly 'frame'; handle
   * objects add api.modifyKeyframeTangent (per side) and api.modifyKeyframe
   * (interpolation type) on the same frame. Neighbouring keyframes are never
   * touched \u2014 tangent safety comes from writing only at 'frame'.
   */
  __kfWrite(id, attr, frame, value, handles) {
    const dict = {};
    dict[attr] = value;
    api.keyframe(id, frame, dict);
    if (!handles) return { frame: frame, tangents: false };
    const tangents = [];
    const wantsIn = handles.inWeight != null || handles.inAngle != null;
    const wantsOut = handles.outWeight != null || handles.outAngle != null;
    if (wantsIn) {
      const spec = { frame: frame, inHandle: true, outHandle: false, angleLocked: false, weightLocked: false };
      if (handles.inAngle != null) spec.angle = Number(handles.inAngle);
      if (handles.inWeight != null) spec.weight = Number(handles.inWeight);
      const t = {}; t[attr] = spec;
      try { api.modifyKeyframeTangent(id, t); tangents.push("in"); } catch (e) {}
    }
    if (wantsOut) {
      const spec = { frame: frame, inHandle: false, outHandle: true, angleLocked: false, weightLocked: false };
      if (handles.outAngle != null) spec.angle = Number(handles.outAngle);
      if (handles.outWeight != null) spec.weight = Number(handles.outWeight);
      const t = {}; t[attr] = spec;
      try { api.modifyKeyframeTangent(id, t); tangents.push("out"); } catch (e) {}
    }
    if (handles.interpolation != null) {
      const m = {}; m[attr] = { frame: frame, type: Math.round(Number(handles.interpolation)) };
      try { api.modifyKeyframe(id, m); } catch (e) {}
    }
    return { frame: frame, tangents: tangents };
  },

  /**
   * Snapshot everything readable about the keyframes of (id, attr) before a
   * patch touches it: the keyframe times, and \u2014 when this Cavalry build
   * exposes keyframe selection \u2014 the raw selected-keyframe state of each
   * keyframe id. The caller's keyframe selection is captured and restored.
   * Cavalry 2.8 has no per-keyframe tangent getter, so what cannot be read
   * cannot be restored; the guarantee is that the patch never writes at any
   * frame other than the target.
   */
  __kfGuardSnapshot(id, attr) {
    const guard = { id: id, attr: attr, times: [], selection: null, keyframes: null };
    try { guard.times = (api.getKeyframeTimes(id, attr) || []).slice().sort((a, b) => a - b); } catch (e) {}
    const canSelect = typeof api.setSelectedKeyframeIds === "function"
      && typeof api.getKeyframeIdsForAttribute === "function"
      && typeof api.getSelectedKeyframes === "function";
    if (!canSelect) return guard;
    try {
      if (typeof api.getSelectedKeyframeIds === "function") guard.selection = api.getSelectedKeyframeIds() || [];
    } catch (e) {}
    let kfIds = [];
    try { kfIds = api.getKeyframeIdsForAttribute(id, attr) || []; } catch (e) {}
    if (kfIds.length) {
      try {
        api.setSelectedKeyframeIds(kfIds);
        guard.keyframes = api.getSelectedKeyframes();
      } catch (e) {
        guard.keyframes = null;
      }
    }
    return guard;
  },

  /** Re-assert recorded keyframe state and restore the caller's selection. */
  __kfGuardRestore(guard) {
    if (!guard) return;
    try {
      if (guard.selection && typeof api.setSelectedKeyframeIds === "function") api.setSelectedKeyframeIds(guard.selection);
    } catch (e) {}
  },

  /**
   * Tangent-safe keyframe patch: writes value(s) at exactly 'frame' for every
   * attr in 'attrs', having snapshotted each attribute's keyframe state, and
   * restores the selection inside the same undo group. Neighbour tangents are
   * never rewritten by this path.
   */
  patchKeyframeSafe(id, attrs, frame) {
    const guards = {};
    const keys = Object.keys(attrs || {});
    const at = Math.round(Number(frame));
    for (let k = 0; k < keys.length; k++) guards[keys[k]] = this.__kfGuardSnapshot(id, keys[k]);
    try {
      for (let k = 0; k < keys.length; k++) {
        const guard = guards[keys[k]];
        // A correction pass always targets the same critical frames. Rewrite
        // the value of an existing key through modifyKeyframe so repeated
        // iterations never stack two keys at one frame or disturb tangents.
        if (guard && guard.times.indexOf(at) >= 0) {
          const dict = {};
          dict[keys[k]] = { frame: at, newValue: attrs[keys[k]] };
          try { api.modifyKeyframe(id, dict); continue; } catch (e) {}
        }
        this.__kfWrite(id, keys[k], at, attrs[keys[k]], null);
      }
    } finally {
      for (let k = 0; k < keys.length; k++) this.__kfGuardRestore(guards[keys[k]]);
    }
    return { id: id, frame: Math.round(Number(frame)), attrs: keys, guarded: Object.keys(guards).length };
  },

  /** Open one undo group for the whole operations body; nesting is collapsed. */
  undoGroup(spec) {
    spec = spec || {};
    if (typeof spec.operations !== "function") throw new Error("_mg.undoGroup requires an operations function");
    const outermost = !this.__undoDepth;
    this.__undoDepth = (this.__undoDepth || 0) + 1;
    const canUndo = outermost && typeof api.startUndoGroup === "function";
    if (canUndo) api.startUndoGroup(String(spec.name || spec.id || "refclone batch"));
    try {
      return spec.operations();
    } finally {
      this.__undoDepth -= 1;
      if (canUndo && typeof api.endUndoGroup === "function") api.endUndoGroup();
    }
  },

  /**
   * Declarative two-boundary keyframe macro emitted by refclone Stage 3/4.
   * spec = { element, property, startFrame, endFrame, startValue, endValue, easing? }
   * easing: "BounceOut" | { name } | { type: "cubic-bezier", y1, y2 }
   *   | { type: "weighted-bezier", inWeight, inAngle, outWeight, outAngle }
   * property aliases: x\u2192position.x, y\u2192position.y, scale_x\u2192scale.x,
   * scale_y\u2192scale.y; "position"/"scale" drive both axes with the same values.
   */
  keyframe(spec) {
    if (!spec || spec.element == null || spec.property == null) throw new Error("_mg.keyframe requires element and property");
    const startFrame = Math.round(Number(spec.startFrame));
    const endFrame = Math.round(Number(spec.endFrame));
    if (!isFinite(startFrame) || !isFinite(endFrame) || startFrame === endFrame) {
      throw new Error("_mg.keyframe requires distinct integer startFrame and endFrame");
    }
    const startValue = Number(spec.startValue);
    const endValue = Number(spec.endValue);
    if (!isFinite(startValue) || !isFinite(endValue)) throw new Error("_mg.keyframe requires finite startValue and endValue");
    const attrs = this.__propertyAttrs(spec.property);
    const easing = spec.easing || {};
    let handles = null;
    let name = null;
    if (typeof easing === "string") name = easing;
    else if (easing.type === "weighted-bezier" || easing.inWeight != null || easing.outWeight != null) {
      handles = { inWeight: easing.inWeight, inAngle: easing.inAngle, outWeight: easing.outWeight, outAngle: easing.outAngle };
    } else if (easing.type === "cubic-bezier" || easing.y1 != null) {
      name = this.__nearestEase([0.25, Number(easing.y1) || 0, 0.75, Number(easing.y2) || 1]);
    } else if (easing.name) name = easing.name;
    const resolved = name ? this.__easeName(name) : null;
    for (let i = 0; i < attrs.length; i++) {
      if (handles) {
        this.__kfWrite(spec.element, attrs[i], startFrame, startValue, handles);
        this.__kfWrite(spec.element, attrs[i], endFrame, endValue, handles);
      } else {
        this.kf(spec.element, attrs[i], [[startFrame, startValue], [endFrame, endValue]], resolved || "None");
      }
    }
    return { element: spec.element, property: spec.property, attrs: attrs, easing: handles ? "weighted-bezier" : (resolved || "None"), startFrame: startFrame, endFrame: endFrame };
  },

  /**
   * Multi-point keyframe macro: { element, property, points: [{ frame, value,
   * handles? }...], easing? }. The easing applies to every outgoing segment
   * (Cavalry magic easing is per-keyframe-outgoing); explicit per-point
   * handles bypass it for that keyframe.
   */
  keyframes(spec) {
    if (!spec || spec.element == null || spec.property == null) throw new Error("_mg.keyframes requires element and property");
    const points = Array.isArray(spec.points) ? spec.points : [];
    if (points.length < 2) throw new Error("_mg.keyframes requires at least two points");
    const attrs = this.__propertyAttrs(spec.property);
    const easing = spec.easing || {};
    let name = typeof easing === "string" ? easing : (easing.name || (easing.type === "cubic-bezier" ? this.__nearestEase([0.25, Number(easing.y1) || 0, 0.75, Number(easing.y2) || 1]) : null));
    const resolved = name ? this.__easeName(name) : "None";
    const applied = [];
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      for (let p = 0; p < points.length; p++) {
        const point = points[p] || {};
        const frame = Math.round(Number(point.frame));
        if (!isFinite(frame)) throw new Error("_mg.keyframes points require integer frames");
        const handles = point.handles || null;
        this.__kfWrite(spec.element, attr, frame, point.value, handles);
        if (!handles && p < points.length - 1) {
          try { api.magicEasing(spec.element, attr, frame, resolved); } catch (e) {}
        }
        applied.push({ attr: attr, frame: frame });
      }
    }
    return { element: spec.element, property: spec.property, attrs: attrs, points: applied.length / attrs.length, easing: resolved };
  },

  /**
   * Behaviour macro emitted for damped-spring promotions: bakes the analytic
   * spring y(t) = target - exp(-z*w*t) * cos(wd*t) * (target - initial) into
   * per-frame keyframes with linear interpolation (a faithful piecewise
   * sampling of the continuous curve, no tangent guessing).
   * spec = { element, type: "spring", property, startFrame,
   *          parameters: { dampingRatio, naturalFrequency, initialValue, targetValue }, duration? }
   */
  behavior(spec) {
    if (!spec || spec.element == null || spec.property == null) throw new Error("_mg.behavior requires element and property");
    const type = String(spec.type || "spring").toLowerCase();
    const params = spec.parameters || {};
    if (type !== "spring") throw new Error("_mg.behavior supports type 'spring' (got " + type + ")");
    const zeta = Number(params.dampingRatio);
    const omega0 = Number(params.naturalFrequency);
    const initial = Number(params.initialValue);
    const target = Number(params.targetValue);
    if (!(zeta >= 0) || !(omega0 > 0)) throw new Error("_mg.behavior spring requires dampingRatio >= 0 and naturalFrequency > 0");
    if (!isFinite(initial) || !isFinite(target)) throw new Error("_mg.behavior spring requires finite initialValue and targetValue");
    const startFrame = Math.round(Number(spec.startFrame)) || 0;
    const duration = Math.round(Number(spec.duration)) || 0;
    let endFrame = startFrame + duration;
    if (!(duration > 0)) {
      try { endFrame = Math.round(Number(api.get(api.getActiveComp(), "endFrame")) || 0); } catch (e) { endFrame = 0; }
    }
    if (!(endFrame > startFrame)) endFrame = startFrame + 48;
    const attrs = this.__propertyAttrs(spec.property);
    const wd = omega0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
    const baked = [];
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const pts = [];
      for (let f = startFrame; f <= endFrame; f++) {
        const time = f - startFrame;
        const envelope = Math.exp(-zeta * omega0 * time);
        const value = target - envelope * Math.cos(wd * time) * (target - initial);
        pts.push([f, value]);
      }
      _rb.kf(spec.element, attr, pts, "None");
      baked.push({ attr: attr, keyframes: pts.length });
    }
    return { element: spec.element, type: "spring", property: spec.property, attrs: attrs, keyframes: baked };
  },

  /** Map refclone property aliases to concrete attribute paths. */
  __propertyAttrs(property) {
    const p = String(property);
    if (p === "x") return ["position.x"];
    if (p === "y") return ["position.y"];
    if (p === "scale_x") return ["scale.x"];
    if (p === "scale_y") return ["scale.y"];
    if (p === "position") return ["position.x", "position.y"];
    if (p === "scale") return ["scale.x", "scale.y"];
    return [p];
  },

  /**
   * Trim-path shorthand on a stroke/shape layer. 'start'/'end' are percentages
   * (trimStart/trimEnd), 'offset' shifts the trim window; 'travel' animates
   * trimEnd across the comp \u2014 a number means [0 \u2192 travel] over the comp range,
   * or pass { inFrame, outFrame, from, to, easing? } for explicit bounds.
   */
  trim(id, spec) {
    spec = spec || {};
    const attrs = {};
    if (spec.start != null) attrs.trimStart = Number(spec.start);
    if (spec.end != null) attrs.trimEnd = Number(spec.end);
    if (spec.offset != null) attrs.trimOffset = Number(spec.offset);
    if (Object.keys(attrs).length) this.set(id, attrs);
    let traveled = null;
    if (spec.travel != null) {
      const cfg = typeof spec.travel === "number" ? { inFrame: 0, from: 0, to: Number(spec.travel) } : spec.travel;
      let outFrame = cfg.outFrame;
      if (outFrame == null) {
        try { outFrame = Math.round(Number(api.get(api.getActiveComp(), "endFrame")) || 0); } catch (e) { outFrame = 0; }
      }
      const inFrame = Math.round(Number(cfg.inFrame)) || 0;
      const from = Number(cfg.from) || 0;
      const to = Number(cfg.to != null ? cfg.to : (spec.end != null ? spec.end : 100));
      _rb.kf(id, "trimEnd", [[inFrame, from], [Math.round(Number(outFrame)), to]], cfg.easing || spec.easing || "SlowOut");
      traveled = { attr: "trimEnd", from: from, to: to, inFrame: inFrame, outFrame: Math.round(Number(outFrame)) };
    }
    return { id: id, attrs: attrs, travel: traveled };
  },

  /**
   * Clipping-mask / track-matte binding. 'masks' is an array of
   * { id, mode: "alpha" | "invertedAlpha" | "luminance" }. The mask layer ids
   * are written to the target's 'masks' attribute and the matte mode is set
   * per entry. Failures are reported, never swallowed.
   */
  mask(targetId, masks) {
    const list = Array.isArray(masks) ? masks : [masks];
    const MODES = { alpha: 0, invertedAlpha: 1, luminance: 2 };
    const applied = [];
    const warnings = [];
    const ids = [];
    for (let i = 0; i < list.length; i++) {
      const entry = list[i] || {};
      const maskId = entry.id != null ? String(entry.id) : (entry.idPath != null ? String(entry.idPath) : null);
      if (!maskId) { warnings.push("mask entry missing id"); continue; }
      ids.push(maskId);
      const mode = entry.mode == null ? "alpha" : String(entry.mode);
      if (!(mode in MODES)) warnings.push("unknown matte mode '" + mode + "'");
      applied.push({ id: maskId, mode: mode });
    }
    if (ids.length) {
      try { this.set(targetId, { masks: ids }); } catch (e) { warnings.push("masks attribute rejected: " + e); }
      const first = applied[0] && applied[0].mode in MODES ? MODES[applied[0].mode] : null;
      if (first != null) {
        try { this.set(targetId, { matteMode: first }); } catch (e) { warnings.push("matteMode rejected: " + e); }
      }
    }
    if (warnings.length) {
      for (let w = 0; w < warnings.length; w++) console.warn("_mg.mask: " + warnings[w]);
    }
    return { target: targetId, applied: applied, warnings: warnings };
  },

  /** Skia-style blend mode on a layer or group (live attribute: blendMode). */
  blend(id, mode) {
    this.set(id, { blendMode: String(mode) });
    return { id: id, blendMode: String(mode) };
  },

  /**
   * Typography shorthand for textShape layers: fontSize, lineHeight (written
   * to the live lineSpacing attribute), letterSpacing and textBoxSize.
   */
  typography(id, spec) {
    spec = spec || {};
    const attrs = {};
    if (spec.fontSize != null) attrs.fontSize = Number(spec.fontSize);
    if (spec.lineHeight != null) attrs.lineSpacing = Number(spec.lineHeight);
    if (spec.letterSpacing != null) attrs.letterSpacing = Number(spec.letterSpacing);
    if (spec.textBoxSize != null) attrs.textBoxSize = spec.textBoxSize;
    if (Object.keys(attrs).length) this.set(id, attrs);
    return { id: id, attrs: attrs };
  },

  /**
   * SubMesh level targeting by name: "characters" | "words" | "lines" \u2192
   * levelMode 0 | 1 | 2 on the text's subMesh deformer (created when absent).
   */
  subMeshLevel(textId, level) {
    const LEVELS = { characters: 0, words: 1, lines: 2 };
    const numeric = typeof level === "number" ? level : LEVELS[String(level).toLowerCase()];
    if (!(numeric >= 0 && numeric <= 2)) throw new Error("_mg.subMeshLevel: level must be characters|words|lines (got " + level + ")");
    let subMeshId = null;
    try {
      const incoming = api.getInConnectedAttributes(textId) || [];
      for (let i = 0; i < incoming.length; i++) {
        if (String(incoming[i]).indexOf("deformers") !== 0) continue;
        // getInConnection returns a single "sourceId.attr" descriptor (or an
        // array of them on some builds) \u2014 normalise both shapes.
        const raw = api.getInConnection(textId, incoming[i]);
        const sources = Array.isArray(raw) ? raw : [raw];
        for (let s = 0; s < sources.length; s++) {
          const otherId = String(sources[s] || "").split(".")[0];
          if (otherId && api.getLayerType(otherId) === "subMesh") { subMeshId = otherId; break; }
        }
        if (subMeshId) break;
      }
    } catch (e) {}
    if (subMeshId) {
      this.set(subMeshId, { levelMode: numeric });
      return { subMeshId: subMeshId, levelMode: numeric, created: false };
    }
    const made = this.subMesh(textId, numeric);
    return { subMeshId: made.subMeshId, staggerId: made.staggerId, levelMode: numeric, created: true };
  },

  /**
   * Filter attachment: { motionBlur?, gaussianBlur?, dropShadow?, noise? }.
   * motionBlur is the layer attribute; the rest are filter nodes connected to
   * the target's "filters" attribute (live node names: gaussianBlurFilter,
   * dropShadowFilter, grainFilter).
   */
  filter(id, spec) {
    spec = spec || {};
    const applied = [];
    if (spec.motionBlur != null) {
      this.set(id, { motionBlur: !!spec.motionBlur });
      applied.push({ kind: "motionBlur", value: !!spec.motionBlur });
    }
    if (spec.gaussianBlur) {
      const cfg = typeof spec.gaussianBlur === "number" ? { blurRadius: spec.gaussianBlur } : spec.gaussianBlur;
      const filterId = this.layer("gaussianBlurFilter", "Gaussian Blur", { blurRadius: Number(cfg.blurRadius) || 4 });
      try { api.connect(filterId, "id", id, "filters"); applied.push({ kind: "gaussianBlur", id: filterId }); } catch (e) { console.warn("_mg.filter: gaussianBlur connect failed: " + e); }
    }
    if (spec.dropShadow) {
      const cfg = typeof spec.dropShadow === "number" ? { shadowRadius: spec.dropShadow } : spec.dropShadow;
      const attrs = {};
      if (cfg.radius != null) attrs.shadowRadius = Number(cfg.radius);
      if (cfg.offsetX != null) attrs.shadowOffsetX = Number(cfg.offsetX);
      if (cfg.offsetY != null) attrs.shadowOffsetY = Number(cfg.offsetY);
      if (cfg.color != null) attrs.shadowColor = cfg.color;
      if (cfg.opacity != null) attrs.shadowOpacity = Number(cfg.opacity);
      const filterId = this.layer("dropShadowFilter", "Drop Shadow", attrs);
      try { api.connect(filterId, "id", id, "filters"); applied.push({ kind: "dropShadow", id: filterId }); } catch (e) { console.warn("_mg.filter: dropShadow connect failed: " + e); }
    }
    if (spec.noise) {
      const cfg = typeof spec.noise === "number" ? { grainAmount: spec.noise } : spec.noise;
      const attrs = {};
      if (cfg.amount != null) attrs.grainAmount = Number(cfg.amount);
      const filterId = this.layer("grainFilter", "Noise", attrs);
      try { api.connect(filterId, "id", id, "filters"); applied.push({ kind: "noise", id: filterId }); } catch (e) { console.warn("_mg.filter: noise connect failed: " + e); }
    }
    return { id: id, applied: applied };
  },

  /** Corner rounding on a shape generator (live attribute: generator.cornerRadius). */
  corner(id, radius) {
    this.set(id, { "generator.cornerRadius": Number(radius) || 0 });
    return { id: id, cornerRadius: Number(radius) || 0 };
  },

  /**
   * Video raster \u2192 Cavalry composition space.
   *
   * refclone measures elements in top-left, y-down pixel coordinates; Cavalry
   * positions layers from a centred origin with y up. Pure conversion: no scene
   * reads or writes, so a plan can be validated before anything changes.
   *
   *   _mg.fromRaster(x, y, compWidth, compHeight)
   *   _mg.fromRaster([x, y], compWidth, compHeight)
   *   _mg.fromRaster({ x, y }, compWidth, compHeight)
   */
  fromRaster(x, y, compWidth, compHeight) {
    let rx = x;
    let ry = y;
    let cw = compWidth;
    let ch = compHeight;
    if (x && typeof x === "object") {
      if (Array.isArray(x)) { rx = x[0]; ry = x[1]; }
      else { rx = x.x; ry = x.y; }
      cw = y;
      ch = compWidth;
    }
    const px = Number(rx);
    const py = Number(ry);
    if (!isFinite(px) || !isFinite(py)) throw new Error("_mg.fromRaster: x/y must be finite numbers");
    const width = Number(cw) > 0 ? Number(cw) : 1920;
    const height = Number(ch) > 0 ? Number(ch) : 1080;
    return { x: px - width / 2, y: height / 2 - py };
  },

  /**
   * Fit one layer's measured world bounds to a target box, synchronously.
   *
   * Geometry is resized intrinsically first \u2014 basicShape generator.dimensions
   * or generator.radius, textShape fontSize \u2014 then the residual is closed with
   * the layer's scale, so a rotated or unusual layer still converges. The
   * position is corrected from the freshly measured box after every resize,
   * never from assumed pivot maths: an uncentred pivot or an intrinsic text
   * offset is simply a delta. getBoundingBox is evaluated at the current
   * playhead, so callers fit static layout before animation is written.
   *
   * targetBox: {x,y,width,height} where x/y is the min corner of the box in
   * getBoundingBox's space (Cavalry-centred, y up), [x,y,width,height], or
   * {centre:{x,y},width,height}. options.space "raster" interprets the box as
   * top-left, y-down video pixels and needs compWidth/compHeight (or reads the
   * active comp resolution). layerId also accepts an "@alias" registered by
   * _mg.alias, a semantic id, or a slug; the resolved live id is reported.
   *
   * options: { space, compWidth, compHeight, tolerance=0.5, maxPasses=5,
   *            intrinsic=true, preserveAspect=false, fitWidth=true }
   * Returns { ok, layerId, type, space, target, box, passes, error, applied }.
   * A parented layer whose parent transform is not identity can need extra
   * passes: the same correction is applied and the residual is reported rather
   * than assumed away.
   */
  fitToBounds(layerId, targetBox, options) {
    const opts = options || {};
    const requested = String(layerId == null ? "" : layerId).trim();
    if (requested) {
      let hits = [];
      try { hits = this.find(requested); } catch (e) { hits = []; }
      if (hits.length) layerId = hits[0];
      else if (requested.charAt(0) === "@") throw new Error("_mg.fitToBounds: no layer matches alias " + requested);
    }
    const num = function (v, fallback) { const n = Number(v); return isFinite(n) ? n : fallback; };
    const readBox = function () {
      let bb = null;
      try { bb = api.getBoundingBox(layerId, true); } catch (e) { return null; }
      if (!bb || typeof bb !== "object") return null;
      const arr = Array.isArray(bb);
      const width = arr ? num(bb[2], 0) : num(bb.width != null ? bb.width : bb.w, 0);
      const height = arr ? num(bb[3], 0) : num(bb.height != null ? bb.height : bb.h, 0);
      const x = arr ? num(bb[0], 0) : num(bb.x, 0);
      const y = arr ? num(bb[1], 0) : num(bb.y, 0);
      if (!(width > 0) || !(height > 0)) return null;
      return { x: x, y: y, width: width, height: height };
    };
    const readPoint = function (path, fallback) {
      let v = null;
      try { v = api.get(layerId, path); } catch (e) { v = null; }
      if (Array.isArray(v)) return [num(v[0], fallback[0]), num(v[1], fallback[1])];
      if (v && typeof v === "object") return [num(v.x, fallback[0]), num(v.y, fallback[1])];
      return [fallback[0], fallback[1]];
    };
    const readAny = function (path) {
      try { return api.get(layerId, path); } catch (e) { return undefined; }
    };
    const writePoint = function (path, x, y) {
      const attrs = {};
      attrs[path] = [x, y];
      _mg.set(layerId, attrs);
    };
    const write = function (attrs) { _mg.set(layerId, attrs); };

    // ---- target box ------------------------------------------------------
    let spec = targetBox;
    if (Array.isArray(spec)) spec = { x: spec[0], y: spec[1], width: spec[2], height: spec[3] };
    if (!spec || typeof spec !== "object") {
      throw new Error("_mg.fitToBounds: targetBox must be {x,y,width,height} or [x,y,width,height]");
    }
    const tw = num(spec.width, 0);
    const th = num(spec.height, 0);
    if (!(tw > 0) || !(th > 0)) throw new Error("_mg.fitToBounds: targetBox needs positive width and height");
    let tx;
    let ty;
    if (spec.centre && typeof spec.centre === "object") {
      tx = num(spec.centre.x, 0) - tw / 2;
      ty = num(spec.centre.y, 0) - th / 2;
    } else if (spec.cx != null || spec.cy != null) {
      tx = num(spec.cx, 0) - tw / 2;
      ty = num(spec.cy, 0) - th / 2;
    } else {
      tx = num(spec.x, 0);
      ty = num(spec.y, 0);
    }
    const space = String(opts.space || "comp");
    if (space === "raster") {
      let cw = num(opts.compWidth, 0);
      let ch = num(opts.compHeight, 0);
      if (!(cw > 0) || !(ch > 0)) {
        let compId = null;
        try { compId = api.getActiveComp(); } catch (e) { compId = null; }
        let res = null;
        if (compId) { try { res = api.get(compId, "resolution"); } catch (e) { res = null; } }
        const rw = Array.isArray(res) ? num(res[0], 0) : (res && typeof res === "object" ? num(res.x != null ? res.x : res.width, 0) : 0);
        const rh = Array.isArray(res) ? num(res[1], 0) : (res && typeof res === "object" ? num(res.y != null ? res.y : res.height, 0) : 0);
        cw = cw > 0 ? cw : (rw > 0 ? rw : 1920);
        ch = ch > 0 ? ch : (rh > 0 ? rh : 1080);
      }
      // Raster y is the top edge and grows down; getBoundingBox y is the min
      // corner of the box and grows up.
      const rasterY = ty;
      tx = tx - cw / 2;
      ty = ch / 2 - rasterY - th;
    }

    const tolerance = opts.tolerance != null ? Math.max(0, num(opts.tolerance, 0.5)) : 0.5;
    let maxPasses = Math.round(num(opts.maxPasses, 5));
    maxPasses = Math.max(1, Math.min(10, maxPasses));
    const preserveAspect = opts.preserveAspect === true;
    const intrinsic = opts.intrinsic !== false;
    const fitWidth = opts.fitWidth !== false;

    let type = "";
    try { type = String(api.getLayerType(layerId) || ""); } catch (e) { type = ""; }
    let box = readBox();
    if (!box) throw new Error("_mg.fitToBounds: layer " + layerId + " has no measurable bounding box");
    const applied = { intrinsic: "none", scale: false, position: false };
    let passes = 0;
    let fits = false;
    for (; passes < maxPasses; passes++) {
      const errX = Math.abs(tx - box.x);
      const errY = Math.abs(ty - box.y);
      const errW = Math.abs(box.width - tw);
      const errH = Math.abs(box.height - th);
      if (errX <= tolerance && errY <= tolerance && (!fitWidth || errW <= tolerance) && errH <= tolerance) {
        fits = true;
        break;
      }

      if (passes === 0 && intrinsic) {
        const sx = tw / box.width;
        const sy = th / box.height;
        if (type === "textShape") {
          const size = num(readAny("fontSize"), 0);
          if (size > 0) {
            const ratio = preserveAspect ? Math.min(sx, sy) : sy;
            write({ fontSize: size * ratio });
            applied.intrinsic = "fontSize";
            box = readBox() || box;
          }
        } else {
          const dims = readAny("generator.dimensions");
          const radius = readAny("generator.radius");
          const dimW = Array.isArray(dims) ? num(dims[0], 0) : (dims && typeof dims === "object" ? num(dims.x != null ? dims.x : dims.width, 0) : 0);
          const dimH = Array.isArray(dims) ? num(dims[1], 0) : (dims && typeof dims === "object" ? num(dims.y != null ? dims.y : dims.height, 0) : 0);
          const radX = Array.isArray(radius) ? num(radius[0], 0) : (radius && typeof radius === "object" ? num(radius.x != null ? radius.x : radius.width, 0) : 0);
          const radY = Array.isArray(radius) ? num(radius[1], 0) : (radius && typeof radius === "object" ? num(radius.y != null ? radius.y : radius.height, 0) : (typeof radius === "number" ? radius : 0));
          const ux = preserveAspect ? Math.min(sx, sy) : sx;
          const uy = preserveAspect ? ux : sy;
          if (dimW > 0 && dimH > 0) {
            write({ "generator.dimensions": [dimW * ux, dimH * uy] });
            applied.intrinsic = "dimensions";
            box = readBox() || box;
          } else if (radX > 0 && radY > 0) {
            write({ "generator.radius": [radX * ux, radY * uy] });
            applied.intrinsic = "radius";
            box = readBox() || box;
          } else if (typeof radius === "number" && radius > 0) {
            const u = Math.min(sx, sy);
            write({ "generator.radius": radius * u });
            applied.intrinsic = "radius";
            box = readBox() || box;
          }
        }
      }

      // Residual after the intrinsic resize. A rotated layer's AABB does not
      // scale exactly linearly, so this runs on every pass and the loop above
      // decides when the residual is small enough.
      const scaleX = preserveAspect ? Math.min(tw / box.width, th / box.height) : tw / box.width;
      const scaleY = preserveAspect ? scaleX : th / box.height;
      if (Math.abs(scaleX - 1) > 0.0001 || Math.abs(scaleY - 1) > 0.0001) {
        const cur = readPoint("scale", [1, 1]);
        writePoint("scale", cur[0] * scaleX, cur[1] * scaleY);
        applied.scale = true;
        box = readBox() || box;
      }

      // Re-measured box \u2192 exact position delta. A stale box must never be used
      // for this: generator and scale edits move the box around the pivot.
      const pos = readPoint("position", [0, 0]);
      const dx = tx - box.x;
      const dy = ty - box.y;
      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        writePoint("position", pos[0] + dx, pos[1] + dy);
        applied.position = true;
        box = readBox() || box;
      }
    }
    // One last measurement when the loop exited by iteration count, so the
    // reported box is always the scene's current state.
    box = readBox() || box;
    const error = { x: tx - box.x, y: ty - box.y, width: box.width - tw, height: box.height - th };
    const ok =
      Math.abs(error.x) <= tolerance &&
      Math.abs(error.y) <= tolerance &&
      Math.abs(error.width) <= tolerance &&
      Math.abs(error.height) <= tolerance;
    return {
      ok: ok,
      layerId: layerId,
      type: type,
      space: space,
      target: { x: tx, y: ty, width: tw, height: th },
      box: box,
      passes: Math.max(1, passes),
      error: error,
      applied: applied
    };
  },

  selection() {
    return api.getSelection();
  },
  sel() {
    return api.getSelection()[0];
  }
};
try {
  Object.assign(_mg.theme, _mg.ASTRYX_THEMES.neutral, { themeName: "neutral" });
} catch (e) {}


const _rb = {
  EASE_MAP: {
    Linear: "None",
    QuartIn: "SlowIn",
    QuartOut: "SlowOut",
    QuartInOut: "SlowInSlowOut",
    QuintIn: "VerySlowIn",
    QuintOut: "VerySlowOut",
    QuintInOut: "VerySlowInVerySlowOut",
    ExpoIn: "VerySlowIn",
    ExpoOut: "VerySlowOut",
    ExpoInOut: "VerySlowInVerySlowOut",
    CircIn: "SlowIn",
    CircOut: "SlowOut",
    CircInOut: "SlowInSlowOut",
    SineIn: "SlowIn",
    SineOut: "SlowOut",
    SineInOut: "SlowInSlowOut"
  },
  EASE_VALID: ["SlowIn","SlowOut","SlowInSlowOut","VerySlowIn","VerySlowOut","VerySlowInVerySlowOut","SpringIn","SpringOut","SpringInSpringOut","SmallSpringIn","SmallSpringOut","SmallSpringInSmallSpringOut","AnticipateIn","OvershootOut","AnticipateInOvershootOut","BounceIn","BounceOut","BounceInBounceOut","None","Custom"],

  /**
   * Design-system colours used across the preset catalogue. When a theme is
   * active every literal from this table is retinted, so _mg.applyTheme reaches
   * all 120 presets through the one colour funnel (_rb.c) without rewriting
   * their scripts. With no theme the table is inert and rendering is identical.
   */
  BASE_COLOR_ROLES: {
    "#10B981": "primary",
    "#38BDF8": "secondary",
    "#F59E0B": "accent",
    "#FBBF24": "accentBright",
    "#F8FAFC": "text",
    "#FFFFFF": "white",
    "#94A3B8": "muted",
    "#64748B": "mutedDeep",
    "#0B0C10": "background",
    "#0B0F14": "background",
    "#0F141B": "background",
    "#0F172A": "backgroundAlt",
    "#111827": "surface",
    "#151A23": "surface",
    "#1E293B": "surface",
    "#1F2937": "surfaceAlt",
    "#334155": "border",
    "#27303F": "borderStrong",
    "#2A3648": "borderStrong",
    "#3D4354": "borderAlt",
    "#3B3356": "borderAlt",
    "#E2E8F0": "textSoft",
    "#CBD5E1": "textSoft",
    "#475569": "mutedStrong",
    "#04120C": "primaryDeep",
    "#052E22": "primaryDeep",
    "#065F46": "primaryDeep",
    "#A78BFA": "violetSoft",
    "#C4B5FD": "violetSoft",
    "#EF4444": "danger",
    "#8B5CF6": "violet",
    "#F472B6": "pink",
    "#34D399": "mint",
    "#000000": "black"
  },

  /** Tokens resolve even before a theme is applied, so @primary is always safe. */
  THEME_FALLBACKS: {
    primary: "#10B981",
    secondary: "#38BDF8",
    accent: "#F59E0B",
    accentBright: "#FBBF24",
    text: "#F8FAFC",
    white: "#FFFFFF",
    muted: "#94A3B8",
    mutedDeep: "#64748B",
    background: "#0B0C10",
    backgroundAlt: "#0F172A",
    surface: "#111827",
    surfaceAlt: "#1F2937",
    border: "#334155",
    borderStrong: "#27303F",
    borderAlt: "#3D4354",
    danger: "#EF4444",
    violet: "#8B5CF6",
    violetSoft: "#A78BFA",
    pink: "#F472B6",
    mint: "#34D399",
    black: "#000000",
    textSoft: "#CBD5E1",
    mutedStrong: "#475569",
    primaryDeep: "#065F46"
  },

  RADIUS_FALLBACKS: { sm: 8, md: 16, lg: 24, pill: 999 },

  theme() {
    try { return globalThis.__mgTheme || null; } catch (e) { return null; }
  },

  /** Parse any accepted colour form to an uppercase "#RRGGBB" string. */
  hex(value) {
    if (value && typeof value === "object") {
      const part = (n) => {
        let s = Math.max(0, Math.min(255, Math.round(Number(n) || 0))).toString(16).toUpperCase();
        return s.length < 2 ? "0" + s : s;
      };
      return "#" + part(value.r) + part(value.g) + part(value.b);
    }
    let s = String(value == null ? "" : value).replace("#", "").trim();
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    return "#" + s.slice(0, 6).toUpperCase();
  },

  /**
   * Resolve "@role" tokens and theme-mapped base colours to a colour value.
   * Objects pass through the same lookup so retroactive recolouring can reuse
   * the live RGBA value read back from api.get.
   */
  themeColor(value) {
    if (value == null) return value;
    const theme = this.theme();
    if (value && typeof value === "object") {
      if (value.token != null || value.theme != null || value.role != null) {
        const role = String(value.token != null ? value.token : (value.theme != null ? value.theme : value.role)).replace(/^[@$]/, "");
        if (theme && theme.colors && theme.colors[role] != null) return theme.colors[role];
        if (this.THEME_FALLBACKS[role] != null) return this.THEME_FALLBACKS[role];
        return value;
      }
      const role = this.BASE_COLOR_ROLES[this.hex(value)];
      if (role && theme && theme.colors && theme.colors[role] != null) return theme.colors[role];
      return value;
    }
    let text = String(value);
    if (text.charAt(0) === "@" || text.charAt(0) === "$") {
      const role = text.slice(1);
      if (theme && theme.colors && theme.colors[role] != null) return theme.colors[role];
      if (this.THEME_FALLBACKS[role] != null) return this.THEME_FALLBACKS[role];
      return value;
    }
    const raw = text.replace("#", "").trim();
    const role = this.BASE_COLOR_ROLES[this.hex(text)];
    if (role && theme && theme.colors && theme.colors[role] != null) {
      let themed = theme.colors[role];
      // Preserve an explicit alpha channel from the original literal.
      if (raw.length >= 8 && typeof themed === "string") {
        const themedRaw = themed.replace("#", "");
        if (themedRaw.length === 6) themed = "#" + themedRaw + raw.slice(6, 8);
      }
      return themed;
    }
    return value;
  },

  /** Parse a colour without consulting (or re-mapping through) the theme. */
  rawColor(value) {
    if (value && typeof value === "object") {
      return { r: value.r | 0, g: value.g | 0, b: value.b | 0, a: value.a == null ? 255 : value.a | 0 };
    }
    let s = String(value == null ? "#FFFFFF" : value).replace("#", "");
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    return {
      r: parseInt(s.substr(0, 2), 16) || 0,
      g: parseInt(s.substr(2, 2), 16) || 0,
      b: parseInt(s.substr(4, 2), 16) || 0,
      a: s.length >= 8 ? (parseInt(s.substr(6, 2), 16) || 0) : 255
    };
  },


  ease(name) {
    if (!name) return "SlowInSlowOut";
    if (this.EASE_VALID.indexOf(name) >= 0) return name;
    return this.EASE_MAP[name] || "SlowInSlowOut";
  },

  c(value) {
    return this.rawColor(this.themeColor(value));
  },

  one(key, value) { const d = {}; d[key] = value; return d; },

  /** Locale-free thousands formatter: 48200 -> "48,200" (optional decimals). */
  fmt(value, decimals) {
    const n = Number(value) || 0;
    const fixed = decimals ? n.toFixed(decimals) : String(Math.round(n));
    const parts = fixed.split(".");
    let whole = parts[0];
    let sign = "";
    if (whole.charAt(0) === "-") { sign = "-"; whole = whole.slice(1); }
    let out = "";
    for (let i = 0; i < whole.length; i++) {
      if (i > 0 && (whole.length - i) % 3 === 0) out += ",";
      out += whole[i];
    }
    return sign + out + (parts.length > 1 ? "." + parts[1] : "");
  },

  /** New layers inherit the selection's parent; reset it before top-level creation. */
  fresh() { try { api.select([]); } catch (e) {} },

  /** Split compound/color attributes into single api.set calls. */
  set(id, attrs) {
    if (!attrs) return id;
    const compound = ["material.materialColor","strokeColor","glowColor","position","scale","rotation","generator.dimensions","generator.size","generator.count","generator.radius","generator.width","font"];
    const colorKeys = ["material.materialColor","strokeColor","glowColor"];
    const scalar = {};
    const keys = Object.keys(attrs);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      let v = attrs[k];
      if (v != null && colorKeys.indexOf(k) >= 0) v = this.c(v);
      if (compound.indexOf(k) >= 0 || (v && typeof v === "object")) api.set(id, this.one(k, v));
      else scalar[k] = v;
    }
    if (Object.keys(scalar).length) api.set(id, scalar);
    return id;
  },

  layer(type, name, attrs) {
    this.fresh();
    const id = api.create(type, name || type);
    this.set(id, attrs || {});
    return id;
  },

  pos(id, x, y) { api.set(id, { position: [x, y] }); return id; },
  dims(id, w, h) { api.set(id, { "generator.dimensions": [w, h] }); return id; },
  rad(id, r) {
    const theme = this.theme();
    if (typeof r === "string" && (r.charAt(0) === "@" || r.charAt(0) === "$")) {
      const token = r.slice(1);
      const fromTheme = theme && theme.radius ? theme.radius[token] : null;
      r = fromTheme != null ? fromTheme : (this.RADIUS_FALLBACKS[token] != null ? this.RADIUS_FALLBACKS[token] : 16);
    }
    const scale = theme && theme.radius && Number(theme.radius.scale) > 0 ? Number(theme.radius.scale) : 1;
    if (typeof r === "number" && isFinite(r)) r = r * scale;
    api.set(id, { "generator.cornerRadius": r });
    return id;
  },
  scale(id, x, y) { api.set(id, { scale: [x, y == null ? x : y] }); return id; },
  rot(id, deg) { api.set(id, { rotation: deg }); return id; },
  opacity(id, v) { api.set(id, { opacity: v }); return id; },
  alpha(id, v) { api.set(id, { "material.alpha": v }); return id; },
  hide(id) { api.set(id, { hidden: true }); return id; },
  show(id) { api.set(id, { hidden: false }); return id; },
  fill(id, color) { api.set(id, { "material.materialColor": this.c(color) }); return id; },
  strokeColor(id, color) { api.set(id, { strokeColor: this.c(color) }); return id; },

  /** Centre geometry (text especially) on the given composition point. */
  center(id, x, y) {
    let bb = null;
    try { bb = api.getBoundingBox(id, false); } catch (e) {}
    const cx = bb && bb.centre ? Number(bb.centre.x) || 0 : 0;
    const cy = bb && bb.centre ? Number(bb.centre.y) || 0 : 0;
    this.pos(id, x - cx, y - cy);
    return id;
  },

  /** Pin one edge/corner of the geometry to (x, y). ax/ay are -1, 0 or 1. */
  edge(id, x, y, ax, ay) {
    let bb = null;
    try { bb = api.getBoundingBox(id, false); } catch (e) {}
    const cx = bb && bb.centre ? Number(bb.centre.x) || 0 : 0;
    const cy = bb && bb.centre ? Number(bb.centre.y) || 0 : 0;
    const w = bb && bb.width ? Number(bb.width) : 0;
    const h = bb && bb.height ? Number(bb.height) : 0;
    this.pos(id, x - cx - (ax || 0) * w / 2, y - cy - (ay || 0) * h / 2);
    return id;
  },

  rect(name, w, h, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("rectangle", name);
    this.dims(id, w, h);
    if (o.radius != null) this.rad(id, o.radius);
    this.fill(id, o.fill || "#1E293B");
    if (o.alpha != null) this.alpha(id, o.alpha);
    this.pos(id, o.x || 0, o.y || 0);
    if (o.rotation) this.rot(id, o.rotation);
    if (o.opacity != null) this.opacity(id, o.opacity);
    if (o.hidden) this.hide(id);
    if (o.stroke) this.stroke(id, o.strokeColor || "#334155", o.strokeWidth || 2, { capStyle: 0 });
    return id;
  },

  ellipse(name, w, h, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("ellipse", name);
    // ellipse has no dimensions attribute; its radius is a [rx, ry] vector
    api.set(id, { "generator.radius": [w / 2, h / 2] });
    this.fill(id, o.fill || "#1E293B");
    if (o.alpha != null) this.alpha(id, o.alpha);
    this.pos(id, o.x || 0, o.y || 0);
    if (o.rotation) this.rot(id, o.rotation);
    if (o.opacity != null) this.opacity(id, o.opacity);
    if (o.hidden) this.hide(id);
    if (o.stroke) this.stroke(id, o.strokeColor || "#334155", o.strokeWidth || 2, { capStyle: 1 });
    return id;
  },

  circle(name, r, o) { return this.ellipse(name, r * 2, r * 2, o); },

  star(name, size, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("star", name);
    api.set(id, {
      "generator.radius": size / 2,
      "generator.innerRadius": o.innerRadius != null ? o.innerRadius : size * 0.22,
      "generator.sides": o.points || 4,
      "generator.useInnerRadius": o.useInner !== false,
      "generator.divisions": o.divisions || 0
    });
    this.fill(id, o.fill || "#F8FAFC");
    if (o.alpha != null) this.alpha(id, o.alpha);
    this.pos(id, o.x || 0, o.y || 0);
    if (o.rotation) this.rot(id, o.rotation);
    if (o.opacity != null) this.opacity(id, o.opacity);
    if (o.hidden) this.hide(id);
    return id;
  },

  poly(name, size, sides, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("polygon", name);
    api.set(id, { "generator.radius": [size / 2, size / 2] });
    api.set(id, { "generator.sides": sides || 3 });
    this.fill(id, o.fill || "#1E293B");
    if (o.alpha != null) this.alpha(id, o.alpha);
    this.pos(id, o.x || 0, o.y || 0);
    if (o.rotation) this.rot(id, o.rotation);
    if (o.stroke) this.stroke(id, o.strokeColor || "#334155", o.strokeWidth || 2, { capStyle: 1 });
    return id;
  },

  ringPrim(name, radius, width, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("ring", name);
    api.set(id, { "generator.radius": radius, "generator.width": width });
    this.fill(id, o.fill || "#10B981");
    this.pos(id, o.x || 0, o.y || 0);
    if (o.opacity != null) this.opacity(id, o.opacity);
    return id;
  },

  arc(name, radius, width, startAngle, endAngle, o) {
    o = o || {};
    this.fresh();
    const id = api.primitive("arc", name);
    api.set(id, { "generator.radius": radius, "generator.width": width });
    api.set(id, { "generator.startAngle": startAngle, "generator.endAngle": endAngle });
    this.fill(id, o.fill || "#F8FAFC");
    this.pos(id, o.x || 0, o.y || 0);
    if (o.opacity != null) this.opacity(id, o.opacity);
    return id;
  },

  text(str, size, o) {
    o = o || {};
    this.fresh();
    const theme = this.theme();
    const type = theme && theme.typography ? theme.typography : null;
    let fontSize = size || 60;
    if (type && Number(type.scale) > 0) fontSize = fontSize * Number(type.scale);
    const id = api.create("textShape", o.name || String(str).slice(0, 32) || "Text");
    api.set(id, {
      text: String(str),
      fontSize: fontSize,
      horizontalAlignment: o.align == null ? 1 : o.align,
      verticalAlignment: o.valign == null ? 1 : o.valign
    });
    const font = o.font || (type ? type.font : null);
    if (font) api.set(id, { font: { font: font, style: o.style || (type && type.style ? type.style : "Regular") } });
    this.fill(id, o.color || "#F8FAFC");
    if (o.alpha != null) this.alpha(id, o.alpha);
    if (o.opacity != null) this.opacity(id, o.opacity);
    this.center(id, o.x == null ? 0 : o.x, o.y == null ? 0 : o.y);
    return id;
  },

  /** Left-aligned text whose left edge sits at x. */
  textLeft(str, size, x, y, o) {
    o = o || {};
    const id = this.text(str, size, Object.assign({}, o, { align: 0, x: 0, y: 0 }));
    this.edge(id, x, y, -1, 0);
    return id;
  },

  /** Right-aligned text whose right edge sits at x. */
  textRight(str, size, x, y, o) {
    o = o || {};
    const id = this.text(str, size, Object.assign({}, o, { align: 2, x: 0, y: 0 }));
    this.edge(id, x, y, 1, 0);
    return id;
  },

  stroke(shapeId, color, width, o) {
    o = o || {};
    this.fresh();
    const id = api.create("strokeMaterial", "Stroke");
    api.set(id, { width: width || 2 });
    this.strokeColor(id, color || "#94A3B8");
    if (o.capStyle != null) api.set(id, { capStyle: o.capStyle });
    // Cavalry 2.8 stores dashPattern as a comma-separated string ("10,8");
    // passing an array throws json type_error.302 in the bridge.
    if (o.dash) api.set(id, { dashPattern: Array.isArray(o.dash) ? o.dash.join(",") : String(o.dash) });
    if (o.trim) api.set(id, { trimStart: o.trim[0], trimEnd: o.trim[1] });
    api.connect(id, "id", shapeId, "stroke");
    return id;
  },

  glow(target, color, blur, intensity) {
    this.fresh();
    const id = api.create("glowFilter", "Glow");
    this.set(id, { glowColor: this.c(color || "#10B981") });
    const b = blur == null ? 20 : blur;
    api.set(id, { blur: [b, b] });
    api.set(id, { intensity: intensity == null ? 2 : intensity, gamma: 1 });
    api.connect(id, "id", target, "filters");
    return id;
  },

  /**
   * Pin an edge of the target's geometry to its position.
   * Helper convention: x = -1 pins the left edge (Cavalry's align x sign is
   * inverted: x:1 is the left edge), x = 1 the right edge; y = 1 the bottom.
   */
  anchor(target, x, y) {
    this.fresh();
    const id = api.create("align", "Align");
    api.set(id, { x: -(x == null ? 0 : x), y: y == null ? 0 : y });
    api.connect(id, "id", target, "deformers");
    return id;
  },

  kf(id, attr, pts, easeName) {
    const ease = this.ease(easeName);
    for (let i = 0; i < pts.length; i++) {
      const d = {}; d[attr] = pts[i][1];
      api.keyframe(id, pts[i][0], d);
      if (i < pts.length - 1) api.magicEasing(id, attr, pts[i][0], ease);
    }
    return id;
  },

  /**
   * Keyframe position using visual coordinates. Text layers carry an intrinsic
   * bbox offset (center()/edge() compensate it at creation), so raw position
   * keyframes would shift them by that offset. Shapes resolve to offset 0.
   */
  kfAt(id, axis, pts, easeName) {
    let off = 0;
    try {
      const bb = api.getBoundingBox(id, false);
      if (bb && bb.centre) off = Number(bb.centre[axis]) || 0;
    } catch (e) {}
    return this.kf(id, "position." + axis, pts.map((p) => [p[0], p[1] - off]), easeName);
  },

  pop(id, start, duration, o) {
    o = o || {};
    const from = o.from == null ? 0 : o.from;
    this.kf(id, "scale.x", [[start, from], [start + duration, 1]], o.ease || "SpringOut");
    this.kf(id, "scale.y", [[start, from], [start + duration, 1]], o.ease || "SpringOut");
    if (o.fade !== false) this.fade(id, start, duration, o.fadeFrom == null ? 0 : o.fadeFrom, o.fadeTo == null ? 100 : o.fadeTo, o.ease || "SpringOut");
    return id;
  },

  fade(id, start, duration, from, to, easeName) {
    return this.kf(id, "opacity", [[start, from == null ? 0 : from], [start + duration, to == null ? 100 : to]], easeName || "SlowInSlowOut");
  },

  slide(id, start, duration, dx, dy, easeName) {
    let x = 0, y = 0;
    try { x = Number(api.get(id, "position.x")) || 0; y = Number(api.get(id, "position.y")) || 0; } catch (e) {}
    this.kf(id, "position.x", [[start, x + dx], [start + duration, x]], easeName || "SlowOut");
    this.kf(id, "position.y", [[start, y + dy], [start + duration, y]], easeName || "SlowOut");
    return id;
  },

  stagger(target, offset, attr) {
    this.fresh();
    const id = api.create("stagger", "Stagger");
    api.set(id, { offset: offset == null ? 4 : offset });
    api.connect(id, "id", target, attr || "shapeTimeOffset");
    return id;
  },

  dup(source, o) {
    o = o || {};
    this.fresh();
    const id = api.create("duplicator", o.name || "Duplicator");
    api.connect(source, "id", id, "shapes");
    const linear = o.distribution === "linear";
    api.setGenerator(id, "generator", linear ? "linearDistribution" : "gridDistribution");
    if (linear) {
      const n = typeof o.count === "number" ? o.count : (o.columns || 5);
      api.set(id, { "generator.count": n });
      api.set(id, { "generator.size": o.size != null ? Number(o.size) : (o.width || 800) });
    } else {
      let cols = o.columns || 4, rows = o.rows || 3;
      if (Array.isArray(o.count)) { cols = Number(o.count[0]) || 1; rows = Number(o.count[1]) || 1; }
      api.set(id, { "generator.count": [cols, rows] });
      let sw = o.width || 1000, sh = o.height || 600;
      if (Array.isArray(o.size)) { sw = Number(o.size[0]) || sw; sh = Number(o.size[1]) || sh; }
      else if (typeof o.size === "number") { sw = o.size; sh = o.size; }
      api.set(id, { "generator.size": [sw, sh] });
    }
    if (o.direction != null) api.set(id, { "generator.direction": o.direction });
    if (o.attrs) this.set(id, o.attrs);
    if (o.hideSource !== false) this.hide(source);
    return id;
  },

  /** Straight connector drawn from (x1,y1) to (x2,y2); scale.x draws it on. */
  line(name, x1, y1, x2, y2, width, color, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const id = this.rect(name, len, width || 4, { fill: color || "#334155", radius: (width || 4) / 2 });
    this.anchor(id, -1, 0);
    this.pos(id, x1, y1);
    this.rot(id, angle);
    if (o.dash) this.stroke(id, o.strokeColor || color || "#334155", 1, { dash: o.dash, capStyle: 0 });
    if (o.draw) this.kf(id, "scale.x", [[o.draw[0], 0.001], [o.draw[1], 1]], o.ease || "SlowInSlowOut");
    return id;
  },

  draw(id, start, end, easeName) {
    return this.kf(id, "scale.x", [[start, 0.001], [end, 1]], easeName || "SlowInSlowOut");
  },

  counter(textId, o) {
    o = o || {};
    this.fresh();
    const id = api.create("stringGenerator", "Counter");
    api.set(id, { "generator.precision": o.decimals || 0 });
    api.set(id, { "generator.length": o.length || 1 });
    api.set(id, { prefix: o.prefix || "", suffix: o.suffix || "" });
    if (o.delimiter) api.set(id, { "generator.delimiter": o.delimiter });
    api.connect(id, "id", textId, "text");
    this.kf(id, "generator.number", [[o.start || 0, o.from == null ? 0 : o.from], [(o.start || 0) + (o.duration || 45), o.to == null ? 100 : o.to]], o.ease || "SlowOut");
    return id;
  },

  /** Linear row of rounded bars driven by one oscillator + per-copy stagger. */
  wave(name, o) {
    o = o || {};
    const width = o.width || 720;
    const barW = o.barWidth || 6;
    const color = o.color || "#10B981";
    const bar = this.rect(name + " Bar", barW, o.maxHeight || 120, { fill: color, radius: barW / 2 });
    this.anchor(bar, 0, 1);
    this.pos(bar, 0, o.y || 0);
    const d = this.dup(bar, { name: name + " Bars", distribution: "linear", count: o.count || 28, size: width });
    const osc = this.layer("oscillator", name + " Osc", {
      strength: o.strength == null ? 0.55 : o.strength,
      frequency: o.frequency == null ? 1.1 : o.frequency
    });
    api.connect(osc, "id", bar, "scale.y");
    this.stagger(d, o.stagger == null ? 2 : o.stagger);
    return { bars: d, bar: bar, oscillator: osc };
  },

  /** Track + fill progress bar; fill grows from the left edge. */
  progress(name, w, h, o) {
    o = o || {};
    const x = o.x || 0, y = o.y || 0;
    const track = this.rect(name + " Track", w, h, { fill: o.trackColor || "#1F2937", radius: h / 2, x: x, y: y });
    const fill = this.rect(name + " Fill", w, h, { fill: o.color || "#10B981", radius: h / 2 });
    this.anchor(fill, -1, 0);
    this.pos(fill, x - w / 2, y);
    const pct = o.pct == null ? 0.65 : o.pct;
    if (o.animate === false) this.scale(fill, pct, 1);
    else this.kf(fill, "scale.x", [[o.start || 0, o.from == null ? 0.001 : o.from], [(o.start || 0) + (o.duration || 45), pct]], o.ease || "SlowOut");
    return { track: track, fill: fill };
  },

  /** Background ring + progress ring (stroke trim) + centred value counter. */
  gauge(name, o) {
    o = o || {};
    const x = o.x || 0, y = o.y || 0;
    const radius = o.radius || 130, sw = o.strokeWidth || 18;
    const track = this.circle(name + " Track", radius, { fill: "#0B0C10", alpha: 0, x: x, y: y });
    this.stroke(track, o.trackColor || "#1F2937", sw, { capStyle: 1, trim: [0, 100] });
    const progress = this.circle(name + " Progress", radius, { fill: "#0B0C10", alpha: 0, x: x, y: y });
    const stroke = this.stroke(progress, o.color || "#10B981", sw, { capStyle: 1, trim: [0, 0] });
    const pct = o.pct == null ? 72 : o.pct;
    const start = o.start || 0, duration = o.duration || 45;
    this.kf(stroke, "trimEnd", [[start, 0], [start + duration, pct]], o.ease || "SlowOut");
    const to = o.counterTo == null ? pct : o.counterTo;
    const decimals = o.decimals || 0;
    const prefix = o.prefix || "";
    const suffix = o.suffix == null ? "%" : o.suffix;
    // Seed the text with the final readout so centring is measured on real glyphs;
    // stringGenerator only replaces the characters afterwards.
    const seed = o.text == null ? prefix + Number(to).toFixed(decimals) + suffix : String(o.text);
    const text = this.text(seed, o.fontSize || 48, { color: o.textColor || "#F8FAFC", x: x, y: y, name: name + " Value" });
    let counter = null;
    if (o.counter !== false) {
      counter = this.counter(text, { from: o.counterFrom == null ? 0 : o.counterFrom, to: to, prefix: prefix, suffix: suffix, start: start, duration: duration, decimals: decimals, ease: o.counterEase || o.ease });
    }
    return { track: track, progress: progress, stroke: stroke, text: text, counter: counter };
  },

  /** Dimmed backdrop + rounded card. */
  modal(name, w, h, o) {
    o = o || {};
    const dim = this.rect(name + " Dim", 1920, 1080, { fill: o.dimColor || "#000000", alpha: o.dim == null ? 55 : o.dim, x: 0, y: 0 });
    const card = this.rect(name + " Card", w, h, { fill: o.fill || "#111827", radius: o.radius == null ? 24 : o.radius, x: o.x || 0, y: o.y || 0, stroke: o.stroke !== false, strokeColor: o.strokeColor || "#334155", strokeWidth: 2 });
    if (o.pop !== false) this.pop(card, o.start || 0, o.duration || 20, { ease: "SpringOut", fade: false });
    return { dim: dim, card: card };
  },

  pill(name, w, h, o) {
    o = o || {};
    return this.rect(name, w, h, { fill: o.fill || "#1E293B", radius: o.radius == null ? h / 2 : o.radius, x: o.x || 0, y: o.y || 0, alpha: o.alpha, stroke: o.stroke, strokeColor: o.strokeColor, strokeWidth: o.strokeWidth });
  },

  dot(name, x, y, size, color, o) {
    o = o || {};
    const id = this.circle(name, (size || 10) / 2, { fill: color || "#10B981", x: x, y: y });
    if (o.glow) this.glow(id, color || "#10B981", o.glow, o.glowIntensity == null ? 2 : o.glowIntensity);
    return id;
  },

  check(name, x, y, size, color) {
    return this.text("\\u2713", size || 28, { color: color || "#10B981", x: x, y: y, name: name });
  },

  keycap(name, label, x, y, o) {
    o = o || {};
    const w = o.width || 64, h = o.height || 44;
    const cap = this.rect(name, w, h, { fill: o.fill || "#1E293B", radius: o.radius == null ? 10 : o.radius, x: x, y: y, stroke: true, strokeColor: o.strokeColor || "#475569", strokeWidth: 2 });
    this.text(label, o.fontSize || 20, { color: o.color || "#E2E8F0", x: x, y: y, name: name + " Label" });
    return cap;
  },

  /** Status row: card + dot + label + trailing value. */
  listRow(name, w, h, o) {
    o = o || {};
    const x = o.x || 0, y = o.y || 0;
    const card = this.rect(name, w, h, { fill: o.fill || "#151A23", radius: o.radius == null ? 12 : o.radius, x: x, y: y, stroke: o.stroke !== false, strokeColor: o.strokeColor || "#27303F", strokeWidth: 1 });
    const pad = o.pad || 22;
    const dot = this.dot(name + " Dot", x - w / 2 + pad, y, o.dotSize || 10, o.dotColor || "#10B981");
    const label = this.textLeft(String(o.label || "Row"), o.fontSize || 18, x - w / 2 + pad + 18, y, { color: o.textColor || "#E2E8F0" });
    let value = null;
    if (o.value != null) value = this.textRight(String(o.value), o.fontSize || 18, x + w / 2 - pad, y, { color: o.valueColor || "#94A3B8" });
    return { card: card, dot: dot, label: label, value: value };
  },

  rowX(i, n, gap) { return (i - (n - 1) / 2) * gap; },
  colY(i, n, gap) { return ((n - 1) / 2 - i) * gap; },

  /** KPI tile: card, caption, large value and an optional delta chip. */
  kpiCard(name, label, value, x, y, w, h, o) {
    o = o || {};
    const card = this.rect(name, w, h, {
      fill: o.fill || "#111827", radius: o.radius == null ? 18 : o.radius,
      x: x, y: y, stroke: o.stroke !== false, strokeColor: o.strokeColor || "#27303F", strokeWidth: 1
    });
    const caption = this.textLeft(String(label), o.labelSize || 13, x - w / 2 + 24, y + h / 2 - 28, { color: o.labelColor || "#64748B", name: name + " Caption" });
    const val = this.textLeft(String(value), o.valueSize || 38, x - w / 2 + 24, y - 8, { color: o.valueColor || "#F8FAFC", name: name + " Value" });
    let delta = null;
    if (o.delta) {
      delta = this.badge(name + " Delta", String(o.delta), x + w / 2 - Math.max(42, String(o.delta).length * 7 + 22), y + h / 2 - 28, {
        fill: o.deltaFill || "#052E22", color: o.deltaColor || "#34D399", fontSize: 11, height: 22
      });
    }
    return { card: card, caption: caption, value: val, delta: delta };
  },

  /** Company/partner pill with an optional brand mark. */
  logoPill(name, label, x, y, o) {
    o = o || {};
    const h = o.height || 52, fs = o.fontSize || 18;
    const w = o.width || Math.max(h + 26, Math.round(String(label).length * fs * 0.62 + fs * 2.6));
    const pill = this.rect(name, w, h, {
      fill: o.fill || "#0F141B", radius: o.radius == null ? 14 : o.radius,
      x: x, y: y, stroke: true, strokeColor: o.strokeColor || "#222B38", strokeWidth: 1
    });
    let mark = null;
    if (o.mark !== false) {
      mark = this.circle(name + " Mark", o.markSize || 7, {
        fill: o.color || "#94A3B8", x: x - w / 2 + 22, y: y
      });
    }
    const text = this.text(String(label), fs, {
      color: o.textColor || "#CBD5E1", x: mark ? x + 10 : x, y: y, name: name + " Label"
    });
    return { pill: pill, mark: mark, text: text, w: w, h: h };
  },

  /** Phone shell: body, inset screen and notch. */
  phoneFrame(name, w, h, x, y, o) {
    o = o || {};
    const body = this.rect(name, w, h, {
      fill: o.fill || "#0B0F14", radius: o.radius == null ? 42 : o.radius,
      x: x, y: y, stroke: true, strokeColor: o.strokeColor || "#334155", strokeWidth: 3
    });
    const screen = this.rect(name + " Screen", w - 22, h - 22, {
      fill: o.screenColor || "#111827", radius: (o.radius == null ? 42 : o.radius) - 8, x: x, y: y
    });
    const notch = this.rect(name + " Notch", Math.round(w * 0.32), 18, {
      fill: o.fill || "#0B0F14", radius: 9, x: x, y: y + h / 2 - 24
    });
    return { body: body, screen: screen, notch: notch };
  },

  /** Equal-width meter segments (password strength, quotas, split bars). */
  segmentRow(name, n, w, h, x, y, o) {
    o = o || {};
    const gap = o.gap == null ? 8 : o.gap;
    const count = Math.max(1, n || 4);
    const segW = (w - gap * (count - 1)) / count;
    const segs = [];
    for (let i = 0; i < count; i++) {
      segs.push(this.rect(name + " " + (i + 1), segW, h, {
        fill: o.fill || "#1F2937", radius: o.radius == null ? h / 2 : o.radius,
        x: x - w / 2 + segW / 2 + i * (segW + gap), y: y
      }));
    }
    return segs;
  },

  /** Deterministic audio bars that pulse upward from a baseline. */
  audioBars(name, x, y, w, count, color, o) {
    o = o || {};
    const n = Math.max(3, count || 24);
    const barW = o.barWidth || 6;
    const gap = (w - n * barW) / (n > 1 ? n - 1 : 1);
    const maxH = o.maxHeight || 120;
    const dur = o.duration || 30;
    const base = o.base == null ? 0.25 : o.base;
    const start = o.start || 0;
    const bars = [];
    for (let i = 0; i < n; i++) {
      const h = maxH * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + (o.seed || 0))));
      const bx = x - w / 2 + barW / 2 + i * (barW + gap);
      const bar = this.rect(name + " " + (i + 1), barW, h, {
        fill: Array.isArray(color) ? color[i % color.length] : (color || "#10B981"),
        radius: barW / 2, x: bx, y: y
      });
      this.anchor(bar, 0, 1);
      this.pos(bar, bx, y);
      if (o.animate !== false) {
        const s = start + i * (o.stagger == null ? 0.8 : o.stagger);
        this.kf(bar, "scale.y", [
          [s, base],
          [s + dur * 0.22, 0.55 + (i % 3) * 0.15],
          [s + dur * 0.46, base],
          [s + dur * 0.7, 0.75 + (i % 2) * 0.2],
          [s + dur, base]
        ], o.ease || "SlowInOut");
      }
      bars.push(bar);
    }
    return bars;
  },

  /** Circular avatar with optional stroke ring and centred initials. */
  avatar(name, size, x, y, o) {
    o = o || {};
    const bg = this.circle(name, (size || 64) / 2, { fill: o.fill || "#334155", x: x, y: y });
    if (o.ring !== false) this.stroke(bg, o.ringColor || "#0B0C10", o.ringWidth || 4, { capStyle: 1, trim: [0, 100] });
    const label = this.text(o.initials || "AB", Math.max(10, (size || 64) * 0.34), {
      color: o.textColor || "#F8FAFC", x: x, y: y, name: name + " Initials"
    });
    return { bg: bg, label: label };
  },

  /** Pill + centred label sized from the text length. */
  badge(name, label, x, y, o) {
    o = o || {};
    const fs = o.fontSize || 14, h = o.height || Math.round(fs * 2.2);
    const w = o.width || Math.max(h + 12, Math.round(String(label).length * fs * 0.64 + fs * 1.8));
    const pill = this.pill(name, w, h, {
      fill: o.fill || "#1E293B", radius: o.radius == null ? h / 2 : o.radius, x: x, y: y,
      alpha: o.alpha, stroke: o.stroke, strokeColor: o.strokeColor, strokeWidth: o.strokeWidth
    });
    const text = this.text(String(label), fs, { color: o.color || "#E2E8F0", x: x, y: y, name: name + " Label" });
    return { pill: pill, text: text, w: w, h: h };
  },

  /** Automation/status card: icon dot, title and optional sub-label. */
  nodeCard(name, label, x, y, w, h, o) {
    o = o || {};
    const card = this.rect(name, w, h, {
      fill: o.fill || "#111827", radius: o.radius == null ? 16 : o.radius,
      x: x, y: y, stroke: o.stroke !== false, strokeColor: o.strokeColor || "#334155", strokeWidth: o.strokeWidth || 2
    });
    const icon = this.dot(name + " Icon", x - w / 2 + 34, y, o.iconSize || 18, o.iconColor || "#10B981", { glow: 14, glowIntensity: 1.2 });
    const title = this.textLeft(String(label), o.fontSize || 18, x - w / 2 + 58, y + (o.sub ? 12 : 0), { color: o.textColor || "#F8FAFC", name: name + " Title" });
    let sub = null;
    if (o.sub) sub = this.textLeft(String(o.sub), 12, x - w / 2 + 58, y - 12, { color: o.subColor || "#64748B", name: name + " Sub" });
    return { card: card, icon: icon, title: title, sub: sub };
  },

  /** Chat bubble with an optional left tail. */
  chatBubble(name, w, h, x, y, o) {
    o = o || {};
    const bubble = this.rect(name, w, h, {
      fill: o.fill || "#1E293B", radius: o.radius == null ? 22 : o.radius,
      x: x, y: y, stroke: o.stroke, strokeColor: o.strokeColor, strokeWidth: o.strokeWidth || 1
    });
    let tail = null;
    if (o.tail !== false) {
      tail = this.poly(name + " Tail", 26, 3, { fill: o.fill || "#1E293B", x: x - w / 2 + 20, y: y - h / 2 - 4, rotation: o.tailRotation == null ? 200 : o.tailRotation });
    }
    return { bubble: bubble, tail: tail };
  },

  /** Browser chrome: frame, title bar, traffic dots and URL pill. */
  browserFrame(name, w, h, x, y, o) {
    o = o || {};
    const frame = this.rect(name, w, h, {
      fill: o.fill || "#0B0F14", radius: o.radius == null ? 16 : o.radius,
      x: x, y: y, stroke: true, strokeColor: o.strokeColor || "#1F2937", strokeWidth: 2
    });
    const bar = this.rect(name + " Bar", w, 38, { fill: o.barColor || "#111827", radius: 16, x: x, y: y + h / 2 - 19 });
    const dots = [];
    for (let i = 0; i < 3; i++) dots.push(this.circle(name + " Dot " + i, 5, {
      fill: ["#F87171", "#FBBF24", "#34D399"][i], x: x - w / 2 + 22 + i * 16, y: y + h / 2 - 19
    }));
    const url = this.rect(name + " URL", Math.min(360, w * 0.46), 18, { fill: "#0B0F14", radius: 9, x: x, y: y + h / 2 - 19 });
    return { frame: frame, bar: bar, dots: dots, url: url };
  },

  /** Expanding sonar rings; each ring fades as it scales out. */
  sonar(name, x, y, radius, color, o) {
    o = o || {};
    const rings = [];
    const count = o.count || 3, start = o.start || 0, gap = o.gap == null ? 12 : o.gap, dur = o.duration || 36;
    for (let i = 0; i < count; i++) {
      const ring = this.circle(name + " " + (i + 1), radius, { fill: "#0B0C10", alpha: 0, x: x, y: y });
      this.stroke(ring, color || "#10B981", o.width || 3, { capStyle: 1, trim: [0, 100] });
      const s = start + i * gap;
      this.kf(ring, "scale.x", [[s, 0.45], [s + dur, 1.65]], o.ease || "SlowOut");
      this.kf(ring, "scale.y", [[s, 0.45], [s + dur, 1.65]], o.ease || "SlowOut");
      this.fade(ring, s, dur, o.from == null ? 70 : o.from, 0, "SlowOut");
      rings.push(ring);
    }
    return rings;
  },

  /** Deterministic confetti burst made from small rotating shards. */
  confetti(name, x, y, count, colors, o) {
    o = o || {};
    const bits = [];
    const palette = colors && colors.length ? colors : ["#10B981", "#38BDF8", "#F59E0B", "#F472B6", "#A78BFA"];
    const start = o.start || 0, dur = o.duration || 34;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.35;
      const dist = (o.spread || 120) + (i % 4) * ((o.spread || 120) * 0.45);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist * 0.7 - (o.lift || 20);
      const bit = this.rect(name + " " + (i + 1), i % 3 === 0 ? 10 : 6, i % 3 === 0 ? 5 : 12, {
        fill: palette[i % palette.length], radius: 2, x: x, y: y
      });
      const s = start + (i % 3) * 1.5;
      this.kf(bit, "position.x", [[s, x], [s + dur, x + dx]], "SlowOut");
      this.kf(bit, "position.y", [[s, y], [s + dur, y + dy - 30]], "SlowOut");
      this.kf(bit, "rotation", [[s, 0], [s + dur, (i % 2 ? 1 : -1) * (180 + (i % 3) * 120)]], "SlowOut");
      this.kf(bit, "scale.x", [[s, 0.001], [s + 5, 1]], "SpringOut");
      this.kf(bit, "scale.y", [[s, 0.001], [s + 5, 1]], "SpringOut");
      this.fade(bit, s + Math.max(4, dur - 14), 12, 100, 0, "SlowOut");
      bits.push(bit);
    }
    return bits;
  },

  /** Row of five rating stars, filled up to the value, optionally popping in. */
  stars(name, value, x, y, size, o) {
    o = o || {};
    const out = [];
    const n = o.count || 5, gap = size * 1.16;
    for (let i = 0; i < n; i++) {
      const star = this.star(name + " " + (i + 1), size, {
        fill: i < value ? (o.color || "#FBBF24") : (o.emptyColor || "#334155"),
        innerRadius: size * 0.24, points: 4,
        x: x + (i - (n - 1) / 2) * gap, y: y
      });
      if (o.pop) this.pop(star, o.pop[0] + i * (o.stagger || 3), o.pop[1] || 14, { from: 0.001, ease: "SpringOut" });
      out.push(star);
    }
    return out;
  },

  /** Filled status circle with a check glyph. */
  checkBadge(name, x, y, size, color, o) {
    o = o || {};
    const circle = this.circle(name, (size || 42) / 2, { fill: color || "#10B981", x: x, y: y });
    if (o.glow) this.glow(circle, color || "#10B981", o.glow, o.glowIntensity == null ? 1.6 : o.glowIntensity);
    const check = this.text(o.glyph || "\\u2713", Math.round((size || 42) * 0.55), {
      color: o.textColor || "#04120C", x: x, y: y, name: name + " Check"
    });
    return { circle: circle, check: check };
  },

  /** Polyline sparkline: segments draw sequentially, endpoint dot pops. */
  sparkline(name, pts, w, h, x, y, color, width, o) {
    o = o || {};
    const arr = Array.isArray(pts) && pts.length > 1 ? pts : [20, 60, 40, 90, 70, 100];
    const vals = arr.map(function (p) { return Array.isArray(p) ? Number(p[1]) || 0 : Number(p) || 0; });
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const span = (max - min) || 1;
    const mapped = vals.map(function (v, i) {
      return [x - w / 2 + (i / (vals.length - 1)) * w, y - h / 2 + ((v - min) / span) * h * 0.8 + h * 0.1];
    });
    const segments = [];
    const stagger = o.stagger == null ? 4 : o.stagger, start = o.start || 0;
    for (let i = 1; i < mapped.length; i++) {
      const a = mapped[i - 1], b = mapped[i];
      const seg = this.line(name + " Segment " + i, a[0], a[1], b[0], b[1], width || 4, color || "#10B981", {
        draw: [start + (i - 1) * stagger, start + (i - 1) * stagger + (o.segmentDuration || 12)]
      });
      if (o.glow) this.glow(seg, color || "#10B981", o.glow, o.glowIntensity == null ? 1.4 : o.glowIntensity);
      segments.push(seg);
    }
    const last = mapped[mapped.length - 1];
    const dot = this.dot(name + " Endpoint", last[0], last[1], o.dotSize || 14, color || "#10B981", { glow: 18, glowIntensity: 1.8 });
    if (o.pop !== false) this.pop(dot, start + (mapped.length - 2) * stagger, 14, { from: 0.001, ease: "SpringOut" });
    return { segments: segments, dot: dot, points: mapped };
  },

  /** Pointer triangle + name pill grouped on a null for easy movement. */
  cursor(name, x, y, color, label, o) {
    o = o || {};
    const group = this.layer("null", name, { position: [x, y] });
    const pointer = this.poly(name + " Pointer", o.size || 30, 3, {
      fill: color || "#8B5CF6", x: x, y: y, rotation: o.rotation == null ? -35 : o.rotation
    });
    const tag = this.badge(name + " Tag", label || "Guest", x + 74, y - 20, {
      fill: color || "#8B5CF6", color: o.textColor || "#0B0C10", fontSize: o.fontSize || 12, height: o.height || 26
    });
    api.parent(pointer, group);
    api.parent(tag.pill, group);
    api.parent(tag.text, group);
    return { group: group, pointer: pointer, pill: tag.pill, label: tag.text };
  },

  /** Switch track + knob; caller animates knob x and the "on" overlay. */
  toggle(name, x, y, o) {
    o = o || {};
    const w = o.width || 84, h = o.height || 40;
    const track = this.rect(name + " Track", w, h, { fill: o.offColor || "#334155", radius: h / 2, x: x, y: y });
    const on = this.rect(name + " On", w, h, { fill: o.onColor || "#10B981", radius: h / 2, x: x, y: y });
    this.alpha(on, 0);
    const knob = this.circle(name + " Knob", h / 2 - 5, { fill: "#F8FAFC", x: x - w / 2 + h / 2, y: y });
    return { track: track, on: on, knob: knob, w: w, h: h };
  }
};
`,Ot=`
var __mgApplyManifest = function (manifest) {
  var read = function (fn) { try { return fn(); } catch (e) { return null; } };
  var out = { ok: true, created: {}, ops: [], errors: [] };
  var spec = manifest && typeof manifest === "object" ? manifest : {};
  var resolve = function (target) {
    var text = String(target == null ? "" : target).trim();
    if (!text) return null;
    if ((text.charAt(0) === "$" || text.charAt(0) === "@") && typeof _mg.aliases === "function") {
      var map = _mg.aliases();
      var key = text.slice(1);
      if (map["@" + key]) return map["@" + key];
      if (map[text]) return map[text];
      return null;
    }
    return text;
  };
  var runOp = function (index, op) {
    var name = op && typeof op === "object" ? String(op.op || "") : "";
    try {
      if (name === "set") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        _mg.set(id, op.attrs || {});
        return "set " + String(op.target);
      }
      if (name === "keyframe") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        var frames = Array.isArray(op.frames) ? op.frames : [];
        for (var f = 0; f < frames.length; f++) {
          api.keyframe(id, Math.round(Number(frames[f].frame)), frames[f].attrs || {});
        }
        var easings = op.easing == null ? [] : (Array.isArray(op.easing) ? op.easing : [op.easing]);
        for (var e = 0; e < easings.length; e++) {
          var ease = easings[e];
          if (!ease || !ease.attr) continue;
          var at = ease.frame != null ? Math.round(Number(ease.frame)) : (frames.length ? Math.round(Number(frames[frames.length - 1].frame)) : 0);
          api.magicEasing(id, String(ease.attr), at, String(ease.easing || "Custom"), ease.expression);
        }
        return "keyframe " + String(op.target) + " x" + frames.length;
      }
      if (name === "easing") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        api.magicEasing(id, String(op.attr), Math.round(Number(op.frame)), String(op.easing || "Custom"), op.expression);
        return "easing " + String(op.attr) + " " + String(op.easing);
      }
      if (name === "connect") {
        var src = resolve(op.from);
        var dst = resolve(op.to);
        if (!src || !dst) throw new Error("unknown connect endpoint " + String(op.from) + " -> " + String(op.to));
        api.connect(src, String(op.fromAttr), dst, String(op.toAttr), op.force === true);
        return "connect " + String(op.from) + "." + String(op.fromAttr) + " -> " + String(op.to) + "." + String(op.toAttr);
      }
      if (name === "expression") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        api.setAttributeExpression(id, String(op.attrPath), String(op.expression));
        return "expression " + String(op.attrPath);
      }
      if (name === "delete") {
        var targets = Array.isArray(op.targets) ? op.targets : [];
        for (var d = 0; d < targets.length; d++) {
          var id = resolve(targets[d]);
          if (id) api.deleteLayer(id);
        }
        return "delete x" + targets.length;
      }
      if (name === "order") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        var orderFns = {
          forward: function () { api.bringForward(); },
          front: function () { api.bringToFront(); },
          backward: function () { api.moveBackward(); },
          back: function () { api.moveToBack(); }
        };
        var orderFn = orderFns[String(op.to)];
        if (!orderFn) throw new Error("to must be one of forward, front, backward, back");
        var prev = api.getSelection();
        api.select([id]);
        try { orderFn(); } finally { try { api.select(prev); } catch (e2) {} }
        return "order " + String(op.to);
      }
      if (name === "fit") {
        var id = resolve(op.target);
        if (!id) throw new Error("unknown target " + String(op.target));
        var box = op.box || {};
        var opts = { space: op.space || "comp", tolerance: op.tolerance, preserveAspect: op.preserveAspect === true };
        if (op.compWidth != null) opts.compWidth = Number(op.compWidth);
        if (op.compHeight != null) opts.compHeight = Number(op.compHeight);
        _mg.fitToBounds(id, { x: Number(box.x) || 0, y: Number(box.y) || 0, width: Number(box.width) || 0, height: Number(box.height) || 0 }, opts);
        return "fit " + String(op.target);
      }
      throw new Error("unknown op '" + name + "'");
    } catch (err) {
      out.ok = false;
      out.errors.push(String(err && err.message ? err.message : err));
      return { error: String(err && err.message ? err.message : err) };
    }
  };
  var record = function (index, op, label) {
    if (typeof label === "string") out.ops.push({ index: index, op: String(op.op), target: op.target != null ? String(op.target) : undefined, ok: true });
    else out.ops.push({ index: index, op: String(op.op), target: op.target != null ? String(op.target) : undefined, ok: false, error: label.error });
  };
  if (spec.comp && typeof _mg.comp === "function") {
    read(function () {
      _mg.comp(
        spec.comp.width != null ? Number(spec.comp.width) : undefined,
        spec.comp.height != null ? Number(spec.comp.height) : undefined,
        spec.comp.fps != null ? Number(spec.comp.fps) : undefined,
        spec.comp.endFrame != null ? Number(spec.comp.endFrame) : undefined,
        spec.comp.bg
      );
    });
  }
  var layers = Array.isArray(spec.layers) ? spec.layers : [];
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var handle = String(layer.as || "").trim();
    try {
      var id = null;
      if (layer.kind === "shape") {
        id = _mg.shape(String(layer.shape), layer.name || handle, layer.attrs || {});
      } else if (layer.kind === "layer") {
        id = _mg.layer(String(layer.layerType), layer.name || handle, layer.attrs || {});
      } else if (layer.kind === "text") {
        var textAttrs = Object.assign({}, layer.attrs || {});
        if (layer.font) textAttrs.font = { font: String(layer.font), style: "Regular" };
        id = _mg.text(String(layer.text), layer.size != null ? Number(layer.size) : undefined, layer.color, textAttrs);
      } else if (layer.kind === "svg") {
        var ids = read(function () { return api.convertSVGToLayers(String(layer.file)); });
        if (!Array.isArray(ids) || !ids.length) throw new Error("convertSVGToLayers returned no layers for " + String(layer.file));
        id = ids[0];
        if (layer.name) read(function () { return api.rename(id, String(layer.name)); });
        if (layer.attrs && Object.keys(layer.attrs).length) _mg.set(id, layer.attrs);
        for (var s = 1; s < ids.length; s++) out.created[handle + "_" + s] = String(ids[s]);
      } else if (layer.kind === "image") {
        id = api.create("image", layer.name || handle);
        _mg.set(id, Object.assign({ assetPath: String(layer.file) }, layer.attrs || {}));
      } else {
        throw new Error("unknown layer kind '" + String(layer.kind) + "'");
      }
      if (handle) {
        _mg.alias(id, handle);
        out.created[handle] = String(id);
      }
      out.ops.push({ index: i, op: "create:" + String(layer.kind), target: handle, ok: true });
    } catch (err) {
      out.ok = false;
      var message = String(err && err.message ? err.message : err);
      out.errors.push("layer " + handle + ": " + message);
      out.ops.push({ index: i, op: "create:" + String(layer.kind || "?"), target: handle, ok: false, error: message });
    }
  }
  var ops = Array.isArray(spec.ops) ? spec.ops : [];
  for (var o = 0; o < ops.length; o++) record(o, ops[o], runOp(o, ops[o]));
  return out;
};
`;var Xn=`
var __stallionReceipt = (function () {
	var MAX_CONSOLE_ENTRIES = 64;
	var MAX_CONSOLE_TEXT = 240;
	var MAX_BEAT_FRAMES = 32;
	var MAX_BEAT_LAYERS = 50;
	var MAX_DIGEST_LAYERS = 400;
	var read = function (fn) { try { return fn(); } catch (e) { return null; } };
	var num = function (v) { return typeof v === 'number' && isFinite(v) ? v : 0; };
	function digest(input) {
		var hi = 0x811c9dc5, lo = 0x1b873593;
		for (var i = 0; i < input.length; i++) {
			var ch = input.charCodeAt(i);
			hi = Math.imul((hi ^ (ch & 0xff)) >>> 0, 0x01000193) >>> 0;
			lo = Math.imul((lo ^ ((ch >>> 8) & 0xff)) >>> 0, 0x01000193) >>> 0;
		}
		function hex(n) { var out = ''; for (var s = 28; s >= 0; s -= 4) out += ((n >>> s) & 0xf).toString(16); return out; }
		return hex(hi) + hex(lo);
	}
	function facts() {
		var layers = [], connections = [];
		var ids = read(function () { return api.getCompLayers(false); });
		if (!Array.isArray(ids)) return { layers: layers, connections: connections };
		ids = ids.slice(0, MAX_DIGEST_LAYERS);
		for (var i = 0; i < ids.length; i++) {
			var id = String(ids[i]);
			var type = String(read(function () { return api.getLayerType(id); }) ?? '?');
			var keyframes = 0;
			var animated = read(function () { return api.getAnimatedAttributes(id); });
			if (Array.isArray(animated)) {
				for (var j = 0; j < animated.length; j++) {
					var attr = animated[j];
					var times = read(function () { return api.getKeyframeTimes(id, attr); });
					if (Array.isArray(times)) keyframes += times.length;
				}
			}
			layers.push({ id: id, type: type, keyframes: keyframes });
			var incoming = read(function () { return api.getInConnectedAttributes(id); });
			if (Array.isArray(incoming)) {
				for (var k = 0; k < incoming.length; k++) connections.push(id + '<-' + String(incoming[k]));
			}
		}
		layers.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
		connections.sort();
		return { layers: layers, connections: connections };
	}
	function hash(f) {
		var parts = [];
		for (var i = 0; i < f.layers.length; i++) parts.push(f.layers[i].id + ':' + f.layers[i].type + '@k=' + f.layers[i].keyframes);
		return digest('nodes(' + parts.join(';') + ')conn(' + f.connections.join(';') + ')');
	}
	function beatBoxes(ids, frames) {
		var out = {};
		var list = Array.isArray(frames) ? frames.slice(0, MAX_BEAT_FRAMES) : [];
		var layerIds = Array.isArray(ids) ? ids.filter(function (id, index, all) { return all.indexOf(id) === index; }).slice(0, MAX_BEAT_LAYERS) : [];
		var prevFrame = read(function () { return api.getFrame(); });
		try {
			for (var f = 0; f < list.length; f++) {
				var frame = Number(list[f]);
				if (!isFinite(frame)) continue;
				if (read(function () { return api.setFrame(frame); }) === null && typeof api.setFrame === 'function') continue;
				var boxes = {};
				for (var l = 0; l < layerIds.length; l++) {
					var layerId = layerIds[l];
					var bb = read(function () { return api.getBoundingBox(layerId, true); });
					if (!bb || typeof bb !== 'object') continue;
					var pivot = read(function () { return api.getPivotPosition(layerId); });
					var rotation = read(function () { return api.get(layerId, 'rotation'); });
					var box = {
						x: num(bb.x), y: num(bb.y),
						width: num(bb.width), height: num(bb.height),
						pivotX: 0, pivotY: 0, rotation: num(rotation)
					};
					if (pivot && typeof pivot === 'object') { box.pivotX = num(pivot.x); box.pivotY = num(pivot.y); }
					else if (Array.isArray(pivot)) { box.pivotX = num(pivot[0]); box.pivotY = num(pivot[1]); }
					boxes[layerId] = box;
				}
				out[String(frame)] = boxes;
			}
		} finally {
			if (prevFrame != null && typeof api.setFrame === 'function') read(function () { return api.setFrame(prevFrame); });
		}
		return out;
	}
	function consoleLines(entries) {
		var trimmed = Array.isArray(entries) ? entries.slice(0, MAX_CONSOLE_ENTRIES) : [];
		var out = [];
		for (var i = 0; i < trimmed.length; i++) {
			var text = String(trimmed[i].text == null ? '' : trimmed[i].text);
			out.push({ level: trimmed[i].level, text: text.length > MAX_CONSOLE_TEXT ? text.slice(0, MAX_CONSOLE_TEXT) + '\u2026' : text });
		}
		return out;
	}
	return { read: read, facts: facts, hash: hash, beatBoxes: beatBoxes, consoleLines: consoleLines };
})();
`.trim();var ge="batchEvalAndCapture",Pt={frames:64,ids:200,code:512e3};function Xe(n,e){return{kind:ge,seq:n.seq??null,ok:!1,transactionId:typeof n.transactionId=="string"?n.transactionId:"",executionTimeMs:0,compInfo:{width:null,height:null,fps:null,startFrame:null,endFrame:null},frames:{},error:{message:e}}}function Lt(n){let e=i=>({error:Xe(n,i)}),t=i=>typeof i=="string"&&i.trim().length>0&&!i.includes("\0");if(n.type!==ge)return e("Invalid batchEvalAndCapture type.");if(!t(n.transactionId))return e("transactionId must be a non-empty string.");if(!t(n.undoGroupName))return e("undoGroupName must be a non-empty string.");if(typeof n.code!="string"||n.code.length>Pt.code)return e("code must be a string of at most 512000 characters.");if(!Array.isArray(n.sampleFrames)||n.sampleFrames.length>Pt.frames||n.sampleFrames.some(i=>typeof i!="number"||!Number.isSafeInteger(i)||Math.abs(i)>1e9))return e("sampleFrames must contain at most 64 integer frames within +/-1000000000.");if(!Array.isArray(n.inspectLayerIds)||n.inspectLayerIds.length>Pt.ids||!n.inspectLayerIds.every(t))return e("inspectLayerIds must contain at most 200 non-empty logical aliases.");if(n.inspectLayerIds.length&&!n.sampleFrames.length)return e("Inspection requires at least one sample frame.");if(n.rollbackOnError!==void 0&&typeof n.rollbackOnError!="boolean")return e("rollbackOnError must be boolean.");if(n.rollbackStrategy!==void 0&&n.rollbackStrategy!=="undo"&&n.rollbackStrategy!=="checkpoint")return e('rollbackStrategy must be "undo" or "checkpoint".');let r=n.rollbackStrategy??"undo",a;if(r==="checkpoint"){if(n.rollbackOnError!==!0)return e('rollbackStrategy "checkpoint" requires rollbackOnError: true.');if(!t(n.checkpointPath))return e('rollbackStrategy "checkpoint" requires a non-empty checkpointPath.');if(a=n.checkpointPath.replace(/\\/g,"/"),!a.toLowerCase().endsWith(".cv"))return e("checkpointPath must name a .cv scene file.")}else if(n.checkpointPath!==void 0)return e('checkpointPath is only valid with rollbackStrategy "checkpoint".');let s;if(n.renderConfig!==void 0){let i=n.renderConfig;if(!i||typeof i!="object"||Array.isArray(i)||typeof i.enabled!="boolean"||typeof i.outputDir!="string"||i.outputDir.includes("\0"))return e("renderConfig requires enabled:boolean and outputDir:string.");if(i.scaleFactor!==void 0&&(typeof i.scaleFactor!="number"||!Number.isFinite(i.scaleFactor)||i.scaleFactor<.01||i.scaleFactor>4))return e("renderConfig.scaleFactor must be between 0.01 and 4.");if(i.enabled&&(!t(i.outputDir)||!n.sampleFrames.length))return e("Rendering requires outputDir and at least one sample frame.");s={enabled:i.enabled,outputDir:i.outputDir.replace(/\\/g,"/"),scaleFactor:i.scaleFactor??1}}return{job:{type:ge,transactionId:n.transactionId,undoGroupName:n.undoGroupName,code:n.code,sampleFrames:[...new Set(n.sampleFrames)],inspectLayerIds:[...new Set(n.inspectLayerIds)],renderConfig:s,rollbackOnError:n.rollbackOnError===!0,rollbackStrategy:r,checkpointPath:a,seq:n.seq??null}}}function Yn(n,e){let t=Date.now(),r={kind:"batchEvalAndCapture",seq:n.seq??null,transactionId:n.transactionId,ok:!0,executionTimeMs:0,compInfo:{width:null,height:null,fps:null,startFrame:null,endFrame:null},frames:Object.create(null),transformSpace:"local",transformNote:"bbox is world-space; worldTransform contains evaluated local position/scale/rotation/opacity (no verified world-transform API; rotation is the z spin of the {x,y,z} vector Cavalry 2.8 returns)."},a=w=>{let F=w,M=String(F?.message??w);if(r.error)r.error.message+="; "+M;else{r.error={message:M},typeof F?.stack=="string"&&(r.error.stack=F.stack);let L=F?.lineNumber??F?.line;typeof L=="number"&&Number.isFinite(L)&&(r.error.line=L)}r.ok=!1},s=w=>{try{w()}catch(F){a(F)}},i=(w,F)=>{if(typeof w!="number"||!Number.isFinite(w))throw new Error("Missing/non-finite metric: "+F);return w},o=(w,F)=>{let M=w;return[i(Array.isArray(M)?M[0]:M?.x,F+".x"),i(Array.isArray(M)?M[1]:M?.y,F+".y")]},l=(w,F)=>Array.isArray(w)?i(w[2],F+".z"):w&&typeof w=="object"?i(w.z,F+".z"):i(w,F),u=w=>{if(!w)throw new Error("No active composition.");let F=o(e.get(w,"resolution"),"resolution"),M,L;try{M=e.get(w,"startFrame")}catch{}try{L=e.get(w,"endFrame")}catch{}return{width:F[0],height:F[1],fps:i(e.get(w,"fps"),"fps"),startFrame:i(M??e.getInFrame(w),"startFrame"),endFrame:i(L??e.getOutFrame(w),"endFrame")}},p=globalThis,y=n.rollbackStrategy??"undo";r.rollbackStrategy=y;let k,g=Object.create(null),N,b,O=!1,x=!1,A=!1,T=e.endUndoGroup,U=e.undo,R=()=>{N!==void 0&&s(()=>{e.getActiveComp()!==N&&e.setActiveComp(N)}),b!==void 0&&s(()=>{e.getFrame()!==b&&e.setFrame(b)})};try{if(n.rollbackOnError&&y==="undo"&&typeof U!="function")throw new Error("Unsupported rollback: api.undo is unavailable/unverified; no checkpoint fallback is used.");if(y==="checkpoint"){if(typeof e.saveSceneAs!="function"||typeof e.openScene!="function"||typeof e.getSceneFilePath!="function"||typeof e.sceneHasUnsavedChanges!="function"||typeof e.filePathExists!="function"||typeof e.getFileSize!="function")throw new Error("Checkpoint rollback is unavailable: saveSceneAs/openScene/getSceneFilePath/sceneHasUnsavedChanges and file verification are required.")}else if(typeof e.startUndoGroup!="function"||typeof T!="function")throw new Error("Undo grouping is unavailable.");if(n.renderConfig?.enabled&&(typeof e.renderPNGFrame!="function"||typeof e.filePathExists!="function"||typeof e.getFileSize!="function"))throw new Error("PNG rendering/file verification is unavailable.");let w=new Function("api",`var __result; var returned = (function () {
`+n.code+`
})(); return typeof __result !== "undefined" ? __result : (typeof globalThis.__result !== "undefined" ? globalThis.__result : returned);`);if(y==="checkpoint"){let C=n.checkpointPath;if(r.checkpoint={path:C,saved:!1,committed:!1},e.sceneHasUnsavedChanges())throw new Error("Checkpoint rollback requires a clean scene (saved or blank); save the scene before live work.");if(e.filePathExists(C))throw new Error("Checkpoint path already exists; refusing to overwrite: "+C);if(r.checkpoint.originalScenePath=String(e.getSceneFilePath()??""),e.saveSceneAs(C)!==!0)throw new Error("saveSceneAs did not confirm the checkpoint save.");if(!e.filePathExists(C)||!(e.getFileSize(C)>0))throw new Error("Checkpoint save produced no file: "+C);A=!0,r.checkpoint.saved=!0,r.checkpoint.scenePathAfterSave=String(e.getSceneFilePath()??"")}N=e.getActiveComp(),b=i(e.getFrame(),"original frame"),r.compInfo=u(N),k=Object.getOwnPropertyDescriptors(p),p.__refcloneLayerMap=Object.create(null),p.__result=void 0,p.__stallionState=void 0,p.__stallionResult__=void 0;for(let C of["set","connect","startUndoGroup","endUndoGroup"])g[C]=Object.getOwnPropertyDescriptor(e,C);if(y==="undo"){let C=e.startUndoGroup,Y=()=>{throw new Error("The transaction owns its single undo group; code must not open/close groups.")};e.startUndoGroup=Y,e.endUndoGroup=Y,C.call(e,n.undoGroupName),O=!0}try{let C=w(e);if(C&&typeof C.then=="function")throw new Error("Asynchronous batch code is unsupported.");try{JSON.stringify(C)}catch{throw new Error("Script result was not serialisable.")}let Y=j=>{if(!j||typeof j!="object")return;let $=j;if($.ok===!1)throw $.error??new Error("Script __result.ok was false.");$.result&&Y($.result),$.__result&&Y($.__result)};Y(C)}finally{O&&(T.call(e),x=!0)}r.compInfo=u(e.getActiveComp());let F=p.__refcloneLayerMap;if(!F||typeof F!="object"||Array.isArray(F))throw new Error("__refcloneLayerMap must be an alias-to-layer-ID object.");let M=Object.create(null);for(let C of Object.keys(F)){let Y=F[C];if(typeof Y!="string"||!Y.trim())throw new Error("Invalid layer ID for alias: "+C);M[C]=Y}r.layerMap=M;for(let C of n.inspectLayerIds)if(!Object.prototype.hasOwnProperty.call(M,C))throw new Error("Missing inspection alias in current transaction: "+C);let L=n.renderConfig;if(L?.enabled&&typeof e.makeFolder=="function")try{e.makeFolder(L.outputDir)}catch{}for(let C of n.sampleFrames){if(e.setFrame(C)===!1)throw new Error("Could not sample frame "+C);let Y={layerMetrics:Object.create(null)};for(let j of n.inspectLayerIds){let $=M[j],J=e.getBoundingBox($,!0);if(!J)throw new Error("Missing bounding box for alias: "+j);let ue=i(J.x,j+".bbox.x"),c=i(J.y,j+".bbox.y"),m=i(J.width,j+".bbox.width"),d=i(J.height,j+".bbox.height"),S=o(e.get($,"position"),j+".position"),I=o(e.get($,"scale"),j+".scale");Y.layerMetrics[j]={bbox:{x:ue,y:c,width:m,height:d,centreX:i(J.centre?.x??ue+m/2,j+".centreX"),centreY:i(J.centre?.y??c+d/2,j+".centreY")},worldTransform:{posX:S[0],posY:S[1],scaleX:I[0],scaleY:I[1],rotation:l(e.get($,"rotation"),j+".rotation"),opacity:i(e.get($,"opacity"),j+".opacity")}}}if(L?.enabled){let j=L.outputDir.replace(/\/$/,"")+"/frame_"+C;if(e.renderPNGFrame(j,100*(L.scaleFactor??1))===!1)throw new Error("PNG render failed at frame "+C);let $=j+".png";if(!e.filePathExists($)||!(e.getFileSize($)>0))throw new Error("PNG render produced no file at frame "+C);Y.renderedPngPath=$}r.frames[String(C)]=Y}if(y==="checkpoint"&&A){let C=n.checkpointPath.replace(/\.cv$/i,"")+"-committed.cv";if(e.filePathExists(C))throw new Error("Checkpoint commit path already exists; refusing to overwrite: "+C);if(e.saveSceneAs(C)!==!0)throw new Error("saveSceneAs did not confirm the checkpoint commit.");if(!e.filePathExists(C)||!(e.getFileSize(C)>0))throw new Error("Checkpoint commit produced no file: "+C);r.checkpoint.committed=!0,r.checkpoint.commitPath=C,r.checkpoint.scenePathAfterCommit=String(e.getSceneFilePath()??"")}}catch(w){a(w)}finally{for(let w of Object.keys(g))s(()=>{if(g[w])Object.defineProperty(e,w,g[w]);else if(!Reflect.deleteProperty(e,w))throw new Error("Could not restore api."+w)});if(k){for(let w of Object.getOwnPropertyNames(p))Object.prototype.hasOwnProperty.call(k,w)||s(()=>{if(!Reflect.deleteProperty(p,w))throw new Error("Could not remove transient global "+w)});for(let w of Object.keys(k))s(()=>{Object.defineProperty(p,w,k[w])})}R(),!r.ok&&n.rollbackOnError&&(y==="undo"?O&&x&&typeof U=="function"&&(s(()=>{if(U.call(e)===!1)throw new Error("api.undo failed.")}),R()):A&&(s(()=>{if(e.openScene(n.checkpointPath,!0)===!1)throw new Error("openScene refused the checkpoint restore.");let w=String(e.getSceneFilePath()??"").replace(/\\/g,"/");if(w!==n.checkpointPath.replace(/\\/g,"/"))throw new Error("Checkpoint restore reported a different scene path: "+w);r.checkpoint.restored=!0,r.checkpoint.scenePathAfterRestore=w}),r.checkpoint.restored!==!0&&(r.checkpoint.restored=!1,r.checkpoint.sceneStateUnknown=!0),R())),r.ok||(r.frames=Object.create(null),delete r.layerMap),r.executionTimeMs=Math.max(0,Date.now()-t)}return r}function Bt(n,e){return`/* cavalry-mcp:atomic */(function () {
	var response = (${Yn.toString()})(${JSON.stringify(n)}, api);
	var payload = JSON.stringify(response);
	${e?`try { globalThis.__stallionResult__ = payload; } catch (e) {}
	try {
		var client = new api.WebClient(${JSON.stringify(e.origin)});
		${e.token?`client.setTokenAuthentication(${JSON.stringify(e.token)});`:""}
		client.post('/post', JSON.stringify({ type: '__stallion_result__', batchEvalAndCaptureResult: JSON.parse(payload) }), 'application/json');
	} catch (e) {}`:""}
	return JSON.parse(payload);
})()`}function Oe(n){return`var __mgEnv = (function () {
	var __g = typeof globalThis !== 'undefined' ? globalThis : this;
	try {
		if (__g._mg && typeof __g._mg.shape === 'function') return { mg: __g._mg, rb: __g._rb || null };
	} catch (e) {}
	${n}
	try { __g._mg = _mg; __g._rb = _rb; } catch (e) {}
	return { mg: _mg, rb: _rb };
})();
var _mg = __mgEnv.mg;
var _rb = __mgEnv.rb;
try {
	if (typeof api !== 'undefined' && api) {
		if (typeof api.startUndo !== 'function' && typeof api.startUndoGroup === 'function') {
			api.startUndo = function (name) { return api.startUndoGroup(String(name || 'Scene Execution')); };
		}
		if (typeof api.endUndo !== 'function' && typeof api.endUndoGroup === 'function') {
			api.endUndo = function () { return api.endUndoGroup(); };
		}
	}
} catch (e) {}`}var Zt=Object.freeze({neutral:Object.freeze({bgSurface:"#0F1115",cardFill:"#181B20",textPrimary:"#F3F4F6",textMuted:"#9CA3AF",accentPrimary:"#3B82F6",strokeColor:"#262A32",cardCornerRadius:12,layoutPadding:24}),matcha:Object.freeze({bgSurface:"#0D1512",cardFill:"#14221C",textPrimary:"#ECFDF5",textMuted:"#86EFAC",accentPrimary:"#10B981",strokeColor:"#1F352B",cardCornerRadius:14,layoutPadding:24}),gothic:Object.freeze({bgSurface:"#09090B",cardFill:"#121216",textPrimary:"#FAFAFA",textMuted:"#A1A1AA",accentPrimary:"#8B5CF6",strokeColor:"#27272A",cardCornerRadius:6,layoutPadding:20}),butter:Object.freeze({bgSurface:"#18150E",cardFill:"#241F14",textPrimary:"#FEFCE8",textMuted:"#FDE047",accentPrimary:"#EAB308",strokeColor:"#362E1D",cardCornerRadius:16,layoutPadding:24}),stone:Object.freeze({bgSurface:"#141413",cardFill:"#1F1E1D",textPrimary:"#F5F5F4",textMuted:"#A8A29E",accentPrimary:"#EA580C",strokeColor:"#2E2C2A",cardCornerRadius:8,layoutPadding:24}),chocolate:Object.freeze({bgSurface:"#16110E",cardFill:"#231B16",textPrimary:"#FAF5F0",textMuted:"#D6C2B2",accentPrimary:"#D97706",strokeColor:"#362922",cardCornerRadius:12,layoutPadding:24}),y2k:Object.freeze({bgSurface:"#0A0D1A",cardFill:"#131930",textPrimary:"#E0F2FE",textMuted:"#7DD3FC",accentPrimary:"#EC4899",strokeColor:"#253159",cardCornerRadius:20,layoutPadding:28})}),Ye=Object.freeze(["neutral","matcha","gothic","butter","stone","chocolate","y2k"]),Dt="neutral";function Ge(n=Dt){let e=typeof n=="string"?n.trim().toLowerCase():Dt,t=Object.prototype.hasOwnProperty.call(Zt,e)?e:Dt;return{themeName:t,...Zt[t]}}function qt(n,e,t){let r=n.slice(0,e),a=n.slice(e,t).replace(/[^\n\r]/g," "),s=n.slice(t);return r+a+s}function Gn(n){let e=String(n??""),t=e.indexOf("const _rb = (function ()"),r="Object.assign(_mg.theme, _mg.ASTRYX_THEMES.neutral",a=/\bsel\(\)\s*\{\s*return\s+api\.getSelection\(\)\[0\];\s*\}\s*\};/;if(t>=0){let o=-1,l=e.indexOf(r,t);if(l>=0){let u=e.indexOf("} catch (e) {}",l);u>=0&&(o=u+14)}if(o<0){let u=a.exec(e.slice(t));u&&(o=t+u.index+u[0].length)}o>t&&(e=qt(e,t,o))}let s=/(?:const|let|var)\s+_mg\s*=\s*\{[\s\S]*?\n\};/.exec(e);s&&(e=qt(e,s.index,s.index+s[0].length));let i=/var\s+__mgApplyManifest\s*=\s*function\s*\(manifest\)\s*\{[\s\S]*?\n\};/.exec(e);return i&&(e=qt(e,i.index,i.index+i[0].length)),e=e.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g,o=>o.replace(/[^\n\r]/g," ")),e}function Vn(n){return n>=90?"A":n>=75?"B":n>=60?"C":n>=50?"D":"F"}function Pe(n){let e=String(n??""),t=e.split(/\r?\n/),r=Gn(e),a=r.split(/\r?\n/),s=[],i=/\bapi\.startUndo(?:Group)?\s*\(/.test(r),o=/\btry\s*\{/.test(r),l=/\bfinally\s*\{/.test(r),u=/\bapi\.endUndo(?:Group)?\s*\(/.test(r),p=i&&o&&l&&u,y=/\b_mg\.undoGroup\s*\(/.test(r),k=0;!p&&!y&&(k=25,s.push({rule:"atomic_undo_safety",line:1,pointsDeducted:25,snippet:(t[0]??"").trim().slice(0,120),message:'Line 1: Missing atomic undo safety wrapper; wrap scene operations in `api.startUndo("..."); try { ... } finally { api.endUndo(); }`.'}));let g=0,N=/\bapi\.(create|set)\s*\(/g;for(let L=0;L<a.length;L++){let C=a[L],Y;for(N.lastIndex=0;(Y=N.exec(C))!==null;){let j=g<30?Math.min(5,30-g):0;g=Math.min(30,g+5);let $=L+1,J=Y[1],ue=J==="create"?"_mg.shape(), _mg.text(), or _mg.layer()":"_mg.set(layerId, attrs)";s.push({rule:"mg_primitive_purity",line:$,pointsDeducted:j,snippet:(t[L]??"").trim(),message:`Line ${$}: Replace raw \`api.${J}(\` with \`${ue}\`.`})}}let b=0,O=/(?<![A-Za-z0-9_])#[0-9A-Fa-f]{6}\b/g;for(let L=0;L<a.length;L++){let C=a[L];if(/\b_mg\.applySceneTheme\s*\(/.test(C))continue;let Y;for(O.lastIndex=0;(Y=O.exec(C))!==null;){let j=Y[0],$=b<25?Math.min(5,25-b):0;b=Math.min(25,b+5);let J=L+1;s.push({rule:"tokenized_styling",line:J,pointsDeducted:$,snippet:(t[L]??"").trim(),message:`Line ${J}: Replace hardcoded hex literal \`${j}\` with an \`_mg.theme.*\` token (e.g. \`_mg.theme.cardFill\`, \`_mg.theme.textPrimary\`, \`_mg.theme.accentPrimary\`).`})}}let x=0,A=/\b(?:for|while)\s*\([^)]*\)\s*\{[\s\S]*?\b(?:api\.keyframe|_mg\.keyframe)\s*\([\s\S]*?\}/g,T;for(;(T=A.exec(r))!==null;){let C=r.slice(0,T.index).split(/\r?\n/).length,Y=x<20?Math.min(10,20-x):0;x=Math.min(20,x+10),s.push({rule:"procedural_motion_purity",line:C,pointsDeducted:Y,snippet:(t[C-1]??"").trim(),message:`Line ${C}: Replace frame-by-frame keyframe loop with procedural \`_mg.spring()\`, \`_mg.modulate()\`, or \`_mg.stagger()\`.`})}let U=k+g+b+x,R=Math.max(0,100-U),w=Vn(R),F=R>=75,M="";if(!F||s.length>0){let L=s.map(C=>C.message).join(" ");M=`Refactor this Cavalry script to achieve Grade A _mg purity (current score: ${R}/100, grade: ${w}): call _mg.applySceneTheme("neutral") inside an atomic api.startUndo(...) / try { ... } finally { api.endUndo(); } block and apply these exact line fixes: ${L}`}return{score:R,grade:w,passed:F,breakdown:{atomicUndoSafety:25-k,mgPrimitivePurity:30-g,tokenizedStyling:25-b,proceduralMotionPurity:20-x},violations:s,autoFixPrompt:M}}function Ve(n,e="neutral"){let t=String(n??""),r=typeof e=="string"&&e.trim()?e.trim().toLowerCase():"neutral";if(/\b_mg\.applySceneTheme\s*\(/.test(t))return t;let s=`_mg.applySceneTheme(${JSON.stringify(r)});`;return/\bapi\.startUndo(?:Group)?\s*\(/.test(t)&&/\btry\s*\{/.test(t)?t.replace(/\btry\s*\{/,`try {
  ${s}`):/\b_mg\.undoGroup\s*\(/.test(t)&&/\boperations\s*:\s*\(\s*\)\s*=>\s*\{/.test(t)?t.replace(/\boperations\s*:\s*\(\s*\)\s*=>\s*\{/,`operations: () => {
    ${s}`):`api.startUndo("Stallion Scene Execution");
try {
  ${s}
${t}
} finally {
  api.endUndo();
}`}import en from"node:vm";function Ie(n,e,t={}){let r=[],a={log:(...x)=>r.push({level:"log",text:x.map(String).join(" ")}),info:(...x)=>r.push({level:"info",text:x.map(String).join(" ")}),warn:(...x)=>r.push({level:"warn",text:x.map(String).join(" ")}),error:(...x)=>r.push({level:"error",text:x.map(String).join(" ")})},i=n.startsWith("/* cavalry-mcp:atomic */")?n:`(function () {
		if (typeof api.startUndoGroup === 'function') api.startUndoGroup('AI Motion Batch');
		try {
			return (function () { ${n}
})();
		} finally {
			if (typeof api.endUndoGroup === 'function') api.endUndoGroup();
		}
	})()`,o=new Set(e.scene.layers.keys()),l={api:e,console:a,__result:void 0,__stallionState:void 0,cavalry:{versionLessThan:()=>!1,Path:class{d="";setD(x){return this.d=String(x),this}}}},u,p=null,y=null;try{if(t.context){let x=t.context;x.__result=void 0,x.__stallionState=void 0,x.__stallionRunConsole=a,u=en.runInContext(`var __returned = (${i}); typeof __result === 'undefined' ? __returned : __result`,t.context,{timeout:3e4})}else u=en.runInNewContext(`var __returned = (${i}); typeof __result === 'undefined' ? __returned : __result`,l,{timeout:3e4})}catch(x){let A=x;p=String(A?.message??A),y=A?.stack??null}if(t.verbose&&r.length)for(let x of r)process.stderr.write(`[mock:${x.level}] ${x.text}
`);let k=[...e.scene.layers.keys()].filter(x=>!o.has(x)),g=e.scene.activeComp(),N={},b=[...new Set([...k,...e.scene.selection])].slice(0,50);for(let x of b){let A=e.scene.boundingBox(x);A&&(N[x]={x:A.x,y:A.y,width:A.width,height:A.height,left:A.left,right:A.right,top:A.top,bottom:A.bottom,centre:A.centre})}e.appendJsLog([...r,...e.scene.diagnostics]);let O={seq:null,status:p?"error":"ok",errorStack:y,createdLayerIds:k,activeSelection:[...e.scene.selection],compInfo:g?{id:g.id,name:g.name,fps:g.fps,startFrame:g.startFrame,endFrame:g.endFrame,resolution:[g.width,g.height],width:g.width,height:g.height}:null,boundingBoxes:N,durationMs:0,writtenAt:new Date().toISOString()};return e.scene.diagnostics.length&&(O.diagnostics=e.scene.diagnostics.slice()),{result:u,error:p,stack:y,console:r,state:O}}var Wn=32*1024*1024;function tn(n,e){return e?(n.headers.authorization??"")===`Bearer ${e}`:!0}function ye(n){return new Promise((e,t)=>{let r=[],a=0;n.on("data",s=>{if(a+=s.length,a>Wn){t(new Error("request body too large")),n.destroy();return}r.push(s)}),n.on("end",()=>e(Buffer.concat(r).toString("utf8"))),n.on("error",t)})}function nn(n,e){let t=n.searchParams,r=(...l)=>{for(let u of l){let p=t.get(u);if(p!==null)return p}return null},a={type:e,seq:r("seq")??`get-${e}-${Date.now()}`},s=r("frame","t");if(s!==null&&(a.frame=s),e==="snapshot"||e==="snapshot-batch"){let l=r("scale","resolutionScale");l!==null&&(a.scale=l);let u=r("outDir","out");u!==null&&(a.outDir=u);let p=r("fileName","name");if(p!==null&&(a.fileName=p),e==="snapshot-batch"){let y=r("frames");y!==null&&(a.frames=y.split(",").map(N=>N.trim()).filter(Boolean));let k=r("layerIds");k!==null&&(a.layerIds=k.split(",").map(N=>N.trim()).filter(Boolean));let g=r("attrs");g!==null&&(a.attrs=g.split(",").map(N=>N.trim()).filter(Boolean)),/^(1|true|yes)$/i.test(r("includeHidden")??"")&&(a.includeHidden=!0)}}else{let l=r("offset");l!==null&&(a.offset=l);let u=r("limit");u!==null&&(a.limit=u);let p=r("budgetMs","budget");p!==null&&(a.budgetMs=p);let y=r("attrs","attributes");y!==null&&(/^(1|true|yes)$/i.test(y)?a.attributes=!0:a.attrs=y.split(",").map(k=>k.trim()).filter(Boolean))}let i=r("comp","compId");i!==null&&(a.compId=i);let o=r("mgCall");return o!==null&&(a.mgCall=o),a}function zt(n,e){let t=n.inline??e.searchParams.get("inline")??"1";return t!==!1&&!/^(0|false)$/i.test(String(t))}import fn from"node:fs";var rn=4.5,an=3,sn=24,on=.05,ln=.25,jt=[0,.25,.5,.75,1],Kn=.6,Jn=2,Qn=/^#([0-9a-f]{3,8})$/i,Zn=/^rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i,er={black:"#000000",white:"#ffffff",red:"#ff0000",green:"#008000",blue:"#0000ff",grey:"#808080",gray:"#808080",transparent:"#00000000"};function Fe(n){if(typeof n=="number"&&Number.isFinite(n)){let s=Math.max(0,Math.round(n))>>>0;return{r:s>>16&255,g:s>>8&255,b:s&255,a:1}}if(typeof n!="string")return null;let e=n.trim().toLowerCase(),t=er[e];if(t)return Fe(t);let r=Qn.exec(e);if(r){let s=r[1];if(s.length===3||s.length===4){let[i,o,l,u]=s.split("");return{r:Number.parseInt(i+i,16),g:Number.parseInt(o+o,16),b:Number.parseInt(l+l,16),a:u===void 0?1:Number.parseInt(u+u,16)/255}}return s.length===6||s.length===8?{r:Number.parseInt(s.slice(0,2),16),g:Number.parseInt(s.slice(2,4),16),b:Number.parseInt(s.slice(4,6),16),a:s.length===8?Number.parseInt(s.slice(6,8),16)/255:1}:null}let a=Zn.exec(e);if(a){let s=o=>o.endsWith("%")?Number.parseFloat(o)/100*255:Number.parseFloat(o),i=a[4]===void 0?1:a[4].endsWith("%")?Number.parseFloat(a[4])/100:Number.parseFloat(a[4]);return{r:s(a[1]),g:s(a[2]),b:s(a[3]),a:i}}return null}function We(n){let e=t=>{let r=Math.max(0,Math.min(255,t))/255;return r<=.03928?r/12.92:Math.pow((r+.055)/1.055,2.4)};return .2126*e(n.r)+.7152*e(n.g)+.0722*e(n.b)}function $t(n,e){let t=We(n),r=We(e);return(Math.max(t,r)+.05)/(Math.min(t,r)+.05)}function cn(n,e,t){if(n.getAttr(e,"hidden")===!0||t<e.inFrame||t>e.outFrame)return!1;let r=1,a=e,s=0;for(;a&&s<32;){if(n.getAttr(a,"hidden")===!0)return!1;r*=Number(n.getAttr(a,"opacity"))||0,a=a.parentId?n.layer(a.parentId):null,s+=1}return r>=Kn}function tr(n,e){let t=[n.getAttr(e,"material.materialColor"),n.getAttr(e,"materialColor"),n.getAttr(e,"color")];for(let r of t){let a=Fe(r);if(a)return a}return null}function un(n,e){let t=n.boundingBox(e);return t?{left:t.left,right:t.right,top:t.top,bottom:t.bottom,width:t.width,height:t.height}:null}function nr(n,e,t){return e>=n.left&&e<=n.right&&t>=n.top&&t<=n.bottom}function rr(n,e,t,r,a){let s=n.comps.get(e);if(!s)return null;let i=s.layerIds.indexOf(t.id),o=(a.left+a.right)/2,l=(a.top+a.bottom)/2;for(let u=i-1;u>=0;u-=1){let p=n.layer(s.layerIds[u]);if(!p||p.type==="textShape"||!cn(n,p,r))continue;let y=un(n,p.id);if(!y||!nr(y,o,l))continue;let k=Fe(n.getAttr(p,"material.materialColor"));if(k&&k.a>=.5)return k}return Fe(s.bgColor)}function Le(n){return Math.round(n*100)/100}function ar(n,e,t){let r=n.comps.get(e);if(!r)return[];if(Array.isArray(t.frames)&&t.frames.length)return[...new Set(t.frames.map(i=>Math.round(Number(i))).filter(i=>Number.isFinite(i)))].filter(i=>i>=r.startFrame&&i<=r.endFrame).sort((i,o)=>i-o);let a=t.sampleFractions?.length?t.sampleFractions:jt,s=r.endFrame-r.startFrame;return[...new Set(a.map(i=>Math.round(r.startFrame+s*Math.max(0,Math.min(1,i)))))].sort((i,o)=>i-o)}function Be(n,e={}){let t=e.compId?n.comps.get(e.compId)??null:n.activeComp(),r={contrast:0,overlap:0,"title-safe":0};if(!t)return{passed:!0,compId:null,frames:[],checked:{frames:0,textLayers:0},findings:[],counts:r};let a=e.bodyContrast??4.5,s=e.largeContrast??3,i=e.largeTextPx??24,o=e.titleSafeMargin??.05,l=e.overlapRatio??.25,u=e.maxFindings??64,p=ar(n,t.id,e),y=t.width/2,k=t.height/2,g={left:-y+t.width*o,right:y-t.width*o,top:-k+t.height*o,bottom:k-t.height*o},N=new Map,b=(T,U,R,w)=>{let F=`${T}|${U.join("|")}`,M=N.get(F);if(M){M.frames.includes(R)||M.frames.push(R);return}N.size>=u||N.set(F,{rule:T,level:"error",layers:U,frames:[R],detail:w})},O=n.frame,x=0;try{for(let T of p){n.frame=T;let U=[];for(let R of t.layerIds){let w=n.layer(R);if(!w||w.type!=="textShape"||!cn(n,w,T))continue;let F=String(n.getAttr(w,"text")??"").trim();if(F.length<Jn)continue;let M=un(n,R);if(!M||M.width<1||M.height<1)continue;let L=tr(n,w);if(!L||L.a<.5)continue;let C=Math.abs(Number(n.getAttr(w,"fontSize"))||24);U.push({layer:w,box:M,text:F,size:C,color:L})}x=Math.max(x,U.length);for(let R of U){let w=rr(n,t.id,R.layer,T,R.box);if(!w)continue;let F=R.size>=i?s:a,M=$t(R.color,w);M+1e-9<F&&b("contrast",[R.layer.id],T,`"${R.text.slice(0,24)}" (${R.layer.name}) is ${Le(M)}:1; needs ${F}:1 at ${Math.round(R.size)}px`),(R.box.left<g.left||R.box.right>g.right||R.box.top<g.top||R.box.bottom>g.bottom)&&b("title-safe",[R.layer.id],T,`"${R.text.slice(0,24)}" (${R.layer.name}) escapes the 90% title-safe box [${Le(g.left)}, ${Le(g.top)}, ${Le(g.right)}, ${Le(g.bottom)}]`)}for(let R=0;R<U.length;R+=1)for(let w=R+1;w<U.length;w+=1){let F=U[R],M=U[w],L=Math.min(F.box.right,M.box.right)-Math.max(F.box.left,M.box.left),C=Math.min(F.box.bottom,M.box.bottom)-Math.max(F.box.top,M.box.top);if(L<=0||C<=0)continue;let Y=Math.min(F.box.width*F.box.height,M.box.width*M.box.height);if(Y<=0)continue;let j=L*C/Y;j>l&&b("overlap",[F.layer.id,M.layer.id],T,`"${F.text.slice(0,16)}" \xD7 "${M.text.slice(0,16)}" overlap ${Math.round(j*100)}% of the smaller text box`)}}}finally{n.frame=O}let A=[...N.values()].map(T=>({...T,frames:[...T.frames].sort((U,R)=>U-R)})).sort((T,U)=>{let R=["contrast","overlap","title-safe"],w=R.indexOf(T.rule)-R.indexOf(U.rule);return w!==0?w:T.layers.join("|").localeCompare(U.layers.join("|"))});for(let T of A)r[T.rule]+=1;return{passed:A.length===0,compId:t.id,frames:p,checked:{frames:p.length,textLayers:x},findings:A,counts:r}}function dn(n,e,t={}){return Be(n,{...t,frames:[e]})}function pn(n){if(n.passed)return[`PASS scene-lint: ${n.checked.textLayers} text layers over ${n.checked.frames} frames \u2014 contrast, overlap and title-safe`];let e=[`FAIL scene-lint: ${n.findings.length} findings (${n.counts.contrast} contrast, ${n.counts.overlap} overlap, ${n.counts["title-safe"]} title-safe) over ${n.checked.frames} frames`];for(let t of n.findings)e.push(`  [${t.rule}] ${t.detail} @ ${t.frames.join(", ")}`);return e}var Ht=["javaScriptShape","javaScriptUtility","javaScriptModifier","javaScriptDeformer","javaScriptEmitter","skslShader","skslFilter","preRenderExpression","postRenderExpression"],mn=["script","plugin","render","shape","utility","deformer","emitter","modifier"],Ut={script:["console","api","cavalry","ui"],plugin:["console","api","ctx","cavalry","ui","plugin","install"],render:["console","api","render"],shape:["console","ctx","cavalry"],utility:["console","ctx","cavalry"],deformer:["console","ctx","cavalry","def"],emitter:["console","ctx","cavalry"],modifier:["console","ctx","cavalry"]};function Ke(n){return typeof n=="string"&&Ht.includes(n)}function De(n){switch(n){case"javaScriptShape":return"shape";case"javaScriptUtility":return"utility";case"javaScriptModifier":return"modifier";case"javaScriptDeformer":return"deformer";case"javaScriptEmitter":return"emitter";case"preRenderExpression":case"postRenderExpression":case"renderSetupExpression":case"render":return"render";case"plugin":return"plugin";case"shape":case"utility":case"deformer":case"emitter":case"modifier":return n;default:return"script"}}function qe(n,e){let t=De(e),r=new Set(Ut[t]),a=["api","cavalry","ctx","def","ui","plugin","install","render"],s=String(n??"").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm," ").replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g,'""'),i=[],o=[];for(let l of a){if(r.has(l))continue;let u=new RegExp(`\\b${l}\\s*\\.\\s*([A-Za-z_]\\w*)`,"g");for(let p of s.matchAll(u)){let y=`${l}.${p[1]}`;i.includes(y)||(i.push(y),o.push({level:"error",text:`Context '${t}' (${e}) does not expose '${l}' (found '${y}'). Allowed globals: ${[...r].join(", ")}`}))}}return{valid:i.length===0,context:t,allowedGlobals:[...r],forbiddenUsages:i,diagnostics:o}}function Je(n){let e=String(n??"").trim(),t=[],r=[],a=[];if(!e)t.push("SkSL source is empty");else{let i=0;for(let o of e)if(o==="{"?i+=1:o==="}"&&(i-=1),i<0)break;i!==0&&t.push("SkSL syntax error: unbalanced braces `{}`"),/\b(?:half4|vec4|float4)\s+main\s*\(/.test(e)||t.push("SkSL shader must define a `half4 main(float2 fragCoord)` or `vec4 main(vec2 coord)` entry point"),/\bgl_FragColor\b/.test(e)&&r.push("SkSL uses return value from `main(float2 fragCoord)` instead of legacy GLSL `gl_FragColor`");for(let o of e.matchAll(/\buniform\s+(float|int|bool|half\d*|vec\d+|float\d+|mat\d+|shader)\s+([A-Za-z_]\w*)\s*;/g))a.push({type:o[1],name:o[2]})}let s=[...t.map(i=>({level:"error",text:i})),...r.map(i=>({level:"warn",text:i}))];return{valid:t.length===0,uniforms:a,errors:t,warnings:r,diagnostics:s}}function Qe(n){if(!n)return[];let e=String(n);if(!e.includes(`
`)&&(e.endsWith(".txt")||e.endsWith(".log")||e.includes("/")||e.includes("\\")))try{if(fn.existsSync(e))e=fn.readFileSync(e,"utf8");else return[]}catch{return[]}let t=[];for(let r of e.split(/\r?\n/)){let a=r.trim();if(!a)continue;let s=/^\[(ERROR|WARN|WARNING|INFO|LOG)\]\s*(.*)$/i.exec(a);if(s){let i=s[1].toLowerCase(),o=i==="warning"?"warn":i;t.push({level:o,text:s[2].slice(0,240)});continue}/\b(ReferenceError|TypeError|SyntaxError|Error|error)\b/.test(a)?t.push({level:"error",text:a.slice(0,240)}):/\b(warn|warning|Skipped layer|unknown attribute)\b/i.test(a)?t.push({level:"warn",text:a.slice(0,240)}):t.push({level:"info",text:a.slice(0,240)})}return t.slice(-64)}function be(n,e,t,r){let a={},s=r.slice(0,32);if(s.length){let u=n.frame;try{for(let p of s){n.frame=p;let y={};for(let k of t.slice(0,50)){let g=n.boundingBox(k),N=n.layer(k)&&Number(n.getAttr(n.layer(k),"rotation"))||0;g&&(y[k]={x:g.x,y:g.y,width:g.width,height:g.height,pivotX:g.centre.x,pivotY:g.centre.y,rotation:N})}a[String(p)]=y}}finally{n.frame=u}}let i=n.facts(),o=i.layers.map(u=>`${u.id}:${u.type}@k=${u.keyframes}`),l=e.slice(0,64).map(u=>({level:u.level,text:u.text.slice(0,240)}));for(let u of n.diagnostics){if(l.length>=64)break;l.push({level:u.level,text:u.text.slice(0,240)})}return{sceneStateHash:st(`nodes(${o.join(";")})conn(${i.connections.join(";")})`),consoleDiagnostics:l,beatBBoxes:a,lint:Be(n,s.length?{frames:s}:{})}}var et="0.11.0",le="__stallion_result__",sr="render-frames",or=64;function _n(n={}){let e=n.host??process.env.STALLION_HOST??"127.0.0.1",t=n.port??(Number(process.env.STALLION_PORT)||8080),r=n.token??process.env.STALLION_TOKEN??"",a=new we({strictSchema:n.strictSchema!==!1}),s=new xe(a,{render:(c,m,d,S,I)=>at(c,m,d,S,I)}),i=null,o=Promise.resolve(),l=null;if(n.preloadMg===!0){let c={log:()=>{},info:()=>{},warn:()=>{},error:()=>{}};l=hn.createContext({api:s,console:c,__result:void 0,__stallionState:void 0,cavalry:{versionLessThan:()=>!1,Path:class{d="";setD(m){return this.d=String(m),this}}}}),hn.runInContext(Oe(Te),l)}let u=()=>({kind:"status",stallion:`${et}-mock`,cavalry:"2.8.0-mock",scene:s.getSceneFilePath(),frame:a.frame,unSaved:s.sceneHasUnsavedChanges(),capabilities:{receipt:!0,renderFrames:!0,batchEvalAndCapture:!0,batchEvalAndCaptureRollback:!1,batchEvalAndCaptureCheckpoint:["saveSceneAs","openScene","getSceneFilePath","sceneHasUnsavedChanges","filePathExists","getFileSize"].every(c=>typeof s[c]=="function"),determinismCheck:!0,introspect:["state","layers","snapshot","snapshot-batch",de,Se,Ae,Me,_e,Ce],mgRuntime:!0,errorEnvelope:1,mock:!0},ts:Date.now()}),p=(c,m,d=200)=>{let S=JSON.stringify(m);c.writeHead(d,{"Content-Type":"application/json","Content-Length":Buffer.byteLength(S)}),c.end(S)},y=async c=>{let m=c.seq,S=(Array.isArray(c.frames)?c.frames:[]).map(W=>Math.round(Number(W))).filter(W=>Number.isFinite(W));if(!S.length||S.length>2e3)return{type:le,kind:"render-frames",seq:m,ok:!1,error:"render-frames requires 1..2000 frames"};let I=Number(c.resolutionScale),h=Number.isFinite(I)&&I>0?Math.min(4,Math.max(.01,I)):.5,f=c.format==="raw_rgba"?"raw_rgba":"png_buffer",E=typeof c.compId=="string"&&c.compId?c.compId:s.getActiveComp(),_=a.comps.get(E);if(!_)return{type:le,kind:"render-frames",seq:m,ok:!1,error:`no comp '${E}'`};let B=Math.max(1,Math.round(_.width*h)),q=Math.max(1,Math.round(_.height*h)),H=typeof c.outDir=="string"&&c.outDir.trim()?Ze.resolve(c.outDir.trim()):null,K=a.frame,z=[],G=[];try{for(let W of S)try{a.frame=W;let D=at(a,E,W,B,q),Z={frame:W,width:D.width,height:D.height};if(z.length<or){let oe=pe(D.rgba,D.width,D.height);Z.bytes=f==="raw_rgba"?D.rgba.length:oe.length,Z.bufferBase64=(f==="raw_rgba"?D.rgba:oe).toString("base64")}else Z.omitted="inline budget exhausted; raise outDir to write files instead";if(H){Q.mkdirSync(H,{recursive:!0});let oe=String(W).padStart(6,"0"),ze=Ze.join(H,`frame-${oe}.png`);Q.writeFileSync(ze,pe(D.rgba,D.width,D.height)),Z.file=ze}z.push(Z)}catch(D){G.push({frame:W,error:String(D?.message??D)})}}finally{a.frame=K}return{type:le,kind:"render-frames",seq:m,ok:z.length>0,format:f,scale:h,scalePercent:Math.round(h*100),compId:E,width:B,height:q,rendered:z,failed:G,receipt:be(a,[],[],[])}},k=(c,m,d)=>{let S=d.seq??null,I=Ie(c,s,{verbose:n.verbose,context:l??void 0});if(I.error!==null)return{...ie(m,ee.EXEC_FAILED,I.error,{seq:S,stack:I.stack??void 0})};let h=typeof I.result=="object"&&I.result!==null?I.result:{};return{type:le,kind:m,seq:S,...h,ok:h.ok!==!1}},g=(c,m)=>{let d=lt(c,m);return k(dt(d),c,m)},N=c=>{let m=c.seq??null,d=ct(c);if("error"in d)return ie(Ne,d.code,d.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0});let S=k(pt(d.job),Ne,c);if(S.ok===!0&&typeof S.file=="string"&&Q.existsSync(S.file))try{S.contentHash=Xt("sha256").update(Q.readFileSync(S.file)).digest("hex")}catch{}return S},b=c=>{let m=c.seq??null,d=ut(c);if("error"in d)return ie(Re,d.code,d.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0});let S=k(ft(d.job),Re,c),I=Array.isArray(S.frames)?S.frames:[];for(let h of I){let f=typeof h.file=="string"?h.file:"";if(!(!f||!Q.existsSync(f)))try{h.contentHash=Xt("sha256").update(Q.readFileSync(f)).digest("hex")}catch{}}return S},O=c=>{let m=Lt(c);if("error"in m)return{...m.error};let d=Ie(Bt(m.job),s,{verbose:n.verbose,context:l??void 0});return d.error!==null?{...Xe(c,d.error)}:d.result},x=c=>{let m=c.seq??null,d=mt(c);return"error"in d?ie(de,d.error.code,d.error.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0}):k(ht(d.job,Te,Ot),de,c)},A=new Map,T=c=>{let m=c.state;if(m&&typeof m=="object"&&!Array.isArray(m)&&Array.isArray(m.layers))return m;let d=typeof c.snapshotId=="string"?c.snapshotId.trim():"";if(!d)return null;let S=A.get(d);if(S)return S.state;let I=d.replace(/[^A-Za-z0-9_-]/g,"_").slice(0,80),h=Ze.join(s.getTempFolder(),`stallion-checkpoint-${I}.cv`);try{let f=JSON.parse(Q.readFileSync(h,"utf8"));if(f&&typeof f=="object"&&Array.isArray(f.layers))return f}catch{}return null},U=c=>{let m=c.seq??null,d=_t(c);return"error"in d?ie(Se,d.error.code,d.error.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0}):k(gt(d.job),Se,c)},R=c=>{let m=yt(c);return"error"in m?ie(Ae,m.error.code,m.error.error,{seq:c.seq??null,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0}):k(bt(m.job),Ae,c)},w=c=>{let m=vt(c).job,d=k(kt(m),Me,c),S=d.state;if(d.ok===!0&&S&&typeof S=="object")for(A.set(m.snapshotId,{capturedAt:Date.now(),state:S,tmpFile:typeof d.tmpFile=="string"?d.tmpFile:null});A.size>32;){let I=A.keys().next().value;if(I===void 0)break;A.delete(I)}return d},F=c=>{let m=c.seq??null,d=T(c);if(!d){let I=typeof c.snapshotId=="string"?c.snapshotId.trim():"";return ie(_e,"STALLION_UNKNOWN_SNAPSHOT",`rollback cannot resolve ${I?`snapshotId '${I}'`:"the request"}: no in-memory checkpoint, no temp-file copy, and no inline \`state\`.`,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0})}let S=xt({...c,state:d});return"error"in S?ie(_e,S.error.code,S.error.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0}):k(wt(S.job),_e,c)},M=c=>{let m=St(c,s.getTempFolder());if("error"in m)return ie(Ce,m.error.code,m.error.error,{seq:c.seq??null,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0});let d=k(At(m.job),Ce,c);if(d.ok!==!0)return d;let S=typeof d.file=="string"?d.file:"";if(!S||!Q.existsSync(S))return d;try{if(d.contentHash=Xt("sha256").update(Q.readFileSync(S)).digest("hex"),m.job.inline){let I=a.comps.get(String(d.compId??""))??a.activeComp(),h=Math.max(1,Math.round((I?.width??0)*m.job.scaleFactor)),f=Math.max(1,Math.round((I?.height??0)*m.job.scaleFactor)),E=`${S}.rgba`;if(I&&Q.existsSync(E)){let _=Q.readFileSync(E);_.length===h*f*4?(d.pngBase64=pe(_,h,f).toString("base64"),d.width=h,d.height=f):d.inlineNote=`sidecar length ${_.length} does not match ${h}x${f}x4`}}}catch{}return d},L=c=>{let m=c.seq??null,d=Mt(c);if("error"in d)return ie(Ee,d.code,d.error,{seq:m,mgCall:typeof c.mgCall=="string"?c.mgCall:void 0});let S=Tt(d.job),I=be(a,S.consoleDiagnostics,[],[]);return{type:le,kind:Ee,seq:m,ok:S.deterministic&&S.lint.passed,...S,receipt:I}},C=c=>{let m=c.seq??null,d=typeof c.code=="string"?c.code:"",S=typeof c.statePath=="string"&&c.statePath?c.statePath:null,I=typeof c.path=="string"&&c.path;if(I&&!d){let H=Q.existsSync(I);return{type:le,kind:"result",seq:m,ok:H,...H?{note:"file script executed (no captured result)"}:{error:`No script found at ${I}`}}}if(!d)return{type:le,kind:"result",seq:m,ok:!1,error:"Missing/empty `code` or `path` key in request"};let h=c.helpers===!0&&!d.includes("const _mg")?`${Oe(Te)}
${d}`:d,f=Array.isArray(c.beatFrames)?c.beatFrames.map(H=>Math.round(Number(H))).filter(H=>Number.isFinite(H)):[],E=Ie(h,s,{verbose:n.verbose,context:l??void 0}),_=[...new Set([...E.state.createdLayerIds??[],...E.state.activeSelection??[]])],B=be(a,E.console,_,f);if(S)try{Q.mkdirSync(Ze.dirname(S),{recursive:!0}),Q.writeFileSync(S,JSON.stringify({...E.state,seq:m,receipt:B}))}catch{}let q={type:le,kind:"result",seq:m,ok:E.error===null};return E.error!==null?(q.error=E.error,q.stack=E.stack):typeof E.result<"u"&&(q.result=E.result),q.receipt=B,q.state={...E.state,seq:m,receipt:B},q},Y=c=>{let m=c.seq??null,d=typeof c.type=="string"?c.type:"",S=typeof c.code=="string"?c.code:"";if(!S)return{type:le,kind:"result",seq:m,ok:!1,error:"Missing/empty `code` key in request"};let I=Array.isArray(c.beatFrames)?c.beatFrames.map(G=>Math.round(Number(G))).filter(G=>Number.isFinite(G)):[],h=[],f=[],E=[],_=!0,B;if(d.startsWith("javaScript")||d.startsWith("sksl")){let G=[];typeof c.targetId=="string"&&c.targetId?G=[c.targetId]:typeof c.layerId=="string"&&c.layerId?G=[c.layerId]:G=s.getSelection(),G.length||(G=[s.create(d)]);let W="expression";d==="javaScriptShape"?W="generator.expression":d.startsWith("sksl")&&(W="code");for(let D of G){if(s.getLayerType(D)!==d){let oe=s.getNiceName(D);f.push(String(oe)),E.push({level:"warn",text:`Stallion: Skipped layer '${String(oe)}' because it is not of type '${d}'`});continue}s.set(D,{[W]:S}),h.push(String(D)),typeof c.attachTo=="string"&&c.attachTo&&(d==="skslShader"?s.connect(D,"id",c.attachTo,"material.shader"):d==="skslFilter"&&s.connect(D,"id",c.attachTo,"filters"))}if(d.startsWith("sksl")){let D=Je(S);_=D.valid,B=D.uniforms,E.push(...D.diagnostics)}else{let D=qe(S,d);_=D.valid,E.push(...D.diagnostics)}}else if(d.toLowerCase().includes("render")){let G=s.getRenderQueueItems();!G.length&&c.autoCreateRenderQueueItem!==!1&&(G=[s.addRenderQueueItem()]);for(let D of G)s.get(D,"selected")&&(s.set(D,{[d]:S}),h.push(String(D)));let W=qe(S,"render");_=W.valid,E.push(...W.diagnostics)}E.length&&s.appendJsLog(E);let q=be(a,E,h,I),H=Qe(s.getJsLogPath()),K=De(d),z={...q,payloadType:Ke(d)?d:"javaScriptUtility",context:K,applied:h,skipped:f,jsLogDiagnostics:H,valid:_,...B?{uniforms:B}:{}};return{type:le,kind:"result",seq:m,ok:!0,applied:h,skipped:f,receipt:z}},j=(c,m,d)=>{if(c.ok!==!0)return;let S=Array.isArray(c.frames)?c.frames:[],I=a.comps.get(String(c.compId??""))??a.activeComp(),h=Number(c.scale);if(!zt(m,d)||!I||!Number.isFinite(h)||h<=0)return;let f=Math.max(1,Math.round(I.width*(h/100))),E=Math.max(1,Math.round(I.height*(h/100)));for(let _ of S.slice(0,16)){let B=typeof _.file=="string"?_.file:"",q=`${B}.rgba`;if(!B||!Q.existsSync(q))continue;let H=Q.readFileSync(q);H.length===f*E*4&&(_.pngBase64=pe(H,f,E).toString("base64"),_.width=f,_.height=E)}},$=ir.createServer((c,m)=>{(async()=>{let d=new URL(c.url??"/","http://localhost");if(!tn(c,r)){p(m,{error:"unauthorized"},401);return}if(c.method==="GET"&&d.pathname==="/"){let h=`Stallion mock bridge \u2014 POST /post, GET /get, GET /health, POST /execute, POST /render-frames, POST /batch-step, GET|POST /state, /layers, /frame, /snapshot, /snapshot-batch, /batch_inspect, /export_comp_rig_overrides, /checkpoint, /rollback, /render_frame_fast, /determinism-check
`;m.writeHead(200,{"Content-Type":"text/plain","Content-Length":Buffer.byteLength(h)}),m.end(h);return}if(c.method==="GET"&&d.pathname==="/health"){p(m,{version:et,status:"ok",purityGate:!0,themes:[...Ye]});return}if(c.method==="POST"&&d.pathname==="/execute"){let h={};try{let z=await ye(c);z.trim()&&(h=JSON.parse(z))}catch(z){let G=String(z?.message??z),W=/too large/i.test(G)?413:400;p(m,{ok:!1,error:G},W);return}let f=typeof h.script=="string"?h.script:typeof h.code=="string"?h.code:"",E=Ge(typeof h.theme=="string"?h.theme:"neutral");if(h.enforcePurity!==!1){let z=Pe(f);if(!z.passed){p(m,{error:"Purity gate failed",score:z.score,grade:z.grade,violations:z.violations,autoFixPrompt:z.autoFixPrompt},422);return}}let B=Ve(f,E.themeName),q=C({...h,code:B,helpers:!0,seq:h.seq??`execute-${Date.now()}`}),H=Pe(B),K={...q,theme:E.themeName,purity:{score:H.score,grade:H.grade,passed:H.passed}};i=K,p(m,K,200);return}let S=d.pathname==="/batch_inspect"?U:d.pathname==="/export_comp_rig_overrides"?R:d.pathname==="/checkpoint"?w:d.pathname==="/rollback"?F:d.pathname==="/render_frame_fast"?M:null;if(S&&(c.method==="POST"||c.method==="GET")){let h={seq:d.searchParams.get("seq")??`${d.pathname.slice(1)}-${Date.now()}`};if(d.searchParams.get("comp")!==null&&(h.compId=d.searchParams.get("comp")),d.searchParams.get("frame")!==null&&(h.frame=d.searchParams.get("frame")),d.searchParams.get("frames")!==null&&(h.frames=(d.searchParams.get("frames")??"").split(",").map(E=>E.trim()).filter(Boolean)),d.searchParams.get("layerIds")!==null&&(h.layerIds=(d.searchParams.get("layerIds")??"").split(",").map(E=>E.trim()).filter(Boolean)),d.searchParams.get("attributes")!==null&&(h.attributes=(d.searchParams.get("attributes")??"").split(",").map(E=>E.trim()).filter(Boolean)),d.searchParams.get("snapshotId")!==null&&(h.snapshotId=d.searchParams.get("snapshotId")),d.searchParams.get("scaleFactor")!==null&&(h.scaleFactor=d.searchParams.get("scaleFactor")),c.method==="POST")try{let E=await ye(c);E.trim()&&(h={...h,...JSON.parse(E)})}catch(E){let _=String(E?.message??E),B=/too large/i.test(_)?413:400;p(m,{ok:!1,error:_},B);return}let f=S(h);i=f,p(m,f);return}if(d.pathname==="/batch-step"&&(c.method==="POST"||c.method==="GET")){let h=d.searchParams,f={type:de,seq:h.get("seq")??`batch-step-${Date.now()}`},E=h.get("sampleFrames")??h.get("frames");E!==null&&(f.sampleFrames=E.split(",").map(q=>q.trim()).filter(Boolean));let _=h.get("comp")??h.get("compId");if(_!==null&&(f.compId=_),h.get("scale")!==null&&(f.scale=h.get("scale")),h.get("renderOutputDir")!==null&&(f.renderOutputDir=h.get("renderOutputDir")),/^(1|true|yes)$/i.test(h.get("renderFrames")??"")&&(f.renderFrames=!0),/^(0|false|no)$/i.test(h.get("dirtyAttributesOnly")??"")&&(f.dirtyAttributesOnly=!1),c.method==="POST")try{let q=await ye(c);q.trim()&&(f={...f,...JSON.parse(q),type:de})}catch(q){let H=String(q?.message??q),K=/too large/i.test(H)?413:400;p(m,ie(de,ee.BAD_REQUEST,H),K);return}let B=x(f);i=B,p(m,B);return}if(d.pathname==="/determinism-check"&&(c.method==="POST"||c.method==="GET")){let h=d.searchParams,f={seq:h.get("seq")??`determinism-check-${Date.now()}`};if(h.get("code")!==null&&(f.code=h.get("code")),h.get("frames")!==null&&(f.frames=(h.get("frames")??"").split(",").map(_=>_.trim()).filter(Boolean)),h.get("frameCount")!==null&&(f.frameCount=h.get("frameCount")),h.get("seed")!==null&&(f.seed=h.get("seed")),h.get("width")!==null&&(f.width=h.get("width")),h.get("budgetMs")!==null&&(f.budgetMs=h.get("budgetMs")),/^(0|false|no)$/i.test(h.get("lint")??"")&&(f.lint=!1),c.method==="POST")try{let _=await ye(c);_.trim()&&(f={...f,...JSON.parse(_)})}catch(_){let B=String(_?.message??_),q=/too large/i.test(B)?413:400;p(m,ie(Ee,ee.BAD_REQUEST,B),q);return}let E=L(f);i=E,p(m,E);return}if(c.method==="GET"&&d.pathname==="/get"){p(m,i??u());return}let I=d.pathname==="/state"||d.pathname==="/layers"?d.pathname==="/state"?"state":"layers":d.pathname==="/snapshot-batch"?"snapshot-batch":d.pathname==="/frame"||d.pathname==="/snapshot"?"snapshot":null;if(I&&(c.method==="GET"||c.method==="HEAD"||c.method==="POST")){let h=nn(d,I);if(c.method==="POST")try{let E=await ye(c);E.trim()&&(h={...h,...JSON.parse(E)})}catch(E){let _=String(E?.message??E);if(/too large/i.test(_)){p(m,ie(I,ee.BAD_REQUEST,_),413);return}}let f=I==="snapshot"?N(h):I==="snapshot-batch"?b(h):g(I,h);if(i=f,I==="snapshot-batch"&&j(f,h,d),I==="snapshot"&&f.ok===!0){let _=`${typeof f.file=="string"?f.file:""}.rgba`;if(zt(h,d)&&Q.existsSync(_)){let B=a.comps.get(String(f.compId??""))??a.activeComp(),q=Number(f.scale);if(B&&Number.isFinite(q)&&q>0){let H=Math.max(1,Math.round(B.width*(q/100))),K=Math.max(1,Math.round(B.height*(q/100))),z=Q.readFileSync(_);z.length===H*K*4?(f.pngBase64=pe(z,H,K).toString("base64"),f.width=H,f.height=K):f.inlineNote=`sidecar length ${z.length} does not match ${H}x${K}x4`}}}if(c.method==="HEAD"){m.writeHead(200,{"Content-Type":"application/json"}),m.end();return}p(m,f);return}if(c.method==="POST"&&(d.pathname==="/post"||d.pathname==="/render-frames")){let h;try{h=await ye(c)}catch(_){p(m,{error:String(_?.message??_)},413);return}let f;try{f=JSON.parse(h)}catch{p(m,{error:"Failed to parse request as JSON"},400);return}if(d.pathname==="/render-frames"&&(c.headers.accept??"").includes("application/octet-stream")){let _=await y(f),B=Array.isArray(_.rendered)?_.rendered:[],q=Buffer.alloc(4);q.writeUInt32BE(B.length,0);let H=[q];for(let z of B){let G=Buffer.alloc(8);G.writeUInt32BE(Number(z.frame),0),G.writeUInt16BE(Number(z.width),4),G.writeUInt16BE(Number(z.height),6);let W=Buffer.from(String(z.bufferBase64??""),"base64"),D=Buffer.alloc(4);D.writeUInt32BE(W.length,0),H.push(G,D,W)}let K=Buffer.concat(H);m.writeHead(200,{"Content-Type":"application/octet-stream","Content-Length":K.length}),m.end(K);return}let E=o.then(async()=>{let _;if(f.type===le){let B=f.batchEvalAndCaptureResult;i=B?.kind===ge?B:f,_={ok:!0}}else if(f.type===ge)_=O(f),i=_;else if(f.type===sr)_=await y(f),i=_;else if(f.type===$e||f.type===ot)_=g(f.type===$e?"state":"layers",f),i=_;else if(f.type===Ne)_=N(f),i=_;else if(f.type===Re)_=b(f),j(_,f,d),i=_;else if(f.type===de)_=x(f),i=_;else if(f.type===Se)_=U(f),i=_;else if(f.type===Ae)_=R(f),i=_;else if(f.type===Me)_=w(f),i=_;else if(f.type===_e)_=F(f),i=_;else if(f.type===Ce)_=M(f),i=_;else if(f.type===Ee)_=L(f),i=_;else if(f.type==="health")_={version:et,status:"ok",purityGate:!0,themes:[...Ye]},i=_;else if(f.type==="execute"){let B=typeof f.script=="string"?f.script:typeof f.code=="string"?f.code:"",q=Ge(typeof f.theme=="string"?f.theme:"neutral");if(f.enforcePurity!==!1){let z=Pe(B);if(!z.passed)return _={kind:"execute",seq:f.seq??null,ok:!1,status:422,error:"Purity gate failed",score:z.score,grade:z.grade,violations:z.violations,autoFixPrompt:z.autoFixPrompt},i=_,_}let K=Ve(B,q.themeName);_=C({...f,code:K,helpers:!0}),i=_}else f.type==="script"||f.path?(_=C(f),i=_):typeof f.type=="string"&&(f.type.startsWith("javaScript")||f.type.startsWith("sksl")||f.type.toLowerCase().includes("render"))?(_=Y(f),i=_):(_={type:le,kind:"result",seq:f.seq??null,ok:!1,error:`Unexpected type '${String(f.type)}'`},i=_);return _});try{await E,p(m,{ok:!0})}catch(_){p(m,{ok:!1,error:String(_?.message??_)},500)}return}p(m,{error:"not found"},404)})().catch(()=>{m.headersSent||p(m,{error:"internal error"},500)})}),J=new Set;$.on("connection",c=>{J.add(c),c.once("close",()=>J.delete(c))});let ue=()=>new Promise(c=>{for(let m of J)m.destroy();J.clear(),typeof $.closeAllConnections=="function"&&$.closeAllConnections(),$.close(()=>c())});return new Promise((c,m)=>{$.once("error",m),$.listen(t,e,()=>{let d=$.address(),S=typeof d=="object"&&d?d.port:t;c({port:S,host:e,scene:a,api:s,server:$,lastFrames:()=>s.lastFrames.slice(),close:ue,stop:ue})})})}function gn(n=process.argv){return n.includes("--mock")?!0:process.env.STALLION_MOCK==="1"}async function yn(n=process.argv){let e=(a,s)=>{let i=n.indexOf(a);return i>=0&&n[i+1]?n[i+1]:s},t=await _n({host:e("--host"),port:e("--port")?Number(e("--port")):void 0,token:e("--token"),strictSchema:!n.includes("--lax"),verbose:n.includes("--verbose")});process.stdout.write(`Stallion mock bridge v${et} \u2014 listening on ${t.host}:${t.port} (in-memory Cavalry 2.8 scene)
`);let r=()=>{t.close().then(()=>process.exit(0))};process.on("SIGINT",r),process.on("SIGTERM",r)}var bn=(()=>{try{return import.meta.url===lr(process.argv[1]??"").href}catch{return!1}})();bn&&!gn()&&(process.stdout.write(`Usage: node dist/stallion-mock.mjs --mock [--host 127.0.0.1] [--port 8080] [--token T] [--lax] [--verbose]
Boot conditions: --mock flag, or STALLION_MOCK=1 environment variable.
`),process.exit(0));bn&&await yn();export{mn as CAVALRY_EXECUTION_CONTEXTS,Ut as CONTEXT_GLOBALS_BY_CONTEXT,Nt as DETERMINISM_MAX_CODE_BYTES,Ft as DETERMINISM_MAX_FRAME_COUNT,It as DETERMINISM_MAX_PROBES,Et as DETERMINISM_ORDERS,Ee as DETERMINISM_TYPE,Ht as EXPRESSION_PAYLOAD_TYPES,xe as MockApi,we as MockScene,rn as SCENE_LINT_BODY_CONTRAST,an as SCENE_LINT_LARGE_CONTRAST,sn as SCENE_LINT_LARGE_TEXT_PX,ln as SCENE_LINT_OVERLAP_RATIO,jt as SCENE_LINT_SAMPLE_FRACTIONS,on as SCENE_LINT_TITLE_SAFE_MARGIN,yn as bootMockFromArgv,be as buildReceipt,Qe as captureJsLogDiagnostics,$t as contrastRatio,Ie as executeOnMock,pn as formatSceneLintReport,Ke as isExpressionPayloadType,Qt as lintDeterminismSource,Be as lintSceneGraph,dn as lintSceneGraphAtFrame,Mt as normalizeDeterminismJob,Fe as parseColor,De as payloadTypeToExecutionContext,We as relativeLuminance,Tt as runDeterminismCheck,gn as shouldBootMock,_n as startMockServer,qe as validateCavalryContextUsage,Je as validateSkslSource};
