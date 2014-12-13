// 录入数据源
var dataSource = require('./dataSource');
// 配置文件
var config = require('./config');

var parameter = require('./parameter');

var childProcess = require('child_process');

/*************************************************************
 * 根据是否需要本地数据，创建不同工作进程
 */

function createWorker(schema, port, browser) {
    console.log('port: ' + port);
    // 通过fork生成子进程（工作进程）
    var workerProcess = childProcess.fork(__dirname + '/worker.js',
        [schema, port, browser], {silent: true});

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

        process.emit('createWorker', {port: port});
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
                sourceData.index++;
            } else {
                // 已处理完所有数据
                workerProcess.send({status: 'noData'});
            }

            // 如果工作进程数还未达到指定数量，则继续创建新的工作进程
            if (workerProcesses.length < parameter.parallel) {
                console.log('create a new worker');
                // 为了不让工作进程突发的增加太快，此处加入产生概率
                if (Math.random() * workerProcesses.length < 0.5) {
                    process.emit('createWorker', {port: 0});
                }
            }
        } else if (m.status == 'finished') {
            // 工作进程已完成所有操作（操作流为空），且主程无待处理数据的情况
            //process.exit();
            process.emit('finished', {port: port});
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
// 跟踪所有工作子进程，数组长度代表工作进程的handler数目（并行工作进程数）
var workerProcesses = [];
// 工作进程采用的最小端口号
var basePort = +config[parameter.config].driverPort;

//process.on('data', function(data) {
//    // 保存处理成功的数据，由传来的消息中携带
//    successData.push(data);
//    var i = sourceData.index;
//    workerProcess.send({type: 'data', data: sourceData[i]});
//    sourceData.index++;
//});

process.on('finished', function(msg) {
    var port = msg.port;
    // 清除port端口对应工作进程句柄上disconnect消息监听，目的是不再启动工作进程
    console.log('remove disconnect listener for port %d handler', port);
    var index = port - basePort;
    workerProcesses[index].removeAllListeners('disconnect');
    workerProcesses[index] = null;

    // 检查是否还有在工作的工作进程
    if (workerProcesses.some(function(e) {return e != null;})) {
        return;
    }

    // 如果所有工作进程都已发送finished消息，则保存结果并退出主程序
    // 首先保存操作结果
    dataSource.saveResult(successData, sourceData, parameter.config);
    // 为了保证工作进程已经退出，主进程要稍等待几秒钟再退出
    setTimeout(function() {
        console.log('主程序正在退出');
    }, 1500);
    setTimeout(function() {
        process.exit();
    }, 3000);
});

process.on('createWorker', function(msg) {
    var port = msg.port;
    // 创建第一个工作进程之后，新增工作进程时，消息中没有携带有效端口号
    if (port == 0) {
        // 如果已达到设定工作进程数则不再创建新工作进程
        if (workerProcesses.length == parameter.parallel) {
            return;
        }
        port = basePort + workerProcesses.length;
    }

    var index = port - basePort;
    var schema = parameter.config;
    workerProcesses[index] = createWorker(schema, port, parameter.browser);
});

// 启动工作子进程
process.emit('createWorker', {port: basePort});
