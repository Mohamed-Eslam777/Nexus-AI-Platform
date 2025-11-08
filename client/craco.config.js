const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const isNamedPlugin = (plugin, name) =>
  typeof plugin === 'function' && plugin.postcssPlugin === name;

module.exports = {
  style: {
    postcss: {
      plugins: (plugins) => {
        const remaining = (plugins || []).filter(
          (plugin) => !isNamedPlugin(plugin, 'tailwindcss') && !isNamedPlugin(plugin, 'autoprefixer')
        );

        return [tailwindcss, ...remaining, autoprefixer];
      },
    },
  },
};