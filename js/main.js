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
		json = response;
		$article.renderJSON(response);

		$('.renderjson-scalar', $article).each(function( key, el ) {
			htmlToMarkdown(key, el);
			stylise(el);
		});

		$('textarea').elastic();
	},

	stylise = function ( el ) {
		$(el).attr('class', 'col-xs-5 value')
			.prev().attr('class', 'col-xs-2 key')
			.parent().attr('class', 'row');
	},

	htmlToMarkdown = function ( i, el ) {
		var txt = el.value;

		if ( htmlPattern.test(txt) ) {
			var md = HTML2Markdown(txt);
			$article.find('[title=\''+el.title+'\']').val(md);
		}
	},

	storeCurrent = function ( ev ) {
		ev.stopPropagation();
		currentValue = ev.currentTarget.value;
	},

	checkEdit = function ( ev ) {
		if ( currentValue !== ev.currentTarget.value ){
			$(ev.currentTarget).addClass('modified').data('original', currentValue);

			renderPreview(ev.currentTarget);
		}
	},

	renderPreview = function ( el ) {
		var html = markdown.toHTML(el.value);

		if ( !el.$preview) {
			el.$preview = $('<div class="preview col-xs-5"/>').insertAfter(el);
		}

		// TODO: make this test more foolproof
		// if ( html.split('<p>').length-1 === 1 )
		// 	html = html.replace(/[\<p\>|\<\/p\>]/gi, '');

		el.$preview.html(html);
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
				newValue = el.$preview.val();

			changeProperty(json, node, newValue);
		}).removeClass('modified');

		$.post('/save.php', saveObj, function ( response ){
			json = saveObj;
			window.open(response)
		});
	};

	$.get(file, render);

	$article.on('focus', '.value', storeCurrent);
	$article.on('blur', '.value', checkEdit);

	$('#reset').on('click', reset);
	$('#save').on('click', save);

})();