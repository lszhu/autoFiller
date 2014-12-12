var webdriver = require('selenium-webdriver');

function loginTest(driver, param, schema, times) {
    driver.get(param.url);

    driver.findElement(webdriver.By.name('username')).sendKeys(param.username);
    driver.findElement(webdriver.By.name('password')).sendKeys(param.password);
    driver.findElement(webdriver.By.tagName('button')).click();
    driver.wait(function() {
        return driver.getTitle().then(function(title) {
            var flow = webdriver.promise.controlFlow();
            var login = (title === '劳动力资源信息库');
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

function searchTest(driver, param) {
    //driver.findElement(webdriver.By.linkText('\u68C0\u7D22')).click();
    driver.get(param.url + '/search');

    var username = driver.findElement(webdriver.By.name('username'));
    //username.clear();
    username.sendKeys('张');
    var ageMin = driver.findElement(webdriver.By.name('ageMin'));
    //ageMin.clear();
    ageMin.sendKeys('60');
    var ageMax = driver.findElement(webdriver.By.name('ageMax'));
    //ageMax.clear();
    ageMax.sendKeys('61');
    var query = driver.findElement(webdriver.By.css('.query'));
    query.click();
    driver.wait(webdriver.until.elementLocated(webdriver.By.tagName('table')),
        5000);

    //username.clear();
    //username.sendKeys('王');
    //query.click();
    //driver.wait(webdriver.until.elementLocated(webdriver.By.tagName('table')),
    //    5000);
}

function summaryTest(driver, param) {
    driver.get(param.url + '/summary');
    driver.wait(function() {
        return driver.getTitle().then(function(title) {
            return title === 'summary';
        });
    }, 5000);
}

// 除登录外所有的工作流
function workFlow(driver, param, schema, data) {
    searchTest(driver, param);
    summaryTest(driver, param);

    // 发送成功操作数据
    //var flow = webdriver.promise.controlFlow();
    //flow.execute(function() {
    //    process.send({status: 'success', data: data});
    //    console.log('data: ' + JSON.stringify(data));
    //});
    // 发送成功操作数据
    driver.wait(function() {return true})
        .then(function() {
            process.send({status: 'success', data: data});
            console.log('data: ' + JSON.stringify(data));
        })
}

module.exports = {
    login: loginTest,
    workFlow: workFlow
};
