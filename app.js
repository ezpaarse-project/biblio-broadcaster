// log.io protocol example
// +log biblioinserm bibliomap info 16.2.255.24 - 13BBIU1158 [01/Aug/2013:16:56:36 +0100] "GET http://onlinelibrary.wiley.com:80/doi/10.1111/dme.12357/pdf HTTP/1.1" 200 13639

// Increase max concurrent connections (defaults to 5)
require('http').globalAgent.maxSockets = 20;

const config            = require('config');
const LogIoServerParser = require('log.io-server-parser');
const request           = require('request').defaults({ proxy: null });
const es                = require('event-stream');
const JSONStream        = require('JSONStream');
const net               = require('net');
const debug             = require('debug')('biblio-broadcaster');

const io = require('socket.io')();
io.listen(config.broadcast.port);

io.on('connection', client => {
  debug('Client connected');
});

const ezpaarseJobs = new Map();

/**
 * Listen events coming from bibliomap-harvester
 * then forward it to ezpaarse jobs
 */
server = new LogIoServerParser(config.harvester);
server.listen(() => {
  console.error(`${new Date()} - Waiting for log.io-harvester at ${JSON.stringify(config.harvester)}`);
});

server.on('+node', (node, streams) => {
  // Create one ezPAARSE job for each stream
  streams.forEach(streamName => {
    debug(`Initialization of ${streamName}`);
    
    if (ezpaarseJobs.has(streamName)) {
      return debug(`${streamName} already exists`);
    }

    // This empty slot will bet set with an ezPAARSE job
    ezpaarseJobs.set(streamName, null);
  });
});

server.on('+log', (streamName, node, type, log) => {
  const stream = ezpaarseJobs.get(streamName);
  
  if (stream) {
    stream.writeStream.write(`${log}\n`);
  }
});

/**
 * Create the ezpaarse jobs and respawn
 * crashed or terminated jobs each N seconds
 */
setInterval(() => {
  ezpaarseJobs.forEach(handleStream);
}, config.autoConnectDelay);

function handleStream(stream, streamName) {
  // skip running jobs
  if (stream !== null) { return; }

  console.error(`${new Date()} - Create an ezPAARSE job for ${streamName} at ${config.ezpaarse.url}`);

  const job = {
    request: request.post({
      url: config.ezpaarse.url,
      headers: config.ezpaarse.headers
    }),
    writeStream: es.through()
  };

  ezpaarseJobs.set(streamName, job);

  job.writeStream.pipe(job.request);
  job.request
    .pipe(JSONStream.parse())
    .pipe(es.mapSync(data => {
      const msg = [
        `[${data.datetime}]`,
        data.login,
        data.platform,
        data.platform_name,
        data.rtype,
        data.mime,
        data.print_identifier || '-',
        data.online_identifier || '-',
        data.doi || '-',
        data.url,
      ].join(' ');

      data.ezproxyName = streamName;
      io.emit('ec', data);

      debug(`+log|${streamName}-ezpaarse|bibliolog|info|${msg}`);
    }));

  // check that the ezpaarse connection is not closed
  job.request.on('error', err => {
    console.error(`${new Date()} - "error" event on the ezPAARSE job ${streamName} [${err}]`);
    ezpaarseJobs.set(streamName, null);
  });
  job.request.on('close', () => {
    console.error(`${new Date()} - "close" event on the ezPAARSE job ${streamName}`);
    ezpaarseJobs.set(streamName, null);
  });
  job.request.on('end', () => {
    console.error(`${new Date()} - "end" event on the ezPAARSE job ${streamName}`);
    ezpaarseJobs.set(streamName, null);
  });

  job.request.on('response', response => {
    console.error(`${new Date()} - Job ${response.headers['job-id']} ok for ${streamName}`);
  });
}