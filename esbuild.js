#!/usr/local/bin/node

import { build, context } from 'esbuild'
import { copy } from 'esbuild-plugin-copy'

const config = {
  entryPoints: [
    'assets/html/index.html',
    'assets/html/pop.html',
    'assets/scripts/app.ts',
    'assets/scripts/pop.ts',
    'assets/styles/style.css',
  ],
  entryNames: '[dir]/[name]',
  outdir: 'dist/assets',
  outbase: 'assets',
  sourcemap: true,
  format: 'esm',
  bundle: true,
  minify: true,
  logLevel: 'info',
  loader: {
    '.html': 'copy',
  },
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: {
        from: ['./node_modules/@shoelace-style/shoelace/dist/assets/icons/*'],
        to: ['./internal/server/dist/assets/icons'],
      }
    }),
  ],
}

const watch = process.argv.length > 2 && process.argv[2] === '--watch'

if (watch) {
  config.minify = false

  try {
    const ctx = await context(config)

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received. Shutting down...')
      await ctx.dispose()
      process.exit(0)
    })

    ctx.watch()
  } catch (err) {
    console.log('error in watch mode:')
    console.error(err)
    process.exit(1)
  }
} else {
  await build(config).catch(err => {
    console.log('error in build mode:')
    console.error(err)
    process.exit(1)
  })
}
