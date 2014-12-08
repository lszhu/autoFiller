var webdriver = require('selenium-webdriver');

// 由身份证的到性别
function getGender(idNumber) {
    if (!idNumber) {
        return;
    }
    var index = idNumber.toString().slice(16, 17);
    index = index % 2;
    return index ? 'male' : 'female';
}

function login(driver, param, times) {
    driver.get(param.url);

    driver.switchTo().frame('body')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
            function() {console.log('find embedded frame');},
            function(e) {console.log('err'); console.log(e);}
    );

    var username = driver
        .findElement(webdriver.By.css('input.kuan[name="userName"]'));
    username.then(
        function() {console.log('find username');},
        function(e) {console.log('username error'); console.log(e);}
    );
    username.sendKeys(param.username);

    var password = driver
        .findElement(webdriver.By.css('input.kuan[name="password"]'));
    password.then(
        function() {console.log('find password');},
        function(e) {console.log('password error'); console.log(e);}
    );
    password.sendKeys(param.password);

    var button = driver.findElement(webdriver.By
        .css('img[src$="logins_07.jpg"]'));
    button.then(
        function() {console.log('find button');},
        function(e) {console.log('button error'); console.log(e);}
    );
    button.click();

    driver.sleep(3000);

    driver.wait(function() {
        return driver.getTitle().then(function(title) {
            var flow = webdriver.promise.controlFlow();
            var ok = (title === '湖南省网上政务服务--59.231.0.185');
            if (ok) {
                console.log('成功登陆系统');
                // 开始从主进程中获取数据
                process.send({status: 'start'});
            } else {
                //webdriver.promise.rejected(new Error('loginErr'));
                driver.sleep(param.retryInterval);
                if (times != 0) {
                    //flow.emit('loginErr', {times: times - 1});
                    console.error('未能正常登录，稍后会自动重试。');
                    login(driver, param, times - 1);
                } else {
                    flow.emit('loginRetryErr', {message: '登录失败次数过多'});
                    //driver.quit();
                }
            }
            return ok;
        });
    }, 5000);
}

function gotoAddPage(driver) {
    driver.switchTo().defaultContent();
    driver.switchTo().frame('perspective_main')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find perspective_main frame');},
        function(e) {console.log('err'); console.log(e);}
    );
    driver.switchTo().frame('perspective_toolbar')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find perspective_content frame');},
        function(e) {console.log('err'); console.log(e);}
    );

    var target = driver
        .findElement(webdriver.By.linkText('办件受理'));
    target.then(
        function() {console.log('查找到“办件受理”链接');},
        function(e) {console.log('没有“办件受理”链接'); console.log(e);}
    );
    target.click();

}

function addApplication(driver, param, data) {

    driver.switchTo().defaultContent();
    driver.switchTo().frame('perspective_main')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find perspective_main frame');},
        function(e) {console.log('err'); console.log(e);}
    );
    driver.switchTo().frame('perspective_content')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find perspective_content frame');},
        function(e) {console.log('err'); console.log(e);}
    );
    driver.switchTo().frame('base_actions_container')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find base_actions_container frame');},
        function(e) {console.log('err'); console.log(e);}
    );
    driver.switchTo().frame('base_properties_container')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find base_properties_container frame');},
        function(e) {console.log('err'); console.log(e);}
    );
    driver.switchTo().frame('base_properties_content')
        //.frame(driver.findElement(webdriver.By.css('frame[name="body"]')))
        .then(
        function() {console.log('find base_properties_content frame');},
        function(e) {console.log('err'); console.log(e);}
    );

    var type = driver.findElement(webdriver.By.id('applyTypeCtrl_2'));
    type.sendKeys(data.name);
    var username = driver.findElement(webdriver.By.name('name'));
    username.clear();
    username.sendKeys(data.name);
    var id = driver.findElement(webdriver.By.name('id'));
    id.clear();
    id.sendKeys(data.id);
    var gender = getGender(data.id);
    gender = driver.findElement(webdriver.By.id(gender));
    gender.sendKeys(data.name);
    var phone = driver.findElement(webdriver.By.name('description'));
    phone.clear();
    phone.sendKeys(data.description);
    var material = driver.findElement(webdriver.By.id('applyTypeCtrl_2'));
    material.sendKeys(data.name);

    var submit = driver.findElement(webdriver.By.css('button[type="submit"]'));
    submit.click();

    driver.then(
        function() {console.log('操作成功完成');},
        function(e) {console.log('办件受理页面不完整'); console.log(e);}
    );
    //driver.sleep(3000);
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
    gotoAddPage: gotoAddPage,
    addApplication: addApplication,
    searchProject: searchProject,
    deleteProject: deleteProject
};
