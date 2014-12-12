// 配置文件
var config = require('./config');

var fs = require('fs');
var path = require('path');
var xlsx = require('xlsx');

/*************************************************************
 * 从本地文件获取待处理数据
 */

function readXlsx(filePath) {
    try {
        var xlsxData = xlsx.readFile(filePath);
        var sheetName = xlsxData.SheetNames[0];
        xlsxData = xlsx.utils.sheet_to_json(
            xlsxData.Sheets[sheetName],
            {raw: true}
        );
    } catch (e) {
        console.log('数据文件读取失败');
        return;
    }
    return xlsxData;
}

// 过滤掉数据不完整的条目
function filterData(data, schema) {
    var fields = config[schema].fields;
    return data.filter(function(e) {
        for (var i = 0; i < fields.length; i++) {
            if (!e.hasOwnProperty(fields[i]) || !e[fields[i]]) {
                return false;
            }
        }
        return true;
    });
}

/***************************************************************
 * 用于保存结果的工具函数
 */

// 保存处理过的数据到文件
function saveResult(successData, sourceData, schema) {
    var timeId = timeToId();
    var fields = config[schema].fields;
    jsonToCsv(path.join(__dirname, '../data/success-' + timeId + '.csv'),
        successData, fields);
    var failData = filterSuccess(successData, sourceData, schema);
    jsonToCsv(path.join(__dirname, '../data/fail-' + timeId + '.csv'),
        failData, fields);
    /*
     var success = '';
     var fail = '';
     var timeId = timeToId();

     var i, len;
     for (i = 0, len = successData.length; i < len; i++) {
     success += JSON.stringify(successData[i]) + '\r\n';
     }
     if (success) {
     fs.writeFileSync('../data/success-' + timeId + '.txt', success);
     }

     for (i = 0, len = failData.length; i < len; i++) {
     fail += JSON.stringify(successData[i]) + '\r\n';
     }
     if (fail) {
     fs.writeFileSync('../data/fail-' + timeId + '.txt', fail);
     }
     */
}

// 从sourceData中过滤除successData中的数据，返回结果数组
function filterSuccess(successData, sourceData,  schema) {
    var fields = config[schema].fields;
    var len = fields.length;
    return sourceData.filter(function(a) {
        return !successData.some(function(b) {
            for (var i = 0; i < len; i++) {
                if (a[fields[i]] != b[fields[i]]) {
                    return false;
                }
            }
            return true;
        });
    });
}

// JSON格式数据的数组转换并保存到csv格式文件
function jsonToCsv(filePath, data, fields) {
    // 如果没有数据，则直接返回
    if (data.length == 0) {
        return;
    }
    var d = '';
    var i, j;
    var fieldsLen = fields.length - 1;
    for (i = 0; i < fieldsLen; i++) {
        d += fields[i] + ',';
    }
    d += fields[fieldsLen] + '\r\n';
    var len = data.length;
    for (i = 0; i < len; i++) {
        for (j = 0; j < fieldsLen; j++) {
            //console.log('fields: ' + [fields[j]]);
            //console.log('d: ' + d);
            d += data[i][fields[j]] + ',';
        }
        d += data[i][fields[fieldsLen]] + '\r\n';
    }
    fs.writeFileSync(filePath, d, 'utf8');
}

// 由时间戳生成唯一标识，用于文件名
function timeToId() {
    var date = new Date();
    var id = date.getFullYear();
    id += (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
    id += (date.getDate() < 10 ? '0' : '') + date.getDate();
    id += '-' + date.getHours() + '-' +
    date.getMinutes() + '-' + date.getSeconds();
    return id;
}

// 验证身份证号的合法性
function validIdNumber(id) {
    if (!id) {
        return false;
    }
    var idNumber = id.toString();
    if (idNumber.length != 18 || 12 < idNumber.slice(10, 12) ||
        idNumber.slice(6, 8) < 19 || 20 < idNumber.slice(6, 8)) {
        return false;
    }
    var weights = [
        '7', '9', '10', '5', '8', '4', '2', '1', '6',
        '3', '7', '9', '10', '5', '8', '4', '2', '1'
    ];
    var sum = 0;
    for (var i = 0; i < 17; i++) {
        var digit = idNumber.charAt(i);
        if (isNaN(Number(digit))) {
            return false;
        }
        sum += digit * weights[i];
    }
    sum = (12 - sum % 11) % 11;
    return sum == 10 && idNumber.charAt(17).toLowerCase() == 'x' ||
        sum < 10 && sum == idNumber.charAt(17);
}

// 验证电话号码，要求至少包含11位数字
function validPhone(phone) {
    return !isNaN(phone) && phone.toString().length >= 11;
}

// 由身份证的到性别
function getGender(idNumber) {
    if (!idNumber) {
        return;
    }
    var index = idNumber.toString().slice(16, 17);
    // 如果身份证异常，则默认为男
    if (isNaN(index) || index === '') {
        return 'male';
    }
    index = index % 2;
    return index ? 'male' : 'female';
}

///////////////////////////////////////////////////////////////
// 以下为具体不同模式下读取数据的操作

// 测试hrsys录入数据源获取
function actionTestData(filename) {
    return readXlsx(path.join(__dirname, '../data/', filename));
}

// 测试chequeSys录入数据源获取
function actionChequeSysData(filename) {
    return readXlsx(path.join(__dirname, '../data/', filename));
}

// hunanGovernment录入数据源获取
function hunanGovernmentInputData(filename) {
    var data = readXlsx(path.join(__dirname, '../data/', filename));
    // 过滤掉不完整数据项
    data = filterData(data, 'hunanGovernmentInput');
    // 过滤掉身份证非法及电话号码非法的数据项
    data = data.filter(function(e) {
        return validIdNumber(e.id) && validPhone(e.phone);
    });
    // 插入性别：male表示男，female表示女
    for (var i = 0, len = data.length; i < len; i++) {
        data[i]['gender'] = getGender(data[i]['id'])
    }
    return data;
}

function getData(filename, schema) {
    var data = [];
    data.count = 0;
    // 未设置操作模式或模式非法
    if (!schema || !config[schema]) {
        return data;
    }

    var defaultFile = config[schema].dataSource;
    // 如果不存在dataSource，则表示该模式不需要数据输入
    if (!defaultFile) {
        return data;
    }
    filename = filename ? filename : defaultFile;

    var functions = {
        actionTest: actionTestData,
        actionChequeSys: actionChequeSysData,
        hunanGovernmentInput: hunanGovernmentInputData
    };
    data = functions[schema](filename);
    data.index = 0;
    data.count = 0;
    return data;
}

module.exports = {
    readXlsx: readXlsx,
    filterData: filterData,
    saveResult: saveResult,
    jsonToCsv: jsonToCsv,
    timeToId: timeToId,
    getGender: getGender,
    validIdNumber: validIdNumber,
    validPhone: validPhone,
    filterSuccess: filterSuccess,
    getData: getData
};