var DEFAULT_WINDOW_WIDTH = 1050;
var DEFAULT_WINDOW_HEIGHT = 850;

var childMetadata = [ 
  {"xmlName" : "CustomField", "tagName" : "fields", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "BusinessProcess", "tagName" : "businessProcesses", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "RecordType", "tagName" : "recordTypes", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "WebLink", "tagName" : "webLinks", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "ValidationRule", "tagName" : "validationRules", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "NamedFilter", "tagName" : "namedFilters", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "SharingReason", "tagName" : "sharingReasons", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "ListView", "tagName" : "listViews", "parentXmlName" : "CustomObject" }, 
  {"xmlName" : "FieldSet", "tagName" : "fieldSets", "parentXmlName" : "CustomObject" },
  {'xmlName' : 'ActionOverride', 'tagName' : 'actionOverrides', 'parentXmlName' : 'CustomObject' },
  {'xmlName' : 'CompactLayout', 'tagName' : 'compactLayouts', 'parentXmlName' : 'CustomObject' },
  {'xmlName' : 'SharingRecalculation', 'tagName' : 'sharingRecalculations', 'parentXmlName' : 'CustomObject' },
  {"xmlName" : "CustomLabel", "tagName" : "customLabels", "parentXmlName" : "CustomLabels" },
  {'xmlName' : 'SharingCriteriaRule', 'tagName' : 'sharingCriteriaRules', 'parentXmlName' : 'SharingRules' },
  {'xmlName' : 'SharingOwnerRule', 'tagName' : 'sharingOwnerRules', 'parentXmlName' : 'SharingRules' },
  {'xmlName' : 'SharingTerritoryRule', 'tagName' : 'sharingTerritoryRules', 'parentXmlName' : 'SharingRules' },
  {"xmlName" : "WorkflowAlert", "tagName" : "alerts", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowTask", "tagName" : "tasks", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowOutboundMessage", "tagName" : "outboundMessages", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowFieldUpdate", "tagName" : "fieldUpdates", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowRule", "tagName" : "rules", "parentXmlName" : "Workflow" }, 
  {"xmlName" : "WorkflowEmailRecipient", "tagName" : "emailRecipients", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowTimeTrigger", "tagName" : "timeTriggers", "parentXmlName" : "Workflow" },
  {"xmlName" : "WorkflowActionReference", "tagName" : "actionReferences", "parentXmlName" : "Workflow" }
];

function renderTree(treeOffset, packageLocation, pid) {
	try {
		$("#tree").dynatree("destroy");
	} catch(e) {}
	if (packageLocation === undefined) {
		packageLocation = "package.xml";
	}
	tree = $('#tree').dynatree({
    initAjax: {
    	type: 'POST',
    	dataType: 'json',
    	contentType: 'application/json; charset=utf-8',
    	url: baseLocalServerURL+"/app/project/get-index?pid="+pid,
	    data: JSON.stringify({
				packageLocation: packageLocation
			})
		},
		checkbox: true,
		selectMode: 3,
		debugLevel: 0,
		persist: false,
		selectedIds: '',
		onSelect: function(check, node) {
      var selectedNodes = tree.getSelectedNodes();
      var ids = $.map(selectedNodes, function(node) {
        return node.data.id;
      });
      this.selectedIds = ids;
		},
		onPostInit: function(isReloading, isError) {
			if (this.selectedIds === undefined || this.selectedIds === '' || this.selectedIds == []) {
		    this.selectedIds = [];
		    var selected = this.getSelectedNodes();
		    var ids = $.map(selected, function(node){
                  return node.data.id;
              });
		    this.selectedIds = ids;
			}

			var filter = $("#txtFilter").val();
			if (filter && filter.length > 2) {
				$("#tree").dynatree("getRoot").visit(function(node){
				    node.expand(true);
				});
			}
			if (treeOffset !== undefined) {
				resizeProjectWrapper(treeOffset);
			} else {
				resizeProjectWrapper();
			}
			hideLoading();
		},
		onCreate: function(node, span) {
			if (node.data.level === 1)
				bindContextMenu(span);
		}
	});
	tree = $("#tree").dynatree("getTree");
}

function renderBufferedTree(metadata) {
	console.log('rendering tree!');
	console.log(metadata);

	try {
		$('#tree').dynatree('destroy');
	} catch(e) {}
	
  $.each( metadata, function( key, value ) {
    value.text = value.xmlName;
    value.title = value.xmlName;
    value.key = value.xmlName;
    value.folder = true;
    value.checked = false;
    value.select = false;
    value.children = [];
    value.cls = 'folder';
    value.isLazy = true;
    value.isFolder = true;
    value.level = 1;
    value.id = value.xmlName;
  });

	tree = $('#tree').dynatree({
		ajaxDefaults: { // Used by initAjax option
      timeout: 600000, // >0: Make sure we get an ajax error for invalid URLs
    },
		children: metadata,
		checkbox: true,
		selectMode: 3,
		debugLevel: 0,
		persist: false,
		onLazyRead: function(node) {
      $.ajax({
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        url: baseLocalServerURL+'/execute?async=1',
        data: JSON.stringify({
					metadataTypes: [ node.data.title ],
					accessToken: $('#sid').val(),
					instanceUrl: $('#instanceUrl').val(),
					command: 'list-metadata'
				}),
        complete: function(data) {
          listMetadataResponseHandler(data, node);
        }
      });
	 	}
	});
	tree = $('#tree').dynatree('getTree');
}

function listMetadataResponseHandler(data, node) {
  console.log(data)
  console.log('node: ')
  console.log(node)
  try {
    var response = JSON.parse(data.responseText)
    checkListStatus(response.id, node)
  } catch(e) {
    showGlobalError('The local MavensMate server did not respond properly. This likely means it is not running or it is malfunctioning. Try restarting your text editor and MavensMate.app.');
    hideLoading();
  }
}

function checkListStatus(requestId, node) {
  $.ajax({
    type: 'GET',
    url: baseLocalServerURL+'/status', 
    data: {
      id: requestId
    },
    complete: function(data, status, xhr) {
      try {
        console.log('checking status of async request');
        console.log(data.responseText)
        var response = JSON.parse(data.responseText);
        if (response.status === 'pending') {
            setTimeout(function() { checkListStatus(requestId, node); }, CHECK_STATUS_INTERVAL); //poll for completed async request
        } else {
            handleListResponse(response, node);
        }
      } catch(e) {
        console.log(e);
        console.log('caught an error, polling again...');
        setTimeout(function() { checkListStatus(requestId, node); }, 2000);
      }             
    } 
  });
}

function handleListResponse(data, node) {
  console.log('processing list-metadata response');
  console.log(data);
  try {
    node.setLazyNodeStatus(DTNodeStatus_Ok);
    node.addChild(data.result[0].children);
  } catch(e) {
    console.log(e);
    return [];
  }
}

function getPackage() {
    var json = { };
    var child_def = {};
    for (var item in childMetadata) {
        child_def[childMetadata[item]['tagName']] = childMetadata[item]['xmlName'];
    }
    try {
        var records = tree.getSelectedNodes();
        $.each(records, function(index, rec) {
            if (rec.data.level == 1) {
                var drillToType = false;
                if ('type' in rec.data)
                	drillToType = true; //this is the edit form
                if (json[rec.parent.data.text] === undefined) {
                    try {
                        var childXmlNames = drillToType ? rec.data.type.childXmlNames : rec.data.childXmlNames;  
                        var inFolder = drillToType ? rec.data.type.inFolder : rec.data.inFolder;            
                        if (Object.prototype.toString.call(childXmlNames) === '[object Array]') {
                            if (childXmlNames.length === 0 && !inFolder) {
                                json[rec.data.text] = '*';
                            } else {
                                json[rec.data.text] = [];
                            }
                        } else {
                            if (inFolder) {
                            	json[rec.data.text] = [];
                            } else {
                            	json[rec.data.text] = '*';
                            }
                        }
                    } catch(e) {
                        json[rec.data.text] = '*';
                    }
                }
            } else if (rec.data.level == 2) {
                if (json[rec.parent.data.text] === undefined) {
                    json[rec.parent.data.text] = [];
                    json[rec.parent.data.text].push(rec.data.text);
                } else if (json[rec.parent.data.text] !== '*') {
                    json[rec.parent.data.text].push(rec.data.text);
                } 
            } else if (rec.data.level == 3) {
                try {
                	var drillToType = false;
                	if ('type' in rec.parent.parent.data)
                		drillToType = true;
                	var inFolder = drillToType ? rec.parent.parent.data.type.inFolder : rec.parent.parent.data.inFolder;              
                	if (inFolder) {
                	    if (json[rec.parent.parent.data.text] === undefined) {
                	        json[rec.parent.parent.data.text] = [];
                	    }
                	    json[rec.parent.parent.data.text].push(rec.parent.data.text + "/" + rec.data.text);
                	} else {
                	    //this is a sub type like a custom field, list view, etc.
                	    //console.log(rec.parent);
                	    if (!rec.parent.bSelected) {
                	    	if (rec.children !== undefined && rec.children !== null) {
                	    		metadata_type = child_def[rec.data.text];
                	    		if (!json[metadata_type]) {
                	    		    json[metadata_type] = [];
                	    		} 
                	    		// console.log('---->>>>>');
                	    		// console.log(rec.children);
                	    		$.each(rec.children, function(index, childNode) {
                	    		    if (childNode.data.checked) {
                	    		        json[metadata_type].push(childNode.parent.parent.data.text+"."+childNode.data.text);
                	    		    }
                	    		});
                	    	}
                	    }
                	} 
                } catch(e) { 
                	//todo
                }
            } else if (rec.data.level == 4) {
                try {
                	 //this is a child metadata object, like a custom field
	                metadata_type = child_def[rec.parent.data.text];
	                if (json.hasOwnProperty(rec.parent.parent.parent.data.text)) { //json['CustomObject'] exists already
	                	if ($.inArray(rec.parent.parent.data.text, json[rec.parent.parent.parent.data.text]) === -1) {
			            		if (!json[metadata_type]) {
			            	  	json[metadata_type] = [];
			            		} 
			            		json[metadata_type].push(rec.parent.parent.data.text+"."+rec.data.text); 	
			        			}
	                } else {
	                	if (!json[metadata_type]) {
	                	    json[metadata_type] = [];
	                	} 
	                	json[metadata_type].push(rec.parent.parent.data.text+"."+rec.data.text); 	
	                } 
                } catch(e) {
                	//todo	
                }
            }
        });  
    } catch(e) {
        console.log(e);
        return [];
    }
    return json;
}

function resizeFilter() {
	$("#txtFilter").width($("#filter").width() - $("#search-btn").width() - $("#select-btn").width()  - 70);
}

function scrollToTop(selector) {
	$(selector).animate({ scrollTop: 0 }, 300);
}

function showElement(id) {
	$("#"+id).show();
}

function hideElement(id) {
	$("#"+id).hide();
}

function toggleRunningIndicator() {
	$(".running_indicator").toggle();
}

function showLoading(message) {
	$(".twipsy").height($(window).height());
	$(".twipsy").width($(window).width());
	$("#loading_message").html(message);
	
	$(".loading").show();
	
	$(".twipsy").show();
	$(".loading_message_wrapper").fadeIn(250);
}

function hideLoading() {
	$(".loading").hide();
	$(".twipsy").hide();
	$(".loading_message_wrapper").hide();
}

//window resizer and mover
function resizeAndCenterWindow() {
	resizeWindow();
	centerWindow();
} 

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

//window resizer and mover
function resizeAndCenterWindowByHeight(height) {
   	window.resizeTo(DEFAULT_WINDOW_WIDTH, height+160);
	try {
		$("#deploy_output").height(height);
	} catch(e) { }	
}

//window resizer and mover
function resizeAndCenterWindowSpecific(width, height) {
  window.resizeTo(width, height+160);
	try {
		$("#deploy_output").height(height);
	} catch(e) { }	
	window.moveTo((screen.width-width)/2,(screen.height-document.getElementById('wrapper').offsetHeight-(width+15))/2);
}

function resizeWindow() {
  window.resizeTo(DEFAULT_WINDOW_WIDTH, document.getElementById('wrapper').offsetHeight+72);
	try {
		$("#deploy_output").height(document.getElementById('wrapper').offsetHeight);
	} catch(e) { } 
}

function centerWindow() {
	window.moveTo((screen.width-$(window).width())/2,(screen.height-$(window).height())/2-190);
}   

//if dom elements is removed, we need to resize the window
function resizeWindowOnDomElementRemoved() {
	$( "body" ).bind(
		"DOMNodeRemoved",
		function( event ) {
			if (event.target.id == "result_wrapper") {
				resizeWindow();
				$("#project_details_tab").click();
			}
		}
	);
}  

//submit form on enter
function submitFormOnEnter() {
	$('.content').bind('keyup', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		 if(code == 13) { //enter pressed
			$('#btnSubmit').click();
		 }
	}); 
} 

//gets tree content in json format
function getTree() {			
	if (tree !== undefined) {
		return getPackage();
	} else {
		return {
			"ApexClass": "*",
			"ApexComponent": "*",
			"ApexPage": "*",
			"ApexTrigger": "*",
			"StaticResource": "*"
		}
	}
}

function getLogLevelsJson() {
	var options = [];
	var logCategories = ['Db', 'Workflow', 'Validation', 'Callout', 'Apex_code', 'Apex_profiling'];
	for (var category in logCategories) {
		var logCategory = logCategories[category];
		var logLevel = $("#select-"+logCategory).val();
		if (logLevel !== '') {
			options.push({
				"category": logCategory,
				"level": logLevel
			});
		}
	}
	return options;
}

function getLogLevelsJsonTooling() {
	var options = []
	var logCategories = ['Database', 'System', 'Visualforce', 'Workflow', 'Validation', 'Callout', 'ApexCode', 'ApexProfiling']
	for (category in logCategories) {
		var logCategory = logCategories[category]
		var logLevel = $("#select-"+logCategory).val()
		if (logLevel != '') {
			options.push({
				"category": logCategory,
				"level": logLevel
			})
		} else {
			options.push({
				"category" 	: logCategory,
				"level" 	: 'INFO'
			})
		}
	}
	return options
}

function setUpAjaxErrorHandling() {
	$.ajaxSetup({
    error: function(jqXHR, exception) {
      try {
      	errorMessage = ''
        if (jqXHR.status === 0) {
           	errorMessage = 'Not connected.\n Verify Network.'
        } else if (jqXHR.status == 404) {
            errorMessage = 'Requested page not found. [404]'
        } else if (jqXHR.status == 500) {
            errorMessage = 'Internal Server Error [500].'
        } else if (exception === 'parsererror') {
            errorMessage = 'Requested JSON parse failed.'
        } else if (exception === 'timeout') {
            errorMessage = 'Timeout error.'
        } else if (exception === 'abort') {
            errorMessage = 'Ajax request aborted.'
        } else {
            errorMessage = 'Uncaught Error.\n' + jqXHR.responseText
        }
        $("#error_message").html(errorMessage);
        hideLoading();
      } catch(e) {
      	console.log(e)
      }
    },
    timeout: 3600000
  });
}

var CHECK_STATUS_INTERVAL = 3000

function responseHandler(data) {
	console.log(data)
	try {
		var response = JSON.parse(data.responseText)
		checkRequestStatus(response["id"])
	} catch(e) {
		showGlobalError('The local MavensMate server did not respond properly. This likely means it is not running or it is malfunctioning. Try restarting your text editor and MavensMate.app.');
		hideLoading()
	}
}

function showGlobalError(message) {
	$("#global_message").html(message)
	$("#global_message_wrapper").show()
}

function hideGlobalError() {
	$("#global_message_wrapper").hide()
	$("#global_message").html('')
}

function showMessageWithCustomAction(message, mtype, button_label, script) {
	if (mtype === undefined) {
		mtype = 'error'
	}
	message += '<br/><a href="#" class="btn btn-info btn-embossed btn-wide" onclick="'+script+'">'+button_label+'</a>'
	$("#error_message").parent().attr('class', 'alert')
	$("#error_message").parent().addClass('alert-'+mtype)
	$("#error_message").html(message)
	$("#result_output").show()
	resizeElements()
}

function showMessage(message, mtype, showCloseButton) {
	if (mtype === undefined) {
		mtype = 'error'
	}
	if (showCloseButton === undefined) {
		showCloseButton = false
	}
	if (showCloseButton) {
		message += '<br/><a href="#" class="btn btn-info btn-embossed btn-wide" onclick="closeWindow()">Done</a>'
	}
	$("#error_message").parent().attr('class', 'alert')
	$("#error_message").parent().addClass('alert-'+mtype)
	$("#error_message").html(message)
	$("#result_output").show()
	resizeElements()
}

function hideMessage(message) {
	$("#error_message").html('')
	$("#result_output").hide()
	resizeElements()
}

function resizeArcade(offset) {
	if (offset === undefined) {
		offset = 370
	}
	$(".flash_game").css("width", $(".tab-content").width() - 45)
	$(".flash_game").css("height", $(window).height() - offset)
}

function resizeElements() {
    if ($("#result_output").css('display') !== 'none') {
		  $("#main-tab-content").height($(window).height() - $(".navbar").height() - $("#result_output").height() - $(".footer").height() - 220)
    } else {
      $("#main-tab-content").height($(window).height() - $(".navbar").height() - $(".footer").height() - 200)
    }
}

function resizeProjectWrapper(offset) {
	if (offset === undefined) {
		offset = 90;
	}
	$("#project_wrapper").height($("#main-tab-content").height() - offset);
}

function expandAll() {
	tree.expandAll()
}

function collapseAll() {
	tree.collapseAll()
}

$.expr[':'].Contains = function(a, i, m) {
	return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};