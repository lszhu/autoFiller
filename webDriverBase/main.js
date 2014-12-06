var childProcess = require('child_process');
var fs = require('fs');

var xlsx = require('xlsx');

// 进程创建失败，重试间隔（单位ms）
var createInterval = 1000;

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
    return data.filter(function(e) {
        var empty = true;
        for (var i in e) {
            if (e.hasOwnProperty(i)) {
                empty = false;
                if (!e[i]) {
                    return false;
                }
            }
        }
        return !empty;
    });
}

function createWorker(data, successData, failData) {
    var workerProcess = childProcess.fork(__dirname + '/worker.js');

    workerProcess.on('error', function() {
        console.log('暂时无法创建工作进程进行自动录入');
        setTimeout(function() {
            process.emit('createWorker');
        }, createInterval);
        //process.exit();
    });

    workerProcess.on('disconnect', function() {
        console.log('工作子程序异常结束');
        // 工作子程序异常结束，则将相应处理的数据存入处理失败序列
        failData.push(data[data.index]);
        data.index++;
        process.emit('createWorker');
    });

    workerProcess.on('message', function(m) {
        if (isNaN(data.index)) {
            data.index = 0;
        } else {
            console.log('正在处理条目序号：', data.index);
            console.log('信息内容为：', JSON.stringify(data[data.index]));
        }

        if (m.type == 'start') {
            if (data.length == 0) {
                // 无数据情况
                workerProcess.send('');
            } else {
                workerProcess.send(data[data.index]);
            }
            return;
        } else if (m.type == 'success') {
            successData.push(data[data.index]);
        }

        data.index++;
        if (data.index < data.length) {
            // 还有未处理数据
            workerProcess.send(data[data.index]);
        } else {
            // 已处理完所有数据
            workerProcess.send('');
            saveResult();
            process.exit();
        }
    });

    return workerProcess;
}

/***************************************************************
 * 主程序流程
 */

var filePath = '../data/名单.xlsx';
var data = filterData(getData(filePath));
//console.log(data);
var successData = [];
var failData = [];

var workerProcess;

process.on('createWorker', function() {
    workerProcess = createWorker(data, successData, failData);
});

process.emit('createWorker');

function saveResult() {
    var success = '';
    var fail = '';
    var date = (new Date()).toLocaleString();
    var i, len;
    for (i = 0, len = successData.length; i < len; i++) {
        success += JSON.stringify(successData[i]) + '\n';
    }
    fs.writeFileSync('../data/success-' + date + '.txt', success);
    for (i = 0, len = failData.length; i < len; i++) {
        fail += JSON.stringify(successData[i]) + '\n';
    }
    fs.writeFileSync('../data/fail-' + date + '.txt', fail);
}

// 仅用于测试
//console.log(getData('../data/名单.xlsx'));