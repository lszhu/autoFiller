var webdriver = require('selenium-webdriver');

function login(driver, param, schema, times) {
    driver.get(param.url);

    driver.findElement(webdriver.By.name('username')).sendKeys(param.username);
    driver.findElement(webdriver.By.name('password')).sendKeys(param.password);
    driver.findElement(webdriver.By.tagName('button')).click();
    driver.wait(function() {
        return driver.getTitle().then(function(title) {
            var flow = webdriver.promise.controlFlow();
            var login = (title === 'cheque system');
            if (login) {
                console.log('成功登陆系统');
                // 开始从主进程中获取数据
                process.send({status: 'start'});
            } else {
                //webdriver.promise.rejected(new Error('loginErr'));
                driver.sleep(param.retryInterval);
                if (times != 0) {
                    //flow.emit('loginErr', {times: times - 1});
                    console.error('未能正常登录，稍后会自动重试。');
                    loginTest(driver, param, times - 1);
                } else {
                    flow.emit('loginRetryErr', {message: '登录失败次数过多'});
                    //driver.quit();
                }
            }
            return login;
        });
    }, 5000);
}

function createProject(driver, param, data) {
    //driver.findElement(webdriver.By.linkText('\u68C0\u7D22')).click();
    driver.get(param.url + '#/tool/createProject');
    //var gotoPage = driver.findElement(webdriver.By
    //    .css('.dropdown a[href="#tool/createProject"]'));
    //console.log('gotoPage: ' + gotoPage);
    ////gotoPage.click();
    //driver.sleep(3000);

    var username = driver.findElement(webdriver.By.name('name'));
    username.clear();
    username.sendKeys(data.name);
    var id = driver.findElement(webdriver.By.name('id'));
    id.clear();
    id.sendKeys(data.id);
    var description = driver.findElement(webdriver.By.name('description'));
    description.clear();
    description.sendKeys(data.description);
    var submit = driver.findElement(webdriver.By.css('button[type="submit"]'));
    submit.click();
    driver.sleep(3000);
    //driver.wait(webdriver.until.elementLocated(webdriver.By.tagName('table')),
    //    5000);
}

function searchProject(driver, param, data) {
    driver.get(param.url + '#/search/queryProject');

    var username = driver.findElement(webdriver.By.name('name'));
    username.clear();
    username.sendKeys(data.name);
    var id = driver.findElement(webdriver.By.name('id'));
    id.clear();
    id.sendKeys(data.id);
    var description = driver.findElement(webdriver.By.name('description'));
    description.clear();
    description.sendKeys(data.description);
    driver.findElement(webdriver.By.css('button[type="submit"]')).click();

    //driver.sleep(3000);
    driver.wait(webdriver.until
            .elementLocated(webdriver.By.className('glyphicon-remove')),
        5000)
        .then(function() {
            deleteProject(driver, param, data);
        }, function() {
            console.log('no such project');
        });
}

function deleteProject(driver, param, data) {
    //driver.findElement(webdriver.By.linkText('\u68C0\u7D22')).click();
    driver.findElement(webdriver.By.className('glyphicon-remove')).click();
    //driver.sleep(3000);
    driver.wait(webdriver.until.alertIsPresent , 5000)
        .then(null, function() {
            console.log('服务器没有响应');
        });
    driver.switchTo().alert().accept();
}

// 除登录外所有的工作流，注意在结束时要代表工作进程向主进程发送完成消息并传送数据
function workFlow(driver, param, schema, data) {
    if (schema == 'actionChequeSys') {
        createProject(driver, param, data);
    } else {
        searchProject(driver, param, data);
        deleteProject(driver, param, data);
    }

    // 发送成功操作数据
    driver.wait(function() {return true}, 1000)
        .then(function() {
            process.send({status: 'success', data: data});
            //console.log('data: ' + JSON.stringify(data));
        });
}

module.exports = {
    login: login,
    workFlow: workFlow
};
