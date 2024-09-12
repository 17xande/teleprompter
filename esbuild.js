#!/usr/local/bin/node

import { build, context } from 'esbuild'
import { copy } from 'esbuild-plugin-copy'

const config = {
  entryPoints: [
    'internal/server/assets/scripts/viewer.ts',
    'internal/server/assets/scripts/controller.ts',
    'internal/server/assets/scripts/presentation.ts',
    'internal/server/assets/styles/controller.css',
    'internal/server/assets/styles/viewer.css',
  ],
  entryNames: '[dir]/[name]',
  outdir: 'internal/server/dist/assets',
  outbase: 'internal/server/assets',
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
