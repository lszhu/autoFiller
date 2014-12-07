// 配置文件
var config = require('./config')['chequeSys'];
// 操作序列
var operation = require('./chequeSysOperation');
//var operation = require('./operation');

//var util = require('util');

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

/*************************************************************
 * 使用selenium独立服务器进行自动化操作的初始化配置
 */

var pathToSeleniumJar = './server/selenium-server-standalone-2.44.0.jar';
var server = new SeleniumServer(pathToSeleniumJar, {
    port: 4444
});
// 启动selenium独立服务器
server.start();

var driver = new webdriver.Builder().
    usingServer(server.address()).
    withCapabilities(webdriver.Capabilities.ie()).
    build();

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

function setFlow() {
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
        process.send({status: 'accountErr'});
    });

    // 当前操作流完成的消息处理
    flow.on('idle', function() {
        //console.log('idle now');
        addOperation(driver, config);
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
function addOperation(driver, param) {
    //console.log('data: ' + JSON.stringify(data));
    if (data.status == 'data') {
        // test(hrSys) operation
        //operation.search(driver, param);
        //operation.summary(driver, param);

        // chequeSys operation
        operation.createProject(driver, param, data.data);

        data = null;
        process.send({status: 'success'});
    } else if (data.status == 'noData') {
        // 结束操作并关闭操作窗口
        process.emit('finished', {message: '所有操作已成功处理'});
        //console.log('operation is over.');
        process.send({status: 'finished'});
    }
}
//function addOperation(driver, param) {
//    if (counter > 0) {
//        operation.search(driver, param);
//        operation.summary(driver, param);
//    } else if (counter == 0) {
//        // 结束操作并关闭操作窗口
//        flow.emit('finished', {message: '所有操作已成功处理'});
//        //process.exit();
//    }
//    counter--;
//}

/*************************************************************
 * 主程序控制流
 */

//var counter = 1;
var data = null;

var flow = setFlow();

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

process.on('finished', function() {
    flow.emit('finished', {message: '所有操作已成功处理'});
    //process.send({status: 'finished'});
    console.log('operation is over.');
});

process.on('message', function(d) {
    data = d;
    //console.log('data: ' + JSON.stringify(data));
});

operation.login(driver, config, 3);

console.log('child process started.');