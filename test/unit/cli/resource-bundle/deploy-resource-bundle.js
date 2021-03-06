'use strict';

var os              = require('os');
var assert          = require('assert');
var sinon           = require('sinon');
var sinonAsPromised = require('sinon-as-promised');
var util            = require('../../../../lib/mavensmate/util').instance;
var mavensmate      = require('../../../../lib/mavensmate');

sinonAsPromised(require('bluebird'));

describe('mavensmate deploy-resource-bundle-cli', function(){

  var program;
  var cliClient;
  var executeCommandStub;
  var getPayloadStub;

  before(function(done) {
    delete require.cache[require.resolve('commander')];
    program = require('commander');

    program
      .option('-v --verbose', 'Output logging statements')
      .option('-h --headless', 'Runs in headless (non-interactive terminal) mode. You may wish to use this flag when calling this executable from a text editor or IDE client.')
      .option('-e --editor [name]', 'Specifies the plugin client (sublime, atom)') // no default set
      .option('-p --port [number]', 'UI server port number') // (for sublime text)
      .parse(process.argv, true); // parse top-level args, defer subcommand

    cliClient = mavensmate.createClient({
      editor: program.editor || 'atom',
      headless: true,
      verbose: false,
      program: program
    });

    require('../../../../lib/mavensmate/loader')(cliClient);
    done();
  });

  beforeEach(function() {
    executeCommandStub = sinon.stub(cliClient, 'executeCommand');
    getPayloadStub = sinon.stub(util, 'getPayload').resolves({ foo : 'bar' });
  });

  afterEach(function() {
    executeCommandStub.restore();
    getPayloadStub.restore();
  });

  it('should accept a resource bundle path', function(done) {
    if (os.platform() === 'win32') {
      cliClient.program._events['deploy-resource-bundle'](['C:\\path\\to\\something']);

      executeCommandStub.calledOnce.should.equal(true);
      assert(executeCommandStub.calledWithMatch({
         name: 'deploy-resource-bundle',
         body: { paths : [ 'C:\\path\\to\\something' ] }
       }));

      done();
    } else {
      cliClient.program._events['deploy-resource-bundle'](['/path/to/something']);

      executeCommandStub.calledOnce.should.equal(true);
      assert(executeCommandStub.calledWithMatch({
         name: 'deploy-resource-bundle',
         body: { paths : [ '/path/to/something' ] }
       }));

      done();
    }
  });
});