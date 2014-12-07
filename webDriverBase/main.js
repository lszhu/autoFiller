var childProcess = require('child_process');
var fs = require('fs');

var xlsx = require('xlsx');

// 进程创建失败，重试间隔（单位ms）
var createInterval = 1000;

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
    var fields = ['姓名', '身份证号码', '联系电话'];
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

/*************************************************************
 * 根据是否需要本地数据，创建不同工作进程
 */

function createWorker(data, successData, failData) {
    var workerProcess = childProcess.fork(__dirname + '/worker.js',
        {silent: true});

    workerProcess.on('error', function() {
        console.log('暂时无法创建工作进程进行自动录入');
        setTimeout(function() {
            process.emit('createWorker');
        }, createInterval);
        //process.exit();
    });

    workerProcess.on('close', function(code) {
        console.log('worker exit code: ' + code);
    });

    workerProcess.on('disconnect', function() {
        console.log('工作子程序退出');
        // 工作子程序异常结束，则将相应处理的数据存入处理失败序列
        failData.push(data[data.index - 1]);
        //data.index++;
        process.emit('createWorker');
    });

    workerProcess.on('message', function(m) {
        if (isNaN(data.index)) {
            data.index = 0;
            if (data.length) {
                console.log('正在处理条目序号：1');
                console.log('信息内容为：', JSON.stringify(data[data.index]));
            }
        }

        if (m.status == 'accountErr') {
            process.emit('finished');
            //console.log('emit finished');
            return;
        }
        if (m.status == 'start') {
            if (data.length == 0) {
                // 无数据情况
                workerProcess.send({status: 'noData'});
            } else {
                workerProcess.send({status: 'data', data: data[data.index]});
            }
            return;
        } else if (m.status == 'success') {
            successData.push(data[data.index]);
        } else if (m.status == 'finished') {
            // 工作进程已完成所有操作（操作流为空），且主程无待处理数据的情况
            //process.exit();
            saveResult();
            process.emit('finished');
            console.log('当前工作任务已完成，程序即将终止');
        }

        data.index++;
        if (data.index < data.length) {
            // 还有未处理数据
            console.log('正在处理条目序号：', 1 + data.index);
            console.log('信息内容为：', JSON.stringify(data[data.index]));

            workerProcess.send({status: 'data', data: data[data.index]});
        } else {
            // 已处理完所有数据
            workerProcess.send({status: 'noData'});
        }
    });

    // 监听工作进程的标准输出和错误输出
    workerProcess.stdout.on('data', function(data) {
        console.log('worker stdout: ' + data);
    });
    workerProcess.stderr.on('data', function(data) {
        console.log('worker stderr: ' + data);
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

process.on('finished', function() {
    // 清除createWorker消息监听，目的是不再启动工作进程
    console.log('remove all listener for createWorker');
    process.removeAllListeners('createWorker');

    setTimeout(function() {
        console.log('主程序正在退出');
    }, 1500);

    setTimeout(function() {
        process.exit();
    }, 3000);
});

process.on('createWorker', function() {
    workerProcess = createWorker(data, successData, failData);
});

process.emit('createWorker');
