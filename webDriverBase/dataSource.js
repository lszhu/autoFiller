// 配置文件
var config = require('./config')['hunanGovernmentInput'];

var fs = require('fs');
var xlsx = require('xlsx');

/*************************************************************
 * 从本地文件获取待处理数据
 */

function getData(filePath) {
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
function filterData(data) {
    var fields = config.fields;
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
function saveResult() {
    var timeId = timeToId();
    var fields = config.fields;
    jsonToCsv('../data/success-' + timeId + '.csv', successData, fields);
    jsonToCsv('../data/fail-' + timeId + '.csv', failData, fields);
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

module.exports = {
    getData: getData,
    filterData: filterData,
    saveResult: saveResult,
    jsonToCsv: jsonToCsv,
    timeToId: timeToId
};