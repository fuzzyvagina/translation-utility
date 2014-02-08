(function() {

	'use strict';

	var file = 'locales/nl_nl.json',
		$article = $('article'),
		htmlPattern = /<[a-z][\s\S]*>/i,
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
		$article.renderJSON(response);

		$('.renderjson-scalar', $article).each(function( key, el ) {
			htmlToMarkdown(key, el);
			stylise(el);
		});

		// $('textarea').autoResize();

$('textarea').elastic();

	},

	stylise = function ( el ) {
		$(el).attr('class', 'col-xs-9 value')
			.prev().attr('class', 'col-xs-3 key')
			.parent().attr('class', 'row');
	},

	htmlToMarkdown = function ( i, el ) {
		var txt = el.value,
			md;

		if ( !htmlPattern.test(txt) ) return;

		md = toMarkdown(txt);

		$article.find('[title=\''+el.title+'\']').val(md);
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
				filename: filename.replace(/\.[^/.]+$/, ''),
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

	// $article.on('focus', '.value', storeCurrent);
	// $article.on('blur', '.value', checkEdit);
	// $article.on('click', '.key', throwFocus);

	// $('#reset').on('click', reset);
	// $('#save').on('click', save);

})();