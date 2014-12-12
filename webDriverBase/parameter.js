var program = require('commander');

program
    .version('0.6.0')
    .option('-i, --input <file>', '用于获取数据的文件')
    .option('-t, --type <type>', '指定数据的文件的格式（xlsx或csv）')
    .option('-o, --output <file>', '数据操作成功的记录文件')
    .option('-e, --error <file>', '数据操作失败的记录文件')
    .option('-c, --config <schema>', '指定采用的配置项')
    .option('-p, --parallel <n>', '指定同时操作的并行数量', parseInt)
    .option('-b, --browser <browser>', '指定操作采用的浏览器');

program.on('--help', function(){
    console.log('  使用举例：');
    console.log('');
    console.log('    $ run --help');
    console.log('    $ run -i inputFile.txt -t csv -c testSchema -p 5');
    console.log('');
});

program.parse(process.argv);

// 用于测试的输出
console.log('you program parameters are:');
if (program.input) console.log('input: ' + program.input);
if (program.type) console.log('type: ' + program.type);
if (program.output) console.log('output: ' + program.output);
if (program.error) console.log('error: ' + program.error);
if (program.config) console.log('config: ' + program.config);
if (program.parallel) console.log('parallel: ' + program.parallel);
if (program.browser) console.log('browser:' + program.browser);

// 程序运行必须指定操作模式，测试时可以跳过
//if (!program.config) {
//    console.log('没有指定自动操作的模式， 程序已经退出');
//    setTimeout(function() {
//        process.exit(1);
//    });
//}

// 临时用于测试
if (!program.config) {
    program.config = 'actionTest'
}
if (!program.parallel) {
    program.parallel = 6;
}

module.exports = program;