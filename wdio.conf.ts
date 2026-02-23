/// <reference types="@wdio/globals/types" />
import * as path from 'node:path'

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.ts'
    ],
    maxInstances: 1,
    capabilities: [{
        browserName: 'msedge',
        'ms:edgeOptions': {
            binary: path.join(process.cwd(), 'src-tauri/target/debug/gtaurus.exe'),
        },
    }],
    logLevel: 'info',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    before: async () => {
        // Custom setup if needed
    }
}
