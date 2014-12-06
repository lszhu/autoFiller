var Nightmare = require('nightmare');
new Nightmare({weak: false})
    .goto('http://cn.bing.com/')
    .type('#sb_form_q', 'github nightmare')
    .click('#sb_form_go')
    .wait()
    .screenshot('./jpgfile.jpg')
    .run(function (err, nightmare) {
        if (err) return console.log(err);
        console.log('ok');
    });