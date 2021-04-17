'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver');

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
    getDefaultRegistry,
    getNpmLatestVersion
};

function getNpmInfo (npmName, registry) {
    if (!npmName) {
        return null
    }
    return new Promise((resolve, reject) => {
        const registryUrl = registry || getDefaultRegistry()
        const npmInfoUrl = urlJoin(registryUrl, npmName)
        axios.get(npmInfoUrl).then((result) => {
            if (result.status === 200) {
                resolve(result.data)
            } else {
                reject()
            }
        }).catch((err) => {
            reject(err)
        });
    })
}

function getDefaultRegistry (isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'htps://registry.npm.taobao.org'
}

async function getNpmVersions (npmName, registry) {
    const data = await getNpmInfo(npmName, registry)
    if (data) {
        return Object.keys(data.versions)
    }
    return []
}

function getSemverVersions (baseVersion, versions) {
    return versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => semver.gt(b, a))
}

async function getNpmSemverVersion (baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    const newVersions = getSemverVersions(baseVersion, versions)
    if (newVersions && newVersions.length > 0) {
        return newVersions[0]
    }
    return null
}

async function getNpmLatestVersion (npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    if (versions) {
        return versions.sort((a, b) => semver.gt(b, a))[0]
    }
    return null
}