var webdriver = require('selenium-webdriver');

function loginTest(driver, param, times) {
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

function login(driver, param, times) {
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

module.exports = {
    login: login,
    createProject: createProject,
    searchProject: searchProject,
    deleteProject: deleteProject
};
