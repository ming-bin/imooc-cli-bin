'use strict';
const path = require('path')
const npmInstall = require('npminstall')
const pathExists = require('path-exists')
const fse = require('fs-extra')

const pkgDir = require('pkg-dir').sync
const { isObject } = require('@imooc-cli-bin/utils')
const formatPath = require('@imooc-cli-bin/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@imooc-cli-bin/get-npm-info')

class Package {
    constructor(options) {
        if (!options || !isObject(options)) {
            throw new Error('Package类的options不能为空！')
        }
        // package路径
        this.targetPath = options.targetPath
        // 缓存package路径
        this.storeDir = options.storeDir
        this.packageName = options.packageName
        this.packageVersion = options.packageVersion
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare () {
        if (this.storeDir && !pathExists(this.storeDir)) {
            fse.mkdirpSync(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion()
        }
    }

    // 判断当前package是否存在
    async exists () {
        if (this.storeDir) {
            await this.prepare()
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    get cacheFilePath () {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    getSpecificCacheFilePath (packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }

    // 安装package
    async install () {
        await this.prepare()
        return npmInstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]
        })
    }

    // 更新package
    async update () {
        await this.prepare()
        const latestPackageVersion = await getNpmLatestVersion(this.packageName)
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        if (!pathExists(latestFilePath)) {
            await npmInstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestPackageVersion
                    }
                ]
            })
            this.packageVersion = latestPackageVersion
        }
    }

    // 获取入口文件路径
    getRootFilePath () {
        function _getRootFile (filePath) {
            const dir = pkgDir(filePath)
            if (dir) {
                const pkgFile = require(path.resolve(dir, 'package.json'))
                if (pkgFile && (pkgFile.main || pkgFile.lib)) {
                    return formatPath(path.resolve(dir, pkgFile.main || pkgFile.lib))
                }
            }
            return null
        }
        if (this.storeDir) {
            return _getRootFile(this.cacheFilePath)
        } else {
            return _getRootFile(this.targetPath)
        }
    }
}


module.exports = Package;