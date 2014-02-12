(function() {

	'use strict';

	var masterfile = 'locales/master.json',
		$article = $('article'),
		htmlPattern = /<[a-z][\s\S]*>/i,
		json, currentValue,

	render = function ( obj ) {
		json = obj;
		$article.empty().renderJSON(obj);

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
		currentValue = ev.currentTarget.value.trim();
	},

	checkEdit = function ( ev ) {
		ev.currentTarget.value = ev.currentTarget.value.trim();
		console.log( ev.currentTarget.value.trim().length);

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
			html = html.replace(/(\<p\>|\<\/p\>)/gi, '').replace(/(\r\n|\n|\r)/gm,'');

		el.$preview.html(html);
	},

	mergeObj = function (a, b) {
		for (var key in b) {
			if (key in a) {
				a[key] = typeof a[key] === 'object' &&
						typeof b[key] === 'object' ? mergeObj(a[key], b[key]) : b[key];
			}
		}
		return a;
	},

	uploadFile = function ( ev ) {
		var file = this.files[0],
			fd = new FormData(),
			xhr;

		fd.append('uploadfile', file);

		xhr = new XMLHttpRequest();
		xhr.open('POST', 'upload.php', true);

		xhr.onload = function() {
			if (this.status == 200) {
				var response;
				try {
					response = JSON.parse(this.response);

				} catch(error) {
					alert('Your file is not correctly formatted');
				}

				if ( response ) {
					var obj;

					if ( ev.currentTarget.name === 'master' ){
						obj = response.dataObj
					} else {
						obj = mergeObj(jQuery.extend({}, json), response.dataObj);
					}

					render(obj);
				}
			}
		};

		xhr.send(fd);
	},

	reset = function () {
		location.reload();
	},

	// update value in json object to match what changed in editor
	changeJsonValue = function ( obj, strProp, newValue ) {
		var re = /\["?([^"\]]+)"?\]/g,
			m, p;

		while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
			obj = obj[p];

		if (p)
			obj[p] = newValue;
	},

	save = function () {
		var saveObj = {
				filename: json.code,
				json: json
			}, isModified;

		$(':focus').blur();

		$('.modified').each(function(key, el) {
			var node = el.title,
				newValue = el.$preview.html();

			changeJsonValue(json, node, newValue);
			isModified = 1;
		}).removeClass('modified');

		if ( !isModified ) return;

		$.post('save.php', saveObj, function ( response ){
			json = saveObj.json;
			window.open(response);
		});
	};

	// upload initial file
	// $.get(masterfile, render);


	// initialise markdown preview renderer
	marked.setOptions({
		renderer: new marked.Renderer(),
		gfm: false,
		breaks: true,
		sanitize: true,
		smartLists: true,
		smartypants: true
	});

	// set events
	$article.on('focus', '.value', storeCurrent);
	$article.on('blur', '.value', checkEdit);

	$('.uploadfile').on('change', uploadFile);
	$('#reset').on('click', reset);
	$('#save').on('click', save);



	// add support for old browsers
	if (typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		}
	}
})();