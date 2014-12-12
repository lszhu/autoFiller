// 通过启动参数传入工作进程采用的模式
var schema = process.argv[2];
console.log('schema: ' + schema);
var driverPort = process.argv[3];
console.log('driver port: ' + driverPort);
// 配置文件
var config = require('./config');
// 操作序列
var operation = loadOperation(schema);

// 由传入参数schema决定加载不同的操作
function loadOperation(schema) {
    if (schema == 'actionTest') {
        return require('./testOperation');
    }
    if (schema == 'actionChequeSys') {
        return require('./chequeSysOperation');
    }
    if (schema == 'hunanGovernmentInput' ||
        schema == 'hunanGovernmentConfirm') {
        return require('./hunanGovernment');
    }
}

var path = require('path');
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

/*************************************************************
 * 使用selenium独立服务器进行自动化操作的初始化配置
 */

var pathToSeleniumJar = './server/selenium-server-standalone-2.44.0.jar';
var server = new SeleniumServer(
    path.join(__dirname, pathToSeleniumJar),
    {port: driverPort}
);
// 启动selenium独立服务器
server.start();

var driver = new webdriver.Builder().
    usingServer(server.address()).
    withCapabilities(webdriver.Capabilities.ie()).
    //withCapabilities(webdriver.Capabilities.firefox()).
    build();

// 设置加载页面等待的默认最大时间
//driver.manage().timeouts().pageLoadTimeout(30000);
// 设置获取页面元素的最大等待时间
//driver.manage().timeouts().implicitlyWait(30000);
// 设置窗口的位置于左上角
driver.manage().window().setPosition(0, 0);

/*************************************************************
 * 使用chromeDriver进行自动化操作的初始化配置
 */
/*
 var driver = new webdriver.Builder().
 withCapabilities(webdriver.Capabilities.chrome()).
 build();
 */

/*************************************************************
 * 设置操作流的事件响应
 */

function setFlow(config, schema) {
    // 取得初始操作流
    var flow = webdriver.promise.controlFlow();

    //操作序列中的未知异常处理
    flow.on('uncaughtException', function(e) {
        var quit = e.toString().search('WebDriver.quit()');
        if (quit != -1) {
            console.log('退出操作主动终止工作进程。\n');
        } else {
            console.error('工作进程遇到异常情况，已经终止执行。\n');
        }
        driver.quit();
        server.stop();
    });

    // 登录错误处理
    //flow.on('loginErr', function(e) {
    //    console.error('未能正常登录，稍后会自动重试。');
    //    //operation.login(driver, config, e.times);
    //});

    // 多次重试登录错误处理
    flow.on('loginRetryErr', function(e) {
        console.error(e.message);
        driver.quit();
        server.stop();
        // 向主程序发送账号错误消息
        process.send({status: 'accountErr'});
    });

    // 当前操作流完成的消息处理
    flow.on('idle', function() {
        //console.log('idle now');
        addOperation(driver, config[schema], schema);
        // 向主程序发送已处理数据
        process.send({status: 'success', data: processedData});
    });

    // 所有操作已完成
    flow.on('finished', function(d) {
        console.log(d.message);
        //driver.close();
        driver.quit();
        server.stop();
        //server.kill();
        console.log('operation flow is ended');
        //process.exit();
    });

    return flow;
}

// 加入自动化操作
function addOperation(driver, param, schema) {
    //console.log('data: ' + JSON.stringify(data));
    if (data.status == 'data') {
        // 获取到新的待处理数据
        operation.workFlow(driver, param, schema, data.data);
        data = null;
        process.send({status: 'success'});
    } else if (data.status == 'noData') {
        // 结束操作并关闭操作窗口
        process.emit('finished', {port: driverPort});
        //console.log('operation is over.');
        //process.send({status: 'finished'});
    } else if (data.status == 'continue') {
        //无需数据源对应的处理模式
        operation.workFlow(driver, param, schema);
        process.send({status: 'success'});
    }
}

/*************************************************************
 * 主程序控制流
 */

//var counter = 1;
var data = null;
var processedData = null;

var flow = setFlow(config, schema);

// 主程序控制流未知异常
process.on('uncaughtException', function(d) {
    var quit = d.toString().search('WebDriver.quit()');
    if (quit != -1) {
        console.log('程序已经终止。\n');
    } else {
        console.error('程序遇到异常情况，已经终止执行。\n');
    }
    process.disconnect();
});

// 当工作进程的操作完成时可以发射finished事件来结束工作进程，并通知主程序
process.on('finished', function() {
    flow.emit('finished', {message: '所有操作已成功处理'});
    process.send({status: 'finished'});
    console.log('operation is over.');
});

process.on('message', function(d) {
    data = d;
    //console.log('data: ' + JSON.stringify(data));
});

if (config[schema].auth) {
    // 需要登录的情况
    operation.login(driver, config[schema], schema, 2);
} else {
    // 无需登录则直接进入操作状态
    flow.emit('idle');
}

console.log('创建了一个工作进程');