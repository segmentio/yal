
var assert = require('assert');
var Logger = require('..');
var axon = require('axon');
var os = require('os');

describe('Logger#send(level, type, msg)', function(){
  it('should send a message', function(done){
    var sock = axon.socket('pull');
    sock.format('json');
    sock.bind('tcp://localhost:5555');

    sock.on('message', function(_){
      assert(_.timestamp);
      assert(_.hostname == os.hostname());
      assert('info' == _.level);
      assert('something' == _.type);
      assert('bar' == _.message.foo);
      done();
    });

    var log = new Logger('tcp://localhost:5555');
    log.send('info', 'something', { foo: 'bar' });
  })

  it('should expose error properties', function(done){
    var sock = axon.socket('pull');
    sock.format('json');
    sock.bind('tcp://localhost:5556');

    sock.on('message', function(_){
      assert('something' == _.type);
      assert('message' == _.message.message);
      assert('bar' == _.message.foo);
      assert(_.message.stack);
      done();
    });

    var log = new Logger('tcp://localhost:5556');

    var error = new Error('message');
    error.foo = 'bar';
    log.send('error', 'something', error);
  })

  it('should respect hwm setting', function(){
    var log = new Logger('tcp://leak:4000', { hwm: 100 });
    assert(log.sock.get('hwm') == 100);
  })
})

;['debug', 'info', 'warn', 'error', 'critical', 'alert', 'emergency'].forEach(function(level){
  describe('Logger#' + level + '(msg)', function(){
    it('should send a message', function(done){
      var sock = axon.socket('pull');
      sock.format('json');

      sock.bind(0, function(){
        var addr = sock.address().string;

        sock.on('message', function(_){
          assert(_.timestamp);
          assert(level == _.level);
          assert('something' == _.type);
          assert('bar' == _.message.foo);
          done();
        });

        var log = new Logger([addr]);
        log[level]('something', { foo: 'bar' });
      });
    })
  })
})
