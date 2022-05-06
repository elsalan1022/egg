/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { gclsids } from '../../clsids';
import { makeProperty } from '../../utils';
import { World } from 'cannon-es';
import { Scene } from '../devs/screen/scene';

const vertex = `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `
// Created by anatole duprat - XT95/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)

float noise(vec3 p) //Thx to Las^Mercury
{
	vec3 i = floor(p);
	vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
	vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
	a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
	a.xy = mix(a.xz, a.yw, f.y);
	return mix(a.x, a.y, f.z);
}

float sphere(vec3 p, vec4 spr)
{
	return length(spr.xyz-p) - spr.w;
}

float flame(vec3 p)
{
	float d = sphere(p*vec3(1.,.5,1.), vec4(.0,-1.,.0,1.));
	return d + (noise(p+vec3(.0,iTime*2.,.0)) + noise(p*3.)*.5)*.25*(p.y) ;
}

float scene(vec3 p)
{
	return min(100.-length(p) , abs(flame(p)) );
}

vec4 raymarch(vec3 org, vec3 dir)
{
	float d = 0.0, glow = 0.0, eps = 0.02;
	vec3  p = org;
	bool glowed = false;

	for(int i=0; i<64; i++)
	{
		d = scene(p) + eps;
		p += d * dir;
		if( d>eps )
		{
			if(flame(p) < .0)
				glowed=true;
			if(glowed)
       			glow = float(i)/64.;
		}
	}
	return vec4(p,glow);
}

void main()
{
	vec2 v = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
	v.x *= iResolution.x/iResolution.y;

	vec3 org = vec3(0., -2., 4.);
	vec3 dir = normalize(vec3(v.x*1.6, -v.y, -1.5));

	vec4 p = raymarch(org, dir);
	float glow = p.w;

	vec4 col = mix(vec4(1.,.5,.1,1.), vec4(0.1,.5,1.,1.), p.y*.02+.4);

	gl_FragColor = mix(vec4(0.), col, pow(glow*2.,4.));
	//fragColor = mix(vec4(1.), mix(vec4(1.,.5,.1,1.),vec4(0.1,.5,1.,1.),p.y*.02+.4), pow(glow*2.,4.));

}
`;

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'shadertoy';
  static clsid = gclsids.shadertoy;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: 0 },
        iResolution: { value: new THREE.Vector3(640, 640, 1) },
        iTime: { value: 0 },
        iTimeDelta: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, material);
    super(uuid, parent, { object: mesh });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      const mesh = this.object as THREE.Mesh;
      const geo = mesh.geometry as THREE.PlaneGeometry;
      switch (name) {
        case 'width':
          return geo.parameters.width;
        case 'height':
          return geo.parameters.height;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (!['width', 'height'].includes(name)) {
      return;
    }
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneGeometry;
    if (name === 'width') {
      mesh.geometry = new THREE.PlaneGeometry(value, geo.parameters.height);
    } else if (name === 'height') {
      mesh.geometry = new THREE.PlaneGeometry(geo.parameters.width, value);
    }
    mesh.matrixWorldNeedsUpdate = true;
  }
  update(delta: number, now: number, scene: Scene, world: World): void {
    const mesh = this.object as THREE.Mesh;
    const material = mesh.material as THREE.ShaderMaterial;
    const uniforms = material.uniforms;
    uniforms.iTime.value = now / 1000;
    uniforms.iTimeDelta.value = delta / 1000;
    mesh.matrixWorldNeedsUpdate = true;
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      width: makeProperty(instance, {
        name: 'width',
        type: 'number'
      }),
      height: makeProperty(instance, {
        name: 'height',
        type: 'number'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
