import vikeReact from 'vike-react/config';
import type { Config } from 'vike/types';
import Layout from '../layouts/LayoutDefault.js';
import vikeReactRedux from 'vike-react-redux/config';
// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: 'Smart Packing List',
  description:
    'Smart Packing List - An app to generate packing lists for your trips based on your rules and preferences',

  // Enable client-side routing
  clientRouting: true,

  // Hydration configuration
  hydrationCanBeAborted: true,

  prerender: {
    partial: true,
  },

  extends: [vikeReact, vikeReactRedux],
} satisfies Config;
