'use strict';
const cp = require('child_process')
const path = require('path')
const Package = require('@imooc-cli-bin/package');
const log = require('@imooc-cli-bin/log')

module.exports = exec;

const SETTINGS = {
    init: '@imooc-cli-bin/init'
}

const CACHE_DIR = 'dependencies'

async function exec () {
    // TODO
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    const cmdObj = arguments[arguments.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    let storeDir = null

    if (!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR)  // 生成缓存路径
        storeDir = path.resolve(targetPath, '/node_modules')
    }

    const pkg = new Package({
        targetPath,
        storeDir,
        packageName,
        packageVersion
    })

    if (await pkg.exists()) {

    } else {
        await pkg.install()
    }

    const rootFilePath = pkg.getRootFilePath()
    if (rootFilePath) {
        try {
            // require(rootFilePath).call(null, Array.from(arguments))
            const args = Array.from(arguments)
            const cmd = args[args.length - 1]
            const o = Object.create(null)
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key != 'parent') {
                    o[key] = cmd[key]
                }
            })
            args[args.length - 1] = o
            const code = `require('${rootFilePath}').call(null, ${JSON.stringify(args)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })

            child.on('error', (e => {
                log.error(e.message)
                process.exit(1)
            }))

            child.on('exit', (e => {
                process.exit(e)
            }))
        } catch (error) {
            log.error(error.message)
        }
    }
}


function spawn (command, args, options) {
    const win32 = process.platform === 'win32'
    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args
    return cp.spawn(cmd, cmdArgs, options || {})
}