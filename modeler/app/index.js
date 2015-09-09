'use strict';

var fs = require('fs');

var $ = require('jquery'),
    DmnModeler = require('dmn-js/lib/Modeler'),
    camundaExtension = require('../resources/camunda.json');


var container = $('#js-drop-zone');

var canvas = $('#js-table');

var renderer = new DmnModeler({
  container: canvas,
  keyboard: { bindTo: document },
  tableName: 'DMN Table',
  moddleExtensions: {
    camunda: camundaExtension
  }
});

var newTableXML = fs.readFileSync(__dirname + '/../resources/newTable.dmn', 'utf-8');
var exampleXML = fs.readFileSync(__dirname + '/../resources/example.dmn', 'utf-8');

function createNewTable() {
  openTable(newTableXML);
}
function createDemoTable() {
  openTable(exampleXML);
}

function openTable(xml) {

  renderer.importXML(xml, function(err) {

    if (err) {
      container
        .removeClass('with-table')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-table');
    }


  });
}

function saveTable(done) {

  renderer.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openTable);
}

// bootstrap table functions

$(document).on('ready', function() {

  $('#js-create-table').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewTable();
  });

  $('.use-demo').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createDemoTable();
  });

  var downloadLink = $('#js-download-table');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  var dirty = false;
  function checkDirty() {
    if (dirty) {
      return 'The changes you performed on the table will be lost upon navigation.';
    }
  }

  window.onbeforeunload = checkDirty;

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/xml;charset=UTF-8,' + encodedData,
        'download': name
      });
      dirty = true;
    } else {
      link.removeClass('active');
      dirty = false;
    }
  }

  var exportArtifacts = function() {
    saveTable(function(err, xml) {
      setEncoded(downloadLink, 'table.dmn', err ? null : xml);
    });
  };

  renderer.on('commandStack.changed', exportArtifacts);
});
