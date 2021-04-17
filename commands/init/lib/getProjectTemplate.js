const request = require('@imooc-cli-bin/request')

module.exports = function () {
    return request({
        url: '/project/getTemplate'
    })
}