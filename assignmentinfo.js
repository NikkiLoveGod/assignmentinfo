/**
 * Assignment Info - simple plugin for better battlelog.
 * It puts up assignment names as small headers on top of assignment images
 * in the assignment pages allowing the user to ctrl+f through them.
 *
 * @author Sami "NLG" Kurvinen
 * @version 0.1
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

    configFlags : [

        /**
         * Clear configflag makes a button to the plugin configs that will
         * clear the storage (cache) of assignment info and force refetching them
         */
    	["Clear", 0, function(instance){
    	    instance.clearAssignmentStorage(instance);
    	}],
    ],

    /**
    * Run on every refresh, but just once. 
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
        $progressBars = $assignmentsContainer.find('.progress_bar');

    	/**
    	 * Make sure we are in the assignments page
    	 */
    	if ( $assignmentsContainer.length > 0 && loadedIndicatorFound == 0 && $progressBars.length > 0) {

            /**
             * Put up a dom element that we can search, and indicate if we have actually gone
             * through the assignment process and it has not been resetted.
             */
    		$assignmentsContainer.prepend($loadedIndicator);

            /**
             * Get your assignments. In this case we dont really use other than the assignment names
             */
    		name = instance.getTargetName( instance );
    		assignments = instance.getAssignments( instance, name );

            console.log(assignments);

            /**
             * Go through the assignments and put up the header dom
             */
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
     * Gets the active user's name that you're browsing assignments for
     */
    getTargetName : function ( instance ) {
        var name = $('.profile-venicestats-header-soldier-info-name > span').text();
        return name;
    },

    /**
     * Get assignment data from cache if it's available, 
     * and if it isn't, refetch it, cache it to the permanent storage
     * and return it.
     */
    getAssignments : function ( instance, name ) {
        var assignmentsStorage = {};
    	var assignmentsStorage = instance.storage('assignments');

    	if ( assignmentsStorage != null && assignmentsStorage[name] != null  ) {
    		console.log('found in storage');
    		return assignmentsStorage[name];
    	}

        if ( assignmentsStorage == null ) {
            assignmentsStorage = {};
        }

    	assignments = instance.fetchAssignments( instance, name );
        assignmentsStorage[name] = assignments;
    	instance.storage('assignments', assignmentsStorage);
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
                    clear: true,
					assignments: true,
                    assignmentsName: true                    
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
             * Also put up the assignment completion % in the object as well.
 			 */
			$.each(data.stats.assignments, function( groupId, assignmentGroup ) {
				$.each(assignmentGroup, function( assignmentId, assignment ) {
                    assignment.completion = instance.getAssignmentCompletion( instance, assignment );
					assignments[assignmentId] = assignment;
				});
			});
		});

		return assignments;
    },

    /**
     * Counts the percentage of assignment completion on a given assignment object
     */
    getAssignmentCompletion : function ( instance, assignment ) {
        var sum = 0;
        var completion = 0;

        $.each(assignment.criteria, function ( k, criteria ) {
            sum += criteria.curr / criteria.needed;
        })
        completion = Math.round(sum / assignment.criteria.length * 100) / 100;
        return completion;
    },

    /**
     * Clears the stored assignment info, forcing a new fetch on reload
     */
    clearAssignmentStorage : function ( instance ) {
    	instance.storage('assignments', null);
    	console.log('storage cleared');
    },

});