var path = require('path');

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

/*************************************************************
 * 使用selenium独立服务器进行自动化操作的初始化配置
 */

var pathToSeleniumJar = './server/selenium-server-standalone-2.44.0.jar';
var server = new SeleniumServer(
    path.join(__dirname, pathToSeleniumJar),
    {port: 49900}
);
// 启动selenium独立服务器
server.start();

var driver = new webdriver.Builder().
    usingServer(server.address()).
    withCapabilities(webdriver.Capabilities.ie()).
    //withCapabilities(webdriver.Capabilities.firefox()).
    build();


driver.manage().window().setPosition(0, 0);

driver.get('http://cn.bing.com/?mkt=zh-cn');
driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
driver.findElement(webdriver.By.name('go')).click();
driver.wait(function() {
 return driver.getTitle().then(function(title) {
   return title.search('webdriver') != -1;
 });
}, 2000)
    .then(
    function() {console.log('Great, your configuation is right.')},
    function() {console.log('Oh, please check your configuration.')}
);

driver.quit();