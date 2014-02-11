(function() {

	'use strict';

	var masterfile = 'locales/nl_nl.json',
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

			previewChanges(ev.currentTarget);
		}
	},

	previewChanges = function ( el ) {
		var html = marked(el.value);

		if ( !el.$preview) {
			el.$preview = $('<div class="preview col-xs-5"/>').insertAfter(el);
		}

		// if el has only one p tag remove it.
		if ( html.split('<p>').length-1 === 1 )
			html = html.replace(/(\<p\>|\<\/p\>)/gi, '');

		el.$preview.html(html);
	},

	upload = function ( ev ) {
		// console.log(ev.currentTarget.value);

		// loadFile(ev.currentTarget.value);
	},

	reset = function () {
		location.reload();
	},

	save = function () {
		var filename = masterfile.split('/').pop(),
			saveObj = {
				filename: filename.replace(/\.[^/.]+$/, ''),
				json: json
			}, modified;

		$(':focus').blur();

		$('.modified').each(function(key, el) {
			var node = el.title,
				newValue = el.$preview.val();

			changeProperty(json, node, newValue);
			modified = 1;
		}).removeClass('modified');

		if ( !modified ) return;

		$.post('/save.php', saveObj, function ( response ){
			json = saveObj;
			window.open(response);
		});
	},

	loadFile = function ( file ) {
		$.get(file, render);
	};

	loadFile(masterfile);

	$('#upload').fileupload({
		dataType: 'json',
		done: function (e, data) {
			console.log(e, data);
			$.each(data.result.files, function (index, file) {
				$('<p/>').text(file.name).appendTo(document.body);
			});
		}
	});


	marked.setOptions({
		renderer: new marked.Renderer(),
		gfm: false,
		breaks: true,
		sanitize: true,
		smartLists: true,
		smartypants: true
	});

	$article.on('focus', '.value', storeCurrent);
	$article.on('blur', '.value', checkEdit);

	$('#upload').on('change', upload);
	$('#reset').on('click', reset);
	$('#save').on('click', save);

})();