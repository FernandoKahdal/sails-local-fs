/**
 * Module dependencies
 */

var fs		= require('fs'),
	Glob	= require('glob').Glob,
	_		= require('lodash');


module.exports = {


	/**
	 * Read from provided uploadStream and write to blob store
	 */

	write: function  ( uploadStream, options, cb ) {

		// Grab a logger (use sails.log if available)
		var log = typeof sails !== 'undefined' ? sails.log : {
			verbose: console.log,
			warn: console.warn,
			error: console.error
		};

		// When the uploadStream ends or errors, trigger the callback
		uploadStream.once('end', function (err) {

			if (err) {

				// TODO:
				// If the uploadStream is rejected, use this.files to lookup 
				// and undo the writes, deleting the destination file(s) [configurable]
				log.error('Error ::',err,':: occurred in upload stream...');
				cb(err, uploadStream.files);
				return;
			}

			if ( ! (uploadStream.files && _.keys(uploadStream.files).length ) ) {
				log.verbose('No files specified! Closing stream...');
			}
			else log.verbose('Upload successful! Closing stream...');

			cb(null, uploadStream.files);
		});


		// Listen to upload stream for new files
		// Receive each upload as a paused field stream
		uploadStream.on('data', function (pausedBinaryStream) {

			// Build full path and open writestream for this file
			var filename = pausedBinaryStream.filename;
			var path = options.container + filename;
			var destinationStream = fs.createWriteStream( path );

			// Update uploadStream's reference to this file
			// with adapter-specific information
			// (namely the path)
			var fileRecord = uploadStream.files[pausedBinaryStream._id];
			fileRecord.path = path;

			log.verbose('* ' + filename + ' :: Adapter received new file...');
			
			// Hook up the data events from the field streams 
			// to the destination stream
			pausedBinaryStream.pipe(destinationStream);
			
			// Resume field streams detected so far 
			// and replay their buffers
			log.verbose('* ' + filename + ' :: resuming stream...');
			pausedBinaryStream._resume();
		});
	},



	/**
	 * Read from blob store and write to specified download stream
	 */

	read: function (downloadStream, options, cb) {

		// Grab a logger (use sails.log if available)
		var log = typeof sails !== 'undefined' ? sails.log : {
			verbose: console.log,
			warn: console.warn,
			error: console.error
		};

		// Makes callback optional, 
		// and limits it to only fire once just in case
		cb = cb ? _.once(cb) : function noopCb () {};
		
		var splat = options.container + '/' + options.filename;
		log.verbose('LocalDiskAdapter.read files from ' + splat);

		// apply splat expression e.g. `.tmp/uploads/*` and return a set
		var globtions = {};

		// Start glob stream
		var glob = new Glob (splat, globtions);

		// Handle end of the stream and errors
		glob.once('abort', function globAborted () {
			downloadStream.end();
			cb();
		});
		glob.once('end', function globDone (matches) {
			downloadStream.end(null, matches);
			cb(null, matches);
		});
		glob.once('error', function globError (err) {
			downloadStream.error(err || new Error());
			cb(err || new Error());
		});
		
		// Acquire source stream(s) one by one
		// as files come in from glob
		glob.on('match', function globMatch (path) {
			log.verbose('Found file @', path);

			// Pass byte stream to download stream
			downloadStream.emit('file', fs.createReadStream(path, {
				encoding: options.encoding
			}));

		});

		// return destination stream
		return downloadStream;
	}

};


