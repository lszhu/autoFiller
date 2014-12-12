var actionTest = {
    auth: true,
    url: 'http://218.76.253.36:40008/',
    username: 'admin',
    password: 'jyj222666',
    retryInterval: 2000,
    fields: ['username', 'id', 'phone'],
    driverPort: 6666,
    dataSource: '名单new.xlsx'
};

var actionChequeSys = {
    auth: true,
    url: 'http://localhost:23456/',
    username: 'admin',
    password: 'admin',
    retryInterval: 2000,
    fields: ['name', 'id', 'description']
};

var hunanGovernmentInput = {
    auth: true,
    url: 'http://59.231.0.185/creatorepp/',
    username: '1311273729',
    password: '123456',
    retryInterval: 5000,
    fields: ['username', 'id', 'phone']
};

var hunanGovernmentConfirm = {
    auth: true,
    url: 'http://59.231.0.185/creatorepp/',
    username: '1311273730',
    password: '123456',
    retryInterval: 5000
};

module.exports = {
    actionTest: actionTest,
    chequeSys: actionChequeSys,
    hunanGovernmentInput: hunanGovernmentInput,
    hunanGovernmentConfirm: hunanGovernmentConfirm
};