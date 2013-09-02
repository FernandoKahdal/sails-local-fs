/*---------------------------------------------------------------
	:: FileSystemAdapter
	-> adapter

	Primarily, this adapter is useful for uploading user files 
	to the local hard disk on the server.  Note that you'll be
	limited to the space available on your filesystem!  However,
	you can use any accessible directory, including mounted
	network drives, etc.

---------------------------------------------------------------*/

module.exports = (function () {

	var _ = require('lodash');
	var GenericBlobAdapter = require('./GenericBlobAdapter');
	var LocalDiskAdapter = require('./LocalDiskAdapter');
	var LocalDisk = new GenericBlobAdapter (LocalDiskAdapter);

	return {

		registerCollection: function (collection, cb) {
			cb();
		},




		/**
		 * `Adapter.write()`
		 *
		 * Pipe initial FieldStreams (files) into a destination stream,
		 * then set up events to automatically pipe the FieldStream of any newly detected file
		 * from the UploadStream to the destination stream
		 *
		 * @param {Stream} `uploadStream`	::	contains pausd field streams 
		 *										and fires when new ones are added
		 * @param {Object} `options`
		 *			container		: {String} directory path where file(s) sould be stored
		 *			maxBytes		: {Integer} Maximum combined size of all files together (default 1GB)
		 *			maxBytesPerFile	: {Integer} Maximum file size for each individual file (default 25MB)
		 */

		write: function (collectionName) {
			// Slice off first argument (collectionName)
			var args = Array.prototype.slice.call(arguments, 0);
			args.shift();

			// Call underlying method
			LocalDisk.write.apply(this, args);
		},


		/**
		 * Adapter.read()
		 * Adapter.read(destinationStream)
		 * Adapter.read(cb)
		 * Adapter.read({})
		 * Adapter.read({}, cb)
		 * Adapter.read({}, destinationStream)
		 */

		read: function (collectionName) {

			// Slice off first argument (collectionName)
			var args = Array.prototype.slice.call(arguments, 0);
			args.shift();

			// Call underlying method
			LocalDisk.read.apply(this, args);	
		}
	};

})();

