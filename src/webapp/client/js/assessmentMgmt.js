/*
assessmentTypeMgmt.js - Gradebook

Andrew Figueroa
Data Science & Systems Lab (DASSL), Western Connecticut State University


Modified by team DOS (Kyle Bella, Kenneth Kozlowski and Joseph Tether)
CS 305-71 @ WCSU
Last To Make Modification: Kyle Bella
Date of Last Revision: 12/2/2018


Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

This JavaScript file provides the client-side JS code that is used by the manageAssessments.html
page. The functionality provided includes accessing the REST API provided by the web
server component of the Gradebook webapp, along with providing interactivity for the
manageAssessments.html webpage.
*/

/*
This function gets the cookies set by the previous page
*/
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i<ca.length; i++)
  {
    var c = ca[i];
    while (c.charAt(0) == ' ')
    {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0)
    {
      if (cname === "dbInfo" || cname === "instInfo")
      {
        return JSON.parse(c.substring(name.length, c.length));
      }
      else {
        return c.substring(name.length, c.length);
      }
    }
  }
  return "";
}
/*
Set the global variables to the values of the cookies.
*/
var dbInfo = getCookie("dbInfo");
var instInfo = getCookie("instInfo");
var sectionID = getCookie("sectionID");
console.log(dbInfo);
console.log(instInfo);
console.log(sectionID);

/*
Keep the original assessment data so changing the fields is only permanent when
 user presses "Submit"
*/
var assessOrginInfo = {
	"basePoints":null, "extraCreditPoints":null, "assignedDate":null,
	"dueDate":null, "curve":null
};

$(document).ready(function() {

	$('select').material_select(); //load dropdown boxes

	$('#dbInfoBox').collapsible({
		onOpen: function() {
			$('#dbInfoArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#dbInfoArrow').html('keyboard_arrow_down');
		}
	});

	$('#attnOptionsBox').collapsible({
		onOpen: function() {
			$('#optionsArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#optionsArrow').html('keyboard_arrow_down');
		}
	});

	$('#btnAddAssessType').click(function() {
		var assessType = $('#typeInput').val();
		var assessWeight = $('#weightInput').val();
		var assessDescription = $('#descriptionInput').val();

          if(assessType == "" || assessWeight == "" || assessDescription == ""){
               showAlert('<p>One or more fields are empty</p>');
          }
          else{
               insertNewAssessType(dbInfo, sectionID, assessType, assessWeight, assessDescription);
		     // repopulate Assessment Types
		     popAssessmentTypes(dbInfo, sectionID);
          }
	});

	$('#assessmentTypeSelect').change(function() {
		var assessID = $('#assessmentTypeSelect').val();
    console.log(sectionID);
		popAssessmentItems(dbInfo, sectionID, assessID);
		$('#btnChangeAssessType').css('display', 'inline-block');
		$('#btnDeleteAssessType').css('display', 'inline-block');
	});

	$('#getFields').click(function() {
		$('#newItem').css('display', 'none');
		$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'inline');
	});

	$('#btnAddAssessItem').click(function() {
		var assessID = $('#assessmentTypeSelect').val();
		var basePoints = $('#basePointsInput').val();
		var extraPoints = $('#extraCreditPointsInput').val();
		var assignedDate = $('#assignedDateInput').val();
		var dueDate = $('#dueDateInput').val();

          if(assessID == "" || basePoints == "" || extraPoints == ""
                         || assignedDate == "" || dueDate == ""){
               showAlert("<p>One or more fields are empty</p>");
          }
          else{

		      insertNewAssessItem(dbInfo, assessID, basePoints, extraPoints, assignedDate, dueDate);
		      // repopulate Assessment Items
		      popAssessmentItems(dbInfo, sectionID, assessID);
           }
	});

	$('#btnCloseItemFields').click(function() {
		$('#newItem').css('display', 'inline');
		$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'none');
	});

	$('#btnChangeAssessType').click(function() {
		var assessID = $('#assessmentTypeSelect').val();
		var assessType = $('#typeInput').val();
		var assessWeight = $('#weightInput').val();
		var assessDescription = $('#descriptionInput').val();
          if(assessID == "" || assessType == "" || assessWeight == "" || assessDescription == ""){
               showAlert("<p>One or more fields are empty</p>");
          }
          else{
		     updateAssessType(dbInfo, assessID, assessType, assessWeight, assessDescription);
		     // repopulate Assessment Types
	          popAssessmentTypes(dbInfo, sectionID);
          }
	});

	$('#btnDeleteAssessType').click(function() {
		var assessType = $('#typeInput').val();
		var msg = '<h5>Confirm deletion of type: ' + assessType + '</h5>' +
				'<p>Deleting type ' + assessType + ' will also delete all its associated ' +
				'items.  Are you sure you want to delete it?</p>';
		$('#genericConfirmBody').html(msg);
		$('#msg-genericConfirm').modal('open');
	});

	$('#btnConfirm').click(function(event) {
		var assessID = $('#assessmentTypeSelect').val();
		deleteAssessType(dbInfo, assessID);
		popAssessmentTypes(dbInfo, sectionID);
		$('#typeInput').val(null);
		$('#weightInput').val(null);
		$('#description').val(null);
          window.location.reload();
	});

	$("#assessmentItemTable").on('click', "a[id^='getForUpdate']", function() {
		var tr = $(this).parent().parent();
		tr.find('#sequence').html('<a id="submitUpdate" class="waves-effect waves-light btn">Update</a>' +
															'<a id="submitDelete" class="waves-effect waves-light btn">Delete</a>' +
														  '<a id="closeFields" class="waves-effect waves-light btn">Close</a>');
		assessOrginInfo.basePoints = tr.find('#basepoint').html();
		tr.find('#basepoint').html('<input id="basePointsInput" value="' + assessOrginInfo.basePoints + '" type="text"/>' +
															 '<label for="basePointsInput">Base Points</label>');
		assessOrginInfo.extraCreditPoints = tr.find('#extrapoint').html();
		tr.find('#extrapoint').html('<input id="extraCreditPointsInput" value="' + assessOrginInfo.extraCreditPoints + '" type="text"/>' +
													 		 '<label for="extraCreditPointsInput">Extra Credit Points</label>');
		assessOrginInfo.assignedDate = tr.find('#assigned').html();
		tr.find('#assigned').html('<input id="assignedDateInput" value="' + assessOrginInfo.assignedDate + '" type="text"/>' +
													 		 '<label for="assignedDateInput">Date Assigned</label>');
		assessOrginInfo.dueDate = tr.find('#due').html();
		tr.find('#due').html('<input id="dueDateInput" value="' + assessOrginInfo.dueDate + '" type="text"/>' +
												 '<label for="dueDateInput">Date Due</label>');
		assessOrginInfo.curve = tr.find('#curve').html();
		tr.find('#curve').html('<input id="curveInput" value="' + assessOrginInfo.curve + '" type="text"/>' +
													 '<label for="curveInput">Curve</label>');
	});

	$('#assessmentItemTable').on('click', "a[id^='submitUpdate']", function() {
		var tr = $(this).parent().parent();
		var assessID = $('#assessmentTypeSelect').val();
		var sequenceInComponent = tr.prop('id');
		var basePoints = tr.find('#basePointsInput').val();
		var extraCreditPoints = tr.find('#extraCreditPointsInput').val();
		var assignedDate = tr.find('#assignedDateInput').val();
		var dueDate = tr.find('#dueDateInput').val();
		var curve = tr.find('#curveInput').val();
		updateAssessItem(dbInfo, assessID, sequenceInComponent, basePoints,
			extraCreditPoints, assignedDate, dueDate, curve);
		// repopulate Assessment Items
		popAssessmentItems(dbInfo, sectionID, assessID);
	});

	$('#assessmentItemTable').on('click', "a[id^='submitDelete']", function() {
		var tr = $(this).parent().parent();
		var assessID = $('#assessmentTypeSelect').val();
		var sequenceInComponent = tr.prop('id');
		deleteAssessItem(dbInfo, assessID, sequenceInComponent);

		popAssessmentItems(dbInfo, sectionID, assessID);
	});

	$('#assessmentItemTable').on('click', "a[id^='closeFields']", function() {
		var tr = $(this).parent().parent();
		tr.find('#sequence').html('<a id="getForUpdate" class="waves-effect waves-light btn">' + tr.prop('id') + '</a>');
		tr.find('#basepoint').html(assessOrginInfo.basePoints);
		tr.find('#extrapoint').html(assessOrginInfo.extraCreditPoints);
		tr.find('#assigned').html(assessOrginInfo.assignedDate);
		tr.find('#due').html(assessOrginInfo.dueDate);
		tr.find('#curve').html(assessOrginInfo.curve);
	});

	$('#btnLogout').click(function() {
		dbInfo = null;
		instInfo = null;
		setYears(null); //reset Attendance dropdowns

		//hide and reset profile
		$('#profile').css('display', 'none');
		$('#instName').html('');

		//show Login tab, hide Roster, Attendance, Grades, and Reports tabs
		$('#loginTab').css('display', 'inline');
		$('#rosterTab, #attnTab, #sectionTab, #assessTab, #gradesTab, #reportsTab').css('display', 'none');
		$('ul.tabs').tabs('select_tab', 'login');
	});
});

function showAlert(htmlContent) {
	$('#genericAlertBody').html(htmlContent);
	$('#msg-genericAlert').modal('open');
};

function popAssessmentTypes(connInfo, sectionid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('assessmentTypes', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessTypes = '';
			for (var i = 0; i < result.assessTypes.length; i++) {
				assessTypes += '<option value="' + result.assessTypes[i].componentID +
				 '">' + result.assessTypes[i].componenttype + '</option>';
			}
			setAssessmentTypes(assessTypes);
		},
		error: function(result) {
			if (result.responseText == '500 - No Assessment Types')
			{
				showAlert('<p>No assessment types exist for this section</p>');
			}
			else
			{
				showAlert('<p>Error while retrieving assessment types</p>');
			}
			console.log(result);
		}
	});
};

function popAssessmentItems(connInfo, sectionid, assessid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid});
	$.ajax('assessmentItems', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			$('#typeInput').val(result.assessType);
			$('#weightInput').val(result.assessWeight);
			$('#descriptionInput').val(result.assessDescription);
			setAssessmentItems(result.assessItemTable);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving assessment items</p>');
			console.log(result);
			setAssessmentItems(null);
		}
	});
};

function setAssessmentTypes(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose an assessment type</option>' + htmlText;
	$('#assessmentTypeSelect').html(content);
	$('#assessmentTypeSelect').prop('disabled', htmlText == null);
	$('#assessmentTypeSelect').material_select(); //reload dropdown

	setAssessmentItems(null); //reset dependent fields
};

function setAssessmentItems(htmlText) {
	console.log(htmlText);
	if (htmlText == null) {
		$('#newItem').css('display', 'none');
		$('#assessmentItemTable').html('');
		$('#btnChangeAssessType').css('display', 'none');
		$('#btnDeleteAssessType').css('display', 'none');
	}
	else {
		$('#assessmentItemTable').html(htmlText);
		$('#newItem').css('display', 'inline');
	}
	$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'none');
};

function insertNewAssessType(connInfo, sectionid, componenttype, weight, description) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, componenttype:componenttype, weight:weight, description:description});
	$.ajax('assessmentTypesInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
               showAlert("<p>Sucessfully added the assessment type</p>");
			console.log(result.rowCount + " rows added");
		},
		error: function(result) {
               showAlert("<p>Error adding the assessment type</p>");
			console.log(result);
		}

	});
};

function insertNewAssessItem(connInfo, assessid, basePoints, extraCreditPoints,
														 assignedDate, dueDate) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, basePoints:basePoints,
		extraCreditPoints:extraCreditPoints, assignedDate:assignedDate, dueDate:dueDate});
	$.ajax('assessmentItemsInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows added");
		},
		error: function(result) {
			showAlert('<p>Error while inserting assessment item</p>');
			console.log(result);
		}
	});
};

function updateAssessType(connInfo, assessid, componenttype, weight, description) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, componenttype:componenttype, weight:weight, description:description});
	console.log(assessid);
	$.ajax('assessmentTypesUpdate', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
               showAlert('<p>Sucessfully updated assessment type</p>');
			console.log(result.rowCount + " rows updated");
		},
		error: function(result) {
			showAlert('<p>Error while updating assessment type</p>');
			console.log(result);
		}
	});
};

function updateAssessItem(connInfo, assessid, sequenceincomponent, basepoints, extracreditpoints,
														 assigneddate, duedate, curve) {
  var urlParams = $.extend({}, connInfo, {assessid:assessid,
		sequenceincomponent:sequenceincomponent, basepoints:basepoints,
		extracreditpoints:extracreditpoints, assigneddate:assigneddate,
		duedate:duedate, curve:curve});
	$.ajax('assessmentItemsUpdate', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows updated");
		},
		error: function(result) {
			showAlert('<p>Error while updating assessment item</p>');
			console.log(result);
		}
	});
};

function deleteAssessType(connInfo, assessid)
{
	var urlParams = $.extend({}, connInfo, {assessid:assessid});
	$.ajax('assessmentTypesDelete', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows deleted");
		},
		error: function(result) {
			showAlert('<p>Error while deleting assessment type</p>');
			console.log(result);
		}
	});
};

function deleteAssessItem(connInfo, assessid, sequenceincomponent) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, sequenceincomponent:sequenceincomponent});
	$.ajax('assessmentItemsDelete', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows deleted");
		},
		error: function(result) {
			showAlert('<p>Error while deleting assessment item</p>');
			console.log(result);
		}
	});
};

popAssessmentTypes(dbInfo, sectionID);
