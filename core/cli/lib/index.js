'use strict';
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const semver = require('semver')
const colors = require('colors/safe')
const commander = require('commander')

const path = require('path')
const pkg = require('../package.json')
const log = require('@imooc-cli-bin/log')
const { getNpmSemverVersion } = require('@imooc-cli-bin/get-npm-info')
const exec = require('@imooc-cli-bin/exec')
const config = require('./config')
module.exports = cli;

const program = new commander.Command()
let args

async function cli () {
    try {
        await prepare()
        reisterCommand()
    } catch (e) {
        log.error(e.message)
    }
}

function reisterCommand () {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec)

    program.on('option:debug', () => {
        if (program.opts().debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
        log.verbose('debug', 'test debug')
    })

    program.on('option:targetPath', () => {
        process.env.CLI_TARGET_PATH = program.opts().targetPath
    })

    program.on('command:*', (obj) => {
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知命令：' + obj[0]));
        if (availableCommands.length > 0) {
            console.log(colors.red('可用命令：' + availableCommands.join(',')));
        }
    })
    program.parse(process.argv)

    if (program.args && program.args.length < 1) {
        program.outputHelp()
        console.log();
    }
}

async function prepare () {
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    // checkInputArgs()
    // log.verbose('debug', 'test debug')
    checkEnv()
    await checkGlobalUpdate()
}

async function checkGlobalUpdate () {
    const currentVersion = pkg.version
    const npmName = pkg.name
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新${npmName},当前版本：${currentVersion},最新版本${lastVersion}
           更新命令：npm install -g ${npmName}`))
    }
}

function checkEnv () {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotenvConfig = dotenv.config({
            path: dotenvPath
        })
        return
    }
    createDefaultConfig()
    // console.log(process.env.CLI_HOME);
}

function createDefaultConfig () {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, config.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME = cliConfig.cliHome
}

function checkUserHome () {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在！'));
    }
}

function checkRoot () {
    const rootCheck = require('root-check');
    rootCheck(colors.red('请避免使用 root 账户启动本应用'));
}

function checkPkgVersion () {
    log.info('version', pkg.version)
}
