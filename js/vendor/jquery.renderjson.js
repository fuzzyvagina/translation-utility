/**
 * RenderJSON plugin for jQuery
 * Quick HTML visualisation of JSON data
 * github.com/marekweb/jquery-renderjson
 */
(function($) {

	/**
	 * Renders the given JSON argument as HTML. Recursive for arrays and mapping objects.
	 * @param obj JSON data
	 * @param path Base path to use for building paths to elements (displayed in title attribute)
	 */
	function renderJSON(obj, path) {
		path = path || 'root';
		var objElem = $('<div class="renderjson-value" title="' + path + '">');
		var elem = $('<textarea class="renderjson-value" title="' + path + '">');

		if (obj instanceof Array) {
			objElem.addClass('renderjson-array');
			for (var i = 0; i < obj.length; i++) {
				var pairElem = $('<div class="renderjson-pair">').appendTo(objElem);
				// $('<div class="renderjson-key">' + i + '</div>').appendTo(pairElem);
				renderJSON(obj[i], path + "[" + i + "]").appendTo(pairElem);
				elem = objElem;
			}
		} else if (typeof obj == 'string') {
			elem.addClass('renderjson-scalar renderjson-string').text(obj);

		} else if (typeof obj == 'number') {
			elem.addClass('renderjson-scalar renderjson-number').text(obj);

		} else if (typeof obj == 'boolean') {
			elem.addClass('renderjson-scalar renderjson-boolean').text(obj);

		} else if (obj === null) {
			elem.addClass('renderjson-scalar renderjson-null').text('null');

		} else {
			// Object
			objElem.addClass('renderjson-object');
			for (var key in obj) {

				if (obj.hasOwnProperty(key)) {
					var pairElem = $('<div class="renderjson-pair">').appendTo(objElem);
					$('<div class="renderjson-key">' + key.replace(/_/g, ' ') + '</div>').appendTo(pairElem);
					renderJSON(obj[key], path + '[&quot;' + key + '&quot;]').appendTo(pairElem);
				}
			}
			elem = objElem;
		}

		return elem;
	}

	/**
	 * Render the given JSON data as HTML inserted into the calling jQuery element.
	 * @param obj JSON data
	 */
	$.fn.renderJSON = function(obj) {
		return this.append(renderJSON(obj)).addClass('renderjson-container');
	};
})(jQuery);