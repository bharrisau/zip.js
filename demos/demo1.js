(function(obj) {

	var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

	function onerror(message) {
		alert(message);
	}
  var rNPTHDrll = /npth\.(drl|dri|txt)/i;
  var rPTHDrll = /\.(drl|dri|txt)/i;
  var rFCu = /\.gtl/i;
  var rFMsk = /\.gts/i;
  var rFSlk = /\.gto/i;
  var rBCu = /\.gbl/i;
  var rBMsk = /\.gbs/i;
  var rBSlk = /\.gbo/i;
  var rEdge = /\.(gbr|gml)/i;
  var rInner1 = /\.g2l|1_Cu\.gbr/i;
  var rInner2 = /\.g3l|2_Cu\.gbr/i;

	function getType(name) {
		if (rNPTHDrll.test(name)) {
			return "ndrl";
		} else if (rPTHDrll.test(name)) {
			return "pdrl";
		} else if (rInner1.test(name)) {
			return "2cu";
		} else if (rInner2.test(name)) {
			return "3cu";
		} else if (rFCu.test(name)) {
			return "fcu";
		} else if (rFMsk.test(name)) {
			return "fmsk";
		} else if (rFSlk.test(name)) {
			return "fslk";
		} else if (rBCu.test(name)) {
			return "bcu";
		} else if (rBMsk.test(name)) {
			return "bmsk";
		} else if (rBSlk.test(name)) {
			return "bslk";
		} else if (rEdge.test(name)) {
			return "edge";
		} else {
			return null;
		}
	}

	function createTempFile(callback) {
		var tmpFilename = "tmp.zip";
		requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
			function create() {
				filesystem.root.getFile(tmpFilename, {
					create : true
				}, function(zipFile) {
					callback(zipFile);
				});
			}

			filesystem.root.getFile(tmpFilename, null, function(entry) {
				entry.remove(create, create);
			}, create);
		});
	}

	var model = (function() {
		var zipFileEntry, zipWriter, writer, creationMethod, URL = obj.webkitURL || obj.mozURL || obj.URL;

		return {
			setCreationMethod : function(method) {
				creationMethod = method;
			},
			addFiles : function addFiles(files, oninit, onadd, onprogress, onend) {
				var addIndex = 0;

				function nextFile() {
					var file = files[addIndex];
					onadd(file);
					zipWriter.add(file.name, new zip.BlobReader(file), function() {
						addIndex++;
						if (addIndex < files.length)
							nextFile();
						else
							onend();
					}, onprogress);
				}

				function createZipWriter() {
					zip.createWriter(writer, function(writer) {
						zipWriter = writer;
						oninit();
						nextFile();
					}, onerror);
				}

				if (zipWriter)
					nextFile();
				else {
					writer = new zip.BlobWriter();
					createZipWriter();
				}
			},
			getBlobURL : function(callback) {
				zipWriter.close(function(blob) {
					var blobURL = URL.createObjectURL(blob);
					callback(blobURL);
					zipWriter = null;
				});
			},
			getBlob : function(callback) {
				zipWriter.close(callback);
			}
		};
	})();

	(function() {
		var fileInput = document.getElementById("file-input");
		var zipProgress = document.createElement("progress");
		var downloadButton = document.getElementById("download-button");
		var fileList = document.getElementById("file-list");
		var filenameInput = document.getElementById("filename-input");
		var layerInput = document.getElementById("pcb-layers");
		model.setCreationMethod("Blob");
		fileInput.addEventListener('change', function() {
			fileInput.disabled = true;
			model.addFiles(fileInput.files, function() {
			}, function(file) {
				var layer = getType(file.name);
				console.log(layer);
				var li = layer ? document.getElementById("entry-" + layer) : document.createElement("li");
				zipProgress.value = 0;
				zipProgress.max = 0;
				li.textContent = file.name;
				li.appendChild(zipProgress);
				if(!layer) fileList.appendChild(li);
			}, function(current, total) {
				zipProgress.value = current;
				zipProgress.max = total;
			}, function() {
				if (zipProgress.parentNode)
					zipProgress.parentNode.removeChild(zipProgress);
				fileInput.value = "";
				fileInput.disabled = false;
			});
		}, false);
		layerInput.addEventListener('change', function() {
			if(layerInput.value == "2") {
				document.getElementById("li-2cu").hidden = true;
				document.getElementById("li-3cu").hidden = true;
			} else {
				document.getElementById("li-2cu").hidden = false;
				document.getElementById("li-3cu").hidden = false;
			}
		}, false);
		downloadButton.addEventListener("click", function(event) {
			var target = event.target, entry;
			if (!downloadButton.download) {
				if (typeof navigator.msSaveBlob == "function") {
					model.getBlob(function(blob) {
						navigator.msSaveBlob(blob, filenameInput.value + '.zip');
					});
				} else {
					model.getBlobURL(function(blobURL) {
						var clickEvent;
						clickEvent = document.createEvent("MouseEvent");
						clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						downloadButton.href = blobURL;
						downloadButton.download = filenameInput.value + '.zip';
						downloadButton.dispatchEvent(clickEvent);
						fileList.innerHTML = "";
					});
					event.preventDefault();
					return false;
				}
			}
		}, false);

		var quantityInput = document.getElementById("pcb-qty");
		quantityInput.addEventListener('change', function() {
			document.getElementById("entry-qty").textContent = quantityInput.value;
		}, false);
		layerInput.addEventListener('change', function() {
			document.getElementById("entry-layer").textContent = layerInput.value;
		}, false);
		var maskInput = document.getElementById("pcb-mask");
		maskInput.addEventListener('change', function() {
			document.getElementById("entry-mask").textContent = maskInput.value;
		}, false);
		var thicknessInput = document.getElementById("pcb-thick");
		thicknessInput.addEventListener('change', function() {
			document.getElementById("entry-thick").textContent = thicknessInput.value;
		}, false);
		var finishInput = document.getElementById("pcb-finish");
		finishInput.addEventListener('change', function() {
			document.getElementById("entry-finish").textContent = finishInput.value;
		}, false);
		var copperInput = document.getElementById("pcb-cu");
		copperInput.addEventListener('change', function() {
			document.getElementById("entry-cu").textContent = copperInput.value;
		}, false);


	})();

})(this);
