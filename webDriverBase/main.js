// 录入数据源
var dataSource = require('./dataSource');

var childProcess = require('child_process');
var path = require('path');

// 进程创建失败，重试间隔（单位ms）
var createInterval = 1000;


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
        if (data.index > 0) {
            data.index--;
            failData.push(data[data.index]);
        }

        process.emit('createWorker');
    });

    workerProcess.on('message', function(m) {
        if (m.status == 'accountErr') {
            process.emit('finished');
            console.log('账号错误，程序即将终止');
            return;
        }
        if (m.status == 'start') {
            if (isNaN(data.index)) {
                // 还未开始处理过数据
                data.index = 0;
            }
            if (data.length == 0) {
                // 无数据情况
                workerProcess.send({status: 'noData'});
            } else {
                console.log('正在处理条目序号：1');
                console.log('信息内容为：', JSON.stringify(data[data.index]));
                workerProcess.send({status: 'data', data: data[data.index]});
            }
            return;
        } else if (m.status == 'success') {
            successData.push(data[data.index]);
        } else if (m.status == 'finished') {
            // 工作进程已完成所有操作（操作流为空），且主程无待处理数据的情况
            //process.exit();
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

// 用于test（hrSys）项目测试
//var filePath = '../data/名单.xlsx';
//var data = filterData(getData(filePath));

// 用于chequeSys项目测试
//var filePath = '../data/project.xlsx';
//var data = getData(filePath);

var filename = '名单new.xlsx';
var data = dataSource.getData(path.join(__dirname, '../data/', filename));
// 过滤掉不完整数据项
data = dataSource.filterData(data);
// 过滤掉身份证非法及电话号码非法的数据项
data = data.filter(function(e) {
    return dataSource.validIdNumber(e.id) && dataSource.validPhone(e.phone);
});
// 插入性别：male表示男，female表示女
for (var i = 0, len = data.length; i < len; i++) {
    data[i]['gender'] = dataSource.getGender(data[i]['id'])
}

console.log(data);
//jsonToCsv('../data/success-' + 'tmp' + '.txt', data, config.fields);

// 保存处理成功的数据
var successData = [];
// 保存不能确认处理成功的数据
var failData = [];
// 跟踪工作子进程
var workerProcess;

process.on('finished', function() {
    // 清除createWorker消息监听，目的是不再启动工作进程
    console.log('remove all listener for createWorker');
    process.removeAllListeners('createWorker');
    // 保存操作结果
    dataSource.saveResult(successData, failData);
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

// 启动工作子进程
process.emit('createWorker');
