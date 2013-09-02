/**
 * Module dependencies
 */

var inherits	= require('util').inherits,
	Stream		= require('stream'),
	_			= require('lodash'),
	zipstream	= require('zipstream');


/**
 * Errors
 */

var errors = {
	unexpectedFile: new Error('Unexpected file detected after download timeout')
};



/**
 * Expose stream constructor
 *
 * NOTE: DownloadStreams are paused upon initialization
 */

module.exports = DownloadStream;




/**
* DownloadStream
*
* A paused binary file stream from a storage adapter. 
*
* Paused on initiatialization (resume with `streamInstance.resume()`)
* Resumed automatically by `res.download`, `res.sendfile`, and `res.save`
*
* @implements Readable
* @implements Resumable
* @extends {Stream}
*/

inherits(DownloadStream, Stream);
function DownloadStream () {

	this.writable = true;
	_.bindAll(this);

	// Grab a logger (use sails.log if available)
	var log = typeof sails !== 'undefined' ? sails.log : {
		verbose: console.log,
		warn: console.warn,
		error: console.error
	};


	var self = this;

	// Keep track of # of files downloaded
	var fileCount = 0;

	// Optional limit for # of files
	// Set automatically to 1 if determination of this 
	// being a single file download is made.
	var limitFileCount = false;

	// Keep track of first file in case this is a single-file download
	var firstFile;

	// If the download timer expires, we must assume no other files are coming
	// so send back the single file
	var downloadTimer = setTimeout(function expire () {
		log.verbose('Download timer expired-- only one file will be downloaded.');
		self.onlyOneFile();
	}, 50);


	/**
	 * Emit data
	 */
	this.write = function (data) {
		log.verbose('Writing ' + (data && data.length) + 'bytes to download stream...');
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift('data');
		this.emit.apply(this, args);
	};


	/**
	 * End the stream
	 */
	this.end = function () {
		log.verbose('Ending download stream...');
		this.emit('end');
	};

	// File exceeds download count limit, 
	// or violates a consistentcy expectation
	this.unexpectedFile = function () {
		this.emit('error', errors.unexpectedFile);
	};


	// If no more files arive, start streaming the bytes 
	// of the first file immediately
	var fileDownloading = false;
	this.onlyOneFile = function () {

		// Mutex :: a file is being downloaded directly
		if (fileDownloading) return;
		fileDownloading = true;

		// Clear download timer
		clearTimeout(downloadTimer);

		// Prevent any unexpected additional downloads from surprising us
		limitFileCount = 1;

		// If no files were uploaded, do nothing
		if (!firstFile) {
			return;
		}

		// Replay the buffered bytes onto the downloadStream
		else {
			log.verbose('Replaying buffered bytes of file...');
			firstFile.pipe(self);
			firstFile.resume();
		}

	};



	/**
	 * Signal that all files have been found
	 */

	// this.once('glob_done', function noMoreFiles () {

	// 	log('glob stream ended!');
	// 	if (fileCount === 1) {
	// 		this.onlyOneFile();
	// 		return;
	// 	}

	// 	// if > 1 file is being downloaded,
	// 	// when they are all finished, the zip can be finalized at this point
	// 	throw new Error('Zip doesn\'t work yet!!!');
	// 	// zip.finalize();
	// });



	/**
	 * Receive a file on the download stream
	 */

	this.on('file', function (incomingFileStream) {

		// Manage file count and limits
		if (limitFileCount && fileCount >= limitFileCount ) {
			return this.unexpectedFile();
		}
		fileCount++;


		// If this is the first file
		if (fileCount === 1) {

			// Track the stream
			firstFile = incomingFileStream;

			log.verbose('Started buffering file stream...', incomingFileStream);
			
			// Continue buffering the first file until:
			//
			//	+ we find more files, then create a zip
			//	-or-
			//	+ the stream ends, so we download the first file
			//	-or-
			//	+ multiple download timeout expires (50ms) 
			//	  so we download the first file
		}

		// If this is the second file, this is the moment where, for the first time,
		// we can be certain that more than one file is being downloaded.
		// Immediately stop buffering the first file and set up the .zip
		else if (fileCount === 2) {
			
			// Clear download timer
			// (since we are now sure that > 1 file is being downloaded)
			clearTimeout(downloadTimer);

			// Since multiple files are detected, create an archive
			// and start zipping them up
			throw new Error('Zip doesn\'t work yet!!!');

			// Replay buffered bytes of first file into zip

			// Zip and stream each subsequent file
			// var zip = zipstream.createZip({ level: 1 });
			// zip.addFile(fs.createReadStream('README.md'), { name: 'README.md' }, function() {
			//   zip.addFile(fs.createReadStream('example.js'), { name: 'example.js'  }, function() {
			//     zip.finalize(function(written) { console.log(written + ' total bytes written'); });
			//   });
			// });
			// zip.pipe(outputStream);
		}

		// For each subsequent file, zip and stream
		else {
			throw new Error('Zip doesn\'t work yet!!!');
		}

	});

	
}