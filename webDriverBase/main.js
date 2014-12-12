// 录入数据源
var dataSource = require('./dataSource');
// 配置文件
var config = require('./config');

var parameter = require('./parameter');

var childProcess = require('child_process');

/*************************************************************
 * 根据是否需要本地数据，创建不同工作进程
 */

function createWorker(schema, index) {
    var port = +config[schema].driverPort;
    port += +index;
    console.log('port: ' + port);
    // 通过fork生成子进程（工作进程）
    var workerProcess = childProcess.fork(__dirname + '/worker.js',
        [schema, port], {silent: true});

    // 进程创建失败，重试间隔（单位ms）
    var createInterval = 1000;

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
        //if (data.index > 0) {
        //    data.index--;
        //    failData.push(data[data.index]);
        //}

        process.emit('createWorker', {index: index});
    });

    workerProcess.on('message', function(m) {
        var data;
        if (m.status == 'accountErr') {
            process.emit('finished');
            console.log('账号错误，程序即将终止');
            return;
        }
        if (m.status == 'start') {
            sourceData.count++;
            if (isNaN(sourceData.index)) {
                // 对应的操作模式不需要数据
                workerProcess.send({status: 'continue'});
                console.log('正在进行重复操作的次数：' + sourceData.count);
            } else if (sourceData.length == 0) {
                // 无数据情况
                workerProcess.send({status: 'noData'});
            } else {
                data = sourceData[sourceData.index];
                sourceData.index++;
                console.log('正在处理条目序号：' + sourceData.count);
                console.log('信息内容为：', JSON.stringify(data));
                workerProcess.send({status: 'data', data: data});
            }
        } else if (m.status == 'success') {
            if (m.data) {
                successData.push(m.data);
            }
            if(0 <= sourceData.index) {
                sourceData.index++;
            }
            sourceData.count++;
            if (!sourceData.index) {
                // 无数据源的情况
                console.log('正在进行重复操作的次数：' + sourceData.count);
                workerProcess.send({status: 'continue'});
            } else if (sourceData.index < sourceData.length) {
                // 还有未处理数据
                data = sourceData[sourceData.index];
                console.log('正在处理条目序号：',  + sourceData.count);
                console.log('信息内容为：', JSON.stringify(data));

                workerProcess.send({status: 'data', data: data});
            } else {
                // 已处理完所有数据
                workerProcess.send({status: 'noData'});
            }
        } else if (m.status == 'finished') {
            // 工作进程已完成所有操作（操作流为空），且主程无待处理数据的情况
            //process.exit();
            process.emit('finished');
            console.log('当前工作任务已完成，程序即将终止');
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

// 读取待录入的数据
var sourceData = dataSource.getData(parameter.input, parameter.config);
//console.log(sourceData);

// 保存处理成功的数据
var successData = [];
// 保存不能确认处理成功的数据
//var failData = [];
// 跟踪所有工作子进程
var workerProcess = [];

//process.on('data', function(data) {
//    // 保存处理成功的数据，由传来的消息中携带
//    successData.push(data);
//    var i = sourceData.index;
//    workerProcess.send({type: 'data', data: sourceData[i]});
//    sourceData.index++;
//});

process.on('finished', function() {
    // 清除createWorker消息监听，目的是不再启动工作进程
    console.log('remove all listener for createWorker');
    process.removeAllListeners('createWorker');
    // 保存操作结果
    dataSource.saveResult(successData, sourceData, parameter.config);
    setTimeout(function() {
        console.log('主程序正在退出');
    }, 1500);

    setTimeout(function() {
        process.exit();
    }, 3000);
});

process.on('createWorker', function(msg) {
    var schema = parameter.config;
    var port = +config[schema]['driverPort'];
    port += +msg.index;
    workerProcess[+msg.index] = createWorker(schema, msg.index);
});

// 启动工作子进程
process.emit('createWorker', {index: 0});
