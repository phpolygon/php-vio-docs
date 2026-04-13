import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'php-vio',
  description: 'GPU Rendering, Audio, Video & Input for PHP',
  lang: 'en-US',
  base: '/php-vio-docs/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/what-is-php-vio' },
      { text: 'API', link: '/api/context' },
      { text: 'GitHub', link: 'https://github.com/phpgl/php-vio' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is php-vio?', link: '/guide/what-is-php-vio' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Architecture', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Rendering',
          items: [
            { text: 'Backends', link: '/guide/backends' },
            { text: '3D Rendering', link: '/guide/rendering-3d' },
            { text: '2D Rendering', link: '/guide/rendering-2d' },
            { text: 'Shaders', link: '/guide/shaders' },
            { text: 'Render Targets', link: '/guide/render-targets' },
          ],
        },
        {
          text: 'Input & Window',
          items: [
            { text: 'Keyboard & Mouse', link: '/guide/input' },
            { text: 'Gamepad', link: '/guide/gamepad' },
            { text: 'Window Management', link: '/guide/window' },
          ],
        },
        {
          text: 'Media',
          items: [
            { text: 'Audio', link: '/guide/audio' },
            { text: 'Video Recording', link: '/guide/video' },
            { text: 'Streaming', link: '/guide/streaming' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Headless & Testing', link: '/guide/headless' },
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'Building from Source', link: '/guide/building' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core',
          items: [
            { text: 'Context & Frame', link: '/api/context' },
            { text: 'Window', link: '/api/window' },
            { text: 'Backend', link: '/api/backend' },
          ],
        },
        {
          text: 'Input',
          items: [
            { text: 'Keyboard', link: '/api/keyboard' },
            { text: 'Mouse', link: '/api/mouse' },
            { text: 'Gamepad', link: '/api/gamepad' },
          ],
        },
        {
          text: 'Rendering',
          items: [
            { text: '2D Primitives', link: '/api/2d' },
            { text: 'Meshes', link: '/api/meshes' },
            { text: 'Shaders & Pipelines', link: '/api/shaders' },
            { text: 'Textures', link: '/api/textures' },
            { text: 'Buffers & Uniforms', link: '/api/buffers' },
            { text: 'Fonts & Text', link: '/api/fonts' },
            { text: 'Render Targets', link: '/api/render-targets' },
            { text: 'Cubemaps', link: '/api/cubemaps' },
          ],
        },
        {
          text: 'Media',
          items: [
            { text: 'Audio', link: '/api/audio' },
            { text: 'Video Recording', link: '/api/recorder' },
            { text: 'Streaming', link: '/api/streaming' },
          ],
        },
        {
          text: 'Utilities',
          items: [
            { text: 'Headless & Screenshots', link: '/api/headless' },
            { text: 'Plugins', link: '/api/plugins' },
            { text: 'Constants', link: '/api/constants' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/phpgl/php-vio' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present php-vio contributors',
    },

    editLink: {
      pattern: 'https://github.com/phpgl/php-vio-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
