(function() {

	'use strict';

	var file = 'translations/nl_nl.json',
		json, currentValue,

	changeProperty = function ( obj, strProp, newValue ) {
	    var re = /\["?([^"\]]+)"?\]/g,
	        m, p;

	    while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
	        obj = obj[p];

	    if (p)
	        obj[p] = newValue;
	},

	render = function ( response ) {
		$('article').renderJSON(response);

		$('.renderjson-scalar').each(stylise);

		$('.value').on({
			focus: storeCurrent,
			blur: checkEdit
		});

		$('.key').on('click', throwFocus);

		$('article > .renderjson-value > .renderjson-pair > .renderjson-key').click(function ( ev ) {
			$(ev.currentTarget).next().toggle();
		});
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

		if ( currentValue !== newValue ){
			$(ev.currentTarget).addClass('modified').data('original', currentValue);
		}
	},

	throwFocus = function ( ev ) {
		$(ev.currentTarget).next().focus();
	},

	reset = function () {
		location.reload();
	},

	save = function () {
		var filename = file.split('/').pop(),
			saveObj = {
				filename: filename.replace(/\.[^/.]+$/, ""),
				json: json
			};

		$(':focus').blur();

		$('.modified').each(function(key, el) {
			var node = el.title,
				newValue = $(el).html();

			changeProperty(json, node, newValue);
		}).removeClass('modified');

		$.post('/save.php', saveObj, function ( response ){
			console.log(response)
		});
	};


	$.get(file, render);

	$('#reset').on('click', reset);

	$('#save').on('click', save);

})();