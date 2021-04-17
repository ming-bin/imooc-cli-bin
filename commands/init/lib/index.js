'use strict';
const inquirer = require('inquirer')
const semver = require('semver')
const fse = require('fs-extra')
const fs = require('fs')
const log = require('@imooc-cli-bin/log')
const command = require('@imooc-cli-bin/command');
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends command {
    init () {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
    }

    async exec () {
        const projectInfo = await this.prepare()
        if (projectInfo) {
            this.projectInfo = projectInfo
            this.downloadTemplate()
        }
    }

    downloadTemplate () { }

    async prepare () {
        // 判断项目模板是否存在
        const template = await getProjectTemplate()
        console.log(template);
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在！')
        }
        this.template = template
        const localPath = process.cwd()
        // 判断当前项目是否为空
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false
            if (!this.force) {
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件为空，是否继续创建项目？'
                })).ifContinue
                if (!ifContinue) return
            }
            if (ifContinue || this.force) {
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if (confirmDelete) {
                    // 清空当前目录
                    fse.emptyDirSync(localPath)
                }
            }
        }
        return this.getProjectInfo()
    }

    async getProjectInfo () {
        let projectInfo = {}
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT,
            }, {
                name: '组件',
                value: TYPE_COMPONENT,
            }]
        })
        log.verbose('type', type)
        if (type === TYPE_PROJECT) {
            const project = inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                            done('请输入合法的项目名称！')
                            return
                        }
                        done(null, true)
                    }, 0)
                },
                filter: function (v) {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!semver.valid(v)) {
                            done('请输入合法的版本号！')
                            return
                        }
                        done(null, true)
                    }, 0)
                },
                filter: function (v) {
                    if (!!semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }])
            projectInfo = {
                type,
                ...project
            }
        } else if (type === TYPE_COMPONENT) {

        }
        return projectInfo
    }

    isDirEmpty (localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => {
            return !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        })
        return !fileList || fileList.length <= 0
    }
}


function init (argv) {
    return new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand;