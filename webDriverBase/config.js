var actionTest = {
    url: 'http://218.76.253.36:40008/',
    username: 'admin',
    password: 'jyj222666',
    retryInterval: 2000,
    fields: ['姓名', '身份证号码', '联系电话']
};

var actionChequeSys = {
    url: 'http://localhost:23456/',
    username: 'admin',
    password: 'admin',
    retryInterval: 2000,
    fields: ['name', 'id', 'description']
};

var hunanGovernmentInput = {
    url: 'http://59.231.0.185/creatorepp/',
    username: '1311273729',
    password: '123456',
    retryInterval: 5000,
    fields: ['username', 'id', 'phone']
};

var hunanGovernmentConfirm = {
    url: 'http://59.231.0.185/creatorepp/',
    username: '1311273730',
    password: '123456',
    retryInterval: 5000
};

module.exports = {
    test: actionTest,
    chequeSys: actionChequeSys,
    hunanGovernmentInput: hunanGovernmentInput,
    hunanGovernmentConfirm: hunanGovernmentConfirm
};