(function() {

	'use strict';

	var json, currentValue,

	changeProperty = function ( obj, strProp, newValue ) {
	    var re = /\["?([^"\]]+)"?\]/g,
	        m, p;

	    while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
	        obj = obj[p];

	    if (p)
	        obj[p] = newValue;
	},

	stylise = function ( key, el ) {
		$(el).attr('contenteditable', true).attr('class', 'col-xs-9 value')
			.prev().attr('class', 'col-xs-3 key')
			.parent().attr('class', 'row');
	},

	storeCurrent = function ( ev ) {
		ev.stopPropagation();
		currentValue = ev.currentTarget.innerHTML;
	},

	checkEdit = function ( ev ) {
		var newValue = ev.currentTarget.innerHTML;

		if ( currentValue !== newValue )
			$(ev.currentTarget).addClass('modified').data('original', currentValue);
	},

	throwFocus = function ( ev ) {
		$(ev.currentTarget).next().focus();
	};


	$.get('locales/nl_nl.json', function(response) {
		json = response;

		$('article').renderJSON(json);

		$('.renderjson-scalar').each(stylise);

		$('.value').on({
			focus: storeCurrent,
			blur: checkEdit
		});

		$('.key').on('click', throwFocus);

		$('article > .renderjson-value > .renderjson-pair > .renderjson-key').click(function ( ev ) {
			$(ev.currentTarget).next().toggle();
		});
	}.bind(this));


	$('#save').on('click', function() {

		$(':focus').blur();

		$('.modified').each(function(key, el) {
			var node = el.title,
				newValue = $(el).html();

			changeProperty(json, node, newValue);
		}).removeClass('modified');

		// TODO: save json to file
		// $.post('api/save', function ( response ){
		// 	console.log(response)
		// });
		console.log(json)

	});

})();