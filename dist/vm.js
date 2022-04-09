#!/usr/bin/env node
(()=>{"use strict";var e={4155:(e,t,n)=>{n.d(t,{q:()=>r});var s=n(8593);class r{callee;name;id=(0,s.iu)();slots={};label;description;execute;ending;next;constructor(e,t,n,s,r){if(this.callee=e,this.name=t,this.label=s||t,this.description=r||`${this.label}-desc`,this.execute=n||e.instance[t],!this.execute)throw new Error(`${this.name} is not found`)}born(){const e=Object.fromEntries(Object.entries(this.slots).map((([e,t])=>[e,(0,s.x3)(t)]))),t={},n=Object.entries(this.slots);for(let e=0;e<n.length;e++){const[s,r]=n[e];if(!r.data)break;t[s]=!0}Object.fromEntries(Object.entries(this.slots).map((([e,t])=>[e,!!t.data])));const{execute:r}=this;return{callee:this.callee.instance,next:this.next?.born(),slots:e,execute:async function(e,n){const a=Object.fromEntries(await Promise.all(Object.entries(this.slots).map((async([r,a])=>[r,t[r]?await(0,s.GU)(a,e,n):a]))));return await r.call(this.callee,a,n)}}}attach(e){if(this.next)throw new Error(`${this.name} already has next block`);this.next=e}dettach(){const e=this.next;return this.next=void 0,e}}},1621:(e,t,n)=>{var s;n.d(t,{L:()=>s}),function(e){e.egg="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C0",e.logic="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C1",e.math="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C2",e.storage="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C3",e.timer="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C4",e.screen="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C5",e.camera="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C6",e.speech="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C7",e.gesture="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8C8",e.test="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8CA",e.scene="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8CB",e.pose="9E8B8E0E-B7B2-4E8E-8A0A-D6E7A9C9D8CC",e.box="9E8B8E0E-B7B2-4E8E-A801-000000000001",e.sphere="9E8B8E0E-B7B2-4E8E-A801-000000000002",e.plane="9E8B8E0E-B7B2-4E8E-A801-000000000003",e.text="9E8B8E0E-B7B2-4E8E-A801-000000000004",e.bulb="9E8B8E0E-B7B2-4E8E-A801-000000000005",e.cloth="9E8B8E0E-B7B2-4E8E-A801-000000000006"}(s||(s={}))},6697:(e,t,n)=>{n.d(t,{K:()=>r,y:()=>a});var s=n(1356);class r extends s.b${constructor(e,t){super(e,t,e),delete this.actions.clone,delete this.actions.die,delete this.events.clone}}class a extends s.UP{clone(){throw new Error("Not allowed.")}}},1356:(e,t,n)=>{n.d(t,{T_:()=>a,yN:()=>i,UP:()=>o,b$:()=>c});var s=n(4155),r=n(8593);class a extends s.q{static type="action";output;constructor(e,t,n,s){super(e,t,n,s)}}class i extends s.q{static type="data";constructor(e,t,n,s){super(e,t,n,s)}}class o{parent;uuid;properties={};events={};children={};clonedCount=0;constructor(e,t){this.parent=t,this.uuid=e||(0,r.iu)()}get({name:e}){return this.properties[e]}set({name:e,value:t}){this.properties[e]=t}appendChild(e){if(this.children[e.uuid])throw new Error(`unit ${e.uuid} already exists`);e.parent=this,this.children[e.uuid]=e}removeChild(e){delete this.children[e.uuid]}async clone(){if(!this.parent)throw new Error("cannot clone root unit");this.clonedCount++;const e=new this.__proto__.constructor(void 0,this.parent,this);e.cloned=!0,Object.assign(e.properties,this.properties);const t=this.events.clone;return t.length&&(e.events.clone=t.map((t=>({filter:t.filter,blocks:(0,r.Wm)(t.blocks,this,e)})))),this.parent.appendChild(e),e.emit("clone",{}),e}async die(){this.parent&&(this.parent.removeChild(this),console.log(`${this.uuid} died`))}async emit(e,t){const n=this.events[e];n?.length&&await Promise.all(n.map((async n=>{if(!n.filter||t.name===n.filter)return await(0,r.GU)(n.blocks,{},{from:this,name:e,params:t})}))).catch((e=>{console.error(e)}))}static async create(e,t,n){return new this(e,t,n)}}class c{egg;instance;parent;properties={};actions={};events={};chains={};children={};constructor(e,t,n){this.egg=e,this.instance=t,this.parent=n;const s=this;this.actions={clone:class extends a{constructor(e){super(e,"clone")}},die:class extends a{constructor(e){super(e,"die")}},get:class extends i{slots={name:(0,r.ud)({name:"name",data:(0,r.QK)(s,{}),required:!0,suffix:"valueof"})};output={type:"unknown",name:".",label:"value",description:"value-desc"};constructor(e){super(e,"get")}},set:class extends a{slots={name:(0,r.ud)({name:"name",data:(0,r.QK)(s,{}),required:!0,suffix:"valueof"}),value:(0,r.ud)({name:"value",data:(0,r.FR)(s,this,{},"name"),required:!0,prefix:"tois"})};constructor(e){super(e,"set")}}},this.events={clone:(0,r.BU)({name:"clone"})}}get uuid(){return this.instance.uuid}get name(){return this.instance.constructor.clsname}appendChild(e){if(this.children[e.instance.uuid])throw new Error(`unit ${e.instance.uuid} already exists`);e.parent&&e.parent.removeChild(e),e.parent=this,this.children[e.instance.uuid]=e,this.instance.appendChild(e.instance)}removeChild(e){delete this.children[e.instance.uuid],this.instance.removeChild(e.instance)}createChain(e){const t={id:(0,r.iu)(),unit:this,head:e};if(this.chains[t.id])throw"duplicate chain";return this.chains[t.id]=t,t}removeChain(e){e.bound&&e.bound.unit.unbindEvent(e.bound.event,e),delete this.chains[e.id]}bindEvent(e,t,n){const s=this.events[e];if(!s)throw new Error(`event ${e} not found`);t.bound&&t.bound.unit.unbindEvent(t.bound.event,t),s.chains.push(t),t.bound={unit:this,event:e,filter:n}}unbindEvent(e,t){const n=this.events[e];if(!n)throw new Error(`event ${e} not found`);const s=n.chains.indexOf(t);-1!==s&&(n.chains.splice(s,1),t.bound=void 0)}appendBlock(e,t){if(e.head){let n=e.head;for(;n.next;)n=n.next;n.next=t}else e.head=t}removeBlock(e,t){if(e.head===t)e.head=t.next;else if(e.head){let n=e.head;for(;n.next!==t;)n=n.next;if(!n)throw new Error("block not found");n.next=t.next}t.next=void 0}findBlock(e,t){let n=e.head;for(;n;){if(n.id===t)return n;n=n.next}}clearChains(){Object.values(this.chains).forEach((e=>{this.removeChain(e)}))}clearEvents(){Object.values(this.events).forEach((e=>{e.chains.length=0}))}build(){(0,r._V)(this,this.instance);for(const e of Object.values(this.children))e.build();return this.instance}createAction(e){return new this.actions[e](this)}}},8593:(e,t,n)=>{function s(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(e){const t=16*Math.random()|0;return("x"==e?t:3&t|8).toString(16)}))}function r(e){return{params:{},chains:[],label:e.name,description:`${e.name}-desc`,...e}}function a(e,t,n){return new Proxy({label:t.name,description:`${t.name}-desc`,type:"string",...t,default:e.get({name:t.name})},{get:(n,s,r)=>"value"===s?e.get({name:t.name}):Reflect.get(n,s,r),set(s,r,a,i){const o=Reflect.set(s,r,a,i);return o&&"value"===r&&(e.set({name:t.name,value:a}),n&&n(t.name,a)),o}})}function i(e,t,n){return new Proxy({type:"string",...t},{get:(t,s,r)=>"values"===s?n?n():Object.keys(e.properties):Reflect.get(t,s,r)})}function o(e,t,n){return new Proxy({type:"string",...t},{get:(t,s,r)=>"values"===s?n?n():Object.keys(e.properties):Reflect.get(t,s,r)})}function c(e,t,n,s){return new Proxy({...n},{get(n,r,a){if("type"===r){const n=t.slots[s];if(!n||"string"!==n.data?.type)return"unknown";const r=n.data?.value;return r&&e.properties[r]?.type||"unknown"}return Reflect.get(n,r,a)}})}function u(e,t){for(const[n,s]of Object.entries(e.events))t.events[n]=s.chains.map((e=>({filter:e.bound?.filter,blocks:e.head?.born()}))).filter((e=>e.blocks));return t}function l(e){return"string"==typeof e?{name:e,label:e,description:`${e}-desc`}:{label:e.name,description:`${e.name}-desc`,...e}}function d(e){if(e.block)return e.block.born();if(e.data){const t=e.data.value??e.data.default;if("unit"===e.data.type)return t?.instance??void 0;if(e.required&&void 0===t)throw new Error(`${e.name} is required`);return t}if(e.required)throw new Error(`${e.name} is required`)}async function h(e,t,n){let s;if(e?.execute){let r=e;for(;r;)s=await r.execute(t||{},n),r=r.next;return s}return e}function E(e,t,n){return e.execute?{callee:e.callee===t?n:e.callee,slots:Object.fromEntries(Object.entries(e.slots).map((([e,s])=>[e,E(s,t,n)]))),next:e.next?E(e.next,t,n):void 0,execute:e.execute}:e}n.d(t,{iu:()=>s,BU:()=>r,M5:()=>a,QK:()=>i,WX:()=>o,FR:()=>c,_V:()=>u,ud:()=>l,x3:()=>d,GU:()=>h,Wm:()=>E})}},t={};function n(s){var r=t[s];if(void 0!==r)return r.exports;var a=t[s]={exports:{}};return e[s](a,a.exports,n),a.exports}n.d=(e,t)=>{for(var s in t)n.o(t,s)&&!n.o(e,s)&&Object.defineProperty(e,s,{enumerable:!0,get:t[s]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{var e=n(1621),t=n(8593),s=n(6697);s.y,e.L.storage,s.K;var r=n(1356);s.y,e.L.timer,s.K;class a extends r.T_{output={type:"number",name:".",label:"result",description:"result-desc"};constructor(e){if(super(d,e,void 0,`math.${e}`),!this.execute)throw`unknown math action: ${e}`}}class i extends r.T_{output={type:"boolean",name:".",label:"result",description:"result-desc"};constructor(e){if(super(d,e,void 0,`math.${e}`),!this.execute)throw`unknown math action: ${e}`}}class o extends a{slots={a:(0,t.ud)({name:"a",label:"math.operand.a",data:{type:"number"},required:!0}),b:(0,t.ud)({name:"b",label:"math.operand.b",data:{type:"number"},required:!0})}}class c extends i{slots={a:(0,t.ud)({name:"a",label:"math.operand.a",data:{type:"number"},required:!0}),b:(0,t.ud)({name:"b",label:"math.operand.b",data:{type:"number"},required:!0})}}class u extends r.UP{static type="virtual-device";static clsname="math";static clsid=e.L.math;uuid=e.L.math;clone(){throw new Error("Not allowed.")}add({a:e,b:t}){return e+t}sub({a:e,b:t}){return e-t}mul({a:e,b:t}){return e*t}div({a:e,b:t}){return e/t}mod({a:e,b:t}){return e%t}random({a:e,b:t}){return Math.floor(Math.random()*(t-e+1)+e)}not({a:e}){return!e}equal({a:e,b:t}){return e===t}greaterThen({a:e,b:t}){return e>t}greaterThenOrEqual({a:e,b:t}){return e>=t}lessThen({a:e,b:t}){return e>t}lessThenOrEqual({a:e,b:t}){return e<=t}}class l extends r.b${static runtime=u;constructor(e,n){super(e,n,e),this.actions={add:class extends o{constructor(){super("add"),this.slots.a.suffix="math.+"}},sub:class extends o{constructor(){super("sub"),this.slots.a.suffix="math.-"}},mul:class extends o{constructor(){super("mul"),this.slots.a.suffix="math.*"}},div:class extends o{constructor(){super("div"),this.slots.a.suffix="math./"}},mod:class extends o{constructor(){super("mod"),this.slots.a.suffix="math.%"}},random:class extends o{constructor(){super("random"),this.slots.a.prefix="from",this.slots.a.suffix="to"}},not:class extends i{slots={a:(0,t.ud)({name:"a",label:"math.operand.a",data:{type:"boolean"},required:!0,prefix:"math.!"})};constructor(){super("not")}},equal:class extends c{constructor(){super("equal"),this.slots.a.suffix="math.=="}},greaterThen:class extends c{constructor(){super("greaterThen"),this.slots.a.suffix="math.>"}},greaterThenOrEqual:class extends c{constructor(){super("greaterThenOrEqual"),this.slots.a.suffix="math.>="}},lessThen:class extends c{constructor(){super("lessThen"),this.slots.a.suffix="math.<"}},lessThenOrEqual:class extends c{constructor(){super("lessThenOrEqual"),this.slots.a.suffix="math.<="}}}}}const d=new l(null,new u);var h=n(4155);r.UP,e.L.logic,h.q,r.b$,h.q,r.UP,e.L.test,r.b$,e.L.egg})()})();