/* eslint-disable max-len */
import { Property } from "egg";
import * as THREE from "three";

const MaterialParameters = [
  'name',
  'alphaTest',
  'alphaToCoverage',
  'blendDst',
  'blendDstAlpha',
  'blendEquation',
  'blendEquationAlpha',
  'blending',
  'blendSrc',
  'blendSrcAlpha',
  'clipIntersection',
  'clippingPlanes',
  'clipShadows',
  'colorWrite',
  'defines',
  'depthFunc',
  'depthTest',
  'depthWrite',
  'fog',
  'opacity',
  'polygonOffset',
  'polygonOffsetFactor',
  'polygonOffsetUnits',
  'precision',
  'premultipliedAlpha',
  'dithering',
  'side',
  'shadowSide',
  'toneMapped',
  'transparent',
  'vertexColors',
  'visible',
  'format',
  'stencilWrite',
  'stencilFunc',
  'stencilRef',
  'stencilWriteMask',
  'stencilFuncMask',
  'stencilFail',
  'stencilZFail',
  'stencilZPass',
  'userData',
];

const LineBasicMaterialParameters = [...MaterialParameters].concat([
  'color',
  'linewidth',
  'linecap',
  'linejoin',
]);

const LineDashedMaterialParameters = [...LineBasicMaterialParameters].concat([
  'scale',
  'dashSize',
  'gapSize',
]);

const MeshBasicMaterialParameters = [...MaterialParameters].concat([
  'color',
  'opacity',
  'map',
  'lightMap',
  'lightMapIntensity',
  'aoMap',
  'aoMapIntensity',
  'specularMap',
  'alphaMap',
  'envMap',
  'combine',
  'reflectivity',
  'refractionRatio',
  'wireframe',
  'wireframeLinewidth',
  'wireframeLinecap',
  'wireframeLinejoin',
]);

const MeshDepthMaterialParameters = [...MaterialParameters].concat([
  'map',
  'alphaMap',
  'depthPacking',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'wireframe',
  'wireframeLinewidth',
]);

const MeshDistanceMaterialParameters = [...MaterialParameters].concat([
  'map',
  'alphaMap',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'farDistance',
  'nearDistance',
  'referencePosition',
]);

const MeshLambertMaterialParameters = [...MaterialParameters].concat([
  'color',
  'emissive',
  'emissiveIntensity',
  'emissiveMap',
  'map',
  'lightMap',
  'lightMapIntensity',
  'aoMap',
  'aoMapIntensity',
  'specularMap',
  'alphaMap',
  'envMap',
  'combine',
  'reflectivity',
  'refractionRatio',
  'wireframe',
  'wireframeLinewidth',
  'wireframeLinecap',
  'wireframeLinejoin',
]);

const MeshMatcapMaterialParameters = [...MaterialParameters].concat([
  'color',
  'matcap',
  'map',
  'bumpMap',
  'bumpScale',
  'normalMap',
  'normalMapType',
  'normalScale',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'alphaMap',
  'flatShading',
]);

const MeshNormalMaterialParameters = [...MaterialParameters].concat([
  'bumpMap',
  'bumpScale',
  'normalMap',
  'normalMapType',
  'normalScale',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'wireframe',
  'wireframeLinewidth',
  'flatShading',
]);

const MeshPhongMaterialParameters = [...MaterialParameters].concat([
  'color',
  'specular',
  'shininess',
  'opacity',
  'map',
  'lightMap',
  'lightMapIntensity',
  'aoMap',
  'aoMapIntensity',
  'emissive',
  'emissiveIntensity',
  'emissiveMap',
  'bumpMap',
  'bumpScale',
  'normalMap',
  'normalMapType',
  'normalScale',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'specularMap',
  'alphaMap',
  'envMap',
  'combine',
  'reflectivity',
  'refractionRatio',
  'wireframe',
  'wireframeLinewidth',
  'wireframeLinecap',
  'wireframeLinejoin',

  'flatShading',
]);

const MeshStandardMaterialParameters = [...MaterialParameters].concat([
  'color',
  'roughness',
  'metalness',
  'map',
  'lightMap',
  'lightMapIntensity',
  'aoMap',
  'aoMapIntensity',
  'emissive',
  'emissiveIntensity',
  'emissiveMap',
  'bumpMap',
  'bumpScale',
  'normalMap',
  'normalMapType',
  'normalScale',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'roughnessMap',
  'metalnessMap',
  'alphaMap',
  'envMap',
  'envMapIntensity',
  'refractionRatio',
  'wireframe',
  'wireframeLinewidth',

  'flatShading',
]);

const MeshPhysicalMaterialParameters = [...MeshStandardMaterialParameters].concat([
  'clearcoat',
  'clearcoatMap',
  'clearcoatRoughness',
  'clearcoatRoughnessMap',
  'clearcoatNormalScale',
  'clearcoatNormalMap',

  'reflectivity',
  'ior',

  'sheen',
  'sheenColor',
  'sheenRoughness',

  'transmission',
  'transmissionMap',
  'attenuationDistance',
  'attenuationColor',

  'specularIntensity',
  'specularColor',
  'specularIntensityMap',
  'specularColorMap',
]);

const MeshToonMaterialParameters = [...MaterialParameters].concat([
  'color',
  'opacity',
  'gradientMap',
  'map',
  'lightMap',
  'lightMapIntensity',
  'aoMap',
  'aoMapIntensity',
  'emissive',
  'emissiveIntensity',
  'emissiveMap',
  'bumpMap',
  'bumpScale',
  'normalMap',
  'normalMapType',
  'normalScale',
  'displacementMap',
  'displacementScale',
  'displacementBias',
  'alphaMap',
  'wireframe',
  'wireframeLinewidth',
  'wireframeLinecap',
  'wireframeLinejoin',
]);

const PointsMaterialParameters = [...MaterialParameters].concat([
  'color',
  'map',
  'alphaMap',
  'size',
  'sizeAttenuation',
]);

const ShaderMaterialParameters = [...MaterialParameters].concat([
  'uniforms',
  'vertexShader',
  'fragmentShader',
  'linewidth',
  'wireframe',
  'wireframeLinewidth',
  'lights',
  'clipping',
  'extensions',
  'glslVersion',
]);

const ShadowMaterialParameters = [...MaterialParameters].concat([
  'color',
]);

const SpriteMaterialParameters = [...MaterialParameters].concat([
  'color',
  'map',
  'alphaMap',
  'rotation',
  'sizeAttenuation',
]);

type Decoration = {
  materialTypesSupported: Record<string, Array<string>>;
  allProps: Record<string, Omit<Property, 'name'>>;
};

export const decoration: Decoration = {
  materialTypesSupported: {
    LineBasicMaterial: LineBasicMaterialParameters,
    LineDashedMaterial: LineDashedMaterialParameters,
    MeshBasicMaterial: MeshBasicMaterialParameters,
    MeshDepthMaterial: MeshDepthMaterialParameters,
    MeshDistanceMaterial: MeshDistanceMaterialParameters,
    MeshLambertMaterial: MeshLambertMaterialParameters,
    MeshMatcapMaterial: MeshMatcapMaterialParameters,
    MeshNormalMaterial: MeshNormalMaterialParameters,
    MeshPhongMaterial: MeshPhongMaterialParameters,
    MeshPhysicalMaterial: MeshPhysicalMaterialParameters,
    MeshStandardMaterial: MeshStandardMaterialParameters,
    MeshToonMaterial: MeshToonMaterialParameters,
    PointsMaterial: PointsMaterialParameters,
    ShaderMaterial: ShaderMaterialParameters,
    ShadowMaterial: ShadowMaterialParameters,
    SpriteMaterial: SpriteMaterialParameters,
  },
  allProps: {
    name: {
      type: 'string',
    },
    color: {
      type: 'color',
    },
    roughness: {
      type: 'number',
      min: 0,
      max: 1,
    },
    metalness: {
      type: 'number',
      min: 0,
      max: 1,
    },
    sheen: {
      type: 'number',
      min: 0,
      max: 1,
    },
    sheenColor: {
      type: 'color',
    },
    sheenRoughness: {
      type: 'number',
      min: 0,
      max: 1,
    },
    emissive: {
      type: 'color',
    },
    specular: {
      type: 'color',
    },
    specularIntensity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    specularColor: {
      type: 'color',
    },
    shininess: {
      type: 'number',
    },
    clearcoat: {
      type: 'number',
      min: 0,
      max: 1,
    },
    clearcoatRoughness: {
      type: 'number',
      min: 0,
      max: 1,
    },
    transmission: {
      type: 'number',
    },
    thickness: {
      type: 'number',
      min: 0,
      max: 1,
    },
    attenuationDistance: {
      type: 'number',
    },
    attenuationColor: {
      type: 'color',
    },
    fog: {
      type: 'boolean',
    },
    flatShading: {
      type: 'boolean',
    },
    blending: {
      type: 'number',
      values: [
        { value: THREE.NoBlending, label: 'NoBlending' }, { value: THREE.NormalBlending, label: 'NormalBlending' }, { value: THREE.AdditiveBlending, label: 'AdditiveBlending' },
        { value: THREE.SubtractiveBlending, label: 'SubtractiveBlending' }, { value: THREE.MultiplyBlending, label: 'MultiplyBlending' },
        { value: THREE.CustomBlending, label: 'CustomBlending' }],
    },
    combine: {
      type: 'number',
      values: [{ value: THREE.MultiplyOperation, label: 'MultiplyOperation' }, { value: THREE.MixOperation, label: 'MixOperation' }, { value: THREE.AddOperation, label: 'AddOperation' }],
    },
    side: {
      type: 'number',
      values: [{ value: THREE.FrontSide, label: 'FrontSide' }, { value: THREE.BackSide, label: 'BackSide' }, { value: THREE.DoubleSide, label: 'DoubleSide' }],
    },
    shadowSide: {
      type: 'number',
      values: [{ value: THREE.FrontSide, label: 'FrontSide' }, { value: THREE.BackSide, label: 'BackSide' }, { value: THREE.DoubleSide, label: 'DoubleSide' }],
    },
    opacity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    transparent: {
      type: 'boolean',
    },
    alphaTest: {
      type: 'number',
    },
    depthTest: {
      type: 'boolean',
    },
    depthWrite: {
      type: 'boolean',
    },
    colorWrite: {
      type: 'boolean',
    },
    stencilWrite: {
      type: 'boolean',
    },
    stencilWriteMask: {
      type: 'number',
    },
    stencilFunc: {
      type: 'number',
      values: [
        { value: THREE.NeverStencilFunc, label: 'NeverStencilFunc' }, { value: THREE.AlwaysStencilFunc, label: 'AlwaysStencilFunc' },
        { value: THREE.LessStencilFunc, label: 'LessStencilFunc' }, { value: THREE.LessEqualStencilFunc, label: 'LessEqualStencilFunc' },
        { value: THREE.EqualStencilFunc, label: 'EqualStencilFunc' }, { value: THREE.GreaterEqualStencilFunc, label: 'GreaterEqualStencilFunc' },
        { value: THREE.GreaterStencilFunc, label: 'GreaterStencilFunc' }, { value: THREE.NotEqualStencilFunc, label: 'NotEqualStencilFunc' },
        { value: THREE.AlwaysStencilFunc, label: 'AlwaysStencilFunc' }
      ],
    },
    stencilRef: {
      type: 'number',
    },
    stencilFuncMask: {
      type: 'number',
    },
    stencilFail: {
      type: 'number',
    },
    stencilZFail: {
      type: 'number',
    },
    stencilZPass: {
      type: 'number',
    },
    wireframe: {
      type: 'boolean',
    },
    wireframeLinewidth: {
      type: 'number',
    },
    wireframeLinecap: {
      type: 'string',
      default: 'round',
    },
    wireframeLinejoin: {
      type: 'string',
      default: 'round',
    },
    rotation: {
      type: 'vec3',
    },
    linewidth: {
      type: 'number',
    },
    dashSize: {
      type: 'number',
    },
    gapSize: {
      type: 'number',
    },
    scale: {
      type: 'number',
    },
    polygonOffset: {
      type: 'boolean',
    },
    polygonOffsetFactor: {
      type: 'number',
    },
    polygonOffsetUnits: {
      type: 'number',
    },
    dithering: {
      type: 'boolean',
    },
    alphaToCoverage: {
      type: 'boolean',
    },
    premultipliedAlpha: {
      type: 'boolean',
    },
    visible: {
      type: 'boolean',
    },
    toneMapped: {
      type: 'boolean',
    },
    userData: {
      type: 'json',
    },
    vertexColors: {
      type: 'number',
    },
    uniforms: {
      type: 'json',
    },
    defines: {
      type: 'json',
    },
    vertexShader: {
      type: 'string',
    },
    fragmentShader: {
      type: 'string',
    },
    extensions: {
      type: 'json',
    },
    size: {
      type: 'number',
    },
    sizeAttenuation: {
      type: 'boolean',
    },
    map: {
      type: 'texture',
    },
    matcap: {
      type: 'texture',
    },
    alphaMap: {
      type: 'texture',
    },
    bumpMap: {
      type: 'texture',
    },
    bumpScale: {
      type: 'number',
    },
    normalMap: {
      type: 'texture',
    },
    normalMapType: {
      type: 'number',
      values: [{ value: THREE.TangentSpaceNormalMap, label: 'TangentSpaceNormalMap' }, { value: THREE.ObjectSpaceNormalMap, label: 'ObjectSpaceNormalMap' }],
    },
    normalScale: {
      type: 'vec2',
    },
    displacementMap: {
      type: 'texture',
    },
    displacementScale: {
      type: 'number',
    },
    displacementBias: {
      type: 'number',
    },
    roughnessMap: {
      type: 'texture',
    },
    metalnessMap: {
      type: 'texture',
    },
    emissiveMap: {
      type: 'texture',
    },
    emissiveIntensity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    specularMap: {
      type: 'texture',
    },
    specularIntensityMap: {
      type: 'texture',
    },
    envMap: {
      type: 'texture',
    },
    envMapIntensity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    reflectivity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    refractionRatio: {
      type: 'number',
      min: 0,
      max: 1,
    },
    lightMap: {
      type: 'texture',
    },
    lightMapIntensity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    aoMap: {
      type: 'texture',
    },
    aoMapIntensity: {
      type: 'number',
      min: 0,
      max: 1,
    },
    gradientMap: {
      type: 'texture',
    },
    clearcoatMap: {
      type: 'texture',
    },
    clearcoatRoughnessMap: {
      type: 'texture',
    },
    clearcoatNormalMap: {
      type: 'texture',
    },
    clearcoatNormalScale: {
      type: 'vec2',
    },
    transmissionMap: {
      type: 'texture',
    },
    thicknessMap: {
      type: 'texture',
    },
    sheenColorMap: {
      type: 'texture',
    },
    sheenRoughnessMap: {
      type: 'texture',
    }
  },
};
