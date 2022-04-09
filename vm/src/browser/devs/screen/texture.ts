/* eslint-disable max-len */
import { Property } from "egg";
import * as THREE from "three";

type Decoration = {
  allProps: Record<string, Omit<Property, 'name'>>;
};

export const decoration: Decoration = {
  allProps: {
    offset: {
      type: 'vec2',
    },
    repeat: {
      type: 'vec2',
    },
    center: {
      type: 'vec2',
    },
    mapping: {
      type: 'number',
      values: [
        {
          value: THREE.UVMapping,
          label: 'UVMapping',
        },
        {
          value: THREE.CubeReflectionMapping,
          label: 'CubeReflectionMapping',
        },
        {
          value: THREE.CubeRefractionMapping,
          label: 'CubeRefractionMapping',
        },
        {
          value: THREE.EquirectangularReflectionMapping,
          label: 'EquirectangularReflectionMapping',
        },
        {
          value: THREE.EquirectangularRefractionMapping,
          label: 'EquirectangularRefractionMapping',
        },
        {
          value: THREE.CubeUVReflectionMapping,
          label: 'CubeUVReflectionMapping',
        },
        {
          value: THREE.CubeUVRefractionMapping,
          label: 'CubeUVRefractionMapping',
        },
      ]
    },
    wrapS: {
      type: 'number',
      values: [
        {
          value: THREE.RepeatWrapping,
          label: 'RepeatWrapping',
        },
        {
          value: THREE.ClampToEdgeWrapping,
          label: 'ClampToEdgeWrapping',
        },
        {
          value: THREE.MirroredRepeatWrapping,
          label: 'MirroredRepeatWrapping',
        },
      ]
    },
    wrapT: {
      type: 'number',
      values: [
        {
          value: THREE.RepeatWrapping,
          label: 'RepeatWrapping',
        },
        {
          value: THREE.ClampToEdgeWrapping,
          label: 'ClampToEdgeWrapping',
        },
        {
          value: THREE.MirroredRepeatWrapping,
          label: 'MirroredRepeatWrapping',
        },
      ]
    },
    magFilter: {
      type: 'number',
      values: [
        { value: THREE.NearestFilter, label: 'NearestFilter' }, { value: THREE.NearestMipmapNearestFilter, label: 'NearestMipmapNearestFilter' }, { value: THREE.NearestMipMapNearestFilter, label: 'NearestMipMapNearestFilter' }, { value: THREE.NearestMipmapLinearFilter, label: 'NearestMipmapLinearFilter' },
        { value: THREE.NearestMipMapLinearFilter, label: 'NearestMipMapLinearFilter' }, { value: THREE.LinearFilter, label: 'LinearFilter' }, { value: THREE.LinearMipmapNearestFilter, label: 'LinearMipmapNearestFilter' },
        { value: THREE.LinearMipMapNearestFilter, label: 'LinearMipMapNearestFilter' }, { value: THREE.LinearMipmapLinearFilter, label: 'LinearMipmapLinearFilter' }, { value: THREE.LinearMipMapLinearFilter, label: 'LinearMipMapLinearFilter' }
      ],
    },
    minFilter: {
      type: 'number',
      values: [
        { value: THREE.NearestFilter, label: 'NearestFilter' }, { value: THREE.NearestMipmapNearestFilter, label: 'NearestMipmapNearestFilter' }, { value: THREE.NearestMipMapNearestFilter, label: 'NearestMipMapNearestFilter' }, { value: THREE.NearestMipmapLinearFilter, label: 'NearestMipmapLinearFilter' },
        { value: THREE.NearestMipMapLinearFilter, label: 'NearestMipMapLinearFilter' }, { value: THREE.LinearFilter, label: 'LinearFilter' }, { value: THREE.LinearMipmapNearestFilter, label: 'LinearMipmapNearestFilter' },
        { value: THREE.LinearMipMapNearestFilter, label: 'LinearMipMapNearestFilter' }, { value: THREE.LinearMipmapLinearFilter, label: 'LinearMipmapLinearFilter' }, { value: THREE.LinearMipMapLinearFilter, label: 'LinearMipMapLinearFilter' }
      ],
    },
    format: {
      type: 'number',
      values: [{ value: THREE.AlphaFormat, label: 'AlphaFormat' }, { value: THREE.RGBAFormat, label: 'RGBAFormat' }, { value: THREE.LuminanceFormat, label: 'LuminanceFormat' }, { value: THREE.LuminanceAlphaFormat, label: 'LuminanceAlphaFormat' }, { value: THREE.DepthFormat, label: 'DepthFormat' }, { value: THREE.DepthStencilFormat, label: 'DepthStencilFormat' },
      { value: THREE.RedFormat, label: 'RedFormat' }, { value: THREE.RedIntegerFormat, label: 'RedIntegerFormat' }, { value: THREE.RGFormat, label: 'RGFormat' }, { value: THREE.RGIntegerFormat, label: 'RGIntegerFormat' }, { value: THREE.RGBAIntegerFormat, label: 'RGBAIntegerFormat' },
      ],
    },
    type: {
      type: 'number',
      values: [
        { value: THREE.UnsignedByteType, label: 'UnsignedByteType' }, { value: THREE.ByteType, label: 'ByteType' }, { value: THREE.ShortType, label: 'ShortType' }, { value: THREE.UnsignedShortType, label: 'UnsignedShortType' }, { value: THREE.IntType, label: 'IntType' }, { value: THREE.UnsignedIntType, label: 'UnsignedIntType' },
        { value: THREE.FloatType, label: 'FloatType' }, { value: THREE.HalfFloatType, label: 'HalfFloatType' }, { value: THREE.UnsignedShort4444Type, label: 'UnsignedShort4444Type' }, { value: THREE.UnsignedShort5551Type, label: 'UnsignedShort5551Type' }, { value: THREE.UnsignedInt248Type, label: 'UnsignedInt248Type' },
      ]
    },
    anisotropy: {
      type: 'number',
    },
    encoding: {
      type: 'number',
      values: [{ value: THREE.LinearEncoding, label: 'LinearEncoding' }, { value: THREE.sRGBEncoding, label: 'sRGBEncoding' }],
    }
  },
};
