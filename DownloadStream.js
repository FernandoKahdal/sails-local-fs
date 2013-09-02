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

	// Keep track of # of files downloaded
	var fileCount = 0;

	// Optional limit for # of files
	// Set automatically to 1 if determination of this 
	// being a single file download is made.
	var limitFileCount = false;



	/**
	 * Emit data
	 */
	this.write = function (data) {
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift('data');
		this.emit.apply(this, args);
	};

	/**
	 * If an error occurred, end the stream
	 * If no files were found, end the stream
	 */
	this.end = function (err, matches) {
		if (err) {
			this.error(err);
			return;
		}

		// Trigger 'notFound' behavior if no matches were found
		if (!matches || !matches.length) {
			this.emit('end');
		}
	};


	/**
	 * Server error occurred
	 */
	this.error = function (err) {
		this.emit('end', err);
	};


	

	/**
	 * Receive a file on the download stream
	 */

	this.on('file', function (bytesIn) {

		var downloadStream = this;

		// Manage file count and limits
		if (limitFileCount && fileCount >= limitFileCount ) {
			return unexpectedFile();
		}
		fileCount++;


		// TODO:	Continue buffering the first file until:
		//				+ we find more files
		//				+ multiple download timeout expires (50ms)
		//					(in other words, we don't think any more files are coming)
		onlyOneFile(bytesIn);


		// TODO:	If multiple files are detected, create an archive
		//			and start zipping them up
		
		// var zip = zipstream.createZip({ level: 1 });
		// zip.addFile(fs.createReadStream('README.md'), { name: 'README.md' }, function() {
		//   zip.addFile(fs.createReadStream('example.js'), { name: 'example.js'  }, function() {
		//     zip.finalize(function(written) { console.log(written + ' total bytes written'); });
		//   });
		// });
		// zip.pipe(outputStream);

		// If no more files arive, start streaming the bytes 
		// of the first file immediately
		function onlyOneFile () {
			limitFileCount = 1;
			bytesIn.pipe(downloadStream);
		}

		// File exceeds download count limit, 
		// or violates a consistentcy expectation
		function unexpectedFile () {
			downloadStream.emit('error', errors.unexpectedFile);
		}

	});

}