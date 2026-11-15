import path from 'node:path'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'vrt',
            include: ['src/**/*.vrt.test.tsx'],
            setupFiles: ['src/test/vrt.setup.ts'],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
              expect: {
                toMatchScreenshot: {
                  // All references live under ./screenshots, mirroring src/:
                  // src/components/Header.vrt.test.tsx → screenshots/components/Header/<name>-<browser>-<os>.png
                  resolveScreenshotPath: ({
                    root,
                    testFileDirectory,
                    testFileName,
                    arg,
                    browserName,
                    platform,
                    ext,
                  }) =>
                    path.join(
                      root,
                      'screenshots',
                      path.relative('src', testFileDirectory),
                      testFileName.replace(/\.vrt\.test\.tsx$/, ''),
                      `${arg}-${browserName}-${platform}${ext}`,
                    ),
                },
              },
            },
          },
        },
      ],
    },
  }),
)
