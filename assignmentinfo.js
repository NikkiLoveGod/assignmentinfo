/**
* Example Plugin - Show how you can use the plugin engine
* NOTE: Do NOT set global values outside of the plugin object
*    Maybe they will conflict with other addons or any in-page related variables
*    Only use the plugin cache/storage to set/get variables
*
* @author BrainFooLong
* @version 1.0
* @url http://getbblog.com
*/

// initialize your plugin
BBLog.handle("add.plugin", {

    /**
    * The unique, lowercase id of my plugin
    * Allowed chars: 0-9, a-z, -
    */
    id : "assignmentinfo",

    /**
    * The name of my plugin, used to show config values in bblog options
    * Could also be translated with the translation key "plugin.name" (optional)
    *
    * @type String
    */
    name : "Assignment Info",

    /**
    * Some translations for this plugins
    * For every config flag must exist a corresponding EN translation
    *   otherwise the plugin will no be loaded
    *
    * @type Object
    */
    translations : {
        "en" : {
            'Clear': 'Press to clear assignment storage'
        },
    },

    /**
    * Config flags, added to the BBLog Options Container
    * Config flags are served as integer, 1 or 0
    * Every flag must be a array with following keys,
    *   first key[0]: is the config flag name
    *   second key[1]: is the default value that is initially setted, when the plugin is loading the first time, 1 or 0
    *   third key[2]: (optional) must be a function, this turns the config entry into a
    *     button and the handler will be executed when the user click on it (like plugins, themes, radar, etc..)
    */
    configFlags : [
    	["Clear", 0, function(instance){
    	    instance.clearAssignmentStorage(instance);
    	}],
    ],

    /**
    * A handler that be fired immediately (only once) after the plugin is loaded into bblog
    *
    * @param object instance The instance of your plugin which is the whole plugin object
    *    Always use "instance" to access any plugin related function, not use "this" because it's not working properly
    *    For example: If you add a new function to your addon, always pass the "instance" object
    */
    init : function(instance){
        // some log to the console to show you how the things work
        console.log('AssignmentInfo plugin loaded');
    },

    /**
    * A trigger that fires everytime when the dom is changing
    * This is how BBLog track Battlelog for any change, like url, content or anything
    *
    * @param object instance The instance of your plugin which is the whole plugin object
    *    Always use "instance" to access any plugin related function, not use "this" because it's not working properly
    *    For example: If you add a new function to your addon, always pass the "instance" object
    */
    domchange : function(instance){
    	$assignmentsContainer = $('.assignments-container');
    	$loadedIndicator = $('<span class="assignmentInfoLoaded"></span>');
    	loadedIndicatorFound = $assignmentsContainer.find('.assignmentInfoLoaded').length;

    	/**
    	 * Make sure we are in the assignments page
    	 */
    	if ( $assignmentsContainer.length > 0 && loadedIndicatorFound == 0) {

    		console.log('Assignment page found and its not yet advanced');
    		$assignmentsContainer.prepend($loadedIndicator);

    		name = instance.getOwnName( instance );
    		assignments = instance.getAssignments( instance, name );

    		$.each(assignments, function( assignmentId, assignment ) {
    			$('#' + assignmentId).prepend('<h3>' + assignment.name + '</h3>');
    		})

    	}
    },


    /**
     * Gets your own name from dom
     */
    getOwnName : function ( instance ) {
        var name = $('.base-header-soldier-link').text().trim();
        return name;
    },

    /**
     * Get assignment data
     */
    getAssignments : function ( instance, name ) {

    	var assignments = instance.storage('assignments');

    	if ( assignments != null ) {
    		console.log('found in storage');
    		return assignments;
    	}

    	console.log('did not find in storage');
    	assignments = instance.fetchAssignments( instance, name );
    	instance.storage('assignments', assignments);
    	return assignments;
    },

    /**
     * Fetch assignment data from BF3stats
     */
    fetchAssignments : function ( instance, name ) {
		var assignments = {};

    	$.ajax({
			url: 'http://api.bf3stats.com/pc/player/',
			async: false,
			type: 'post',
			data: { 
				player: name, 
				opt: {
					assignments: true
				}
			},
			dataType: 'json'
		}).done( function( data ) {
			if ( data.stats == null ) {
				console.log('User not updated');
				return false;
			}

			/**
			 * Unwrap the hierarchy from assignments and store them as assignmentId : assignmentData type object in "assignments" var
			 */
			$.each(data.stats.assignments, function( groupId, assignmentGroup ) {
				$.each(assignmentGroup, function( assignmentId, assignment ) {
					assignments[assignmentId] = assignment;
				});
			});
		});

		return assignments;
    },

    /**
     * Clears the stored assignment info, forcing a new fetch on reload
     */
    clearAssignmentStorage : function ( instance ) {
    	instance.storage('assignments', null);
    	console.log('storage cleared');
    },

});